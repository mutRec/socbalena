// views/confirm-modal.js
// Diàleg de confirmació propi de l'aplicació (substitueix window.confirm)
import { escapeHtml } from '../format.js';

// Comptador per generar ids únics d'accessibilitat (per si hi ha més d'un diàleg)
let comptador = 0;

/**
 * Obre un diàleg de confirmació amb l'aspecte de l'aplicació.
 *
 * @param {Object}   [opcions]
 * @param {string}   [opcions.titol]         Títol del diàleg.
 * @param {string}   [opcions.missatge]      Text principal (què passarà).
 * @param {string[]} [opcions.detalls]       Línies addicionals amb les conseqüències.
 * @param {string}   [opcions.textConfirmar] Etiqueta del botó d'acció.
 * @param {string}   [opcions.textCancelar]  Etiqueta del botó de cancel·lar.
 * @param {string}   [opcions.textEnCurs]    Etiqueta mentre s'executa l'acció.
 * @param {boolean}  [opcions.perill]        Estil destructiu (vermell + icona d'avís).
 * @param {string}   [opcions.icona]         Icona del diàleg (per defecte segons `perill`).
 * @param {Function} [opcions.onConfirmar]   Acció a executar en confirmar (pot ser async).
 * @returns {Promise<boolean>} true si s'ha confirmat i l'acció ha acabat bé.
 */
export function obrirConfirmacio({
  titol = 'Confirmar acció',
  missatge = '',
  detalls = [],
  textConfirmar = 'Confirmar',
  textCancelar = 'Cancel·lar',
  textEnCurs = null,
  perill = true,
  icona = null,
  onConfirmar = null
} = {}) {
  const uid = ++comptador;
  const idTitol = `confirm-titol-${uid}`;
  const idMissatge = `confirm-missatge-${uid}`;

  const focusPrevi = document.activeElement;
  const etiquetaConfirmar = textConfirmar;
  const etiquetaEnCurs = textEnCurs || `${textConfirmar}…`;

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay modal-overlay-confirm';
  overlay.innerHTML = `
    <div class="modal modal-sm" role="dialog" aria-modal="true"
         aria-labelledby="${idTitol}" aria-describedby="${idMissatge}">
      <div class="modal-header">
        <h2 id="${idTitol}">${escapeHtml(titol)}</h2>
        <button class="btn btn-ghost btn-icon" data-accio="tancar" aria-label="Tancar">✕</button>
      </div>
      <div class="modal-body">
        <div class="confirm-cap">
          <div class="confirm-icon ${perill ? 'confirm-icon-perill' : ''}" aria-hidden="true">${escapeHtml(icona || (perill ? '⚠️' : '❓'))}</div>
          <div class="confirm-cos">
            <p class="confirm-missatge" id="${idMissatge}">${escapeHtml(missatge)}</p>
            ${detalls.length ? `
              <ul class="confirm-detalls">
                ${detalls.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
              </ul>` : ''}
          </div>
        </div>
        <div class="confirm-alerta" data-accio="alerta" role="alert"></div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" data-accio="cancel">${escapeHtml(textCancelar)}</button>
        <button class="btn ${perill ? 'btn-danger' : 'btn-primary'}" data-accio="ok">${escapeHtml(textConfirmar)}</button>
      </div>
    </div>`;

  document.body.appendChild(overlay);

  const btnTancar = overlay.querySelector('[data-accio="tancar"]');
  const btnCancel = overlay.querySelector('[data-accio="cancel"]');
  const btnOk = overlay.querySelector('[data-accio="ok"]');
  const alerta = overlay.querySelector('[data-accio="alerta"]');
  const caixa = overlay.querySelector('.modal');

  let tancat = false;
  let ocupat = false;

  return new Promise((resolve) => {
    const destrueix = (resultat) => {
      if (tancat) return;
      tancat = true;
      document.removeEventListener('keydown', onKeydown, true);
      overlay.remove();
      if (focusPrevi && typeof focusPrevi.focus === 'function') focusPrevi.focus();
      resolve(resultat);
    };

    // Tanca sense executar res (no mentre s'està esborrant o desant)
    const tancarAmb = (resultat) => { if (!ocupat) destrueix(resultat); };

    function onKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        tancarAmb(false);
        return;
      }
      // Mantenir el focus dins del diàleg
      if (e.key !== 'Tab') return;
      const focusables = [...caixa.querySelectorAll('button:not([disabled])')];
      if (!focusables.length) return;
      const primer = focusables[0];
      const ultim = focusables[focusables.length - 1];
      if (e.shiftKey && document.activeElement === primer) {
        e.preventDefault();
        ultim.focus();
      } else if (!e.shiftKey && document.activeElement === ultim) {
        e.preventDefault();
        primer.focus();
      }
    }

    document.addEventListener('keydown', onKeydown, true);

    btnTancar.addEventListener('click', () => tancarAmb(false));
    btnCancel.addEventListener('click', () => tancarAmb(false));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) tancarAmb(false); });

    btnOk.addEventListener('click', async () => {
      if (ocupat) return;

      // Sense acció associada: només cal saber si s'ha confirmat
      if (!onConfirmar) { destrueix(true); return; }

      ocupat = true;
      alerta.innerHTML = '';
      overlay.setAttribute('aria-busy', 'true');
      btnOk.disabled = true;
      btnCancel.disabled = true;
      btnTancar.disabled = true;
      btnOk.textContent = etiquetaEnCurs;

      try {
        await onConfirmar();
        ocupat = false;
        destrueix(true);
      } catch (err) {
        ocupat = false;
        overlay.removeAttribute('aria-busy');
        btnOk.disabled = false;
        btnCancel.disabled = false;
        btnTancar.disabled = false;
        btnOk.textContent = etiquetaConfirmar;
        alerta.innerHTML = `<div class="alert alert-error">${escapeHtml(err?.message || 'No s\'ha pogut completar l\'acció')}</div>`;
        btnCancel.focus();
      }
    });

    // El focus inicial va a «Cancel·lar» per seguretat en accions destructives
    (perill ? btnCancel : btnOk).focus();
  });
}