import { Suspense } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { RecategorizeButton } from "@/components/transactions/recategorize-button";
import { PageContainer } from "@/components/design/page-container";
import { Card } from "@/components/ui/card";
import { getCategories, getAccounts } from "@/lib/actions/accounts";
import { getTransactions } from "@/lib/actions/transactions";
import { Skeleton } from "@/components/ui/skeleton";
import type { TransactionWithRelations } from "@/types/database";

type SearchParams = {
  startDate?: string;
  endDate?: string;
  accountId?: string;
  categoryId?: string;
  merchant?: string;
  needsReview?: string;
  isIncome?: string;
  subscriptionsOnly?: string;
};

interface TransactionsPageProps {
  searchParams: Promise<SearchParams>;
}

async function TransactionsContent({ params }: { params: SearchParams }) {
  const categories = await getCategories();
  const accounts = await getAccounts();

  const transactions = (await getTransactions({
    startDate: params.startDate,
    endDate: params.endDate,
    accountId: params.accountId,
    categoryId: params.categoryId,
    merchant: params.merchant,
    needsReview: params.needsReview === "true",
    isIncome:
      params.isIncome === "true"
        ? true
        : params.isIncome === "false"
          ? false
          : undefined,
    subscriptionsOnly: params.subscriptionsOnly === "true",
  })) as TransactionWithRelations[];

  return (
    <>
      <DashboardHeader
        title="Transactions"
        description={`${transactions.length.toLocaleString()} transactions from your uploaded CSV files`}
        showMonthSelector={false}
        months={[]}
        showUploadButton
      />
      <PageContainer>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <RecategorizeButton
            needsReviewOnly={params.needsReview === "true"}
            className="sm:order-2"
          />
        </div>
        <TransactionFilters categories={categories} accounts={accounts} />
        <Card className="card-premium overflow-hidden">
          <TransactionsTable
            transactions={transactions}
            categories={categories}
          />
        </Card>
      </PageContainer>
    </>
  );
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const params = await searchParams;

  return (
    <Suspense
      fallback={
        <PageContainer>
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-96 w-full rounded-2xl" />
        </PageContainer>
      }
    >
      <TransactionsContent params={params} />
    </Suspense>
  );
}
