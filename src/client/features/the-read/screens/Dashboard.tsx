import React, { useEffect, useState } from 'react';
import { Avatar, NeuButton, NeuCard, Pill, SectionHeading } from '../components/ui';
import { Icon } from '../components/Icon';
import { ANNOUNCEMENTS, SCHEDULE_TODAY } from '../data';
import { postsApi } from '../api';
import { relTime } from '../data';
import type { Author, Post } from '../types';

// ── Greeting hero ─────────────────────────────────────────────────────────────
const GreetingHero: React.FC<{ user: Author; compact?: boolean; nav?: (r: any) => void }> = ({ user, compact = false, nav }) => {
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="neu tr-fade-up" style={{
      borderRadius: 'var(--radius)',
      padding: compact ? 20 : '28px 32px',
      position: 'relative',
      overflow: 'hidden',
    background: 'linear-gradient(135deg, #f6f7f2, var(--paper-2))',
    }}>
      <div className="tr-serif" style={{
        position: 'absolute', right: -20, bottom: -30,
        fontSize: compact ? 140 : 220, color: 'var(--tan)', opacity: .09,
        fontStyle: 'italic', fontWeight: 700, lineHeight: 1, pointerEvents: 'none',
      }}>R</div>
      <div className="tr-mono" style={{ fontSize: 10, letterSpacing: '.25em', color: 'var(--tan-2)', textTransform: 'uppercase', marginBottom: 8 }}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} · Vol. CXXIX
      </div>
      <h1 className="tr-serif" style={{
        margin: 0, fontSize: compact ? 28 : 40, fontWeight: 500,
        color: 'var(--ink)', letterSpacing: '-0.02em', lineHeight: 1.1,
      }}>
        {greet}, <em style={{ fontWeight: 400, color: 'var(--burgundy)' }}>{user.name.split(' ')[0]}.</em>
      </h1>
      <p style={{ margin: '8px 0 0', color: 'var(--ink-2)', fontSize: compact ? 13 : 15, maxWidth: 560, lineHeight: 1.5 }}>
        Welcome to The Read. Explore the latest essays from the community.
      </p>
      {!compact && (
        <div style={{ display: 'flex', gap: 12, marginTop: 20, flexWrap: 'wrap' }}>
          <NeuButton primary icon="feather" onClick={() => nav?.('write')}>Write an essay</NeuButton>
          <NeuButton icon="feed" onClick={() => nav?.('feed')}>Browse feed</NeuButton>
        </div>
      )}
    </div>
  );
};

// ── Featured post card ────────────────────────────────────────────────────────
const FeaturedPostCard: React.FC<{ post: Post; onOpen: (p: Post) => void }> = ({ post, onOpen }) => (
  <div className="neu hover-lift" onClick={() => onOpen(post)} style={{
    borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer',
    display: 'flex', flexDirection: 'column',
  }}>
    <div style={{
      height: 200, background: post.cover,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fbf8f2', fontSize: 72, fontFamily: "'Fraunces',serif", opacity: .95,
      position: 'relative',
    }}>
      <div style={{ opacity: .5 }}>{post.coverAccent}</div>
      {post.featured && (
        <div style={{
          position: 'absolute', top: 14, left: 14,
          background: 'rgba(10,6,5,.4)', backdropFilter: 'blur(10px)',
          color: '#fbf8f2', padding: '5px 12px', borderRadius: 999,
          fontSize: 10, letterSpacing: '.15em', textTransform: 'uppercase', fontWeight: 600,
          border: '1px solid rgba(255,220,180,.2)',
        }}>Editor's Pick</div>
      )}
    </div>
    <div style={{ padding: '22px 24px 24px' }}>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {post.tags.map(t => <Pill key={t.id} color={t.hue} small>{t.name}</Pill>)}
      </div>
      <h3 className="tr-serif" style={{ margin: 0, fontSize: 22, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em', lineHeight: 1.25 }}>{post.title}</h3>
      <p style={{ margin: '8px 0 14px', fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{post.excerpt}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Avatar user={post.author} size={32} />
        <div style={{ flex: 1, lineHeight: 1.2 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{post.author.name}</div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{post.author.dept || post.author.year} · {post.readTime} min read</div>
        </div>
        <div style={{ display: 'flex', gap: 12, color: 'var(--ink-3)', fontSize: 12, alignItems: 'center' }}>
          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Icon name="eye" size={13} />{post.views}</span>
          <span style={{ display: 'flex', gap: 4, alignItems: 'center' }}><Icon name="comment" size={13} />{post.comments}</span>
        </div>
      </div>
    </div>
  </div>
);

// ── Recent post row ───────────────────────────────────────────────────────────
const RecentPostRow: React.FC<{ post: Post; onOpen: (p: Post) => void; rank: number }> = ({ post, onOpen, rank }) => (
  <div className="neu-row hover-lift" onClick={() => onOpen(post)} style={{ display: 'flex', gap: 12, padding: '11px 12px', alignItems: 'flex-start', borderRadius: 14, cursor: 'pointer', marginBottom: rank < 4 ? 8 : 0 }}>
    <div className="tr-serif" style={{ fontSize: 26, fontWeight: 500, color: 'var(--tan-2)', lineHeight: 1, fontStyle: 'italic', width: 26 }}>{rank}</div>
    <div style={{ flex: 1 }}>
      <div className="tr-serif" style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 2 }}>{post.title}</div>
      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{post.author.name} · {post.views > 0 ? `${post.views.toLocaleString()} views` : relTime(post.createdAt)}</div>
    </div>
  </div>
);

// ── Dashboard Desktop ─────────────────────────────────────────────────────────
export const DashboardDesktop: React.FC<{ user: Author; nav: (r: any, p?: Post) => void }> = ({ user, nav }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi.list({ limit: 20 })
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featured = posts.filter(p => p.featured).slice(0, 2);
  const trending = [...posts].sort((a, b) => b.views - a.views).slice(0, 4);
  const latest = posts[0];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24, padding: '28px 32px', paddingBottom: 40 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        <GreetingHero user={user} nav={nav} />

        <div>
          <SectionHeading
            eyebrow="Featured this week"
            title="From the editorial desk"
            action={<NeuButton small icon="arrow-right" onClick={() => nav('feed')}>All essays</NeuButton>}
          />
          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {[1, 2].map(i => <div key={i} className="neu" style={{ height: 340, borderRadius: 'var(--radius)' }} />)}
            </div>
          ) : featured.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
              {featured.map(p => <FeaturedPostCard key={p.id} post={p} onOpen={p => nav('post', p)} />)}
            </div>
          ) : (
            <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>No featured essays yet.</p>
          )}
        </div>

        {latest && (
          <div>
            <SectionHeading eyebrow="Latest" title="Just published" />
            <NeuCard>
              <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
                <div style={{
                  width: 80, height: 110, borderRadius: 6,
                  background: latest.cover,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fbf8f2', fontSize: 38, fontFamily: "'Fraunces',serif", opacity: .9,
                  boxShadow: '3px 3px 8px var(--sh-hi)', flexShrink: 0,
                }}>{latest.coverAccent}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="tr-mono" style={{ fontSize: 10, color: 'var(--tan-2)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 4 }}>
                    {relTime(latest.createdAt)} · {latest.readTime} min read
                  </div>
                  <h3 className="tr-serif" style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 600 }}>{latest.title}</h3>
                  <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-2)' }}>{latest.excerpt}</p>
                </div>
                <NeuButton icon="arrow-right" onClick={() => nav('post', latest)}>Read</NeuButton>
              </div>
            </NeuCard>
          </div>
        )}
      </div>

      {/* Right rail */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <NeuCard>
          <SectionHeading
            eyebrow={new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            title="Today"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {SCHEDULE_TODAY.map((s, i) => (
              <div key={i} className={s.highlight ? 'neu-row' : 'neu-row-soft'} style={{
                display: 'flex', gap: 14, alignItems: 'center',
                padding: '11px 14px', borderRadius: 12,
                background: s.highlight ? 'var(--accent-soft)' : undefined,
              }}>
                <div className="tr-mono" style={{ fontSize: 13, fontWeight: 600, color: s.highlight ? 'var(--burgundy)' : 'var(--ink-2)', minWidth: 44 }}>{s.time}</div>
                <div style={{ width: 1, height: 28, background: s.highlight ? 'var(--burgundy)' : 'var(--line)' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{s.title}</div>
                  <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{s.room}</div>
                </div>
              </div>
            ))}
          </div>
        </NeuCard>

        <NeuCard>
          <SectionHeading eyebrow="Campus · Editorial" title="Announcements" />
          {ANNOUNCEMENTS.map(a => (
            <div key={a.id} className="neu-row-soft" style={{ display: 'flex', gap: 14, padding: '14px', borderRadius: 14, marginBottom: 10 }}>
              <div className="neu-flat" style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--burgundy)' }}>
                <Icon name={a.pinned ? 'pin' : a.kind === 'Event' ? 'sparkle' : a.kind === 'Editorial' ? 'feather' : 'globe'} size={16} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                  <span className="tr-mono" style={{ fontSize: 9, letterSpacing: '.2em', color: 'var(--tan-2)', textTransform: 'uppercase' }}>{a.kind}</span>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>· {a.time}</span>
                </div>
                <div className="tr-serif" style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>{a.title}</div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>{a.body}</div>
              </div>
            </div>
          ))}
        </NeuCard>

        <NeuCard>
          <SectionHeading eyebrow="Most read · this week" title="Trending" />
          {loading ? (
            [1, 2, 3, 4].map(i => (
              <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderBottom: '1px solid var(--line)' }}>
                <div className="neu-inset" style={{ width: 26, height: 26, borderRadius: 6 }} />
                <div style={{ flex: 1 }}>
                  <div className="neu-inset" style={{ height: 14, width: '80%', borderRadius: 6, marginBottom: 6 }} />
                  <div className="neu-inset" style={{ height: 10, width: '50%', borderRadius: 6 }} />
                </div>
              </div>
            ))
          ) : trending.map((t, i) => (
            <RecentPostRow key={t.id} post={t} onOpen={p => nav('post', p)} rank={i + 1} />
          ))}
        </NeuCard>
      </div>
    </div>
  );
};

// ── Dashboard Mobile ──────────────────────────────────────────────────────────
export const DashboardMobile: React.FC<{ user: Author; nav: (r: any, p?: Post) => void }> = ({ user, nav }) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    postsApi.list({ limit: 10 })
      .then(setPosts)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const featured = posts.filter(p => p.featured).slice(0, 2);

  return (
    <div style={{ padding: '14px 16px 90px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <GreetingHero user={user} compact nav={nav} />
      <div>
        <SectionHeading eyebrow="Editor's desk" title="This week" />
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[1, 2].map(i => <div key={i} className="neu" style={{ height: 280, borderRadius: 'var(--radius)' }} />)}
          </div>
        ) : featured.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {featured.map(p => <FeaturedPostCard key={p.id} post={p} onOpen={p => nav('post', p)} />)}
          </div>
        ) : (
          <p style={{ color: 'var(--ink-3)', fontSize: 13 }}>No featured essays yet.</p>
        )}
      </div>
      <NeuCard>
        <SectionHeading eyebrow="Today" title="Schedule" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SCHEDULE_TODAY.slice(0, 3).map((s, i) => (
              <div key={i} className={s.highlight ? 'neu-row' : 'neu-row-soft'} style={{
                display: 'flex', gap: 14, alignItems: 'center',
                padding: '11px 14px', borderRadius: 12,
                background: s.highlight ? 'var(--accent-soft)' : undefined,
              }}>
              <div className="tr-mono" style={{ fontSize: 13, fontWeight: 600, color: s.highlight ? 'var(--burgundy)' : 'var(--ink-2)', minWidth: 44 }}>{s.time}</div>
              <div style={{ width: 1, height: 28, background: s.highlight ? 'var(--burgundy)' : 'var(--line)' }} />
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 2 }}>{s.title}</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>{s.room}</div>
              </div>
            </div>
          ))}
        </div>
      </NeuCard>
    </div>
  );
};
