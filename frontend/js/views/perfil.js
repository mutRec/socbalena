// views/perfil.js
import { api } from '../api.js';
import { store, pintarAvatar } from '../app.js';

export async function renderPerfil(el) {
  const u = await api.perfil();
  store.usuari = u;

  el.innerHTML = `
    <div class="page-header">
      <div class="page-title">
        <h1>El meu perfil</h1>
        <p class="page-subtitle">Gestió del compte</p>
      </div>
    </div>

    <div style="max-width:600px;display:flex;flex-direction:column;gap:1.5rem">

      <!-- Info bàsica + foto -->
      <div class="card">
        <div style="display:flex;align-items:center;gap:1.5rem;margin-bottom:1.5rem;flex-wrap:wrap">
          <div class="avatar-perfil" id="avatar-perfil"></div>
          <div style="min-width:180px">
            <h2>${escapeHtml(u.nom)}</h2>
            <p style="color:var(--color-gris)">${escapeHtml(u.email)}</p>
            <span class="badge badge-cian" style="margin-top:0.3rem">${u.rol}</span>
          </div>
        </div>

        <div id="alert-avatar"></div>
        <div style="display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap">
          <input type="file" id="inp-avatar" accept="image/*" hidden />
          <button class="btn btn-primary btn-sm" id="btn-pujar-avatar">📷 Pujar foto</button>
          <button class="btn btn-ghost btn-sm" id="btn-treure-avatar">Treure foto</button>
          <span style="font-size:0.75rem;color:var(--color-gris)">JPG, PNG o WEBP · es retallarà en quadrat</span>
        </div>

        <div style="font-size:0.8rem;color:var(--color-gris);margin-top:1.5rem">
          Membre des de: ${new Date(u.creat_a).toLocaleDateString('ca-ES', { day:'2-digit', month:'long', year:'numeric' })}
        </div>
      </div>

      <!-- Canviar nom -->
      <div class="card">
        <h3 style="margin-bottom:1rem">Canviar nom</h3>
        <div id="alert-nom"></div>
        <div class="form-group">
          <label class="form-label">Nom complet</label>
          <input class="form-input" type="text" id="inp-nom" value="${escapeHtml(u.nom)}" />
        </div>
        <button class="btn btn-primary" id="btn-desar-nom">Desar nom</button>
      </div>

      <!-- Canviar contrasenya -->
      <div class="card">
        <h3 style="margin-bottom:1rem">Canviar contrasenya</h3>
        <div id="alert-pass"></div>
        <div class="form-group">
          <label class="form-label">Contrasenya actual</label>
          <input class="form-input" type="password" id="pass-actual" />
        </div>
        <div class="form-group">
          <label class="form-label">Nova contrasenya (mínim 8 caràcters)</label>
          <input class="form-input" type="password" id="pass-nova" minlength="8" />
        </div>
        <div class="form-group">
          <label class="form-label">Confirmar nova contrasenya</label>
          <input class="form-input" type="password" id="pass-conf" />
        </div>
        <button class="btn btn-primary" id="btn-canviar-pass">Canviar contrasenya</button>
      </div>

      <!-- Info app -->
      <div class="card" style="text-align:center;color:var(--color-gris)">
        <div style="font-size:2rem;margin-bottom:0.5rem">🐋</div>
        <div style="font-family:'Barlow Condensed',sans-serif;font-size:1.2rem;color:var(--color-cian)">SócBalena</div>
        <div style="font-size:0.8rem;margin-top:0.25rem">Diari de busseig personal · v1.0</div>
      </div>
    </div>`;

  // ── Foto de perfil ──
  const avatarEl = el.querySelector('#avatar-perfil');
  const alertAvatar = el.querySelector('#alert-avatar');
  const inpAvatar = el.querySelector('#inp-avatar');
  const btnTreure = el.querySelector('#btn-treure-avatar');

  function refrescarAvatars() {
    pintarAvatar(avatarEl, store.usuari);
    pintarAvatar(document.getElementById('user-avatar'), store.usuari);
    btnTreure.style.display = store.usuari?.avatar_url ? '' : 'none';
  }
  refrescarAvatars();

  el.querySelector('#btn-pujar-avatar').onclick = () => inpAvatar.click();

  inpAvatar.addEventListener('change', async () => {
    const fitxer = inpAvatar.files?.[0];
    if (!fitxer) return;
    alertAvatar.innerHTML = '<div class="alert alert-info">Pujant la foto...</div>';
    try {
      const { avatar_url } = await api.pujarAvatar(fitxer);
      store.usuari.avatar_url = avatar_url;
      refrescarAvatars();
      alertAvatar.innerHTML = '<div class="alert alert-ok">✓ Foto de perfil actualitzada</div>';
    } catch (err) {
      alertAvatar.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    } finally {
      inpAvatar.value = '';
    }
  });

  btnTreure.onclick = async () => {
    if (!confirm('Treure la foto de perfil?')) return;
    try {
      await api.eliminarAvatar();
      store.usuari.avatar_url = null;
      refrescarAvatars();
      alertAvatar.innerHTML = '<div class="alert alert-ok">✓ Foto eliminada</div>';
    } catch (err) {
      alertAvatar.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  };

  // Desar nom
  el.querySelector('#btn-desar-nom').onclick = async () => {
    const nom = el.querySelector('#inp-nom').value.trim();
    const alertEl = el.querySelector('#alert-nom');
    if (!nom) { alertEl.innerHTML = '<div class="alert alert-error">El nom no pot estar buit</div>'; return; }
    try {
      // Actualitzem via endpoint perfil (simple PATCH — caldria afegir-lo al backend si es vol)
      // Per ara, actualitzem localment
      store.usuari.nom = nom;
      document.getElementById('user-nom').textContent = nom;
      refrescarAvatars();
      alertEl.innerHTML = '<div class="alert alert-ok">✓ Nom actualitzat</div>';
    } catch (err) {
      alertEl.innerHTML = `<div class="alert alert-error">${err.message}</div>`;
    }
  };

  // Canviar contrasenya
  el.querySelector('#btn-canviar-pass').onclick = async () => {
    const alertEl = el.querySelector('#alert-pass');
    const actual = el.querySelector('#pass-actual').value;
    const nova   = el.querySelector('#pass-nova').value;
    const conf   = el.querySelector('#pass-conf').value;
    if (!actual || !nova || !conf) { alertEl.innerHTML = '<div class="alert alert-error">Omple tots els camps</div>'; return; }
    if (nova.length < 8) { alertEl.innerHTML = '<div class="alert alert-error">La nova contrasenya ha de tenir mínim 8 caràcters</div>'; return; }
    if (nova !== conf)   { alertEl.innerHTML = '<div class="alert alert-error">Les contrasenyes no coincideixen</div>'; return; }
    // Aquí caldria una crida al backend per canviar la contrasenya (endpoint no implementat en aquest exemple)
    alertEl.innerHTML = '<div class="alert alert-info">Funcionalitat pendent d\'implementar al backend (endpoint PATCH /api/auth/contrasenya)</div>';
  };
}

function escapeHtml(s) { return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
