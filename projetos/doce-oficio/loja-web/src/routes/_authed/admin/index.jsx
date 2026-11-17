import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { base44 } from "@/api/base44Client";
import StatCard from "@/components/admin/StatCard";
import { formatBRL, formatarData } from "@/lib/format";
import { classeStatus, rotuloStatus } from "@/lib/pedido-constantes";

export const Route = createFileRoute("/_authed/admin/")({
  component: PainelPage,
});

const STATUS_FATURADO = ["confirmado", "pronto", "entregue"];

function PainelPage() {
  const [agregado, setAgregado] = useState([]);
  const [recentes, setRecentes] = useState([]);
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    (async () => {
      const [porStatus, lista, produtos] = await Promise.all([
        base44.entities.Pedido.aggregate({ groupBy: "status", sum: ["total"] }),
        base44.entities.Pedido.filter({}, { sort: "-created_date", limit: 6 }),
        base44.entities.Produto.count({}),
      ]);
      if (!ativo) return;
      setAgregado(porStatus.rows || []);
      setRecentes(lista.items || []);
      setTotalProdutos(produtos);
      setCarregando(false);
    })();
    return () => {
      ativo = false;
    };
  }, []);

  const contar = (status) => agregado.find((r) => r.status === status)?.count || 0;
  const totalPedidos = agregado.reduce((soma, r) => soma + (r.count || 0), 0);
  const receita = agregado
    .filter((r) => STATUS_FATURADO.includes(r.status))
    .reduce((soma, r) => soma + (r.sum_total || 0), 0);

  return (
    <div>
      <p className="eyebrow">Painel do ateliê</p>
      <h1 className="mt-3 font-heading text-4xl font-light tracking-tight">Resumo do lote</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Acompanhe as reservas recebidas e o que precisa de confirmação.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard rotulo="Pedidos novos" valor={carregando ? "—" : contar("novo")} detalhe="Aguardando confirmação" />
        <StatCard rotulo="Pedidos no total" valor={carregando ? "—" : totalPedidos} detalhe="Todas as reservas" />
        <StatCard
          rotulo="Valor confirmado"
          valor={carregando ? "—" : formatBRL(receita)}
          detalhe="Confirmado, pronto ou entregue"
        />
        <StatCard rotulo="Produtos no catálogo" valor={carregando ? "—" : totalProdutos} detalhe="Itens cadastrados" />
      </div>

      <div className="mt-10 border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="font-heading text-xl">Últimas reservas</h2>
          <Link to="/admin/pedidos" className="text-xs uppercase tracking-[0.16em] text-accent">
            Ver todos
          </Link>
        </div>

        {carregando ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">Carregando reservas...</p>
        ) : recentes.length === 0 ? (
          <p className="px-5 py-8 text-sm text-muted-foreground">
            Nenhuma reserva registrada ainda. Elas aparecem aqui assim que um cliente confirmar o
            pedido no site.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recentes.map((pedido) => (
              <li key={pedido.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div>
                  <p className="text-sm font-medium">
                    {pedido.codigo} · {pedido.nome_cliente}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatarData(pedido.data_desejada)} ·{" "}
                    {pedido.tipo_entrega === "entrega" ? "entrega" : "retirada"}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm tabular-nums">{formatBRL(pedido.total)}</span>
                  <span
                    className={`border px-2.5 py-1 text-[10px] uppercase tracking-[0.14em] ${classeStatus(pedido.status)}`}
                  >
                    {rotuloStatus(pedido.status)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}