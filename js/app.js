// js/app.js

document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do HTML
    const listaProdutosEl = document.getElementById('lista-produtos');
    const itensCarrinhoEl = document.getElementById('itens-carrinho');
    const totalCarrinhoEl = document.getElementById('total-carrinho');

    // Função para buscar os produtos da nossa API PHP
    async function carregarProdutos() {
        const response = await fetch('api/?action=get_products');
        const produtos = await response.json();

        listaProdutosEl.innerHTML = ''; // Limpa a mensagem "Carregando..."
        produtos.forEach(produto => {
            const produtoDiv = document.createElement('div');
            produtoDiv.classList.add('produto');
            produtoDiv.innerHTML = `
            <h4>${produto.nome}</h4>
            <p>Preço: R$ ${produto.preco.toFixed(2)}</p>
            <p>Estoque: <span class="${produto.estoque === 0 ? 'text-danger fw-bold' : ''}">${produto.estoque}</span></p>
            <img class="imagem-produto" src="${produto.caminho}" alt="${produto.nome}">
            <br>
            <button class="btn ${produto.estoque > 0 ? 'btn-primary' : 'btn-secondary'}" 
                    data-id="${produto.id}" 
                    ${produto.estoque === 0 ? 'disabled' : ''}>
                    ${produto.estoque !== 0 ? "Adicionar ao Carrinho" : "Produto esgotado"}
            </button>
            <br>
        `;
            listaProdutosEl.appendChild(produtoDiv);
        });
    }

// Função para buscar o estado atual do carrinho
async function carregarCarrinho() {
    const response = await fetch('api/?action=get_cart');
    const carrinho = await response.json();

    console.log('Dados recebidos do carrinho:', carrinho); // ← DEBUG!

    itensCarrinhoEl.innerHTML = '';

    // Detecta se está usando a estrutura nova (itens) ou antiga (produtos)
    let itens = carrinho.itens || []; // Nova estrutura
    if (carrinho.produtos && !itens.length) {
        // Se não tem 'itens', tenta converter 'produtos' em 'itens' (compatibilidade)
        const mapa = {};
        carrinho.produtos.forEach(produto => {
            if (!mapa[produto.id]) {
                mapa[produto.id] = {
                    produto: produto,
                    quantidade: 0
                };
            }
            mapa[produto.id].quantidade++;
        });
        itens = Object.values(mapa);
    }

    if (itens.length === 0) {
        itensCarrinhoEl.innerHTML = '<p>Seu carrinho está vazio.</p>';
    } else {
        itens.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.classList.add('d-flex', 'justify-content-between', 'align-items-center', 'mb-2');
            
            const itemP = document.createElement('p');
            itemP.classList.add('mb-0');
            itemP.textContent = `${item.produto.nome} - R$ ${item.produto.preco.toFixed(2)}`;
            if (item.quantidade > 1) {
                itemP.textContent += ` x${item.quantidade}`;
            }
            
            const removerBtn = document.createElement('button');
            removerBtn.classList.add('btn', 'btn-sm', 'btn-outline-danger');
            removerBtn.textContent = 'Remover 1';
            removerBtn.setAttribute('data-id', item.produto.id);
            
            itemDiv.appendChild(itemP);
            itemDiv.appendChild(removerBtn);
            itensCarrinhoEl.appendChild(itemDiv);
        });
    }
    
    totalCarrinhoEl.textContent = `R$ ${carrinho.total?.toFixed(2) || '0,00'}`;
}

async function adicionarAoCarrinho(produtoId) {
    const params = new URLSearchParams();
    params.append('id', produtoId);

    const response = await fetch('api/?action=add_to_cart', {
        method: 'POST',
        body: params
    });

    const text = await response.text();  // pega texto cru
    console.log('Resposta do servidor:', text);

    // tenta transformar em json somente se quiser
    try {
        const json = JSON.parse(text);
        console.log('JSON parseado:', json);
    } catch (e) {
        console.error('Erro ao parsear JSON:', e);
    }

    // Atualiza o carrinho independentemente (se quiser)
    carregarCarrinho();
    carregarProdutos();   
}

async function removerDoCarrinho(produtoId) {
    const params = new URLSearchParams();
    params.append('id', produtoId);
    const response = await fetch('api/?action=remove_from_cart', {
        method: 'POST',
        body: params
    });
    const text = await response.text();
    console.log('Resposta do servidor ao remover:', text);
    carregarCarrinho();
    carregarProdutos();
}

// Ouvinte para remover itens do carrinho
itensCarrinhoEl.addEventListener('click', (evento) => {
    if (evento.target.matches('button[data-id]')) {
        const id = evento.target.getAttribute('data-id');
        removerDoCarrinho(id);
    }
});
    
    // --- Lógica de Eventos ---
    
    // Adiciona um "ouvinte" de cliques na lista de produtos
    listaProdutosEl.addEventListener('click', (evento) => {
        // Verifica se o clique foi em um botão com o atributo 'data-id'
        if (evento.target.matches('button[data-id]')) {
            const id = evento.target.getAttribute('data-id');
            adicionarAoCarrinho(id);       
        }
    });

    // --- Carregamento Inicial ---
    // Quando a página carregar, busca os produtos e o estado do carrinho
    carregarProdutos();
    carregarCarrinho();
});