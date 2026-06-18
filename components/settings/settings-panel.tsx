"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { deleteAllUserData } from "@/lib/actions/settings";
import { createClient } from "@/lib/supabase/client";
import { Shield, Trash2, LogOut, AlertTriangle, FileSpreadsheet, Lock } from "lucide-react";
import { toast } from "sonner";

interface SettingsPanelProps {
  email: string;
}

export function SettingsPanel({ email }: SettingsPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  const handleDeleteData = () => {
    if (
      !confirm(
        "This will permanently delete all your transactions, imports, budgets, and merchant rules. This cannot be undone."
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteAllUserData();
      if (result.error) toast.error(result.error);
      else {
        toast.success("All data deleted");
        router.refresh();
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="card-premium">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Profile</CardTitle>
          <CardDescription>Your SpendScope account</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Email</p>
            <p className="font-medium">{email}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" aria-hidden />
            Sign out
          </Button>
        </CardContent>
      </Card>

      <Card className="card-premium overflow-hidden">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold">
            <Shield className="h-5 w-5 text-primary" aria-hidden />
            Privacy & security
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                icon: FileSpreadsheet,
                title: "CSV-only app",
                text: "Import files you export yourself",
              },
              {
                icon: Lock,
                title: "No bank login",
                text: "Credentials are never requested or stored",
              },
              {
                icon: Shield,
                title: "Protected data",
                text: "Supabase auth and row-level security",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-border/60 bg-muted/20 p-4"
              >
                <item.icon className="h-5 w-5 text-primary" aria-hidden />
                <p className="mt-2 text-sm font-medium">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {item.text}
                </p>
              </div>
            ))}
          </div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>• No connection to RBC or any financial institution</li>
            <li>• Only you can access your transactions</li>
            <li>• Delete all imported data anytime below</li>
          </ul>
        </CardContent>
      </Card>

      <Separator />

      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" aria-hidden />
        <AlertTitle>Danger zone</AlertTitle>
        <AlertDescription>
          Deleting all data removes every transaction, import record, budget,
          and merchant rule. Your account will remain active.
        </AlertDescription>
      </Alert>

      <Button
        variant="destructive"
        onClick={handleDeleteData}
        disabled={pending}
      >
        <Trash2 className="mr-2 h-4 w-4" aria-hidden />
        Delete all imported data
      </Button>
    </div>
  );
}
