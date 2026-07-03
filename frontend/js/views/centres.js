// views/centres.js
import { api } from '../api.js';

export async function renderCentres(el) {
  async function renderLlista() {
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const centres = await api.centres.llista();

    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h1>Centres de busseig</h1>
          <p class="page-subtitle">${centres.length} centres registrats</p>
        </div>
        <button class="btn btn-primary" id="btn-nou">+ Nou centre</button>
      </div>

      ${centres.length === 0 ? `
        <div class="buit">
          <div class="icon">🏢</div>
          <h3>Sense centres</h3>
          <p>Afegeix el primer centre de busseig</p>
        </div>` : `
        <div class="grid-cards" id="grid-centres">
          ${centres.map(c => `
            <div class="card" style="cursor:pointer" data-id="${c.id}">
              <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:0.75rem">
                <h3>${escapeHtml(c.nom)}</h3>
                <div style="display:flex;gap:0.25rem">
                  <button class="btn btn-ghost btn-sm btn-editar" data-id="${c.id}">✏️</button>
                  <button class="btn btn-ghost btn-sm btn-eliminar" data-id="${c.id}">🗑️</button>
                </div>
              </div>
              ${c.pais || c.regio ? `<div style="color:var(--color-gris);font-size:0.875rem;margin-bottom:0.5rem">📍 ${[c.regio, c.pais].filter(Boolean).join(', ')}</div>` : ''}
              ${c.telefon ? `<div style="font-size:0.875rem">📞 ${escapeHtml(c.telefon)}</div>` : ''}
              ${c.email ? `<div style="font-size:0.875rem">✉️ ${escapeHtml(c.email)}</div>` : ''}
              ${c.web ? `<div style="font-size:0.875rem"><a href="${escapeHtml(c.web)}" target="_blank" style="color:var(--color-cian)">${escapeHtml(c.web)}</a></div>` : ''}
              <div style="margin-top:0.75rem;padding-top:0.75rem;border-top:1px solid var(--color-superfic)">
                <span class="badge badge-cian">${c.num_zones || 0} zones</span>
              </div>
            </div>`).join('')}
        </div>`}`;

    el.querySelector('#btn-nou')?.addEventListener('click', () => obrirModal(null));
    el.querySelectorAll('.btn-editar').forEach(btn =>
      btn.addEventListener('click', (e) => { e.stopPropagation(); obrirModal(btn.dataset.id); }));
    el.querySelectorAll('.btn-eliminar').forEach(btn =>
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Eliminar aquest centre?')) return;
        await api.centres.eliminar(btn.dataset.id);
        renderLlista();
      }));
  }

  function obrirModal(id) {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
      <div class="modal">
        <div class="modal-header">
          <h2>${id ? 'Editar centre' : 'Nou centre'}</h2>
          <button class="btn btn-ghost btn-icon" id="tancar">✕</button>
        </div>
        <div class="modal-body">
          <div id="alert-c"></div>
          <form id="form-centre">
            <div class="form-group">
              <label class="form-label">Nom *</label>
              <input class="form-input" type="text" name="nom" required placeholder="Nom del centre" />
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
            <div class="form-group">
              <label class="form-label">Adreça</label>
              <input class="form-input" type="text" name="adreca" />
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Telèfon</label>
                <input class="form-input" type="text" name="telefon" />
              </div>
              <div class="form-group">
                <label class="form-label">Correu electrònic</label>
                <input class="form-input" type="email" name="email" />
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Web</label>
              <input class="form-input" type="url" name="web" placeholder="https://" />
            </div>
            <div class="form-group">
              <label class="form-label">Notes</label>
              <textarea class="form-textarea" name="notes"></textarea>
            </div>
          </form>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" id="cancel">Cancel·lar</button>
          <button class="btn btn-primary" id="desar">💾 Desar</button>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    // Precarregar dades si editem
    if (id) {
      api.centres.obtenir(id).then(c => {
        const form = overlay.querySelector('#form-centre');
        Object.keys(c).forEach(k => {
          const inp = form.querySelector(`[name="${k}"]`);
          if (inp && c[k] != null) inp.value = c[k];
        });
      });
    }

    overlay.querySelector('#tancar').onclick = () => overlay.remove();
    overlay.querySelector('#cancel').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#desar').addEventListener('click', async () => {
      const dades = Object.fromEntries(new FormData(overlay.querySelector('#form-centre')));
      Object.keys(dades).forEach(k => { if (dades[k] === '') dades[k] = null; });
      try {
        if (id) await api.centres.editar(id, dades);
        else     await api.centres.crear(dades);
        overlay.remove();
        renderLlista();
      } catch (err) {
        overlay.querySelector('#alert-c').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      }
    });
  }

  await renderLlista();
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
