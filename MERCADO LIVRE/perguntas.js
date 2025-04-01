const express = require('express');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

// CONFIGURAÇÕES
const MERCADO_LIVRE_ACCESS_TOKEN = "APP_USR-7375313929424067-040109-fc0eca92e3b3eb42be99127329c6765f-64910273";
const GEMINI_API_KEY = "SUA_CHAVE_API_AQUI"; // Substitua pela sua API Key
const USER_ID = "64910273"; // ID do vendedor no Mercado Livre

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

        // Responder automaticamente as perguntas capturadas
        for (let pergunta of dados.questions) {
            const question_id = pergunta.id;
            const perguntaTexto = pergunta.text;
            const produto_id = pergunta.item_id;

            // 🔍 Buscar a descrição do produto
            const descricaoProduto = await buscarDescricaoProduto(produto_id);

            // Gerar resposta com o Gemini
            const respostaGerada = await gerarRespostaGemini(perguntaTexto, descricaoProduto);

            if (respostaGerada) {
                // Enviar a resposta para o Mercado Livre
                await responderPerguntaMercadoLivre(question_id, respostaGerada);
            }
        }

        res.status(200).json({ status: 'OK', message: 'Perguntas respondidas automaticamente.' });

    } catch (erro) {
        console.error('Erro ao capturar perguntas:', erro);
        res.status(500).json({ status: 'ERROR', message: erro.message });
    }
});

// 2️⃣ Buscar a descrição do produto no Mercado Livre
async function buscarDescricaoProduto(produto_id) {
    const url = `https://api.mercadolibre.com/items/${produto_id}`;

    try {
        const resposta = await fetch(url, {
            method: 'GET',
            headers: { "Authorization": `Bearer ${MERCADO_LIVRE_ACCESS_TOKEN}` }
        });

        const dados = await resposta.json();
        return dados.title + " - " + (dados.description?.plain_text || "Descrição não disponível.");
    } catch (erro) {
        console.error('Erro ao buscar descrição do produto:', erro);
        return "Descrição não disponível.";
    }
}

// 3️⃣ Enviar pergunta ao Google Gemini e gerar resposta
async function gerarRespostaGemini(pergunta, descricaoProduto) {
    const prompt = `O cliente fez a seguinte pergunta sobre o produto: "${descricaoProduto}". Pergunta: "${pergunta}". Responda de forma educada e objetiva com base na descrição do produto.`;

    try {
        const resposta = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            })
        });

        const dados = await resposta.json();
        
        console.log('Resposta do Gemini:', JSON.stringify(dados, null, 2));

        if (dados && dados.candidates && dados.candidates.length > 0) {
            return dados.candidates[0]?.content?.parts[0]?.text || "Desculpe, não consegui gerar uma resposta.";
        } else {
            console.error('Resposta inesperada do Gemini:', dados);
            return "Desculpe, não consegui gerar uma resposta. Tente novamente mais tarde.";
        }

    } catch (erro) {
        console.error('Erro ao gerar resposta com Gemini:', erro);
        return "Erro ao processar a resposta. Tente novamente mais tarde.";
    }
}

// 4️⃣ Responder automaticamente no Mercado Livre
async function responderPerguntaMercadoLivre(question_id, respostaGerada) {
    const url_resposta = `https://api.mercadolibre.com/answers`;
    const body = JSON.stringify({
        question_id: question_id,
        text: respostaGerada
    });

    const headers = {
        "Authorization": `Bearer ${MERCADO_LIVRE_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
    };

    try {
        const resposta = await fetch(url_resposta, { method: 'POST', headers, body });
        const resultado = await resposta.json();

        if (resposta.ok) {
            console.log(`Pergunta respondida automaticamente. ID: ${question_id} -> Resposta: ${respostaGerada}`);
        } else {
            console.error('Erro ao enviar resposta:', resultado);
        }
    } catch (erro) {
        console.error('Erro ao responder pergunta:', erro);
    }
}

// Inicia o servidor
const PORT = process.env.PORT || 4041;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
