import { useEffect, useState } from "react";
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
import { Label } from "@/components/ui/label";
import { formatBRL, formatarData } from "@/lib/format";
import { PAGAMENTOS, STATUS_PEDIDO } from "@/lib/pedido-constantes";

export default function PedidoDetalheDialog({ pedido, open, onOpenChange, onAtualizado }) {
  const [status, setStatus] = useState("novo");
  const [pagamento, setPagamento] = useState("a_combinar");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open || !pedido) return;
    setStatus(pedido.status || "novo");
    setPagamento(pedido.pagamento || "a_combinar");
  }, [open, pedido]);

  if (!pedido) return null;

  async function salvar() {
    setSalvando(true);
    try {
      await base44.entities.Pedido.update(pedido.id, { status, pagamento });
      toast.success("Pedido atualizado");
      onAtualizado();
      onOpenChange(false);
    } catch {
      toast.error("Não foi possível atualizar o pedido.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl font-normal">
            Pedido {pedido.codigo}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="eyebrow">Cliente</p>
              <p className="mt-1">{pedido.nome_cliente}</p>
            </div>
            <div>
              <p className="eyebrow">Telefone</p>
              <p className="mt-1">{pedido.telefone}</p>
            </div>
            <div>
              <p className="eyebrow">Recebimento</p>
              <p className="mt-1">
                {pedido.tipo_entrega === "entrega" ? "Entrega" : "Retirada no ateliê"}
              </p>
            </div>
            <div>
              <p className="eyebrow">Data e período</p>
              <p className="mt-1">
                {formatarData(pedido.data_desejada)} ·{" "}
                {pedido.periodo === "manha" ? "manhã" : "tarde"}
              </p>
            </div>
            {pedido.email && (
              <div>
                <p className="eyebrow">E-mail</p>
                <p className="mt-1">{pedido.email}</p>
              </div>
            )}
            {pedido.endereco && (
              <div className="sm:col-span-2">
                <p className="eyebrow">Endereço</p>
                <p className="mt-1">{pedido.endereco}</p>
              </div>
            )}
            {pedido.observacoes && (
              <div className="sm:col-span-2">
                <p className="eyebrow">Observações</p>
                <p className="mt-1">{pedido.observacoes}</p>
              </div>
            )}
          </div>

          <div className="border-y border-border py-3">
            <p className="eyebrow">Itens</p>
            <ul className="mt-2 space-y-1">
              {pedido.itens?.map((item) => (
                <li key={item.produto_id} className="flex justify-between gap-4">
                  <span>
                    {item.quantidade}× {item.nome}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatBRL(item.preco_unitario * item.quantidade)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-3 flex justify-between font-medium">
              <span>Total ({pedido.tipo_entrega === "entrega" ? "com entrega" : "retirada"})</span>
              <span className="tabular-nums">{formatBRL(pedido.total)}</span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="status-pedido">Status</Label>
              <select
                id="status-pedido"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="mt-1.5 w-full border border-input bg-card px-3 py-2 text-sm"
              >
                {STATUS_PEDIDO.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="pagamento-pedido">Pagamento</Label>
              <select
                id="pagamento-pedido"
                value={pagamento}
                onChange={(e) => setPagamento(e.target.value)}
                className="mt-1.5 w-full border border-input bg-card px-3 py-2 text-sm"
              >
                {PAGAMENTOS.map((opcao) => (
                  <option key={opcao.value} value={opcao.value}>
                    {opcao.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button type="button" onClick={salvar} disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar alterações"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}