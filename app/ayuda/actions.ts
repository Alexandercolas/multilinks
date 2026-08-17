"use server";

import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { allowRequest } from "@/lib/security/rate-limit";
import { createClient } from "@/lib/supabase/server";

export type ContactState = { status: "idle" | "success" | "error"; message: string };

const contactSchema = z.object({
  email: z.string().trim().email().max(320),
  subject: z.string().trim().min(3).max(120),
  message: z.string().trim().min(10).max(2000),
});

export async function submitSupportRequest(_previous: ContactState, formData: FormData): Promise<ContactState> {
  const parsed = contactSchema.safeParse({ email: formData.get("email"), subject: formData.get("subject"), message: formData.get("message") });
  if (!parsed.success) return { status: "error", message: "Revisa el correo, asunto y mensaje." };
  const allowed = await allowRequest("support-contact", parsed.data.email, 3, 60 * 60);
  if (!allowed) return { status: "error", message: "Has enviado varias solicitudes. Espera una hora antes de intentar nuevamente." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { error } = await supabase.from("support_requests").insert({ user_id: user?.id ?? null, ...parsed.data });
  if (error) {
    Sentry.captureException(new Error("Support request creation failed"));
    console.error("Support request creation failed", error);
    return { status: "error", message: "No pudimos enviar tu solicitud. Inténtalo nuevamente." };
  }
  return { status: "success", message: "Mensaje recibido. Te responderemos al correo indicado." };
}
