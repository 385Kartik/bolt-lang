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

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    // a failed request (404, 500 ...) is an error, not data: the page's error block runs
    let message = 'Request failed (' + res.status + ')';
    try {
      const body = await res.clone().json();
      message = body.error || body.message || message;
    } catch { /* the answer was not JSON */ }
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }
  return res;
}