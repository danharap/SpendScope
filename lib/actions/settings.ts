"use server";

import { createClient, getUser } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteAllUserData() {
  const user = await getUser();
  if (!user) return { error: "Not authenticated" };

  const supabase = await createClient();

  await supabase.from("transactions").delete().eq("user_id", user.id);
  await supabase.from("imports").delete().eq("user_id", user.id);
  await supabase.from("merchant_rules").delete().eq("user_id", user.id);
  await supabase.from("budgets").delete().eq("user_id", user.id);
  await supabase.from("accounts").delete().eq("user_id", user.id);
  await supabase
    .from("categories")
    .delete()
    .eq("user_id", user.id)
    .eq("is_default", false);

  revalidatePath("/dashboard");
  return { success: true };
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
