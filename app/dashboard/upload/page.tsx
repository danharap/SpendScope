import { DashboardHeader } from "@/components/layout/dashboard-header";
import { UploadFlow } from "@/components/upload/upload-flow";
import { getCategories, getAccounts } from "@/lib/actions/accounts";
import { getMerchantRules, getExistingDedupeKeys } from "@/lib/actions/transactions";
import { ensureDefaultCategories } from "@/lib/actions/accounts";

export default async function UploadPage() {
  await ensureDefaultCategories();
  const [categories, accounts, merchantRules, dedupeKeys] = await Promise.all([
    getCategories(),
    getAccounts(),
    getMerchantRules(),
    getExistingDedupeKeys(),
  ]);

  return (
    <>
      <DashboardHeader
        title="Upload CSV"
        description="Import RBC transaction exports"
        showMonthSelector={false}
        months={[]}
      />
      <div className="flex-1 p-6">
        <UploadFlow
          accounts={accounts}
          categories={categories}
          merchantRules={merchantRules}
          existingDedupeKeys={[...dedupeKeys]}
        />
      </div>
    </>
  );
}
