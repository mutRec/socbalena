// views/immersio-detall.js
import { api } from '../api.js';

export async function renderImmersioDetall(el, id) {
  if (!id) { el.innerHTML = '<div class="alert alert-error">ID no especificat</div>'; return; }

  async function carregar() {
    el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
    const i = await api.immersions.obtenir(id);
    renderDetall(i);
  }

  function renderDetall(i) {
    const portada = i.media?.find(m => m.es_portada && m.tipus === 'foto');
    el.innerHTML = `
      <div class="page-header no-print">
        <div style="display:flex;align-items:center;gap:1rem">
          <a href="#/immersions" class="btn btn-ghost btn-sm">← Tornar</a>
          <div class="page-title">
            <h1>Immersió #${i.numero_immersio || '—'}</h1>
            <p class="page-subtitle">${formatData(i.data)} · ${i.zona_nom || 'Sense zona'}</p>
          </div>
        </div>
        <div style="display:flex;gap:0.5rem;">
          <button class="btn btn-secondary" id="btn-imprimir">🖨️ Imprimir</button>
          <button class="btn btn-primary" id="btn-pdf">📄 PDF</button>
          <button class="btn btn-secondary" id="btn-editar">✏️ Editar</button>
        </div>
      </div>

      <!-- FITXA IMPRIMIBLE -->
      <div id="fitxa" class="card" style="margin-bottom:1.5rem;">
        <div style="display:flex;gap:1.5rem;margin-bottom:1.5rem;flex-wrap:wrap;">
          ${portada ? `<img src="/uploads/${portada.nom_fitxer}" style="width:200px;height:150px;object-fit:cover;border-radius:var(--r-md);border:2px solid var(--color-cian);" />` : ''}
          <div style="flex:1;min-width:200px;">
            <div style="font-family:'Barlow Condensed',sans-serif;font-size:2rem;color:var(--color-cian);font-weight:700;">
              🤿 Immersió #${i.numero_immersio || '—'}
            </div>
            <div style="font-size:1.1rem;margin:0.3rem 0;">${i.zona_nom || 'Sense zona assignada'}</div>
            <div style="color:var(--color-gris);margin-bottom:0.5rem">${i.centre_nom || ''}</div>
            <div style="display:flex;gap:0.75rem;flex-wrap:wrap;">
              ${i.valoracio ? `<span class="estrelles">${'⭐'.repeat(i.valoracio)}</span>` : ''}
              ${i.tipus_immersio ? `<span class="badge badge-cian">${i.tipus_immersio}</span>` : ''}
            </div>
          </div>
          <div style="text-align:right;min-width:150px;">
            <div style="font-size:0.75rem;color:var(--color-gris);text-transform:uppercase;letter-spacing:0.05em">Data</div>
            <div style="font-size:1.1rem;font-weight:600">${formatData(i.data)}</div>
            ${i.hora_entrada ? `<div style="color:var(--color-gris);font-size:0.875rem">${i.hora_entrada?.slice(0,5)} — ${i.hora_sortida?.slice(0,5) || '?'}</div>` : ''}
          </div>
        </div>

        <!-- Grid de paràmetres -->
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;margin-bottom:1.5rem;">
          ${paramCard('📏 Prof. màxima', i.profunditat_max ? i.profunditat_max + ' m' : '—')}
          ${paramCard('📐 Prof. mitjana', i.profunditat_mitja ? i.profunditat_mitja + ' m' : '—')}
          ${paramCard('⏱️ Temps fons', i.temps_fons ? i.temps_fons + ' min' : '—')}
          ${paramCard('🫧 Pressió entrada', i.pressio_entrada ? i.pressio_entrada + ' bar' : '—')}
          ${paramCard('🫧 Pressió sortida', i.pressio_sortida ? i.pressio_sortida + ' bar' : '—')}
          ${paramCard('🫁 Capacitat ampolla', i.capacitat_bombona ? i.capacitat_bombona + ' L' : '—')}
          ${paramCard('⏱️ Temps superf.', i.temps_superficie ? i.temps_superficie + ' min' : '—')}
          ${paramCard('💨 Gas', i.tipus_gas || 'Aire')}
          ${paramCard('🌡️ Temp. aigua', i.temp_aigua ? i.temp_aigua + ' °C' : '—')}
          ${paramCard('🌡️ Temp. aire', i.temp_aire ? i.temp_aire + ' °C' : '—')}
          ${paramCard('👁️ Visibilitat', i.visibilitat ? capitalitzar(i.visibilitat) : '—')}
          ${paramCard('🌊 Corrent', i.corrent ? capitalitzar(i.corrent) : '—')}
          ${paramCard('🌊 Onatge', i.onatge ? capitalitzar(i.onatge) : '—')}
          ${paramCard('🧥 Vestit', labelVestit(i.tipus_vestit))}
          ${paramCard('⚖️ Llastre', i.pes_llastre ? i.pes_llastre + ' kg' : '—')}
        </div>

        ${(i.company || i.instructor) ? `
          <div style="display:flex;gap:2rem;margin-bottom:1rem;padding:0.75rem;background:var(--color-profund);border-radius:var(--r-sm);">
            ${i.company ? `<div><span style="color:var(--color-gris);font-size:0.8rem">Company/a:</span> <strong>${i.company}</strong></div>` : ''}
            ${i.instructor ? `<div><span style="color:var(--color-gris);font-size:0.8rem">Instructor:</span> <strong>${i.instructor}</strong></div>` : ''}
          </div>` : ''}

        ${i.notes ? `
          <div style="padding:1rem;background:var(--color-profund);border-left:3px solid var(--color-cian);border-radius:0 var(--r-sm) var(--r-sm) 0;">
            <div style="font-size:0.75rem;color:var(--color-gris);margin-bottom:0.3rem;text-transform:uppercase;letter-spacing:0.05em">Notes</div>
            <p style="line-height:1.7">${escapeHtml(i.notes)}</p>
          </div>` : ''}

        <!-- Peu de fitxa -->
        <div style="margin-top:1.5rem;padding-top:1rem;border-top:1px solid var(--color-superfic);display:flex;justify-content:space-between;align-items:center;font-size:0.8rem;color:var(--color-gris);">
          <span>🐋 SócBalena — Diari de busseig</span>
          <span>Registrat: ${formatDataHora(i.creat_a)}</span>
        </div>
      </div>

      <!-- Galeria de fotos i vídeos -->
      <div class="card no-print">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
          <h3>📸 Fotos i vídeos (${i.media?.length || 0})</h3>
          <button class="btn btn-secondary btn-sm" id="btn-pujar">+ Pujar fitxer</button>
        </div>

        <div id="drop-container">
          ${i.media?.length === 0 ? `
            <div class="buit" style="padding:2rem">
              <div class="icon">📷</div>
              <p>Sense fotos. Puja la primera!</p>
            </div>` : `
            <div class="galeria" id="galeria">
              ${i.media.map(m => mediaItem(m)).join('')}
            </div>`}
        </div>

        <!-- Drop zone ocult -->
        <div class="drop-zone" id="drop-zone" style="margin-top:1rem;display:none">
          <input type="file" id="input-fitxer" accept="image/*,video/mp4,video/quicktime,video/webm" multiple />
          <div style="font-size:2rem;margin-bottom:0.5rem">📤</div>
          <p>Arrossega fitxers aquí o <strong>fes clic</strong> per seleccionar</p>
          <p style="font-size:0.8rem;margin-top:0.3rem">Fotos (JPG, PNG, WEBP) · Vídeos (MP4, MOV) · Màx. 50 MB</p>
          <div id="progres-upload" style="margin-top:0.75rem"></div>
        </div>
      </div>`;

    // ── Events ────────────────────────────────────
    el.querySelector('#btn-imprimir').onclick = () => window.print();

    el.querySelector('#btn-pdf').onclick = () => generarPDF(i);

    el.querySelector('#btn-editar').onclick = async () => {
      // Reutilitzem el modal d'edició de la vista llista
      const { renderImmersions } = await import('./immersions.js');
      // Naveguem a la llista amb editar obert via hash
      window.location.hash = `/immersions`;
      setTimeout(async () => {
        const mainContent = document.getElementById('main-content');
        // Simular clic editar
        const immsView = document.createElement('div');
        await renderImmersions(immsView);
        // trigger edit
        const edBtn = immsView.querySelector(`[data-id="${id}"].btn-editar`);
        edBtn?.click();
      }, 300);
    };

    // Upload
    const dropZone = el.querySelector('#drop-zone');
    const inputFitxer = el.querySelector('#input-fitxer');
    el.querySelector('#btn-pujar').onclick = () => {
      dropZone.style.display = dropZone.style.display === 'none' ? '' : 'none';
    };

    dropZone.addEventListener('click', () => inputFitxer.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('actiu'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('actiu'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('actiu');
      pujarFitxers([...e.dataTransfer.files]);
    });
    inputFitxer.addEventListener('change', () => pujarFitxers([...inputFitxer.files]));

    // Actions de galeria
    el.querySelectorAll('.btn-portada').forEach(btn => {
      btn.onclick = async () => {
        await api.media.portada(btn.dataset.id);
        carregar();
      };
    });
    el.querySelectorAll('.btn-eliminar-media').forEach(btn => {
      btn.onclick = async () => {
        if (!confirm('Eliminar aquest fitxer?')) return;
        await api.media.eliminar(btn.dataset.id);
        carregar();
      };
    });

    // Lightbox bàsic
    el.querySelectorAll('.galeria-item img').forEach(img => {
      img.onclick = () => obrirLightbox(img.src);
    });

    async function pujarFitxers(fitxers) {
      const progres = el.querySelector('#progres-upload');
      for (const f of fitxers) {
        progres.innerHTML = `<div class="alert alert-info">Pujant ${f.name}...</div>`;
        try {
          await api.media.pujar(id, f);
        } catch (err) {
          progres.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
        }
      }
      progres.innerHTML = `<div class="alert alert-ok">✓ Fitxers pujats correctament</div>`;
      setTimeout(() => carregar(), 1000);
    }
  }

  function obrirLightbox(src) {
    const lb = document.createElement('div');
    lb.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.92);z-index:500;display:flex;align-items:center;justify-content:center;cursor:zoom-out;';
    lb.innerHTML = `<img src="${src}" style="max-width:95vw;max-height:95vh;object-fit:contain;border-radius:var(--r-md);" />`;
    lb.onclick = () => lb.remove();
    document.body.appendChild(lb);
  }

  await carregar();
}

function generarPDF(i) {
  // Usar la fitxa ja renderitzada i imprimir en PDF via window.print()
  // (el CSS ja oculta tot menys #fitxa en @media print)
  // Alternativament carregem html2pdf des de CDN
  const fitxa = document.getElementById('fitxa');
  if (!fitxa) { window.print(); return; }

  // html2pdf via CDN si disponible
  if (typeof html2pdf !== 'undefined') {
    html2pdf().set({
      margin: [10, 10],
      filename: `immersio-${i.numero_immersio || i.id}.pdf`,
      image: { type: 'jpeg', quality: 0.92 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    }).from(fitxa).save();
  } else {
    window.print();
  }
}

function paramCard(label, valor) {
  return `
    <div style="background:var(--color-profund);border-radius:var(--r-sm);padding:0.75rem;">
      <div style="font-size:0.7rem;color:var(--color-gris);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:0.2rem">${label}</div>
      <div style="font-weight:600;color:var(--color-blanc)">${valor}</div>
    </div>`;
}

function mediaItem(m) {
  const src = `/uploads/${m.nom_fitxer}`;
  const isVideo = m.tipus === 'video';
  return `
    <div class="galeria-item ${m.es_portada ? 'portada' : ''}">
      ${m.es_portada ? '<span class="portada-badge">Portada</span>' : ''}
      ${isVideo
        ? `<video src="${src}" muted></video>`
        : `<img src="${src}" alt="${escapeHtml(m.descripcio || '')}" loading="lazy" />`}
      <div class="actions">
        ${!m.es_portada && !isVideo ? `<button class="btn btn-ghost btn-sm btn-portada" data-id="${m.id}" title="Fer portada">⭐</button>` : ''}
        <a href="${src}" download="${m.nom_original || m.nom_fitxer}" class="btn btn-ghost btn-sm" title="Descarregar">⬇️</a>
        <button class="btn btn-danger btn-sm btn-eliminar-media" data-id="${m.id}" title="Eliminar">🗑️</button>
      </div>
    </div>`;
}

function formatData(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('ca-ES', { day: '2-digit', month: 'long', year: 'numeric' });
}
function formatDataHora(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function labelVestit(v) {
  const m = { 'sec': 'Sec', 'semisec': 'Semisec', 'humit_5mm': 'Humit 5mm', 'humit_3mm': 'Humit 3mm', 'rashguard': 'Rashguard', 'altre': 'Altre' };
  return m[v] || v || '—';
}
function escapeHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function capitalitzar(text) {
  if (!text) return '—';
  return text.charAt(0).toUpperCase() + text.slice(1);
}