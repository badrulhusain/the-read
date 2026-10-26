import { useRef, useState } from 'react';
import { ImagePlus, Loader2, Trash2, UploadCloud, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { apiMessage } from '@/lib/api';
import { uploadService } from '@/services/upload.service';
import type { UploadImageResponse, UploadImageType } from '@/types/blog';

interface ImageUploadProps {
  type: UploadImageType;
  value?: string | null;
  publicId?: string | null;
  onChange: (value: { url: string; publicId: string } | null) => void;
  onUploadingChange?: (uploading: boolean) => void;
  disabled?: boolean;
  label?: string;
  helperText?: string;
}

const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
const maxBytesByType: Record<UploadImageType, number> = {
  BLOG_COVER: 2 * 1024 * 1024,
  PROFILE_IMAGE: 2 * 1024 * 1024,
};

export function ImageUpload({
  type,
  value,
  onChange,
  onUploadingChange,
  disabled = false,
  label = 'Image',
  helperText,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');

  const maxSize = maxBytesByType[type];
  const help = helperText ?? `${type === 'BLOG_COVER' ? 'Recommended size: 1200 x 675 px. Maximum size: 2 MB.' : 'Max 2MB.'} Supported formats: JPG, PNG, WEBP.`;

  async function handleFile(file: File | undefined) {
    setError('');
    if (!file || disabled || uploading) return;
    const validation = validateFile(file, maxSize);
    if (validation) {
      setError(validation);
      toast.error(validation);
      return;
    }

    if (type === 'BLOG_COVER') {
      const dimensionError = await validateImageDimensions(file);
      if (dimensionError) {
        setError(dimensionError);
        toast.error(dimensionError);
        return;
      }
    }

    setUploading(true);
    onUploadingChange?.(true);
    setProgress(0);
    try {
      const response: UploadImageResponse = await uploadService.uploadImage(file, type, { onProgress: setProgress });
      onChange({ url: response.url, publicId: response.publicId });
      toast.success('Image uploaded.');
    } catch (uploadError) {
      const message = apiMessage(uploadError, 'Could not upload image.');
      setError(message);
      toast.error(message);
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      setProgress(0);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#5c4b3d]">{label}</p>
          <p className="text-xs leading-5 text-[#74685f]">{help}</p>
        </div>
        {value && (
          <Button type="button" size="sm" variant="ghost" disabled={disabled || uploading} onClick={() => onChange(null)}>
            <X className="h-4 w-4" /> Remove
          </Button>
        )}
      </div>
      <div
        className={`relative overflow-hidden rounded-xl border border-dashed p-4 transition ${dragging ? 'border-[#7b2d32] bg-[#eee6da]' : 'border-[#cdbfae] bg-[#fbf7ef]'}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          void handleFile(event.dataTransfer.files[0]);
        }}
      >
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept={allowedTypes.join(',')}
          disabled={disabled || uploading}
          onChange={(event) => void handleFile(event.target.files?.[0])}
        />
        {value ? (
          <div className="grid gap-4 sm:grid-cols-[160px_1fr] sm:items-center">
            <img src={value} alt={`${label} preview`} className="aspect-[16/9] w-full rounded-lg border border-[#ded3c4] object-cover sm:h-24" loading="lazy" />
            <div className="space-y-3">
              <p className="break-all text-xs leading-5 text-[#74685f]">{value}</p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" disabled={disabled || uploading} onClick={() => inputRef.current?.click()}>
                  <ImagePlus className="h-4 w-4" /> Replace
                </Button>
                <Button type="button" size="sm" variant="ghost" disabled={disabled || uploading} onClick={() => onChange(null)}>
                  <Trash2 className="h-4 w-4" /> Clear
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            disabled={disabled || uploading}
            onClick={() => inputRef.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-lg px-3 py-7 text-center text-[#74685f] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {uploading ? <Loader2 className="h-7 w-7 animate-spin text-[#7b2d32]" /> : <UploadCloud className="h-7 w-7 text-[#7b2d32]" />}
            <span className="text-sm font-semibold text-[#231b17]">{uploading ? 'Uploading image...' : 'Choose or drop an image'}</span>
            <span className="text-xs">JPEG, PNG, WebP</span>
          </button>
        )}
        {uploading && (
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee6da]">
            <div className="h-full bg-[#7b2d32] transition-all" style={{ width: `${Math.max(progress, 8)}%` }} />
          </div>
        )}
      </div>
      {error && <p className="text-sm font-medium text-[#8c2f2f]">{error}</p>}
    </div>
  );
}

function validateFile(file: File, maxSize: number) {
  if (!allowedTypes.includes(file.type)) return 'Use a JPEG, PNG, or WebP image.';
  if (file.size > maxSize) return `Image must be ${Math.round(maxSize / 1024 / 1024)}MB or smaller.`;
  return '';
}

async function validateImageDimensions(file: File) {
  const url = URL.createObjectURL(file);
  try {
    const dimensions = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const image = new window.Image();
      image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
      image.onerror = reject;
      image.src = url;
    });
    if (dimensions.width < 640 || dimensions.height < 360) return 'Thumbnail must be at least 640 × 360 pixels.';
    if (dimensions.width > 8000 || dimensions.height > 8000) return 'Thumbnail dimensions cannot exceed 8000 × 8000 pixels.';
    return '';
  } catch {
    return 'The selected image could not be read.';
  } finally {
    URL.revokeObjectURL(url);
  }
}
