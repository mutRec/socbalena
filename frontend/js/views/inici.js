// views/inici.js
import { api } from '../api.js';
import { store } from '../app.js';

export async function renderInici(el) {
  const darreresRes = await api.immersions.llista({ limit: 5 });
  const darreres = darreresRes.immersions;

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h1>Benvingut/da, ${store.usuari?.nom?.split(' ')[0] || ''}! 🤿</h1>
        <p class="page-subtitle">Taulell diari busseig sócBalena</p>
      </div>
      <a href="#/immersions/nova" class="btn btn-primary" id="btn-nova-imm">+ Nova immersió</a>
    </div>

    <div class="dashboard-grid">
      <div class="card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <h3>Darreres immersions</h3>
          <a href="#/immersions" class="btn btn-ghost btn-sm">Veure totes →</a>
        </div>
        ${darreres.length === 0
          ? `<div class="buit" style="padding:2rem"><div class="icon">🌊</div><p>Encara no hi ha immersió</p></div>`
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
        <h3 style="margin-bottom:1rem">¿Qué vols fer?</h3>
        <div style="display:flex;flex-direction:column;gap:0.75rem;">
          <a href="#/immersions" class="btn btn-secondary" style="justify-content:flex-start;gap:1rem">
            <span>🤿</span> Veure totes les immersions
          </a>
          <a href="#/centres" class="btn btn-secondary" style="justify-content:flex-start;gap:1rem">
            <span>🏢</span> Gestionar centres
          </a>
          <a href="#/zones" class="btn btn-secondary" style="justify-content:flex-start;gap:1rem">
            <span>🗺️</span> Gestionar zones
          </a>
        </div>
      </div>
    </div>`;
}

function formatData(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}
