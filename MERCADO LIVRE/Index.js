const express = require('express');
const path = require('path');
const crypto = require('crypto'); // Para gerar code_verifier e code_challenge
const fetch = require('node-fetch');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Função para gerar code_verifier (string aleatória segura)
function generateCodeVerifier() {
    return crypto.randomBytes(32).toString('hex'); 
}

// Função para gerar code_challenge a partir do code_verifier
function generateCodeChallenge(codeVerifier) {
    return crypto.createHash('sha256').update(codeVerifier).digest('base64')
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

app.post('/teste', async (req, res) => {
    const app_id = "468580951981165";
    const client_secret = "V4gUwGuWU1ocW4PGvCRl6veOYgUGSlUn";
    const code = "TG-67eaf4d2892f900001db1220-64910273";
    const redirect_uri = "https://www.kyotoconcertina.com/";

    const url_principal = "https://api.mercadolibre.com/oauth/token";

    try {
        // Gera code_verifier e code_challenge
        const code_verifier = generateCodeVerifier();
        const code_challenge = generateCodeChallenge(code_verifier);

        const headers = {
            "accept": "application/json",
            "content-type": "application/x-www-form-urlencoded"
        };

        // Formata os dados corretamente
        const dados = new URLSearchParams({
            grant_type: "authorization_code",
            client_id: app_id,
            client_secret: client_secret,
            code: code,
            redirect_uri: redirect_uri,
            code_verifier: code_verifier // Adiciona o code_verifier na requisição
        });

        const resposta = await fetch(url_principal, {
            method: 'POST',
            headers,
            body: dados
        });

        const dadosResposta = await resposta.json();
        console.log('Resposta do Mercado Livre:', dadosResposta);

        res.status(200).json({ 
            status: 'OK',
            mercadoLivreResponse: dadosResposta 
        });

    } catch (erro) {
        console.error('Erro na requisição:', erro);
        res.status(500).json({ 
            status: 'ERROR',
            message: erro.message 
        });
    }
});

const PORT = process.env.PORT || 4040;
app.listen(PORT, () => {
    console.log(`Servidor ativo na porta ${PORT} - http://localhost:${PORT}`);
});