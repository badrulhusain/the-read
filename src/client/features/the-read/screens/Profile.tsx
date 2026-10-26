import React, { useEffect, useState } from 'react';
import { Avatar, NeuButton, NeuCard, SectionHeading } from '../components/ui';
import { Icon } from '../components/Icon';
import { postsApi } from '../api';
import type { Author, Post } from '../types';

// ── Profile header ────────────────────────────────────────────────────────────
const ProfileHeader: React.FC<{ user: Author; compact?: boolean; nav?: (r: any) => void }> = ({ user, compact = false, nav }) => (
  <div className="neu" style={{ borderRadius: 'var(--radius)', padding: compact ? 20 : '32px 36px', position: 'relative', overflow: 'hidden' }}>
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0, height: compact ? 80 : 120,
      background: 'linear-gradient(135deg, var(--burgundy) 0%, #4a1818 60%, var(--tan-2) 100%)',
      opacity: .85,
    }} />
    <div className="tr-display" style={{
      position: 'absolute', right: 20, top: compact ? -20 : -10,
      fontSize: compact ? 100 : 160, color: 'rgba(245,241,234,.1)',
      fontStyle: 'italic', fontWeight: 700, pointerEvents: 'none', lineHeight: 1,
    }}>R</div>
    <div style={{ position: 'relative', display: 'flex', alignItems: compact ? 'flex-end' : 'center', gap: compact ? 14 : 22, marginTop: compact ? 30 : 50 }}>
      <div style={{ boxShadow: '0 0 0 4px var(--paper)', borderRadius: '50%' }}>
        <Avatar user={user} size={compact ? 72 : 110} />
      </div>
      <div style={{ flex: 1, paddingTop: compact ? 0 : 30 }}>
        <div className="tr-mono" style={{ fontSize: 10, letterSpacing: '.25em', color: 'var(--tan-2)', textTransform: 'uppercase', marginBottom: 4 }}>
          {user.role === 'ADMIN' ? 'Faculty · Editor' : user.role === 'AUTHOR' ? 'Contributor' : 'Reader'} · {user.year}
        </div>
        <h1 className="tr-display" style={{ margin: 0, fontSize: compact ? 24 : 36, fontWeight: 600, letterSpacing: '-0.02em' }}>{user.name}</h1>
        <div style={{ fontSize: compact ? 12 : 14, color: 'var(--ink-2)', marginTop: 4 }}>
          {user.dept ? `${user.dept} · ` : ''}@{user.name.toLowerCase().replace(/\s/g, '.')}
        </div>
      </div>
      {!compact && (
        <div style={{ display: 'flex', gap: 8, paddingTop: 30 }}>
          <NeuButton icon="settings">Edit profile</NeuButton>
          <NeuButton primary icon="feather" onClick={() => nav?.('write')}>New essay</NeuButton>
        </div>
      )}
    </div>
  </div>
);

// ── Stat tile ──────────────────────────────��──────────────────────────────────
const StatTile: React.FC<{ label: string; value: string | number; sub?: string }> = ({ label, value, sub }) => (
  <div className="neu-flat" style={{ padding: '18px 20px', borderRadius: 'calc(var(--radius) * 0.8)', textAlign: 'center' }}>
    <div className="tr-serif" style={{ fontSize: 34, fontWeight: 600, color: 'var(--burgundy)', lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{sub}</div>}
    <div className="tr-mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--tan-2)', textTransform: 'uppercase', marginTop: 6 }}>{label}</div>
  </div>
);

// ── Post row ────────────────────────────────────────────────────────────���─────
const PostRow: React.FC<{
  post: Post;
  onOpen: (p: Post) => void;
  onEdit?: (p: Post) => void;
  onDelete?: (id: string) => void;
  compact?: boolean;
}> = ({ post, onOpen, onEdit, onDelete, compact }) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this post?')) return;
    setDeleting(true);
    try {
      await postsApi.delete(post.id);
      onDelete?.(post.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div className="neu-row hover-lift" onClick={() => onOpen(post)} style={{
      display: 'flex', gap: compact ? 12 : 16,
      padding: compact ? '13px 14px' : '16px 18px',
      borderRadius: compact ? 14 : 16,
      cursor: 'pointer',
      marginBottom: compact ? 10 : 12,
    }}>
      <div style={{
        width: compact ? 60 : 72, height: compact ? 60 : 72, borderRadius: compact ? 8 : 10,
        background: post.cover,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fbf8f2', fontSize: compact ? 22 : 28, flexShrink: 0,
        boxShadow: '2px 2px 8px var(--sh-hi)',
      }}>{post.coverAccent}</div>
      <div style={{ flex: 1 }}>
        {!compact && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 6 }}>
            {post.tags.slice(0, 2).map(t => (
              <span key={t.id} style={{ fontSize: 10, fontWeight: 600, color: t.hue }}>{t.name}</span>
            ))}
          </div>
        )}
        <h4 className="tr-serif" style={{ margin: `0 0 4px`, fontSize: compact ? 14 : 17, fontWeight: 600, lineHeight: 1.25 }}>{post.title}</h4>
        <div style={{ display: 'flex', gap: compact ? 10 : 12, color: 'var(--ink-3)', fontSize: compact ? 11 : 11.5, alignItems: 'center' }}>
          <span>{post.readTime} min</span>
          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Icon name="eye" size={compact ? 11 : 12} />{post.views}</span>
          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Icon name="comment" size={compact ? 11 : 12} />{post.comments}</span>
          {(onEdit || onDelete) && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }} onClick={e => e.stopPropagation()}>
              {onEdit && (
                <button onClick={e => { e.stopPropagation(); onEdit(post); }} style={{
                  background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer',
                  fontSize: 11, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3, padding: 0,
                }}>
                  <Icon name="edit" size={11} /> Edit
                </button>
              )}
              {onDelete && (
                <button onClick={handleDelete} disabled={deleting} style={{
                  background: 'none', border: 'none', color: 'var(--burgundy)', cursor: 'pointer',
                  fontSize: 11, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3, padding: 0,
                  opacity: deleting ? 0.5 : 1,
                }}>
                  <Icon name="trash" size={11} /> {deleting ? 'Deleting…' : 'Delete'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Profile Desktop ───────────────────────────────────────────────────────────
export const ProfileDesktop: React.FC<{ user: Author; nav: (r: any, p?: Post) => void }> = ({ user, nav }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi.list({ limit: 50 })
      .then(all => setPosts(all.filter(p => p.author.id === user.id)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  const totalViews = posts.reduce((s, p) => s + p.views, 0);

  return (
    <div style={{ padding: '28px 32px 60px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <ProfileHeader user={user} nav={nav} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <StatTile label="Essays" value={posts.length} />
        <StatTile label="Total reads" value={totalViews > 999 ? `${(totalViews / 1000).toFixed(1)}k` : totalViews} />
        <StatTile label="Role" value={user.role === 'ADMIN' ? 'Admin' : user.role === 'AUTHOR' ? 'Author' : 'Reader'} />
        <StatTile label="Member" value={user.year || '—'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        <div>
          <SectionHeading eyebrow="Published" title="Essays" />
          {loading ? (
            [1, 2, 3].map(i => (
          <div key={i} className="neu-row-soft" style={{ display: 'flex', gap: 16, padding: '16px 18px', borderRadius: 16, marginBottom: 12 }}>
                <div className="neu-inset" style={{ width: 72, height: 72, borderRadius: 10 }} />
                <div style={{ flex: 1 }}>
                  <div className="neu-inset" style={{ height: 14, width: '70%', borderRadius: 6, marginBottom: 8 }} />
                  <div className="neu-inset" style={{ height: 10, width: '40%', borderRadius: 6 }} />
                </div>
              </div>
            ))
          ) : posts.length === 0 ? (
            <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>No essays published yet.</p>
          ) : (
            posts.slice(0, 6).map(p => (
              <PostRow
                key={p.id}
                post={p}
                onOpen={p => nav('post', p)}
                onEdit={p => nav('write', p)}
                onDelete={id => setPosts(ps => ps.filter(x => x.id !== id))}
              />
            ))
          )}
        </div>

        <NeuCard>
          <div className="tr-mono" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--tan-2)', textTransform: 'uppercase', marginBottom: 12 }}>About</div>
          <p className="tr-serif" style={{ margin: '0 0 16px', fontSize: 15, lineHeight: 1.6, color: 'var(--ink-2)', fontStyle: 'italic' }}>
            "Contributor to The Read campus journal."
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--ink-2)' }}>
            {user.dept && <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name="book" size={14} />{user.dept}</div>}
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name="globe" size={14} />Ashworth College</div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}><Icon name="mail" size={14} />
              {user.name.toLowerCase().replace(/[\s.]+/g, '.')}@ashworth.edu
            </div>
          </div>
        </NeuCard>
      </div>
    </div>
  );
};

// ── Profile Mobile ──────────────────────────────────────────────────────���─────
export const ProfileMobile: React.FC<{ user: Author; nav: (r: any, p?: Post) => void }> = ({ user, nav }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi.list({ limit: 50 })
      .then(all => setPosts(all.filter(p => p.author.id === user.id)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user.id]);

  return (
    <div style={{ padding: '14px 16px 90px' }}>
      <ProfileHeader user={user} compact />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16, marginBottom: 20 }}>
        <StatTile label="Essays" value={posts.length} />
        <StatTile label="Total reads" value={posts.reduce((s, p) => s + p.views, 0)} />
      </div>
      <SectionHeading eyebrow="Published" title="Essays" />
      {loading ? (
        [1, 2].map(i => (
          <div key={i} className="neu-row-soft" style={{ display: 'flex', gap: 12, padding: '13px 14px', borderRadius: 14, marginBottom: 10 }}>
            <div className="neu-inset" style={{ width: 60, height: 60, borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <div className="neu-inset" style={{ height: 14, width: '70%', borderRadius: 6, marginBottom: 8 }} />
              <div className="neu-inset" style={{ height: 10, width: '40%', borderRadius: 6 }} />
            </div>
          </div>
        ))
      ) : posts.length === 0 ? (
        <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>No essays published yet.</p>
      ) : (
        posts.map(p => (
          <PostRow
            key={p.id}
            post={p}
            onOpen={p => nav('post', p)}
            onEdit={p => nav('write', p)}
            onDelete={id => setPosts(ps => ps.filter(x => x.id !== id))}
            compact
          />
        ))
      )}
    </div>
  );
};
