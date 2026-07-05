import { getAvatarSrc } from '../lib/avatars.js';

export default function Avatar({ companion, name, size = 40 }) {
  const displayName = companion?.name || name || '?';
  const src = companion ? getAvatarSrc(companion) : null;

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: 'var(--bg-soft)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      overflow: 'hidden',
    }}>
      {src ? (
        <img src={src} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontFamily: 'var(--font-serif)', fontSize: size * 0.42, color: 'var(--sage-dark)' }}>
          {displayName?.[0]?.toUpperCase() || '?'}
        </span>
      )}
    </div>
  );
}
