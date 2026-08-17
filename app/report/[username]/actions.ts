"use server";

import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { allowRequest } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type ReportState = { status: "idle" | "success" | "error"; message: string };

const reportSchema = z.object({
  username: z.string().regex(/^[a-z0-9_-]{3,30}$/),
  reason: z.enum(["spam", "abuse", "impersonation", "inappropriate", "copyright", "other"]),
  description: z.string().trim().max(1000),
});

export async function submitProfileReport(_previous: ReportState, formData: FormData): Promise<ReportState> {
  const parsed = reportSchema.safeParse({
    username: formData.get("username"),
    reason: formData.get("reason"),
    description: formData.get("description"),
  });
  if (!parsed.success) return { status: "error", message: "Revisa el motivo y la descripción." };

  const allowed = await allowRequest("profile-report", parsed.data.username, 3, 24 * 60 * 60);
  if (!allowed) return { status: "error", message: "Ya recibimos varios reportes desde esta conexión. Inténtalo mañana." };

  const supabase = await createClient();
  const [{ data: profile }, { data: { user } }] = await Promise.all([
    supabase.from("profiles").select("id").eq("username", parsed.data.username).eq("published", true).maybeSingle(),
    supabase.auth.getUser(),
  ]);
  if (!profile) return { status: "error", message: "Este perfil ya no está disponible." };

  const { error } = await supabase.from("profile_reports").insert({
    profile_id: profile.id,
    reporter_id: user?.id ?? null,
    reason: parsed.data.reason,
    description: parsed.data.description,
  });
  if (error) {
    Sentry.captureException(new Error("Profile report creation failed"));
    console.error("Profile report creation failed", error);
    return { status: "error", message: "No pudimos guardar el reporte. Inténtalo nuevamente." };
  }
  return { status: "success", message: "Reporte recibido. Nuestro equipo lo revisará de forma privada." };
}
