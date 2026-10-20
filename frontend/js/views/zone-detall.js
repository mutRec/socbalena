// views/zone-detall.js
import { api } from '../api.js';
import { escapeHtml, formatNotes } from '../format.js';
import { obrirModalZona } from './zone-modal.js';

const ICONES_TIPUS = {
  escull: '🪸', paret: '🏔️', cova: '🕳️', derelicte: '⚓',
  platja: '🏖️', llac: '🏞️', riu: '🌊', altre: '📍'
};

export async function renderZoneDetall(el, id) {
  if (!id) { el.innerHTML = '<div class="alert alert-error">ID no especificat</div>'; return; }

  async function carregar() {
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const zona = await api.zones.obtenir(id);
    renderDetall(zona);
  }

  function renderDetall(z) {
    const lloc = [z.regio, z.pais].filter(Boolean).join(', ');
    const icona = ICONES_TIPUS[z.tipus] || '📍';
    const lat = formatCoord(z.latitud);
    const lng = formatCoord(z.longitud);

    const dades = [
      z.profunditat_max ? { label: '📏 Profunditat màxima', html: `${escapeHtml(z.profunditat_max)} m` } : null,
      lloc ? { label: '📍 Ubicació', html: escapeHtml(lloc) } : null,
      (lat || lng) ? {
        label: '🧭 Coordenades',
        html: [lat, lng].filter(Boolean).map(escapeHtml).join(', ')
      } : null,
      z.centre_id ? {
        label: '🏢 Centre',
        html: `<a href="#/centre/${z.centre_id}">${escapeHtml(z.centre_nom || 'Veure centre')}</a>`
      } : { label: '🏢 Centre', html: '<span style="color:var(--color-gris)">Sense centre associat</span>' },
    ].filter(Boolean);

    const mapa = (lat && lng)
      ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=15/${lat}/${lng}`
      : null;

    el.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <button class="btn btn-secondary btn-sm" id="btn-tornar">← Tornar</button>
          <div class="page-title">
            <h1>${escapeHtml(z.nom)}</h1>
            <p class="page-subtitle">${[labelTipus(z.tipus), lloc].filter(Boolean).map(escapeHtml).join(' · ') || 'Punt de busseig'}</p>
          </div>
        </div>
        <div class="page-accions">
          <button class="btn btn-secondary" id="btn-editar">✏️ Editar</button>
          <button class="btn btn-danger" id="btn-eliminar">🗑️ Eliminar</button>
        </div>
      </div>

      <!-- FITXA DE LA ZONA -->
      <div class="card" style="margin-bottom:1.5rem;">
        <div class="fitxa-cap">
          <div class="zona-icona-gran">${icona}</div>
          <div class="fitxa-info">
            <h2 style="font-family:'Barlow Condensed',sans-serif;font-size:2rem;color:var(--color-cian);font-weight:700;margin-bottom:0.5rem;">
              ${escapeHtml(z.nom)}
            </h2>

            <div style="display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.75rem;">
              ${badgeTipus(z.tipus)}
              ${badgeNivell(z.nivell_dificultat)}
            </div>

            <div class="detall-dades">
              ${dades.map(d => `
                <div class="detall-dada">
                  <div class="detall-dada-etiqueta">${d.label}</div>
                  <div class="detall-dada-valor">${d.html}</div>
                </div>`).join('')}
            </div>

            ${mapa ? `
              <a class="btn btn-secondary btn-sm" href="${escapeHtml(mapa)}" target="_blank" rel="noopener noreferrer"
                 style="margin-top:0.75rem;display:inline-flex;">🗺️ Veure al mapa</a>` : ''}
          </div>
        </div>

        <div class="detall-notes ${z.descripcio ? '' : 'detall-notes-buit'}" style="margin-bottom:1rem;">
          <div class="detall-notes-titol">Descripció</div>
          ${z.descripcio
            ? `<div class="notes-cos">${formatNotes(z.descripcio)}</div>`
            : '<div>Encara no hi ha descripció per a aquesta zona.</div>'}
        </div>

        <div class="detall-notes ${z.notes ? '' : 'detall-notes-buit'}">
          <div class="detall-notes-titol">Notes</div>
          ${z.notes
            ? `<div class="notes-cos">${formatNotes(z.notes)}</div>`
            : '<div>Encara no hi ha notes per a aquesta zona.</div>'}
        </div>

        <div class="fitxa-peu">
          <span>🐋 SócBalena — Zones i punts de busseig</span>
          <span>Alta: ${formatData(z.creat_a)}</span>
        </div>
      </div>`;

    // ── Events ────────────────────────────────────
    el.querySelector('#btn-tornar').onclick = () => { window.location.hash = '/zones'; };

    el.querySelector('#btn-editar').onclick = () => {
      obrirModalZona(id, { onDesat: carregar });
    };

    el.querySelector('#btn-eliminar').onclick = async () => {
      if (!confirm('Eliminar aquesta zona?')) return;
      await api.zones.eliminar(id);
      window.location.hash = '/zones';
    };
  }

  await carregar();
}

function badgeTipus(t) {
  if (!t) return '<span class="badge badge-gris">Sense tipus</span>';
  return `<span class="badge badge-gris">${ICONES_TIPUS[t] || '📍'} ${escapeHtml(capitalitzar(t))}</span>`;
}

function badgeNivell(n) {
  if (!n) return '<span class="badge badge-gris">Sense nivell</span>';
  const cls = { principiant: 'badge-ok', intermedi: 'badge-cian', avançat: 'badge-warn', expert: 'badge-perill' };
  return `<span class="badge ${cls[n] || 'badge-gris'}">${escapeHtml(capitalitzar(n))}</span>`;
}

function labelTipus(t) {
  return t ? `${ICONES_TIPUS[t] || '📍'} ${capitalitzar(t)}` : null;
}

function formatCoord(v) {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(6) : null;
}

function formatData(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ca-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

function capitalitzar(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}
