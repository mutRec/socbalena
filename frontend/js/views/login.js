// views/login.js
import { api } from '../api.js';
import { store, mostrarApp, navega } from '../app.js';

export function renderLogin(el) {
  el.innerHTML = `
    <div style="width:100%;max-width:420px;padding:1rem;">
      <div style="text-align:center;margin-bottom:2rem;">
        <div style="font-size:3.5rem;margin-bottom:0.5rem;">🐋</div>
        <h1 style="font-family:'Barlow Condensed',sans-serif;font-size:2.2rem;color:#00E5D0;letter-spacing:0.05em;">SócBalena</h1>
        <p style="color:#7AA3C0;font-size:0.9rem;">El teu diari de busseig</p>
      </div>

      <div class="card" id="login-card">
        <div style="display:flex;gap:0.5rem;margin-bottom:1.5rem;">
          <button class="btn btn-primary" id="tab-login" style="flex:1">Entrar</button>
          <button class="btn btn-secondary" id="tab-registre" style="flex:1">Registrar-se</button>
        </div>

        <div id="alert-login"></div>

        <!-- Formulari login -->
        <form id="form-login">
          <div class="form-group">
            <label class="form-label">Correu electrònic</label>
            <input class="form-input" type="email" id="login-email" placeholder="nom@exemple.cat" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label class="form-label">Contrasenya</label>
            <input class="form-input" type="password" id="login-pass" placeholder="••••••••" required autocomplete="current-password" />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:0.5rem;" id="btn-login">
            Entrar
          </button>
          <p style="text-align:center;margin-top:1rem;font-size:0.8rem;color:#7AA3C0;">
            Demo: <strong>admin@socbalena.cat</strong> / <strong>Demo1234!</strong>
          </p>
        </form>

        <!-- Formulari registre (ocult) -->
        <form id="form-registre" style="display:none">
          <div class="form-group">
            <label class="form-label">Nom complet</label>
            <input class="form-input" type="text" id="reg-nom" placeholder="Maria García" required />
          </div>
          <div class="form-group">
            <label class="form-label">Correu electrònic</label>
            <input class="form-input" type="email" id="reg-email" placeholder="nom@exemple.cat" required />
          </div>
          <div class="form-group">
            <label class="form-label">Contrasenya (mínim 8 caràcters)</label>
            <input class="form-input" type="password" id="reg-pass" placeholder="••••••••" required minlength="8" />
          </div>
          <button type="submit" class="btn btn-primary" style="width:100%;margin-top:0.5rem;">
            Crear compte
          </button>
        </form>
      </div>
    </div>`;

  // Tabs
  const tabLogin = el.querySelector('#tab-login');
  const tabReg   = el.querySelector('#tab-registre');
  const fLogin   = el.querySelector('#form-login');
  const fReg     = el.querySelector('#form-registre');
  const alert    = el.querySelector('#alert-login');

  tabLogin.onclick = () => {
    fLogin.style.display = ''; fReg.style.display = 'none';
    tabLogin.className = 'btn btn-primary'; tabReg.className = 'btn btn-secondary';
  };
  tabReg.onclick = () => {
    fReg.style.display = ''; fLogin.style.display = 'none';
    tabReg.className = 'btn btn-primary'; tabLogin.className = 'btn btn-secondary';
  };

  function mostrarError(msg) {
    alert.innerHTML = `<div class="alert alert-error">${msg}</div>`;
  }

  fLogin.onsubmit = async (e) => {
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

  fReg.onsubmit = async (e) => {
    e.preventDefault();
    alert.innerHTML = '';
    try {
      const { token, usuari } = await api.registre(
        el.querySelector('#reg-nom').value,
        el.querySelector('#reg-email').value,
        el.querySelector('#reg-pass').value
      );
      store.setSession(token, usuari);
      mostrarApp();
      navega('/');
    } catch (err) {
      mostrarError(err.message);
    }
  };
}
