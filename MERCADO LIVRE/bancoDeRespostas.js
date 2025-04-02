const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'respostas.json');

// Função para carregar o banco de dados JSON
function carregarBanco() {
    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2), 'utf8');
    }
    return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

// Função para buscar uma resposta no JSON
function buscarResposta(pergunta) {
    const banco = carregarBanco();
    return banco[pergunta] || null;
}

// Função para salvar uma nova resposta no JSON
function salvarResposta(pergunta, resposta) {
    const banco = carregarBanco();
    banco[pergunta] = resposta;
    fs.writeFileSync(DB_PATH, JSON.stringify(banco, null, 2), 'utf8');
}

// Exemplo de uso
console.log(buscarResposta("Qual o prazo de entrega?")); // Retorna a resposta se existir
salvarResposta("Esse produto é novo?", "Sim, todos os nossos produtos são novos e originais.");
