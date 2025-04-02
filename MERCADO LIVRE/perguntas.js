const express = require('express');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const app = express();
app.use(express.json());

const MERCADO_LIVRE_ACCESS_TOKEN = "APP_USR-7375313929424067-040208-647bc9d9660882a4520a4295d6b16613-64910273";
const USER_ID = "64910273";
const INTERVALO_VERIFICACAO = 30 * 1000; // 30 segundos
const DB_PATH = path.join(__dirname, 'respostas.json'); // Caminho do banco de dados JSON

// Verifica se o arquivo do banco de dados existe, senão cria um novo
if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2), 'utf8');
}

// Função para carregar o banco de respostas
function carregarBanco() {
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

// Busca resposta no banco de dados local
function buscarResposta(pergunta) {
    const banco = carregarBanco();

    for (const chave in banco) {
        if (pergunta.toLowerCase().includes(chave.toLowerCase())) {
            return banco[chave]; // Retorna a resposta salva
        }
    }
    return null; // Se não encontrar, retorna null
}

// Salva novas perguntas e respostas no banco de dados
function salvarResposta(pergunta, resposta) {
    const banco = carregarBanco();
    banco[pergunta] = resposta;
    fs.writeFileSync(DB_PATH, JSON.stringify(banco, null, 2), 'utf8');
    console.log(`📁 Resposta salva no banco: "${pergunta}" -> "${resposta}"`);
}

// Função principal para verificar perguntas
async function verificarPerguntas() {
    console.log('🔍 Verificando perguntas...');
    try {
        const perguntas = await buscarPerguntasNaoRespondidas();
        if (perguntas.length === 0) {
            console.log('✅ Nenhuma pergunta pendente.');
            return;
        }

        for (const pergunta of perguntas) {
            console.log(`💬 Pergunta recebida: "${pergunta.text}"`);

            // Verifica se já temos essa resposta no banco de dados
            const resposta = buscarResposta(pergunta.text);
            if (resposta) {
                console.log(`✅ Resposta encontrada no banco: "${resposta}"`);
                await enviarRespostaMercadoLivre(pergunta.id, resposta);
            } else {
                console.log(`⚠️ Pergunta não encontrada no banco. Precisa de resposta manual.`);
            }
        }
    } catch (erro) {
        console.error('❌ Erro durante a verificação:', erro);
    }
}

// Busca perguntas não respondidas no Mercado Livre
async function buscarPerguntasNaoRespondidas() {
    const url = `https://api.mercadolibre.com/questions/search?seller_id=${USER_ID}&status=UNANSWERED`;

    try {
        const resposta = await fetch(url, {
            headers: { "Authorization": `Bearer ${MERCADO_LIVRE_ACCESS_TOKEN}` }
        });

        const dados = await resposta.json();
        return dados.questions || [];
    } catch (erro) {
        console.error("❌ Erro ao buscar perguntas no Mercado Livre:", erro);
        return [];
    }
}

// Envia a resposta para o Mercado Livre
async function enviarRespostaMercadoLivre(perguntaId, resposta) {
    const url = `https://api.mercadolibre.com/answers`;

    const body = {
        question_id: perguntaId,
        text: resposta
    };

    try {
        const respostaML = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${MERCADO_LIVRE_ACCESS_TOKEN}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        if (respostaML.ok) {
            console.log(`✅ Resposta enviada para a pergunta ID ${perguntaId}`);
        } else {
            console.log(`⚠️ Falha ao enviar resposta para a pergunta ID ${perguntaId}`);
        }
    } catch (erro) {
        console.error("❌ Erro ao enviar resposta para o Mercado Livre:", erro);
    }
}

// Endpoint para adicionar respostas manualmente
app.post('/add-resposta', (req, res) => {
    const { pergunta, resposta } = req.body;
    if (!pergunta || !resposta) {
        return res.status(400).json({ erro: "Pergunta e resposta são obrigatórias." });
    }

    salvarResposta(pergunta, resposta);
    res.json({ mensagem: "Resposta adicionada com sucesso!" });
});

// Inicia a verificação automática a cada 30 segundos
setInterval(verificarPerguntas, INTERVALO_VERIFICACAO);

// Inicia o servidor Express
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
}); 