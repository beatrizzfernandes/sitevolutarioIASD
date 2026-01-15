// eventos.js

const ADMIN_TOKEN = localStorage.getItem('admin_token');

if (!ADMIN_TOKEN) {
    window.location.href = '/admin-login.html';
}


const form = document.getElementById('event-form');
const listEl = document.getElementById('event-list');
const submitBtn = document.getElementById('submit-btn');
const cancelBtn = document.getElementById('cancel-edit');

let editingId = null; // null = criando, número = editando

async function carregarEventos() {
    try {
        const resp = await fetch('/api/events');
        const eventos = await resp.json();

        listEl.innerHTML = '';

        if (!eventos.length) {
            listEl.innerHTML = '<li class="muted">Nenhum evento cadastrado.</li>';
            return;
        }

        for (const ev of eventos) {
            const li = document.createElement('li');

            const texto = document.createElement('span');
            texto.textContent =
                `${ev.id} - ${ev.titulo} (${ev.data_inicio}` +
                `${ev.data_fim ? ' até ' + ev.data_fim : ''}) - ${ev.local}`;

            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.style.marginLeft = '8px';
            btnEditar.onclick = () => iniciarEdicao(ev);

            const btnExcluir = document.createElement('button');
            btnExcluir.textContent = 'Excluir';
            btnExcluir.style.marginLeft = '4px';
            btnExcluir.onclick = () => excluirEvento(ev.id);

            li.appendChild(texto);
            li.appendChild(btnEditar);
            li.appendChild(btnExcluir);

            listEl.appendChild(li);
        }
    } catch (err) {
        console.error(err);
        listEl.innerHTML = '<li class="muted">Erro ao carregar eventos.</li>';
    }
}

function iniciarEdicao(ev) {
    editingId = ev.id;

    document.getElementById('event-id').value = ev.id;
    form.titulo.value = ev.titulo;
    form.data_inicio.value = ev.data_inicio;
    form.data_fim.value = ev.data_fim || '';
    form.horario.value = ev.horario || '';
    form.local.value = ev.local;
    form.descricao.value = ev.descricao || '';

    submitBtn.textContent = 'Atualizar evento';
    cancelBtn.style.display = 'inline-block';

    // Só pra garantir que o usuário veja o formulário
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function limparFormulario() {
    form.reset();
    document.getElementById('event-id').value = '';
    editingId = null;
    submitBtn.textContent = 'Salvar evento';
    cancelBtn.style.display = 'none';
}

async function excluirEvento(id) {
    const confirmar = window.confirm('Tem certeza que deseja excluir este evento?');
    if (!confirmar) return;

    try {
        const resp = await fetch(`/api/events/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            }
        });

        if (!resp.ok) {
            const body = await resp.json().catch(() => ({}));
            alert('Erro ao excluir evento: ' + (body.error || resp.status));
            return;
        }

        carregarEventos();
    } catch (err) {
        console.error(err);
        alert('Erro de rede ao excluir evento.');
    }
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        titulo: form.titulo.value,
        data_inicio: form.data_inicio.value,
        data_fim: form.data_fim.value || null,
        horario: form.horario.value || null,
        local: form.local.value,
        descricao: form.descricao.value || null
    };

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/events/${editingId}` : '/api/events';

    try {
        const resp = await fetch(url, {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_TOKEN}`
            },
            body: JSON.stringify(data)
        });

        if (!resp.ok) {
            const body = await resp.json().catch(() => ({}));
            alert('Erro ao salvar evento: ' + (body.error || resp.status));
            return;
        }

        alert(editingId ? 'Evento atualizado com sucesso!' : 'Evento criado com sucesso!');

        limparFormulario();
        carregarEventos();
    } catch (err) {
        console.error(err);
        alert('Erro de rede ao salvar evento.');
    }
});

cancelBtn.addEventListener('click', () => {
    limparFormulario();
});

// carrega lista ao abrir página
carregarEventos();
