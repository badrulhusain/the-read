import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { BlogCard } from '@/components/blog/BlogCard';
import { blogService } from '@/services/blog.service';
import type { Blog, Contributor } from '@/types/blog';

export default function ContributorPage() { const { slug = '' } = useParams(); const [data, setData] = useState<(Contributor & { articles?: Blog[] }) | null>(null); useEffect(() => { blogService.getContributor(slug).then(setData).catch(() => setData(null)); }, [slug]); if (!data) return <main className="mx-auto max-w-5xl px-4 py-12">Loading contributor…</main>; return <main className="mx-auto max-w-6xl px-4 py-12 pb-28"><header className="flex max-w-3xl items-start gap-5">{data.avatarUrl ? <img src={data.avatarUrl} alt="" className="h-24 w-24 rounded-full object-cover" /> : <span className="grid h-24 w-24 place-items-center rounded-full bg-[#53693a] font-serif text-3xl text-white">{data.name[0]}</span>}<div><p className="text-xs font-semibold uppercase tracking-[.22em] text-[#a9793d]">Contributor</p><h1 className="font-serif text-5xl font-semibold">{data.name}</h1><p className="mt-3 leading-7 text-[#74685f]">{data.biography}</p></div></header><section className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">{data.articles?.map((blog) => <BlogCard key={blog.id} blog={blog} />)}</section></main>; }
