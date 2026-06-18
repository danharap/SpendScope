import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";

export function RbcHelpCard() {
  return (
    <Card className="border-blue-100 bg-blue-50/30 shadow-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <HelpCircle className="h-5 w-5 text-blue-600" />
          How to export RBC transactions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
          <li>Log in to RBC Online Banking.</li>
          <li>Find the account or credit card you want to export.</li>
          <li>
            Look for Download Transactions or transaction export options.
          </li>
          <li>Choose the date range.</li>
          <li>
            Download the file as CSV or the closest spreadsheet format
            available.
          </li>
          <li>Upload the file into this app.</li>
          <li>
            Repeat for each account or credit card you want to track.
          </li>
        </ol>
        <p className="mt-4 text-xs text-muted-foreground">
          SpendScope never connects to your bank. Only manually exported CSV
          files are used — no usernames, passwords, or card numbers are stored.
        </p>
      </CardContent>
    </Card>
  );
}
