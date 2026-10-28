// views/zones.js
import { api } from '../api.js';
import { escapeHtml, enllacXip } from '../format.js';
import { obrirModalZona } from './zone-modal.js';
import { obrirConfirmacio } from './confirm-modal.js';

let zonesOrdenades = [];
let ordreDesc = true;

export async function renderZones(el) {
  async function renderLlista() {
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const zones = await api.zones.llista();
    zonesOrdenades = [...zones];

    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h1>Zones i punts de busseig</h1>
          <p class="page-subtitle">${zonesOrdenades.length} punts de busseig registrats</p>
          <p class="page-subtitle">Punts de busseig i zones de tot el litoral català on s'ha practicat alguna immersió.</p>
        </div>
        <button class="btn btn-primary" id="btn-nova">+ Nova zona</button>
      </div>

      <div style="margin-bottom:1rem;text-align:left;">
        <input type="text" id="cerca-zones" placeholder="🔍 Cerca zona..." style="width:280px;padding:0.5rem 0.75rem;border:1px solid var(--color-superfic);border-radius:var(--r-sm);background:var(--color-fons-clara);color:var(--color-text);font-size:0.9rem;" />
      </div>

      ${zonesOrdenades.length === 0 ? `
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
                <th style="white-space:nowrap;">Prof. màx</th>
                <th>Centre</th>
                <th>País / Regió</th>
                <th id="th-immersions" style="cursor:pointer;user-select:none;white-space:nowrap;" title="Clicar per ordenar">Immersions ↕</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="cos-taula-zones">
              ${zonesOrdenades.map(z => `
                <tr class="clickable" data-id="${z.id}" data-nom="${escapeHtml(z.nom).toLowerCase()}">
                  <td><strong>${escapeHtml(z.nom)}</strong></td>
                  <td>${badgeTipus(z.tipus)}</td>
                  <td>${badgeNivell(z.nivell_dificultat)}</td>
                  <td>${z.profunditat_max ? z.profunditat_max + ' m' : '—'}</td>
                  <td>${enllacosCentres(z)}</td>
                  <td style="color:var(--color-gris);font-size:0.875rem">${[z.regio, z.pais].filter(Boolean).map(escapeHtml).join(', ') || '—'}</td>
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
            ${zonesOrdenades.map(targetaZona).join('')}
          </div>
        </div>`}`;

    // Actualitzar subtítol amb total
    const subtitle = el.querySelector('.page-subtitle');
    if (subtitle) {
      subtitle.textContent = `${zonesOrdenades.length} punts de busseig registrats`;
    }

    // Ordenació per nombre d'immersions
    const thImmersion = el.querySelector('#th-immersions');
    if (thImmersion) {
      thImmersion.addEventListener('click', () => {
        ordreDesc = !ordreDesc;
        reordenarIAplicar();
      });
    }

    // Files i targetes obren la pàgina completa de la zona
    el.querySelectorAll('tr.clickable').forEach(tr => {
      tr.addEventListener('click', (e) => {
        if (e.target.closest('button, a')) return;
        window.location.hash = `/zona/${tr.dataset.id}`;
      });
    });

    // Filtrat per cerca
    const cercaInput = el.querySelector('#cerca-zones');
    if (cercaInput) {
      cercaInput.addEventListener('input', (e) => {
        const terme = e.target.value.toLowerCase();
        const files = el.querySelectorAll('#cos-taula-zones tr.clickable');
        files.forEach(f => {
          const nom = f.dataset.nom || '';
          f.style.display = nom.includes(terme) ? '' : 'none';
        });
      });
    }

    el.querySelectorAll('.wrapper-mobil .targeta').forEach(card => {
      const obrir = () => { window.location.hash = `/zona/${card.dataset.id}`; };
      card.addEventListener('click', (e) => {
        if (e.target.closest('button, a')) return;
        obrir();
      });
      card.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (e.target.closest('button, a')) return;
        e.preventDefault();
        obrir();
      });
    });

    el.querySelector('#btn-nova')?.addEventListener('click', () => obrirModalZona(null, { onDesat: renderLlista }));
    el.querySelectorAll('.btn-editar').forEach(btn =>
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        obrirModalZona(btn.dataset.id, { onDesat: renderLlista });
      }));
    el.querySelectorAll('.btn-eliminar').forEach(btn =>
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();

        const zona = zonesOrdenades.find(z => String(z.id) === String(btn.dataset.id));
        const numImm = zona?.num_immersions || 0;
        const numCentres = zona?.centres?.length || 0;

        const eliminada = await obrirConfirmacio({
          titol: 'Eliminar la zona',
          missatge: zona?.nom
            ? `Estàs a punt d'eliminar la zona «${zona.nom}».`
            : 'Estàs a punt d\'eliminar aquesta zona.',
          detalls: [
            numImm
              ? `Les ${numImm} ${numImm === 1 ? 'immersió registrada es conservarà' : 'immersions registrades es conservaran'}, però sense zona assignada.`
              : null,
            numCentres
              ? `Es desvincularà ${numCentres === 1 ? 'del centre associat' : `dels ${numCentres} centres associats`}.`
              : null,
            'Aquesta acció no es pot desfer.'
          ].filter(Boolean),
          textConfirmar: 'Eliminar',
          textEnCurs: 'Eliminant…',
          onConfirmar: () => api.zones.eliminar(btn.dataset.id)
        });

        if (eliminada) await renderLlista();
      }));
  }

  await renderLlista();
}

function reordenarIAplicar() {
  zonesOrdenades.sort((a, b) => {
    const va = a.num_immersions || 0;
    const vb = b.num_immersions || 0;
    return ordreDesc ? vb - va : va - vb;
  });
  const thImmersion = document.querySelector('#th-immersions');
  if (thImmersion) {
    thImmersion.innerHTML = ordreDesc
      ? 'Immersions ▲'
      : 'Immersions ▼';
  }
  // Rebuild tbody rows in sorted order
  const tbody = document.querySelector('#cos-taula-zones');
  if (!tbody) return;
  tbody.innerHTML = '';
  zonesOrdenades.forEach(z => {
    const tr = document.createElement('tr');
    tr.className = 'clickable';
    tr.dataset.id = z.id;
    tr.dataset.nom = escapeHtml(z.nom).toLowerCase();
    tr.innerHTML = `
      <td><strong>${escapeHtml(z.nom)}</strong></td>
      <td>${badgeTipus(z.tipus)}</td>
      <td>${badgeNivell(z.nivell_dificultat)}</td>
      <td>${z.profunditat_max ? z.profunditat_max + ' m' : '—'}</td>
      <td>${enllacosCentres(z)}</td>
      <td style="color:var(--color-gris);font-size:0.875rem">${[z.regio, z.pais].filter(Boolean).map(escapeHtml).join(', ') || '—'}</td>
      <td><span class="badge badge-gris">${z.num_immersions || 0}</span></td>
      <td>
        <button class="btn btn-ghost btn-sm btn-editar" data-id="${z.id}">✏️</button>
        <button class="btn btn-ghost btn-sm btn-eliminar" data-id="${z.id}">🗑️</button>
      </td>`;
    tbody.appendChild(tr);
  });
  // Reattach click events
  tbody.querySelectorAll('tr.clickable').forEach(tr => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('button, a')) return;
      window.location.hash = `/zona/${tr.dataset.id}`;
    });
  });
}

function badgeTipus(t) {
  if (!t) return '<span style="color:var(--color-gris)">—</span>';
  return `<span class="badge badge-gris">${t}</span>`;
}

// Centres associats a una zona, com a xips enllaçats a la fitxa del centre
function enllacosCentres(z) {
  if (!z.centres?.length) return '<span style="color:var(--color-gris)">—</span>';
  return `<div class="enllacos-llista">${z.centres
    .map(c => enllacXip(`#/centre/${c.id}`, c.nom, { icona: '🏢', petit: true }))
    .join('')}</div>`;
}

function badgeNivell(n) {
  if (!n) return '<span style="color:var(--color-gris)">—</span>';
  const cls = { principiant:'badge-ok', intermedi:'badge-cian', avançat:'badge-warn', expert:'badge-perill' };
  return `<span class="badge ${cls[n]||'badge-gris'}">${n}</span>`;
}

function targetaZona(z) {
  const lloc = [z.regio, z.pais].filter(Boolean).join(', ');
  return `
    <article class="targeta" data-id="${z.id}" role="link" tabindex="0"
             aria-label="Veure la zona ${escapeHtml(z.nom)}">
      <div class="targeta-cap">
        <span class="targeta-nom">${escapeHtml(z.nom)}</span>
        ${badgeTipus(z.tipus)}
      </div>
      ${z.centres?.length ? `<div class="enllacos-llista" style="margin-top:0.4rem">${z.centres
        .map(c => enllacXip(`#/centre/${c.id}`, c.nom, { icona: '🏢', petit: true }))
        .join('')}</div>` : ''}
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
