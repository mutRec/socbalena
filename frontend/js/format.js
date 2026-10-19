// format.js — Utilitats de text compartides (escapar HTML + format lleuger de notes)

export function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
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
      '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

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
