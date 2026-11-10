/**
 * CampusFind - API client.
 * Talks to the PHP backend with fetch(). Session cookies are sent automatically.
 *
 * API_BASE is the URL path to the backend/api folder.
 *  - Default (XAMPP, project in htdocs/campusfind):  /campusfind/backend/api
 *  - If you use the PHP built-in server (see README), it is /api
 */
const API_BASE = (window.CF_API_BASE) ||
  (location.port === '8000' ? '/api' : '/campusfind/backend/api');

const NET_ERR = 'Could not reach the server. Check your internet connection and try again.';

/** Low-level request. Always resolves to { ok, status, data } and never throws. */
async function request(path, method = 'GET', body) {
  try {
    const res = await fetch(`${API_BASE}/${path}`, {
      method,
      credentials: 'same-origin',
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try { data = await res.json(); } catch (e) { /* non-JSON response */ }
    if (!data) return { ok: false, status: res.status, data: { error: NET_ERR } };
    return { ok: res.ok && data.ok !== false, status: res.status, data };
  } catch (e) {
    return { ok: false, status: 0, data: { error: NET_ERR, network: true } };
  }
}

const api = {
  // ---- auth ----
  me:         ()      => request('auth/me.php'),
  register:   (b)     => request('auth/register.php', 'POST', b),
  login:      (b)     => request('auth/login.php', 'POST', b),
  logout:     ()      => request('auth/logout.php', 'POST', {}),
  forgot:     (email) => request('auth/forgot.php', 'POST', { email }),
  verifyCode: (email, code) => request('auth/verify_code.php', 'POST', { email, code }),
  resetPass:  (password)    => request('auth/reset.php', 'POST', { password }),

  // ---- items ----
  listItems:  ()      => request('items/list.php'),
  createItem: (b)     => request('items/create.php', 'POST', b),
  toggleItem: (id)    => request('items/update_status.php', 'POST', { id }),
  deleteItem: (id)    => request('items/delete.php', 'POST', { id }),
};
