import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { ReferentielsManager } from "@/components/referentiels/referentiels-manager";
import { BookOpen } from "lucide-react";

export default async function ReferentielsPage() {
  const supabase = await createClient();

  // Vérification du rôle : admin ou responsable uniquement
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "responsable") {
    redirect("/");
  }

  // Chargement de toutes les tables (SANS filtre active — l'admin voit tout)
  const [
    { data: compagnies },
    { data: produits },
    { data: operations },
    { data: statuts },
    { data: supports },
    { data: structureurs },
    { data: frequences },
  ] = await Promise.all([
    supabase.from("ref_compagnies").select("id, label, ordre, active").order("ordre"),
    supabase.from("ref_produits").select("id, label, ordre, active").order("ordre"),
    supabase.from("ref_operations").select("id, label, ordre, active, code").order("ordre"),
    supabase.from("ref_statuts").select("id, label, ordre, active, is_final").order("ordre"),
    supabase.from("ref_supports").select("id, label, ordre, active").order("ordre"),
    supabase.from("ref_structureurs").select("id, label, ordre, active").order("ordre"),
    supabase.from("ref_frequences").select("id, label, ordre").order("ordre"),
  ]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="pb-4 border-b border-pea-gray/30">
          <div className="flex items-center gap-3">
            <BookOpen className="size-7 text-pea-teal" />
            <div>
              <h1 className="text-3xl font-serif font-semibold tracking-tight text-pea-blue">
                Référentiels
              </h1>
              <p className="text-sm text-pea-gray mt-1">
                Gérer les listes de référence : renommer, réordonner et activer/désactiver les valeurs.
              </p>
            </div>
          </div>
        </div>

        <ReferentielsManager
          compagnies={compagnies ?? []}
          produits={produits ?? []}
          operations={operations ?? []}
          statuts={statuts ?? []}
          supports={supports ?? []}
          structureurs={structureurs ?? []}
          frequences={frequences ?? []}
        />
      </div>
    </AppShell>
  );
}
