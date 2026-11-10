/**
 * CampusFind - home screen after sign-in: items feed, filters, detail modal, report form.
 * Data comes from the PHP/MySQL backend through api.js.
 */
const CATS = [
  { v: 'Phones & Electronics', icon: 'smartphone' },
  { v: 'Student IDs & Cards', icon: 'badge' },
  { v: 'Bags & Backpacks', icon: 'backpack' },
  { v: 'Keys', icon: 'key', label: 'Keys & Access Fobs' },
  { v: 'Books & Stationery', icon: 'menu_book' },
  { v: 'Clothing & Accessories', icon: 'apparel' },
  { v: 'Wallets & Personal Items', icon: 'account_balance_wallet' },
  { v: 'Other Items', icon: 'category' },
];
const BUILDINGS = [
  { v: 'Main Library' }, { v: 'Student Union' }, { v: 'Science Complex' }, { v: 'Engineering Hall' },
  { v: 'Dining Center', label: 'Campus Dining Hall' }, { v: 'Athletic Center' }, { v: 'Central Bus Stop' },
];
const catIcon = c => (CATS.find(x => x.v === c) || { icon: 'category' }).icon;
const bldLabel = b => (BUILDINGS.find(x => x.v === b) || { label: b }).label || b;
const PAGE_SIZE = 8;

let me = null, items = [], activeItem = null, showAll = false, loadError = '';
let currentFilter = { keyword: '', category: 'ALL', location: 'ALL', status: 'ALL' };
let signingOut = false;

const statusCls = s => s === 'Lost' ? 'bg-error-container text-on-error-container' : s === 'Found' ? 'bg-secondary-fixed text-on-secondary-fixed' : 'bg-surface-container text-primary';

function fmtDate(d) {
  if (!d) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  const dt = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(d);
  return isNaN(dt) ? String(d) : dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function mapRow(r) {
  return {
    id: String(r.id), ref: r.ref || 'CF', kind: r.kind, status: r.status, title: r.title, category: r.category,
    building: r.building,
    location: bldLabel(r.building) + (r.location_detail ? ' - ' + r.location_detail : ''),
    date: fmtDate(r.incident_date), description: r.description, icon: catIcon(r.category),
    reportedBy: r.reported_by, reporterName: r.reporter_name || 'a student', reporterEmail: r.reporter_email || '',
  };
}
const isMine = it => me && it.reportedBy === me.id;

/* ---------------- data ---------------- */
async function loadItems(quiet) {
  if (!me) return;
  const r = await api.listItems();
  if (r.status === 401) { if (!signingOut) leaveApp('Your session has ended. Please sign in again.', 'error'); return; }
  if (!r.ok) {
    loadError = (r.data && r.data.error) || NET_ERR;
    items = [];
  } else {
    loadError = '';
    items = (r.data.items || []).map(mapRow);
  }
  renderAll();
  if (!quiet && loadError) showToast('Could not load reports', 'error');
}
function renderAll() { renderItems(); updateStats(); updateCategoryCounts(); }

function updateStats() {
  const c = s => items.filter(i => i.status === s).length;
  $('stat-total-reports').textContent = items.length;
  $('stat-lost-items').textContent = c('Lost');
  $('stat-found-items').textContent = c('Found');
  $('stat-recovered-items').textContent = c('Recovered');
  $('hero-recovered').textContent = c('Recovered');
}
function updateCategoryCounts() {
  document.querySelectorAll('.category-card').forEach(card => {
    const cat = card.getAttribute('data-cat');
    const n = items.filter(i => i.category === cat).length;
    const sp = [...card.querySelectorAll('span')].find(s => /^\d+ items?$|^General$/.test(s.textContent.trim()));
    if (sp) sp.textContent = n + (n === 1 ? ' item' : ' items');
  });
}

/* ---------------- feed ---------------- */
function filteredItems() {
  const k = currentFilter.keyword.toLowerCase();
  return items.filter(it => {
    const mk = !k || it.title.toLowerCase().includes(k) || it.description.toLowerCase().includes(k) || it.location.toLowerCase().includes(k) || it.ref.toLowerCase().includes(k);
    return mk && (currentFilter.category === 'ALL' || it.category === currentFilter.category)
      && (currentFilter.location === 'ALL' || it.building === currentFilter.location)
      && (currentFilter.status === 'ALL' || it.status === currentFilter.status);
  });
}

function renderItems() {
  const grid = $('items-grid-container'), empty = $('empty-state-container'), badge = $('active-results-indicator');
  const viewAll = $('view-all-items-trigger'), emptyP = empty.querySelector('p'), emptyH = empty.querySelector('h3');

  if (loadError) {
    badge.textContent = 'Could not load reports';
    grid.innerHTML = `<div class="col-span-full rounded-2xl bg-error-container text-on-error-container p-5 flex items-start gap-3"><span class="material-symbols-outlined">error</span><div class="font-body-md text-body-md">${esc(loadError)}</div></div>`;
    show(empty, false); show(viewAll.parentElement, false); return;
  }

  const f = filteredItems();
  const vis = showAll ? f : f.slice(0, PAGE_SIZE);
  const filtering = f.length !== items.length;
  badge.textContent = `Showing ${vis.length} of ${f.length} ${filtering ? 'matching ' : ''}items`;

  if (f.length === 0) {
    grid.innerHTML = ''; show(empty, true); show(viewAll.parentElement, false);
    if (items.length === 0) {
      emptyH.textContent = 'No Reports Yet';
      emptyP.textContent = 'Nothing has been reported so far. Be the first to report a lost or found item.';
      show($('empty-reset-btn'), false);
    } else {
      emptyH.textContent = 'No Matching Items Found';
      emptyP.textContent = "We couldn't find any reports matching your filters. Try adjusting keywords or clearing the category filter.";
      show($('empty-reset-btn'), true);
    }
    return;
  }

  show(empty, false);
  grid.innerHTML = vis.map(it => `
    <div class="group bg-surface-container-lowest rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden">
      <div>
        <div class="relative h-44 w-full bg-gradient-to-br from-surface-container to-secondary-fixed/50 flex items-center justify-center overflow-hidden">
          <span class="material-symbols-outlined text-primary/25 text-[84px] group-hover:scale-110 transition-transform duration-500">${esc(it.icon)}</span>
          <div class="absolute top-3 left-3 flex items-center gap-1.5">
            <span class="px-2.5 py-1 rounded-full font-label-sm text-label-sm ${statusCls(it.status)} font-semibold shadow-sm">${esc(it.status)}</span>
            ${isMine(it) ? '<span class="px-2 py-1 rounded-full font-label-sm text-label-sm bg-primary text-on-primary shadow-sm">Your report</span>' : ''}
          </div>
          <div class="absolute top-3 right-3 w-8 h-8 rounded-full bg-surface/90 flex items-center justify-center text-primary shadow-sm"><span class="material-symbols-outlined text-base">${esc(it.icon)}</span></div>
        </div>
        <div class="p-4 space-y-2">
          <span class="font-label-sm text-label-sm text-secondary block uppercase tracking-wider">${esc(it.category)}</span>
          <h3 class="font-title-lg text-title-lg text-primary font-semibold line-clamp-1 group-hover:text-tertiary-container transition-colors">${esc(it.title)}</h3>
          <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">${esc(it.description)}</p>
        </div>
      </div>
      <div class="p-4 pt-0"><div class="pt-3 flex flex-col gap-2">
        <div class="flex items-center justify-between text-on-surface-variant font-label-sm text-label-sm">
          <div class="flex items-center gap-1 truncate max-w-[160px]" title="${esc(it.location)}"><span class="material-symbols-outlined text-sm text-primary">pin_drop</span><span class="truncate">${esc(it.location)}</span></div>
          <span class="text-secondary whitespace-nowrap">${esc(it.date)}</span>
        </div>
        <button data-item-id="${esc(it.id)}" class="view-item-detail-btn w-full mt-1 py-2 rounded-xl bg-surface-container hover:bg-surface-container-highest text-primary font-label-md text-label-md transition-colors flex items-center justify-center gap-1"><span>View Details</span><span class="material-symbols-outlined text-sm">arrow_forward</span></button>
      </div></div>
    </div>`).join('');
  grid.querySelectorAll('.view-item-detail-btn').forEach(b => b.addEventListener('click', () => openDetail(b.getAttribute('data-item-id'))));

  show(viewAll.parentElement, f.length > PAGE_SIZE);
  viewAll.children[0].textContent = showAll ? 'Show Fewer Reports' : `View All ${f.length} Reports`;
  viewAll.children[1].textContent = showAll ? 'expand_less' : 'expand_more';
}

/* ---------------- item detail modal ---------------- */
function openDetail(id) {
  const it = items.find(i => i.id === id); if (!it) return;
  activeItem = it;
  $('modal-title').textContent = it.title;
  const b = $('modal-status-badge'); b.textContent = it.status;
  b.className = 'inline-flex items-center px-2.5 py-0.5 rounded-full font-label-sm text-label-sm font-semibold ' + statusCls(it.status);
  $('modal-location').textContent = it.location;
  $('modal-date').textContent = it.date;
  $('modal-desc').textContent = it.description;
  $('modal-reference-id').textContent = it.ref;
  $('modal-category-icon').textContent = it.icon;
  $('modal-big-icon').textContent = it.icon;
  $('modal-reporter').textContent = isMine(it) ? 'you' : it.reporterName;
  const mine = isMine(it);
  show($('modal-mark-status-btn'), mine); show($('modal-delete-btn'), mine);
  show($('modal-contact-desk-btn'), !mine && !!it.reporterEmail);
  $('modal-status-action-text').textContent = it.status === 'Recovered' ? 'Reopen Report' : 'Mark as Recovered';
  show($('item-modal'), true); document.body.style.overflow = 'hidden';
}
function closeDetail() { show($('item-modal'), false); document.body.style.overflow = ''; activeItem = null; }
$('modal-close-btn').addEventListener('click', closeDetail);
$('item-modal').addEventListener('click', e => { if (e.target.id === 'item-modal') closeDetail(); });

$('modal-mark-status-btn').addEventListener('click', async () => {
  const it = activeItem; if (!it || !isMine(it)) return;
  const reopen = it.status === 'Recovered';
  const btn = $('modal-mark-status-btn'); btn.disabled = true;
  const r = await api.toggleItem(it.id);
  btn.disabled = false;
  if (!r.ok) { showToast('Could not update this report. Please try again.', 'error'); return; }
  it.status = r.data.item.status;
  showToast(reopen ? `Report ${it.ref} reopened as ${it.kind}.` : `Report ${it.ref} marked as Recovered!`, reopen ? 'refresh' : 'check_circle');
  renderAll(); closeDetail();
});

$('modal-delete-btn').addEventListener('click', async () => {
  const it = activeItem; if (!it || !isMine(it)) return;
  if (!window.confirm('Delete report ' + it.ref + '? This cannot be undone.')) return;
  const r = await api.deleteItem(it.id);
  if (!r.ok) { showToast('Could not delete this report. Please try again.', 'error'); return; }
  items = items.filter(x => x.id !== it.id);
  showToast(`Report ${it.ref} deleted.`, 'delete');
  renderAll(); closeDetail();
});

$('modal-contact-desk-btn').addEventListener('click', () => {
  const it = activeItem; if (!it || !it.reporterEmail) return;
  const subj = encodeURIComponent(`CampusFind ${it.ref}: ${it.title}`);
  const body = encodeURIComponent(`Hi ${it.reporterName},\n\nI'm contacting you about your ${it.kind.toLowerCase()} report ${it.ref} (${it.title}) on CampusFind.\n\n`);
  showToast('Opening your email app...', 'mark_email_read');
  window.location.href = `mailto:${it.reporterEmail}?subject=${subj}&body=${body}`;
});

/* ---------------- filters ---------------- */
const searchInput = $('filter-search-input'), categorySelect = $('filter-category-select'), locationSelect = $('filter-location-select');
function applyFilterInputs() {
  currentFilter.keyword = searchInput.value.trim();
  currentFilter.category = categorySelect.value;
  currentFilter.location = locationSelect.value;
  renderItems();
}
searchInput.addEventListener('input', applyFilterInputs);
categorySelect.addEventListener('change', applyFilterInputs);
locationSelect.addEventListener('change', applyFilterInputs);
$('search-trigger-btn').addEventListener('click', () => { applyFilterInputs(); scrollToId('recent-items-section'); });

const statusButtons = [...document.querySelectorAll('.status-toggle-btn')];
function setStatusPill(st) {
  statusButtons.forEach(b => {
    const on = b.getAttribute('data-status') === st;
    b.classList.toggle('bg-primary', on); b.classList.toggle('text-on-primary', on);
    b.classList.toggle('bg-surface', !on); b.classList.toggle('text-secondary', !on);
  });
}
statusButtons.forEach(b => b.addEventListener('click', () => {
  currentFilter.status = b.getAttribute('data-status'); setStatusPill(currentFilter.status); renderItems();
}));
function resetAllFilters(quiet) {
  searchInput.value = ''; categorySelect.value = 'ALL'; locationSelect.value = 'ALL';
  currentFilter = { keyword: '', category: 'ALL', location: 'ALL', status: 'ALL' };
  setStatusPill('ALL'); renderItems();
  if (!quiet) showToast('Filters have been cleared', 'clear_all');
}
$('reset-filters-btn').addEventListener('click', () => resetAllFilters());
$('empty-reset-btn').addEventListener('click', () => resetAllFilters());
document.querySelectorAll('.category-card').forEach(card => card.addEventListener('click', () => {
  const cat = card.getAttribute('data-cat');
  categorySelect.value = cat; currentFilter.category = cat; renderItems();
  scrollToId('recent-items-section'); showToast('Filtered by ' + cat, 'filter_alt');
}));
$('reset-feed-data-btn').addEventListener('click', async () => {
  await loadItems(true);
  showToast(loadError ? 'Could not refresh reports' : 'Reports refreshed', loadError ? 'error' : 'refresh');
});
$('view-all-items-trigger').addEventListener('click', () => {
  showAll = !showAll; renderItems();
  if (!showAll) scrollToId('recent-items-section');
});

/* ---------------- scrolling & navigation ---------------- */
function scrollToId(id) {
  const el = $(id); if (!el) return;
  const y = el.getBoundingClientRect().top + window.pageYOffset - 88;
  window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
}
function closeMenus() { show($('user-menu'), false); show($('mobile-nav'), false); }
function goPath(p) {
  closeMenus();
  if (p === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
  else if (p === 'browse-items') scrollToId('search-section');
  else if (p === 'report-an-item') openReport('Lost');
  else if (p === 'how-it-works') scrollToId('how-it-works');
  else if (p === 'about-us') showAbout();
  else if (p === 'privacy-policy') showDoc('privacy', false);
  else if (p === 'terms-of-service') showDoc('terms', false);
}
document.querySelectorAll('#app-root [data-path]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); goPath(a.getAttribute('data-path')); }));
document.querySelectorAll('#app-root [data-scroll]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); scrollToId(a.getAttribute('data-scroll')); }));
$('hero-quick-report-btn').addEventListener('click', () => openReport('Lost'));
$('cta-report-found-btn').addEventListener('click', () => openReport('Found'));
$('mobile-menu-btn').addEventListener('click', e => { e.stopPropagation(); show($('user-menu'), false); $('mobile-nav').classList.toggle('hidden'); });
$('user-menu-btn').addEventListener('click', e => { e.stopPropagation(); show($('mobile-nav'), false); $('user-menu').classList.toggle('hidden'); });
document.addEventListener('click', e => {
  if (!$('user-menu').contains(e.target) && !$('mobile-nav').contains(e.target)) closeMenus();
});
$('menu-signout-btn').addEventListener('click', () => doSignOut());

function showAbout() {
  openModal(`${icon('info')}<h3 class="text-xl font-semibold text-center">About CampusFind</h3>
  <p class="text-sm text-on-surface-variant mt-2">CampusFind is a lost and found platform for registered students on campus. Report something you lost or found, browse what others have reported, and contact the person who reported an item to arrange its return.</p>
  <p class="text-sm text-on-surface-variant mt-2">Accounts are limited to students on the campus registry.</p>
  <button id="about-ok" class="${btnCls} mt-5">Close</button>`);
  $('about-ok').onclick = closeModal;
}

/* ---------------- report an item ---------------- */
function fillSelect(sel, list, ph) {
  sel.innerHTML = `<option value="">${esc(ph)}</option>` + list.map(o => `<option value="${esc(o.v)}">${esc(o.label || o.v)}</option>`).join('');
}
fillSelect($('rp-category'), CATS, 'Select a category');
fillSelect($('rp-building'), BUILDINGS, 'Select a location');

let rpKind = 'Lost';
function setKind(k) {
  rpKind = k;
  [['Lost', 'rp-kind-lost'], ['Found', 'rp-kind-found']].forEach(([n, id]) => {
    const on = n === k, b = $(id);
    b.classList.toggle('bg-primary', on); b.classList.toggle('text-on-primary', on);
    b.classList.toggle('bg-surface-container-low', !on); b.classList.toggle('text-primary', !on);
    b.setAttribute('aria-pressed', on);
  });
  $('rp-title-label').textContent = k === 'Lost' ? 'What did you lose?' : 'What did you find?';
  $('rp-date-label').textContent = k === 'Lost' ? 'Date lost' : 'Date found';
  $('rp-loc-label').textContent = k === 'Lost' ? 'Where did you lose it?' : 'Where did you find it?';
}
function todayStr() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function openReport(kind) {
  closeMenus();
  $('rp-form').reset(); show($('rp-err'), false);
  $('rp-date').value = todayStr(); $('rp-date').max = todayStr();
  setKind(kind || 'Lost');
  show($('report-modal'), true); document.body.style.overflow = 'hidden';
  setTimeout(() => $('rp-title').focus(), 50);
}
function closeReport() { show($('report-modal'), false); document.body.style.overflow = ''; }
$('rp-kind-lost').addEventListener('click', () => setKind('Lost'));
$('rp-kind-found').addEventListener('click', () => setKind('Found'));
$('rp-close').addEventListener('click', closeReport);
$('rp-cancel').addEventListener('click', closeReport);
$('report-modal').addEventListener('click', e => { if (e.target.id === 'report-modal') closeReport(); });
function rpError(t) { $('rp-err').lastElementChild.textContent = t; show($('rp-err'), true); }

$('rp-form').addEventListener('submit', async e => {
  e.preventDefault();
  const title = $('rp-title').value.trim(), category = $('rp-category').value, building = $('rp-building').value,
        spot = $('rp-spot').value.trim(), date = $('rp-date').value, desc = $('rp-desc').value.trim();
  if (title.length < 2) return rpError('Please enter what the item is.');
  if (!category) return rpError('Please choose a category.');
  if (!building) return rpError('Please choose a location.');
  if (!date || date > todayStr()) return rpError('Please enter a valid date (not in the future).');
  if (desc.length < 5) return rpError('Please add a short description (at least 5 characters).');
  show($('rp-err'), false);
  if (!me) return rpError(NET_ERR);

  $('rp-submit').disabled = true; show($('rp-spin')); $('rp-text').textContent = 'Submitting...';
  const r = await api.createItem({ kind: rpKind, title, category, building, location_detail: spot, incident_date: date, description: desc });
  $('rp-submit').disabled = false; show($('rp-spin'), false); $('rp-text').textContent = 'Submit Report';

  if (!r.ok) return rpError(r.data.error || 'Could not submit your report. Please check your connection and try again.');

  items.unshift(mapRow(r.data.item));
  closeReport(); resetAllFilters(true); renderAll();
  showToast(`${rpKind} report ${r.data.item.ref} submitted!`, 'check_circle');
  scrollToId('recent-items-section');
});

/* ---------------- enter / leave the app ---------------- */
function enterApp(user) {
  me = user; signingOut = false;
  $('hdr-name').textContent = user.full_name || user.email;
  $('hdr-sub').textContent = user.student_id || user.email;
  $('menu-email').textContent = user.email || '';
  show($('auth-root'), false); show($('app-root'), true);
  closeModal(); closeMenus();
  window.scrollTo(0, 0);
  resetAllFilters(true); showAll = false;
  loadItems();
}
function leaveApp(msg, kind) {
  me = null; items = []; activeItem = null;
  closeDetail(); closeReport(); closeMenus(); closeModal();
  show($('app-root'), false); show($('auth-root'), true);
  go('signin'); $('si-form').reset(); siHide();
  if (msg) siAlert(kind || 'success', msg);
  restoreRemember();
  window.scrollTo(0, 0);
}
async function doSignOut() {
  signingOut = true;
  await api.logout();
  leaveApp('You have been signed out.');
}

document.addEventListener('visibilitychange', () => { if (!document.hidden && me) loadItems(true); });
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  if (!$('item-modal').classList.contains('hidden')) closeDetail();
  if (!$('report-modal').classList.contains('hidden')) closeReport();
  closeMenus();
});

/* ---------------- restore an existing PHP session on page load ---------------- */
(async () => {
  const r = await api.me();
  if (r.ok && r.data.user && !me) enterApp(r.data.user);
})();
