// views/immersio-modal.js
// Modal compartit per crear/editar immersions (usat per la llista i el detall)
import { api } from '../api.js';
import { escapeHtml, formatNotes } from '../format.js';

/**
 * Obre el modal de nova/editar immersió.
 * @param {string|number|null} id  ID de la immersió a editar, o null per crear-ne una de nova.
 * @param {{ onDesat?: Function }} [opcions]  Callback executat després de desar correctament.
 */
export async function obrirModalImmersio(id = null, { onDesat } = {}) {
  const [imm, centres, zones] = await Promise.all([
    id ? api.immersions.obtenir(id) : Promise.resolve(null),
    api.centres.llista(),
    api.zones.llista()
  ]);

  const optsCentres = centres.map(c => `<option value="${c.id}" ${imm?.centre_id === c.id ? 'selected' : ''}>${c.nom}</option>`).join('');
  const optsZones   = zones.map(z => `<option value="${z.id}" ${imm?.zona_id === z.id ? 'selected' : ''}>${z.nom}</option>`).join('');

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
            <textarea class="form-textarea form-textarea-notes" name="notes" rows="7" placeholder="Com va anar la immersió...">${escapeHtml(imm?.notes || '')}</textarea>
            <div class="form-hint">
              Format bàsic: <code>**negreta**</code> · <code>*cursiva*</code> · línies que comencen per <code>-</code> fan llista ·
              <code>1.</code> per numerar · <code>## Títol</code> per subtítol · <code>[text](https://...)</code> per enllaç.
              Els retorns de línia i els paràgrafs es respecten.
            </div>
            <div class="notes-vista">
              <div class="notes-vista-titol">Vista prèvia</div>
              <div class="notes-cos" id="notes-preview"></div>
            </div>
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

  // Vista prèvia de les notes (mateix format que a la fitxa de la immersió)
  const textareaNotes = overlay.querySelector('[name="notes"]');
  const previewNotes = overlay.querySelector('#notes-preview');
  const actualitzarPreview = () => {
    previewNotes.innerHTML = formatNotes(textareaNotes.value) || '<span class="notes-buit">Res a mostrar</span>';
  };
  textareaNotes.addEventListener('input', actualitzarPreview);
  actualitzarPreview();

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
      if (onDesat) await onDesat();
    } catch (err) {
      alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  });
}

function avui() { return new Date().toISOString().slice(0, 10); }
