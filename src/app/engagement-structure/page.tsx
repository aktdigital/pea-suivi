import AppShell from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils";
import { TrendingUp, Banknote, DollarSign, ArrowUpRight } from "lucide-react";
import { EngagementTable } from "@/components/engagement-structure/engagement-table";

export default async function EngagementStructurePage() {
  const supabase = await createClient();

  const { data: produits, error } = await supabase
    .from("produits_structures")
    .select("*")
    .eq("active", true);

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

  // KPIs
  const totalEnveloppe = all.reduce((acc, p) => acc + (p.enveloppe_reservee ?? 0), 0);
  const totalFait = all.reduce((acc, p) => acc + (p.montant_fait ?? 0), 0);
  const totalCaUpFront = all.reduce((acc, p) => acc + (p.ca_up_front ?? 0), 0);
  const totalNewCash = all.reduce((acc, p) => acc + (p.total_new_cash ?? 0), 0);

  const kpis = [
    { label: "Total enveloppe réservée", value: formatCurrency(totalEnveloppe), icon: Banknote },
    { label: "Total enveloppe réalisée", value: formatCurrency(totalFait), icon: TrendingUp },
    { label: "Total CA Up Front", value: formatCurrency(totalCaUpFront), icon: DollarSign },
    { label: "Total New Cash", value: formatCurrency(totalNewCash), icon: ArrowUpRight },
  ];

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Suivi Engagement Structuré</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi opérationnel des produits structurés — enveloppes, réalisations et récap mensuel.
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
            Ligne rouge = enveloppe dépassée (restant &le; 0)
          </span>
        </div>

        {/* Tableau + filtres + récap */}
        <EngagementTable produits={all} />
      </div>
    </AppShell>
  );
}
