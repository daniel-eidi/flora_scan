
import React, { useRef } from 'react';
import { Camera, Upload, Image as ImageIcon } from 'lucide-react';

interface ImageInputProps {
  onImageSelected: (base64: string) => void;
  disabled?: boolean;
}

const ImageInput: React.FC<ImageInputProps> = ({ onImageSelected, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      console.info(`[ImageInput] arquivo: ${file.name || '(sem nome)'} ${file.type || '(sem mime)'} ${Math.round(file.size / 1024)} KB`);
      try {
        const resized = await resizeImage(file, 1280, 0.85);
        console.info(`[ImageInput] redimensionado para ~${Math.round((resized.length * 3) / 4 / 1024)} KB`);
        onImageSelected(resized);
      } catch (err) {
        console.error('[ImageInput] Falha ao processar imagem:', err);
        const msg = err instanceof Error ? err.message : 'erro desconhecido';
        alert(`Não consegui processar esta imagem (${msg}). Tente outra foto, em JPEG ou PNG.`);
      }
    }
    e.target.value = '';
  };

  const readFileAsDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error ?? new Error('FileReader falhou'));
      reader.readAsDataURL(file);
    });

  const loadImage = (src: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Imagem não pôde ser decodificada pelo navegador'));
      img.src = src;
    });

  const computeTargetSize = (w: number, h: number, max: number) => {
    if (w === 0 || h === 0) throw new Error('Dimensões inválidas');
    if (w <= max && h <= max) return { width: w, height: h };
    return w > h
      ? { width: max, height: Math.round((h * max) / w) }
      : { width: Math.round((w * max) / h), height: max };
  };

  const drawToJpeg = (
    source: HTMLImageElement | ImageBitmap,
    width: number,
    height: number,
    quality: number,
  ): string => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas indisponível');
    ctx.drawImage(source, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  };

  const resizeImage = async (file: File, maxDimension: number, quality: number): Promise<string> => {
    if (typeof createImageBitmap === 'function') {
      try {
        const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
        try {
          const { width, height } = computeTargetSize(bitmap.width, bitmap.height, maxDimension);
          return drawToJpeg(bitmap, width, height, quality);
        } finally {
          bitmap.close();
        }
      } catch (err) {
        console.warn('[ImageInput] createImageBitmap falhou, tentando fallback <img>:', err);
      }
    }

    const dataUrl = await readFileAsDataUrl(file);
    const img = await loadImage(dataUrl);
    const { width, height } = computeTargetSize(img.width, img.height, maxDimension);
    return drawToJpeg(img, width, height, quality);
  };

  return (
    <div className="flex gap-2 p-4 bg-white border-t border-gray-100 items-center justify-center">
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        ref={fileInputRef}
      />
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileChange}
        className="hidden"
        ref={cameraInputRef}
      />

      <button
        onClick={() => cameraInputRef.current?.click()}
        disabled={disabled}
        className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-full hover:bg-emerald-700 transition-colors disabled:opacity-50 font-medium shadow-md"
      >
        <Camera size={20} />
        <span>Câmera</span>
      </button>

      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={disabled}
        className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-emerald-600 text-emerald-600 rounded-full hover:bg-emerald-50 transition-colors disabled:opacity-50 font-medium shadow-sm"
      >
        <Upload size={20} />
        <span>Galeria</span>
      </button>
    </div>
  );
};

// Lucide icons defined locally if not imported
const CameraIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
);

const UploadIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);

export default ImageInput;
