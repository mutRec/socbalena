// views/immersions.js
import { api } from '../api.js';

export async function renderImmersions(el, id) {
  let pagina = 1;
  const limit = 20;
  let centresCache = [], zonesCache = [];

  async function carregarDades() {
    const [res, centres, zones] = await Promise.all([
      api.immersions.llista({ page: pagina, limit }),
      api.centres.llista(),
      api.zones.llista()
    ]);
    centresCache = centres;
    zonesCache = zones;
    return res;
  }

  async function renderLlista() {
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const { total, immersions } = await carregarDades();
    const totalPag = Math.ceil(total / limit);

    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h1>Immersions</h1>
          <p class="page-subtitle">${total} registrades en total</p>
        </div>
        <button class="btn btn-primary" id="btn-nova">+ Nova immersió</button>
      </div>

      ${immersions.length === 0 ? `
        <div class="buit">
          <div class="icon">🤿</div>
          <h3>Sense immersions</h3>
          <p>Registra la teva primera immersió!</p>
        </div>` : `
        <div class="wrapper-desktop">
        <div class="taula-wrapper">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th>Zona</th>
                <th>Prof. màx</th>
                <th>Temps fons</th>
                <th>Visibilitat</th>
                <th>Valoració</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="tbody-imm">
              ${immersions.map(i => `
                <tr class="clickable" data-id="${i.id}">
                  <td><strong style="color:var(--color-cian)">#${i.numero_immersio || '—'}</strong></td>
                  <td>${formatData(i.data)}</td>
                  <td>
                    <div>${i.zona_nom || '<span style="color:var(--color-gris)">—</span>'}</div>
                    ${i.centre_nom ? `<div style="font-size:0.75rem;color:var(--color-gris)">${i.centre_nom}</div>` : ''}
                  </td>
                  <td>${i.profunditat_max ? `<strong>${i.profunditat_max}m</strong>` : '—'}</td>
                  <td>${i.temps_fons ? i.temps_fons + ' min' : '—'}</td>
                  <td>${badgeVis(i.visibilitat)}</td>
                  <td>${estrelles(i.valoracio)}</td>
                  <td>
                    <button class="btn btn-ghost btn-sm btn-editar" data-id="${i.id}" title="Editar">✏️</button>
                    <button class="btn btn-ghost btn-sm btn-eliminar" data-id="${i.id}" title="Eliminar">🗑️</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        </div>
        <div class="wrapper-mobil">
          <div class="grid-targetes">
            ${immersions.map(targetaImm).join('')}
          </div>
        </div>`}
        ${totalPag > 1 ? `
          <div style="display:flex;justify-content:center;gap:0.5rem;margin-top:1.5rem;">
            <button class="btn btn-secondary btn-sm" id="pag-ant" ${pagina <= 1 ? 'disabled' : ''}>← Anterior</button>
            <span style="padding:0.35rem 0.75rem;color:var(--color-gris)">Pàg. ${pagina} / ${totalPag}</span>
            <button class="btn btn-secondary btn-sm" id="pag-seg" ${pagina >= totalPag ? 'disabled' : ''}>Següent →</button>
          </div>` : ''}
      `;

    // Events
    el.querySelector('#btn-nova')?.addEventListener('click', () => obrirModal(null));

    el.querySelector('#pag-ant')?.addEventListener('click', () => { pagina--; renderLlista(); });
    el.querySelector('#pag-seg')?.addEventListener('click', () => { pagina++; renderLlista(); });

    el.querySelectorAll('tr.clickable').forEach(tr => {
      tr.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        window.location.hash = `/immersio/${tr.dataset.id}`;
      });
    });

    el.querySelectorAll('.wrapper-mobil .targeta').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.closest('button')) return;
        window.location.hash = `/immersio/${card.dataset.id}`;
      });
    });

    el.querySelectorAll('.btn-editar').forEach(btn => {
      btn.addEventListener('click', (e) => { e.stopPropagation(); obrirModal(btn.dataset.id); });
    });

    el.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Eliminar aquesta immersió i totes les seves fotos?')) return;
        await api.immersions.eliminar(btn.dataset.id);
        renderLlista();
      });
    });
  }

  async function obrirModal(id) {
    let imm = null;
    if (id) imm = await api.immersions.obtenir(id);

    const optsCentres = centresCache.map(c => `<option value="${c.id}" ${imm?.centre_id === c.id ? 'selected' : ''}>${c.nom}</option>`).join('');
    const optsZones   = zonesCache.map(z => `<option value="${z.id}" ${imm?.zona_id === z.id ? 'selected' : ''}>${z.nom}</option>`).join('');

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal modal-xl">
        <div class="modal-header">
          <h2>${id ? `Editar immersió #${imm?.numero_immersio}` : 'Nova immersió'}</h2>
          <button class="btn btn-ghost btn-icon" id="tancar-modal">✕</button>
        </div>
        <div class="modal-body">
          <div id="alert-modal"></div>
          <form id="form-imm">
            <!-- Secció bàsica -->
            <h3 style="color:var(--color-cian);margin-bottom:1rem;border-bottom:1px solid var(--color-superfic);padding-bottom:0.5rem">📅 Dades generals</h3>
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Nº immersió</label>
                <input class="form-input" type="number" name="numero_immersio" value="${imm?.numero_immersio || ''}" placeholder="Auto" min="1" />
              </div>
              <div class="form-group">
                <label class="form-label">Data *</label>
                <input class="form-input" type="date" name="data" value="${imm?.data?.slice(0,10) || avui()}" required />
              </div>
              <div class="form-group">
                <label class="form-label">Hora entrada</label>
                <input class="form-input" type="time" name="hora_entrada" value="${imm?.hora_entrada?.slice(0,5) || ''}" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Hora sortida</label>
                <input class="form-input" type="time" name="hora_sortida" value="${imm?.hora_sortida?.slice(0,5) || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Centre</label>
                <select class="form-select" name="centre_id">
                  <option value="">— Cap centre —</option>
                  ${optsCentres}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Zona de busseig</label>
                <select class="form-select" name="zona_id">
                  <option value="">— Sense zona —</option>
                  ${optsZones}
                </select>
              </div>
            </div>

            <h3 style="color:var(--color-cian);margin:1.5rem 0 1rem;border-bottom:1px solid var(--color-superfic);padding-bottom:0.5rem">📏 Paràmetres tècnics</h3>
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Prof. màxima (m)</label>
                <input class="form-input" type="number" step="0.1" name="profunditat_max" value="${imm?.profunditat_max || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Prof. mitjana (m)</label>
                <input class="form-input" type="number" step="0.1" name="profunditat_mitja" value="${imm?.profunditat_mitja || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Temps de fons (min)</label>
                <input class="form-input" type="number" name="temps_fons" value="${imm?.temps_fons || ''}" />
              </div>
            </div>
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Pressió entrada (bar)</label>
                <input class="form-input" type="number" name="pressio_entrada" value="${imm?.pressio_entrada || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Pressió sortida (bar)</label>
                <input class="form-input" type="number" name="pressio_sortida" value="${imm?.pressio_sortida || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Capacitat ampolla (L)</label>
                <input class="form-input" type="number" name="capacitat_bombona" value="${imm?.capacitat_bombona || ''}" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tipus gas</label>
                <input class="form-input" type="text" name="tipus_gas" value="${imm?.tipus_gas || 'Aire'}" placeholder="Aire, Nitrox 32%, EANx..." />
              </div>
              <div class="form-group">
                <label class="form-label">Temps en superfície (min)</label>
                <input class="form-input" type="number" name="temps_superficie" value="${imm?.temps_superficie || ''}" />
              </div>
            </div>

            <h3 style="color:var(--color-cian);margin:1.5rem 0 1rem;border-bottom:1px solid var(--color-superfic);padding-bottom:0.5rem">🌊 Condicions</h3>
            <div class="form-row-3">
              <div class="form-group">
                <label class="form-label">Visibilitat</label>
                <select class="form-select" name="visibilitat">
                  <option value="">—</option>
                  ${['excel·lent','bona','moderada','dolenta','nul·la'].map(v => `<option value="${v}" ${imm?.visibilitat === v ? 'selected' : ''}>${v.charAt(0).toUpperCase()+v.slice(1)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Corrent</label>
                <select class="form-select" name="corrent">
                  <option value="">—</option>
                  ${['cap','feble','moderat','fort','molt fort'].map(v => `<option value="${v}" ${imm?.corrent === v ? 'selected' : ''}>${v.charAt(0).toUpperCase()+v.slice(1)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Onatge</label>
                <select class="form-select" name="onatge">
                  <option value="">—</option>
                  ${['pla','lleuger','moderat','fort'].map(v => `<option value="${v}" ${imm?.onatge === v ? 'selected' : ''}>${v.charAt(0).toUpperCase()+v.slice(1)}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Temperatura aigua (°C)</label>
                <input class="form-input" type="number" step="0.1" name="temp_aigua" value="${imm?.temp_aigua || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Temperatura aire (°C)</label>
                <input class="form-input" type="number" step="0.1" name="temp_aire" value="${imm?.temp_aire || ''}" />
              </div>
            </div>

            <h3 style="color:var(--color-cian);margin:1.5rem 0 1rem;border-bottom:1px solid var(--color-superfic);padding-bottom:0.5rem">🥽 Equipament</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tipus de vestit</label>
                <select class="form-select" name="tipus_vestit">
                  <option value="">—</option>
                  ${[['sec','Sec'],['semisec','Semisec'],['humit_5mm','Humit 5mm'],['humit_3mm','Humit 3mm'],['rashguard','Rashguard'],['altre','Altre']].map(([v,l]) => `<option value="${v}" ${imm?.tipus_vestit === v ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Llastre (kg)</label>
                <input class="form-input" type="number" step="0.5" name="pes_llastre" value="${imm?.pes_llastre || ''}" />
              </div>
            </div>

            <h3 style="color:var(--color-cian);margin:1.5rem 0 1rem;border-bottom:1px solid var(--color-superfic);padding-bottom:0.5rem">📝 Notes</h3>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Company/a de busseig</label>
                <input class="form-input" type="text" name="company" value="${imm?.company || ''}" />
              </div>
              <div class="form-group">
                <label class="form-label">Instructor</label>
                <input class="form-input" type="text" name="instructor" value="${imm?.instructor || ''}" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Tipus d'immersió</label>
                <select class="form-select" name="tipus_immersio">
                  <option value="">—</option>
                  ${[['recreativa','Recreativa'],['formació','Formació'],['tècnica','Tècnica'],['fotografia','Fotografia'],['noctorna','Nocturna'],['decompressió','Descompressió'],['altra','Altra']].map(([v,l]) => `<option value="${v}" ${imm?.tipus_immersio === v ? 'selected' : ''}>${l}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Valoració (1-5)</label>
                <select class="form-select" name="valoracio">
                  <option value="">—</option>
                  ${[1,2,3,4,5].map(v => `<option value="${v}" ${imm?.valoracio == v ? 'selected' : ''}>` + '⭐'.repeat(v) + `</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Notes i observacions</label>
              <textarea class="form-textarea" name="notes" rows="4">${imm?.notes || ''}</textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="tancar-modal-2">Cancel·lar</button>
          <button class="btn btn-primary" id="desar-imm">💾 Desar</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);
    overlay.querySelector('#tancar-modal').onclick = () => overlay.remove();
    overlay.querySelector('#tancar-modal-2').onclick = () => overlay.remove();
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#desar-imm').addEventListener('click', async () => {
      const form = overlay.querySelector('#form-imm');
      const dades = Object.fromEntries(new FormData(form));
      // Netejar buits
      Object.keys(dades).forEach(k => { if (dades[k] === '') dades[k] = null; });

      const alertEl = overlay.querySelector('#alert-modal');
      try {
        if (id) await api.immersions.editar(id, dades);
        else     await api.immersions.crear(dades);
        overlay.remove();
        renderLlista();
      } catch (err) {
        alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      }
    });
  }

  // Escoltar event de l'inici
  window.addEventListener('obrirNovaImmersio', () => {
    if (el.querySelector('#btn-nova')) obrirModal(null);
  }, { once: true });

  await renderLlista();

  // Ruta per crear una nova immersió (des del dashboard)
  if (id === 'nova') {
    obrirModal(null);
    history.replaceState(null, '', '#/immersions');
  }
}

function targetaImm(i) {
  return `
    <article class="targeta" data-id="${i.id}">
      <div class="targeta-cap">
        <span class="targeta-num">#${i.numero_immersio || '—'}</span>
        <span class="targeta-data">${formatData(i.data)}</span>
      </div>
      <div class="targeta-titol">${i.zona_nom || 'Sense zona'}</div>
      ${i.centre_nom ? `<div class="targeta-subtit">${i.centre_nom}</div>` : ''}
      <div class="targeta-meta">
        ${i.profunditat_max ? `<span class="targeta-chip">📏 ${i.profunditat_max} m</span>` : ''}
        ${i.temps_fons ? `<span class="targeta-chip">⏱️ ${i.temps_fons} min</span>` : ''}
        ${badgeVis(i.visibilitat)}
        ${estrelles(i.valoracio)}
      </div>
      <div class="targeta-accions">
        <button class="btn btn-ghost btn-sm btn-editar" data-id="${i.id}" title="Editar">✏️</button>
        <button class="btn btn-ghost btn-sm btn-eliminar" data-id="${i.id}" title="Eliminar">🗑️</button>
      </div>
    </article>`;
}

function formatData(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
function avui() { return new Date().toISOString().slice(0, 10); }
function estrelles(v) {
  if (!v) return '<span style="color:var(--color-gris)">—</span>';
  return `<span class="estrelles">${'⭐'.repeat(v)}</span>`;
}
function badgeVis(v) {
  if (!v) return '<span style="color:var(--color-gris)">—</span>';
  const cls = { 'excel·lent': 'badge-ok', 'bona': 'badge-ok', 'moderada': 'badge-warn', 'dolenta': 'badge-perill', 'nul·la': 'badge-perill' };
  return `<span class="badge ${cls[v] || 'badge-gris'}">${v}</span>`;
}
