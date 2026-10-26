// views/centres.js
import { api } from '../api.js';
import { escapeHtml } from '../format.js';
import { obrirModalCentre } from './centre-modal.js';

export async function renderCentres(el) {
  async function renderLlista() {
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

      ${centres.length === 0 ? `
        <div class="buit">
          <div class="icon">🏢</div>
          <h3>Sense centres</h3>
          <p>Afegeix el primer centre de busseig</p>
        </div>` : `
        <div class="grid-cards" id="grid-centres">
          ${centres.map(c => `
            <article class="card clicable" data-id="${c.id}" role="link" tabindex="0"
                     aria-label="Veure el centre ${escapeHtml(c.nom)}">
              <div class="centre-cap">
                <h3>${escapeHtml(c.nom)}</h3>
                <div style="display:flex;gap:0.25rem">
                  <button class="btn btn-ghost btn-sm btn-editar" data-id="${c.id}" title="Editar">✏️</button>
                  <button class="btn btn-ghost btn-sm btn-eliminar" data-id="${c.id}" title="Eliminar">🗑️</button>
                </div>
              </div>
              <div class="centre-cos">
                <div class="centre-info">
                  ${c.pais || c.regio ? `<div class="centre-linia">📍 ${[c.regio, c.pais].filter(Boolean).map(escapeHtml).join(', ')}</div>` : ''}
                  ${c.telefon ? `<div class="centre-linia">📞 ${escapeHtml(c.telefon)}</div>` : ''}
                  ${c.email ? `<div class="centre-linia">✉️ ${escapeHtml(c.email)}</div>` : ''}
                  ${c.web ? `<div class="centre-linia"><a href="${escapeHtml(c.web)}" target="_blank" rel="noopener noreferrer" style="color:var(--color-cian)">${escapeHtml(c.web)}</a></div>` : ''}
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
            </article>`).join('')}
        </div>`}`;

    // Cada targeta obre la pàgina completa del centre
    el.querySelectorAll('.card.clicable').forEach(card => {
      const obrir = () => { window.location.hash = `/centre/${card.dataset.id}`; };
      card.addEventListener('click', (e) => {
        if (e.target.closest('a, button')) return;
        obrir();
      });
      card.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        if (e.target.closest('a, button')) return;
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
        if (!confirm('Eliminar aquest centre?')) return;
        await api.centres.eliminar(btn.dataset.id);
        renderLlista();
      }));
  }

  await renderLlista();
}
