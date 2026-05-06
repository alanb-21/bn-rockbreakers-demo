/* =====================================================================
   ADMIN DASHBOARD — standalone JS
   Wires up the dashboard.html shell. Calls backend-api endpoints.
   ===================================================================== */

// ── Auth gate ──────────────────────────────────────────────────────────
const TOKEN = sessionStorage.getItem('mtmnToken');
if (!TOKEN) window.location.href = 'login.html';
const USER = JSON.parse(sessionStorage.getItem('mtmnUser') || '{}');
document.getElementById('userEmail').textContent = USER.email || '';

// ── Attribute-safe HTML escape (use on every interpolated string) ─────
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"'`/=]/g, c => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;','`':'&#96;','/':'&#47;','=':'&#61;'
  })[c]);
}

// ── authFetch wrapper ─────────────────────────────────────────────────
async function authFetch(url, opts = {}) {
  const headers = Object.assign({}, opts.headers || {}, {
    'Authorization': 'Bearer ' + TOKEN,
  });
  if (opts.body && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  const r = await fetch(url, Object.assign({}, opts, { headers }));
  if (r.status === 401) {
    sessionStorage.clear();
    window.location.href = 'login.html';
    return null;
  }
  return r;
}

// ── Toast ─────────────────────────────────────────────────────────────
function showToast(msg, isError = false) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.toggle('is-error', isError);
  t.hidden = false;
  setTimeout(() => { t.hidden = true; }, 2400);
}

// ── Tab switching ─────────────────────────────────────────────────────
document.querySelectorAll('.dash-tab').forEach(t => {
  t.addEventListener('click', () => {
    document.querySelectorAll('.dash-tab').forEach(x => x.classList.remove('is-active'));
    t.classList.add('is-active');
    const name = t.dataset.tab;
    document.querySelectorAll('.dash-panel').forEach(p => {
      p.classList.toggle('is-active', p.dataset.panel === name);
    });
  });
});

// ── Logout ────────────────────────────────────────────────────────────
document.getElementById('logoutBtn').addEventListener('click', async () => {
  await authFetch('/api/auth/logout', { method: 'POST' });
  sessionStorage.clear();
  window.location.href = 'login.html';
});

// ── BOOKINGS ──────────────────────────────────────────────────────────
const STATUSES = ['pending', 'confirmed', 'completed', 'cancelled'];
let bookings = [];

async function loadBookings() {
  const r = await authFetch('/api/bookings');
  if (!r || !r.ok) return;
  const data = await r.json();
  bookings = data.bookings || [];
  document.getElementById('cntBookings').textContent = bookings.length;
  renderBookings();
}

function renderBookings() {
  const filter = document.getElementById('bkStatusFilter').value;
  const filtered = filter ? bookings.filter(b => b.status === filter) : bookings;
  const list = document.getElementById('bkList');
  if (!filtered.length) {
    list.innerHTML = '<div class="dash-empty">No bookings yet.</div>';
    return;
  }
  list.innerHTML = filtered.map(b => `
    <div class="dash-row" data-id="${esc(b.id)}">
      <div>
        <div class="dash-row-name">${esc(b.first_name)} ${esc(b.last_name)}</div>
        <div class="dash-row-sub">${esc(b.email)}</div>
      </div>
      <div>
        <div class="dash-row-meta">${esc(b.date)} · ${esc(b.time)}</div>
        <div class="dash-row-sub">${esc(b.service || '—')}</div>
      </div>
      <div><span class="status-pill status-${esc(b.status)}">${esc(b.status)}</span></div>
      <div class="dash-row-meta">${esc((b.created_at || '').slice(0, 10))}</div>
    </div>
  `).join('');
  list.querySelectorAll('.dash-row').forEach(row => {
    row.addEventListener('click', () => showBookingDetail(row.dataset.id));
  });
}

function showBookingDetail(id) {
  const b = bookings.find(x => x.id === id);
  if (!b) return;
  document.querySelectorAll('#bkList .dash-row').forEach(r => {
    r.classList.toggle('is-active', r.dataset.id === id);
  });
  const detail = document.getElementById('bkDetail');
  detail.hidden = false;
  detail.innerHTML = `
    <div class="dash-detail-head">
      <div>
        <div class="dash-detail-title">${esc(b.first_name)} ${esc(b.last_name)}</div>
        <div class="dash-detail-sub">${esc(b.date)} · ${esc(b.time)}</div>
      </div>
      <button class="dash-close" type="button">×</button>
    </div>
    <div class="dash-field"><label>Email</label><input data-f="email" value="${esc(b.email)}"></div>
    <div class="dash-field"><label>Phone</label><input data-f="phone" value="${esc(b.phone)}"></div>
    <div class="dash-field"><label>Service</label><input data-f="service" value="${esc(b.service)}"></div>
    <div class="dash-field"><label>Date</label><input data-f="date" type="date" value="${esc(b.date)}"></div>
    <div class="dash-field"><label>Time</label><input data-f="time" type="time" value="${esc(b.time)}"></div>
    <div class="dash-field"><label>Notes</label><textarea data-f="notes">${esc(b.notes)}</textarea></div>
    <div class="dash-field"><label>Status</label><select data-f="status">
      ${STATUSES.map(s => `<option value="${esc(s)}"${s === b.status ? ' selected' : ''}>${esc(s)}</option>`).join('')}
    </select></div>
    <div class="dash-field"><label>Staff note</label><textarea data-f="staffNote">${esc(b.staff_note)}</textarea></div>
    <div class="dash-detail-actions">
      <button class="btn-primary btn-sm" type="button" data-action="save">Save</button>
      <button class="btn-ghost btn-sm del-btn" type="button" data-action="delete">Delete</button>
    </div>
  `;
  detail.querySelector('.dash-close').addEventListener('click', () => { detail.hidden = true; });
  detail.querySelector('[data-action="save"]').addEventListener('click', () => saveBooking(id, detail));
  detail.querySelector('[data-action="delete"]').addEventListener('click', () => deleteBooking(id));
}

async function saveBooking(id, detail) {
  const payload = {};
  detail.querySelectorAll('[data-f]').forEach(el => { payload[el.dataset.f] = el.value; });
  const r = await authFetch(`/api/bookings/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  if (r && r.ok) { showToast('Saved'); loadBookings(); } else { showToast('Save failed', true); }
}
async function deleteBooking(id) {
  if (!confirm('Delete this booking?')) return;
  const r = await authFetch(`/api/bookings/${id}`, { method: 'DELETE' });
  if (r && r.ok) { showToast('Deleted'); document.getElementById('bkDetail').hidden = true; loadBookings(); }
}
document.getElementById('bkStatusFilter').addEventListener('change', renderBookings);

// ── USERS ─────────────────────────────────────────────────────────────
let users = [];

async function loadUsers() {
  const r = await authFetch('/api/users');
  if (!r || !r.ok) return;
  const data = await r.json();
  users = data.users || [];
  document.getElementById('cntUsers').textContent = users.length;
  renderUsers();
}

function renderUsers() {
  const list = document.getElementById('userList');
  if (!users.length) { list.innerHTML = '<div class="dash-empty">No staff yet.</div>'; return; }
  list.innerHTML = users.map(u => `
    <div class="dash-row" data-id="${esc(u.id)}">
      <div>
        <div class="dash-row-name">${esc(u.first_name || '')} ${esc(u.last_name || '')}</div>
        <div class="dash-row-sub">${esc(u.email)}</div>
      </div>
      <div class="dash-row-meta">${esc(u.role)}</div>
      <div class="dash-row-meta">${u.active ? 'active' : 'disabled'}</div>
      <div class="dash-row-meta">${esc((u.created_at || '').slice(0, 10))}</div>
    </div>
  `).join('');
  list.querySelectorAll('.dash-row').forEach(row => {
    row.addEventListener('click', () => showUserDetail(row.dataset.id));
  });
}

function showUserDetail(id) {
  const u = users.find(x => x.id === id);
  if (!u) return;
  document.querySelectorAll('#userList .dash-row').forEach(r => {
    r.classList.toggle('is-active', r.dataset.id === id);
  });
  const detail = document.getElementById('userDetail');
  detail.hidden = false;
  const isSelf = u.id === USER.id;
  detail.innerHTML = `
    <div class="dash-detail-head">
      <div><div class="dash-detail-title">${esc(u.email)}</div><div class="dash-detail-sub">${esc(u.role)}</div></div>
      <button class="dash-close" type="button">×</button>
    </div>
    <div class="dash-field"><label>First name</label><input data-f="firstName" value="${esc(u.first_name)}"></div>
    <div class="dash-field"><label>Last name</label><input data-f="lastName" value="${esc(u.last_name)}"></div>
    <div class="dash-field"><label>Email</label><input data-f="email" type="email" value="${esc(u.email)}"></div>
    <div class="dash-field"><label>Role</label><select data-f="role">
      <option value="staff"${u.role === 'staff' ? ' selected' : ''}>staff</option>
      <option value="admin"${u.role === 'admin' ? ' selected' : ''}>admin</option>
    </select></div>
    <div class="dash-field"><label>Active</label><select data-f="active">
      <option value="1"${u.active ? ' selected' : ''}>yes</option>
      <option value="0"${!u.active ? ' selected' : ''}>no</option>
    </select></div>
    <div class="dash-field"><label>New password (optional)</label><input data-f="password" type="password" autocomplete="new-password"></div>
    <div class="dash-detail-actions">
      <button class="btn-primary btn-sm" type="button" data-action="save">Save</button>
      ${isSelf ? '<button class="btn-ghost btn-sm" type="button" data-action="logoutall">Sign out everywhere</button>' : ''}
      ${!isSelf ? '<button class="btn-ghost btn-sm del-btn" type="button" data-action="delete">Delete</button>' : ''}
    </div>
  `;
  detail.querySelector('.dash-close').addEventListener('click', () => { detail.hidden = true; });
  detail.querySelector('[data-action="save"]').addEventListener('click', () => saveUser(id, detail));
  const delBtn = detail.querySelector('[data-action="delete"]');
  if (delBtn) delBtn.addEventListener('click', () => deleteUser(id));
  const loBtn = detail.querySelector('[data-action="logoutall"]');
  if (loBtn) loBtn.addEventListener('click', logoutAll);
}

async function saveUser(id, detail) {
  const payload = {};
  detail.querySelectorAll('[data-f]').forEach(el => {
    if (el.dataset.f === 'password' && !el.value) return;
    if (el.dataset.f === 'active') payload.active = el.value === '1';
    else payload[el.dataset.f] = el.value;
  });
  const r = await authFetch(`/api/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  if (r && r.ok) { showToast('Saved'); loadUsers(); } else { showToast('Save failed', true); }
}
async function deleteUser(id) {
  if (!confirm('Delete this staff account?')) return;
  const r = await authFetch(`/api/users/${id}`, { method: 'DELETE' });
  if (r && r.ok) { showToast('Deleted'); document.getElementById('userDetail').hidden = true; loadUsers(); }
}
async function logoutAll() {
  if (!confirm('Sign out of every device for this account?')) return;
  const r = await authFetch('/api/auth/logout-all', { method: 'POST' });
  if (r && r.ok) { sessionStorage.clear(); window.location.href = 'login.html'; }
}

document.getElementById('newUserBtn').addEventListener('click', async () => {
  const email = prompt('Email for new staff?');
  if (!email) return;
  const password = prompt('Initial password?');
  if (!password) return;
  const r = await authFetch('/api/users', { method: 'POST', body: JSON.stringify({ email, password, role: 'staff' }) });
  if (r && r.ok) { showToast('Staff added'); loadUsers(); } else { showToast('Add failed', true); }
});

// ── Boot ──────────────────────────────────────────────────────────────
loadBookings();
loadUsers();
// loadMessages(); // wire when /api/contact-messages list endpoint is added
document.getElementById('cntMessages').textContent = '0';
