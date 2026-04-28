import AppShell from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Banknote, Target, CalendarClock } from "lucide-react";
import { EngagementTable } from "@/components/engagement-structure/engagement-table";

export default async function EngagementStructurePage() {
  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const { data: produits, error } = await supabase
    .from("produits_structures")
    .select("*")
    .eq("active", true)
    .order("date_fin_commercialisation", { ascending: true });

  if (error) {
    return (
      <AppShell>
        <div className="text-sm text-destructive p-4 border rounded-md">
          Erreur lors du chargement : {error.message}
        </div>
      </AppShell>
    );
  }

  const all = produits ?? [];
  const produitsEnCours = all.filter(
    (p) => p.date_fin_commercialisation && p.date_fin_commercialisation >= today
  );
  const produitsExpires = all.filter(
    (p) => !p.date_fin_commercialisation || p.date_fin_commercialisation < today
  );

  // KPIs
  const totalEnveloppe = all.reduce((acc, p) => acc + (p.enveloppe_reservee ?? 0), 0);
  const totalFait = all.reduce((acc, p) => acc + (p.montant_fait ?? 0), 0);
  const totalRestant = all.reduce((acc, p) => acc + (p.restant_a_faire ?? 0), 0);
  const nbProduitsActifsEnCours = produitsEnCours.length;

  const kpis = [
    { label: "Total enveloppe", value: formatCurrency(totalEnveloppe), icon: Banknote },
    { label: "Total montant fait", value: formatCurrency(totalFait), icon: TrendingUp },
    { label: "Total restant à faire", value: formatCurrency(totalRestant), icon: Target },
    { label: "Produits actifs en cours", value: nbProduitsActifsEnCours, icon: CalendarClock },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suivi Engagement Structuré</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi opérationnel des produits structurés — enveloppes, réalisations et alertes urgence.
          </p>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <Card key={k.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{k.label}</CardTitle>
                <k.icon className="size-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold">{k.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Légende alertes */}
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-3 rounded bg-red-200"></span>
            Ligne rouge = dépassement ou date fin dans moins de 7 jours
          </span>
        </div>

        {/* Titre section en cours */}
        <div>
          <h2 className="text-base font-semibold mb-3">
            Produits en cours de commercialisation ({produitsEnCours.length})
          </h2>
          <EngagementTable
            produitsEnCours={produitsEnCours}
            produitsExpires={produitsExpires}
          />
        </div>
      </div>
    </AppShell>
  );
}
