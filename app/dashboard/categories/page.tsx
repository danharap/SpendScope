import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageContainer } from "@/components/design/page-container";
import { CategoryBadge } from "@/components/design/category-badge";
import { getCategories } from "@/lib/actions/accounts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function CategoriesPage() {
  const categories = await getCategories();
  const defaults = categories.filter((c) => c.is_default);
  const custom = categories.filter((c) => !c.is_default);

  return (
    <>
      <DashboardHeader
        title="Categories"
        description="Spending categories used to classify your transactions"
        showMonthSelector={false}
        months={[]}
      />
      <PageContainer>
        <Card className="card-premium">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Default categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {defaults.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
                >
                  <CategoryBadge name={cat.name} color={cat.color} />
                  <Badge variant="outline" className="ml-auto text-xs">
                    Default
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {custom.length > 0 && (
          <Card className="card-premium">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Custom categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {custom.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 p-4"
                  >
                    <CategoryBadge name={cat.name} color={cat.color} />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-sm leading-relaxed text-muted-foreground">
          Categories are assigned automatically during CSV import based on
          merchant keywords. Override categories on the Transactions page and
          save merchant rules for future imports.
        </p>
      </PageContainer>
    </>
  );
}
