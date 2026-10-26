import React from 'react';
import { Icon } from './Icon';
import type { Author, Tag } from '../types';

// ── Avatar ──────────────────────────────────────────────────────────────────
interface AvatarProps { user: Author; size?: number; ring?: boolean; }
export const Avatar: React.FC<AvatarProps> = ({ user, size = 40, ring = false }) => {
  const hue = (user.id.charCodeAt(1) * 47) % 360;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg, hsl(${hue},35%,45%), hsl(${(hue + 40) % 360},40%,30%))`,
      color: '#fbf8f2',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Fraunces',serif", fontWeight: 600, fontSize: size * 0.38,
      boxShadow: ring
        ? '0 0 0 3px var(--paper), 0 0 0 6px rgba(200,155,96,.55), 8px 8px 16px var(--sh-hi), -5px -5px 12px var(--sh-lo)'
        : '5px 5px 12px var(--sh-hi), -4px -4px 10px var(--sh-lo)',
      flexShrink: 0,
    }}>
      {user.initials}
    </div>
  );
};

// ── Pill ─────────────────────────────────────────────────────────────────────
interface PillProps { children: React.ReactNode; color?: string; soft?: boolean; small?: boolean; }
export const Pill: React.FC<PillProps> = ({ children, color, soft = true, small = false }) => (
  <span className="tr-pill" style={{
    background: soft ? (color ? `${color}22` : 'var(--accent-soft)') : (color ?? 'var(--accent)'),
    color: soft ? (color ?? 'var(--accent)') : '#fbf8f2',
    padding: small ? '3px 8px' : '5px 11px',
    fontSize: small ? 9 : 10,
    boxShadow: soft ? 'inset 1px 1px 2px rgba(97,85,68,.12), inset -1px -1px 2px rgba(255,255,250,.75)' : '3px 3px 8px rgba(97,85,68,.16)',
  }}>
    {children}
  </span>
);

// ── NeuButton ────────────────────────────────────────────────────────────────
interface NeuButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  primary?: boolean;
  small?: boolean;
  icon?: string;
  style?: React.CSSProperties;
  active?: boolean;
  type?: 'button' | 'submit';
}
export const NeuButton: React.FC<NeuButtonProps> = ({
  children, onClick, primary = false, small = false, icon, style = {}, active = false, type = 'button',
}) => (
  <button
    type={type}
    onClick={onClick}
    className={active ? 'neu-inset' : 'neu-flat neu-press hover-lift'}
    style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      padding: small ? '8px 14px' : '11px 20px',
      border: 'none', cursor: 'pointer',
      borderRadius: 'calc(var(--radius) * 0.7)',
      background: primary ? 'linear-gradient(145deg, var(--burgundy-2), var(--burgundy))' : 'var(--paper)',
      color: primary ? '#fbf8f2' : 'var(--ink)',
      fontSize: small ? 13 : 14, fontWeight: 600,
      fontFamily: 'Inter,sans-serif',
      boxShadow: primary
        ? '7px 7px 16px rgba(92,40,40,.34), -4px -4px 12px var(--sh-lo), inset 1px 1px 1px rgba(255,255,255,.22), inset -2px -2px 4px rgba(60,16,18,.26)'
        : undefined,
      ...style,
    }}
  >
    {icon && <Icon name={icon} size={small ? 15 : 17} />}
    {children}
  </button>
);

// ── NeuInput ─────────────────────────────────────────────────────────────────
interface NeuInputProps {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: string;
  style?: React.CSSProperties;
}
export const NeuInput: React.FC<NeuInputProps> = ({ value, onChange, placeholder, type = 'text', icon, style = {} }) => (
  <div className="neu-inset neu-focus" style={{
    display: 'flex', alignItems: 'center', gap: 10,
    padding: '12px 16px',
    borderRadius: 'calc(var(--radius) * 0.7)',
    ...style,
  }}>
    {icon && <Icon name={icon} size={17} stroke="var(--ink-3)" />}
    <input
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      type={type}
      style={{
        border: 'none', outline: 'none', background: 'transparent',
        fontSize: 14, color: 'var(--ink)', flex: 1,
        minWidth: 0,
        fontFamily: 'Inter, sans-serif',
      }}
    />
  </div>
);

// ── NeuCard ───────────────────────────────────────────────────────────────────
interface NeuCardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  inset?: boolean;
  padded?: boolean;
  onClick?: () => void;
}
export const NeuCard: React.FC<NeuCardProps> = ({ children, style = {}, inset = false, padded = true, onClick }) => (
  <div
    className={inset ? 'neu-inset' : 'neu neu-ring'}
    onClick={onClick}
    style={{
      borderRadius: 'var(--radius)',
      padding: padded ? 'calc(22px * var(--density))' : 0,
      cursor: onClick ? 'pointer' : 'default',
      ...style,
    }}
  >
    {children}
  </div>
);

// ── SectionHeading ────────────────────────────────────────────────────────────
interface SectionHeadingProps { eyebrow?: string; title: string; action?: React.ReactNode; }
export const SectionHeading: React.FC<SectionHeadingProps> = ({ eyebrow, title, action }) => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 }}>
    <div>
      {eyebrow && (
        <div className="tr-mono" style={{ fontSize: 10, letterSpacing: '.2em', color: 'var(--tan-2)', textTransform: 'uppercase', marginBottom: 6 }}>
          {eyebrow}
        </div>
      )}
      <h2 className="tr-serif" style={{ margin: 0, fontSize: 26, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.01em' }}>{title}</h2>
    </div>
    {action}
  </div>
);

// ── Ornament ──────────────────────────────────────────────────────────────────
interface OrnamentProps { size?: number; color?: string; }
export const Ornament: React.FC<OrnamentProps> = ({ size = 60, color = 'var(--tan)' }) => (
  <svg width={size} height={size * 0.3} viewBox="0 0 120 36" fill="none" style={{ display: 'block' }}>
    <path d="M0 18 L50 18 M70 18 L120 18" stroke={color} strokeWidth="1"/>
    <circle cx="60" cy="18" r="3" fill={color}/>
    <path d="M52 10 Q60 18 52 26 M68 10 Q60 18 68 26" stroke={color} strokeWidth="1" fill="none"/>
  </svg>
);

// ── Divider ───────────────────────────────────────────────────────────────────
export const Divider: React.FC<{ style?: React.CSSProperties }> = ({ style = {} }) => (
  <div style={{
    height: 1,
    background: 'linear-gradient(90deg, transparent, var(--line), transparent)',
    ...style,
  }}/>
);

// ── Logo ──────────────────────────────────────────────────────────────────────
interface LogoProps { size?: number; showName?: boolean; variant?: 'dark' | 'light'; }
export const Logo: React.FC<LogoProps> = ({ size = 36, showName = true, variant = 'dark' }) => {
  const ink = variant === 'dark' ? 'var(--ink)' : '#fbf8f2';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{
        width: size, height: size,
        borderRadius: `${size / 2}px ${size / 2}px 6px 6px`,
        background: 'linear-gradient(160deg, var(--burgundy), #4a1818)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#f5f1ea',
        fontFamily: "'Fraunces',serif", fontStyle: 'italic', fontWeight: 700,
        fontSize: size * 0.55,
        boxShadow: '6px 6px 14px rgba(58,32,24,.32), -3px -3px 8px rgba(255,255,250,.4), inset 1px 1px 0 rgba(255,255,255,.18)',
        paddingTop: 2,
      }}>R</div>
      {showName && (
        <div style={{ lineHeight: 1 }}>
          <div className="tr-serif" style={{ fontSize: size * 0.5, fontWeight: 600, color: ink, letterSpacing: '-0.01em' }}>
            <span style={{ fontStyle: 'italic', fontWeight: 400 }}>the</span> Read
          </div>
          <div className="tr-mono" style={{ fontSize: 9, color: 'var(--tan-2)', letterSpacing: '.2em', marginTop: 3, textTransform: 'uppercase' }}>
            Ashworth · est. 1897
          </div>
        </div>
      )}
    </div>
  );
};

// ── NavItem ───────────────────────────────────────────────────────────────────
interface NavItemProps { icon: string; label: string; active?: boolean; onClick?: () => void; badge?: number; }
export const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick, badge }) => (
  <button
    onClick={onClick}
    className={active ? 'neu-inset' : 'neu-flat neu-press'}
    style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '11px 14px', width: '100%',
      border: 'none', background: active ? 'var(--paper)' : 'var(--paper-2)',
      borderRadius: 'calc(var(--radius) * 0.6)',
      color: active ? 'var(--burgundy)' : 'var(--ink-2)',
      fontSize: 14, fontWeight: active ? 600 : 500,
      cursor: 'pointer', textAlign: 'left',
      fontFamily: 'Inter, sans-serif',
      transition: 'all .2s',
    }}
  >
    <Icon name={icon} size={18} stroke={active ? 'var(--burgundy)' : 'var(--ink-2)'} />
    <span style={{ flex: 1 }}>{label}</span>
    {badge !== undefined && (
      <span style={{
        background: 'var(--burgundy)', color: '#fbf8f2',
        fontSize: 10, fontWeight: 700,
        padding: '2px 6px', borderRadius: 10, minWidth: 18, textAlign: 'center',
      }}>{badge}</span>
    )}
  </button>
);

// ── TabBarItem ────────────────────────────────────────────────────────────────
interface TabBarItemProps { icon: string; label: string; active?: boolean; onClick?: () => void; }
export const TabBarItem: React.FC<TabBarItemProps> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} style={{
    flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
    padding: '8px 0',
    border: 'none', background: 'transparent',
    color: active ? 'var(--burgundy)' : 'var(--ink-3)',
    cursor: 'pointer', fontFamily: 'Inter,sans-serif',
  }}>
    <div className={active ? 'neu-inset' : ''} style={{
      width: 40, height: 32, borderRadius: 12,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: active ? 'var(--paper)' : 'transparent',
    }}>
      <Icon name={icon} size={18} stroke={active ? 'var(--burgundy)' : 'var(--ink-3)'} />
    </div>
    <span style={{ fontSize: 10, fontWeight: active ? 600 : 500 }}>{label}</span>
  </button>
);

// ── TagPill (helper using Tag data) ──────────────────────────────────────────
interface TagPillProps { tag: Tag; small?: boolean; }
export const TagPill: React.FC<TagPillProps> = ({ tag, small }) => (
  <Pill color={tag.hue} small={small}>{tag.name}</Pill>
);
