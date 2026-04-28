import AppShell from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ClientsPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Référentiel des clients du cabinet.
          </p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Module en cours d&apos;implémentation</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            La liste des clients sera disponible dans la prochaine itération.
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
