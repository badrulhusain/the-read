import React, { useEffect, useRef, useState } from 'react';
import { NeuButton, NeuCard, Ornament, Pill } from '../components/ui';
import { Icon } from '../components/Icon';
import { postsApi, tagsApi, uploadsApi } from '../api';
import type { Author, Post, Tag } from '../types';

// ── Toolbar ───────────────────────────────────────────────────────────────────
const ComposeToolbar: React.FC = () => (
  <div className="neu-flat" style={{ display: 'flex', gap: 4, padding: 6, borderRadius: 12, alignSelf: 'flex-start' }}>
    {[
      { label: 'B', bold: true },
      { label: 'I', italic: true },
      { icon: 'quote' },
      { icon: 'image' },
      { icon: 'tag' },
    ].map((t, i) => (
      <button key={i} className="neu-flat neu-press" style={{
        width: 34, height: 34, border: 'none', background: 'var(--paper)',
        borderRadius: 8, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: 'var(--ink-2)',
        fontFamily: "'Fraunces',serif",
        fontWeight: t.bold ? 700 : 400,
        fontStyle: t.italic ? 'italic' : 'normal',
        fontSize: 15,
      }}>
        {t.label ? t.label : <Icon name={t.icon!} size={15} />}
      </button>
    ))}
  </div>
);

// ── Write Desktop ─────────────────────────────────────────────────────────────
export const WriteDesktop: React.FC<{ user: Author; nav: (r: any) => void; editPost?: Post }> = ({ user, nav, editPost }) => {
  const [title, setTitle] = useState(editPost?.title ?? '');
  const [excerpt, setExcerpt] = useState(editPost?.excerpt ?? '');
  const [body, setBody] = useState(editPost?.rawContent ?? '');
  const [coverImage, setCoverImage] = useState<string | null>(editPost?.coverImageUrl ?? null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(editPost?.tags.map(t => t.id) ?? []);
  const [status, setStatus] = useState<'DRAFT' | 'PUBLISHED'>(editPost?.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    tagsApi.list().then(setAvailableTags).catch(() => {});
  }, []);

  const toggleTag = (id: string) =>
    setSelectedTagIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadsApi.uploadImage(file);
      setCoverImage(url);
    } catch {
      // upload failed — stay uncovered
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleAddTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    try {
      const tag = await tagsApi.create(name);
      setAvailableTags(ts => [...ts, tag]);
      setSelectedTagIds(s => [...s, tag.id]);
      setNewTagName('');
      setAddingTag(false);
    } catch {
      // tag creation failed
    }
  };

  const wordCount = body.split(/\s+/).filter(Boolean).length;

  const handleSubmit = async () => {
    if (!title.trim()) { setSubmitError('Please add a title before publishing.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        title: title.trim(),
        content: body,
        excerpt: excerpt.trim() || undefined,
        coverImage: coverImage ?? null,
        tagIds: selectedTagIds,
        status,
      };
      if (editPost) {
        await postsApi.update(editPost.id, payload);
      } else {
        await postsApi.create({ ...payload, coverImage: payload.coverImage ?? undefined });
      }
      setSaved(true);
      setTimeout(() => nav('profile'), 1200);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setSubmitError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Something went wrong. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 26, padding: '22px 32px 40px' }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
          <button onClick={() => nav('feed')} className="neu-flat neu-press" style={{
            border: 'none', padding: '8px 12px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 12.5, color: 'var(--ink-2)', cursor: 'pointer', fontFamily: 'Inter,sans-serif', background: 'var(--paper)',
          }}>
            <Icon name="arrow-left" size={14} /> Back
          </button>
          <div className="tr-mono" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--tan-2)', textTransform: 'uppercase', marginLeft: 8 }}>
            {editPost ? 'Editing' : 'Composing'} · {status === 'DRAFT' ? 'Draft' : 'Publishing'}
          </div>
          <div style={{ flex: 1 }} />
          {saved && (
            <Pill color="var(--moss)">
              <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--moss)', display: 'inline-block' }} /> published
            </Pill>
          )}
        </div>

        <NeuCard style={{ padding: '36px 44px' }}>
          <div className="tr-mono" style={{ fontSize: 10, letterSpacing: '.25em', color: 'var(--tan-2)', textTransform: 'uppercase', marginBottom: 10 }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · {user.name}
          </div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="A title worth the read…"
            style={{
              width: '100%', border: 'none', outline: 'none', background: 'transparent',
              fontFamily: "'Fraunces',serif", fontSize: 40, fontWeight: 600,
              letterSpacing: '-0.02em', color: 'var(--ink)', marginBottom: 4,
            }}
          />
          <input
            value={excerpt}
            onChange={e => setExcerpt(e.target.value)}
            placeholder="A standfirst — what should the reader know first?"
            style={{
              width: '100%', border: 'none', outline: 'none', background: 'transparent',
              fontFamily: "'Fraunces',serif", fontSize: 18, fontStyle: 'italic',
              color: 'var(--ink-2)', marginBottom: 18,
            }}
          />
          <Ornament size={80} />
          <div style={{ margin: '18px 0 14px' }}>
            <ComposeToolbar />
          </div>
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="Begin the essay…"
            style={{
              width: '100%', border: 'none', outline: 'none', background: 'transparent',
              fontFamily: "'Fraunces',serif", fontSize: 17, lineHeight: 1.75,
              color: 'var(--ink)', minHeight: 360, resize: 'vertical',
            }}
          />
          <div className="neu-row-soft" style={{ display: 'flex', gap: 12, color: 'var(--ink-3)', fontSize: 12, marginTop: 12, borderRadius: 12, padding: '10px 12px' }}>
            <span>{wordCount} words</span>
            <span>· ~{Math.max(1, Math.round(wordCount / 200))} min read</span>
          </div>
        </NeuCard>
      </div>

      {/* Side panel */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <NeuCard>
          <div className="tr-mono" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--tan-2)', textTransform: 'uppercase', marginBottom: 12 }}>Publish</div>
          <div className="neu-inset" style={{ display: 'flex', padding: 4, borderRadius: 12, marginBottom: 14 }}>
            {(['DRAFT', 'PUBLISHED'] as const).map(s => (
              <button key={s} onClick={() => setStatus(s)} className={status === s ? 'neu-flat' : ''} style={{
                flex: 1, border: 'none', background: status === s ? 'var(--paper)' : 'transparent',
                padding: '8px 10px', borderRadius: 9,
                fontSize: 12, fontWeight: status === s ? 600 : 500,
                color: status === s ? 'var(--burgundy)' : 'var(--ink-3)',
                cursor: 'pointer', fontFamily: 'Inter,sans-serif',
              }}>{s === 'DRAFT' ? 'Save draft' : 'Publish'}</button>
            ))}
          </div>
          {submitError && (
            <div style={{ fontSize: 11.5, color: 'var(--burgundy)', marginBottom: 10, lineHeight: 1.4 }}>{submitError}</div>
          )}
          <NeuButton primary icon={status === 'PUBLISHED' ? 'feather' : 'bookmark'} onClick={handleSubmit} style={{ width: '100%', justifyContent: 'center' }}>
            {submitting ? 'Saving…' : status === 'PUBLISHED' ? 'Publish to The Read' : 'Save draft'}
          </NeuButton>
        </NeuCard>

        {/* Cover */}
        <NeuCard>
          <div className="tr-mono" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--tan-2)', textTransform: 'uppercase', marginBottom: 12 }}>Cover</div>
          <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />
          <div
            className="neu-inset"
            onClick={() => !uploadingCover && coverInputRef.current?.click()}
            style={{
              height: 120, borderRadius: 12, overflow: 'hidden',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 6, cursor: uploadingCover ? 'wait' : 'pointer', position: 'relative',
            }}
          >
            {coverImage ? (
              <>
                <img src={coverImage} alt="cover" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                <div style={{
                  position: 'absolute', inset: 0, background: 'rgba(0,0,0,.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  opacity: 0, transition: 'opacity .2s',
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
                >
                  <span style={{ color: '#fff', fontSize: 12, fontFamily: 'Inter,sans-serif' }}>Change</span>
                </div>
              </>
            ) : uploadingCover ? (
              <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'Inter,sans-serif' }}>Uploading…</span>
            ) : (
              <>
                <Icon name="image" size={24} />
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>Add a cover</span>
              </>
            )}
          </div>
          {coverImage && (
            <button onClick={() => setCoverImage(null)} style={{
              marginTop: 8, border: 'none', background: 'none', fontSize: 11,
              color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
            }}>Remove cover</button>
          )}
        </NeuCard>

        {/* Tags */}
        <NeuCard>
          <div className="tr-mono" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--tan-2)', textTransform: 'uppercase', marginBottom: 12 }}>Tags</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {availableTags.map(t => (
              <button key={t.id} onClick={() => toggleTag(t.id)} className={selectedTagIds.includes(t.id) ? '' : 'neu-flat neu-press'} style={{
                border: 'none', padding: '6px 12px', borderRadius: 999,
                background: selectedTagIds.includes(t.id) ? t.hue : undefined,
                color: selectedTagIds.includes(t.id) ? '#fbf8f2' : 'var(--ink-2)',
                fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
                boxShadow: selectedTagIds.includes(t.id) ? '2px 2px 6px rgba(0,0,0,.15)' : undefined,
              }}>{t.name}</button>
            ))}
          </div>
          {addingTag ? (
            <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
              <input
                autoFocus
                value={newTagName}
                onChange={e => setNewTagName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); if (e.key === 'Escape') { setAddingTag(false); setNewTagName(''); } }}
                placeholder="Tag name…"
                style={{
                  flex: 1, border: 'none', borderRadius: 999,
                  padding: '5px 10px', fontSize: 12, fontFamily: 'Inter,sans-serif',
                  background: 'var(--paper)', color: 'var(--ink)', outline: 'none',
                  boxShadow: 'inset 4px 4px 8px rgba(97,85,68,.14), inset -4px -4px 8px rgba(255,255,250,.78)',
                }}
              />
              <button onClick={handleAddTag} className="neu-flat neu-press" style={{
                border: 'none', padding: '5px 10px', borderRadius: 999,
                fontSize: 12, fontWeight: 600, color: 'var(--burgundy)',
                cursor: 'pointer', fontFamily: 'Inter,sans-serif',
              }}>Add</button>
            </div>
          ) : (
            <button onClick={() => setAddingTag(true)} style={{
              marginTop: 10, border: 'none', background: 'none', fontSize: 11.5,
              color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
              display: 'inline-flex', alignItems: 'center', gap: 4,
            }}>
              <Icon name="plus" size={11} /> New tag
            </button>
          )}
        </NeuCard>

        <NeuCard>
          <div className="tr-mono" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--tan-2)', textTransform: 'uppercase', marginBottom: 12 }}>Editorial check</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 12.5 }}>
            {[
              { ok: title.length > 0 && title.length <= 80, text: 'Title under 80 characters' },
              { ok: excerpt.length > 0, text: 'Standfirst present' },
              { ok: selectedTagIds.length > 0, text: 'At least one tag selected' },
              { ok: body.length > 100, text: 'Body content present' },
            ].map((c, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', color: c.ok ? 'var(--moss)' : 'var(--ink-3)' }}>
                <Icon name={c.ok ? 'check' : 'x'} size={13} /> {c.text}
              </div>
            ))}
          </div>
        </NeuCard>
      </div>
    </div>
  );
};

// ── Write Mobile ──────────────────────────────────────────────────────────────
export const WriteMobile: React.FC<{ user: Author; nav: (r: any) => void; editPost?: Post }> = ({ nav, editPost }) => {
  const [title, setTitle] = useState(editPost?.title ?? '');
  const [excerpt, setExcerpt] = useState(editPost?.excerpt ?? '');
  const [body, setBody] = useState(editPost?.rawContent ?? '');
  const [coverImage, setCoverImage] = useState<string | null>(editPost?.coverImageUrl ?? null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(editPost?.tags.map(t => t.id) ?? []);
  const [newTagName, setNewTagName] = useState('');
  const [addingTag, setAddingTag] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    tagsApi.list().then(setAvailableTags).catch(() => {});
  }, []);

  const toggleTag = (id: string) =>
    setSelectedTagIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const url = await uploadsApi.uploadImage(file);
      setCoverImage(url);
    } catch {
      // upload failed
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  const handleAddTag = async () => {
    const name = newTagName.trim();
    if (!name) return;
    try {
      const tag = await tagsApi.create(name);
      setAvailableTags(ts => [...ts, tag]);
      setSelectedTagIds(s => [...s, tag.id]);
      setNewTagName('');
      setAddingTag(false);
    } catch {
      // tag creation failed
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) { setSubmitError('Please add a title.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        title: title.trim(),
        content: body,
        excerpt: excerpt.trim() || undefined,
        tagIds: selectedTagIds,
        status: 'PUBLISHED' as const,
      };
      if (editPost) {
        await postsApi.update(editPost.id, { ...payload, coverImage: coverImage });
      } else {
        await postsApi.create({ ...payload, coverImage: coverImage ?? undefined });
      }
      nav('profile');
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setSubmitError(Array.isArray(msg) ? msg.join(', ') : (msg ?? 'Something went wrong. Please try again.'));
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '14px 16px 90px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <button onClick={() => nav('feed')} className="neu-flat neu-press" style={{
          border: 'none', padding: '6px 12px', borderRadius: 999,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 12, color: 'var(--ink-2)', fontFamily: 'Inter,sans-serif', background: 'var(--paper)',
        }}>
          <Icon name="arrow-left" size={13} /> Back
        </button>
        <div style={{ flex: 1 }} />
        {submitError && (
          <span style={{ fontSize: 11, color: 'var(--burgundy)', maxWidth: 140, lineHeight: 1.3 }}>{submitError}</span>
        )}
        <NeuButton small primary onClick={handlePublish}>{submitting ? 'Publishing…' : 'Publish'}</NeuButton>
      </div>

      {/* Cover strip */}
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverChange} />
      <div
        onClick={() => !uploadingCover && coverInputRef.current?.click()}
        style={{
          height: 80, borderRadius: 12, marginBottom: 14, overflow: 'hidden',
          background: coverImage ? 'none' : 'var(--paper)',
          border: coverImage ? 'none' : '1px solid rgba(255,255,250,.58)',
          boxShadow: coverImage ? '10px 10px 22px var(--sh-hi), -5px -5px 14px rgba(255,255,250,.42)' : 'inset 6px 6px 12px rgba(97,85,68,.14), inset -6px -6px 12px rgba(255,255,250,.82)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, color: 'var(--ink-3)', cursor: uploadingCover ? 'wait' : 'pointer',
          position: 'relative',
        }}
      >
        {coverImage ? (
          <img src={coverImage} alt="cover" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : uploadingCover ? (
          <span style={{ fontSize: 12, fontFamily: 'Inter,sans-serif' }}>Uploading…</span>
        ) : (
          <>
            <Icon name="image" size={18} />
            <span style={{ fontSize: 12, fontFamily: 'Inter,sans-serif' }}>Add cover</span>
          </>
        )}
      </div>

      <NeuCard style={{ padding: 20 }}>
        <div className="tr-mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--tan-2)', textTransform: 'uppercase', marginBottom: 8 }}>Draft</div>
        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="A title worth the read…" style={{
          width: '100%', border: 'none', outline: 'none', background: 'transparent',
          fontFamily: "'Fraunces',serif", fontSize: 26, fontWeight: 600, letterSpacing: '-0.02em', marginBottom: 8,
        }} />
        <input value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="Standfirst…" style={{
          width: '100%', border: 'none', outline: 'none', background: 'transparent',
          fontFamily: "'Fraunces',serif", fontSize: 14, fontStyle: 'italic', color: 'var(--ink-2)', marginBottom: 12,
        }} />
        <Ornament size={60} />
        <textarea
          value={body}
          onChange={e => setBody(e.target.value)}
          placeholder="Begin the essay…"
          style={{
            width: '100%', border: 'none', outline: 'none', background: 'transparent',
            fontFamily: "'Fraunces',serif", fontSize: 15, lineHeight: 1.7, minHeight: 260, resize: 'none', marginTop: 12,
          }}
        />
      </NeuCard>

      {/* Tags */}
      <div style={{ marginTop: 14, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {availableTags.slice(0, 8).map(t => (
          <button key={t.id} onClick={() => toggleTag(t.id)} className={selectedTagIds.includes(t.id) ? '' : 'neu-flat neu-press'} style={{
            border: 'none', padding: '6px 11px', borderRadius: 999, fontSize: 11,
            background: selectedTagIds.includes(t.id) ? t.hue : 'var(--paper)',
            color: selectedTagIds.includes(t.id) ? '#fbf8f2' : 'var(--ink-2)',
            fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter,sans-serif',
          }}>{t.name}</button>
        ))}
        {addingTag ? (
          <div style={{ display: 'flex', gap: 5 }}>
            <input
              autoFocus
              value={newTagName}
              onChange={e => setNewTagName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleAddTag(); if (e.key === 'Escape') { setAddingTag(false); setNewTagName(''); } }}
              placeholder="Tag name…"
              style={{
                border: 'none', borderRadius: 999,
                padding: '5px 10px', fontSize: 11, fontFamily: 'Inter,sans-serif',
                background: 'var(--paper)', color: 'var(--ink)', outline: 'none', width: 100,
                boxShadow: 'inset 4px 4px 8px rgba(97,85,68,.14), inset -4px -4px 8px rgba(255,255,250,.78)',
              }}
            />
            <button onClick={handleAddTag} className="neu-flat" style={{
              border: 'none', padding: '5px 10px', borderRadius: 999,
              fontSize: 11, fontWeight: 600, color: 'var(--burgundy)', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
            }}>Add</button>
          </div>
        ) : (
          <button onClick={() => setAddingTag(true)} className="neu-flat neu-press" style={{
            border: 'none', padding: '6px 11px', borderRadius: 999, fontSize: 11,
            color: 'var(--ink-3)', cursor: 'pointer', fontFamily: 'Inter,sans-serif',
            display: 'inline-flex', alignItems: 'center', gap: 4,
          }}>
            <Icon name="plus" size={11} /> New tag
          </button>
        )}
      </div>
    </div>
  );
};
