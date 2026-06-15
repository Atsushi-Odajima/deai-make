// Deterministic gradient avatars rendered as SVG. No external services, so the
// app works fully offline and seed users always have attractive imagery.

function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

// Blue-forward palette with a few warm accents so the deck has variety.
const PALETTES: [string, string, string][] = [
  ['#1d4ed8', '#3b82f6', '#60a5fa'],
  ['#0ea5e9', '#38bdf8', '#7dd3fc'],
  ['#2563eb', '#4f46e5', '#818cf8'],
  ['#0891b2', '#06b6d4', '#22d3ee'],
  ['#1e40af', '#2563eb', '#3b82f6'],
  ['#4338ca', '#6366f1', '#a5b4fc'],
  ['#0d9488', '#14b8a6', '#5eead4'],
  ['#7c3aed', '#8b5cf6', '#c4b5fd'],
  ['#0369a1', '#0284c7', '#38bdf8'],
];

export function avatarSvg(seed: string, label = ''): string {
  const h = hash(seed);
  const palette = PALETTES[h % PALETTES.length];
  const angle = (h >> 3) % 360;
  const cx1 = 20 + ((h >> 5) % 60);
  const cy1 = 20 + ((h >> 7) % 60);
  const cx2 = 20 + ((h >> 9) % 60);
  const cy2 = 20 + ((h >> 11) % 60);
  const initials = label
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800">
  <defs>
    <linearGradient id="g" gradientTransform="rotate(${angle})">
      <stop offset="0%" stop-color="${palette[0]}"/>
      <stop offset="55%" stop-color="${palette[1]}"/>
      <stop offset="100%" stop-color="${palette[2]}"/>
    </linearGradient>
    <radialGradient id="r1" cx="${cx1}%" cy="${cy1}%" r="60%">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="r2" cx="${cx2}%" cy="${cy2}%" r="50%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="600" height="800" fill="url(#g)"/>
  <rect width="600" height="800" fill="url(#r1)"/>
  <rect width="600" height="800" fill="url(#r2)"/>
  <circle cx="${cx1 * 6}" cy="${cy1 * 8}" r="${90 + (h % 70)}" fill="#ffffff" opacity="0.07"/>
  <circle cx="${cx2 * 6}" cy="${cy2 * 8}" r="${60 + ((h >> 4) % 50)}" fill="#ffffff" opacity="0.06"/>
  ${
    initials
      ? `<text x="300" y="430" font-family="-apple-system, Segoe UI, Roboto, sans-serif"
        font-size="220" font-weight="700" fill="#ffffff" fill-opacity="0.92"
        text-anchor="middle">${initials}</text>`
      : ''
  }
</svg>`;
}
