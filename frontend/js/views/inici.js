// views/inici.js
import { api } from '../api.js';
import { store } from '../app.js';

export async function renderInici(el) {
  const [estadis, darreresRes] = await Promise.all([
    api.immersions.estadis(),
    api.immersions.llista({ limit: 5 })
  ]);
  const e = estadis;
  const darreres = darreresRes.immersions;

  const hores = e.total_minuts ? Math.floor(e.total_minuts / 60) : 0;
  const minuts = e.total_minuts ? Math.round(e.total_minuts % 60) : 0;

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h1>Benvingut/da, ${store.usuari?.nom?.split(' ')[0] || ''}! 🤿</h1>
        <p class="page-subtitle">Resum del teu diari de busseig</p>
      </div>
      <a href="#/immersions/nova" class="btn btn-primary" id="btn-nova-imm">+ Nova immersió</a>
    </div>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-valor">${e.total_immersions || 0}</div>
        <div class="stat-label">Immersions</div>
      </div>
      <div class="stat-card">
        <div class="stat-valor">${hores}h ${minuts}m</div>
        <div class="stat-label">Temps fons</div>
      </div>
      <div class="stat-card">
        <div class="stat-valor">${e.profunditat_record ? e.profunditat_record + 'm' : '—'}</div>
        <div class="stat-label">Màxima profunditat</div>
      </div>
      <div class="stat-card">
        <div class="stat-valor">${e.zones_visitades || 0}</div>
        <div class="stat-label">Zones visitades</div>
      </div>
      <div class="stat-card">
        <div class="stat-valor">${e.profunditat_mitja ? parseFloat(e.profunditat_mitja).toFixed(1) + 'm' : '—'}</div>
        <div class="stat-label">Prof. mitjana</div>
      </div>
      <div class="stat-card">
        <div class="stat-valor">${e.anys_actiu || 0}</div>
        <div class="stat-label">Anys actiu</div>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1rem;" class="dashboard-grid">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <h3>Darreres immersions</h3>
          <a href="#/immersions" class="btn btn-ghost btn-sm">Veure totes →</a>
        </div>
        ${darreres.length === 0
          ? `<div class="buit" style="padding:2rem"><div class="icon">🌊</div><p>Encara no hi ha immersions</p></div>`
          : darreres.map(i => `
            <a href="#/immersio/${i.id}" style="text-decoration:none;display:block;" class="imm-row">
              <div style="display:flex;justify-content:space-between;padding:0.75rem 0;border-bottom:1px solid var(--color-superfic);cursor:pointer;" class="hover-row">
                <div>
                  <div style="font-weight:500;color:var(--color-blanc)">
                    #${i.numero_immersio} — ${i.zona_nom || 'Sense zona'}
                  </div>
                  <div style="font-size:0.8rem;color:var(--color-gris)">${formatData(i.data)}</div>
                </div>
                <div style="text-align:right">
                  <div style="color:var(--color-cian);font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;">${i.profunditat_max ? i.profunditat_max + 'm' : '—'}</div>
                  <div style="font-size:0.8rem;color:var(--color-gris)">${i.temps_fons ? i.temps_fons + ' min' : '—'}</div>
                </div>
              </div>
            </a>`).join('')
        }
      </div>

      <div class="card">
        <h3 style="margin-bottom:1rem">Accions ràpides</h3>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          <a href="#/immersions" class="btn btn-secondary" style="justify-content:flex-start;gap:1rem">
            <span>🤿</span> Totes les immersions
          </a>
          <a href="#/centres" class="btn btn-secondary" style="justify-content:flex-start;gap:1rem">
            <span>🏢</span> Gestionar centres
          </a>
          <a href="#/zones" class="btn btn-secondary" style="justify-content:flex-start;gap:1rem">
            <span>🗺️</span> Gestionar zones
          </a>
          <a href="#/estadistiques" class="btn btn-secondary" style="justify-content:flex-start;gap:1rem">
            <span>📊</span> Estadístiques completes
          </a>
        </div>
      </div>
    </div>`;

  // Botó nova immersió
  el.querySelector('#btn-nova-imm').onclick = (e) => {
    e.preventDefault();
    window.dispatchEvent(new CustomEvent('obrirNovaImmersio'));
    window.location.hash = '/immersions';
  };
}

function formatData(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
