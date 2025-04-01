const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// CONFIGURAÇÕES
const MERCADO_LIVRE_ACCESS_TOKEN = "APP_USR-7375313929424067-040109-fc0eca92e3b3eb42be99127329c6765f-64910273";
const GEMINI_API_KEY = "AIzaSyCpnxw_tgsFeDyFEhXa38oGMZu4qrPy7i0";
const USER_ID = "7375313929424067"; // ID do vendedor no Mercado Livre

// 1️⃣ Capturar perguntas pendentes nos anúncios
app.get('/capturarPerguntas', async (req, res) => {
    const url_perguntas = `https://api.mercadolibre.com/questions/search?seller_id=${USER_ID}&status=UNANSWERED`;

    try {
        const headers = {
            "Authorization": `Bearer ${MERCADO_LIVRE_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        };

        const resposta = await fetch(url_perguntas, { method: 'GET', headers });
        const dados = await resposta.json();

        if (!dados.questions || dados.questions.length === 0) {
            return res.status(200).json({ status: 'OK', message: 'Nenhuma pergunta pendente.' });
        }

        console.log('Perguntas pendentes:', dados.questions);
        res.status(200).json(dados.questions);

    } catch (erro) {
        console.error('Erro ao capturar perguntas:', erro);
        res.status(500).json({ status: 'ERROR', message: erro.message });
    }
});

// 2️⃣ Enviar pergunta ao Google Gemini e gerar resposta
async function gerarRespostaGemini(pergunta, produto) {
    const prompt = `O cliente fez a seguinte pergunta sobre o produto "${produto}": "${pergunta}". 
    Responda de forma educada e objetiva com base na descrição do produto.`;

    try {
        const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateText?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt })
        });

        const dados = await resposta.json();
        return dados.candidates[0]?.output || "Desculpe, não consegui gerar uma resposta.";
    } catch (erro) {
        console.error('Erro ao gerar resposta com Gemini:', erro);
        return "Erro ao processar a resposta.";
    }
}

// 3️⃣ Responder automaticamente no Mercado Livre
app.post('/responderPergunta', async (req, res) => {
    const { question_id, pergunta, produto } = req.body;

    if (!question_id || !pergunta || !produto) {
        return res.status(400).json({ status: 'ERROR', message: 'Parâmetros ausentes.' });
    }

    try {
        const respostaGerada = await gerarRespostaGemini(pergunta, produto);

        const url_resposta = `https://api.mercadolibre.com/answers`;
        const body = JSON.stringify({
            question_id: question_id,
            text: respostaGerada
        });

        const headers = {
            "Authorization": `Bearer ${MERCADO_LIVRE_ACCESS_TOKEN}`,
            "Content-Type": "application/json"
        };

        const resposta = await fetch(url_resposta, { method: 'POST', headers, body });
        const resultado = await resposta.json();

        console.log(`Pergunta respondida: ${pergunta} -> Resposta: ${respostaGerada}`);
        res.status(200).json({ status: 'OK', resposta: resultado });

    } catch (erro) {
        console.error('Erro ao responder pergunta:', erro);
        res.status(500).json({ status: 'ERROR', message: erro.message });
    }
});

// Inicia o servidor
const PORT = process.env.PORT || 4041;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
