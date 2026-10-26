import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Bookmark, Share2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { BlogCoverImage } from '@/components/blog/BlogCoverImage';
import { formatDate } from '@/components/blog/BlogCard';
import { CommentSection } from '@/components/comments/CommentSection';
import { normalizeCategoryName, normalizeTagName, readingTime, sanitizeHtml, wordCount } from '@/lib/blog-content';
import { blogService } from '@/services/blog.service';
import { useAuth } from '@/store/authStore';
import type { Blog } from '@/types/blog';

interface TocItem {
  id: string;
  text: string;
  level: number;
}

export default function BlogDetailPage() {
  const { user } = useAuth();
  const { slug = '' } = useParams();
  const [blog, setBlog] = useState<Blog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    setError('');
    setBlog(null);
    setLoading(true);
    blogService.getPublishedBySlug(slug)
      .then(setBlog)
      .catch((err) => setError(err?.response?.status === 404 ? 'Blog not found.' : 'Could not load this blog.'))
      .finally(() => setLoading(false));
  }, [slug]);

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(100, Math.max(0, (window.scrollY / max) * 100)) : 0);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!blog) return;
    document.title = blog.seoTitle || blog.title;
    const description = blog.seoDescription || blog.excerpt;
    if (!description) return;
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', 'description');
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', description);
  }, [blog]);

  const blogId = blog?.id;
  const userId = user?.id;
  useEffect(() => {
    if (!userId || !blogId) return;
    void blogService.recordHistory(blogId).catch(() => undefined);
  }, [blogId, userId]);

  const html = useMemo(() => addHeadingIds(sanitizeHtml(blog?.content ?? '')), [blog?.content]);
  const toc = useMemo(() => buildToc(html), [html]);
  const category = normalizeCategoryName(blog?.category);
  const tags = (blog?.tags ?? []).map(normalizeTagName).filter(Boolean);

  async function toggleSave() {
    if (!user || !blog) return toast.error('Sign in to save articles.');
    try { const result = blog.isSaved ? await blogService.unsave(blog.id) : await blogService.save(blog.id); setBlog({ ...blog, isSaved: result.saved }); toast.success(result.saved ? 'Saved to your library.' : 'Removed from saved articles.'); } catch { toast.error('Could not update saved articles.'); }
  }
  async function share() { try { if (navigator.share) await navigator.share({ title: blog?.title, url: window.location.href }); else { await navigator.clipboard.writeText(window.location.href); toast.success('Link copied.'); } } catch { /* sharing cancelled */ } }

  if (loading) return <main className="mx-auto max-w-4xl px-4 py-10"><div className="h-80 animate-pulse rounded-2xl border border-[#ded3c4] bg-[#fbf7ef]" /></main>;
  if (error || !blog) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-10">
        <Card><CardContent><p className="text-[#5c4b3d]">{error || 'Blog not found.'}</p><Button asChild className="mt-4"><Link to="/blogs">Back to blogs</Link></Button></CardContent></Card>
      </main>
    );
  }

  return (
    <main className="pb-24 md:pb-10">
      <div className="fixed left-0 top-0 z-50 h-1 bg-[#7b2d32] transition-all" style={{ width: `${progress}%` }} />
      <article className="mx-auto max-w-6xl px-4 py-10 md:px-6">
        <BlogCoverImage blog={blog} eager className="mb-9 aspect-[16/7] w-full rounded-2xl border border-[#ded3c4] shadow-sm" />
        <header className="mx-auto max-w-4xl text-center">
          <AuthorByline blog={blog} />
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {category && <span className="rounded-full bg-[#eee6da] px-3 py-1 text-xs font-semibold text-[#7b2d32]">{category}</span>}
            {tags.map((tag) => <span key={tag} className="rounded-full border border-[#ded3c4] px-3 py-1 text-xs font-medium text-[#74685f]">{tag}</span>)}
          </div>
          <p className="mt-4 text-sm font-medium text-[#a19184]">{formatDate(blog.publishedAt ?? blog.createdAt)} · {readingTime(blog.content ?? '')} · {wordCount(blog.content ?? '')} words{typeof blog.commentsCount === 'number' ? ` · ${blog.commentsCount} comments` : ''}</p>
          <h1 className="mt-3 font-serif text-4xl font-semibold leading-tight tracking-tight text-[#231b17] sm:text-5xl md:text-6xl">{blog.title}</h1>
          {blog.excerpt && <p className="mx-auto mt-5 max-w-2xl font-serif text-xl italic leading-8 text-[#5c4b3d]">{blog.excerpt}</p>}
          <div className="mt-6 flex flex-wrap justify-center gap-2"><Button variant="outline" onClick={() => void toggleSave()}><Bookmark className={`h-4 w-4 ${blog.isSaved ? 'fill-current' : ''}`} /> {blog.isSaved ? 'Saved' : 'Save'}</Button><Button variant="outline" onClick={() => void share()}><Share2 className="h-4 w-4" /> Share</Button>{(['INSIGHTFUL', 'INSPIRING', 'THOUGHT_PROVOKING'] as const).map((reaction) => <Button key={reaction} variant="ghost" onClick={() => void blogService.react(blog.id, reaction).then((counts) => setBlog({ ...blog, reactionCounts: counts }))}><Sparkles className="h-4 w-4" /> {reaction.replaceAll('_', ' ').toLowerCase()} {blog.reactionCounts?.[reaction] ?? ''}</Button>)}</div>
        </header>
        {toc.length > 0 && (
          <Card className="mx-auto mt-10 max-w-4xl shadow-sm">
            <CardContent className="md:flex md:items-start md:gap-6">
              <p className="shrink-0 text-xs font-semibold uppercase tracking-[0.2em] text-[#a9793d]">Contents</p>
              <nav className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm md:mt-0">
                {toc.map((item) => <a key={item.id} href={`#${item.id}`} className="text-[#74685f] underline-offset-4 hover:text-[#7b2d32] hover:underline">{item.text}</a>)}
              </nav>
            </CardContent>
          </Card>
        )}
        <div className="prose-read mx-auto mt-10 min-w-0 max-w-4xl font-serif text-xl leading-[2] text-[#231b17] md:text-[1.35rem]" dangerouslySetInnerHTML={{ __html: html }} />
        {(blog.editor || blog.factChecker) && <Card className="mx-auto mt-10 max-w-4xl shadow-sm"><CardContent className="flex flex-wrap gap-x-6 gap-y-2 text-sm"><p className="text-xs font-semibold uppercase tracking-[.2em] text-[#a9793d]">Editorial record</p>{blog.editor && <p>Edited by <strong>{blog.editor.name}</strong></p>}{blog.factChecker && <p>Fact-checked by <strong>{blog.factChecker.name}</strong></p>}</CardContent></Card>}
        {blog.sources?.length ? <section className="mx-auto mt-10 max-w-4xl border-t border-[#ded3c4] pt-7"><h2 className="font-serif text-2xl font-semibold">Sources & references</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-base text-[#74685f]">{blog.sources.map((source, index) => <li key={source.id ?? index}>{source.url ? <a className="underline hover:text-[#7b2d32]" href={source.url} target="_blank" rel="noreferrer">{source.title}</a> : source.title}{source.publisher ? ` — ${source.publisher}` : ''}</li>)}</ol></section> : null}
        {blog.corrections?.length ? <section className="mx-auto mt-8 max-w-4xl rounded-2xl border border-[#ded3c4] p-5"><h2 className="font-serif text-xl font-semibold">Correction history</h2>{blog.corrections.map((entry, index) => <p key={entry.id ?? index} className="mt-2 text-base text-[#74685f]">{formatDate(entry.correctedAt)} — {entry.note}</p>)}</section> : null}
        {blog.relatedArticles?.length ? <section className="mx-auto mt-10 max-w-4xl border-t border-[#ded3c4] pt-7"><h2 className="font-serif text-2xl font-semibold">Related articles</h2><div className="mt-4 grid gap-3 md:grid-cols-3">{blog.relatedArticles.map((item) => <Link key={item.id} to={`/blogs/${item.slug}`} className="rounded-2xl border border-[#ded3c4] p-4 font-serif text-lg font-semibold hover:text-[#7b2d32]">{item.title}</Link>)}</div></section> : null}
      </article>
      <CommentSection slug={slug} initialCount={blog.commentsCount} />
    </main>
  );
}

function AuthorByline({ blog }: { blog: Blog }) {
  return (
    <div className="inline-grid max-w-full grid-cols-[3.5rem_minmax(0,1fr)] items-center gap-3 rounded-2xl border border-white/70 bg-white/45 px-4 py-3 text-left shadow-sm">
      {blog.author?.avatarUrl ? (
        <span className="block h-14 w-14 overflow-hidden rounded-full bg-[#e5e9df] ring-2 ring-white">
          <img src={blog.author.avatarUrl} alt="" loading="lazy" className="aspect-square h-full w-full object-cover" />
        </span>
      ) : (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#53693a] font-serif text-lg font-semibold text-[#fffaf1] ring-2 ring-white">{initials(blog.author?.name)}</span>
      )}
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#a9793d]">Written by</p>
        <p className="font-serif text-xl font-semibold text-[#231b17]">{blog.author?.name ?? 'The Read'}</p>
        <p className="break-words text-xs leading-5 text-[#74685f]">{blog.author?.email ?? 'The Read editorial desk'}</p>
      </div>
    </div>
  );
}

function addHeadingIds(html: string) {
  if (!html || typeof window === 'undefined') return html;
  const documentFragment = new DOMParser().parseFromString(html, 'text/html');
  documentFragment.querySelectorAll('h2, h3').forEach((heading, index) => {
    if (!heading.id) heading.id = `section-${index + 1}`;
  });
  return documentFragment.body.innerHTML;
}

function buildToc(html: string): TocItem[] {
  if (!html || typeof window === 'undefined') return [];
  const documentFragment = new DOMParser().parseFromString(html, 'text/html');
  return Array.from(documentFragment.querySelectorAll('h2, h3')).map((heading, index) => ({
    id: heading.id || `section-${index + 1}`,
    text: heading.textContent ?? '',
    level: heading.tagName === 'H3' ? 3 : 2,
  })).filter((item) => item.text.trim());
}

function initials(name?: string) {
  return (name ?? 'TR').split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase();
}
