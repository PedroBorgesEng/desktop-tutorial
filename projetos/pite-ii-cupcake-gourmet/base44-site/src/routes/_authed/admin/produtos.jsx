import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import ProdutoDialog from "@/components/admin/ProdutoDialog";
import { Button } from "@/components/ui/button";
import { Image } from "@/components/ui/image";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authed/admin/produtos")({
  component: ProdutosPage,
});

function ProdutosPage() {
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [dialogoAberto, setDialogoAberto] = useState(false);
  const [emEdicao, setEmEdicao] = useState(null);

  const carregar = useCallback(async () => {
    const pagina = await base44.entities.Produto.filter({}, { sort: "nome", limit: 200 });
    setProdutos(pagina.items || []);
    setCarregando(false);
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function alternarDisponibilidade(produto) {
    try {
      await base44.entities.Produto.update(produto.id, { disponivel: produto.disponivel === false });
      carregar();
    } catch {
      toast.error("Não foi possível alterar a disponibilidade.");
    }
  }

  async function excluir(produto) {
    if (!window.confirm(`Excluir "${produto.nome}" do catálogo?`)) return;
    try {
      await base44.entities.Produto.delete(produto.id);
      toast.success("Produto removido");
      carregar();
    } catch {
      toast.error("Não foi possível excluir o produto.");
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Catálogo</p>
          <h1 className="mt-2 font-heading text-4xl font-light tracking-tight">Produtos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Cadastre, edite e controle a disponibilidade dos doces exibidos na loja.
          </p>
        </div>
        <Button
          onClick={() => {
            setEmEdicao(null);
            setDialogoAberto(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          Novo produto
        </Button>
      </div>

      <div className="mt-8 border border-border bg-card">
        {carregando ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Carregando catálogo...</p>
        ) : produtos.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            Nenhum produto cadastrado. Use "Novo produto" para começar.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {produtos.map((produto) => (
              <li key={produto.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <Image
                  src={produto.imagem_url}
                  alt={produto.nome}
                  fittingType="fill"
                  className="h-16 w-14 shrink-0 object-cover"
                />
                <div className="min-w-[12rem] flex-1">
                  <p className="text-sm font-medium">{produto.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    {produto.categoria} · {formatBRL(produto.preco)}
                    {produto.porcao ? ` · ${produto.porcao}` : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => alternarDisponibilidade(produto)}
                  className={`border px-3 py-1 text-[10px] uppercase tracking-[0.14em] transition-colors ${
                    produto.disponivel === false
                      ? "border-border text-muted-foreground hover:border-foreground/40"
                      : "border-primary/40 bg-primary/10 text-primary"
                  }`}
                >
                  {produto.disponivel === false ? "Indisponível" : "Disponível"}
                </button>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setEmEdicao(produto);
                      setDialogoAberto(true);
                    }}
                    aria-label={`Editar ${produto.nome}`}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => excluir(produto)}
                    aria-label={`Excluir ${produto.nome}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ProdutoDialog
        open={dialogoAberto}
        onOpenChange={setDialogoAberto}
        produto={emEdicao}
        onSalvo={carregar}
      />
    </div>
  );
}