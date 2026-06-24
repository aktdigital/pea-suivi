import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ClientInfoForm } from "./client-info-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Client, Conseiller, Operation } from "@/lib/types";
import { ClientOperationsSection } from "@/components/clients/client-operations-section";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: client, error: clientError },
    { data: operations },
    { data: conseillers },
    { data: assistantes },
    { data: refStatuts },
    { data: refOps },
    { data: refProduits },
    { data: refCompagnies },
    { data: allClients },
    { data: produitsStructures },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id, nom, prenom, type_personne, conseiller_code, assistante_profile_id, email, telephone, notes, created_at, updated_at")
      .eq("id", id)
      .single(),
    supabase
      .from("operations")
      .select("id, date, date_fin, type_operation, produit, compagnie, contrat, montant, collecte_type, conseiller_code, statut, support_type, isin, validation, commentaire, courrier_pea, lettre_mission, conformite, controle_par_id, controle_at, date_facturation, created_by, assistante_id, created_at, updated_at, client_id, clients(nom, prenom)")
      .eq("client_id", id)
      .order("date", { ascending: false }),
    supabase.from("conseillers").select("code, full_name, email, active").eq("active", true).order("code"),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["assistante_commerciale", "assistante_admin"])
      .order("full_name"),
    supabase.from("ref_statuts").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("ref_operations").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("ref_produits").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("ref_compagnies").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("clients").select("id, nom, prenom, type_personne, conseiller_code, email, telephone, notes, created_at, updated_at").order("nom"),
    supabase.from("produits_structures").select("isin, nom_produit").eq("active", true).order("nom_produit"),
  ]);

  // Vérification rôle admin/responsable
  const { data: { user } } = await supabase.auth.getUser();
  let canManageRefs = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    canManageRefs = profile?.role === "admin" || profile?.role === "responsable";
  }

  if (clientError || !client) notFound();

  // Cast DB row to app Client type (type_personne is narrowed to TypePersonne)
  const typedClient = client as Client;

  const conseillerMap: Record<string, string> = {};
  for (const c of conseillers ?? []) {
    conseillerMap[c.code] = c.full_name;
  }

  const conseillerLabel = client.conseiller_code
    ? `${conseillerMap[client.conseiller_code] ?? client.conseiller_code} (${client.conseiller_code})`
    : "—";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <Link
            href="/clients"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            <ArrowLeft className="size-3.5" /> Retour aux clients
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {client.nom} {client.prenom ?? ""}
            </h1>
            <Badge variant={client.type_personne === "morale" ? "secondary" : "outline"}>
              {client.type_personne === "morale" ? "Personne morale" : "Personne physique"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">Conseiller : {conseillerLabel}</p>
        </div>

        {/* Section Informations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientInfoForm client={typedClient} conseillers={conseillers ?? []} assistantes={assistantes ?? []} operationsCount={operations?.length ?? 0} />
          </CardContent>
        </Card>

        {/* Section Opérations */}
        <ClientOperationsSection
          operations={(operations ?? []) as Operation[]}
          clients={(allClients ?? []) as Client[]}
          conseillers={(conseillers ?? []) as Conseiller[]}
          typeOps={refOps ?? []}
          produits={refProduits ?? []}
          statuts={refStatuts ?? []}
          compagnies={refCompagnies ?? []}
          produitsStructures={produitsStructures ?? []}
          canManageRefs={canManageRefs}
        />

        {/* Section Bilans — masquée */}
      </div>
    </AppShell>
  );
}
