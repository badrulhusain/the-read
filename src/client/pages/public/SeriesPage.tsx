import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BlogCard } from '@/components/blog/BlogCard';
import { blogService } from '@/services/blog.service';
import type { ArticleSeries } from '@/types/blog';

export default function SeriesPage() { const { slug = '' } = useParams(); const [series, setSeries] = useState<ArticleSeries | null>(null); useEffect(() => { blogService.getSeries(slug).then(setSeries).catch(() => setSeries(null)); }, [slug]); if (!series) return <main className="mx-auto max-w-5xl px-4 py-12">Loading series…</main>; return <main className="mx-auto max-w-7xl px-4 py-12 pb-28"><header className="max-w-3xl"><p className="text-xs font-semibold uppercase tracking-[.22em] text-[#a9793d]">Article series</p><h1 className="mt-2 font-serif text-5xl font-semibold">{series.name}</h1><p className="mt-3 text-lg leading-8 text-[#74685f]">{series.description}</p></header><section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{series.articles?.map((blog) => <BlogCard key={blog.id} blog={blog} />)}</section></main>; }
