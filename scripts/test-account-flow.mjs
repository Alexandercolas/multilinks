// Local integration against Supabase: creates one isolated QA account and deletes it in finally.
// Signup email UI is simulated; this test does not send mail or use an existing person's account.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import ts from "typescript";
import { pathToFileURL } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { safeAuthDestination } from "../lib/auth-navigation.ts";
import { usernameError } from "../lib/profile-onboarding.ts";

const base = process.env.QA_BASE_URL || "http://localhost:3107";
assert.ok(
  ["localhost", "127.0.0.1"].includes(new URL(base).hostname),
  "Use a local app server",
);
for (const unsafe of [
  "https://example.com",
  "//example.com",
  "/\\example.com",
  "/dashboard/../../evil",
  "/sign-in",
])
  assert.equal(safeAuthDestination(unsafe), "/dashboard");
assert.equal(safeAuthDestination("/dashboard/ajustes"), "/dashboard/ajustes");
assert.equal(safeAuthDestination("/reset-password"), "/reset-password");
assert.ok(usernameError("dashboard"));
assert.ok(usernameError("icon"));
assert.ok(usernameError("opengraph-image"));
assert.ok(usernameError("ab"));
assert.ok(usernameError("a".repeat(31)));
assert.equal(usernameError("mi-perfil_1"), "");
const originGuardSource = (
  await readFile(
    new URL("../lib/security/same-origin.ts", import.meta.url),
    "utf8",
  )
).replace('import "server-only";', "");
const originGuardJs = ts.transpileModule(originGuardSource, {
  compilerOptions: { module: ts.ModuleKind.ESNext },
}).outputText;
const { isSameOriginRequest } = await import(
  "data:text/javascript;base64," + Buffer.from(originGuardJs).toString("base64")
);
assert.equal(
  isSameOriginRequest(
    new Request(base, {
      headers: { origin: "https://example.com", host: new URL(base).host },
    }),
  ),
  false,
);
assert.equal(
  isSameOriginRequest(
    new Request(base, { headers: { origin: base, host: new URL(base).host } }),
  ),
  true,
);
assert.equal(isSameOriginRequest(new Request(base)), false);
const { chromium } = await import(
  pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
);
const url = process.env.NEXT_PUBLIC_supabase_SUPABASE_URL;
const serviceKey = process.env.supabase_SUPABASE_SERVICE_ROLE_KEY;
const anonKey =
  process.env.NEXT_PUBLIC_supabase_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_supabase_SUPABASE_PUBLISHABLE_KEY;
assert.ok(url && serviceKey && anonKey, "Supabase environment is required");
const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const auth = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const nonce = randomBytes(6).toString("hex");
const email = `qa-flow-${nonce}@example.com`;
const password = `Qa!${randomBytes(24).toString("hex")}`;
const nextPassword = `New!${randomBytes(24).toString("hex")}`;
const username = `qa-${nonce}`;
let userId;
const browser = await chromium.launch({ channel: "chrome", headless: true });
try {
  const anonymous = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const signup = await anonymous.newPage();
  signup.setDefaultNavigationTimeout(120000);
  await signup.goto(base + "/sign-in?mode=signup");
  await signup.getByRole("heading", { name: "Crea tu MultiLink" }).waitFor();
  let signups = 0;
  await signup.route(base + "/api/auth", (route) => {
    signups++;
    return route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({ ok: true, needsEmailConfirmation: true }),
    });
  });
  await signup.getByLabel("Correo", { exact: true }).fill(email);
  await signup
    .getByLabel("Contraseña", { exact: false })
    .first()
    .fill(password);
  await signup
    .getByLabel("Confirmar contraseña", { exact: true })
    .fill(nextPassword);
  await signup
    .getByRole("button", { name: "Crear cuenta", exact: true })
    .click();
  await signup.getByRole("alert").filter({ hasText: "no coinciden" }).waitFor();
  assert.equal(signups, 0);
  await signup
    .getByLabel("Confirmar contraseña", { exact: true })
    .fill(password);
  await signup
    .getByRole("button", { name: "Crear cuenta", exact: true })
    .click();
  await signup.getByRole("heading", { name: "Confirma tu correo" }).waitFor();
  assert.equal(signups, 1);
  assert.equal(
    await signup
      .getByRole("button", { name: "Crear cuenta", exact: true })
      .count(),
    0,
  );
  await signup.unroute(base + "/api/auth");
  await signup.goto(base + "/auth/callback?next=//example.com");
  await signup.getByRole("alert").filter({ hasText: "expiró" }).waitFor();
  assert.equal(new URL(signup.url()).origin, new URL(base).origin);
  const publicRequest = (path, body) =>
    signup.evaluate(
      async ({ path, body }) => {
        const response = await fetch(
          path,
          body === undefined
            ? {}
            : {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body),
              },
        );
        return { status: response.status, text: await response.text() };
      },
      { path, body },
    );
  assert.equal((await publicRequest("/api/account/password", {})).status, 401);
  assert.equal(
    (await publicRequest("/api/auth", { mode: "signup" })).status,
    400,
  );

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { qa_account_flow: true },
  });
  assert.equal(error, null, "Create isolated QA account");
  userId = data.user.id;
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  await context.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text) => {
          window.__copied = text;
        },
      },
    }),
  );
  const page = await context.newPage();
  page.setDefaultNavigationTimeout(120000);
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.route("**/api/link-preview", (route) =>
    route.fulfill({ status: 404, contentType: "application/json", body: "{}" }),
  );
  await page.goto(base + "/sign-in?next=/dashboard");
  await page.getByLabel("Correo", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: false }).first().fill(password);
  await page.getByRole("button", { name: "Entrar", exact: true }).click();
  await page
    .getByRole("heading", { name: "Publica tu primera página" })
    .waitFor();
  const publish = page.getByRole("button", {
    name: "3. Publicar mi página",
    exact: true,
  });
  assert.equal(await publish.isDisabled(), true);
  assert.equal(
    await page.getByRole("link", { name: "Ver mi perfil publicado" }).count(),
    0,
  );
  const panelNav = page.getByRole("navigation", {
    name: "Secciones del panel",
  });
  await page
    .getByRole("button", { name: "1. Nombre y usuario", exact: true })
    .click();
  await page.getByLabel("Nombre", { exact: true }).fill("Perfil de prueba");
  await page.getByLabel("Usuario", { exact: true }).fill("dashboard");
  await page
    .getByRole("button", { name: "Guardar y publicar", exact: true })
    .click();
  await page.getByRole("status").filter({ hasText: "reservado" }).waitFor();
  await page.getByLabel("Usuario", { exact: true }).fill(username);
  await panelNav
    .getByRole("button", { name: "Apariencia", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Nombre", { exact: true }).isVisible(),
    false,
  );
  assert.equal(
    await page.getByLabel("Color de fondo", { exact: true }).isVisible(),
    false,
  );
  await page.getByText("Colores personalizados", { exact: true }).click();
  assert.equal(
    await page.getByLabel("Color de fondo", { exact: true }).isVisible(),
    true,
  );
  await page
    .getByRole("button", { name: "Usar paleta Black elegante", exact: true })
    .click();
  assert.equal(
    await page.getByLabel("Color de fondo", { exact: true }).inputValue(),
    "#101010",
  );
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.addScriptTag({
      content: await readFile(
        ".profile-test-runtime/node_modules/axe-core/axe.min.js",
        "utf8",
      ),
    });
    const violations = await page.evaluate(async () => {
      const result = await window.axe.run(
        { include: ["#apariencia", 'nav[aria-label="Secciones del panel"]'] },
        { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] } },
      );
      return result.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      }));
    });
    assert.deepEqual(
      violations,
      [],
      `Appearance and navigation accessibility at ${width}px`,
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      "Panel does not overflow",
    );
    await page.screenshot({
      path: `.profile-test-runtime/screenshots/dashboard-appearance-${width}.png`,
      fullPage: true,
    });
    if (width === 390) {
      await page
        .getByRole("button", { name: "Vista previa", exact: true })
        .click();
      assert.equal(
        await page
          .getByRole("complementary", { name: "Vista previa del perfil" })
          .isVisible(),
        true,
      );
      await page
        .getByRole("button", { name: "Cerrar vista previa", exact: true })
        .click();
      assert.equal(
        await page
          .getByRole("complementary", { name: "Vista previa del perfil" })
          .isVisible(),
        false,
      );
    }
  }
  await panelNav.getByRole("button", { name: "Perfil", exact: true }).click();
  assert.equal(
    await page.getByLabel("Nombre", { exact: true }).inputValue(),
    "Perfil de prueba",
    "Changing sections keeps unsaved fields",
  );
  await panelNav.getByRole("button", { name: "Resumen", exact: true }).click();
  await page
    .getByRole("button", { name: "2. Tu primer enlace", exact: true })
    .click();
  await page
    .getByLabel("Título del enlace", { exact: true })
    .fill("Mi primer enlace");
  await page
    .getByPlaceholder("https://...", { exact: true })
    .fill("https://example.com/bienvenida");
  const failLinks = (route) =>
    route.request().method() === "POST"
      ? route.fulfill({
          status: 400,
          contentType: "application/json",
          body: JSON.stringify({ code: "23514", message: "QA write failure" }),
        })
      : route.continue();
  await page.route("**/rest/v1/links*", failLinks);
  await panelNav.getByRole("button", { name: "Resumen", exact: true }).click();
  await publish.click();
  await page
    .getByRole("status")
    .filter({ hasText: "excede el límite" })
    .waitFor();
  const draft = await admin
    .from("profiles")
    .select("published")
    .eq("id", userId)
    .single();
  assert.equal(draft.error, null);
  assert.equal(
    draft.data.published,
    false,
    "Failed first publish stays private",
  );
  const draftHtml = (await publicRequest("/" + username)).text;
  assert.ok(
    !draftHtml.includes("Perfil de prueba"),
    "Private draft identity is not exposed",
  );
  assert.ok(draftHtml.includes("noindex"), "Private draft URL is not indexed");
  await page.unroute("**/rest/v1/links*", failLinks);
  await publish.click();
  await page
    .getByRole("heading", { name: "Tu página está publicada" })
    .waitFor();
  await page
    .getByRole("button", { name: "Copiar mi URL", exact: true })
    .click();
  assert.ok(
    (await page.evaluate(() => window.__copied)).endsWith("/" + username),
  );
  const publicPage = await publicRequest("/" + username);
  assert.equal(publicPage.status, 200);
  assert.ok(
    publicPage.text.includes("Mi primer enlace"),
    "Published link is visible anonymously",
  );
  const saved = await admin
    .from("links")
    .select("title,url")
    .eq("profile_id", userId);
  assert.equal(saved.error, null);
  assert.equal(saved.data.length, 1);
  assert.equal(saved.data[0].title, "Mi primer enlace");
  await panelNav.getByRole("button", { name: "Perfil", exact: true }).click();
  await page.getByLabel("Usuario", { exact: true }).fill(username + "-edit");
  await panelNav.getByRole("button", { name: "Resumen", exact: true }).click();
  assert.ok(
    (await page.getByLabel("Tu URL pública").inputValue()).endsWith(
      "/" + username,
    ),
    "Sharing uses the saved username",
  );
  await mkdir(".profile-test-runtime/screenshots", { recursive: true });
  await page.screenshot({
    path: ".profile-test-runtime/screenshots/account-launch-390.png",
    fullPage: true,
  });
  await page.goto(base + "/dashboard/ajustes");
  await page
    .getByRole("heading", { name: "Configuración y seguridad" })
    .waitFor();
  const form = page.getByRole("form", { name: "Cambiar contraseña" });
  await form.getByLabel("Contraseña actual", { exact: true }).fill(password);
  await form
    .getByLabel("Contraseña nueva", { exact: false })
    .first()
    .fill(nextPassword);
  await form
    .getByLabel("Confirmar contraseña nueva", { exact: true })
    .fill(password);
  await form.getByRole("button", { name: "Guardar nueva contraseña" }).click();
  await form.getByRole("alert").filter({ hasText: "no coinciden" }).waitFor();
  await form
    .getByLabel("Contraseña actual", { exact: true })
    .fill("Wrong-password-123!");
  await form
    .getByLabel("Confirmar contraseña nueva", { exact: true })
    .fill(nextPassword);
  await form.getByRole("button", { name: "Guardar nueva contraseña" }).click();
  await form
    .getByRole("alert")
    .filter({ hasText: "actual no es correcta" })
    .waitFor();
  await form.getByLabel("Contraseña actual", { exact: true }).fill(password);
  await form.getByRole("button", { name: "Guardar nueva contraseña" }).click();
  await form
    .getByRole("status")
    .filter({ hasText: "Contraseña actualizada" })
    .waitFor();
  assert.equal(
    await form
      .getByLabel("Contraseña nueva", { exact: false })
      .first()
      .inputValue(),
    "",
  );
  assert.ok(
    (await auth.auth.signInWithPassword({ email, password })).error,
    "Old password no longer works",
  );
  assert.equal(
    (await auth.auth.signInWithPassword({ email, password: nextPassword }))
      .error,
    null,
    "New password works",
  );
  await page.goto(base + "/sign-in?next=/dashboard/ajustes");
  await page.waitForURL("**/dashboard/ajustes");
  await page
    .getByRole("heading", { name: "Configuración y seguridad" })
    .waitFor();
  for (const width of [390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth + 1,
      ),
      false,
      "Settings have no horizontal overflow",
    );
  }
  assert.deepEqual(errors, []);
  console.log(
    "Account flow passed: signup confirmation/mismatch, expired callback, safe redirects, CSRF/session guards, draft privacy, publication/copy, password validation/change and fresh login.",
  );
} finally {
  await browser.close();
  if (userId) {
    const { error } = await admin.auth.admin.deleteUser(userId);
    if (error) throw new Error("Could not clean up the isolated QA account");
    console.log("Isolated QA account deleted.");
  }
}
