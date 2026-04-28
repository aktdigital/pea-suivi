import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { OperationRowActions } from "./operation-row-actions";
import type { Client, Conseiller, Operation, StatutControle } from "@/lib/types";

interface OperationsTableProps {
  mois?: string;
  conseiller?: string;
  statut?: string;
  type?: string;
  q?: string;
  controleAFaire?: boolean;
  clients: Client[];
  conseillers: Conseiller[];
  typeOps: { id: number; label: string }[];
  produits: { id: number; label: string }[];
  statuts: { id: number; label: string }[];
  compagnies: { id: number; label: string }[];
  produitsStructures: { isin: string; nom_produit: string }[];
}

function getControleVariant(statut: StatutControle | null | undefined): "default" | "success" | "warning" | "destructive" | "outline" | "secondary" | "info" {
  if (!statut || statut === "a_faire") return "destructive";
  if (statut === "so") return "secondary";
  if (statut === "ok" || statut === "valide") return "success";
  if (statut === "en_attente_avenants") return "warning";
  if (statut === "en_cours_compagnie") return "info";
  return "outline";
}

function getControleLabel(statut: StatutControle | null | undefined): string {
  if (!statut || statut === "a_faire") return "À faire";
  if (statut === "so") return "S/O";
  if (statut === "ok") return "OK";
  if (statut === "valide") return "Validé";
  if (statut === "en_attente_avenants") return "En attente";
  if (statut === "en_cours_compagnie") return "En cours";
  return statut;
}

function getStatutVariant(statut: string | null): "default" | "success" | "warning" | "destructive" | "outline" {
  if (!statut) return "outline";
  const s = statut.toLowerCase();
  if (s.includes("valid") || s.includes("récupéré")) return "success";
  if (s.includes("refus") || s.includes("annul")) return "destructive";
  if (s.includes("attente") || s.includes("en cours")) return "warning";
  return "secondary" as "default";
}

export async function OperationsTable({
  mois,
  conseiller,
  statut,
  type,
  q,
  controleAFaire,
  clients,
  conseillers,
  typeOps,
  produits,
  statuts,
  compagnies,
  produitsStructures,
}: OperationsTableProps) {
  const supabase = await createClient();

  let query = supabase
    .from("operations")
    .select("*, clients(nom, prenom)")
    .order("date", { ascending: false });

  if (controleAFaire) {
    query = query.or("courrier_pea.eq.a_faire,lettre_mission.eq.a_faire,conformite.eq.a_faire");
  }

  // Filtre période
  if (mois) {
    const [year, month] = mois.split("-");
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    query = query
      .gte("date", `${year}-${month}-01`)
      .lte("date", `${year}-${month}-${lastDay}`);
  }

  if (conseiller) query = query.eq("conseiller_code", conseiller);
  if (statut) query = query.eq("statut", statut);
  if (type) query = query.eq("type_operation", type);

  const { data: operations, error } = await query;

  if (error) {
    return (
      <div className="text-sm text-destructive p-4 border rounded-md">
        Erreur lors du chargement des opérations : {error.message}
      </div>
    );
  }

  type OpWithClient = Operation & { clients?: { nom: string; prenom: string | null } | null };

  let filtered: OpWithClient[] = (operations ?? []) as OpWithClient[];

  // Filtre recherche client côté serveur
  if (q) {
    const lq = q.toLowerCase();
    filtered = filtered.filter((op) => {
      const clientName = op.clients
        ? `${op.clients.nom} ${op.clients.prenom ?? ""}`.toLowerCase()
        : "";
      return clientName.includes(lq);
    });
  }

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        <p className="text-sm">Aucune opération pour ces filtres.</p>
        <p className="text-xs mt-1">Cliquez sur &quot;+ Nouvelle opération&quot; pour en créer une.</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-pea-gray/20 overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-pea-blue/5">
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Date</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Opération</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Client</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Produit</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Compagnie / Contrat</th>
            <th className="text-right px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Montant</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Collecte</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Conseiller</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Statut</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Support</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">ISIN</th>
            <th className="text-center px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Validé</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Courrier PEA</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Lettre mission</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Conformité</th>
            <th className="text-left px-3 py-2 font-medium text-pea-blue uppercase tracking-wide text-xs whitespace-nowrap">Commentaire</th>
            <th className="px-3 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((op, i) => (
            <tr key={op.id} className={`border-b border-pea-gray/20 last:border-0 hover:bg-pea-teal/5 ${i % 2 === 0 ? "bg-white" : "bg-pea-cream"}`}>
              <td className="px-3 py-2 whitespace-nowrap">{formatDate(op.date)}</td>
              <td className="px-3 py-2 whitespace-nowrap">{op.type_operation ?? "—"}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                {op.clients ? `${op.clients.nom} ${op.clients.prenom ?? ""}`.trim() : "—"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{op.produit ?? "—"}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                <div>{op.compagnie ?? "—"}</div>
                {op.contrat && <div className="text-xs text-muted-foreground">{op.contrat}</div>}
              </td>
              <td className="px-3 py-2 text-right whitespace-nowrap font-medium">
                {formatCurrency(op.montant)}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {op.collecte_type === "new_cash" ? (
                  <Badge variant="info">New Cash</Badge>
                ) : op.collecte_type === "encours" ? (
                  <Badge variant="secondary">Encours</Badge>
                ) : "—"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">{op.conseiller_code ?? "—"}</td>
              <td className="px-3 py-2 whitespace-nowrap">
                {op.statut ? (
                  <Badge variant={getStatutVariant(op.statut)}>{op.statut}</Badge>
                ) : "—"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                {op.support_type === "papier" ? "Papier" : op.support_type === "ligne" ? "Ligne" : "—"}
              </td>
              <td className="px-3 py-2 whitespace-nowrap text-xs text-muted-foreground">
                {op.isin ?? "—"}
              </td>
              <td className="px-3 py-2 text-center">
                {op.validation ? (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pea-teal/15 text-pea-teal text-xs">✓</span>
                ) : (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-pea-gray/15 text-pea-gray text-xs">—</span>
                )}
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <Badge variant={getControleVariant(op.courrier_pea as StatutControle)}>
                  {getControleLabel(op.courrier_pea as StatutControle)}
                </Badge>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <Badge variant={getControleVariant(op.lettre_mission as StatutControle)}>
                  {getControleLabel(op.lettre_mission as StatutControle)}
                </Badge>
              </td>
              <td className="px-3 py-2 whitespace-nowrap">
                <Badge variant={getControleVariant(op.conformite as StatutControle)}>
                  {getControleLabel(op.conformite as StatutControle)}
                </Badge>
              </td>
              <td className="px-3 py-2 max-w-[150px]">
                <span className="block truncate text-xs text-muted-foreground" title={op.commentaire ?? ""}>
                  {op.commentaire ?? "—"}
                </span>
              </td>
              <td className="px-3 py-2">
                <OperationRowActions
                  operation={op}
                  clients={clients}
                  conseillers={conseillers}
                  typeOps={typeOps}
                  produits={produits}
                  statuts={statuts}
                  compagnies={compagnies}
                  produitsStructures={produitsStructures}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
