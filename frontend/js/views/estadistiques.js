// views/estadistiques.js
import { api } from '../api.js';

export async function renderEstadistiques(el) {
  el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  const [e, res] = await Promise.all([
    api.immersions.estadis(),
    api.immersions.llista({ limit: 200 })
  ]);
  const imm = res.immersions;

  const hores = e.total_minuts ? Math.floor(e.total_minuts / 60) : 0;
  const minuts = e.total_minuts ? Math.round(e.total_minuts % 60) : 0;

  // Agrupacions
  const perMes = agruparPerMes(imm);
  const perZona = agruparPer(imm, 'zona_nom', 5);
  const perVestit = agruparPer(imm, 'tipus_vestit');
  const profHistorial = imm.slice(0, 30).reverse();

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h1>Estadístiques</h1>
        <p class="page-subtitle">Resum del teu historial de busseig</p>
      </div>
    </div>

    <!-- Stats principals -->
    <div class="stats-grid" style="grid-template-columns:repeat(auto-fill,minmax(180px,1fr))">
      ${statCard('🤿', 'Total immersions', e.total_immersions || 0)}
      ${statCard('⏱️', 'Temps fons', `${hores}h ${minuts}m`)}
      ${statCard('📏', 'Profunditat rècord', e.profunditat_record ? e.profunditat_record + ' m' : '—')}
      ${statCard('📐', 'Prof. mitjana', e.profunditat_mitja ? parseFloat(e.profunditat_mitja).toFixed(1) + ' m' : '—')}
      ${statCard('🗺️', 'Zones visitades', e.zones_visitades || 0)}
      ${statCard('📅', 'Anys actiu', e.anys_actiu || 0)}
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:1.5rem;margin-top:1.5rem">

      <!-- Immersions per any -->
      <div class="card">
        <h3 style="margin-bottom:1rem">📅 Immersions per any</h3>
        ${e.per_any?.length ? barChart(e.per_any.map(r => ({ label: r.any, valor: parseInt(r.total) }))) : buit()}
      </div>

      <!-- Top zones -->
      <div class="card">
        <h3 style="margin-bottom:1rem">🗺️ Zones més visitades</h3>
        ${perZona.length ? rankingList(perZona) : buit()}
      </div>

      <!-- Profunditat últimes immersions -->
      <div class="card" style="grid-column:1/-1">
        <h3 style="margin-bottom:1rem">📈 Profunditat — últimes ${profHistorial.length} immersions</h3>
        ${profHistorial.length ? lineChart(profHistorial) : buit()}
      </div>

      <!-- Per mes -->
      <div class="card">
        <h3 style="margin-bottom:1rem">🌊 Immersions per mes (any actual)</h3>
        ${perMes.length ? barChart(perMes) : buit()}
      </div>

      <!-- Per tipus vestit -->
      <div class="card">
        <h3 style="margin-bottom:1rem">🥽 Tipus de vestit utilitzat</h3>
        ${perVestit.length ? donutChart(perVestit) : buit()}
      </div>

    </div>`;
}

// ── Helpers de dades ────────────────────────────────────

function agruparPerMes(imm) {
  const anyActual = new Date().getFullYear();
  const mesos = Array.from({ length: 12 }, (_, i) => ({
    label: ['Gen','Feb','Mar','Abr','Mai','Jun','Jul','Ago','Set','Oct','Nov','Des'][i],
    valor: 0
  }));
  imm.forEach(i => {
    const d = new Date(i.data);
    if (d.getFullYear() === anyActual) mesos[d.getMonth()].valor++;
  });
  return mesos;
}

function agruparPer(imm, camp, top = 10) {
  const counts = {};
  imm.forEach(i => {
    const v = i[camp] || 'Sense dades';
    counts[v] = (counts[v] || 0) + 1;
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, top)
    .map(([label, valor]) => ({ label, valor }));
}

// ── Visualitzacions SVG inline ───────────────────────────

function barChart(dades) {
  const max = Math.max(...dades.map(d => d.valor), 1);
  const w = 100 / dades.length;
  const bars = dades.map((d, i) => {
    const pct = (d.valor / max) * 80;
    const x = i * w + w * 0.1;
    return `
      <g>
        <rect x="${x}%" y="${100 - pct}%" width="${w * 0.8}%" height="${pct}%"
              fill="#00E5D0" rx="3" opacity="0.85"/>
        <text x="${x + w * 0.4}%" y="97%" text-anchor="middle"
              font-size="9" fill="#7AA3C0" font-family="Inter,sans-serif">${d.label}</text>
        ${d.valor > 0 ? `<text x="${x + w * 0.4}%" y="${100 - pct - 2}%" text-anchor="middle"
              font-size="9" fill="#E8F4F8" font-family="Inter,sans-serif">${d.valor}</text>` : ''}
      </g>`;
  }).join('');
  return `<svg viewBox="0 0 100 100" style="width:100%;height:200px" preserveAspectRatio="none">${bars}</svg>`;
}

function lineChart(imm) {
  const dades = imm.map(i => parseFloat(i.profunditat_max) || 0);
  const max = Math.max(...dades, 1);
  const n = dades.length;
  const pts = dades.map((v, i) => `${(i / (n - 1)) * 100},${100 - (v / max) * 90}`).join(' ');
  const area = `0,100 ${pts} 100,100`;
  return `
    <svg viewBox="0 0 100 100" style="width:100%;height:180px" preserveAspectRatio="none">
      <defs>
        <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#00E5D0" stop-opacity="0.4"/>
          <stop offset="100%" stop-color="#00E5D0" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <polygon points="${area}" fill="url(#grad)"/>
      <polyline points="${pts}" fill="none" stroke="#00E5D0" stroke-width="1.5" stroke-linejoin="round"/>
      ${dades.map((v, i) => `<circle cx="${(i/(n-1))*100}" cy="${100-(v/max)*90}" r="1.5" fill="#00E5D0"/>`).join('')}
    </svg>`;
}

function rankingList(dades) {
  const max = dades[0]?.valor || 1;
  return dades.map((d, i) => `
    <div style="display:flex;align-items:center;gap:0.75rem;margin-bottom:0.6rem">
      <span style="font-family:'Barlow Condensed',sans-serif;font-size:1.1rem;color:var(--color-cian);min-width:1.5rem">${i+1}</span>
      <div style="flex:1">
        <div style="font-size:0.875rem;margin-bottom:0.2rem">${escapeHtml(d.label)}</div>
        <div class="profunditat-bar">
          <div class="profunditat-fill" style="width:${(d.valor/max)*100}%"></div>
        </div>
      </div>
      <span class="badge badge-cian">${d.valor}</span>
    </div>`).join('');
}

function donutChart(dades) {
  const total = dades.reduce((s, d) => s + d.valor, 0);
  const colors = ['#00E5D0','#4ECDC4','#00A896','#7AA3C0','#1A3A5C','#112240'];
  let offset = 0;
  const slices = dades.map((d, i) => {
    const pct = (d.valor / total) * 100;
    const slice = `
      <circle cx="50" cy="50" r="35"
        fill="none" stroke="${colors[i % colors.length]}" stroke-width="20"
        stroke-dasharray="${pct * 2.199} ${(100-pct)*2.199}"
        stroke-dashoffset="${-offset * 2.199}"
        transform="rotate(-90 50 50)"/>`;
    offset += pct;
    return slice;
  }).join('');
  const llegenda = dades.map((d, i) => `
    <div style="display:flex;align-items:center;gap:0.5rem;font-size:0.8rem;margin-bottom:0.3rem">
      <div style="width:10px;height:10px;border-radius:2px;background:${colors[i%colors.length]};flex-shrink:0"></div>
      <span style="color:var(--color-gris)">${escapeHtml(d.label)}</span>
      <span style="margin-left:auto;color:var(--color-blanc)">${d.valor}</span>
    </div>`).join('');
  return `
    <div style="display:flex;gap:1.5rem;align-items:center;flex-wrap:wrap">
      <svg viewBox="0 0 100 100" style="width:120px;height:120px;flex-shrink:0">${slices}</svg>
      <div style="flex:1">${llegenda}</div>
    </div>`;
}

function buit() {
  return '<div style="text-align:center;padding:2rem;color:var(--color-gris)">Sense dades</div>';
}

function statCard(icon, label, valor) {
  return `
    <div class="stat-card">
      <div style="font-size:1.5rem;margin-bottom:0.25rem">${icon}</div>
      <div class="stat-valor">${valor}</div>
      <div class="stat-label">${label}</div>
    </div>`;
}

function escapeHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
