import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/design/page-container";
import { EmptyState } from "@/components/design/empty-state";
import { CategoryBadge } from "@/components/design/category-badge";
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
        description="Saved merchant categorization rules for automatic classification"
        showMonthSelector={false}
        months={[]}
      />
      <PageContainer>
        {rules.length === 0 ? (
          <EmptyState
            icon={Store}
            title="No merchant rules yet"
            description='When you categorize a transaction and choose "Create merchant rule", future imports will automatically use that category.'
            actionLabel="View transactions"
            actionHref="/dashboard/transactions"
          />
        ) : (
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="text-base font-semibold">
                {rules.length} merchant rule{rules.length !== 1 ? "s" : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="flex flex-wrap items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:bg-muted/30"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{rule.merchant_name}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        Matches: {rule.match_text}
                      </p>
                    </div>
                    <CategoryBadge
                      name={
                        (rule.categories as { name?: string; color?: string } | null)
                          ?.name ?? "Uncategorized"
                      }
                      color={
                        (rule.categories as { name?: string; color?: string } | null)
                          ?.color
                      }
                    />
                    {rule.is_subscription && (
                      <Badge variant="secondary">Subscription</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </PageContainer>
    </>
  );
}
