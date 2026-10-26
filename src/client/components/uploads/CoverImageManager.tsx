import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import Cropper, { type Area, type Point } from 'react-easy-crop';
import toast from 'react-hot-toast';
import { Image, RefreshCcw, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ImageUpload } from '@/components/uploads/ImageUpload';
import type { BlogCoverImage, BlogImageCrop } from '@/types/blog';

interface CoverImageManagerProps {
  value?: BlogCoverImage | null;
  title?: string;
  excerpt?: string;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
  onSave: (value: BlogCoverImage | null) => void | Promise<void>;
}

const defaultCrop: BlogImageCrop = { x: 50, y: 50, width: 100, height: 100, zoom: 1 };
const tabs = ['Preview', 'Adjust', 'SEO'] as const;

export function CoverImageManager({
  value,
  title = 'Blog title',
  excerpt = 'Short blog excerpt appears here for card previews.',
  disabled = false,
  onUploadingChange,
  onSave,
}: CoverImageManagerProps) {
  const [draft, setDraft] = useState<BlogCoverImage | null>(value ?? null);
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]>('Preview');
  const [cropPosition, setCropPosition] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(value?.crop?.zoom ?? defaultCrop.zoom);
  const [seoTitle, setSeoTitle] = useState(title);
  const [seoDescription, setSeoDescription] = useState(excerpt);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(value ?? null);
    setZoom(value?.crop?.zoom ?? defaultCrop.zoom);
  }, [value]);

  useEffect(() => setSeoTitle(title), [title]);
  useEffect(() => setSeoDescription(excerpt), [excerpt]);

  const crop = draft?.crop ?? defaultCrop;
  const previewStyle = useMemo(() => ({
    objectPosition: `${crop.x}% ${crop.y}%`,
    transform: `scale(${crop.zoom})`,
  }), [crop.x, crop.y, crop.zoom]);

  function handleUpload(image: { url: string; publicId: string } | null) {
    if (!image) {
      setDraft(null);
      void Promise.resolve(onSave(null)).catch(() => undefined);
      toast.success('Cover image removed. Save changes to apply.');
      return;
    }
    const nextDraft: BlogCoverImage = {
      url: image.url,
      publicId: image.publicId,
      altText: draft?.altText ?? '',
      crop: draft?.crop ?? defaultCrop,
    };
    setDraft(nextDraft);
    void Promise.resolve(onSave(nextDraft)).catch(() => undefined);
    setActiveTab('Adjust');
  }

  function handleCropComplete(_: Area, croppedAreaPercentages: Area) {
    if (!draft) return;
    const nextCrop = {
      x: round(croppedAreaPercentages.x + croppedAreaPercentages.width / 2),
      y: round(croppedAreaPercentages.y + croppedAreaPercentages.height / 2),
      width: round(croppedAreaPercentages.width),
      height: round(croppedAreaPercentages.height),
      zoom: round(zoom),
    };
    setDraft({ ...draft, crop: nextCrop });
  }

  function resetCrop() {
    if (!draft) return;
    setCropPosition({ x: 0, y: 0 });
    setZoom(defaultCrop.zoom);
    setDraft({ ...draft, crop: defaultCrop });
    toast.success('Cover adjustment reset.');
  }

  async function saveCover() {
    setSaving(true);
    try {
      await onSave(draft ? { ...draft, altText: draft.altText?.trim() || null, crop: draft.crop ?? defaultCrop } : null);
      toast.success(draft ? 'Cover image settings saved.' : 'Cover image removed.');
    } catch {
      // The parent reports persistence errors with API context.
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-[#ded3c4] bg-[#f4efe6] p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm font-semibold text-[#5c4b3d]">Cover image</p>
          <p className="mt-1 text-xs leading-5 text-[#74685f]">Recommended size: 1200 x 675 px. Supported formats: JPG, PNG, WEBP. Maximum size: 2 MB.</p>
        </div>
        <Button type="button" size="sm" disabled={disabled || saving} onClick={() => void saveCover()}>
          <Save className="h-4 w-4" /> {saving ? 'Saving...' : 'Save cover'}
        </Button>
      </div>

      <ImageUpload
        type="BLOG_COVER"
        label="Upload or change image"
        value={draft?.url}
        publicId={draft?.publicId}
        disabled={disabled || saving}
        onUploadingChange={onUploadingChange}
        onChange={handleUpload}
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${activeTab === tab ? 'bg-[#7b2d32] text-[#fffaf1]' : 'bg-[#fbf7ef] text-[#5c4b3d] hover:bg-[#eee6da]'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {!draft?.url ? (
        <div className="grid min-h-56 place-items-center rounded-xl border border-dashed border-[#cdbfae] bg-[#fbf7ef] text-center text-sm text-[#74685f]">
          <div>
            <Image className="mx-auto h-8 w-8 text-[#a9793d]" />
            <p className="mt-2 font-semibold text-[#5c4b3d]">Upload a cover image to preview and adjust it.</p>
          </div>
        </div>
      ) : (
        <>
          {activeTab === 'Preview' && (
            <div className="space-y-4">
              <PreviewFrame label="Large preview" className="aspect-[16/9]">
                <PreviewImage src={draft.url} alt={draft.altText} style={previewStyle} />
              </PreviewFrame>
              <div className="grid gap-4 lg:grid-cols-2">
                <PreviewFrame label="Desktop blog card" className="aspect-[16/9]">
                  <PreviewImage src={draft.url} alt={draft.altText} style={previewStyle} />
                  <PreviewCopy title={title} excerpt={excerpt} />
                </PreviewFrame>
                <PreviewFrame label="Mobile blog card" className="mx-auto aspect-[4/5] max-w-[280px]">
                  <PreviewImage src={draft.url} alt={draft.altText} style={previewStyle} />
                  <PreviewCopy title={title} excerpt={excerpt} compact />
                </PreviewFrame>
                <PreviewFrame label="Blog detail hero" className="aspect-[16/7] lg:col-span-2">
                  <PreviewImage src={draft.url} alt={draft.altText} style={previewStyle} />
                </PreviewFrame>
                <PreviewFrame label="Social sharing preview" className="aspect-[1200/630] lg:col-span-2">
                  <PreviewImage src={draft.url} alt={draft.altText} style={previewStyle} />
                  <PreviewCopy title={seoTitle || title} excerpt={seoDescription || excerpt} />
                </PreviewFrame>
              </div>
            </div>
          )}

          {activeTab === 'Adjust' && (
            <div className="space-y-4">
              <div className="relative h-[340px] overflow-hidden rounded-xl border border-[#ded3c4] bg-[#17110d]">
                <Cropper
                  image={draft.url}
                  crop={cropPosition}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCropPosition}
                  onZoomChange={setZoom}
                  onCropComplete={handleCropComplete}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                <label className="space-y-2 text-sm font-semibold text-[#5c4b3d]">
                  <span>Zoom</span>
                  <input
                    type="range"
                    min={1}
                    max={3}
                    step={0.05}
                    value={zoom}
                    disabled={disabled || saving}
                    onChange={(event) => {
                      const nextZoom = Number(event.target.value);
                      setZoom(nextZoom);
                      setDraft({ ...draft, crop: { ...(draft.crop ?? defaultCrop), zoom: nextZoom } });
                    }}
                    className="w-full accent-[#7b2d32]"
                  />
                </label>
                <Button type="button" variant="outline" disabled={disabled || saving} onClick={resetCrop}>
                  <RefreshCcw className="h-4 w-4" /> Reset crop
                </Button>
              </div>
              <p className="text-xs leading-5 text-[#74685f]">Crop ratio is fixed at 16:9. Drag the image to reposition it, then save cover before saving the blog.</p>
            </div>
          )}

          {activeTab === 'SEO' && (
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
              <div className="space-y-3">
                <Input value={draft.altText ?? ''} onChange={(event) => setDraft({ ...draft, altText: event.target.value })} placeholder="Thumbnail alt text (required for accessibility)" maxLength={160} disabled={disabled || saving} />
                <Input value={seoTitle} onChange={(event) => setSeoTitle(event.target.value)} placeholder="SEO title preview" maxLength={70} disabled={disabled || saving} />
                <Textarea value={seoDescription} onChange={(event) => setSeoDescription(event.target.value)} placeholder="SEO description preview" maxLength={160} disabled={disabled || saving} />
              </div>
              <PreviewFrame label="Social preview" className="aspect-[1200/630]">
                <PreviewImage src={draft.url} alt={draft.altText} style={previewStyle} />
                <PreviewCopy title={seoTitle || title} excerpt={seoDescription || excerpt} />
              </PreviewFrame>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function PreviewFrame({ label, className, children }: { label: string; className: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#a9793d]">{label}</p>
      <div className={`relative overflow-hidden rounded-xl border border-[#ded3c4] bg-[#fbf7ef] shadow-sm ${className}`}>
        {children}
      </div>
    </div>
  );
}

function PreviewImage({ src, alt, style }: { src: string; alt?: string | null; style: CSSProperties }) {
  return <img src={src} alt={alt || 'Cover preview'} className="h-full w-full object-cover transition-transform" style={style} loading="lazy" />;
}

function PreviewCopy({ title, excerpt, compact = false }: { title: string; excerpt?: string; compact?: boolean }) {
  return (
    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#17110d]/85 to-transparent p-4 text-[#fffaf1]">
      <p className={`font-serif font-semibold leading-tight ${compact ? 'text-lg' : 'text-2xl'}`}>{title || 'Blog title'}</p>
      {excerpt && <p className="mt-1 line-clamp-2 text-xs leading-5 text-[#f5eadc]">{excerpt}</p>}
    </div>
  );
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
