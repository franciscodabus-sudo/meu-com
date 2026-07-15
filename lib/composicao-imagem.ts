import sharp from 'sharp';
import { uploadToStorage } from './storage';

// ── Paletas ────────────────────────────────────────────────────────────────────

interface Paleta {
  bg: string;       // cor do degradê (hex)
  texto: string;    // cor do título
  destaque: string; // cor da linha de acento, fundo do CTA e dot do chip
  ctaTexto: string; // cor do texto no botão CTA
}

const PALETAS: Record<string, Paleta> = {
  petroleo: {
    bg:       '#0B3D3A',
    texto:    '#FFFFFF',
    destaque: '#FF7A59',
    ctaTexto: '#FFFFFF',
  },
  terracota: {
    bg:       '#FAEEDA',
    texto:    '#412402',
    destaque: '#D85A30',
    ctaTexto: '#FFFFFF',
  },
  marinho: {
    bg:       '#042C53',
    texto:    '#FFFFFF',
    destaque: '#FFFFFF',
    ctaTexto: '#042C53',
  },
};

// ── Seleção automática de paleta ───────────────────────────────────────────────

function determinarPaleta(canal: string, stage: string): Paleta {
  if (canal === 'linkedin') return PALETAS.marinho;
  if (stage === 'conectar' || stage === 'converter') return PALETAS.terracota;
  return PALETAS.petroleo;
}

function determinarTag(canal: string, stage: string): string {
  if (canal === 'linkedin') return 'LINKEDIN';
  const mapa: Record<string, string> = {
    atrair:    'GUIA',
    educar:    'DICA RÁPIDA',
    conectar:  'CONEXÃO',
    converter: 'PROTEÇÃO',
  };
  return mapa[stage] ?? 'VIP INSURANCE';
}

function determinarCTA(stage: string): string {
  const mapa: Record<string, string> = {
    atrair:    'Saiba mais →',
    educar:    'Fale comigo →',
    conectar:  'Me conta →',
    converter: 'Quero proteger →',
  };
  return mapa[stage] ?? 'Fale comigo →';
}

// ── Utilitários ───────────────────────────────────────────────────────────────

function quebrarTexto(texto: string, maxCarsPorLinha: number, maxLinhas: number): string[] {
  const palavras = texto.split(' ');
  const linhas: string[] = [];
  let atual = '';

  for (const palavra of palavras) {
    if (linhas.length >= maxLinhas) break;
    if (!atual) {
      atual = palavra;
    } else if ((atual + ' ' + palavra).length <= maxCarsPorLinha) {
      atual += ' ' + palavra;
    } else {
      linhas.push(atual);
      atual = palavra;
    }
  }
  if (atual && linhas.length < maxLinhas) linhas.push(atual);
  return linhas;
}

function escaparXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// ── Gerador de SVG overlay ─────────────────────────────────────────────────────

function gerarSVGOverlay(
  titulo: string,
  tag: string,
  cta: string,
  paleta: Paleta,
): Buffer {
  const W = 1080;
  const H = 1350;
  const M = 36; // margem lateral

  // Título — quebra em até 4 linhas de 22 chars
  const linhas = quebrarTexto(titulo, 22, 4);
  const FS = 76;  // font-size título
  const LH = 90;  // line-height título

  // Âncora de baixo para cima:
  const CTA_H = 76;
  const CTA_TOP = H - 100;
  const CTA_W = Math.min(Math.max(260, cta.length * 20 + 60), 520);

  // Última linha de título: 44px acima do CTA
  const TITLE_LAST_BASELINE = CTA_TOP - 44;
  // Primeira linha de título: sobe (n-1) * LH acima da última
  const TITLE_FIRST_BASELINE = TITLE_LAST_BASELINE - (linhas.length - 1) * LH;

  // Linha de acento: 16px acima do topo da primeira letra (cap-height ≈ 0.73 * FS)
  const ACCENT_TOP = TITLE_FIRST_BASELINE - Math.round(FS * 0.73) - 16;

  // Degradê começa 180px acima da linha de acento
  const GRAD_START = Math.max(360, ACCENT_TOP - 180);

  // Chip de tag
  const TAG_Y = 32;
  const TAG_H = 56;
  const TAG_W = tag.length * 15 + 84;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"
    font-family="-apple-system, BlinkMacSystemFont, Helvetica, Arial, sans-serif"
    text-rendering="optimizeLegibility">
  <defs>
    <linearGradient id="gb" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="${paleta.bg}" stop-opacity="0"/>
      <stop offset="35%"  stop-color="${paleta.bg}" stop-opacity="0.75"/>
      <stop offset="100%" stop-color="${paleta.bg}" stop-opacity="0.97"/>
    </linearGradient>
    <linearGradient id="gt" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%"   stop-color="#000000" stop-opacity="0.30"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <!-- Scrim superior — garante legibilidade do chip em qualquer foto -->
  <rect x="0" y="0" width="${W}" height="150" fill="url(#gt)"/>

  <!-- Degradê inferior — paleta sobre a foto -->
  <rect x="0" y="${GRAD_START}" width="${W}" height="${H - GRAD_START}" fill="url(#gb)"/>

  <!-- Chip de tag (topo esquerdo) -->
  <rect x="${M}" y="${TAG_Y}" width="${TAG_W}" height="${TAG_H}" rx="${TAG_H / 2}"
        fill="rgba(0,0,0,0.55)" stroke="${paleta.destaque}" stroke-width="1.5"/>
  <circle cx="${M + 28}" cy="${TAG_Y + TAG_H / 2}" r="12"
          fill="${paleta.destaque}" opacity="0.9"/>
  <text x="${M + 52}" y="${TAG_Y + TAG_H / 2 + 8}"
        font-size="20" font-weight="700" letter-spacing="1.8"
        fill="white">${escaparXml(tag)}</text>

  <!-- Nome da marca (topo direito, sutil) -->
  <text x="${W - M}" y="${TAG_Y + TAG_H / 2 + 7}"
        font-size="20" font-weight="500"
        fill="white" opacity="0.40" text-anchor="end">Vip Insurance</text>

  <!-- Linha de acento antes do título -->
  <rect x="${M}" y="${ACCENT_TOP}" width="48" height="4" rx="2"
        fill="${paleta.destaque}"/>

  <!-- Linhas do título -->
  ${linhas.map((l, i) => `
  <text x="${M}" y="${TITLE_FIRST_BASELINE + i * LH}"
        font-size="${FS}" font-weight="700"
        fill="${paleta.texto}" text-anchor="start">${escaparXml(l)}</text>`).join('')}

  <!-- Botão CTA -->
  <rect x="${M}" y="${CTA_TOP}" width="${CTA_W}" height="${CTA_H}" rx="${CTA_H / 2}"
        fill="${paleta.destaque}"/>
  <text x="${M + CTA_W / 2}" y="${CTA_TOP + CTA_H / 2 + 9}"
        font-size="24" font-weight="600"
        fill="${paleta.ctaTexto}" text-anchor="middle">${escaparXml(cta)}</text>
</svg>`;

  return Buffer.from(svg);
}

// ── API pública ────────────────────────────────────────────────────────────────

export async function comporImagemPost(opts: {
  postId: string;
  mediaUrl: string;
  titulo: string;
  canal: string;
  stage: string;
}): Promise<string | null> {
  const { postId, mediaUrl, titulo, canal, stage } = opts;

  try {
    const res = await fetch(mediaUrl);
    if (!res.ok) return null;
    const imgBuf = Buffer.from(await res.arrayBuffer());

    const paleta = determinarPaleta(canal, stage);
    const tag    = determinarTag(canal, stage);
    const cta    = determinarCTA(stage);
    const svgBuf = gerarSVGOverlay(titulo, tag, cta, paleta);

    const composed = await sharp(imgBuf)
      .resize(1080, 1350, { fit: 'cover', position: 'center' })
      .composite([{ input: svgBuf, top: 0, left: 0 }])
      .jpeg({ quality: 88 })
      .toBuffer();

    return await uploadToStorage(composed, `composed-${postId}.jpg`, 'image/jpeg');
  } catch (err) {
    console.error('[composicao-imagem]', err);
    return null;
  }
}
