interface AvatarProps {
  src?: string;
  name: string;
  size?: number;
  ring?: boolean;
}

/** Round avatar with a graceful gradient fallback (initials) on missing images. */
export function Avatar({ src, name, size = 44, ring }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        flex: 'none',
        overflow: 'hidden',
        background: 'var(--brand-gradient)',
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: size * 0.4,
        boxShadow: ring ? '0 0 0 3px #fff, 0 0 0 5px var(--brand-400)' : undefined,
      }}
    >
      {src ? (
        <img
          src={src}
          alt={name}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
      ) : (
        initials
      )}
    </div>
  );
}
