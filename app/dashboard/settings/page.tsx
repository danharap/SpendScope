import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { BudgetPreferencesForm } from "@/components/settings/budget-preferences-form";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { PageContainer } from "@/components/design/page-container";
import { SectionHeader } from "@/components/design/section-header";
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
        <div className="flex items-center justify-between gap-4">
          <SectionHeader
            title="Appearance"
            description="Dark mode is the default. Switch to light mode anytime."
          />
          <ThemeToggle />
        </div>
        <BudgetPreferencesForm initial={budgetPrefs} />
        <SettingsPanel email={user?.email ?? ""} />
      </PageContainer>
    </>
  );
}
