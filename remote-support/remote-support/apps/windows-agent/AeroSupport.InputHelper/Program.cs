using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Text.Json;

internal static class Program
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };
    private const uint InputMouse = 0;
    private const uint InputKeyboard = 1;
    private const uint MouseMove = 0x0001;
    private const uint MouseLeftDown = 0x0002;
    private const uint MouseLeftUp = 0x0004;
    private const uint MouseRightDown = 0x0008;
    private const uint MouseRightUp = 0x0010;
    private const uint MouseWheel = 0x0800;
    private const uint MouseAbsolute = 0x8000;
    private const uint MouseVirtualDesk = 0x4000;
    private const uint KeyUp = 0x0002;

    private static readonly Dictionary<string, ushort> Keys = new(StringComparer.OrdinalIgnoreCase)
    {
        ["Enter"] = 0x0D, ["Tab"] = 0x09, ["Backspace"] = 0x08, ["Escape"] = 0x1B,
        ["Space"] = 0x20, ["ArrowLeft"] = 0x25, ["ArrowUp"] = 0x26,
        ["ArrowRight"] = 0x27, ["ArrowDown"] = 0x28, ["Delete"] = 0x2E,
        ["Home"] = 0x24, ["End"] = 0x23, ["PageUp"] = 0x21, ["PageDown"] = 0x22,
        ["ShiftLeft"] = 0x10, ["ShiftRight"] = 0x10, ["ControlLeft"] = 0x11,
        ["ControlRight"] = 0x11, ["AltLeft"] = 0x12, ["AltRight"] = 0x12,
        ["F1"] = 0x70, ["F2"] = 0x71, ["F3"] = 0x72, ["F4"] = 0x73,
        ["F5"] = 0x74, ["F6"] = 0x75, ["F7"] = 0x76, ["F8"] = 0x77,
        ["F9"] = 0x78, ["F10"] = 0x79, ["F11"] = 0x7A, ["F12"] = 0x7B
    };

    public static void Main()
    {
        string? line;
        while ((line = Console.ReadLine()) != null)
        {
            try
            {
                var command = JsonSerializer.Deserialize<Command>(line, JsonOptions);
                if (command == null) continue;
                Apply(command);
                Console.WriteLine("{\"ok\":true}");
            }
            catch
            {
                Console.WriteLine("{\"ok\":false}");
            }
        }
    }

    private static void Apply(Command command)
    {
        switch (command.Type)
        {
            case "move":
                Move(command.X, command.Y);
                break;
            case "button":
                MouseButton(command.Button, command.Down);
                break;
            case "wheel":
                SendMouse(0, 0, unchecked((uint)(command.Delta * 120)), MouseWheel);
                break;
            case "key":
                if (TryVirtualKey(command.Code, out var key)) SendKey(key, command.Down);
                break;
        }
    }

    private static bool TryVirtualKey(string? code, out ushort key)
    {
        key = 0;
        if (string.IsNullOrWhiteSpace(code)) return false;
        if (Keys.TryGetValue(code, out key)) return true;
        if (code.StartsWith("Key") && code.Length == 4)
        {
            key = char.ToUpperInvariant(code[3]);
            return key is >= 0x41 and <= 0x5A;
        }
        if (code.StartsWith("Digit") && code.Length == 6)
        {
            key = code[5];
            return key is >= 0x30 and <= 0x39;
        }
        return false;
    }

    private static void Move(double x, double y)
    {
        var normalizedX = (int)Math.Round(Math.Clamp(x, 0, 1) * 65535);
        var normalizedY = (int)Math.Round(Math.Clamp(y, 0, 1) * 65535);
        SendMouse(normalizedX, normalizedY, 0, MouseMove | MouseAbsolute | MouseVirtualDesk);
    }

    private static void MouseButton(int button, bool down)
    {
        var flag = button switch
        {
            0 => down ? MouseLeftDown : MouseLeftUp,
            2 => down ? MouseRightDown : MouseRightUp,
            _ => 0u
        };
        if (flag != 0) SendMouse(0, 0, 0, flag);
    }

    private static void SendMouse(int x, int y, uint data, uint flags)
    {
        var input = new INPUT
        {
            Type = InputMouse,
            Union = new InputUnion { Mouse = new MOUSEINPUT { Dx = x, Dy = y, MouseData = data, Flags = flags } }
        };
        SendInput(1, new[] { input }, Marshal.SizeOf<INPUT>());
    }

    private static void SendKey(ushort key, bool down)
    {
        var input = new INPUT
        {
            Type = InputKeyboard,
            Union = new InputUnion { Keyboard = new KEYBDINPUT { VirtualKey = key, Flags = down ? 0 : KeyUp } }
        };
        SendInput(1, new[] { input }, Marshal.SizeOf<INPUT>());
    }

    private sealed class Command
    {
        public string? Type { get; set; }
        public double X { get; set; }
        public double Y { get; set; }
        public int Button { get; set; }
        public bool Down { get; set; }
        public int Delta { get; set; }
        public string? Code { get; set; }
    }

    [StructLayout(LayoutKind.Sequential)]
    private struct INPUT { public uint Type; public InputUnion Union; }
    [StructLayout(LayoutKind.Explicit)]
    private struct InputUnion
    {
        [FieldOffset(0)] public MOUSEINPUT Mouse;
        [FieldOffset(0)] public KEYBDINPUT Keyboard;
    }
    [StructLayout(LayoutKind.Sequential)]
    private struct MOUSEINPUT
    {
        public int Dx; public int Dy; public uint MouseData; public uint Flags;
        public uint Time; public IntPtr ExtraInfo;
    }
    [StructLayout(LayoutKind.Sequential)]
    private struct KEYBDINPUT
    {
        public ushort VirtualKey; public ushort ScanCode; public uint Flags;
        public uint Time; public IntPtr ExtraInfo;
    }
    [DllImport("user32.dll", SetLastError = true)]
    private static extern uint SendInput(uint count, INPUT[] inputs, int size);
}
