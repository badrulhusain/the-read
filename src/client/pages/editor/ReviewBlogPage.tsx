import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCircle, Edit3, Eye, RotateCcw, Save, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/badge';
import { RichTextEditor } from '@/components/editor/RichTextEditor';
import { CoverImageManager } from '@/components/uploads/CoverImageManager';
import { apiMessage } from '@/lib/api';
import { isValidOptionalUrl, sanitizeHtml, stripHtml } from '@/lib/blog-content';
import { canEditorWorkOn, editorialService } from '@/services/editorial.service';
import { useAuth } from '@/store/authStore';
import type { Blog, BlogCoverImage, BlogFormPayload, BlogStatus, EditorialChecklist, EditorialRecommendation } from '@/types/blog';

type ReviewEditForm = Pick<BlogFormPayload, 'title' | 'excerpt' | 'content' | 'coverImage'>;

export default function ReviewBlogPage() {
  const { id = '' } = useParams();
  const { user } = useAuth();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [editForm, setEditForm] = useState<ReviewEditForm>({ title: '', excerpt: '', content: '', coverImage: null });
  const [mode, setMode] = useState<'review' | 'edit'>('review');
  const [comment, setComment] = useState('');
  const [commentAction, setCommentAction] = useState<'reject' | 'revision' | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [notes, setNotes] = useState('');
  const [plagiarismScore, setPlagiarismScore] = useState('');
  const [plagiarismReviewed, setPlagiarismReviewed] = useState(false);
  const [factCheckComplete, setFactCheckComplete] = useState(false);
  const [recommendation, setRecommendation] = useState<EditorialRecommendation | ''>('');
  const [checklist, setChecklist] = useState<EditorialChecklist>({ structure: false, style: false, sources: false, rights: false, seo: false });

  function load() {
    setLoading(true);
    editorialService.getBlog(id)
      .then((data) => {
        setBlog(data);
        setEditForm(formFromBlog(data));
        setNotes(data.internalNotes ?? ''); setPlagiarismScore(data.plagiarismScore?.toString() ?? ''); setPlagiarismReviewed(!!data.plagiarismReviewed); setFactCheckComplete(!!data.factCheckComplete); setRecommendation(data.recommendation ?? ''); setChecklist(data.editorialChecklist ?? { structure: false, style: false, sources: false, rights: false, seo: false });
      })
      .catch((error) => toast.error(apiMessage(error, 'Could not load this blog.')))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  const canReview = canEditorWorkOn(blog, user);
  const canUseFullEditor = user?.role === 'EDITOR' || user?.role === 'ADMIN';
  const decisionCommentLength = comment.trim().length;

  async function run(action: 'pick' | 'approve' | 'reject' | 'revision') {
    if ((action === 'reject' || action === 'revision') && decisionCommentLength < 10) {
      toast.error('Comment must be at least 10 characters for reject or revision request.');
      return;
    }
    setSubmitting(action);
    try {
      let updated: Blog | null = null;
      let nextStatus: BlogStatus | null = null;
      if (action === 'pick') {
        updated = await editorialService.pick(id);
        nextStatus = 'QUALITY_REVIEW';
      }
      if (action === 'approve') {
        updated = await editorialService.approve(id, comment.trim() || undefined);
        nextStatus = 'READY_FOR_ADMIN';
      }
      if (action === 'reject') {
        updated = await editorialService.reject(id, comment.trim());
        nextStatus = 'REJECTED';
      }
      if (action === 'revision') {
        updated = await editorialService.requestRevision(id, comment.trim());
        nextStatus = 'NEEDS_CORRECTION';
      }
      if (updated || nextStatus) {
        setBlog((current) => {
          const base = updated ?? current;
          if (!base) return current;
          return {
            ...base,
            status: nextStatus ?? updated?.status ?? base.status,
          };
        });
        if (updated) {
          setEditForm(formFromBlog(updated));
        }
      }
      toast.success('Review updated.');
      setComment('');
      setCommentAction(null);
      setMode('review');
    } catch (error) {
      toast.error(apiMessage(error, 'Could not update review.'));
    } finally {
      setSubmitting('');
    }
  }

  async function saveEdit() {
    if (!canReview) return toast.error('Pick this blog before editing it.');
    if (editForm.title.trim().length < 3) return toast.error('Title must be at least 3 characters.');
    if (stripHtml(editForm.content).trim().length < 50) return toast.error('Content must be at least 50 characters.');
    if (uploadingCover) return toast.error('Wait for the cover image upload to finish.');
    if (!isValidOptionalUrl(editForm.coverImage?.url)) return toast.error('Cover image must be a valid http or https URL.');
    setSavingEdit(true);
    try {
      await editorialService.update(id, buildEditPayload(editForm));
      const updated = await editorialService.updateCoverImage(id, editForm.coverImage ?? null);
      setBlog(updated);
      setEditForm(formFromBlog(updated));
      setMode('review');
      toast.success('Blog edits saved.');
    } catch (error) {
      toast.error(apiMessage(error, 'Could not save blog edits.'));
    } finally {
      setSavingEdit(false);
    }
  }

  async function saveReviewRecord() {
    setSubmitting('review-record');
    try { const updated = await editorialService.saveReview(id, { internalNotes: notes, plagiarismScore: plagiarismScore ? Number(plagiarismScore) : null, plagiarismReviewed, factCheckComplete, editorialChecklist: checklist, recommendation: recommendation || null }); setBlog(updated); toast.success('Editorial review saved.'); }
    catch (error) { toast.error(apiMessage(error, 'Could not save editorial review.')); }
    finally { setSubmitting(''); }
  }

  if (loading) return <p className="p-4 text-[#74685f] md:p-8">Loading review...</p>;
  if (!blog) return <Card><CardContent className="text-[#74685f]">Blog not found.</CardContent></Card>;

  return (
    <div className="grid gap-5 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card>
        <CardHeader className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-serif text-3xl font-semibold leading-tight tracking-tight text-[#17110d]">{blog.title}</h2>
              <p className="mt-1 text-sm font-medium text-[#5c4b3d]">By {blog.author?.name ?? 'Unknown author'}</p>
            </div>
            <StatusBadge status={blog.status} />
          </div>
          <div className="flex flex-wrap gap-2">
            {blog.status === 'QUALITY_REVIEW' && <Button disabled={submitting === 'pick'} onClick={() => void run('pick')}>{submitting === 'pick' ? 'Picking...' : 'Pick for review'}</Button>}
            {canReview && (
              <>
                <Button variant={mode === 'review' ? 'default' : 'outline'} onClick={() => setMode('review')}><Eye className="h-4 w-4" /> Review</Button>
                <Button variant={mode === 'edit' ? 'default' : 'outline'} onClick={() => setMode('edit')}><Edit3 className="h-4 w-4" /> Edit</Button>
              </>
            )}
            {canUseFullEditor && <Button asChild variant="ghost"><Link to={`/editor/blogs/${blog.id}/edit`}>Full edit page</Link></Button>}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {mode === 'edit' && canReview ? (
            <div className="space-y-4">
              <Input value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} placeholder="Title" maxLength={160} />
              <Input value={editForm.excerpt} onChange={(e) => setEditForm({ ...editForm, excerpt: e.target.value })} placeholder="Excerpt" maxLength={280} />
              <CoverImageManager
                value={editForm.coverImage}
                title={editForm.title}
                excerpt={editForm.excerpt}
                disabled={savingEdit}
                onUploadingChange={setUploadingCover}
                onSave={(coverImage) => setEditForm({ ...editForm, coverImage })}
              />
              <RichTextEditor value={editForm.content} onChange={(content) => setEditForm({ ...editForm, content })} />
              <div className="flex flex-wrap gap-2">
                <Button disabled={savingEdit || uploadingCover} onClick={() => void saveEdit()}><Save className="h-4 w-4" /> {savingEdit ? 'Saving...' : 'Save edits'}</Button>
                <Button type="button" variant="outline" disabled={savingEdit || uploadingCover} onClick={() => setMode('review')}>Cancel</Button>
              </div>
            </div>
          ) : (
            <>
              {blog.excerpt && (
                <p className="max-w-4xl text-base font-medium leading-7 text-[#3a2b22]">{blog.excerpt}</p>
              )}
              <article className="prose-read max-w-5xl rounded-2xl border border-[#ded3c4] bg-[#fffaf1] p-5 font-serif text-[17px] leading-9 text-[#120d09] shadow-inner md:p-7" dangerouslySetInnerHTML={{ __html: sanitizeHtml(blog.content ?? '') }} />
              <section>
                <h3 className="font-serif text-xl font-semibold text-[#17110d]">Review comments</h3>
                {blog.reviewComments?.length ? (
                  <div className="mt-3 space-y-3">{blog.reviewComments.map((item) => <div key={item.id} className="rounded-xl border border-[#ded3c4] bg-[#fffaf1] p-3 text-sm leading-6 text-[#3a2b22]">{item.comment}</div>)}</div>
                ) : <p className="mt-2 text-sm text-[#74685f]">No review comments yet.</p>}
              </section>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="h-fit xl:sticky xl:top-24">
        <CardHeader>
          <h3 className="font-serif text-2xl font-semibold text-[#17110d]">Editorial decision</h3>
          <p className="text-sm leading-6 text-[#5c4b3d]">{canReview ? 'Approve now, or send a clear note back to the author.' : 'Pick the blog to unlock edit and decision actions.'}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <section className="space-y-3 border-b border-[#ded3c4] pb-5"><h4 className="font-serif text-lg font-semibold">Review record</h4><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes (never shown publicly)" /><div className="grid grid-cols-2 gap-2"><Input type="number" min="0" max="100" value={plagiarismScore} onChange={(e) => setPlagiarismScore(e.target.value)} placeholder="Similarity %" /><select className="rounded-xl border border-[#ded3c4] bg-transparent px-3 text-sm" value={recommendation} onChange={(e) => setRecommendation(e.target.value as EditorialRecommendation | '')}><option value="">Recommendation</option><option value="APPROVE">Approve</option><option value="RETURN">Return</option><option value="REJECT">Reject</option></select></div><ReviewCheck checked={plagiarismReviewed} onChange={setPlagiarismReviewed} label="Plagiarism report reviewed" /><ReviewCheck checked={factCheckComplete} onChange={setFactCheckComplete} label="Fact-check complete" />{(Object.keys(checklist) as Array<keyof EditorialChecklist>).map((key) => <ReviewCheck key={key} checked={checklist[key]} onChange={(value) => setChecklist((current) => ({ ...current, [key]: value }))} label={`${key[0].toUpperCase()}${key.slice(1)} checked`} />)}<Button variant="outline" disabled={!!submitting} onClick={() => void saveReviewRecord()}><Save className="h-4 w-4" /> Save review record</Button></section>
          {canReview ? (
            <>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={commentAction ? 'Minimum 10 characters required.' : 'Optional approval note, or choose reject/revision to require a comment.'}
              />
              {commentAction && <p className={decisionCommentLength < 10 ? 'text-sm text-red-600' : 'text-sm text-green-700'}>{decisionCommentLength}/10 characters</p>}
              <div className="grid gap-2">
                <Button disabled={!!submitting || savingEdit || uploadingCover} onClick={() => void run('approve')}><CheckCircle className="h-4 w-4" /> {submitting === 'approve' ? 'Approving...' : 'Approve'}</Button>
                <Button
                  variant="outline"
                  disabled={!!submitting || savingEdit || uploadingCover}
                  onClick={() => commentAction === 'revision' ? void run('revision') : setCommentAction('revision')}
                >
                  <RotateCcw className="h-4 w-4" /> {submitting === 'revision' ? 'Requesting...' : 'Request revision'}
                </Button>
                <Button
                  variant="destructive"
                  disabled={!!submitting || savingEdit || uploadingCover}
                  onClick={() => commentAction === 'reject' ? void run('reject') : setCommentAction('reject')}
                >
                  <XCircle className="h-4 w-4" /> {submitting === 'reject' ? 'Rejecting...' : 'Reject'}
                </Button>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-[#ded3c4] bg-[#fffaf1] p-4 text-sm leading-6 text-[#3a2b22]">
              {blog.status === 'QUALITY_REVIEW' ? 'This blog is waiting to be picked.' : 'Decision actions are only available during editorial review.'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function ReviewCheck({ checked, onChange, label }: { checked: boolean; onChange: (value: boolean) => void; label: string }) { return <label className="flex items-center gap-2 text-sm"><Checkbox checked={checked} onCheckedChange={(value) => onChange(value === true)} />{label}</label>; }

function formFromBlog(blog: Blog): ReviewEditForm {
  return {
    title: blog.title,
    excerpt: blog.excerpt ?? '',
    content: blog.content ?? '',
    coverImage: coverImageFromBlog(blog),
  };
}

function buildEditPayload(form: BlogFormPayload): BlogFormPayload {
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
