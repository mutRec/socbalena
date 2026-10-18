// views/immersions.js
import { api } from '../api.js';
import { obrirModalImmersio } from './immersio-modal.js';

export async function renderImmersions(el, id) {
  let pagina = 1;
  const limit = 20;

  async function carregarDades() {
    return api.immersions.llista({ page: pagina, limit });
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
    el.querySelector('#btn-nova')?.addEventListener('click', () => obrirModalImmersio(null, { onDesat: renderLlista }));

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
      btn.addEventListener('click', (e) => { e.stopPropagation(); obrirModalImmersio(btn.dataset.id, { onDesat: renderLlista }); });
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

  // Escoltar event de l'inici
  window.addEventListener('obrirNovaImmersio', () => {
    if (el.querySelector('#btn-nova')) obrirModalImmersio(null, { onDesat: renderLlista });
  }, { once: true });

  await renderLlista();

  // Ruta per crear una nova immersió (des del dashboard)
  if (id === 'nova') {
    obrirModalImmersio(null, { onDesat: renderLlista });
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
