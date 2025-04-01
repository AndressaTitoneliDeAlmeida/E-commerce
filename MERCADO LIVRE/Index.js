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
    const app_id = "7375313929424067";
    const client_secret = "4PSGxXtdPiRfvg0IxDtW4NtK9r3N0md8";
    const code = "TG-67ebea2e96ac3800016e952b-64910273";
    const redirect_uri = "https://github.com/AndressaTitoneliDeAlmeida/E-commerce";
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

app.post('/getAccessToken', async (req, res) => {
    let refresh_token = "TG-67ebe155a84fe1000182debb-64910273"; // Pode vir do banco ou de um arquivo

    const app_id = "7375313929424067";
    const client_secret = "4PSGxXtdPiRfvg0IxDtW4NtK9r3N0md8";
    const url_principal = "https://api.mercadolibre.com/oauth/token";

    try {
        const headers = {
            "accept": "application/json",
            "content-type": "application/x-www-form-urlencoded"
        };

        // Formata os dados corretamente
        const dados = new URLSearchParams({
            grant_type: "refresh_token",
            client_id: app_id,
            client_secret: client_secret,
            refresh_token: refresh_token
        });

        const resposta = await fetch(url_principal, {
            method: 'POST',
            headers,
            body: dados
        });

        const dadosResposta = await resposta.json();
        console.log('Resposta do Mercado Livre:', dadosResposta);

        // Verifica se a resposta contém um novo refresh_token e o atualiza
        if (dadosResposta.refresh_token) {
            refresh_token = dadosResposta.refresh_token;
            console.log("Novo refresh token armazenado:", refresh_token);
        } else {
            console.warn("Nenhum novo refresh token retornado.");
        }

        res.status(200).json({
            status: 'OK',
            mercadoLivreResponse: dadosResposta
        });

    } catch (erro) {
        console.error('Erro ao obter o token de acesso:', erro);
        res.status(500).json({
            status: 'ERROR',
            message: erro.message
        });
    }
});


const PORT = process.env.PORT || 4041;
app.listen(PORT, () => {
    console.log(`Servidor ativo na porta ${PORT} - http://localhost:${PORT}`);
});