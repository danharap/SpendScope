import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { BudgetPreferencesForm } from "@/components/settings/budget-preferences-form";
import { PageContainer } from "@/components/design/page-container";
import { getUser } from "@/lib/supabase/server";
import { getBudgetPreferences } from "@/lib/actions/settings";

export default async function SettingsPage() {
  const user = await getUser();
  const budgetPrefs = await getBudgetPreferences();

  return (
    <>
      <DashboardHeader
        title="Settings"
        description="Account, privacy, and data management"
        showMonthSelector={false}
        months={[]}
      />
      <PageContainer>
        <BudgetPreferencesForm initial={budgetPrefs} />
        <SettingsPanel email={user?.email ?? ""} />
      </PageContainer>
    </>
  );
}
