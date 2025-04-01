const fetch = require('node-fetch');

const MERCADO_LIVRE_ACCESS_TOKEN = "APP_USR-7375313929424067-040108-2cef35c34c8d6ea745481e71a9f56835-64910273"; // Seu token de acesso

async function obterUserId() {
    const url = "https://api.mercadolibre.com/users/me";
    const headers = {
        "Authorization": `Bearer ${MERCADO_LIVRE_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
    };

    try {
        const resposta = await fetch(url, { method: 'GET', headers });
        const dados = await resposta.json();
        const userId = dados.id;
        console.log("Seu USER_ID é:", userId);
        return userId;
    } catch (erro) {
        console.error("Erro ao obter o USER_ID:", erro);
    }
}

obterUserId();
