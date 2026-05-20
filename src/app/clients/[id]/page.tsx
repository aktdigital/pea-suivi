import { notFound } from "next/navigation";
import AppShell from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { ClientInfoForm } from "./client-info-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single(),
    supabase
      .from("operations")
      .select("*")
      .eq("client_id", id)
      .order("date", { ascending: false }),
    supabase.from("conseillers").select("code, full_name").eq("active", true).order("code"),
    supabase
      .from("profiles")
      .select("id, full_name, email, role")
      .in("role", ["assistante_commerciale", "assistante_admin"])
      .order("full_name"),
  ]);

  if (clientError || !client) notFound();

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
            <ClientInfoForm client={client} conseillers={conseillers ?? []} assistantes={assistantes ?? []} />
          </CardContent>
        </Card>

        {/* Section Opérations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Opérations ({(operations ?? []).length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {(operations ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground px-6 pb-4">
                Aucune opération enregistrée pour ce client.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Date</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Type</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Produit</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Compagnie</th>
                      <th className="text-right px-4 py-2 font-medium text-muted-foreground">Montant</th>
                      <th className="text-left px-4 py-2 font-medium text-muted-foreground">Statut</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(operations ?? []).map((op, i) => (
                      <tr
                        key={op.id}
                        className={`border-b last:border-0 ${i % 2 === 0 ? "" : "bg-muted/10"}`}
                      >
                        <td className="px-4 py-2 whitespace-nowrap">{formatDate(op.date)}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{op.type_operation ?? "—"}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{op.produit ?? "—"}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{op.compagnie ?? "—"}</td>
                        <td className="px-4 py-2 text-right whitespace-nowrap font-medium">
                          {formatCurrency(op.montant)}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {op.statut ? (
                            <Badge variant="outline">{op.statut}</Badge>
                          ) : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section Bilans — masquée */}
      </div>
    </AppShell>
  );
}
