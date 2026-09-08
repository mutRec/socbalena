// views/zones.js
import { api } from '../api.js';

export async function renderZones(el) {
  async function renderLlista() {
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const [zones, centres] = await Promise.all([api.zones.llista(), api.centres.llista()]);

    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h1>Zones de busseig</h1>
          <p class="page-subtitle">${zones.length} zones registrades</p>
        </div>
        <button class="btn btn-primary" id="btn-nova">+ Nova zona</button>
      </div>

      ${zones.length === 0 ? `
        <div class="buit">
          <div class="icon">🗺️</div>
          <h3>Sense zones</h3>
          <p>Afegeix el primer lloc de busseig</p>
        </div>` : `
        <div class="wrapper-desktop">
        <div class="taula-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Tipus</th>
                <th>Nivell</th>
                <th>Prof. màx</th>
                <th>Centre</th>
                <th>País / Regió</th>
                <th>Immersions</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              ${zones.map(z => `
                <tr>
                  <td><strong>${escapeHtml(z.nom)}</strong></td>
                  <td>${badgeTipus(z.tipus)}</td>
                  <td>${badgeNivell(z.nivell_dificultat)}</td>
                  <td>${z.profunditat_max ? z.profunditat_max + ' m' : '—'}</td>
                  <td>${z.centre_nom ? escapeHtml(z.centre_nom) : '<span style="color:var(--color-gris)">—</span>'}</td>
                  <td style="color:var(--color-gris);font-size:0.875rem">${[z.regio, z.pais].filter(Boolean).join(', ') || '—'}</td>
                  <td><span class="badge badge-gris">${z.num_immersions || 0}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm btn-editar" data-id="${z.id}">✏️</button>
                    <button class="btn btn-ghost btn-sm btn-eliminar" data-id="${z.id}">🗑️</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        </div>
        <div class="wrapper-mobil">
          <div class="grid-targetes">
            ${zones.map(targetaZona).join('')}
          </div>
        </div>`}`;

    el.querySelector('#btn-nova')?.addEventListener('click', () => obrirModal(null, centres));
    el.querySelectorAll('.btn-editar').forEach(btn =>
      btn.addEventListener('click', () => obrirModal(btn.dataset.id, centres)));
    el.querySelectorAll('.btn-eliminar').forEach(btn =>
      btn.addEventListener('click', async () => {
        if (!confirm('Eliminar aquesta zona?')) return;
        await api.zones.eliminar(btn.dataset.id);
        renderLlista();
      }));
  }

  function obrirModal(id, centres) {
    const optsCentres = centres.map(c =>
      `<option value="${c.id}">${escapeHtml(c.nom)}</option>`).join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>${id ? 'Editar zona' : 'Nova zona'}</h2>
          <button class="btn btn-ghost btn-icon" id="tancar">✕</button>
        </div>
        <div class="modal-body">
          <div id="alert-z"></div>
          <form id="form-zona">
            <div class="form-group">
              <label class="form-label">Nom *</label>
              <input class="form-input" type="text" name="nom" required placeholder="Nom del lloc de busseig" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tipus</label>
                <select class="form-select" name="tipus">
                  <option value="">—</option>
                  ${['escull','paret','cova','derelicte','platja','llac','riu','altre']
                    .map(t => `<option value="${t}">${t.charAt(0).toUpperCase()+t.slice(1)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Nivell de dificultat</label>
                <select class="form-select" name="nivell_dificultat">
                  <option value="">—</option>
                  ${[['principiant','Principiant'],['intermedi','Intermedi'],['avançat','Avançat'],['expert','Expert']]
                    .map(([v,l]) => `<option value="${v}">${l}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">País</label>
                <input class="form-input" type="text" name="pais" placeholder="Espanya" />
              </div>
              <div class="form-group">
                <label class="form-label">Regió</label>
                <input class="form-input" type="text" name="regio" placeholder="Costa Brava" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Latitud</label>
                <input class="form-input" type="number" step="0.000001" name="latitud" placeholder="41.123456" />
              </div>
              <div class="form-group">
                <label class="form-label">Longitud</label>
                <input class="form-input" type="number" step="0.000001" name="longitud" placeholder="3.123456" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Profunditat màxima (m)</label>
                <input class="form-input" type="number" step="0.5" name="profunditat_max" />
              </div>
              <div class="form-group">
                <label class="form-label">Centre associat</label>
                <select class="form-select" name="centre_id">
                  <option value="">— Cap —</option>
                  ${optsCentres}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Descripció</label>
              <textarea class="form-textarea" name="descripcio" placeholder="Descripció del lloc, fauna, característiques..."></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-textarea" name="notes" placeholder="Advertències, consells, accés..."></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancel">Cancel·lar</button>
          <button class="btn btn-primary" id="desar">💾 Desar</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    if (id) {
      api.zones.obtenir(id).then(z => {
        const form = overlay.querySelector('#form-zona');
        Object.keys(z).forEach(k => {
          const inp = form.querySelector(`[name="${k}"]`);
          if (inp && z[k] != null) inp.value = z[k];
        });
      });
    }

    overlay.querySelector('#tancar').onclick = () => overlay.remove();
    overlay.querySelector('#cancel').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#desar').addEventListener('click', async () => {
      const dades = Object.fromEntries(new FormData(overlay.querySelector('#form-zona')));
      Object.keys(dades).forEach(k => { if (dades[k] === '') dades[k] = null; });
      try {
        if (id) await api.zones.editar(id, dades);
        else     await api.zones.crear(dades);
        overlay.remove();
        renderLlista();
      } catch (err) {
        overlay.querySelector('#alert-z').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      }
    });
  }

  await renderLlista();
}

function escapeHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function badgeTipus(t) {
  if (!t) return '<span style="color:var(--color-gris)">—</span>';
  const icons = { escull:'🪸', paret:'🏔️', cova:'🕳️', derelicte:'⚓', platja:'🏖️', llac:'🏞️', riu:'🌊', altre:'📍' };
  return `<span class="badge badge-gris">${icons[t]||''} ${t}</span>`;
}

function badgeNivell(n) {
  if (!n) return '<span style="color:var(--color-gris)">—</span>';
  const cls = { principiant:'badge-ok', intermedi:'badge-cian', avançat:'badge-warn', expert:'badge-perill' };
  return `<span class="badge ${cls[n]||'badge-gris'}">${n}</span>`;
}

function targetaZona(z) {
  const lloc = [z.regio, z.pais].filter(Boolean).join(', ');
  return `
    <article class="targeta no-click" data-id="${z.id}">
      <div class="targeta-cap">
        <span class="targeta-nom">${escapeHtml(z.nom)}</span>
        ${badgeTipus(z.tipus)}
      </div>
      ${z.centre_nom ? `<div class="targeta-subtit">🏢 ${escapeHtml(z.centre_nom)}</div>` : ''}
      ${lloc ? `<div class="targeta-subtit">📍 ${escapeHtml(lloc)}</div>` : ''}
      <div class="targeta-meta">
        ${z.profunditat_max ? `<span class="targeta-chip">📏 ${z.profunditat_max} m</span>` : ''}
        ${badgeNivell(z.nivell_dificultat)}
      </div>
      <div class="targeta-accions" style="justify-content:space-between;align-items:center">
        <span class="badge badge-gris">${z.num_immersions || 0} immersions</span>
        <div style="display:flex;gap:0.25rem">
          <button class="btn btn-ghost btn-sm btn-editar" data-id="${z.id}" title="Editar">✏️</button>
          <button class="btn btn-ghost btn-sm btn-eliminar" data-id="${z.id}" title="Eliminar">🗑️</button>
        </div>
      </div>
    </article>`;
}
