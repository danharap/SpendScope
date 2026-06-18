import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle, ShieldCheck } from "lucide-react";

export function RbcHelpCard() {
  return (
    <Card className="card-premium border-primary/15 bg-primary/[0.03]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <HelpCircle className="h-5 w-5 text-primary" aria-hidden />
          How to export RBC transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal space-y-2.5 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>Log in to RBC Online Banking.</li>
          <li>Find the account or credit card you want to export.</li>
          <li>Look for Download Transactions or transaction export options.</li>
          <li>Choose the date range.</li>
          <li>Download the file as CSV or the closest spreadsheet format available.</li>
          <li>Upload the file into this app.</li>
          <li>Repeat for each account or credit card you want to track.</li>
        </ol>
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-primary/15 bg-background/80 p-3">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
          <p className="text-xs leading-relaxed text-muted-foreground">
            SpendScope never connects to your bank. Only manually exported CSV
            files are used — no usernames, passwords, or card numbers are stored.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
