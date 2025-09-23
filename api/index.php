<?php
// api/index.php

// Inclui as classes do modelo.
require_once 'model/Produto.php';
require_once 'model/Carrinho.php';

// ESSENCIAL: Inicia ou resume a sessão do usuário.
// Isso permite que o carrinho persista entre as requisições.
session_start();

// Define que a resposta será sempre em formato JSON.
header('Content-Type: application/json');

// Força recarregar produtos se ?reset=1 estiver na URL
if (isset($_GET['reset']) && $_GET['reset'] == 1) {
    unset($_SESSION['produtos']);
    session_destroy();
    session_start(); // reinicia sessão
}

// --- Simulação do nosso banco de dados de produtos ---
// --- Simulação do nosso banco de dados de produtos (persistente na sessão) ---
if (!isset($_SESSION['produtos'])) {
    $_SESSION['produtos'] = [
        1 => new Produto(1, "Mouse Logitech", "Logitech",89.99, "./api/images/produto01.png", 5),
        2 => new Produto(2, "Teclado Microsoft", "Microsoft",104.88, "./api/images/produto02.png", 0),
        3 => new Produto(3, "Monitor LG", "LG",899.90, "./api/images/produto03.png", 20),
        4 => new Produto(4, "Headset Razer", "Razer",299.99, "./api/images/produto04.png", 32),
        5 => new Produto(5, "Webcam Intelbras", "Intelbras",199.99, "./api/images/produto05.png", 25),
        6 => new Produto(6, "Notebook Lenovo", "Lenovo",2499.90, "./api/images/produto06.png", 18),
        7 => new Produto(7, "Headset Havit", "Havit",194.90, "./api/images/produto07.png", 36),
        8 => new Produto(8, "Mouse Redragon", "Redragon",79.90, "./api/images/produto08.png", 30),
        9 => new Produto(9, "Playstation 4", "Sony",1249.90, "./api/images/produto09.png", 0),
        10 => new Produto(10, "Monitor Odyssey", "Samsung",2000.90, "./api/images/produto10.png", 44),
        11 => new Produto(11, "Gabinete Aquário", "Pichau",419.90, "./api/images/produto11.png", 1),
        12 => new Produto(12, "WebCam Logitech", "Logitech",619.99, "./api/images/produto12.png", 99),
        13 => new Produto(13, "Notebook Acer", "Acer",4319.90, "./api/images/produto13.png", 15),
        14 => new Produto(14, "Microfone Fifine", "Fifine",289.99, "./api/images/produto14.png", 7),
        15 => new Produto(15, "Galaxy A16", "Samsung",1599.00, "./api/images/produto15.png", 19),
        16 => new Produto(16, "Controle Xbox", "Microsoft",461.00, "./api/images/produto16.png", 22),
        17 => new Produto(17, "Smart Tv 50''", "Samsung",2375.50, "./api/images/produto17.png", 10),
        18 => new Produto(18, "Teclado Hyperx", "Hyperx",192.29, "./api/images/produto18.png", 56),
    ];
}
$produtosDisponiveis = &$_SESSION['produtos']; // Referência, para alterar o original

// --- Garante que o carrinho exista na sessão ---
if (!isset($_SESSION['carrinho'])) {
    $_SESSION['carrinho'] = new Carrinho();
}

// --- Roteador de Ações da API ---
// O JavaScript vai nos dizer o que fazer através do parâmetro 'action'.
$action = $_GET['action'] ?? null;

switch ($action) {
    case 'get_products':
        // Apenas envia a lista de produtos em formato JSON.
        echo json_encode(array_values($produtosDisponiveis));
        break;

    case 'add_to_cart':
        $productId = $_POST['id'] ?? null;
        if ($productId && isset($produtosDisponiveis[$productId])) {
            $produto = $produtosDisponiveis[$productId];
            if ($produto->getEstoque() > 0) {
                $_SESSION['carrinho']->adicionarProduto($produto);
                $produto->decrementarEstoque(); //  Decrementa estoque
                echo json_encode(['success' => true, 'message' => 'Produto adicionado!']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Produto esgotado.']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Produto não encontrado.']);
        }
        break;

    case 'get_cart':
        // Envia os produtos e o total do carrinho atual.
        $carrinho = $_SESSION['carrinho'];
        $response = [
            'produtos' => $carrinho->getProdutos(),
            'total' => $carrinho->getTotal()
        ];
        echo json_encode($response);
        break;

    case 'remove_from_cart':
        $productId = $_POST['id'] ?? null;
        if ($productId !== null && isset($produtosDisponiveis[$productId])) {
            $removido = $_SESSION['carrinho']->removerProdutoPorId((int)$productId);
            if ($removido) {
                $produtosDisponiveis[$productId]->incrementarEstoque();
                echo json_encode(['success' => true, 'message' => 'Produto removido!']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Produto não estava no carrinho.']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Produto inválido.']);
        }
        break;

    case 'empty_cart':
        $carrinho = $_SESSION['carrinho'];
        $itens = $carrinho->getItens(); // Pega os itens com quantidade

        // Devolve cada item ao estoque
        foreach ($itens as $id => $item) {
            if (isset($produtosDisponiveis[$id])) {
                for ($i = 0; $i < $item['quantidade']; $i++) {
                    $produtosDisponiveis[$id]->incrementarEstoque();
                }
            }
        }

        // Agora sim, esvazia o carrinho
        $_SESSION['carrinho'] = new Carrinho();

        echo json_encode(['success' => true, 'message' => 'Carrinho esvaziado e estoque restituído!']);
        break;

    default:
        // Ação desconhecida.
        echo json_encode(['success' => false, 'message' => 'Ação inválida.']);
        break;
}