import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getMerchantRules } from "@/lib/actions/transactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store } from "lucide-react";

export default async function MerchantsPage() {
  const rules = await getMerchantRules();

  return (
    <>
      <DashboardHeader
        title="Merchants"
        description="Saved merchant categorization rules"
        showMonthSelector={false}
        months={[]}
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        {rules.length === 0 ? (
          <Card className="shadow-sm">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Store className="mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg font-medium">No merchant rules yet</p>
              <p className="mt-1 max-w-md text-center text-sm text-muted-foreground">
                When you categorize a transaction and choose &quot;Create merchant
                rule&quot;, future imports will automatically use that category.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">
                {rules.length} Merchant Rule{rules.length !== 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-wrap items-center gap-3 rounded-lg border p-4"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{rule.merchant_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Matches: {rule.match_text}
                      </p>
                    </div>
                    <Badge variant="secondary">
                      {(rule.categories as { name?: string } | null)?.name ??
                        "Uncategorized"}
                    </Badge>
                    {rule.is_subscription && (
                      <Badge>Subscription</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
}
