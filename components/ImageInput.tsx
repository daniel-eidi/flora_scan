
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
      console.info(`[ImageInput] arquivo: ${file.name} ${file.type} ${Math.round(file.size / 1024)} KB`);
      try {
        const resized = await resizeImage(file, 1280, 0.85);
        console.info(`[ImageInput] redimensionado para ~${Math.round((resized.length * 3) / 4 / 1024)} KB`);
        onImageSelected(resized);
      } catch (err) {
        console.error('[ImageInput] Falha ao redimensionar, enviando original:', err);
        const reader = new FileReader();
        reader.onloadend = () => onImageSelected(reader.result as string);
        reader.readAsDataURL(file);
      }
    }
    e.target.value = '';
  };

  const resizeImage = (file: File, maxDimension: number, quality: number): Promise<string> => {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        URL.revokeObjectURL(url);
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas indisponível'));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Falha ao carregar imagem'));
      };
      img.src = url;
    });
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
