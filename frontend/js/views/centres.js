// views/centres.js
import { api } from '../api.js';
import { escapeHtml, enllacXip } from '../format.js';
import { obrirModalCentre } from './centre-modal.js';
import { obrirConfirmacio } from './confirm-modal.js';

export async function renderCentres(el) {
  async function renderLlista(filtra = true) {
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const centres = await api.centres.llista();

    el.innerHTML = `
      <div class="page-header">
        <div class="page-title">
          <h1>Centres de busseig</h1>
           <p class="page-subtitle">${centres.length} centres registrats</p>
           <p class="page-subtitle">Detalls dels centres de busseig dels que s'han visitat en alguna de les immersions.</p>
        </div>
        <button class="btn btn-primary" id="btn-nou">+ Nou centre</button>
      </div>

      <div style="margin-bottom:1rem;text-align:left;">
        <input type="text" id="cerca-centres" placeholder="🔍 Cerca centre..." style="width:280px;padding:0.5rem 0.75rem;border:1px solid var(--color-superfic);border-radius:var(--r-sm);background:var(--color-fons-clara);color:var(--color-text);font-size:0.9rem;" />
      </div>

      ${centres.length === 0 ? `
        <div class="buit">
          <div class="icon">🏢</div>
          <h3>Sense centres</h3>
          <p>Afegeix el primer centre de busseig</p>
        </div>` : `
        <div class="wrapper-desktop">
        <div class="taula-wrapper">
          <table>
            <thead>
              <tr>
                <th>Nom</th>
                <th>Ubicació</th>
                <th>Contacte</th>
                <th>Web</th>
                <th>Zones</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="cos-taula-centres">
              ${centres.map(c => `
                <tr class="clickable" data-id="${c.id}" data-nom="${escapeHtml(c.nom).toLowerCase()}">
                  <td><strong>${escapeHtml(c.nom)}</strong>${c.logo_url ? `<img src="${escapeHtml(c.logo_url)}" alt="" style="width:28px;height:28px;vertical-align:middle;margin-left:0.5rem;border-radius:4px;" />` : ''}</td>
                  <td style="color:var(--color-gris);font-size:0.875rem">${[c.regio, c.pais].filter(Boolean).map(escapeHtml).join(', ') || '<span style="color:var(--color-gris)">—</span>'}</td>
                  <td>${enllacosContacte(c)}</td>
                  <td>${c.web ? enllacXip(c.web, c.web, { extern: true, petit: true, titol: c.web }) : '<span style="color:var(--color-gris)">—</span>'}</td>
                  <td><span class="badge badge-cian">${c.num_zones || 0}</span></td>
                  <td>
                    <button class="btn btn-ghost btn-sm btn-editar" data-id="${c.id}">✏️</button>
                    <button class="btn btn-ghost btn-sm btn-eliminar" data-id="${c.id}">🗑️</button>
                  </td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        </div>
        <div class="wrapper-mobil">
          <div class="grid-targetes">
            ${centres.map(targetaCentre).join('')}
          </div>
        </div>`}`;

    // Filtrat per cerca
    const cercaInput = el.querySelector('#cerca-centres');
    if (cercaInput) {
      cercaInput.addEventListener('input', (e) => {
        const terme = e.target.value.toLowerCase();
        const files = el.querySelectorAll('#cos-taula-centres tr.clickable');
        files.forEach(f => {
          const nom = f.dataset.nom || '';
          f.style.display = nom.includes(terme) ? '' : 'none';
        });
      });
    }

    // Files i targetes obren la pàgina completa del centre
    el.querySelectorAll('tr.clickable').forEach(tr => {
      tr.addEventListener('click', (e) => {
        if (e.target.closest('button, a')) return;
        window.location.hash = `/centre/${tr.dataset.id}`;
      });
    });

    el.querySelectorAll('.wrapper-mobil .targeta').forEach(card => {
      const obrir = () => { window.location.hash = `/centre/${card.dataset.id}`; };
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

    el.querySelector('#btn-nou')?.addEventListener('click', () => obrirModalCentre(null, { onDesat: renderLlista }));
    el.querySelectorAll('.btn-editar').forEach(btn =>
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        obrirModalCentre(btn.dataset.id, { onDesat: renderLlista });
      }));
    el.querySelectorAll('.btn-eliminar').forEach(btn =>
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();

        const centre = centres.find(c => String(c.id) === String(btn.dataset.id));
        const numZones = centre?.num_zones || 0;

        const eliminat = await obrirConfirmacio({
          titol: 'Eliminar el centre',
          missatge: centre?.nom
            ? `Estàs a punt d'eliminar el centre «${centre.nom}».`
            : 'Estàs a punt d\'eliminar aquest centre.',
          detalls: [
            numZones
              ? `Les ${numZones} ${numZones === 1 ? 'zona associada es desvincularà' : 'zones associades es desvincularan'} d'aquest centre.`
              : null,
            'Les immersions registrades es conservaran, però quedaran sense centre.',
            'Aquesta acció no es pot desfer.'
          ].filter(Boolean),
          textConfirmar: 'Eliminar',
          textEnCurs: 'Eliminant…',
          onConfirmar: () => api.centres.eliminar(btn.dataset.id)
        });

        if (eliminat) await renderLlista();
      }));
  }

  function targetaCentre(c) {
    const lloc = [c.regio, c.pais].filter(Boolean).join(', ');
    const contactes = [
      c.telefon ? enllacXip(`tel:${c.telefon.replace(/[^\d+]/g, '')}`, c.telefon, { icona: '📞', petit: true, titol: c.telefon }) : '',
      c.email ? enllacXip(`mailto:${c.email}`, c.email, { icona: '✉️', petit: true, titol: c.email }) : '',
      c.web ? enllacXip(c.web, c.web, { icona: '🌐', extern: true, petit: true, titol: c.web }) : ''
    ].filter(Boolean).join('');
    return `
      <article class="targeta" data-id="${c.id}" role="link" tabindex="0"
               aria-label="Veure el centre ${escapeHtml(c.nom)}">
        <div class="targeta-cap">
          <span class="targeta-nom">${escapeHtml(c.nom)}</span>
        </div>
        ${lloc ? `<div class="targeta-subtit">📍 ${escapeHtml(lloc)}</div>` : ''}
        ${contactes ? `<div class="enllacos-llista" style="margin-top:0.4rem">${contactes}</div>` : ''}
        <div class="targeta-meta">
          <span class="badge badge-cian">${c.num_zones || 0} zones</span>
        </div>
        <div class="targeta-accions" style="justify-content:space-between;align-items:center">
          <span></span>
          <div style="display:flex;gap:0.25rem">
            <button class="btn btn-ghost btn-sm btn-editar" data-id="${c.id}" title="Editar">✏️</button>
            <button class="btn btn-ghost btn-sm btn-eliminar" data-id="${c.id}" title="Eliminar">🗑️</button>
          </div>
        </div>
      </article>`;
  }

  // Contactes del centre com a xips enllaçats (telèfon i correu)
  function enllacosContacte(c) {
    const items = [
      c.telefon ? enllacXip(`tel:${c.telefon.replace(/[^\d+]/g, '')}`, c.telefon, { icona: '📞', petit: true, titol: c.telefon }) : '',
      c.email ? enllacXip(`mailto:${c.email}`, c.email, { icona: '✉️', petit: true, titol: c.email }) : ''
    ].filter(Boolean);

    return items.length
      ? `<div class="enllacos-llista enllacos-llista-vertical">${items.join('')}</div>`
      : '<span style="color:var(--color-gris)">—</span>';
  }

  await renderLlista();
}
