import { Monitor, Smartphone } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { readingTime, sanitizeHtml, wordCount } from '@/lib/blog-content';
import type { BlogFormPayload } from '@/types/blog';

export function ArticlePreview({ article }: { article: BlogFormPayload }) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const thumbnail = article.coverImage;

  return (
    <section className="space-y-4" aria-label="Article preview">
      <div className="flex justify-end gap-2">
        <Button type="button" size="sm" variant={device === 'desktop' ? 'default' : 'outline'} onClick={() => setDevice('desktop')}><Monitor className="h-4 w-4" /> Desktop</Button>
        <Button type="button" size="sm" variant={device === 'mobile' ? 'default' : 'outline'} onClick={() => setDevice('mobile')}><Smartphone className="h-4 w-4" /> Mobile</Button>
      </div>
      <div className={`mx-auto overflow-hidden rounded-2xl border border-[#ded3c4] bg-[#fffaf1] shadow-sm transition-all ${device === 'mobile' ? 'max-w-[390px]' : 'max-w-5xl'}`}>
        {thumbnail?.url ? (
          <div className="aspect-video overflow-hidden bg-[#eee6da]"><img src={thumbnail.url} alt={thumbnail.altText || ''} className="h-full w-full object-cover" style={{ objectPosition: `${thumbnail.crop?.x ?? 50}% ${thumbnail.crop?.y ?? 50}%`, transform: `scale(${thumbnail.crop?.zoom ?? 1})` }} /></div>
        ) : null}
        <div className={device === 'mobile' ? 'p-5' : 'p-8 md:p-12'}>
          <p className="text-xs font-semibold uppercase tracking-[.2em] text-[#a9793d]">{article.contentType?.replaceAll('_', ' ') || 'Article'}</p>
          <h1 className={`mt-3 font-serif font-semibold leading-tight text-[#231b17] ${device === 'mobile' ? 'text-4xl' : 'text-5xl md:text-6xl'}`}>{article.title || 'Untitled article'}</h1>
          {article.excerpt ? <p className="mt-4 text-lg leading-8 text-[#5c4b3d]">{article.excerpt}</p> : null}
          <p className="mt-4 text-sm text-[#74685f]">By {article.contributorName || 'Contributor'} · {wordCount(article.content)} words · {readingTime(article.content)}</p>
          <article className="prose-read mt-8 font-serif text-[17px] leading-9 text-[#231b17]" dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content || '<p>Start writing to see the preview.</p>') }} />
          {article.sources?.length ? <section className="mt-10 border-t border-[#ded3c4] pt-6"><h2 className="font-serif text-2xl font-semibold">Sources</h2><ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">{article.sources.map((source, index) => <li key={source.id ?? `${source.url}-${index}`}>{source.url ? <a href={source.url} target="_blank" rel="noreferrer" className="underline">{source.title || source.url}</a> : source.title}{source.publisher ? ` — ${source.publisher}` : ''}</li>)}</ol></section> : null}
        </div>
      </div>
    </section>
  );
}
