"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CSVUploader } from "@/components/upload/csv-uploader";
import { CSVPreviewTable } from "@/components/upload/csv-preview-table";
import { ColumnMappingDialog } from "@/components/upload/column-mapping-dialog";
import { ImportSummaryCard } from "@/components/upload/import-summary-card";
import { RbcHelpCard } from "@/components/upload/rbc-help-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { parseCsvFile, hashFile } from "@/lib/csv/parser";
import {
  detectColumnMapping,
  isMappingComplete,
  isRbcExport,
} from "@/lib/csv/column-mapper";
import {
  inferRbcAccountName,
  inferRbcAccountType,
} from "@/lib/csv/rbc-format";
import { normalizeRows } from "@/lib/csv/normalizer";
import { getCategoryName } from "@/lib/categorization/engine";
import { importTransactions } from "@/lib/actions/transactions";
import { getOrCreateAccount } from "@/lib/actions/accounts";
import { ACCOUNT_PRESETS } from "@/lib/constants";
import type { Category, MerchantRule, Account } from "@/types/database";
import type {
  ColumnMapping,
  ImportPreviewRow,
  ImportSummary,
  NormalizedTransaction,
} from "@/types/transaction";

interface UploadFlowProps {
  accounts: Account[];
  categories: Category[];
  merchantRules: MerchantRule[];
  existingDedupeKeys: string[];
}

type Step = "upload" | "preview" | "importing" | "done";

export function UploadFlow({
  accounts,
  categories,
  merchantRules,
  existingDedupeKeys,
}: UploadFlowProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState("");
  const [accountPreset, setAccountPreset] = useState("0");
  const [accountTypeFilter, setAccountTypeFilter] = useState<"bank" | "credit_card">("bank");
  const [mapping, setMapping] = useState<ColumnMapping>({});
  const [headers, setHeaders] = useState<string[]>([]);
  const [showMappingDialog, setShowMappingDialog] = useState(false);
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [normalizedTx, setNormalizedTx] = useState<NormalizedTransaction[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [detectedRbc, setDetectedRbc] = useState(false);

  const dedupeSet = new Set(existingDedupeKeys);

  const resolveAccount = async (
    rows: Record<string, string>[],
    fileHeaders: string[]
  ) => {
    if (isRbcExport(fileHeaders)) {
      const name = inferRbcAccountName(rows);
      const type = inferRbcAccountType(rows);
      return getOrCreateAccount(name, type);
    }
    const preset = ACCOUNT_PRESETS[Number(accountPreset)];
    return getOrCreateAccount(
      preset.name,
      accountTypeFilter === "credit_card" ? "credit_card" : preset.account_type
    );
  };

  const processFile = useCallback(
    async (selectedFile: File) => {
      setLoading(true);
      setFile(selectedFile);
      const hash = await hashFile(selectedFile);
      setFileHash(hash);

      const { headers: h, rows, errors } = await parseCsvFile(selectedFile);
      setHeaders(h);
      setParseErrors(errors);

      const rbc = isRbcExport(h);
      setDetectedRbc(rbc);

      if (rbc) {
        const type = inferRbcAccountType(rows);
        setAccountTypeFilter(type === "credit_card" ? "credit_card" : "bank");
        const presetIdx = ACCOUNT_PRESETS.findIndex(
          (p) => p.name === inferRbcAccountName(rows)
        );
        if (presetIdx >= 0) setAccountPreset(String(presetIdx));
        toast.success("RBC export detected — columns mapped automatically.");
      }

      const detected = detectColumnMapping(h);
      setMapping(detected);

      if (!isMappingComplete(detected)) {
        setShowMappingDialog(true);
        setLoading(false);
        return;
      }

      await buildPreview(rows, detected, h);
      setLoading(false);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories, merchantRules, dedupeSet]
  );

  const buildPreview = async (
    rows: Record<string, string>[],
    colMapping: ColumnMapping,
    fileHeaders: string[] = headers
  ) => {
    const account = await resolveAccount(rows, fileHeaders);

    const { normalized, errors } = await normalizeRows(
      rows,
      colMapping,
      account.id,
      categories,
      merchantRules,
      dedupeSet,
      fileHeaders
    );

    setParseErrors((prev) => [...prev, ...errors]);
    setNormalizedTx(normalized);

    const preview: ImportPreviewRow[] = normalized.map((tx) => ({
      ...tx,
      categoryName: getCategoryName(tx.category_id, categories),
    }));
    setPreviewRows(preview);
    setStep("preview");
  };

  const handleMappingConfirm = async () => {
    setShowMappingDialog(false);
    if (!file) return;
    setLoading(true);
    const { rows } = await parseCsvFile(file);
    await buildPreview(rows, mapping, headers);
    setLoading(false);
  };

  const handleImport = async () => {
    if (!file || normalizedTx.length === 0) return;
    setStep("importing");
    setLoading(true);

    try {
      const { rows } = await parseCsvFile(file);
      const account = await resolveAccount(rows, headers);

      const toImport = normalizedTx.filter((t) => !dedupeSet.has(t.dedupe_key));

      const result = await importTransactions({
        accountId: account.id,
        fileName: file.name,
        fileHash,
        transactions: toImport,
      });

      if (result.error) {
        toast.error(result.error);
        setStep("preview");
        return;
      }

      setSummary(result.summary!);
      setStep("done");
      toast.success(`Imported ${result.summary!.imported} transactions`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
      setStep("preview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {step === "upload" && (
          <>
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Account Details</CardTitle>
                {detectedRbc && (
                  <p className="text-sm text-emerald-600">
                    RBC format detected — account type will be inferred from your CSV.
                  </p>
                )}
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Account</Label>
                  <Select
                    value={accountPreset}
                    onValueChange={(v) => setAccountPreset(v ?? "0")}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCOUNT_PRESETS.map((a, i) => (
                        <SelectItem key={a.name} value={String(i)}>
                          {a.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>CSV Type</Label>
                  <Select
                    value={accountTypeFilter}
                    onValueChange={(v) =>
                      setAccountTypeFilter(v as "bank" | "credit_card")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Bank account</SelectItem>
                      <SelectItem value="credit_card">Credit card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <CSVUploader onFileSelect={processFile} disabled={loading} />
          </>
        )}

        {step === "preview" && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Preview Import</h2>
                <p className="text-sm text-muted-foreground">
                  {file?.name} · {previewRows.length} transactions
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setStep("upload")}>
                  Back
                </Button>
                <Button onClick={handleImport} disabled={loading}>
                  Confirm Import
                </Button>
              </div>
            </div>
            <CSVPreviewTable rows={previewRows} />
            {parseErrors.length > 0 && (
              <p className="text-sm text-orange-600">
                {parseErrors.length} row(s) could not be parsed
              </p>
            )}
          </>
        )}

        {step === "done" && summary && (
          <>
            <ImportSummaryCard summary={summary} />
            <div className="flex gap-2">
              <Button onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setStep("upload");
                  setFile(null);
                  setPreviewRows([]);
                  setSummary(null);
                }}
              >
                Upload Another
              </Button>
            </div>
          </>
        )}
      </div>

      <RbcHelpCard />

      <ColumnMappingDialog
        open={showMappingDialog}
        headers={headers}
        mapping={mapping}
        onMappingChange={setMapping}
        onConfirm={handleMappingConfirm}
        onCancel={() => {
          setShowMappingDialog(false);
          setFile(null);
        }}
      />
    </div>
  );
}
