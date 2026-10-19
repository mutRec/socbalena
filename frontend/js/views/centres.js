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
            <div class="card no-click">
              <div class="centre-cap">
                <h3>${escapeHtml(c.nom)}</h3>
                <div style="display:flex;gap:0.25rem">
                  <button class="btn btn-ghost btn-sm btn-editar" data-id="${c.id}" title="Editar">✏️</button>
                  <button class="btn btn-ghost btn-sm btn-eliminar" data-id="${c.id}" title="Eliminar">🗑️</button>
                </div>
              </div>
              <div class="centre-cos">
                <div class="centre-info">
                  ${c.pais || c.regio ? `<div class="centre-linia">📍 ${[c.regio, c.pais].filter(Boolean).join(', ')}</div>` : ''}
                  ${c.telefon ? `<div class="centre-linia">📞 ${escapeHtml(c.telefon)}</div>` : ''}
                  ${c.email ? `<div class="centre-linia">✉️ ${escapeHtml(c.email)}</div>` : ''}
                  ${c.web ? `<div class="centre-linia"><a href="${escapeHtml(c.web)}" target="_blank" style="color:var(--color-cian)">${escapeHtml(c.web)}</a></div>` : ''}
                  <div class="centre-peu">
                    <span class="badge badge-cian">${c.num_zones || 0} zones</span>
                  </div>
                </div>
                <div class="centre-logo">
                  ${c.logo_url
                    ? `<img src="${escapeHtml(c.logo_url)}" alt="Logotip de ${escapeHtml(c.nom)}" loading="lazy" />`
                    : `<span class="centre-logo-buit" title="Sense logotip">🏢</span>`}
                </div>
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
              <label class="form-label">Logotip</label>
              <div class="logo-editor">
                <div class="logo-preview" id="logo-preview"></div>
                <div class="logo-accions">
                  <input type="file" id="logo-input" accept="image/jpeg,image/png,image/webp,image/heic" hidden />
                  <button type="button" class="btn btn-secondary btn-sm" id="logo-tria">📷 Triar imatge</button>
                  <button type="button" class="btn btn-ghost btn-sm" id="logo-treure">🗑️ Treure</button>
                  <div class="form-hint">JPG, PNG o WEBP · màx. 10 MB · es mostrarà en rodó, a la dreta de la fitxa del centre</div>
                </div>
              </div>
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

    // ── Logotip ─────────────────────────────────────
    const logoPreview = overlay.querySelector('#logo-preview');
    const logoInput = overlay.querySelector('#logo-input');
    let logoActual = null;      // logo_url desat al servidor
    let logoFitxer = null;      // fitxer nou triat (encara no pujat)
    let logoEsborrar = false;   // l'usuari vol treure el logotip

    const pintarLogo = (src) => {
      logoPreview.innerHTML = src
        ? `<img src="${src}" alt="Logotip" />`
        : '<span class="logo-buit" title="Sense logotip">🏢</span>';
    };
    pintarLogo(null);

    overlay.querySelector('#logo-tria').onclick = () => logoInput.click();
    logoInput.addEventListener('change', () => {
      const f = logoInput.files && logoInput.files[0];
      if (!f) return;
      logoFitxer = f;
      logoEsborrar = false;
      pintarLogo(URL.createObjectURL(f));
    });
    overlay.querySelector('#logo-treure').onclick = () => {
      logoFitxer = null;
      logoEsborrar = true;
      logoInput.value = '';
      pintarLogo(null);
    };

    // Precarregar dades si editem
    if (id) {
      api.centres.obtenir(id).then(c => {
        const form = overlay.querySelector('#form-centre');
        Object.keys(c).forEach(k => {
          const inp = form.querySelector(`[name="${k}"]`);
          if (inp && c[k] != null) inp.value = c[k];
        });
        logoActual = c.logo_url || null;
        pintarLogo(logoActual);
      });
    }

    overlay.querySelector('#tancar').onclick = () => overlay.remove();
    overlay.querySelector('#cancel').onclick = () => overlay.remove();
    overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

    overlay.querySelector('#desar').addEventListener('click', async () => {
      const btnDesar = overlay.querySelector('#desar');
      const dades = Object.fromEntries(new FormData(overlay.querySelector('#form-centre')));
      Object.keys(dades).forEach(k => { if (dades[k] === '') dades[k] = null; });
      btnDesar.disabled = true;
      btnDesar.textContent = '💾 Desant...';
      try {
        const centre = id ? await api.centres.editar(id, dades) : await api.centres.crear(dades);
        const centreId = id || centre?.id;

        // El logotip es puja després de desar perquè en un centre nou encara no hi ha ID
        if (centreId && logoFitxer) await api.centres.pujarLogo(centreId, logoFitxer);
        else if (centreId && logoEsborrar && logoActual) await api.centres.eliminarLogo(centreId);

        overlay.remove();
        renderLlista();
      } catch (err) {
        overlay.querySelector('#alert-c').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
        btnDesar.disabled = false;
        btnDesar.textContent = '💾 Desar';
      }
    });
  }

  await renderLlista();
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
