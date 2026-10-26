import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CalendarClock, RotateCcw, Send, XCircle } from 'lucide-react';
import { ArticlePreview } from '@/components/editor/ArticlePreview';
import { EditorialEvaluationPanel, emptyEvaluation } from '@/components/editor/EditorialEvaluationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiMessage } from '@/lib/api';
import { adminService } from '@/services/admin.service';
import type { Blog, BlogFormPayload } from '@/types/blog';

export default function ArticleApprovalPage() {
  const { id = '' } = useParams(); const navigate = useNavigate(); const [blog, setBlog] = useState<Blog | null>(null); const [note, setNote] = useState(''); const [date, setDate] = useState(''); const [busy, setBusy] = useState('');
  useEffect(() => { adminService.getArticle(id).then(setBlog).catch((error) => toast.error(apiMessage(error, 'Could not load article.'))); }, [id]);
  async function act(action: 'return' | 'reject' | 'schedule' | 'publish') { if ((action === 'return' || action === 'reject') && note.trim().length < 10) return toast.error('Provide at least 10 characters explaining the decision.'); if (action === 'schedule' && (!date || Number.isNaN(Date.parse(date)))) return toast.error('Choose a valid publication date.'); setBusy(action); try { if (action === 'return') await adminService.returnToEditor(id, note.trim()); if (action === 'reject') await adminService.rejectBlog(id, note.trim()); if (action === 'schedule' || action === 'publish') await adminService.approveBlog(id); if (action === 'schedule') await adminService.scheduleBlog(id, new Date(date).toISOString()); if (action === 'publish') await adminService.publishBlog(id); toast.success(`Article ${action === 'return' ? 'returned to editor' : `${action}ed`}.`); navigate('/admin/publication-queue'); } catch (error) { toast.error(apiMessage(error, 'Could not update publication decision.')); } finally { setBusy(''); } }
  if (!blog) return <div className="m-6 h-80 animate-pulse rounded-2xl bg-[#fbf7ef]" />;
  const article: BlogFormPayload = { title: blog.title, excerpt: blog.subtitle ?? blog.excerpt, content: blog.content ?? '', contributorName: blog.contributor?.name ?? blog.author?.name, contentType: blog.contentType, coverImage: typeof blog.coverImage === 'object' ? blog.coverImage : blog.coverImage ? { url: blog.coverImage } : null, sources: blog.sources };
  return <div className="grid gap-5 p-4 md:p-6 xl:grid-cols-[minmax(0,1fr)_380px]"><ArticlePreview article={article} /><Card className="h-fit xl:sticky xl:top-20"><CardHeader><h1 className="font-serif text-2xl font-semibold">Admin approval</h1><p className="text-sm text-[#74685f]">Review the final article and editor evaluation. Publishing controls are restricted to administrators.</p></CardHeader><CardContent className="space-y-5"><EditorialEvaluationPanel value={blog.editorialReview ?? emptyEvaluation} onChange={() => {}} disabled /><Textarea value={note} onChange={(event) => setNote(event.target.value)} placeholder="Decision note for editor" /><Input type="datetime-local" value={date} onChange={(event) => setDate(event.target.value)} /><div className="grid gap-2"><Button disabled={!!busy} variant="outline" onClick={() => void act('return')}><RotateCcw className="h-4 w-4" /> Return to editor</Button><Button disabled={!!busy} variant="outline" onClick={() => void act('reject')}><XCircle className="h-4 w-4" /> Reject</Button><Button disabled={!!busy} variant="outline" onClick={() => void act('schedule')}><CalendarClock className="h-4 w-4" /> Schedule</Button><Button disabled={!!busy} onClick={() => void act('publish')}><Send className="h-4 w-4" /> Publish now</Button></div></CardContent></Card></div>;
}
