// public/admin.js

const statusEl = document.getElementById('admin-status');
const btnSair = document.getElementById('btn-sair');

// Redireciona pro login com msg
function goToLogin(reason = '') {
    const url = reason
        ? `/admin-login.html?msg=${encodeURIComponent(reason)}`
        : '/admin-login.html';
    window.location.href = url;
}

// fetch padronizado: usa cookie HttpOnly (credentials) e se der 401/403, manda pro login
async function apiFetch(url, options = {}) {
    const resp = await fetch(url, {
        ...options,
        credentials: 'include', // 🔥 ESSENCIAL pro cookie ir junto
        headers: {
            ...(options.headers || {}),
        },
    });

    if (resp.status === 401 || resp.status === 403) {
        goToLogin('Sessão expirada. Faça login novamente.');
    }

    return resp;
}

// Logout real (limpa cookie no backend)
btnSair?.addEventListener('click', async () => {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
    } catch (e) {
        // se falhar, só redireciona mesmo assim
    }
    goToLogin('');
});

// ------- ABAS -------
const tabs = document.querySelectorAll('.tab[data-tab]');
const panels = {
    eventos: document.getElementById('panel-eventos'),
    voluntariado: document.getElementById('panel-voluntariado'),
    inscricoes: document.getElementById('panel-inscricoes'),
};

tabs.forEach((t) => {
    t.addEventListener('click', () => {
        tabs.forEach((x) => x.classList.remove('active'));
        t.classList.add('active');

        Object.values(panels).forEach((p) => p.classList.remove('active'));
        const tab = t.getAttribute('data-tab');
        panels[tab].classList.add('active');

        // carrega inscrições quando abrir a aba (pra não ficar "vazio" se abriu eventos primeiro)
        if (tab === 'inscricoes') loadApps();
    });
});

// ------- EVENTOS (CRUD) -------
const eventsForm = document.getElementById('events-form');
const eventsList = document.getElementById('events-list');
const eventCancel = document.getElementById('event-cancel');
const eventSubmit = document.getElementById('event-submit');

let editingEventId = null;

async function loadEvents() {
    try {
        const resp = await apiFetch('/api/events');
        const items = await resp.json();
        eventsList.innerHTML = '';

        if (!items.length) {
            eventsList.innerHTML = '<li class="muted">Nenhum evento cadastrado.</li>';
            return;
        }

        for (const ev of items) {
            const li = document.createElement('li');
            li.innerHTML = `
        <div><strong>${ev.titulo}</strong></div>
        <div class="muted">${ev.data_inicio}${ev.data_fim ? ' - ' + ev.data_fim : ''}${ev.horario ? ' · ' + ev.horario : ''}</div>
        <div class="muted">Local: ${ev.local}</div>
        ${ev.descricao ? `<div class="muted" style="margin-top:8px;">${ev.descricao}</div>` : ''}
      `;

            const actions = document.createElement('div');
            actions.className = 'row-actions';

            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn-small';
            btnEdit.textContent = 'Editar';
            btnEdit.onclick = () => startEditEvent(ev);

            const btnDel = document.createElement('button');
            btnDel.className = 'btn-small btn-danger';
            btnDel.textContent = 'Excluir';
            btnDel.onclick = () => deleteEvent(ev.id);

            actions.appendChild(btnEdit);
            actions.appendChild(btnDel);
            li.appendChild(actions);

            eventsList.appendChild(li);
        }
    } catch (e) {
        console.error(e);
        eventsList.innerHTML = '<li class="muted">Erro ao carregar eventos.</li>';
    }
}

function startEditEvent(ev) {
    editingEventId = ev.id;

    document.getElementById('event-id').value = ev.id;
    document.getElementById('event-titulo').value = ev.titulo;
    document.getElementById('event-data-inicio').value = ev.data_inicio;
    document.getElementById('event-data-fim').value = ev.data_fim || '';
    document.getElementById('event-horario').value = ev.horario || '';
    document.getElementById('event-local').value = ev.local;
    document.getElementById('event-descricao').value = ev.descricao || '';

    eventSubmit.textContent = 'Atualizar evento';
    eventCancel.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearEventForm() {
    editingEventId = null;
    eventsForm.reset();
    document.getElementById('event-id').value = '';
    eventSubmit.textContent = 'Salvar evento';
    eventCancel.style.display = 'none';
}

eventCancel?.addEventListener('click', clearEventForm);

eventsForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        titulo: document.getElementById('event-titulo').value,
        data_inicio: document.getElementById('event-data-inicio').value,
        data_fim: document.getElementById('event-data-fim').value || null,
        horario: document.getElementById('event-horario').value || null,
        local: document.getElementById('event-local').value,
        descricao: document.getElementById('event-descricao').value || null,
    };

    const url = editingEventId ? `/api/events/${editingEventId}` : '/api/events';
    const method = editingEventId ? 'PUT' : 'POST';

    const resp = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const body = await resp.json().catch(() => ({}));

    if (!resp.ok) {
        alert('Erro ao salvar evento: ' + (body.error || resp.status));
        return;
    }

    clearEventForm();
    loadEvents();
});

async function deleteEvent(id) {
    if (!confirm('Excluir este evento?')) return;

    const resp = await apiFetch(`/api/events/${id}`, { method: 'DELETE' });
    const body = await resp.json().catch(() => ({}));

    if (!resp.ok) {
        alert('Erro ao excluir evento: ' + (body.error || resp.status));
        return;
    }

    loadEvents();
}

// ------- VOLUNTARIADO (CRUD) -------
const volForm = document.getElementById('vol-form');
const volList = document.getElementById('vol-list');
const volCancel = document.getElementById('vol-cancel');
const volSubmit = document.getElementById('vol-submit');

let editingVolId = null;

async function loadVols() {
    try {
        const resp = await apiFetch('/api/volunteers');
        const items = await resp.json();
        volList.innerHTML = '';

        if (!items.length) {
            volList.innerHTML = '<li class="muted">Nenhuma vaga cadastrada.</li>';
            return;
        }

        for (const v of items) {
            const li = document.createElement('li');
            li.innerHTML = `
        <div><strong>${v.titulo}</strong></div>
        <div class="muted">${v.igreja}</div>
        <div class="muted">${v.email_destino}</div>
        ${v.descricao ? `<div class="muted" style="margin-top:8px;">${v.descricao}</div>` : ''}
      `;

            const actions = document.createElement('div');
            actions.className = 'row-actions';

            const btnEdit = document.createElement('button');
            btnEdit.className = 'btn-small';
            btnEdit.textContent = 'Editar';
            btnEdit.onclick = () => startEditVol(v);

            const btnDel = document.createElement('button');
            btnDel.className = 'btn-small btn-danger';
            btnDel.textContent = 'Excluir';
            btnDel.onclick = () => deleteVol(v.id);

            actions.appendChild(btnEdit);
            actions.appendChild(btnDel);
            li.appendChild(actions);

            volList.appendChild(li);
        }
    } catch (e) {
        console.error(e);
        volList.innerHTML = '<li class="muted">Erro ao carregar vagas.</li>';
    }
}

function startEditVol(v) {
    editingVolId = v.id;

    document.getElementById('vol-id').value = v.id;
    document.getElementById('vol-titulo').value = v.titulo;
    document.getElementById('vol-igreja').value = v.igreja;
    document.getElementById('vol-email-destino').value = v.email_destino;
    document.getElementById('vol-descricao').value = v.descricao || '';

    volSubmit.textContent = 'Atualizar vaga';
    volCancel.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function clearVolForm() {
    editingVolId = null;
    volForm.reset();
    document.getElementById('vol-id').value = '';
    volSubmit.textContent = 'Salvar vaga';
    volCancel.style.display = 'none';
}

volCancel?.addEventListener('click', clearVolForm);

volForm?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        titulo: document.getElementById('vol-titulo').value,
        igreja: document.getElementById('vol-igreja').value,
        email_destino: document.getElementById('vol-email-destino').value,
        descricao: document.getElementById('vol-descricao').value || null,
    };

    const url = editingVolId ? `/api/volunteers/${editingVolId}` : '/api/volunteers';
    const method = editingVolId ? 'PUT' : 'POST';

    const resp = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });

    const body = await resp.json().catch(() => ({}));

    if (!resp.ok) {
        alert('Erro ao salvar vaga: ' + (body.error || resp.status));
        return;
    }

    clearVolForm();
    loadVols();
});

async function deleteVol(id) {
    if (!confirm('Excluir esta vaga?')) return;

    const resp = await apiFetch(`/api/volunteers/${id}`, { method: 'DELETE' });
    const body = await resp.json().catch(() => ({}));

    if (!resp.ok) {
        alert('Erro ao excluir vaga: ' + (body.error || resp.status));
        return;
    }

    loadVols();
}

// ------- INSCRIÇÕES (LISTAR) -------
const appsList = document.getElementById('apps-list');

async function loadApps() {
    if (!appsList) return;

    try {
        const resp = await apiFetch('/api/applications');
        const body = await resp.json().catch(() => ([]));

        if (!resp.ok) {
            appsList.innerHTML = '<li class="muted">Erro ao carregar inscrições.</li>';
            return;
        }

        appsList.innerHTML = '';

        if (!body.length) {
            appsList.innerHTML = '<li class="muted">Nenhuma inscrição recebida.</li>';
            return;
        }

        for (const a of body) {
            const li = document.createElement('li');
            li.innerHTML = `
        <div><strong>${a.nome}</strong> <span class="muted">(${a.email})</span></div>
        <div class="muted">Telefone: ${a.telefone || '(não informado)'}</div>
        <div class="muted">Vaga: ${a.vaga_titulo} - ${a.vaga_igreja}</div>
        ${a.mensagem ? `<div class="muted" style="margin-top:8px;">Mensagem: ${a.mensagem}</div>` : ''}
        <div class="muted" style="margin-top:8px;">Recebido em: ${a.created_at}</div>
      `;
            appsList.appendChild(li);
        }
    } catch (e) {
        console.error(e);
        appsList.innerHTML = '<li class="muted">Erro ao carregar inscrições.</li>';
    }
}

// ------- INIT -------
statusEl.textContent = 'Sessão ativa.';
loadEvents();
loadVols();
loadApps();
