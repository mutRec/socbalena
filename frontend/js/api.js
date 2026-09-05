// api.js — Client HTTP per a l'API de SócBalena

const BASE = '/api';

function token() { return localStorage.getItem('sb_token'); }
function headers(extra = {}) {
  const h = { 'Content-Type': 'application/json', ...extra };
  if (token()) h['Authorization'] = `Bearer ${token()}`;
  return h;
}

async function req(method, path, body, isFormData = false) {
  const opts = { method, headers: {} };
  if (token()) opts.headers['Authorization'] = `Bearer ${token()}`;

  if (body && !isFormData) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  } else if (isFormData) {
    opts.body = body; // FormData — sense Content-Type
  }

  const res = await fetch(BASE + path, opts);
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
  return data;
}

export const api = {
  // Auth
  login:    (email, password) => req('POST', '/auth/login', { email, password }),
  perfil:   () => req('GET', '/auth/perfil'),

  // Immersions
  immersions: {
    llista:   (params = {}) => req('GET', '/immersions?' + new URLSearchParams(params)),
    obtenir:  (id)          => req('GET', `/immersions/${id}`),
    crear:    (dades)       => req('POST', '/immersions', dades),
    editar:   (id, dades)   => req('PUT', `/immersions/${id}`, dades),
    eliminar: (id)          => req('DELETE', `/immersions/${id}`),
  },

  // Centres
  centres: {
    llista:   ()           => req('GET', '/centres'),
    obtenir:  (id)         => req('GET', `/centres/${id}`),
    crear:    (dades)      => req('POST', '/centres', dades),
    editar:   (id, dades)  => req('PUT', `/centres/${id}`, dades),
    eliminar: (id)         => req('DELETE', `/centres/${id}`),
  },

  // Zones
  zones: {
    llista:   ()           => req('GET', '/zones'),
    obtenir:  (id)         => req('GET', `/zones/${id}`),
    crear:    (dades)      => req('POST', '/zones', dades),
    editar:   (id, dades)  => req('PUT', `/zones/${id}`, dades),
    eliminar: (id)         => req('DELETE', `/zones/${id}`),
  },

  // Media
  media: {
    pujar:    (immersioId, fitxer, descripcio) => {
      const fd = new FormData();
      fd.append('fitxer', fitxer);
      if (descripcio) fd.append('descripcio', descripcio);
      return req('POST', `/media/${immersioId}`, fd, true);
    },
    portada:    (id)           => req('PATCH', `/media/${id}/portada`, {}),
    actualitzar:(id, dades)    => req('PATCH', `/media/${id}`, dades),
    eliminar:   (id)           => req('DELETE', `/media/${id}`),
  }
};
