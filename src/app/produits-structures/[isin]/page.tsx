import Link from "next/link";
import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate, isRachat } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import type { Client, Conseiller } from "@/lib/types";
import { OperationFormButton } from "@/components/operations/operation-form";
import { IsinOperationsTable, type IsinLigne } from "@/components/produits-structures/isin-operations-table";
import { ModifierProduitDialog } from "@/components/produits-structures/modifier-produit-dialog";

interface PageProps {
  params: Promise<{ isin: string }>;
}

function formatPct(v: string | null | undefined): string {
  if (!v) return "—";
  const trimmed = v.trim();
  if (trimmed.includes("%") || /[a-zA-Z]/.test(trimmed)) return trimmed;
  const num = parseFloat(trimmed.replace(",", "."));
  if (Number.isNaN(num)) return trimmed;
  return new Intl.NumberFormat("fr-FR", {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(num);
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs uppercase tracking-wide text-pea-gray font-medium">{label}</span>
      <span className="text-sm font-medium text-pea-blue">{value ?? "—"}</span>
    </div>
  );
}

export default async function ProduitDetailPage({ params }: PageProps) {
  const { isin } = await params;
  const decodedIsin = decodeURIComponent(isin);

  const supabase = await createClient();

  const [
    { data: produit },
    { data: lignesRaw },
    { data: conseillers },
    { data: refStatuts },
    { data: refOps },
    { data: refProduits },
    { data: refCompagnies },
    { data: clients },
    { data: produitsStructures },
    { data: refFrequences },
    { data: refStructureurs },
    { data: allForDistinct },
  ] = await Promise.all([
    supabase
      .from("produits_structures")
      .select("isin, nom_produit, sous_jacent, mecanisme, duree, frequence_rappel, protection_gain, protection_capital, degressivite, objectif_rendement, eligible_contrats, upfront_brut, date_fin_commercialisation, enveloppe_reservee, montant_fait, restant_a_faire, compagnies_cibles, commentaire, active, structureur, total_new_cash, total_encours, ca_up_front, mois_creation, date_facturation, statut_facturation, date_constatation_initiale")
      .eq("isin", decodedIsin)
      .single(),
    // Requête sur operation_lignes pour obtenir la quote-part de ce produit
    supabase
      .from("operation_lignes")
      .select("montant, isin, operations(id, date, type_operation, compagnie, contrat, collecte_type, statut, conseiller_code, date_facturation, client_id, commentaire, produit, isin, clients(id, nom, prenom))")
      .eq("isin", decodedIsin),
    supabase.from("conseillers").select("code, full_name, email, active").eq("active", true).order("code"),
    supabase.from("ref_statuts").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("ref_operations").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("ref_produits").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("ref_compagnies").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("clients").select("id, nom, prenom, type_personne, conseiller_code, email, telephone, notes, created_at, updated_at").order("nom"),
    supabase.from("produits_structures").select("isin, nom_produit").eq("active", true).order("nom_produit"),
    supabase.from("ref_frequences").select("id, label, ordre").order("ordre"),
    supabase.from("ref_structureurs").select("id, label, ordre, active").eq("active", true).order("ordre"),
    supabase.from("produits_structures").select("mecanisme, duree, eligible_contrats").eq("active", true),
  ]);

  if (!produit) notFound();

  // Listes pour le dialog de modification
  function unique(arr: (string | null | undefined)[]): string[] {
    return [...new Set(arr.filter((v): v is string => Boolean(v)))].sort();
  }
  const mecanismes = unique((allForDistinct ?? []).map((p) => p.mecanisme));
  const durees = unique((allForDistinct ?? []).map((p) => p.duree));
  const eligibleContrats = unique((allForDistinct ?? []).map((p) => p.eligible_contrats));
  const structureurs = (refStructureurs ?? []).map((s) => s.label);
  const frequences = (refFrequences ?? []).map((f) => f.label);

  // Calcul canManageRefs pour ce user
  const { data: { user } } = await supabase.auth.getUser();
  let canManageRefs = false;
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    canManageRefs = profile?.role === "admin" || profile?.role === "responsable" || profile?.role === "assistante_admin";
  }

  const pct = produit.enveloppe_reservee && produit.montant_fait
    ? Math.min((produit.montant_fait / produit.enveloppe_reservee) * 100, 100)
    : 0;
  const isOver = produit.enveloppe_reservee && produit.montant_fait
    ? produit.montant_fait > produit.enveloppe_reservee
    : false;

  // Calcul des agrégats depuis les operation_lignes
  type LigneRaw = {
    montant: number | null;
    isin: string | null;
    operations: {
      id: string;
      date: string;
      type_operation: string | null;
      compagnie: string | null;
      contrat: string | null;
      collecte_type: string | null;
      statut: string | null;
      conseiller_code: string | null;
      date_facturation: string | null;
      client_id: string | null;
      commentaire: string | null;
      produit: string | null;
      isin: string | null;
      clients: { id?: string | null; nom: string; prenom: string | null } | null;
    } | null;
  };

  const lignes: LigneRaw[] = (lignesRaw ?? []) as LigneRaw[];

  const totalNewCash = lignes
    .filter((l) => l.operations?.collecte_type === "new_cash")
    .reduce((acc, l) => acc + (l.montant ?? 0), 0);
  const totalEncours = lignes
    .filter((l) => l.operations?.collecte_type === "encours")
    .reduce((acc, l) => acc + (isRachat(l.operations?.type_operation) ? -1 : 1) * (l.montant ?? 0), 0);
  const totalMontant = lignes.reduce((acc, l) => acc + (l.montant ?? 0), 0);

  // Construire les IsinLigne pour le composant table
  const isinLignes: IsinLigne[] = lignes
    .filter((l) => l.operations !== null)
    .map((l) => ({
      montant: l.montant,
      isin: l.isin,
      operations: l.operations!,
    }));

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <Link
            href="/produits-structures"
            className="inline-flex items-center gap-2 text-sm text-pea-gray hover:text-pea-teal transition-colors"
          >
            <ArrowLeft className="size-4" />
            Retour aux produits structurés
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-serif font-semibold tracking-tight text-pea-blue">
                {produit.nom_produit}
              </h1>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="font-mono text-xs border-pea-blue/30 text-pea-blue">
                  {produit.isin}
                </Badge>
                {produit.structureur && (
                  <Badge variant="secondary" className="text-xs">
                    {produit.structureur}
                  </Badge>
                )}
                {produit.mecanisme && (
                  <Badge variant="info" className="text-xs">
                    {produit.mecanisme}
                  </Badge>
                )}
                {!produit.active && (
                  <Badge variant="destructive" className="text-xs">Inactif</Badge>
                )}
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              <ModifierProduitDialog
                produit={produit as import("@/lib/types").ProduitStructure}
                mecanismes={mecanismes}
                durees={durees}
                frequences={frequences}
                eligibleContrats={eligibleContrats}
                compagnies={refCompagnies ?? []}
                structureurs={structureurs}
              />
              <OperationFormButton
                clients={(clients ?? []) as Client[]}
                conseillers={(conseillers ?? []) as Conseiller[]}
                typeOps={refOps ?? []}
                produits={refProduits ?? []}
                statuts={refStatuts ?? []}
                compagnies={refCompagnies ?? []}
                produitsStructures={produitsStructures ?? []}
                defaultIsin={decodedIsin}
                canManageRefs={canManageRefs}
              />
            </div>
          </div>
        </div>

        {/* Section caractéristiques */}
        <Card className="border-pea-gray/20">
          <CardHeader className="border-b border-pea-gray/20 pb-4">
            <CardTitle className="text-base font-serif text-pea-blue">Caractéristiques du produit</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Colonne 1 */}
              <div className="space-y-4">
                <Row label="Sous-jacent" value={produit.sous_jacent} />
                <Row label="Mécanisme" value={produit.mecanisme} />
                <Row label="Durée" value={produit.duree} />
                <Row label="Date de constatation initiale" value={formatDate(produit.date_constatation_initiale)} />
                <Row label="Fréquence rappel" value={produit.frequence_rappel} />
                <Row label="Date fin commercialisation" value={formatDate(produit.date_fin_commercialisation)} />
                <Row label="Éligible contrats" value={produit.eligible_contrats} />
                <Row label="Compagnies cibles" value={produit.compagnies_cibles} />
              </div>
              {/* Colonne 2 */}
              <div className="space-y-4">
                <Row label="Protection gain" value={formatPct(produit.protection_gain)} />
                <Row label="Protection capital" value={formatPct(produit.protection_capital)} />
                <Row label="Dégressivité" value={produit.degressivite} />
                <Row label="Objectif rendement" value={formatPct(produit.objectif_rendement)} />
                <Row label="Upfront brut" value={formatPct(produit.upfront_brut)} />
                <Row label="Structureur" value={produit.structureur} />
                <Row label="Mois création" value={produit.mois_creation} />
              </div>
            </div>

            {produit.commentaire && (
              <div className="mt-6 pt-6 border-t border-pea-gray/20">
                <p className="text-xs uppercase tracking-wide text-pea-gray font-medium mb-2">Commentaire</p>
                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{produit.commentaire}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section suivi enveloppe */}
        <div className="space-y-3">
          <h2 className="text-lg font-serif font-semibold text-pea-blue">Suivi enveloppe</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="border-pea-gray/20 bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-xs font-medium text-pea-gray uppercase tracking-wide">Enveloppe réservée</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="text-2xl font-serif font-semibold text-pea-blue">
                  {formatCurrency(produit.enveloppe_reservee)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-pea-gray/20 bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-xs font-medium text-pea-gray uppercase tracking-wide">Montant fait</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="text-2xl font-serif font-semibold text-pea-blue">
                  {formatCurrency(produit.montant_fait)}
                </div>
                {produit.enveloppe_reservee !== null && (
                  <div className="mt-2 space-y-1">
                    <div className="flex justify-between text-xs text-pea-gray">
                      <span>Progression</span>
                      <span>{Math.round(pct)} %</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-pea-gray/20 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isOver ? "bg-destructive" : "bg-pea-teal"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-pea-gray/20 bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-xs font-medium text-pea-gray uppercase tracking-wide">Restant à faire</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className={`text-2xl font-serif font-semibold ${(produit.restant_a_faire ?? 0) <= 0 ? "text-destructive" : "text-pea-teal"}`}>
                  {formatCurrency(produit.restant_a_faire)}
                </div>
              </CardContent>
            </Card>
            <Card className="border-pea-gray/20 bg-white">
              <CardHeader className="pb-2 px-5 pt-5">
                <CardTitle className="text-xs font-medium text-pea-gray uppercase tracking-wide">CA Up Front</CardTitle>
              </CardHeader>
              <CardContent className="px-5 pb-5">
                <div className="text-2xl font-serif font-semibold text-pea-gold">
                  {formatCurrency(produit.ca_up_front)}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Section détail investisseurs */}
        <div className="space-y-3">
          <h2 className="text-lg font-serif font-semibold text-pea-blue">Détail investisseurs</h2>
          <IsinOperationsTable
            lignes={isinLignes}
            totalMontant={totalMontant}
            totalNewCash={totalNewCash}
            totalEncours={totalEncours}
            restantAFaire={produit.restant_a_faire ?? null}
            editRefs={{
              clients: (clients ?? []) as Client[],
              conseillers: (conseillers ?? []) as Conseiller[],
              typeOps: refOps ?? [],
              produits: refProduits ?? [],
              statuts: refStatuts ?? [],
              compagnies: refCompagnies ?? [],
              produitsStructures: produitsStructures ?? [],
              canManageRefs,
            }}
          />
        </div>
      </div>
    </AppShell>
  );
}
