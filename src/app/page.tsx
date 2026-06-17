import AppShell from "@/components/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { MOIS } from "@/lib/utils";
import { BilanHebdoTabs } from "@/components/dashboard/bilan-tabs";
import { ActiviteFilters } from "@/components/dashboard/activite-filters";

export default async function DashboardPage() {
  const supabase = await createClient();

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Toutes les opérations 2026 (mutualisé pour BilanHebdoTabs + ActiviteFilters)
  const [
    { data: ops2026Raw },
    { data: profiles },
    { data: conseillers },
  ] = await Promise.all([
    supabase
      .from("operations")
      .select("date, type_operation, montant, collecte_type, conseiller_code, created_by, assistante_id")
      .gte("date", "2026-01-01")
      .lte("date", "2026-12-31"),
    supabase
      .from("profiles")
      .select("id, full_name, email, role"),
    supabase
      .from("conseillers")
      .select("code, full_name")
      .eq("active", true)
      .order("code"),
  ]);

  const ops2026 = ops2026Raw ?? [];

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="pb-4 border-b border-pea-gray/30">
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-pea-blue">Tableau de bord</h1>
          <p className="text-sm text-pea-gray mt-1">
            Vue d&apos;ensemble de l&apos;activité — {MOIS[month - 1]} {year}
          </p>
        </div>

        {/* Bilan hebdomadaire filtrable */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bilan hebdomadaire</CardTitle>
          </CardHeader>
          <BilanHebdoTabs
            operations={ops2026}
            profiles={profiles ?? []}
            conseillers={conseillers ?? []}
          />
        </Card>

        {/* Activité par assistante & conseiller avec filtre mois */}
        <ActiviteFilters
          operations={ops2026}
          profiles={profiles ?? []}
        />
      </div>
    </AppShell>
  );
}
