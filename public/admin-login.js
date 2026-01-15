// public/admin-login.js

const form = document.getElementById('login-form');
const msgEl = document.getElementById('login-msg');

// Mostra mensagem vinda da URL (?msg=...)
const params = new URLSearchParams(window.location.search);
const urlMsg = params.get('msg');
if (msgEl && urlMsg) msgEl.textContent = urlMsg;

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msgEl) msgEl.textContent = '';

    const usuario = document.getElementById('usuario').value;
    const senha = document.getElementById('senha').value;

    try {
        const resp = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },

            // ESSENCIAL para cookies HttpOnly
            credentials: 'include',

            body: JSON.stringify({ usuario, senha }),
        });

        const body = await resp.json().catch(() => ({}));

        if (!resp.ok) {
            if (msgEl) msgEl.textContent = body.error || 'Erro no login';
            return;
        }

        // ✅ NÃO salva token
        // ✅ Cookie já foi salvo pelo backend
        window.location.href = '/admin.html';

    } catch (err) {
        console.error(err);
        if (msgEl) msgEl.textContent = 'Erro de rede ao tentar login.';
    }
});
