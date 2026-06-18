import { Suspense } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
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
        description={`${transactions.length} transactions`}
        showMonthSelector={false}
        months={[]}
      />
      <div className="flex flex-1 flex-col gap-6 p-6">
        <TransactionFilters categories={categories} accounts={accounts} />
        <TransactionsTable
          transactions={transactions}
          categories={categories}
        />
      </div>
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
        <div className="p-6">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="mt-6 h-96 w-full" />
        </div>
      }
    >
      <TransactionsContent params={params} />
    </Suspense>
  );
}
