import { useCallback, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { base44 } from "@/api/base44Client";
import PedidoDetalheDialog from "@/components/admin/PedidoDetalheDialog";
import { formatBRL, formatarData } from "@/lib/format";
import { STATUS_PEDIDO, classeStatus, rotuloStatus } from "@/lib/pedido-constantes";

export const Route = createFileRoute("/_authed/admin/pedidos")({
  component: PedidosPage,
});

function PedidosPage() {
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [selecionado, setSelecionado] = useState(null);
  const [dialogoAberto, setDialogoAberto] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    const consulta = filtro === "todos" ? {} : { status: filtro };
    const pagina = await base44.entities.Pedido.filter(consulta, {
      sort: "-created_date",
      limit: 100,
    });
    setPedidos(pagina.items || []);
    setCarregando(false);
  }, [filtro]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Reservas</p>
          <h1 className="mt-2 font-heading text-4xl font-light tracking-tight">Pedidos</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Confirme, prepare e marque a entrega de cada reserva feita no site.
          </p>
        </div>

        <select
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="border border-input bg-card px-3 py-2 text-sm"
          aria-label="Filtrar pedidos por status"
        >
          <option value="todos">Todos os status</option>
          {STATUS_PEDIDO.map((status) => (
            <option key={status.value} value={status.value}>
              {status.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-8 overflow-x-auto border border-border bg-card">
        {carregando ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Carregando pedidos...</p>
        ) : pedidos.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            Nenhum pedido com esse filtro.
          </p>
        ) : (
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <tr>
                <th className="px-5 py-3 font-normal">Código</th>
                <th className="px-5 py-3 font-normal">Cliente</th>
                <th className="px-5 py-3 font-normal">Recebimento</th>
                <th className="px-5 py-3 font-normal">Total</th>
                <th className="px-5 py-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pedidos.map((pedido) => (
                <tr
                  key={pedido.id}
                  onClick={() => {
                    setSelecionado(pedido);
                    setDialogoAberto(true);
                  }}
                  className="cursor-pointer transition-colors hover:bg-secondary/50"
                >
                  <td className="px-5 py-4 font-medium">{pedido.codigo}</td>
                  <td className="px-5 py-4">
                    <span className="block">{pedido.nome_cliente}</span>
                    <span className="block text-xs text-muted-foreground">{pedido.telefone}</span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="block">
                      {pedido.tipo_entrega === "entrega" ? "Entrega" : "Retirada"}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {formatarData(pedido.data_desejada)} ·{" "}
                      {pedido.periodo === "manha" ? "manhã" : "tarde"}
                    </span>
                  </td>
                  <td className="px-5 py-4 tabular-nums">{formatBRL(pedido.total)}</td>
                  <td className="px-5 py-4">
                    <span
                      className={`border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${classeStatus(pedido.status)}`}
                    >
                      {rotuloStatus(pedido.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <PedidoDetalheDialog
        pedido={selecionado}
        open={dialogoAberto}
        onOpenChange={setDialogoAberto}
        onAtualizado={carregar}
      />
    </div>
  );
}