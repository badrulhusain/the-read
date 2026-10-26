import React, { useEffect, useState } from 'react';
import { Avatar, NeuButton, NeuCard, NeuInput, Ornament, Pill } from '../components/ui';
import { Icon } from '../components/Icon';
import { postsApi, tagsApi } from '../api';
import { relTime } from '../data';
import type { Post, Tag } from '../types';

// ── Feed row (desktop) ────────────────────────────────────────────────────────
const FeedPostRow: React.FC<{ post: Post; onOpen: (p: Post) => void }> = ({ post, onOpen }) => (
  <article className="neu-row hover-lift" onClick={() => onOpen(post)} style={{
    display: 'grid', gridTemplateColumns: '1fr 180px',
    gap: 22, padding: '18px 20px',
    borderRadius: 16,
    cursor: 'pointer',
    margin: '14px 0',
  }}>
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
        <Avatar user={post.author} size={26} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{post.author.name}</span>
        <span style={{ color: 'var(--ink-3)', fontSize: 12 }}>· {relTime(post.createdAt)}</span>
        {post.featured && <Pill small color="var(--tan-2)">Featured</Pill>}
      </div>
      <h3 className="tr-serif" style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.25 }}>{post.title}</h3>
      <p style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {post.tags.map(t => <Pill key={t.id} color={t.hue} small>{t.name}</Pill>)}
        <span style={{ flex: 1 }} />
        <span style={{ display: 'flex', gap: 4, alignItems: 'center', color: 'var(--ink-3)', fontSize: 12 }}><Icon name="clock" size={13} />{post.readTime} min</span>
        <span style={{ display: 'flex', gap: 4, alignItems: 'center', color: 'var(--ink-3)', fontSize: 12 }}><Icon name="heart" size={13} />{post.reactions}</span>
        <span style={{ display: 'flex', gap: 4, alignItems: 'center', color: 'var(--ink-3)', fontSize: 12 }}><Icon name="comment" size={13} />{post.comments}</span>
      </div>
    </div>
    <div style={{
      height: 130, borderRadius: 12, background: post.cover,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fbf8f2', fontSize: 50, fontFamily: "'Fraunces',serif",
      boxShadow: '8px 8px 18px var(--sh-hi), -4px -4px 10px rgba(255,255,250,.36)', opacity: .95,
    }}>
      <div style={{ opacity: .5 }}>{post.coverAccent}</div>
    </div>
  </article>
);

// ── Feed card (mobile) ────────────────────────────────────────────────────────
const FeedMobileCard: React.FC<{ post: Post; onOpen: (p: Post) => void }> = ({ post, onOpen }) => (
  <article className="neu neu-ring hover-lift" onClick={() => onOpen(post)} style={{ borderRadius: 18, overflow: 'hidden', cursor: 'pointer' }}>
    <div style={{
      height: 130, background: post.cover,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fbf8f2', fontSize: 48, fontFamily: "'Fraunces',serif", opacity: .9,
    }}>
      <div style={{ opacity: .5 }}>{post.coverAccent}</div>
    </div>
    <div style={{ padding: 16 }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
        {post.tags.slice(0, 2).map(t => <Pill key={t.id} color={t.hue} small>{t.name}</Pill>)}
      </div>
      <h3 className="tr-serif" style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 600, lineHeight: 1.3 }}>{post.title}</h3>
      <p style={{ margin: '0 0 12px', fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Avatar user={post.author} size={24} />
        <span style={{ fontSize: 12, fontWeight: 600 }}>{post.author.name}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-3)', marginLeft: 'auto' }}>{post.readTime} min</span>
      </div>
    </div>
  </article>
);

// ── Loading skeleton ──────────────────────────────────────────────────────────
const FeedSkeleton: React.FC = () => (
  <div style={{ padding: '22px 0' }}>
    {[1, 2, 3].map(i => (
      <div key={i} className="neu-row-soft" style={{ display: 'grid', gridTemplateColumns: '1fr 180px', gap: 22, padding: '18px 20px', borderRadius: 16, margin: '14px 0' }}>
        <div>
          <div className="neu-inset" style={{ height: 14, width: 200, borderRadius: 7, marginBottom: 12 }} />
          <div className="neu-inset" style={{ height: 22, width: '80%', borderRadius: 7, marginBottom: 8 }} />
          <div className="neu-inset" style={{ height: 14, width: '60%', borderRadius: 7 }} />
        </div>
        <div className="neu-inset" style={{ height: 130, borderRadius: 12 }} />
      </div>
    ))}
  </div>
);

// ── Feed Desktop ──────────────────────────────────────────────────────────────
export const FeedDesktop: React.FC<{ nav: (r: any, p?: Post) => void }> = ({ nav }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([postsApi.list(), tagsApi.list()])
      .then(([ps, ts]) => { setPosts(ps); setAllTags(ts); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filters = ['All', 'Featured', ...allTags.map(t => t.name)];

  const filtered = posts.filter(p => {
    if (filter === 'All') return true;
    if (filter === 'Featured') return p.featured;
    return p.tags.some(t => t.name === filter);
  });

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 1100, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div className="tr-mono" style={{ fontSize: 10, letterSpacing: '.3em', color: 'var(--tan-2)', textTransform: 'uppercase', marginBottom: 8 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <h1 className="tr-display" style={{ margin: 0, fontSize: 54, fontWeight: 600, letterSpacing: '-0.03em', lineHeight: 1 }}>
            The <em style={{ fontWeight: 400, color: 'var(--burgundy)' }}>Read</em>
          </h1>
          <div style={{ marginTop: 10 }}><Ornament /></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <NeuInput icon="search" placeholder="Search essays, authors, tags…" value="" onChange={() => {}} style={{ width: 280 }} />
          <NeuButton primary icon="feather" onClick={() => nav('write')}>Compose</NeuButton>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <div className="tr-mono" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--ink-3)', textTransform: 'uppercase', marginRight: 6 }}>Filter</div>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'neu-inset' : 'neu-flat neu-press'} style={{
            border: 'none', padding: '7px 15px', borderRadius: 999,
            fontSize: 12.5, fontWeight: filter === f ? 600 : 500,
            color: filter === f ? 'var(--burgundy)' : 'var(--ink-2)',
            cursor: 'pointer', fontFamily: 'Inter, sans-serif',
          }}>{f}</button>
        ))}
      </div>

      <NeuCard padded={false} style={{ padding: '8px 18px' }}>
        {loading ? <FeedSkeleton /> : filtered.length === 0
          ? <p style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-3)' }}>No essays found.</p>
          : filtered.map(p => <FeedPostRow key={p.id} post={p} onOpen={p => nav('post', p)} />)
        }
      </NeuCard>
    </div>
  );
};

// ── Feed Mobile ───────────────────────────────────────────────────────────────
export const FeedMobile: React.FC<{ nav: (r: any, p?: Post) => void }> = ({ nav }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [filter, setFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([postsApi.list(), tagsApi.list()])
      .then(([ps, ts]) => { setPosts(ps); setAllTags(ts); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filters = ['All', 'Featured', ...allTags.map(t => t.name)];

  const filtered = posts.filter(p => {
    if (filter === 'All') return true;
    if (filter === 'Featured') return p.featured;
    return p.tags.some(t => t.name === filter);
  });

  return (
    <div style={{ padding: '14px 16px 90px' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div className="tr-mono" style={{ fontSize: 9, letterSpacing: '.25em', color: 'var(--tan-2)', textTransform: 'uppercase', marginBottom: 4 }}>
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
        </div>
        <h1 className="tr-display" style={{ margin: 0, fontSize: 38, fontWeight: 600, letterSpacing: '-0.02em' }}>
          The <em style={{ fontWeight: 400, color: 'var(--burgundy)' }}>Read</em>
        </h1>
      </div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 14, overflowX: 'auto', paddingBottom: 4 }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} className={filter === f ? 'neu-inset' : 'neu-flat'} style={{
            border: 'none', padding: '7px 13px', borderRadius: 999,
            fontSize: 12, fontWeight: 500, flexShrink: 0,
            color: filter === f ? 'var(--burgundy)' : 'var(--ink-2)',
            background: 'var(--paper)',
          }}>{f}</button>
        ))}
      </div>
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[1, 2].map(i => <div key={i} className="neu" style={{ height: 220, borderRadius: 18 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {filtered.map(p => <FeedMobileCard key={p.id} post={p} onOpen={p => nav('post', p)} />)}
        </div>
      )}
    </div>
  );
};
