import AppShell from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BilansPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div className="pb-4 border-b border-pea-gray/30">
          <h1 className="text-3xl font-serif font-semibold tracking-tight text-pea-blue">Bilans</h1>
          <p className="text-sm text-pea-gray mt-1">
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
