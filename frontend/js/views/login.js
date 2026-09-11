// views/login.js
import { api } from '../api.js';
import { store, mostrarApp, navega } from '../app.js';

export function renderLogin(el) {
  el.innerHTML = `
    <div style="width:100%;max-width:420px;padding:1rem;">
      <div style="text-align:center;margin-bottom:2rem;">

       <!-- <div style="font-size:3.5rem;margin-bottom:0.5rem;">🐋</div> -->
      
       <!-- SUBSTITUEIX 'URL_DE_LA_TEVA_IMATGE' per la ruta real de la teva foto (ex: '/assets/la-meva-cara.jpg' o una URL externa) -->
        <img 
          src="../../images/fotojordi.png" 
          alt="Foto de perfil" 
          style="width:160px; height:160px; border-radius:50%; object-fit:cover; margin-bottom:0.1rem; border: 0px solid #00E5D0; box-shadow: 0 4px 8px rgba(0,0,0,0.15);" 
        />

        <h1 style="font-family:'Barlow Condensed',sans-serif;font-size:2.2rem;color:#00E5D0;letter-spacing:0.05em;">SócBalena</h1>
        <p style="color:#7AA3C0;font-size:0.9rem;">Diari de busseig</p>
      </div>

      <div class="card" id="login-card">
        <div id="alert-login"></div>

        <!-- Formulari login -->
        <form id="form-login">
          <div class="form-group">
            <label class="form-label">Nom d'Usuari (Correu-e)</label>
            <input class="form-input" type="email" id="login-email" placeholder="nom@exemple.cat" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label class="form-label">Contrasenya</label>
            <input class="form-input" type="password" id="login-pass" placeholder="••••••••" required autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:0.5rem;" id="btn-login">
            Entrar
          </button>
        </form>
      </div>
    </div>`;

  const alert = el.querySelector('#alert-login');

  function mostrarError(msg) {
    alert.innerHTML = `<div class="alert alert-error">${msg}</div>`;
  }

  el.querySelector('#form-login').onsubmit = async (e) => {
    e.preventDefault();
    alert.innerHTML = '';
    const btn = el.querySelector('#btn-login');
    btn.disabled = true; btn.textContent = 'Entrant...';
    try {
      const { token, usuari } = await api.login(
        el.querySelector('#login-email').value,
        el.querySelector('#login-pass').value
      );
      store.setSession(token, usuari);
      mostrarApp();
      navega('/');
    } catch (err) {
      mostrarError(err.message);
    } finally {
      btn.disabled = false; btn.textContent = 'Entrar';
    }
  };
}
