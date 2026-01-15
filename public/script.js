// ------- EVENTOS -------
async function carregarEventos() {
    const container = document.getElementById('events-container');
    if (!container) return;

    try {
        const resp = await fetch('/api/events');
        const eventos = await resp.json();

        container.innerHTML = '';

        if (!eventos.length) {
            container.innerHTML = '<p class="muted">Nenhum evento cadastrado.</p>';
            return;
        }

        for (const ev of eventos) {
            const card = document.createElement('article');
            card.className = 'card';

            const h3 = document.createElement('h3');
            h3.textContent = ev.titulo;

            const pData = document.createElement('p');
            pData.className = 'muted';
            pData.textContent = montarLinhaData(ev);

            const pLocal = document.createElement('p');
            pLocal.className = 'muted';
            pLocal.textContent = `Local: ${ev.local}`;

            // --- ÁREA DA DESCRIÇÃO (INICIALMENTE OCULTA) ---
            const descricaoWrapper = document.createElement('div');
            descricaoWrapper.className = 'descricao-wrapper';
            descricaoWrapper.style.display = 'none';

            const descricaoText = document.createElement('p');
            descricaoText.textContent = ev.descricao || 'Nenhuma descrição disponível.';
            descricaoWrapper.appendChild(descricaoText);

            // --- BOTÃO VER MAIS / VER MENOS ---
            const toggleBtn = document.createElement('button');
            toggleBtn.className = 'btn-desc';
            toggleBtn.textContent = 'Ver descrição';

            toggleBtn.onclick = () => {
                const isHidden = descricaoWrapper.style.display === 'none';

                descricaoWrapper.style.display = isHidden ? 'block' : 'none';
                toggleBtn.textContent = isHidden ? 'Ocultar descrição' : 'Ver descrição';
            };

            // montar card
            card.appendChild(h3);
            card.appendChild(pData);
            card.appendChild(pLocal);
            card.appendChild(toggleBtn);
            card.appendChild(descricaoWrapper);

            container.appendChild(card);
        }
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p class="muted">Erro ao carregar eventos.</p>';
    }
}

function formatarDataBR(dataStr) {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}

function montarLinhaData(ev) {
    const inicio = formatarDataBR(ev.data_inicio);
    const fim = ev.data_fim ? formatarDataBR(ev.data_fim) : null;

    let texto = inicio;
    if (fim) texto += ` - ${fim}`;
    if (ev.horario) texto += ` · A partir das ${ev.horario}`;

    return texto;
}

// ------- VOLUNTARIADO -------
const volContainer = document.getElementById('volunteers-container');
const volFormWrapper = document.getElementById('volunteer-form-wrapper');
const volForm = document.getElementById('volunteer-form');

const volRoleIdInput = document.getElementById('vol-role-id');
const volRoleNameInput = document.getElementById('vol-role-name');

const btnCancel = document.getElementById('vol-cancel');

async function carregarVagasVoluntariado() {
    if (!volContainer) return;

    try {
        const resp = await fetch('/api/volunteers');
        const vagas = await resp.json();

        volContainer.innerHTML = '';

        if (!vagas.length) {
            volContainer.innerHTML = '<p class="muted">Nenhuma vaga de voluntariado disponível no momento.</p>';
            return;
        }

        for (const v of vagas) {
            const card = document.createElement('article');
            card.className = 'card';

            const titulo = document.createElement('strong');
            titulo.textContent = v.titulo;

            const desc = document.createElement('p');
            desc.className = 'muted';
            desc.textContent = v.descricao || 'Descrição não informada.';

            const igreja = document.createElement('p');
            igreja.className = 'muted';
            igreja.textContent = v.igreja;

            const btn = document.createElement('button');
            btn.className = 'btn';
            btn.type = 'button';
            btn.textContent = 'Inscreva-se';

            btn.onclick = () => {
                volRoleIdInput.value = v.id;
                volRoleNameInput.value = `${v.titulo} - ${v.igreja}`;

                // mostra o formulário só agora
                volFormWrapper.style.display = 'block';

                // rola até o formulário
                volFormWrapper.scrollIntoView({ behavior: 'smooth' });
            };

            card.appendChild(titulo);
            card.appendChild(desc);
            card.appendChild(igreja);
            card.appendChild(btn);

            volContainer.appendChild(card);
        }
    } catch (err) {
        console.error(err);
        volContainer.innerHTML = '<p class="muted">Erro ao carregar vagas de voluntariado.</p>';
    }
}

if (btnCancel) {
    btnCancel.addEventListener('click', () => {
        if (volForm) volForm.reset();
        volRoleIdInput.value = '';
        volRoleNameInput.value = '';
        volFormWrapper.style.display = 'none';
    });
}

if (volForm) {
    volForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const roleId = volRoleIdInput.value;
        if (!roleId) {
            alert('Escolha uma vaga clicando em "Inscreva-se" em um dos cards.');
            return;
        }

        const data = {
            nome: document.getElementById('vol-nome').value,
            telefone: document.getElementById('vol-telefone').value,
            email: document.getElementById('vol-email').value,
            mensagem: document.getElementById('vol-msg').value,
        };

        try {
            const resp = await fetch(`/api/volunteers/${roleId}/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const body = await resp.json().catch(() => ({}));

            if (!resp.ok) {
                alert('Erro ao enviar inscrição: ' + (body.error || resp.status));
                return;
            }

            alert('Inscrição enviada com sucesso!');

            volForm.reset();
            volRoleIdInput.value = '';
            volRoleNameInput.value = '';
            volFormWrapper.style.display = 'none';
        } catch (err) {
            console.error(err);
            alert('Erro de rede ao enviar inscrição.');
        }
    });
}



//Inicialização

document.addEventListener('DOMContentLoaded', () => {
    carregarEventos();
    carregarVagasVoluntariado();
});

//Menu (Controle de login)
// ------- MENU (CONTROLE DE LOGIN) -------

(function controlarMenuAdmin() {
    const loginLink = document.getElementById('login-link');
    const adminLink = document.getElementById('admin-link');
    const logoutLink = document.getElementById('logout-link');

    if (!loginLink || !adminLink || !logoutLink) return;

    let token = localStorage.getItem('admin_token');

    // Se existir token, mas estiver expirado => remove e trata como deslogado
    if (token && isTokenExpired(token)) {
        localStorage.removeItem('admin_token');
        token = null;
    }

    if (token) {
        // admin logado
        loginLink.style.display = 'none';
        adminLink.style.display = 'inline-block';
        logoutLink.style.display = 'inline-block';
    } else {
        // não logado
        loginLink.style.display = 'inline-block';
        adminLink.style.display = 'none';
        logoutLink.style.display = 'none';
    }

    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('admin_token');
        window.location.href = '/';
    });
})();


function parseJwt(token) {
    try {
        const payload = token.split('.')[1];
        const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
        return JSON.parse(json);
    } catch {
        return null;
    }
}

function isTokenExpired(token) {
    const data = parseJwt(token);
    if (!data || !data.exp) return true;
    return Date.now() >= data.exp * 1000;
}


// ------- CONTATO (ENVIA EMAIL DE VERDADE) -------

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('contact-form');
    const status = document.getElementById('contact-status');

    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (status) status.textContent = 'Enviando...';

        const data = {
            nome: document.getElementById('nome').value,
            telefone: document.getElementById('telefone').value,
            email: document.getElementById('email').value,
            mensagem: document.getElementById('msg').value,
        };

        try {
            const resp = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const body = await resp.json().catch(() => ({}));

            if (!resp.ok) {
                if (status) status.textContent = 'Erro: ' + (body.error || resp.status);
                return;
            }

            if (status) status.textContent = 'Mensagem enviada com sucesso!';
            form.reset();
        } catch (err) {
            console.error(err);
            if (status) status.textContent = 'Erro de rede ao enviar mensagem.';
        }
    });
});
