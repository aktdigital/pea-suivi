import AppShell from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BilansPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bilans</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Planning annuel des bilans clients par mois.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Module en cours d&apos;implémentation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Le suivi des bilans annuels sera disponible dans la prochaine itération.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
