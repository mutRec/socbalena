// app.js — Punt d'entrada i router de SócBalena

import { api } from './api.js';
import { renderLogin } from './views/login.js';
import { renderInici } from './views/inici.js';
import { renderImmersions } from './views/immersions.js';
import { renderImmersioDetall } from './views/immersio-detall.js';
import { renderCentres } from './views/centres.js';
import { renderZones } from './views/zones.js';
import { renderPerfil } from './views/perfil.js';

// ── Estat global ────────────────────────────────────────
export const store = {
  usuari: null,
  token: () => localStorage.getItem('sb_token'),
  setSession: (token, usuari) => {
    localStorage.setItem('sb_token', token);
    store.usuari = usuari;
  },
  clearSession: () => {
    localStorage.removeItem('sb_token');
    store.usuari = null;
  }
};

// ── Router hash ──────────────────────────────────────────
const RUTES = {
  '/':             renderInici,
  '/immersions':   renderImmersions,
  '/immersio':     renderImmersioDetall,   // /immersio/:id
  '/centres':      renderCentres,
  '/zones':        renderZones,
  '/perfil':       renderPerfil,
};

export async function navega(path) {
  window.location.hash = path;
}

async function enrutarHash() {
  const hash = window.location.hash.slice(1) || '/';
  const [base, id] = hash.split('/').filter(Boolean);
  const ruta = '/' + (base || '');

  // Actualitzar nav actiu
  document.querySelectorAll('.nav-link').forEach(el => {
    el.classList.toggle('actiu', el.dataset.route === ruta || (ruta === '/' && el.dataset.route === '/'));
  });

  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;

  const handler = RUTES[ruta];
  if (handler) {
    mainContent.innerHTML = '<div class="loading"><div class="spinner"></div> Carregant...</div>';
    try {
      await handler(mainContent, id);
    } catch (err) {
      mainContent.innerHTML = `<div class="alert alert-error">Error: ${err.message}</div>`;
    }
  } else {
    mainContent.innerHTML = `
      <div class="buit">
        <div class="icon">🔍</div>
        <h3>Pàgina no trobada</h3>
        <p>La ruta <code>${hash}</code> no existeix.</p>
        <a href="#/" class="btn btn-primary" style="margin-top:1rem">Anar a l'inici</a>
      </div>`;
  }
}

// ── Inicialització ────────────────────────────────────────
async function init() {
  const savedToken = localStorage.getItem('sb_token');

  if (savedToken) {
    try {
      const usuari = await api.perfil();
      store.usuari = usuari;
      mostrarApp();
      enrutarHash();
    } catch {
      localStorage.removeItem('sb_token');
      mostrarLogin();
    }
  } else {
    mostrarLogin();
  }

  window.addEventListener('hashchange', () => {
    if (store.usuari) enrutarHash();
  });
}

export function mostrarApp() {
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app-shell').style.display = 'grid';

  // Actualitzar info d'usuari al topbar
  const nom = store.usuari?.nom || '';
  document.getElementById('user-nom').textContent = nom;
  document.getElementById('user-avatar').textContent = nom.charAt(0).toUpperCase() || '?';

  document.getElementById('btn-logout').onclick = () => {
    store.clearSession();
    mostrarLogin();
    window.location.hash = '/';
  };
}

export function mostrarLogin() {
  document.getElementById('app-shell').style.display = 'none';
  const loginEl = document.getElementById('login-screen');
  loginEl.style.display = 'flex';
  loginEl.style.cssText = 'display:flex;align-items:center;justify-content:center;min-height:100vh;';
  renderLogin(loginEl);
}

init();
