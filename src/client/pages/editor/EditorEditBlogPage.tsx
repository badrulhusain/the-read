import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Eye, PenLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { CoverImageManager } from '@/components/uploads/CoverImageManager';
import { apiMessage } from '@/lib/api';
import { isValidOptionalUrl, readingTime, sanitizeHtml, stripHtml, wordCount } from '@/lib/blog-content';
import { canManageEditorialBlog, editorialService } from '@/services/editorial.service';
import { useAuth } from '@/store/authStore';
import type { Blog, BlogCoverImage, BlogFormPayload } from '@/types/blog';

type EditorBlogForm = Pick<BlogFormPayload, 'title' | 'excerpt' | 'content' | 'coverImage'>;

export default function EditorEditBlogPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<EditorBlogForm>({ title: '', excerpt: '', content: '', coverImage: null });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [preview, setPreview] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    editorialService.getBlog(id)
      .then((data) => {
        if (!canManageEditorialBlog(user)) {
          toast.error('Only editors and admins can edit blogs.');
          navigate(`/editor/blogs/${id}/review`, { replace: true });
          return;
        }
        setForm(formFromBlog(data));
        setDirty(false);
      })
      .catch((error) => {
        toast.error(apiMessage(error, 'Could not load blog.'));
        navigate('/editor/submissions', { replace: true });
      })
      .finally(() => setLoading(false));
  }, [id, navigate, user]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirty || submitting) return;
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [dirty, submitting]);

  function update(next: Partial<EditorBlogForm>) {
    setForm((current) => ({ ...current, ...next }));
    setDirty(true);
  }

  function validate() {
    if (!form.title.trim()) return 'Title is required.';
    if (!stripHtml(form.content).trim()) return 'Content is required.';
    if (!isValidOptionalUrl(form.coverImage?.url)) return 'Cover image must be a valid http or https URL.';
    return '';
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!canManageEditorialBlog(user)) {
      toast.error('Only editors and admins can edit blogs.');
      navigate(`/editor/blogs/${id}/review`, { replace: true });
      return;
    }
    if (uploadingCover) return toast.error('Wait for the cover image upload to finish.');
    const validationError = validate();
    if (validationError) return toast.error(validationError);
    setSubmitting(true);
    try {
      await editorialService.update(id, buildPayload(form));
      await editorialService.updateCoverImage(id, form.coverImage ?? null);
      setDirty(false);
      toast.success('Blog saved.');
      navigate(`/editor/blogs/${id}/review`);
    } catch (error) {
      toast.error(apiMessage(error, 'Could not save blog.'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-2xl border border-[#ded3c4] bg-[#fbf7ef]" />;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-[#231b17]">Edit blog</h2>
          <p className="text-sm text-[#74685f]">Polish content, metadata, and cover image settings.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {dirty && <span className="text-xs font-semibold text-[#a9793d]">Unsaved changes</span>}
          <Button type="button" variant="outline" onClick={() => setPreview((value) => !value)}>
            {preview ? <PenLine className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {preview ? 'Edit' : 'Preview'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={onSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <Input value={form.title} onChange={(e) => update({ title: e.target.value })} placeholder="Title" maxLength={160} />
            <Input value={form.excerpt} onChange={(e) => update({ excerpt: e.target.value })} placeholder="Excerpt" maxLength={280} />
          </div>
          <CoverImageManager
            value={form.coverImage}
            title={form.title}
            excerpt={form.excerpt}
            disabled={submitting}
            onUploadingChange={setUploadingCover}
            onSave={(coverImage) => update({ coverImage })}
          />
          {preview ? (
            <article className="prose-read min-h-[340px] rounded-xl border border-[#ded3c4] bg-[#fffaf1] p-5" dangerouslySetInnerHTML={{ __html: sanitizeHtml(form.content || '<p></p>') }} />
          ) : (
            <RichTextEditor value={form.content} onChange={(content) => update({ content })} />
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs font-medium text-[#74685f]">{wordCount(form.content)} words · {readingTime(form.content)}</div>
            <Button disabled={submitting || uploadingCover}>{submitting ? 'Saving...' : 'Save changes'}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function formFromBlog(blog: Blog): EditorBlogForm {
  return {
    title: blog.title,
    excerpt: blog.excerpt ?? '',
    content: blog.content ?? '',
    coverImage: coverImageFromBlog(blog),
  };
}

function buildPayload(form: BlogFormPayload): BlogFormPayload {
  return {
    title: form.title.trim(),
    excerpt: form.excerpt?.trim(),
    content: form.content,
  };
}

function coverImageFromBlog(blog: Blog): BlogCoverImage | null {
  if (blog.coverImage && typeof blog.coverImage === 'object') return blog.coverImage;
  const url = typeof blog.coverImage === 'string' ? blog.coverImage : blog.imageUrl;
  if (!url) return null;
  return {
    url,
    publicId: blog.coverImagePublicId ?? null,
    altText: blog.altText ?? blog.coverImageAltText ?? null,
    crop: blog.crop ?? blog.coverImageCrop ?? null,
  };
}
