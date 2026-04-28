import AppShell from "@/components/app-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { ListChecks, CalendarRange, Users, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [opsTotal, opsEnCours, bilansAFaire, clientsCount] = await Promise.all([
    supabase.from("operations").select("id", { count: "exact", head: true }),
    supabase.from("operations").select("id", { count: "exact", head: true }).neq("validation", true),
    supabase.from("bilans").select("id", { count: "exact", head: true }).in("statut", ["a_faire", "planifie"]),
    supabase.from("clients").select("id", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Opérations totales", value: opsTotal.count ?? 0, icon: ListChecks },
    { label: "Opérations en cours", value: opsEnCours.count ?? 0, icon: AlertCircle },
    { label: "Bilans à faire", value: bilansAFaire.count ?? 0, icon: CalendarRange },
    { label: "Clients", value: clientsCount.count ?? 0, icon: Users },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vue d&apos;ensemble de l&apos;activité du pôle assistantes commerciales.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
                <s.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{s.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Bienvenue</CardTitle>
            <CardDescription>POC Outil de suivi — pôle assistance commerciale PEA</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground space-y-2">
            <p>Modules disponibles :</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Opérations</strong> — saisie et suivi des souscriptions, rachats, arbitrages…</li>
              <li><strong>Bilans</strong> — planning annuel des bilans clients</li>
              <li><strong>Clients</strong> — référentiel client</li>
            </ul>
            <p className="pt-2">
              Phase 2 (à venir) : intégration IA pour transcription de RDV (Noota), pré-remplissage du recueil
              d&apos;informations et génération automatique de comptes rendus.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
