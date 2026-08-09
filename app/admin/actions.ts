"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const suspensionSchema = z.object({
  userId: z.string().uuid(),
  shouldSuspend: z.enum(["true", "false"]),
  reason: z.string().trim().max(500).optional(),
});

const reportSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(["reviewing", "resolved", "dismissed"]),
  note: z.string().trim().max(1000).optional(),
});

const supportSchema = z.object({
  requestId: z.string().uuid(),
  status: z.enum(["open", "in_progress", "closed"]),
});

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/admin");
  const { data: isAdmin } = await supabase.rpc("is_admin");
  if (!isAdmin) redirect("/dashboard");
  return supabase;
}

export async function setUserSuspension(formData: FormData) {
  const values = suspensionSchema.parse({
    userId: formData.get("userId"),
    shouldSuspend: formData.get("shouldSuspend"),
    reason: formData.get("reason") || undefined,
  });
  const shouldSuspend = values.shouldSuspend === "true";
  if (shouldSuspend && (!values.reason || values.reason.length < 3)) throw new Error("Debes indicar un motivo de al menos 3 caracteres.");

  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_set_user_suspension", {
    target_user: values.userId,
    should_suspend: shouldSuspend,
    reason: values.reason ?? null,
  });
  if (error) throw new Error("No se pudo actualizar el estado de la cuenta.");
  revalidatePath("/admin");
}

export async function reviewProfileReport(formData: FormData) {
  const values = reportSchema.parse({
    reportId: formData.get("reportId"),
    status: formData.get("status"),
    note: formData.get("note") || undefined,
  });
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_review_profile_report", {
    target_report: values.reportId,
    new_status: values.status,
    note: values.note ?? null,
  });
  if (error) throw new Error("No se pudo actualizar el reporte.");
  revalidatePath("/admin");
}

export async function updateSupportRequest(formData: FormData) {
  const values = supportSchema.parse({ requestId: formData.get("requestId"), status: formData.get("status") });
  const supabase = await requireAdmin();
  const { error } = await supabase.rpc("admin_update_support_request", {
    target_request: values.requestId,
    new_status: values.status,
  });
  if (error) throw new Error("No se pudo actualizar la solicitud de soporte.");
  revalidatePath("/admin");
}
