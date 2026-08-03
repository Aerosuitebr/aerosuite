# Aero Suite Print Bridge — envia PPLB/RAW para impressora Windows (Elgin L42 etc.)
# Escuta em http://127.0.0.1:19428 (somente localhost)

$ErrorActionPreference = 'Stop'
$BridgeVersion = '1.0.0'
$DefaultPort = 19428

$InstallDir = if ($env:AERO_PRINT_BRIDGE_DIR) { $env:AERO_PRINT_BRIDGE_DIR } else {
  Join-Path $env:LOCALAPPDATA 'AeroSuite\PrintBridge'
}
$ConfigPath = Join-Path $InstallDir 'config.json'

function Get-BridgeConfig {
  if (Test-Path $ConfigPath) {
    try {
      return Get-Content $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
    } catch {
      Write-Warning "config.json invalido: $_"
    }
  }
  return [pscustomobject]@{
    port         = $DefaultPort
    printerName  = 'ELGIN L42PRO FULL'
  }
}

function Save-BridgeConfig($cfg) {
  if (-not (Test-Path $InstallDir)) {
    New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
  }
  $cfg | ConvertTo-Json | Set-Content -Path $ConfigPath -Encoding UTF8
}

function Ensure-AeroRawPrinterType {
  if ('AeroRawPrinter' -as [type]) { return }
  Add-Type @'
using System;
using System.Runtime.InteropServices;
public class AeroRawPrinter {
  [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
  public class DOCINFOA {
    [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
    [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
    [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
  }
  [DllImport("winspool.drv", SetLastError=true, CharSet=CharSet.Ansi)]
  public static extern bool OpenPrinter(string szPrinter, out IntPtr hPrinter, IntPtr pd);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool ClosePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true, CharSet=CharSet.Ansi)]
  public static extern bool StartDocPrinter(IntPtr hPrinter, int level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool EndDocPrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool StartPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool EndPagePrinter(IntPtr hPrinter);
  [DllImport("winspool.drv", SetLastError=true)]
  public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, int dwCount, out int dwWritten);
  public static string Send(string name, byte[] bytes) {
    IntPtr h;
    if (!OpenPrinter(name, out h, IntPtr.Zero)) return "OpenPrinter:" + Marshal.GetLastWin32Error();
    var di = new DOCINFOA { pDocName = "AeroSuite-PPLB", pDataType = "RAW" };
    if (!StartDocPrinter(h, 1, di)) { ClosePrinter(h); return "StartDoc:" + Marshal.GetLastWin32Error(); }
    if (!StartPagePrinter(h)) { EndDocPrinter(h); ClosePrinter(h); return "StartPage:" + Marshal.GetLastWin32Error(); }
    IntPtr p = Marshal.AllocCoTaskMem(bytes.Length);
    Marshal.Copy(bytes, 0, p, bytes.Length);
    int written;
    bool ok = WritePrinter(h, p, bytes.Length, out written);
    int err = Marshal.GetLastWin32Error();
    Marshal.FreeCoTaskMem(p);
    EndPagePrinter(h); EndDocPrinter(h); ClosePrinter(h);
    if (!ok) return "WritePrinter:" + err;
    if (written != bytes.Length) return "partial:" + written + "/" + bytes.Length;
    return null;
  }
}
'@
}

function Send-RawToPrinter {
  param(
    [string]$PrinterName,
    [byte[]]$Bytes
  )
  Ensure-AeroRawPrinterType
  $err = [AeroRawPrinter]::Send($PrinterName, $Bytes)
  if ($err) { throw $err }
}

function Write-HttpResponse {
  param(
    $Context,
    [int]$StatusCode = 200,
    [string]$ContentType = 'application/json; charset=utf-8',
    [string]$Body = '{}',
    [hashtable]$ExtraHeaders = @{}
  )
  $bytes = [System.Text.Encoding]::UTF8.GetBytes($Body)
  $response = $Context.Response
  $response.StatusCode = $StatusCode
  $response.ContentType = $ContentType
  $response.Headers.Add('Access-Control-Allow-Origin', '*')
  $response.Headers.Add('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  $response.Headers.Add('Access-Control-Allow-Headers', 'Content-Type')
  foreach ($k in $ExtraHeaders.Keys) {
    $response.Headers[$k] = $ExtraHeaders[$k]
  }
  $response.ContentLength64 = $bytes.Length
  $response.OutputStream.Write($bytes, 0, $bytes.Length)
  $response.OutputStream.Close()
}

function Handle-Request {
  param($Context, $Cfg)
  $request = $Context.Request
  $path = $request.Url.AbsolutePath.TrimEnd('/')
  if ([string]::IsNullOrEmpty($path)) { $path = '/' }

  if ($request.HttpMethod -eq 'OPTIONS') {
    Write-HttpResponse -Context $Context -StatusCode 204 -Body ''
    return
  }

  if ($path -eq '/health' -and $request.HttpMethod -eq 'GET') {
    $body = (@{
      ok      = $true
      version = $BridgeVersion
      printer = $Cfg.printerName
    } | ConvertTo-Json -Compress)
    Write-HttpResponse -Context $Context -Body $body
    return
  }

  if ($path -eq '/printers' -and $request.HttpMethod -eq 'GET') {
    $names = @(Get-Printer | ForEach-Object { $_.Name })
    $body = (@{ printers = $names } | ConvertTo-Json -Compress)
    Write-HttpResponse -Context $Context -Body $body
    return
  }

  if ($path -eq '/print' -and $request.HttpMethod -eq 'POST') {
    $reader = New-Object System.IO.StreamReader($request.InputStream, $request.ContentEncoding)
    $rawJson = $reader.ReadToEnd()
    $reader.Close()
    try {
      $payload = $rawJson | ConvertFrom-Json
    } catch {
      Write-HttpResponse -Context $Context -StatusCode 400 -Body (@{ error = 'JSON invalido' } | ConvertTo-Json -Compress)
      return
    }
    $content = [string]$payload.content
    if ([string]::IsNullOrWhiteSpace($content)) {
      Write-HttpResponse -Context $Context -StatusCode 400 -Body (@{ error = 'content vazio' } | ConvertTo-Json -Compress)
      return
    }
    $printer = [string]$payload.printer
    if ([string]::IsNullOrWhiteSpace($printer)) { $printer = [string]$Cfg.printerName }
    try {
      $bytes = [System.Text.Encoding]::UTF8.GetBytes($content)
      Send-RawToPrinter -PrinterName $printer -Bytes $bytes
      Write-HttpResponse -Context $Context -Body (@{ ok = $true; bytes = $bytes.Length } | ConvertTo-Json -Compress)
    } catch {
      Write-HttpResponse -Context $Context -StatusCode 500 -Body (@{ error = $_.Exception.Message } | ConvertTo-Json -Compress)
    }
    return
  }

  Write-HttpResponse -Context $Context -StatusCode 404 -Body (@{ error = 'not found' } | ConvertTo-Json -Compress)
}

$cfg = Get-BridgeConfig
$port = [int]($cfg.port)
if ($port -le 0) { $port = $DefaultPort }

$listener = New-Object System.Net.HttpListener
$prefix = "http://127.0.0.1:$port/"
$listener.Prefixes.Add($prefix)

try {
  $listener.Start()
} catch {
  Write-Error "Nao foi possivel iniciar em $prefix. Erro: $_"
}

$logPath = Join-Path $InstallDir 'bridge.log'
"$(Get-Date -Format o) Aero Print Bridge $BridgeVersion em $prefix impressora=$($cfg.printerName)" | Out-File -FilePath $logPath -Append -Encoding utf8

while ($listener.IsListening) {
  try {
    $context = $listener.GetContext()
    Handle-Request -Context $context -Cfg $cfg
  } catch {
    "$(Get-Date -Format o) ERRO $_" | Out-File -FilePath $logPath -Append -Encoding utf8
  }
}
