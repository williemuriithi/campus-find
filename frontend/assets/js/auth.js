/**
 * CampusFind - sign in, sign up and password recovery screens.
 * Depends on: api.js, utils.js. Calls enterApp() (app.js) after login.
 */

/* ---- view switching ---- */
function go(view) {
  ['signin', 'signup', 'forgot'].forEach(v => show($('view-' + v), v === view));
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
document.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => go(b.dataset.go)));

/* ---- password visibility toggles ---- */
document.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
  const i = $(b.dataset.toggle), p = i.type === 'password';
  i.type = p ? 'text' : 'password';
  b.querySelector('span').textContent = p ? 'visibility_off' : 'visibility';
}));

/* ---- terms / privacy links on sign-up ---- */
document.querySelectorAll('[data-doc]').forEach(b => b.addEventListener('click', () => showDoc(b.dataset.doc, true)));

/* =====================  SIGN IN  ===================== */
function siAlert(type, msg) {
  const a = $('si-alert');
  a.style.display = 'flex';
  a.className = 'rounded-xl p-3 mb-4 items-start gap-2 text-xs font-medium ' + (type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-secondary-container');
  a.innerHTML = `<span class="ms text-lg shrink-0">${type === 'error' ? 'error_outline' : 'check_circle'}</span><div>${esc(msg)}</div>`;
}
const siHide = () => { $('si-alert').style.display = 'none'; };

function restoreRemember() {
  const r = store.get('cf_remember', null);
  if (r) { $('si-email').value = r; $('si-remember').checked = true; }
}
restoreRemember();

function vEmail(inp, err) { const ok = emailRx.test(inp.value.trim()); inp.classList.toggle('bad', !ok); show(err, !ok); return ok; }
function vPass() { const ok = $('si-pass').value.length >= 6; $('si-pass').classList.toggle('bad', !ok); show($('si-pass-err'), !ok); return ok; }
$('si-email').addEventListener('blur', () => vEmail($('si-email'), $('si-email-err')));
$('si-pass').addEventListener('blur', vPass);
$('si-email').addEventListener('input', () => { if (!$('si-email-err').classList.contains('hidden')) vEmail($('si-email'), $('si-email-err')); });
$('si-pass').addEventListener('input', () => { if (!$('si-pass-err').classList.contains('hidden')) vPass(); });

function signedIn(u) {
  if ($('si-remember').checked && u.email) store.set('cf_remember', u.email); else store.del('cf_remember');
  enterApp(u);
}

$('si-form').addEventListener('submit', async e => {
  e.preventDefault(); siHide();
  const a = vEmail($('si-email'), $('si-email-err')), b = vPass();
  if (!a || !b) { siAlert('error', 'Please resolve the highlighted fields to continue.'); return; }
  const email = $('si-email').value.trim().toLowerCase(), password = $('si-pass').value;

  $('si-submit').disabled = true; show($('si-spin')); $('si-text').textContent = 'Authenticating...';
  const r = await api.login({ email, password });
  $('si-submit').disabled = false; show($('si-spin'), false); $('si-text').textContent = 'Sign In';

  if (!r.ok) { siAlert('error', r.data.error || NET_ERR); return; }
  signedIn(r.data.user);
});

$('forgot-btn').addEventListener('click', () => {
  siHide(); go('forgot'); fpStep(1);
  $('fp-email').value = $('si-email').value.trim();
});

/* =====================  SIGN UP  ===================== */
const pw = $('su-pass'), cf = $('su-conf');

function syncTick() {
  show($('su-tick'), $('su-terms').checked);
  if ($('su-terms').checked) show($('su-terms-err'), false);
}
$('su-terms').addEventListener('change', syncTick);

function pwOk() {
  const l = pw.value.length >= 8, n = /[\d!@#$%^&*(),.?":{}|<>_\-+=~`\[\]\\\/;']/.test(pw.value);
  $('pill-len').classList.toggle('ok', l); $('pill-num').classList.toggle('ok', n);
  return l && n;
}
function matchChk() {
  const m = $('su-match');
  if (!cf.value) { m.classList.add('hidden'); m.classList.remove('flex'); show($('su-conf-err'), false); return false; }
  m.classList.remove('hidden'); m.classList.add('flex');
  const ok = pw.value === cf.value;
  m.style.color = ok ? '#553722' : '#ba1a1a';
  $('su-match-i').textContent = ok ? 'check_circle' : 'cancel';
  $('su-match-t').textContent = ok ? 'Passwords match' : 'Passwords do not match';
  if (ok) show($('su-conf-err'), false);
  return ok;
}
pw.addEventListener('input', () => { pwOk(); if (cf.value) matchChk(); if (pwOk()) show($('su-pass-err'), false); });
cf.addEventListener('input', matchChk);
$('su-sid').addEventListener('input', () => { show($('su-sid-err'), false); $('su-sid').classList.remove('bad'); });
$('su-name').addEventListener('input', () => { if ($('su-name').value.trim()) { show($('su-name-err'), false); $('su-name').classList.remove('bad'); } });
$('su-email').addEventListener('input', () => { if (emailRx.test($('su-email').value.trim())) { show($('su-email-err'), false); $('su-email').classList.remove('bad'); } });

$('su-form').addEventListener('submit', async e => {
  e.preventDefault();
  let bad = false;
  const name = $('su-name').value.trim(), email = $('su-email').value.trim().toLowerCase();

  if (!name) { show($('su-name-err')); $('su-name').classList.add('bad'); bad = true; } else show($('su-name-err'), false);
  if (!emailRx.test(email)) { $('su-email-err-t').textContent = 'Please enter a valid university or personal email.'; show($('su-email-err')); $('su-email').classList.add('bad'); bad = true; }
  else show($('su-email-err'), false);

  const sid = normId($('su-sid').value);
  if (!sid) { $('su-sid-err-t').textContent = 'Please enter your student ID.'; show($('su-sid-err')); $('su-sid').classList.add('bad'); bad = true; }
  else if (!SID_RX.test(sid)) { $('su-sid-err-t').textContent = 'Enter your ID in this format: SC200/0000/2024.'; show($('su-sid-err')); $('su-sid').classList.add('bad'); bad = true; }
  else { show($('su-sid-err'), false); $('su-sid').classList.remove('bad'); }

  if (!pwOk()) { show($('su-pass-err')); bad = true; } else show($('su-pass-err'), false);
  if (!cf.value || pw.value !== cf.value) { show($('su-conf-err')); bad = true; } else show($('su-conf-err'), false);
  if (!$('su-terms').checked) { show($('su-terms-err')); bad = true; } else show($('su-terms-err'), false);
  if (bad) return;

  const fail = (el, msgEl, msg, inp) => { msgEl.textContent = msg; show(el); if (inp) inp.classList.add('bad'); };
  const reset = () => { $('su-text').textContent = 'Create Account'; show($('su-spin'), false); $('su-submit').disabled = false; };

  $('su-text').textContent = 'Creating Account...'; show($('su-spin')); $('su-submit').disabled = true;
  const r = await api.register({ full_name: name, email, student_id: sid, password: pw.value });
  reset();

  if (!r.ok) {
    const msg = r.data.error || 'Sign up failed. Please try again.';
    switch (r.data.field) {
      case 'full_name':  fail($('su-name-err'), $('su-name-err').lastElementChild, msg, $('su-name')); break;
      case 'email':      fail($('su-email-err'), $('su-email-err-t'), msg, $('su-email')); break;
      case 'student_id': fail($('su-sid-err'), $('su-sid-err-t'), msg, $('su-sid')); break;
      case 'password':   fail($('su-pass-err'), $('su-pass-err').lastElementChild, msg); break;
      default:           fail($('su-terms-err'), $('su-terms-err').lastElementChild, msg);
    }
    return;
  }

  openModal(`${icon('task_alt')}<h3 class="text-xl font-semibold text-center">Welcome to CampusFind!</h3>
    <p class="text-sm text-on-surface-variant text-center mt-1 mb-5">Your account has been created. You can sign in now.</p>
    <button id="su-done" class="${btnCls}">Continue to Sign In</button>`);
  $('su-done').onclick = () => {
    closeModal(); $('su-form').reset(); syncTick();
    $('pill-len').classList.remove('ok'); $('pill-num').classList.remove('ok'); matchChk();
    go('signin'); $('si-email').value = email; $('si-pass').value = '';
    siAlert('success', 'Account created! Sign in with your new credentials.');
  };
});

/* =====================  FORGOT PASSWORD  ===================== */
let fpEmail = '', fpTimer = null;
const fpDigits = [...document.querySelectorAll('.otp')];

function fpAlert(type, msg) {
  const a = $('fp-alert');
  if (!msg) { a.style.display = 'none'; return; }
  a.style.display = 'flex';
  a.className = 'rounded-xl p-3 items-start gap-2 text-xs font-medium ' + (type === 'error' ? 'bg-error-container text-on-error-container' : 'bg-surface-container text-on-secondary-container');
  a.innerHTML = `<span class="ms text-lg shrink-0">${type === 'error' ? 'error_outline' : 'check_circle'}</span><div>${esc(msg)}</div>`;
}
function fpStep(n) {
  [1, 2, 3].forEach(i => show($('fp-step' + i), i === n));
  $('fp-badge').textContent = 'Step ' + n + ' of 3';
  fpAlert();
}
function fpStartTimer() {
  let t = 60; const b = $('fp-resend'); b.disabled = true; b.textContent = 'Resend in 60s'; clearInterval(fpTimer);
  fpTimer = setInterval(() => {
    t--;
    if (t <= 0) { clearInterval(fpTimer); b.disabled = false; b.textContent = 'Resend code'; }
    else b.textContent = 'Resend in ' + t + 's';
  }, 1000);
}

async function fpSend(isResend) {
  const email = isResend ? fpEmail : $('fp-email').value.trim().toLowerCase();
  if (!emailRx.test(email)) { $('fp-email').classList.add('bad'); show($('fp-email-err')); return; }
  $('fp-email').classList.remove('bad'); show($('fp-email-err'), false);

  const btn = isResend ? $('fp-resend') : $('fp-send'); btn.disabled = true;
  if (!isResend) { show($('fp-send-spin')); $('fp-send-text').textContent = 'Sending...'; }
  const r = await api.forgot(email);
  if (!isResend) { show($('fp-send-spin'), false); $('fp-send-text').textContent = 'Send Recovery Code'; }

  if (!r.ok) { btn.disabled = false; fpAlert('error', r.data.error || NET_ERR); return; }

  fpEmail = email; $('fp-sent-to').textContent = email;
  fpDigits.forEach(d => { d.value = ''; d.classList.remove('bad'); });
  show($('fp-code-err'), false);
  fpStep(2);
  if (isResend) fpAlert('success', 'A new code has been sent.');
  // Debug mode (backend/config/config.php): the server returns the code so you can test without a mail server.
  if (r.data.debug_code) fpAlert('success', 'DEBUG MODE - your code is ' + r.data.debug_code);
  fpStartTimer(); fpDigits[0].focus();
}
$('fp-step1').addEventListener('submit', e => { e.preventDefault(); fpSend(false); });
$('fp-email').addEventListener('input', () => { $('fp-email').classList.remove('bad'); show($('fp-email-err'), false); });
$('fp-resend').addEventListener('click', () => fpSend(true));
$('fp-change').addEventListener('click', () => { clearInterval(fpTimer); fpStep(1); $('fp-email').value = fpEmail; $('fp-email').focus(); });

async function fpVerify() {
  const code = fpDigits.map(d => d.value).join('');
  if (code.length < 6) { show($('fp-code-err')); fpDigits.forEach(d => { if (!d.value) d.classList.add('bad'); }); return; }
  show($('fp-code-err'), false);

  $('fp-verify').disabled = true; show($('fp-verify-spin')); $('fp-verify-text').textContent = 'Verifying...';
  const r = await api.verifyCode(fpEmail, code);
  $('fp-verify').disabled = false; show($('fp-verify-spin'), false); $('fp-verify-text').textContent = 'Verify Code';

  if (!r.ok) {
    fpAlert('error', r.data.error || NET_ERR);
    fpDigits.forEach(d => d.classList.add('bad'));
    return;
  }
  clearInterval(fpTimer);
  fpStep(3); $('fp-new').focus();
}
$('fp-verify').addEventListener('click', fpVerify);

fpDigits.forEach((d, i) => {
  d.addEventListener('input', () => {
    d.value = d.value.replace(/\D/g, '').slice(-1);
    fpDigits.forEach(x => x.classList.remove('bad')); show($('fp-code-err'), false);
    if (d.value && i < 5) fpDigits[i + 1].focus();
  });
  d.addEventListener('keydown', e => {
    if (e.key === 'Backspace' && !d.value && i > 0) fpDigits[i - 1].focus();
    else if (e.key === 'ArrowLeft' && i > 0) fpDigits[i - 1].focus();
    else if (e.key === 'ArrowRight' && i < 5) fpDigits[i + 1].focus();
    else if (e.key === 'Enter') { e.preventDefault(); fpVerify(); }
  });
  d.addEventListener('paste', e => {
    e.preventDefault();
    const t = ((e.clipboardData || window.clipboardData).getData('text') || '').replace(/\D/g, '').slice(0, 6);
    t.split('').forEach((c, j) => { fpDigits[j].value = c; });
    fpDigits[Math.min(t.length, 5)].focus();
  });
});

const fpNew = $('fp-new'), fpConf = $('fp-conf');
function fpPwOk() {
  const l = fpNew.value.length >= 8, n = /[\d\W_]/.test(fpNew.value);
  $('fp-pill-len').classList.toggle('ok', l); $('fp-pill-num').classList.toggle('ok', n);
  return l && n;
}
fpNew.addEventListener('input', () => { if (fpPwOk()) show($('fp-new-err'), false); });
fpConf.addEventListener('input', () => { if (fpConf.value === fpNew.value) show($('fp-conf-err'), false); });

$('fp-step3').addEventListener('submit', async e => {
  e.preventDefault();
  const ok = fpPwOk(), match = fpConf.value && fpConf.value === fpNew.value;
  show($('fp-new-err'), !ok); show($('fp-conf-err'), !match);
  if (!ok || !match) return;

  $('fp-update').disabled = true; show($('fp-update-spin')); $('fp-update-text').textContent = 'Updating...';
  const r = await api.resetPass(fpNew.value);
  $('fp-update').disabled = false; show($('fp-update-spin'), false); $('fp-update-text').textContent = 'Update Password';

  if (!r.ok) { fpAlert('error', r.data.error || 'Could not update your password. Please try again.'); return; }

  const em = fpEmail;
  fpNew.value = ''; fpConf.value = ''; fpPwOk();
  go('signin'); $('si-email').value = em; $('si-pass').value = '';
  siAlert('success', 'Password updated. Sign in with your new password.');
});
