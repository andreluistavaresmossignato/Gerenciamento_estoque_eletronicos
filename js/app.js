document.addEventListener('DOMContentLoaded', () => {
    // Referências aos elementos do HTML
    const listaProdutosEl = document.getElementById('lista-produtos');
    const itensCarrinhoEl = document.getElementById('itens-carrinho');
    const totalCarrinhoEl = document.getElementById('total-carrinho');

    // Estado atual dos filtros (mantido entre atualizações)
    let filtroBuscaAtual = '';
    let filtroEstoqueAtual = '';

    // --- EFEITO SHRINK NO HEADER AO ROLAR  ---
    window.addEventListener('scroll', () => {
        const header = document.getElementById('main-header');
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('shrink');
            } else {
                header.classList.remove('shrink');
            }
        }
    });

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
            <p id="marca">${produto.marca}</p>
            <p>Preço: R$ ${produto.preco.toFixed(2)}</p>
            <p>Estoque: <span class="${produto.estoque === 0 ? 'text-danger fw-bold' : ''}">${produto.estoque}</span></p>
            <img class="imagem-produto" src="${produto.caminho}?v=${Date.now()}" alt="${produto.nome}">
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

    // --- CARREGAR PRODUTOS COM FILTROS ---
    async function carregarProdutosFiltrados(termoBusca = null, faixaEstoque = null) {
        try {
            const response = await fetch('api/?action=get_products');
            let produtos = await response.json();

            // Filtro por nome
            if (termoBusca) {
                produtos = produtos.filter(p => 
                    p.nome.toLowerCase().includes(termoBusca.toLowerCase())
                );
            }

            // Filtro por estoque
            if (faixaEstoque) {
                produtos = produtos.filter(p => {
                    const estoque = p.estoque;
                    switch(faixaEstoque) {
                        case '0-10': return estoque >= 0 && estoque <= 10;
                        case '11-25': return estoque >= 11 && estoque <= 25;
                        case '26-50': return estoque >= 26 && estoque <= 50;
                        case '51+': return estoque >= 51;
                        default: return true;
                    }
                });
            }

            // Renderiza
            listaProdutosEl.innerHTML = '';
            if (produtos.length === 0) {
                listaProdutosEl.innerHTML = '<p class="text-center">Nenhum produto encontrado.</p>';
                return;
            }

            produtos.forEach(produto => {
                const produtoDiv = document.createElement('div');
                produtoDiv.classList.add('produto');
                produtoDiv.innerHTML = `
                    <h4>${produto.nome}</h4>
                    <p id="marca">${produto.marca}</p>
                    <p>Preço: R$ ${produto.preco.toFixed(2)}</p>
                    <p>Estoque: <span class="${produto.estoque === 0 ? 'text-danger fw-bold' : ''}">${produto.estoque}</span></p>
                    <img class="imagem-produto" src="${produto.caminho}?v=${Date.now()}" alt="${produto.nome}">
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

        } catch (error) {
            console.error('Erro ao carregar produtos:', error);
            if (listaProdutosEl) {
                listaProdutosEl.innerHTML = '<p class="text-danger">Erro ao carregar produtos.</p>';
            }
        }
    }

    // Função para buscar o estado atual do carrinho
    async function carregarCarrinho() {
        // Só executa se estiver na página do carrinho
        if (!itensCarrinhoEl || !totalCarrinhoEl) return;

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

        // Atualiza o carrinho se estiver na página do carrinho
        if (itensCarrinhoEl) carregarCarrinho();
        // Atualiza lista de produtos (para refletir estoque)
        if (listaProdutosEl) carregarProdutosFiltrados(filtroBuscaAtual, filtroEstoqueAtual);
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
        // Atualiza carrinho e produtos
        if (itensCarrinhoEl) carregarCarrinho();
        if (listaProdutosEl) carregarProdutosFiltrados(filtroBuscaAtual, filtroEstoqueAtual);
    }

    // --- ESVAZIAR CARRINHO ---
    async function esvaziarCarrinho() {
        try {
            const response = await fetch('api/?action=empty_cart', {
                method: 'POST'
            });

            const result = await response.json();
            console.log(result.message);

            // Atualiza interface
            if (itensCarrinhoEl) carregarCarrinho();
            if (listaProdutosEl) carregarProdutosFiltrados();

        } catch (error) {
            console.error('Erro ao esvaziar carrinho:', error);
        }
    }

    // Ouvinte para remover itens do carrinho (só ativa se estiver na página do carrinho)
    if (itensCarrinhoEl) {
        itensCarrinhoEl.addEventListener('click', (evento) => {
            if (evento.target.matches('button[data-id]')) {
                const id = evento.target.getAttribute('data-id');
                removerDoCarrinho(id);
            }
        });
    }
    
    // --- Lógica de Eventos ---
    
    // Adiciona um "ouvinte" de cliques na lista de produtos
    if (listaProdutosEl) {
        listaProdutosEl.addEventListener('click', (evento) => {
            // Verifica se o clique foi em um botão com o atributo 'data-id'
            if (evento.target.matches('button[data-id]')) {
                const id = evento.target.getAttribute('data-id');
                adicionarAoCarrinho(id);       
            }
        });
    }

    // --- Ouvinte para esvaziar carrinho ---
    const btnEsvaziar = document.getElementById('esvaziar-carrinho');
    if (btnEsvaziar) {
        btnEsvaziar.addEventListener('click', () => {
            if (confirm('Tem certeza que deseja esvaziar o carrinho?')) {
                esvaziarCarrinho();
            }
        });
    }

    // --- FILTROS  ---
    const searchInput = document.getElementById('search-input');
    const filterEstoque = document.getElementById('filter-estoque');

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            filtroBuscaAtual = e.target.value;
            carregarProdutosFiltrados(filtroBuscaAtual, filtroEstoqueAtual);
        });
    }
    
    if (filterEstoque) {
        filterEstoque.addEventListener('change', (e) => {
            filtroEstoqueAtual = e.target.value;
            carregarProdutosFiltrados(filtroBuscaAtual, filtroEstoqueAtual);
        });
    }

    // --- Carregamento Inicial ---
    // Quando a página carregar, busca os produtos e/ou o estado do carrinho
    if (listaProdutosEl) {
        carregarProdutosFiltrados(); // Usa a versão com filtros
    }
    if (itensCarrinhoEl) {
        carregarCarrinho(); // Só carrega se estiver na página do carrinho
    }
});