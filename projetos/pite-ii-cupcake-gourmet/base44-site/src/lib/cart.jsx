import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "doce-oficio:carrinho";

export function CartProvider({ children }) {
  const [itens, setItens] = useState([]);
  const [carregado, setCarregado] = useState(false);

  useEffect(() => {
    try {
      const salvo = window.localStorage.getItem(STORAGE_KEY);
      if (salvo) setItens(JSON.parse(salvo));
    } catch {
      /* carrinho começa vazio */
    }
    setCarregado(true);
  }, []);

  useEffect(() => {
    if (!carregado) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(itens));
    } catch {
      /* ignora falha de armazenamento */
    }
  }, [itens, carregado]);

  const value = useMemo(() => {
    const adicionar = (produto, quantidade = 1) => {
      setItens((atual) => {
        const existente = atual.find((i) => i.id === produto.id);
        if (existente) {
          return atual.map((i) =>
            i.id === produto.id ? { ...i, quantidade: Math.min(99, i.quantidade + quantidade) } : i
          );
        }
        return [
          ...atual,
          {
            id: produto.id,
            nome: produto.nome,
            preco: Number(produto.preco),
            imagem_url: produto.imagem_url,
            categoria: produto.categoria,
            quantidade: Math.min(99, Math.max(1, quantidade)),
          },
        ];
      });
    };

    const alterarQuantidade = (id, quantidade) => {
      setItens((atual) =>
        atual
          .map((i) => (i.id === id ? { ...i, quantidade: Math.max(0, Math.min(99, quantidade)) } : i))
          .filter((i) => i.quantidade > 0)
      );
    };

    const remover = (id) => setItens((atual) => atual.filter((i) => i.id !== id));
    const limpar = () => setItens([]);

    const total = itens.reduce((soma, i) => soma + i.preco * i.quantidade, 0);
    const quantidadeTotal = itens.reduce((soma, i) => soma + i.quantidade, 0);

    return { itens, adicionar, alterarQuantidade, remover, limpar, total, quantidadeTotal };
  }, [itens]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart precisa estar dentro de CartProvider");
  return ctx;
}