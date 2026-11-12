import { useEffect, useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIAS } from "@/data/catalogo-sample";

const VAZIO = {
  nome: "",
  categoria: "bolos",
  preco: "",
  resumo: "",
  descricao: "",
  ingredientes: "",
  porcao: "",
  imagem_url: "",
  disponivel: true,
  destaque: false,
};

export default function ProdutoDialog({ open, onOpenChange, produto, onSalvo }) {
  const [form, setForm] = useState(VAZIO);
  const [salvando, setSalvando] = useState(false);
  const [enviandoImagem, setEnviandoImagem] = useState(false);

  useEffect(() => {
    if (!open) return;
    setForm(
      produto
        ? {
            nome: produto.nome || "",
            categoria: produto.categoria || "bolos",
            preco: produto.preco ?? "",
            resumo: produto.resumo || "",
            descricao: produto.descricao || "",
            ingredientes: produto.ingredientes || "",
            porcao: produto.porcao || "",
            imagem_url: produto.imagem_url || "",
            disponivel: produto.disponivel !== false,
            destaque: Boolean(produto.destaque),
          }
        : VAZIO
    );
  }, [open, produto]);

  const atualizar = (campo) => (evento) =>
    setForm((atual) => ({ ...atual, [campo]: evento.target.value }));

  async function enviarImagem(evento) {
    const arquivo = evento.target.files?.[0];
    if (!arquivo) return;
    setEnviandoImagem(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file: arquivo });
      setForm((atual) => ({ ...atual, imagem_url: file_url }));
    } catch {
      toast.error("Não foi possível enviar a imagem.");
    } finally {
      setEnviandoImagem(false);
      evento.target.value = "";
    }
  }

  async function salvar(evento) {
    evento.preventDefault();
    setSalvando(true);
    const dados = {
      ...form,
      preco: Number(form.preco),
      resumo: form.resumo || form.descricao.slice(0, 120),
    };
    try {
      if (produto) {
        await base44.entities.Produto.update(produto.id, dados);
        toast.success("Produto atualizado");
      } else {
        await base44.entities.Produto.create(dados);
        toast.success("Produto criado");
      }
      onOpenChange(false);
      onSalvo();
    } catch {
      toast.error("Não foi possível salvar o produto.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal">
            {produto ? "Editar produto" : "Novo produto"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={salvar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="p-nome">Nome</Label>
              <Input id="p-nome" required value={form.nome} onChange={atualizar("nome")} className="mt-1.5" />
            </div>
            <div>
              <Label htmlFor="p-categoria">Categoria</Label>
              <select
                id="p-categoria"
                value={form.categoria}
                onChange={atualizar("categoria")}
                className="mt-1.5 w-full border border-input bg-card px-3 py-2 text-sm"
              >
                {CATEGORIAS.map((categoria) => (
                  <option key={categoria.value} value={categoria.value}>
                    {categoria.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="p-preco">Preço (R$)</Label>
              <Input
                id="p-preco"
                type="number"
                min="0"
                step="0.01"
                required
                value={form.preco}
                onChange={atualizar("preco")}
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p-resumo">Resumo do card</Label>
              <Input id="p-resumo" value={form.resumo} onChange={atualizar("resumo")} className="mt-1.5" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p-descricao">Descrição</Label>
              <Textarea
                id="p-descricao"
                rows={3}
                value={form.descricao}
                onChange={atualizar("descricao")}
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="p-ingredientes">Ingredientes</Label>
              <Textarea
                id="p-ingredientes"
                rows={2}
                value={form.ingredientes}
                onChange={atualizar("ingredientes")}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="p-porcao">Rendimento</Label>
              <Input
                id="p-porcao"
                value={form.porcao}
                onChange={atualizar("porcao")}
                placeholder="8 fatias"
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="p-imagem">Endereço da foto</Label>
              <Input
                id="p-imagem"
                value={form.imagem_url}
                onChange={atualizar("imagem_url")}
                placeholder="https://"
                className="mt-1.5"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="inline-flex cursor-pointer items-center gap-2 border border-border px-3 py-2 text-xs uppercase tracking-[0.14em] text-foreground/70 hover:border-foreground/40">
                {enviandoImagem ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <ImagePlus className="h-4 w-4" aria-hidden="true" />
                )}
                {enviandoImagem ? "Enviando foto..." : "Enviar foto do computador"}
                <input type="file" accept="image/*" onChange={enviarImagem} className="hidden" />
              </label>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 border-t border-border pt-4 text-sm">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.disponivel}
                onChange={(e) => setForm((a) => ({ ...a, disponivel: e.target.checked }))}
              />
              Disponível no catálogo
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.destaque}
                onChange={(e) => setForm((a) => ({ ...a, destaque: e.target.checked }))}
              />
              Destaque do lote
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Salvar produto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}