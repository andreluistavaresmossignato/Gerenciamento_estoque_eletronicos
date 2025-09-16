<?php
// model/Produto.php

class Produto implements JsonSerializable {
    private int $id;
    private string $nome;
    private float $preco;
    private string $caminho;
    private int $estoque;

    public function __construct(int $id, string $nome, float $preco, string $caminho, int $estoque) {
        $this->id = $id;
        $this->nome = $nome;
        $this->preco = $preco;
        $this->caminho = $caminho;
        $this->estoque = $estoque;
    }

    public function getId(): int {
        return $this->id;
    }

    public function getNome(): string {
        return $this->nome;
    }

    public function getPreco(): float {
        return $this->preco;
    }
    
    public function getCaminho(): string {
        return $this->caminho;
    }
    
    public function getEstoque(): int {
        return $this->estoque;
    }

    /**
     * Especifica quais dados devem ser serializados para JSON.
     * Isso é chamado automaticamente pela função json_encode().
     */
    public function jsonSerialize(): array {
        return [
            'id' => $this->id,
            'nome' => $this->nome,
            'preco' => $this->preco,
            'caminho' => $this->caminho,
            'estoque' => $this->estoque
           
        ];
    }

    public function incrementarEstoque(): void {
        $this->estoque++;
    }

    public function decrementarEstoque(): void {
        if ($this->estoque > 0) {
            $this->estoque--;
        }
    }
}