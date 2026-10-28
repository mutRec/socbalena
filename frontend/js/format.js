// format.js — Utilitats de text compartides (escapar HTML + format lleuger de notes)

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Construeix un enllaç amb aspecte de xip (pastilla arrodonida) amb icona
 * opcional i fletxa al final (→ intern, ↗ extern).
 *
 * @param {string} href              Destí de l'enllaç.
 * @param {string} text              Text visible (s'escapa).
 * @param {Object} [opcions]
 * @param {string} [opcions.icona]   Emoji o caràcter que acompanya el text.
 * @param {boolean} [opcions.extern] Obre en una pestanya nova i mostra ↗.
 * @param {boolean} [opcions.petit]  Variant compacta per a taules.
 * @param {string} [opcions.titol]   Atribut title (text complet, p.ex. una URL llarga).
 * @returns {string} HTML de l'enllaç.
 */
export function enllacXip(href, text, { icona = '', extern = false, petit = false, titol = '' } = {}) {
  const classes = ['enllac-xip'];
  if (extern) classes.push('enllac-xip-extern');
  if (petit) classes.push('enllac-xip-sm');

  const atributs = [
    `class="${classes.join(' ')}"`,
    `href="${escapeHtml(href)}"`,
    extern ? 'target="_blank" rel="noopener noreferrer"' : '',
    titol ? `title="${escapeHtml(titol)}"` : ''
  ].filter(Boolean).join(' ');

  return `<a ${atributs}>`
    + (icona ? `<span class="enllac-xip-icona" aria-hidden="true">${icona}</span>` : '')
    + `<span class="enllac-xip-text">${escapeHtml(text)}</span></a>`;
}

/**
 * Converteix un text pla amb un format lleuger a HTML.
 * Sintaxi admesa (estil Markdown mínim):
 *   línia en blanc        → paràgraf nou
 *   salt de línia simple  → salt de línia (<br>)
 *   - text / * text       → llista amb pics
 *   1. text               → llista numerada
 *   ## Títol              → subtítol
 *   **negreta**           → <strong>
 *   *cursiva*             → <em>
 *   `codi`                → <code>
 *   [text](https://...)   → enllaç (només http/https)
 *
 * El text s'escapa sempre abans de transformar-lo, així que no s'hi pot
 * injectar HTML.
 */
export function formatNotes(text) {
  if (!text) return '';

  const pla = escapeHtml(String(text).replace(/\r\n?/g, '\n')).trim();
  if (!pla) return '';

  // Format de línia (negreta, cursiva, codi, enllaços)
  const inline = (s) => s
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
      '<a class="enllac enllac-extern" href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

  const out = [];
  let llista = null;      // 'ul' | 'ol' | null
  let paragraf = [];      // línies del paràgraf actual

  const tancaParagraf = () => {
    if (paragraf.length) {
      out.push(`<p>${paragraf.join('<br>')}</p>`);
      paragraf = [];
    }
  };
  const tancaLlista = () => {
    if (llista) { out.push(`</${llista}>`); llista = null; }
  };
  const obreLlista = (tipus) => {
    if (llista !== tipus) { tancaLlista(); out.push(`<${tipus}>`); llista = tipus; }
  };

  for (const linia of pla.split('\n')) {
    const t = linia.trim();

    if (!t) { tancaParagraf(); tancaLlista(); continue; }

    let m;
    if ((m = t.match(/^[-*•]\s+(.+)$/))) {
      tancaParagraf();
      obreLlista('ul');
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = t.match(/^\d+[.)]\s+(.+)$/))) {
      tancaParagraf();
      obreLlista('ol');
      out.push(`<li>${inline(m[1])}</li>`);
    } else if ((m = t.match(/^#{1,4}\s+(.+)$/))) {
      tancaParagraf();
      tancaLlista();
      out.push(`<h4 class="notes-titol">${inline(m[1])}</h4>`);
    } else {
      tancaLlista();
      paragraf.push(inline(t));
    }
  }
  tancaParagraf();
  tancaLlista();

  return out.join('');
}
