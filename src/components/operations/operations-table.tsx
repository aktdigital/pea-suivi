import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { OperationRowActions } from "./operation-row-actions";
import type { Client, Conseiller, Operation } from "@/lib/types";

interface OperationsTableProps {
  mois?: string;
  conseiller?: string;
  statut?: string;
  type?: string;
  q?: string;
  clients: Client[];
  conseillers: Conseiller[];
  typeOps: { id: number; label: string }[];
  produits: { id: number; label: string }[];
  statuts: { id: number; label: string }[];
  compagnies: { id: number; label: string }[];
  produitsStructures: { isin: string; nom_produit: string }[];
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
    <div className="rounded-lg border overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Date</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Opération</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Client</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Produit</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Compagnie / Contrat</th>
            <th className="text-right px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Montant</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Collecte</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Conseiller</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Statut</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Support</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">ISIN</th>
            <th className="text-center px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Validé</th>
            <th className="text-left px-3 py-2 font-medium text-muted-foreground whitespace-nowrap">Commentaire</th>
            <th className="px-3 py-2 font-medium text-muted-foreground"></th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((op, i) => (
            <tr key={op.id} className={`border-b last:border-0 hover:bg-muted/30 ${i % 2 === 0 ? "" : "bg-muted/10"}`}>
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
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs">✓</span>
                ) : (
                  <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-muted text-muted-foreground text-xs">—</span>
                )}
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
