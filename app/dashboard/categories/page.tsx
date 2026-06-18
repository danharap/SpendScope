import { DashboardHeader } from "@/components/layout/dashboard-header";
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
        description="Spending categories for transaction classification"
        showMonthSelector={false}
        months={[]}
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Default Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {defaults.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span className="font-medium">{cat.name}</span>
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Default
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {custom.length > 0 && (
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Custom Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {custom.map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 rounded-lg border p-3"
                  >
                    <span
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="font-medium">{cat.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <p className="text-sm text-muted-foreground">
          Categories are assigned automatically during CSV import based on
          merchant keywords. You can override categories on the Transactions
          page and save merchant rules for future imports.
        </p>
      </div>
    </>
  );
}
