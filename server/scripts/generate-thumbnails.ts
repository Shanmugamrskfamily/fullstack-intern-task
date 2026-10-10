/**
 * Generates the original SVG thumbnails in public/thumbnails from the seed data.
 * Each thumbnail is a stylised "browser window" (or phones) preview of the template.
 *
 *   npm run thumbnails
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SEED_TEMPLATES, type SeedTemplate } from '../src/seed/templates.data.js';

const outDir = fileURLToPath(new URL('../public/thumbnails/', import.meta.url));
const INK = '#1E293B';
const GRAY = '#CBD5E1';
const GRAY_2 = '#E2E8F0';

const r = (x: number, y: number, w: number, h: number, rx: number, fill: string, extra = '') =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${extra}/>`;
const alpha = (o: number) => ` fill-opacity="${o}"`;

function navBar(a: string) {
  return (
    r(14, 11, 26, 8, 4, a) +
    [122, 150, 178].map((x) => r(x, 13, 22, 5, 2.5, GRAY)).join('') +
    r(216, 9, 38, 12, 6, a)
  );
}

function body(kind: SeedTemplate['art']['kind'], a: string): string {
  switch (kind) {
    case 'landing':
      return (
        navBar(a) +
        r(14, 38, 118, 10, 4, INK) +
        r(14, 53, 92, 10, 4, INK) +
        r(14, 71, 120, 5, 2.5, GRAY) +
        r(14, 80, 98, 5, 2.5, GRAY) +
        r(14, 94, 50, 15, 7.5, a) +
        `<rect x="70" y="94" width="50" height="15" rx="7.5" fill="none" stroke="${GRAY}" stroke-width="1.5"/>` +
        r(150, 32, 104, 84, 10, a, alpha(0.12)) +
        r(162, 44, 80, 10, 4, a, alpha(0.45)) +
        r(162, 60, 36, 46, 6, '#fff') +
        r(204, 60, 38, 21, 6, '#fff') +
        r(204, 85, 38, 21, 6, a, alpha(0.35)) +
        [14, 97, 180]
          .map(
            (x, i) =>
              `<rect x="${x}" y="126" width="74" height="40" rx="8" fill="#F8FAFC" stroke="${GRAY_2}"/>` +
              r(x + 8, 134, 12, 12, 4, a, alpha([0.7, 0.5, 0.3][i]!)),
          )
          .join('')
      );
    case 'pricing':
      return (
        navBar(a) +
        r(74, 32, 120, 9, 4, INK) +
        r(94, 46, 80, 5, 2.5, GRAY) +
        [0, 1, 2]
          .map((i) => {
            const x = 14 + i * 83;
            const hi = i === 1;
            const top = hi ? 58 : 64;
            return (
              `<rect x="${x}" y="${top}" width="74" height="${hi ? 104 : 96}" rx="10" fill="${hi ? a : '#F8FAFC'}" stroke="${hi ? a : GRAY_2}"/>` +
              r(x + 10, top + 12, 30, 5, 2.5, hi ? '#fff' : GRAY, hi ? alpha(0.7) : '') +
              r(x + 10, top + 24, 40, 11, 4, hi ? '#fff' : INK) +
              [0, 1, 2]
                .map((j) =>
                  r(
                    x + 10,
                    top + 44 + j * 10,
                    50 - j * 8,
                    4,
                    2,
                    hi ? '#fff' : GRAY,
                    hi ? alpha(0.6) : '',
                  ),
                )
                .join('') +
              r(x + 10, top + (hi ? 82 : 78), 54, 12, 6, hi ? '#fff' : a)
            );
          })
          .join('')
      );
    case 'dashboard':
      return (
        r(0, 0, 54, 172, 0, '#0F172A') +
        r(12, 12, 28, 8, 4, a) +
        [0, 1, 2, 3, 4, 5]
          .map((i) => r(12, 34 + i * 16, i === 1 ? 30 : 26, 6, 3, i === 1 ? a : '#334155'))
          .join('') +
        r(66, 12, 70, 8, 4, INK) +
        r(214, 9, 40, 13, 6.5, a) +
        [0, 1, 2]
          .map(
            (i) =>
              `<rect x="${66 + i * 64}" y="32" width="58" height="38" rx="8" fill="#F8FAFC" stroke="${GRAY_2}"/>` +
              r(73 + i * 64, 40, 26, 4, 2, GRAY) +
              r(73 + i * 64, 50, 34, 8, 3, INK) +
              `<path d="M${100 + i * 64} 64 l5 -4 l5 2 l6 -7" fill="none" stroke="${a}" stroke-width="1.6" stroke-linecap="round"/>`,
          )
          .join('') +
        `<rect x="66" y="80" width="188" height="80" rx="9" fill="#F8FAFC" stroke="${GRAY_2}"/>` +
        `<path d="M76 140 C96 124 108 132 124 118 S152 98 168 108 S200 126 216 100 S238 92 246 96 L246 152 L76 152Z" fill="${a}" fill-opacity=".14"/>` +
        `<path d="M76 140 C96 124 108 132 124 118 S152 98 168 108 S200 126 216 100 S238 92 246 96" fill="none" stroke="${a}" stroke-width="2.2" stroke-linecap="round"/>` +
        r(76, 88, 50, 5, 2.5, GRAY)
      );
    case 'crm':
      return (
        r(0, 0, 54, 172, 0, '#1E1B4B') +
        r(12, 12, 28, 8, 4, a) +
        [0, 1, 2, 3, 4]
          .map((i) =>
            r(12, 34 + i * 16, 26, 6, 3, i === 0 ? a : '#4338CA', i === 0 ? '' : alpha(0.5)),
          )
          .join('') +
        r(66, 12, 80, 8, 4, INK) +
        r(214, 9, 40, 13, 6.5, a) +
        [0, 1, 2]
          .map((col) => {
            const x = 66 + col * 64;
            return (
              r(x, 30, 58, 70, 8, '#F8FAFC', ` stroke="${GRAY_2}"`) +
              r(x + 7, 37, 24, 4, 2, GRAY) +
              [0, 1, 2]
                .slice(0, 3 - (col === 2 ? 1 : 0))
                .map(
                  (k) =>
                    r(x + 6, 47 + k * 16, 46, 12, 4, '#fff', ` stroke="${GRAY_2}"`) +
                    r(x + 10, 51 + k * 16, 4, 4, 2, a, alpha(0.8 - col * 0.2)),
                )
                .join('')
            );
          })
          .join('') +
        [0, 1, 2]
          .map(
            (k) =>
              r(66, 108 + k * 16, 188, 12, 4, k === 0 ? GRAY_2 : '#F8FAFC') +
              r(72, 112 + k * 16, 40, 4, 2, k === 0 ? INK : GRAY) +
              r(150, 112 + k * 16, 30, 4, 2, GRAY) +
              r(214, 111 + k * 16, 30, 6, 3, a, alpha(0.35)),
          )
          .join('')
      );
    case 'ecommerce':
      return (
        r(14, 11, 26, 8, 4, a) +
        r(70, 9, 120, 12, 6, GRAY_2) +
        `<circle cx="240" cy="15" r="7" fill="${a}"/>` +
        r(14, 30, 240, 48, 10, a, alpha(0.14)) +
        r(26, 40, 96, 9, 4, INK) +
        r(26, 54, 70, 5, 2.5, GRAY) +
        r(26, 64, 40, 9, 4.5, a) +
        `<circle cx="214" cy="54" r="19" fill="${a}" fill-opacity=".5"/><circle cx="214" cy="54" r="10" fill="#fff" fill-opacity=".7"/>` +
        [0, 1, 2, 3]
          .map(
            (i) =>
              r(14 + i * 61, 88, 53, 50, 8, '#F1F5F9') +
              r(
                27 + i * 61,
                98 + (i % 2) * 4,
                27,
                30 - (i % 2) * 6,
                6,
                a,
                alpha([0.6, 0.35, 0.5, 0.25][i]!),
              ) +
              r(14 + i * 61, 144, 34, 5, 2.5, INK) +
              r(14 + i * 61, 153, 20, 5, 2.5, a),
          )
          .join('')
      );
    case 'portfolio':
      return (
        r(14, 11, 44, 8, 4, INK) +
        r(178, 13, 22, 5, 2.5, GRAY) +
        r(206, 13, 22, 5, 2.5, GRAY) +
        `<circle cx="246" cy="15" r="5" fill="${a}"/>` +
        r(14, 34, 156, 13, 5, INK) +
        r(14, 52, 108, 13, 5, INK) +
        r(14, 68, 60, 4, 2, a) +
        r(14, 82, 92, 82, 9, a, alpha(0.8)) +
        r(112, 82, 70, 38, 9, a, alpha(0.32)) +
        r(112, 126, 70, 38, 9, '#0F172A', alpha(0.85)) +
        r(188, 82, 66, 82, 9, a, alpha(0.52)) +
        `<circle cx="60" cy="118" r="16" fill="#fff" fill-opacity=".35"/>`
      );
    case 'blog':
      return (
        navBar(a) +
        r(14, 30, 240, 58, 10, a, alpha(0.16)) +
        r(26, 40, 34, 9, 4.5, a) +
        r(26, 55, 130, 9, 4, INK) +
        r(26, 69, 90, 5, 2.5, GRAY) +
        `<circle cx="214" cy="59" r="20" fill="${a}" fill-opacity=".45"/>` +
        [0, 1, 2]
          .map(
            (i) =>
              r(14, 98 + i * 23, 18, 18, 5, a, alpha([0.55, 0.35, 0.2][i]!)) +
              r(40, 100 + i * 23, [130, 110, 140][i]!, 6, 3, INK) +
              r(40, 110 + i * 23, 70, 4, 2, GRAY) +
              r(226, 103 + i * 23, 28, 5, 2.5, GRAY),
          )
          .join('')
      );
    case 'mobile':
      return '';
  }
}

function phone(x: number, y: number, rotate: number, a: string, accentTop: boolean) {
  const rows = [0, 1, 2, 3]
    .map((i) => {
      const top = (accentTop ? 64 : 46) + i * 20;
      return (
        r(12, top, 54, 14, 5, '#F1F5F9') +
        r(16, top + 4, 6, 6, 2, a, alpha(0.7)) +
        r(26, top + 5, 30 - i * 3, 4, 2, GRAY)
      );
    })
    .join('');
  return (
    `<g transform="translate(${x} ${y}) rotate(${rotate})">` +
    r(0, 0, 78, 156, 16, '#0F172A') +
    r(5, 5, 68, 146, 12, '#fff') +
    r(5, 5, 68, accentTop ? 50 : 30, 12, a, alpha(accentTop ? 1 : 0.18)) +
    r(27, 9, 24, 5, 2.5, '#0F172A') +
    (accentTop ? `<circle cx="39" cy="38" r="11" fill="#fff" fill-opacity=".85"/>` : '') +
    rows +
    r(12, accentTop ? 140 : 132, 54, accentTop ? 6 : 12, 6, a) +
    `</g>`
  );
}

function thumbnail(t: SeedTemplate): string {
  const { kind, accent: a, backdrop } = t.art;
  const backdropLayer =
    `<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${backdrop[0]}"/><stop offset="1" stop-color="${backdrop[1]}"/></linearGradient></defs>` +
    `<rect width="320" height="200" fill="url(#bg)"/>` +
    `<circle cx="292" cy="18" r="62" fill="#fff" opacity=".22"/><circle cx="16" cy="196" r="54" fill="#fff" opacity=".16"/>`;

  const content =
    kind === 'mobile'
      ? phone(78, 36, -8, a, true) + phone(166, 24, 6, a, false)
      : `<g transform="translate(26 24)">` +
        `<rect width="268" height="190" rx="10" fill="#fff"/>` +
        `<path d="M0 10a10 10 0 0 1 10-10h248a10 10 0 0 1 10 10v8H0Z" fill="#F1F5F9"/>` +
        `<circle cx="11" cy="9" r="2.6" fill="#F87171"/><circle cx="19" cy="9" r="2.6" fill="#FBBF24"/><circle cx="27" cy="9" r="2.6" fill="#34D399"/>` +
        r(92, 5, 86, 8, 4, GRAY_2) +
        `<g transform="translate(0 18)">${body(kind, a)}</g></g>`;

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" width="640" height="400" role="img" aria-label="Preview of the ${t.name} template">` +
    `<title>${t.name} template preview</title>${backdropLayer}${content}</svg>\n`
  );
}

mkdirSync(outDir, { recursive: true });
for (const template of SEED_TEMPLATES) {
  writeFileSync(
    new URL(`${template.slug}.svg`, `file:///${outDir.replace(/\\/g, '/')}`),
    thumbnail(template),
  );
}
console.log(`Generated ${SEED_TEMPLATES.length} thumbnails in public/thumbnails`);
