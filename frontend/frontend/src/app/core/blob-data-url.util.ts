/** Converte Blob em data URL para uso em `<img src>` após fetch autenticado. */
export function readBlobAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('blob-data-url-failed'));
    reader.readAsDataURL(blob);
  });
}
