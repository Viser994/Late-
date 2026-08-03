/**
 * LifeHub brand logo — hexagonal LH monogram + wordmark.
 * Matches the official logo: geometric hex with intertwined L & H.
 */

/** Hexagon path points for a regular hex (flat-top) */
function hexPath(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 180) * (60 * i - 30);
    pts.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
  }
  return `M${pts.join("L")}Z`;
}

/**
 * Logo mark only — hexagon with LH monogram.
 * @param {object} opts
 * @param {number} opts.size - SVG width/height
 * @param {boolean} opts.animated - add draw-in animation classes
 * @param {string} opts.color - stroke/fill color (defaults to currentColor)
 */
export function logoMark({ size = 80, animated = false, color = "currentColor" } = {}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;
  const anim = animated ? "logo-draw" : "";
  const animDelay = animated ? ' style="animation-delay:0s"' : "";

  return `
    <svg class="logo-mark ${anim}" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="LifeHub">
      <path class="logo-hex" ${animDelay} d="${hexPath(cx, cy, r)}" stroke="${color}" stroke-width="${size * 0.045}" fill="none"/>
      <!-- L letter -->
      <path class="logo-letter logo-letter--l" style="animation-delay:${animated ? '0.4s' : '0s'}" d="M${cx - size*0.14} ${cy - size*0.18} v${size*0.36} h${size*0.22}" stroke="${color}" stroke-width="${size*0.05}" stroke-linecap="square" fill="none"/>
      <!-- H letter -->
      <path class="logo-letter logo-letter--h" style="animation-delay:${animated ? '0.7s' : '0s'}" d="M${cx + size*0.02} ${cy - size*0.18} v${size*0.36} M${cx + size*0.02} ${cy} h${size*0.16} M${cx + size*0.18} ${cy - size*0.18} v${size*0.36}" stroke="${color}" stroke-width="${size*0.05}" stroke-linecap="square" fill="none"/>
    </svg>
  `;
}

/**
 * Full logo with LIFE HUB wordmark.
 */
export function logoFull({ size = 48, color = "currentColor", showText = true } = {}) {
  const markSize = size;
  const textSize = size * 0.28;

  return `
    <div class="logo-full" style="--logo-color:${color}">
      ${logoMark({ size: markSize, color })}
      ${showText ? `
        <div class="logo-full__text" style="font-size:${textSize}px">
          <span>LIFE</span><span>HUB</span>
        </div>
      ` : ""}
    </div>
  `;
}

/** Animated logo for login — with glow ring */
export function logoHero({ size = 120 } = {}) {
  return `
    <div class="logo-hero">
      <div class="logo-hero__glow"></div>
      <div class="logo-hero__ring"></div>
      ${logoMark({ size, animated: true })}
    </div>
  `;
}

/** Inline favicon SVG data URI */
export function faviconDataUri() {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><path d='M50 8 L88 30 L88 70 L50 92 L12 70 L12 30 Z' fill='none' stroke='%234f6ef7' stroke-width='4'/><path d='M32 32 v36 h18' stroke='%234f6ef7' stroke-width='5' stroke-linecap='square' fill='none'/><path d='M54 32 v36 M54 50 h16 M70 32 v36' stroke='%234f6ef7' stroke-width='5' stroke-linecap='square' fill='none'/></svg>`;
  return `data:image/svg+xml,${svg}`;
}
