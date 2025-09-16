<?php
// model/Carrinho.php
require_once 'Produto.php';

class Carrinho implements JsonSerializable {
    private array $produtos = [];

    public function adicionarProduto(Produto $produto): void {
        // Decrementa o estoque do produto ao adicioná-lo ao carrinho
        if ($produto->getEstoque() > 0) {
            $this->produtos[] = $produto;
            // Aqui precisamos decrementar o estoque no objeto original
            // Vamos fazer isso no controlador (index.php) após adicionar
        }
    }

    public function getProdutos(): array {
        return $this->produtos;
    }

    public function getTotal(): float {
        $total = 0.0;
        foreach ($this->produtos as $produto) {
            $total += $produto->getPreco();
           

        }
        return $total;
    }

    /**
     * Especifica quais dados devem ser serializados para JSON.
     * Note que os objetos Produto dentro do array $this->produtos
     * também serão serializados usando seus próprios métodos jsonSerialize().
     */
    public function jsonSerialize(): array {
        return [
            'produtos' => $this->getProdutos(),
            'total' => $this->getTotal()
        ];
    }

    public function removerProduto(int $index): ?Produto {
        if (isset($this->produtos[$index])) {
            $produto = $this->produtos[$index];
            array_splice($this->produtos, $index, 1);
            return $produto;
        }
        return null;
    }
}