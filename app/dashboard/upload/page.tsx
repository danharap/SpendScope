import { DashboardHeader } from "@/components/layout/dashboard-header";
import { UploadFlow } from "@/components/upload/upload-flow";
import { PageContainer } from "@/components/design/page-container";
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
        description="Import bank and credit card transactions from CSV files you export yourself."
        showMonthSelector={false}
        months={[]}
        showCsvBadge
      />
      <PageContainer>
        <UploadFlow
          accounts={accounts}
          categories={categories}
          merchantRules={merchantRules}
          existingDedupeKeys={[...dedupeKeys]}
        />
      </PageContainer>
    </>
  );
}
