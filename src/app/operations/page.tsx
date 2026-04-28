import AppShell from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function OperationsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Opérations</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Suivi des souscriptions, rachats, arbitrages et autres opérations.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Module en cours d&apos;implémentation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Le tableau des opérations (CRUD complet, filtres par mois / conseiller / statut) sera disponible
            dans la prochaine itération.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
