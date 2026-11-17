import { createFileRoute } from "@tanstack/react-router";
import { MfaPage } from "@/components/auth/MfaPage";

export const Route = createFileRoute("/mfa")({
  ssr: false,
  head: () => ({ meta: [{ title: "Verificação em duas etapas · Doce Ofício" }] }),
  component: MfaPage,
});