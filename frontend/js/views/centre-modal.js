// views/centre-modal.js
// Modal compartit per crear/editar centres (usat per la llista i el detall)
import { api } from '../api.js';

/**
 * Obre el modal de nou/editar centre.
 * @param {string|number|null} id  ID del centre a editar, o null per crear-ne un de nou.
 * @param {{ onDesat?: Function }} [opcions]  Callback executat després de desar correctament.
 */
export async function obrirModalCentre(id = null, { onDesat } = {}) {
  let centre = null;
  if (id) {
    try {
      centre = await api.centres.obtenir(id);
    } catch (err) {
      alert(err.message);
      return;
    }
  }

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
  if (centre) {
    const form = overlay.querySelector('#form-centre');
    Object.keys(centre).forEach(k => {
      const inp = form.querySelector(`[name="${k}"]`);
      if (inp && centre[k] != null) inp.value = centre[k];
    });
    logoActual = centre.logo_url || null;
    pintarLogo(logoActual);
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
      onDesat?.();
    } catch (err) {
      overlay.querySelector('#alert-c').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
      btnDesar.disabled = false;
      btnDesar.textContent = '💾 Desar';
    }
  });
}
