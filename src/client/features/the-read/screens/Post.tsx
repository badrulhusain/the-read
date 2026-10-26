import React, { useEffect, useState } from 'react';
import { Avatar, Divider, NeuButton, NeuCard, Ornament, Pill } from '../components/ui';
import { Icon } from '../components/Icon';
import { commentsApi, postsApi } from '../api';
import { formatDate, relTime } from '../data';
import type { Author, ContentBlock, Post } from '../types';
import type { ApiComment } from '../api';

// ── Content block renderer ────────────────────────────────────────────────────
const renderBlock = (block: ContentBlock, i: number) => {
  if (block.type === 'p') return (
    <p key={i} style={{ margin: '0 0 18px', fontSize: 17, lineHeight: 1.75, color: 'var(--ink)', fontFamily: "'Fraunces',serif" }}>{block.text}</p>
  );
  if (block.type === 'h2') return (
    <h2 key={i} className="tr-serif" style={{ margin: '32px 0 16px', fontSize: 26, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{block.text}</h2>
  );
  if (block.type === 'pull') return (
    <aside key={i} className="neu-row-soft" style={{
      margin: '28px -10px', padding: '20px 28px',
      borderLeft: '3px solid var(--burgundy)',
      borderRadius: 16,
      fontFamily: "'Fraunces',serif", fontStyle: 'italic',
      fontSize: 22, lineHeight: 1.45, color: 'var(--burgundy)',
      fontWeight: 400, letterSpacing: '-0.01em',
    }}>
      <Icon name="quote" size={24} stroke="var(--tan-2)" />
      <div style={{ marginTop: 8 }}>{block.text}</div>
    </aside>
  );
  return null;
};

// ── Post actions ──────────────────────────────────────────────────────────────
const PostActions: React.FC<{ post: Post; commentCount: number; views: number; vertical?: boolean }> = ({ post, commentCount, views, vertical = false }) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.reactions);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    postsApi.getLikeStatus(post.id)
      .then(({ liked: isLiked, likeCount: count }) => {
        setLiked(isLiked);
        setLikeCount(count);
      })
      .catch(() => {});
  }, [post.id]);

  const handleLike = async () => {
    try {
      const result = await postsApi.toggleLike(post.id);
      setLiked(result.liked);
      setLikeCount(result.likeCount);
    } catch {
      setLiked(l => !l);
      setLikeCount(c => liked ? c - 1 : c + 1);
    }
  };

  const items = [
    { icon: 'heart', count: likeCount, active: liked, onClick: handleLike, color: 'var(--burgundy)' },
    { icon: 'comment', count: commentCount, active: false, onClick: () => {} },
    { icon: 'eye', count: views, active: false, onClick: () => {} },
    { icon: 'bookmark', count: undefined, active: saved, onClick: () => setSaved(s => !s), color: 'var(--tan-2)' },
    { icon: 'share', count: undefined, active: false, onClick: () => {} },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: vertical ? 'column' : 'row', gap: 8, alignItems: 'center' }}>
      {items.map((it, i) => (
        <button key={i} onClick={it.onClick}
          className={it.active ? 'neu-inset' : 'neu-flat neu-press hover-lift'}
          style={{
            border: 'none',
            display: 'flex', flexDirection: vertical ? 'column' : 'row',
            gap: vertical ? 2 : 6, alignItems: 'center',
            padding: vertical ? '10px 8px' : '9px 14px',
            borderRadius: vertical ? 14 : 999,
            minWidth: vertical ? 52 : undefined,
            color: it.active ? (it.color ?? 'var(--burgundy)') : 'var(--ink-2)',
            fontSize: 12, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'Inter,sans-serif',
            background: 'var(--paper)',
          }}
        >
          <Icon name={it.icon} size={16} stroke={it.active ? (it.color ?? 'var(--burgundy)') : 'var(--ink-2)'} fill={it.active && it.icon === 'heart' ? (it.color ?? 'var(--burgundy)') : 'none'} />
          {it.count !== undefined && <span style={{ fontSize: vertical ? 10 : 12 }}>{it.count}</span>}
        </button>
      ))}
    </div>
  );
};

// ── Comment row ───────────────────────────────────────────────────────────────
const CommentRow: React.FC<{
  comment: ApiComment;
  currentUserId?: string;
  onDeleted?: (id: string) => void;
  onUpdated?: (id: string, content: string) => void;
  depth?: number;
}> = ({ comment, currentUserId, onDeleted, onUpdated, depth = 0 }) => {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isOwner = !!currentUserId && currentUserId === comment.author.id;

  const author: Author = {
    id: comment.author.id,
    name: comment.author.name,
    initials: comment.author.name.split(' ').map((p: string) => p[0]).join('').slice(0, 2).toUpperCase(),
    role: 'USER',
    dept: '',
    year: '',
  };

  const handleSave = async () => {
    if (!editText.trim() || editText.trim() === comment.content) { setEditing(false); return; }
    setSaving(true);
    try {
      await commentsApi.update(comment.id, editText.trim());
      onUpdated?.(comment.id, editText.trim());
      setEditing(false);
    } catch {
      // stay in editing state so user can retry
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this comment?')) return;
    setDeleting(true);
    try {
      await commentsApi.delete(comment.id);
      onDeleted?.(comment.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <div style={{ marginLeft: depth > 0 ? 36 : 0 }}>
      <div className={depth === 0 ? 'neu-row-soft' : ''} style={{ display: 'flex', gap: 12, padding: depth === 0 ? '14px' : '14px 0', borderRadius: depth === 0 ? 14 : undefined, marginBottom: depth === 0 ? 10 : 0 }}>
        <Avatar user={author} size={36} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{comment.author.name}</span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>· {relTime(comment.createdAt)}</span>
            {isOwner && !editing && (
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button
                  onClick={() => { setEditText(comment.content); setEditing(true); }}
                  style={{ background: 'none', border: 'none', color: 'var(--ink-3)', cursor: 'pointer', padding: 0, fontSize: 11, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3 }}
                >
                  <Icon name="edit" size={11} /> Edit
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  style={{ background: 'none', border: 'none', color: 'var(--burgundy)', cursor: 'pointer', padding: 0, fontSize: 11, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 3, opacity: deleting ? 0.5 : 1 }}
                >
                  <Icon name="trash" size={11} /> {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div>
              <textarea
                value={editText}
                onChange={e => setEditText(e.target.value)}
                style={{
                  width: '100%', border: 'none', borderRadius: 12,
                  padding: '8px 10px', background: 'var(--paper)',
                  fontFamily: "'Fraunces',serif", fontSize: 15, color: 'var(--ink)',
                  minHeight: 60, resize: 'none', lineHeight: 1.5, outline: 'none',
                  boxShadow: 'inset 4px 4px 8px rgba(97,85,68,.14), inset -4px -4px 8px rgba(255,255,250,.8)',
                }}
              />
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <NeuButton small onClick={() => setEditing(false)}>Cancel</NeuButton>
                <NeuButton small primary onClick={handleSave}>{saving ? 'Saving…' : 'Save'}</NeuButton>
              </div>
            </div>
          ) : (
            <p className="tr-serif" style={{ margin: 0, fontSize: 15, lineHeight: 1.55, color: 'var(--ink)' }}>{comment.content}</p>
          )}
        </div>
      </div>

      {/* Nested replies */}
      {(comment.replies ?? []).length > 0 && (
        <div style={{ borderLeft: '2px solid var(--line)', marginLeft: 18, paddingLeft: 2 }}>
          {(comment.replies ?? []).map(reply => (
            <CommentRow
              key={reply.id}
              comment={reply}
              currentUserId={currentUserId}
              onDeleted={onDeleted}
              onUpdated={onUpdated}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ── Comment box ───────────────────────────────────────────────────────────────
const CommentBox: React.FC<{ user: Author; postId: string; onPosted: () => void }> = ({ user, postId, onPosted }) => {
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    if (!text.trim()) return;
    setSubmitting(true);
    setError('');
    try {
      await commentsApi.create(postId, text.trim());
      setText('');
      onPosted();
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to post comment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="neu-inset" style={{ padding: 16, borderRadius: 16, display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 20 }}>
      <Avatar user={user} size={36} />
      <div style={{ flex: 1 }}>
        <textarea
          value={text}
          onChange={e => { setText(e.target.value); setError(''); }}
          placeholder="Share a thought on this essay…"
          style={{
            width: '100%', border: 'none', outline: 'none', background: 'transparent',
            fontFamily: "'Fraunces',serif", fontSize: 15, color: 'var(--ink)',
            minHeight: 50, resize: 'none', lineHeight: 1.5,
          }}
        />
        {error && (
          <div style={{ fontSize: 12, color: 'var(--burgundy)', marginBottom: 6 }}>{error}</div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
          <NeuButton small onClick={() => { setText(''); setError(''); }}>Cancel</NeuButton>
          <NeuButton small primary icon="arrow-right" onClick={submit}>
            {submitting ? 'Posting…' : 'Post'}
          </NeuButton>
        </div>
      </div>
    </div>
  );
};

// ── Post Desktop ──────────────────────────────────────────────────────────────
export const PostDesktop: React.FC<{ post: Post; user: Author; nav: (r: any) => void }> = ({ post, user, nav }) => {
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [views, setViews] = useState(post.views);

  const loadComments = () => {
    commentsApi.listForPost(post.slug)
      .then(setComments)
      .catch(() => {});
  };

  useEffect(() => {
    loadComments();
    const key = `tr_viewed_${post.slug}`;
    if (!localStorage.getItem(key)) {
      postsApi.incrementView(post.id)
        .then(() => { localStorage.setItem(key, '1'); setViews(v => v + 1); })
        .catch(() => {});
    }
  }, [post.id]);

  const handleCommentDeleted = (id: string) => {
    setComments(cs => cs.filter(c => c.id !== id));
  };

  const handleCommentUpdated = (id: string, content: string) => {
    setComments(cs => cs.map(c => c.id === id ? { ...c, content } : c));
  };

  const commentCount = comments.length;

  return (
    <div style={{ padding: '28px 32px 60px', maxWidth: 900, margin: '0 auto' }}>
      <button onClick={() => nav('feed')} className="neu-flat neu-press" style={{
        border: 'none', padding: '8px 14px', borderRadius: 999,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 12.5, color: 'var(--ink-2)', cursor: 'pointer', fontFamily: 'Inter,sans-serif', fontWeight: 500,
        marginBottom: 24, background: 'var(--paper)',
      }}>
        <Icon name="arrow-left" size={14} /> Back to feed
      </button>

      <div style={{ textAlign: 'center', marginBottom: 30 }}>
        <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 14 }}>
          {post.tags.map(t => <Pill key={t.id} color={t.hue} small>{t.name}</Pill>)}
        </div>
        <h1 className="tr-display" style={{ margin: '0 0 18px', fontSize: 46, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.1, color: 'var(--ink)', maxWidth: 720, marginInline: 'auto' }}>
          {post.title}
        </h1>
        <div className="tr-serif" style={{ fontSize: 19, fontStyle: 'italic', color: 'var(--ink-2)', maxWidth: 620, margin: '0 auto 20px', lineHeight: 1.5 }}>
          {post.excerpt}
        </div>
        <Ornament />
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, marginTop: 18 }}>
          <Avatar user={post.author} size={42} ring />
          <div style={{ textAlign: 'left', lineHeight: 1.3 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{post.author.name}</div>
            <div style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
              {post.author.dept || post.author.year} · {formatDate(post.createdAt)} · {post.readTime} min read
              <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
                <Icon name="eye" size={11} stroke="var(--ink-3)" /> {views}
              </span>
            </div>
          </div>
          <NeuButton small primary>Follow</NeuButton>
        </div>
      </div>

      <div style={{
        height: 320, borderRadius: 16, background: post.cover,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fbf8f2', fontSize: 120, fontFamily: "'Fraunces',serif",
        marginBottom: 40, boxShadow: '14px 14px 28px var(--sh-hi), -8px -8px 18px rgba(255,255,250,.52)',
      }}>
        <div style={{ opacity: .4 }}>{post.coverAccent}</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr', gap: 30 }}>
        <div style={{ position: 'sticky', top: 20, alignSelf: 'start' }}>
          <PostActions post={post} commentCount={commentCount} views={views} vertical />
        </div>
        <article style={{ maxWidth: 680 }}>
          {(post.content.length > 0 ? post.content : [
            { type: 'p' as const, text: post.excerpt },
            { type: 'p' as const, text: 'This essay is still being drafted. Full text will be available soon.' },
          ]).map(renderBlock)}

          <Divider style={{ margin: '40px 0 24px' }} />

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
            <Icon name="tag" size={14} stroke="var(--ink-3)" />
            {post.tags.map(t => <Pill key={t.id} color={t.hue}>{t.name}</Pill>)}
          </div>

          <NeuCard>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <Avatar user={post.author} size={60} ring />
              <div style={{ flex: 1 }}>
                <div className="tr-mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--tan-2)', textTransform: 'uppercase', marginBottom: 3 }}>About the author</div>
                <div className="tr-serif" style={{ fontSize: 18, fontWeight: 600, marginBottom: 2 }}>{post.author.name}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>{post.author.year} · {post.author.dept || 'Contributor'}</div>
              </div>
              <NeuButton primary>Follow</NeuButton>
            </div>
          </NeuCard>

          <h3 className="tr-serif" style={{ fontSize: 22, fontWeight: 500, margin: '40px 0 16px' }}>
            {commentCount} {commentCount === 1 ? 'response' : 'responses'}
          </h3>
          <CommentBox user={user} postId={post.slug} onPosted={loadComments} />
          {comments.map(c => (
            <CommentRow
              key={c.id}
              comment={c}
              currentUserId={user.id}
              onDeleted={handleCommentDeleted}
              onUpdated={handleCommentUpdated}
            />
          ))}
        </article>
      </div>
    </div>
  );
};

// ── Post Mobile ───────────────────────────────────────────────────────────────
export const PostMobile: React.FC<{ post: Post; nav: (r: any) => void; user?: Author }> = ({ post, nav, user }) => {
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [views, setViews] = useState(post.views);

  const loadComments = () => {
    commentsApi.listForPost(post.slug).then(setComments).catch(() => {});
  };

  useEffect(() => {
    loadComments();
    const key = `tr_viewed_${post.slug}`;
    if (!localStorage.getItem(key)) {
      postsApi.incrementView(post.id)
        .then(() => { localStorage.setItem(key, '1'); setViews(v => v + 1); })
        .catch(() => {});
    }
  }, [post.id]);

  const handleCommentDeleted = (id: string) => {
    setComments(cs => cs.filter(c => c.id !== id));
  };

  const handleCommentUpdated = (id: string, content: string) => {
    setComments(cs => cs.map(c => c.id === id ? { ...c, content } : c));
  };

  const commentCount = comments.length;

  return (
    <div style={{ padding: '14px 18px 90px' }}>
      <button onClick={() => nav('feed')} className="neu-flat neu-press" style={{
        border: 'none', padding: '6px 12px', borderRadius: 999,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontSize: 12, color: 'var(--ink-2)', marginBottom: 18, fontFamily: 'Inter,sans-serif', background: 'var(--paper)',
      }}>
        <Icon name="arrow-left" size={13} /> Back
      </button>
      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
        {post.tags.map(t => <Pill key={t.id} color={t.hue} small>{t.name}</Pill>)}
      </div>
      <h1 className="tr-display" style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.15 }}>{post.title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <Avatar user={post.author} size={32} ring />
        <div style={{ flex: 1, lineHeight: 1.25 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{post.author.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', display: 'flex', gap: 6, alignItems: 'center' }}>
            {formatDate(post.createdAt)} · {post.readTime} min
            <span style={{ display: 'inline-flex', gap: 3, alignItems: 'center' }}>
              <Icon name="eye" size={10} stroke="var(--ink-3)" /> {views}
            </span>
          </div>
        </div>
      </div>
      <div style={{
        height: 180, borderRadius: 14, background: post.cover,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#fbf8f2', fontSize: 68, fontFamily: "'Fraunces',serif", marginBottom: 22,
        boxShadow: '10px 10px 22px var(--sh-hi), -5px -5px 14px rgba(255,255,250,.42)',
      }}>
        <div style={{ opacity: .4 }}>{post.coverAccent}</div>
      </div>
      <article>
        {(post.content.length > 0 ? post.content : [{ type: 'p' as const, text: post.excerpt }]).map((b, i) => {
          if (b.type === 'p') return <p key={i} className="tr-serif" style={{ margin: '0 0 14px', fontSize: 15, lineHeight: 1.7, color: 'var(--ink)' }}>{b.text}</p>;
          if (b.type === 'h2') return <h2 key={i} className="tr-serif" style={{ margin: '20px 0 10px', fontSize: 19, fontWeight: 500 }}>{b.text}</h2>;
          if (b.type === 'pull') return <aside key={i} className="neu-row-soft" style={{ margin: '16px 0', padding: '12px 16px', borderLeft: '3px solid var(--burgundy)', borderRadius: 14, fontFamily: "'Fraunces',serif", fontStyle: 'italic', fontSize: 17, color: 'var(--burgundy)', lineHeight: 1.4 }}>{b.text}</aside>;
          return null;
        })}
      </article>
      {user && (
        <div style={{ marginTop: 24 }}>
          <h3 className="tr-serif" style={{ fontSize: 18, fontWeight: 500, margin: '0 0 12px' }}>
            {commentCount} {commentCount === 1 ? 'response' : 'responses'}
          </h3>
          <CommentBox user={user} postId={post.slug} onPosted={loadComments} />
          {comments.map(c => (
            <CommentRow
              key={c.id}
              comment={c}
              currentUserId={user?.id}
              onDeleted={handleCommentDeleted}
              onUpdated={handleCommentUpdated}
            />
          ))}
        </div>
      )}
      <div style={{ position: 'sticky', bottom: 70, zIndex: 10, marginTop: 24 }}>
        <div className="neu" style={{ padding: 10, borderRadius: 999, display: 'flex', justifyContent: 'space-around' }}>
          <PostActions post={post} commentCount={commentCount} views={views} />
        </div>
      </div>
    </div>
  );
};
