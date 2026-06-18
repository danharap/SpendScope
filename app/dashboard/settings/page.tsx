import { DashboardHeader } from "@/components/layout/dashboard-header";
import { SettingsPanel } from "@/components/settings/settings-panel";
import { getUser } from "@/lib/supabase/server";

export default async function SettingsPage() {
  const user = await getUser();

  return (
    <>
      <DashboardHeader
        title="Settings"
        description="Account and data management"
        showMonthSelector={false}
        months={[]}
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <SettingsPanel email={user?.email ?? ""} />
      </div>
    </>
  );
}
