// views/zone-modal.js
// Modal compartit per crear/editar zones (usat per la llista i el detall)
import { api } from '../api.js';
import { escapeHtml } from '../format.js';

/**
 * Obre el modal de nova/editar zona.
 * @param {string|number|null} id  ID de la zona a editar, o null per crear-ne una de nova.
 * @param {{ onDesat?: Function }} [opcions]  Callback executat després de desar correctament.
 */
export async function obrirModalZona(id = null, { onDesat } = {}) {
  let centres = [];
  let zona = null;
  try {
    [centres, zona] = await Promise.all([
      api.centres.llista(),
      id ? api.zones.obtenir(id) : Promise.resolve(null)
    ]);
  } catch (err) {
    alert(err.message);
    return;
  }

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

  if (zona) {
    const form = overlay.querySelector('#form-zona');
    Object.keys(zona).forEach(k => {
      const inp = form.querySelector(`[name="${k}"]`);
      if (inp && zona[k] != null) inp.value = zona[k];
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
      onDesat?.();
    } catch (err) {
      overlay.querySelector('#alert-z').innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  });
}
