// views/centre-detall.js
import { api } from '../api.js';
import { escapeHtml, formatNotes } from '../format.js';
import { obrirModalCentre } from './centre-modal.js';

export async function renderCentreDetall(el, id) {
  if (!id) { el.innerHTML = '<div class="alert alert-error">ID no especificat</div>'; return; }

  async function carregar() {
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const centre = await api.centres.obtenir(id);
    renderDetall(centre);
  }

  function renderDetall(c) {
    const zones = c.zones || [];
    const lloc = [c.regio, c.pais].filter(Boolean).join(', ');
    const web = urlExterna(c.web);

    const dades = [
      c.adreca ? { label: '📍 Adreça', html: escapeHtml(c.adreca) } : null,
      c.telefon ? {
        label: '📞 Telèfon',
        html: `<a href="tel:${escapeHtml(c.telefon.replace(/[^\d+]/g, ''))}">${escapeHtml(c.telefon)}</a>`
      } : null,
      c.email ? {
        label: '✉️ Correu',
        html: `<a href="mailto:${escapeHtml(c.email)}">${escapeHtml(c.email)}</a>`
      } : null,
      web ? {
        label: '🌐 Web',
        html: `<a href="${escapeHtml(web)}" target="_blank" rel="noopener noreferrer">${escapeHtml(c.web)}</a>`
      } : null,
    ].filter(Boolean);

    el.innerHTML = `
      <div class="page-header">
        <div class="page-header-left">
          <button class="btn btn-secondary btn-sm" id="btn-tornar">← Tornar</button>
          <div class="page-title">
            <h1>${escapeHtml(c.nom)}</h1>
            <p class="page-subtitle">${lloc ? escapeHtml(lloc) : 'Sense ubicació'}</p>
          </div>
        </div>
        <div class="page-accions">
          <button class="btn btn-secondary" id="btn-editar">✏️ Editar</button>
          <button class="btn btn-danger" id="btn-eliminar">🗑️ Eliminar</button>
        </div>
      </div>

      <!-- FITXA DEL CENTRE -->
      <div class="card" style="margin-bottom:1.5rem;">
        <div class="fitxa-cap">
          <div class="centre-logo centre-logo-gran">
            ${c.logo_url
              ? `<img src="${escapeHtml(c.logo_url)}" alt="Logotip de ${escapeHtml(c.nom)}" />`
              : `<span class="centre-logo-buit" title="Sense logotip">🏢</span>`}
          </div>
          <div class="fitxa-info">
            <h2 style="font-family:'Barlow Condensed',sans-serif;font-size:2rem;color:var(--color-cian);font-weight:700;margin-bottom:0.25rem;">
              ${escapeHtml(c.nom)}
            </h2>
            ${lloc ? `<div style="color:var(--color-gris);margin-bottom:0.5rem;">📍 ${escapeHtml(lloc)}</div>` : ''}

            ${dades.length ? `
              <div class="detall-dades">
                ${dades.map(d => `
                  <div class="detall-dada">
                    <div class="detall-dada-etiqueta">${d.label}</div>
                    <div class="detall-dada-valor">${d.html}</div>
                  </div>`).join('')}
              </div>` : `
              <div class="form-hint" style="margin-top:1rem;">Aquest centre encara no té dades de contacte.</div>`}
          </div>
        </div>

        <div class="detall-notes ${c.notes ? '' : 'detall-notes-buit'}">
          <div class="detall-notes-titol">Notes</div>
          ${c.notes
            ? `<div class="notes-cos">${formatNotes(c.notes)}</div>`
            : '<div>Encara no hi ha notes per a aquest centre.</div>'}
        </div>

        <div class="fitxa-peu">
          <span>🐋 SócBalena — Centres de busseig</span>
          <span>Alta: ${formatData(c.creat_a)}</span>
        </div>
      </div>

      <!-- ZONES ASSOCIADES -->
      <div class="card">
        <div class="galeria-cap">
          <h3>🗺️ Zones associades (${zones.length})</h3>
          <a class="btn btn-secondary btn-sm" href="#/zones">Veure totes les zones</a>
        </div>

        ${zones.length === 0 ? `
          <div class="buit" style="padding:2rem">
            <div class="icon">🗺️</div>
            <p>Sense zones associades a aquest centre.</p>
          </div>` : `
          <div class="zones-centre">
            ${zones.map(z => `
              <a class="zona-centre-fila" href="#/zona/${z.id}">
                <div>
                  <div class="zona-centre-nom">${escapeHtml(z.nom)}</div>
                  <div class="zona-centre-meta">
                    ${[labelTipus(z.tipus), z.nivell_dificultat ? capitalitzar(z.nivell_dificultat) : null]
                      .filter(Boolean).join(' · ') || 'Sense tipus'}
                  </div>
                </div>
                <span class="badge badge-cian">${z.profunditat_max ? z.profunditat_max + ' m' : '—'}</span>
              </a>`).join('')}
          </div>`}
      </div>`;

    // ── Events ────────────────────────────────────
    el.querySelector('#btn-tornar').onclick = () => { window.location.hash = '/centres'; };

    el.querySelector('#btn-editar').onclick = () => {
      obrirModalCentre(id, { onDesat: carregar });
    };

    el.querySelector('#btn-eliminar').onclick = async () => {
      if (!confirm('Eliminar aquest centre?')) return;
      await api.centres.eliminar(id);
      window.location.hash = '/centres';
    };
  }

  await carregar();
}

function urlExterna(web) {
  if (!web) return null;
  const valor = String(web).trim();
  return /^https?:\/\//i.test(valor) ? valor : `https://${valor}`;
}

function labelTipus(t) {
  if (!t) return null;
  const icones = { escull: '🪸', paret: '🏔️', cova: '🕳️', derelicte: '⚓', platja: '🏖️', llac: '🏞️', riu: '🌊', altre: '📍' };
  return `${icones[t] || ''} ${capitalitzar(t)}`.trim();
}

function formatData(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ca-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}

function capitalitzar(text) {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}
