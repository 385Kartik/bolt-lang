export async function boltFetch(url, options = {}) {
  const saved = localStorage.getItem('bolt_user');
  const user = saved ? JSON.parse(saved) : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (user && (user.token || user.jwt || user.access_token)) {
    headers.Authorization = `Bearer ${user.token || user.jwt || user.access_token}`;
  }

  return fetch(url, { ...options, headers });
}