export interface PickResult {
  uri: string;
  base64: string | null;
  mediaType: 'image/jpeg' | 'image/png';
}

function pickFile(capture?: string): Promise<PickResult | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    if (capture) (input as any).capture = capture;

    let resolved = false;

    function onWindowFocus() {
      setTimeout(() => {
        if (!resolved && (!input.files || input.files.length === 0)) {
          resolved = true;
          resolve(null);
        }
      }, 300);
    }

    input.onchange = () => {
      resolved = true;
      window.removeEventListener('focus', onWindowFocus);
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }

      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(',')[1] ?? null;
        const mediaType: 'image/jpeg' | 'image/png' = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
        resolve({ uri: dataUrl, base64, mediaType });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    };

    window.addEventListener('focus', onWindowFocus, { once: true });
    input.click();
  });
}

export async function pickFromLibrary(): Promise<PickResult | null> {
  return pickFile();
}

export async function pickFromCamera(): Promise<PickResult | null> {
  return pickFile('environment');
}
