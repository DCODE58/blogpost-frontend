if (localStorage.getItem('admin_token')) {
  window.location.href = 'dashboard.html';
}

const form   = document.getElementById('login-form');
const btn    = document.getElementById('login-btn');
const errBox = document.getElementById('login-error');

function setLoading(v) {
  btn.classList.toggle('loading', v);
  btn.disabled = v;
}

function showFieldError(fieldId, errId, msg) {
  const field = document.getElementById(fieldId);
  const err   = document.getElementById(errId);
  if (msg) {
    field.style.borderColor = 'var(--danger)';
    err.classList.add('show');
    err.textContent = msg;
  } else {
    field.style.borderColor = '';
    err.classList.remove('show');
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  let valid = true;
  if (!username) { showFieldError('username', 'username-err', 'Required'); valid = false; }
  else showFieldError('username', 'username-err', '');
  if (!password) { showFieldError('password', 'password-err', 'Required'); valid = false; }
  else showFieldError('password', 'password-err', '');
  if (!valid) return;

  errBox.style.display = 'none';
  setLoading(true);

  try {
    const res  = await fetch(`${window.API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      errBox.textContent  = data.error || 'Invalid credentials.';
      errBox.style.display = 'block';
      return;
    }

    localStorage.setItem('admin_token', data.token);
    localStorage.setItem('admin_username', data.username);
    window.location.href = 'dashboard.html';
  } catch {
    errBox.textContent  = 'Cannot connect to server. Is the backend running?';
    errBox.style.display = 'block';
  } finally {
    setLoading(false);
  }
});
