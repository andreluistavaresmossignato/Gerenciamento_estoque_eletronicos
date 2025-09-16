<?php
// model/Carrinho.php
require_once 'Produto.php';

class Carrinho implements JsonSerializable {
    private array $itens = []; // [id => ['produto' => Produto, 'quantidade' => int]]

    public function adicionarProduto(Produto $produto): void {
        $id = $produto->getId();
        if (isset($this->itens[$id])) {
            $this->itens[$id]['quantidade']++;
        } else {
            $this->itens[$id] = [
                'produto' => $produto,
                'quantidade' => 1
            ];
        }
    }

    public function getItens(): array {
        return $this->itens;
    }

    public function getProdutos(): array {
        $produtos = [];
        foreach ($this->itens as $item) {
            for ($i = 0; $i < $item['quantidade']; $i++) {
                $produtos[] = $item['produto'];
            }
        }
        return $produtos;
    }

    public function getTotal(): float {
        $total = 0.0;
        foreach ($this->itens as $item) {
            $total += $item['produto']->getPreco() * $item['quantidade'];
        }
        return $total;
    }

    public function removerProdutoPorId(int $id): bool {
        if (isset($this->itens[$id])) {
            if ($this->itens[$id]['quantidade'] > 1) {
                $this->itens[$id]['quantidade']--;
            } else {
                unset($this->itens[$id]);
            }
            return true;
        }
        return false;
    }

    public function jsonSerialize(): array {
        $itensParaJson = [];
        foreach ($this->itens as $id => $item) {
            $itensParaJson[] = [
                'id' => $id,
                'produto' => $item['produto'],
                'quantidade' => $item['quantidade']
            ];
        }

        return [
            'itens' => $itensParaJson,
            'total' => $this->getTotal()
        ];
    }
}