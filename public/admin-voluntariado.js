// admin-voluntariado.js

const token = localStorage.getItem('admin_token');
if (!token || isTokenExpired(token)) {
    localStorage.removeItem('admin_token');
    window.location.href = '/admin-login.html?msg=' + encodeURIComponent('Faça login para continuar.');
}

const formV = document.getElementById('vol-role-form');
const listV = document.getElementById('vol-role-list');
const submitV = document.getElementById('vol-submit-btn');
const cancelV = document.getElementById('vol-cancel-edit');

let editingRoleId = null;

async function carregarVagas() {
    try {
        const resp = await fetch('/api/volunteers');
        const vagas = await resp.json();

        listV.innerHTML = '';

        if (!vagas.length) {
            listV.innerHTML = '<li class="muted">Nenhuma vaga cadastrada.</li>';
            return;
        }

        for (const v of vagas) {
            const li = document.createElement('li');

            const texto = document.createElement('span');
            texto.textContent = `${v.id} - ${v.titulo} (${v.igreja}) - ${v.email_destino}`;

            const btnEditar = document.createElement('button');
            btnEditar.textContent = 'Editar';
            btnEditar.style.marginLeft = '8px';
            btnEditar.onclick = () => iniciarEdicaoVaga(v);

            const btnExcluir = document.createElement('button');
            btnExcluir.textContent = 'Excluir';
            btnExcluir.style.marginLeft = '4px';
            btnExcluir.onclick = () => excluirVaga(v.id);

            li.appendChild(texto);
            li.appendChild(btnEditar);
            li.appendChild(btnExcluir);

            listV.appendChild(li);
        }
    } catch (err) {
        console.error(err);
        listV.innerHTML = '<li class="muted">Erro ao carregar vagas.</li>';
    }
}

function iniciarEdicaoVaga(v) {
    editingRoleId = v.id;

    formV.titulo.value = v.titulo;
    formV.igreja.value = v.igreja;
    formV.email_destino.value = v.email_destino;
    formV.descricao.value = v.descricao || '';

    submitV.textContent = 'Atualizar vaga';
    cancelV.style.display = 'inline-block';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function limparFormularioVaga() {
    formV.reset();
    editingRoleId = null;
    submitV.textContent = 'Salvar vaga';
    cancelV.style.display = 'none';
}

async function excluirVaga(id) {
    const confirmar = window.confirm('Tem certeza que deseja excluir esta vaga?');
    if (!confirmar) return;

    try {
        const resp = await fetch(`/api/volunteers/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${ADMIN_TOKEN}`,
            },
        });

        if (!resp.ok) {
            const body = await resp.json().catch(() => ({}));
            alert('Erro ao excluir vaga: ' + (body.error || resp.status));
            return;
        }

        carregarVagas();
    } catch (err) {
        console.error(err);
        alert('Erro de rede ao excluir vaga.');
    }
}

formV.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = {
        titulo: formV.titulo.value,
        igreja: formV.igreja.value,
        email_destino: formV.email_destino.value,
        descricao: formV.descricao.value || null,
    };

    const method = editingRoleId ? 'PUT' : 'POST';
    const url = editingRoleId ? `/api/volunteers/${editingRoleId}` : '/api/volunteers';

    try {
        const resp = await fetch('/api/volunteers', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ADMIN_TOKEN}`,
            },
            body: JSON.stringify(data),
        });

        if (!resp.ok) {
            const body = await resp.json().catch(() => ({}));
            alert('Erro ao salvar vaga: ' + (body.error || resp.status));
            return;
        }

        alert(editingRoleId ? 'Vaga atualizada com sucesso!' : 'Vaga criada com sucesso!');
        limparFormularioVaga();
        carregarVagas();
    } catch (err) {
        console.error(err);
        alert('Erro de rede ao salvar vaga.');
    }
});

cancelV.addEventListener('click', limparFormularioVaga);

carregarVagas();
