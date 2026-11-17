import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { ClipboardList, LayoutDashboard, LogOut, Package, Store } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authed/admin")({
  component: AdminLayout,
});

const NAV = [
  { to: "/admin", label: "Painel", Icone: LayoutDashboard, exato: true },
  { to: "/admin/pedidos", label: "Pedidos", Icone: ClipboardList },
  { to: "/admin/produtos", label: "Produtos", Icone: Package },
];

function AdminLayout() {
  const { user, logout } = useAuth();

  if (user && user.role !== "admin") {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <h1 className="font-heading text-3xl font-light">Área restrita ao ateliê</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sua conta não tem permissão de administração. Peça ao responsável pelo ateliê para
          liberar o acesso.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Button asChild variant="outline">
            <Link to="/">Voltar à loja</Link>
          </Button>
          <Button onClick={() => logout("/")}>Sair</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="inline-flex items-center gap-2 font-heading text-xl">
              <Store className="h-4 w-4" aria-hidden="true" />
              Doce Ofício
            </Link>
            <span className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground">
              Painel do ateliê
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-muted-foreground sm:inline">{user?.email}</span>
            <Button variant="outline" size="sm" onClick={() => logout("/")}>
              <LogOut className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
              Sair
            </Button>
          </div>
        </div>

        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6">
          {NAV.map(({ to, label, Icone, exato }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: Boolean(exato) }}
              className="inline-flex items-center gap-2 border-b-2 border-transparent px-4 py-3 text-sm text-foreground/70 transition-colors hover:text-accent data-[status=active]:border-accent data-[status=active]:text-foreground"
            >
              <Icone className="h-4 w-4" aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}