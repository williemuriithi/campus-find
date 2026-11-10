/**
 * CampusFind - shared UI helpers (DOM shortcuts, modal, toast, terms/privacy text).
 */
const $ = id => document.getElementById(id);
const show = (el, on = true) => el.classList.toggle('hidden', !on);
const emailRx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/* ---- localStorage wrapper ("Remember me") ---- */
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
  del(k)    { try { localStorage.removeItem(k); } catch (e) {} },
};

const normId = v => String(v || '').replace(/\s+/g, '').toUpperCase();
const SID_RX = /^[A-Z]{2}\d{3}\/\d{4}\/\d{4}$/;

/* ---- generic modal (#modal) ---- */
const icon = n => `<div class="w-14 h-14 rounded-full flex items-center justify-center mb-3 mx-auto" style="background:#fdc39a66"><span class="ms text-primary text-[32px]">${n}</span></div>`;
const btnCls = 'w-full h-11 bg-primary text-white rounded-lg text-sm font-semibold shadow-sm active:scale-[.98] transition';
const ghostCls = 'w-full h-11 mt-2 bg-surface-container-low text-primary rounded-lg text-sm font-semibold hover:bg-surface-container transition';

function openModal(html) { $('modal-box').innerHTML = html; show($('modal')); }
function closeModal() { show($('modal'), false); $('modal-box').innerHTML = ''; }
$('modal').addEventListener('click', e => { if (e.target === $('modal') && !$('modal').dataset.lock) closeModal(); });
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !$('modal').classList.contains('hidden') && !$('modal').dataset.lock) closeModal();
});

/* ---- toast ---- */
function showToast(message, ic = 'info') {
  const c = $('toast-container');
  const t = document.createElement('div');
  t.className = 'pointer-events-auto bg-primary text-on-primary px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 transition-all transform translate-y-2 opacity-0 duration-200';
  t.innerHTML = `<span class="material-symbols-outlined text-lg">${esc(ic)}</span><span class="font-body-md text-body-md font-medium">${esc(message)}</span>`;
  c.appendChild(t);
  requestAnimationFrame(() => t.classList.remove('translate-y-2', 'opacity-0'));
  setTimeout(() => { t.classList.add('opacity-0', 'translate-y-2'); setTimeout(() => t.remove(), 250); }, 3500);
}

/* ---- Terms of Use / Privacy Policy ---- */
const docs = {
  terms: { t: 'Terms of Use', b: [
    'CampusFind is a community service for reporting and recovering lost or found items on campus.',
    'You agree to provide accurate information, to report only items you genuinely lost or found, and to claim only items that belong to you.',
    'Misuse of the platform, false claims or harassment may lead to account suspension.',
    'Found items may be handed to Campus Public Safety for secure custody until verified owners claim them.' ] },
  privacy: { t: 'Privacy Policy', b: [
    'We collect your name, email and student ID to verify ownership and contact you about your reports.',
    'Your details are shown to other users only when needed to complete a verified claim.',
    'We do not sell your personal data. You may request deletion of your account at any time.',
    'Data is retained only as long as needed to operate the service and meet campus safety requirements.' ] },
};

function showDoc(key, withAgree) {
  const d = docs[key];
  openModal(`<h3 class="text-xl font-semibold mb-3">${d.t}</h3>${d.b.map(p => `<p class="text-sm text-on-surface-variant mb-2">${p}</p>`).join('')}
  <div class="flex gap-2 mt-4"><button id="d-close" class="${ghostCls} mt-0">Close</button>${withAgree ? `<button id="d-agree" class="${btnCls}">I Agree</button>` : ''}</div>`);
  $('d-close').onclick = closeModal;
  if (withAgree) $('d-agree').onclick = () => { $('su-terms').checked = true; syncTick(); closeModal(); };
}
