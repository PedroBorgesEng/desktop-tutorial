export default function StatCard({ rotulo, valor, detalhe }) {
  return (
    <div className="border border-border bg-card p-5">
      <p className="eyebrow">{rotulo}</p>
      <p className="mt-3 font-heading text-3xl font-normal tabular-nums">{valor}</p>
      {detalhe && <p className="mt-1 text-xs text-muted-foreground">{detalhe}</p>}
    </div>
  );
}