// views/immersions.js
import { api } from '../api.js';
import { obrirModalImmersio } from './immersio-modal.js';

export async function renderImmersions(el, id) {
  let pagina = 1;
  const limit = 20;
  let filtre = '';
  let temporitzador = null;

  async function carregarDades() {
    const params = { page: pagina, limit };
    if (filtre.trim()) params.q = filtre.trim();
    return api.immersions.llista(params);
  }

  // ── Estructura fixa (capçalera + filtre + paginació) ──
  function pintarEstructura() {
    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h1>Immersions</h1>
          <p class="page-subtitle" id="subtitol-imm">Carregant...</p>
          <p class="page-subtitle" id="subtitol-imm">Totes les immersions realitzades ja sigui desde un centre de busseig o per lliure.</p>
        </div>
        <button class="btn btn-primary" id="btn-nova">+ Nova immersió</button>
      </div>

      <div class="barra-filtres">
        <input class="form-input" id="filtre-imm" type="search"
               placeholder="🔍 Cercar per zona, núm. o data..."
               value="${escapeAttr(filtre)}" />
        <select class="form-select selector-salt" id="salt-imm" aria-label="Anar a una immersió">
          <option value="">Tria una immersió…</option>
        </select>
        <div class="paginacio" id="paginacio-top"></div>
      </div>

      <div id="resultats-imm"></div>

      <div class="paginacio" id="paginacio-bot" style="margin-top:1.5rem"></div>
    `;

    el.querySelector('#btn-nova')?.addEventListener('click', () => obrirModalImmersio(null, { onDesat: refrescar }));

    const input = el.querySelector('#filtre-imm');
    input.addEventListener('input', () => {
      filtre = input.value;
      clearTimeout(temporitzador);
      temporitzador = setTimeout(() => { pagina = 1; renderResultats(); }, 300);
    });

    const select = el.querySelector('#salt-imm');
    select.addEventListener('change', () => {
      if (select.value) window.location.hash = `/immersio/${select.value}`;
    });
  }

  // ── Selector per saltar directament a una immersió ──
  async function carregarSelector() {
    const select = el.querySelector('#salt-imm');
    if (!select) return;
    try {
      const opcions = await api.immersions.opcions();
      select.innerHTML = `
        <option value="">Tria una immersió (${opcions.length})…</option>
        ${opcions.map(i => {
          const num = i.numero_immersio != null ? `#${i.numero_immersio}` : 'Sense núm.';
          const etiqueta = [num, formatData(i.data), i.zona_nom].filter(Boolean).join(' · ');
          return `<option value="${i.id}">${escapeAttr(etiqueta)}</option>`;
        }).join('')}`;
    } catch {
      select.innerHTML = '<option value="">No s\'han pogut carregar les immersions</option>';
    }
  }

  // Refresca resultats i selector després de crear, editar o eliminar
  function refrescar() {
    renderResultats();
    carregarSelector();
  }

  // ── Paginació (es pinta a dalt i a baix) ──
  function actualitzarPaginacio(totalPag) {
    const contingut = totalPag <= 1 ? '' : `
      <button class="btn btn-secondary btn-sm btn-pag" data-dir="ant" ${pagina <= 1 ? 'disabled' : ''}>← Anterior</button>
      <span class="pag-info">Pàg. ${pagina} / ${totalPag}</span>
      <button class="btn btn-secondary btn-sm btn-pag" data-dir="seg" ${pagina >= totalPag ? 'disabled' : ''}>Següent →</button>`;

    el.querySelectorAll('.paginacio').forEach(cont => {
      cont.innerHTML = contingut;
      cont.querySelectorAll('.btn-pag').forEach(btn => {
        btn.addEventListener('click', () => {
          pagina += btn.dataset.dir === 'ant' ? -1 : 1;
          renderResultats();
        });
      });
    });
  }

  // ── Resultats (taula + targetes) ──
  async function renderResultats() {
    const resultats = el.querySelector('#resultats-imm');
    resultats.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

    const { total, immersions } = await carregarDades();
    const totalPag = Math.ceil(total / limit);
    const filtrant = !!filtre.trim();

    el.querySelector('#subtitol-imm').textContent = filtrant
      ? `${total} ${total === 1 ? 'resultat' : 'resultats'} per a «${filtre.trim()}»`
      : `${total} registrades en total`;

    resultats.innerHTML = immersions.length === 0 ? `
      <div class="buit">
        <div class="icon">🤿</div>
        <h3>${filtrant ? 'Sense resultats' : 'Sense immersions'}</h3>
        <p>${filtrant ? 'Prova amb un altre filtre de cerca.' : 'Registra la teva primera immersió!'}</p>
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
      </div>`;

    // Events de les files
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
      btn.addEventListener('click', (e) => { e.stopPropagation(); obrirModalImmersio(btn.dataset.id, { onDesat: renderResultats }); });
    });

    el.querySelectorAll('.btn-eliminar').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        if (!confirm('Eliminar aquesta immersió i totes les seves fotos?')) return;
        await api.immersions.eliminar(btn.dataset.id);
        refrescar();
      });
    });

    actualitzarPaginacio(totalPag);
  }

  // Escoltar event de l'inici
  window.addEventListener('obrirNovaImmersio', () => {
    if (el.querySelector('#btn-nova')) obrirModalImmersio(null, { onDesat: refrescar });
  }, { once: true });

  pintarEstructura();
  await Promise.all([renderResultats(), carregarSelector()]);

  // Ruta per crear una nova immersió (des del dashboard)
  if (id === 'nova') {
    obrirModalImmersio(null, { onDesat: refrescar });
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
function estrelles(v) {
  if (!v) return '<span style="color:var(--color-gris)">—</span>';
  return `<span class="estrelles">${'⭐'.repeat(v)}</span>`;
}
function badgeVis(v) {
  if (!v) return '<span style="color:var(--color-gris)">—</span>';
  const cls = { 'excel·lent': 'badge-ok', 'bona': 'badge-ok', 'moderada': 'badge-warn', 'dolenta': 'badge-perill', 'nul·la': 'badge-perill' };
  return `<span class="badge ${cls[v] || 'badge-gris'}">${v}</span>`;
}
function escapeAttr(s) {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
