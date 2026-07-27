// Re-encodes an uploaded image as JPEG, downscaling/compressing large
// files so uploads stay well under the 2MB backend limit. Ported from the
// design prototype's attachThumb() canvas logic.
export function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
      img.onload = () => {
        const needCompress = file.size > 2097152;
        const maxDim = needCompress ? 900 : 1600;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          const r = Math.min(maxDim / w, maxDim / h);
          w = Math.round(w * r);
          h = Math.round(h * r);
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, w, h);
        let q = needCompress ? 0.8 : 0.92;
        const tryEncode = () => {
          canvas.toBlob(
            (blob) => {
              if (!blob) return reject(new Error('画像の変換に失敗しました'));
              if (needCompress && blob.size > 2097152 && q > 0.3) {
                q -= 0.1;
                tryEncode();
              } else {
                resolve(blob);
              }
            },
            'image/jpeg',
            q
          );
        };
        tryEncode();
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function readAsDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
