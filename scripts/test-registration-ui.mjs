import assert from "node:assert/strict";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "../.analytics-test-runtime/node_modules/playwright/index.mjs"
);
const browser = await chromium.launch({
  channel: "chrome",
  args: ["--no-proxy-server"],
});
try {
  for (const width of [390, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const calls = [];
    await page.route("**/api/auth", async (route) => {
      calls.push(route.request().postDataJSON());
      await route.fulfill({ json: { ok: true, needsEmailConfirmation: true } });
    });
    await page.goto("http://localhost:3130/sign-in?mode=signup");
    await page
      .getByRole("button", { name: "Crear cuenta", exact: true })
      .waitFor();
    await page.clock.install();
    await page.getByLabel("Correo", { exact: true }).fill("qa@example.com");
    await page
      .locator("input[type=password]")
      .nth(0)
      .fill("SamplePassword123!");
    await page
      .locator("input[type=password]")
      .nth(1)
      .fill("SamplePassword123!");
    await page
      .getByRole("button", { name: "Crear cuenta", exact: true })
      .click();
    const resend = page.getByRole("button", { name: /Reenviar enlace/ });
    await resend.waitFor();
    assert.equal(await resend.isDisabled(), true);
    for (let i = 0; i < 61; i++) {
      await page.clock.runFor(1000);
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    assert.equal(await resend.isEnabled(), true);
    await resend.click();
    await page
      .getByText("Si hay un registro pendiente", { exact: false })
      .waitFor();
    assert.equal(calls.filter((c) => c.mode === "resend").length, 1);
    assert.equal(await resend.isDisabled(), true);
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page
      .getByRole("button", { name: "Corregir correo", exact: true })
      .click();
    assert.equal(
      await page.getByLabel("Correo", { exact: true }).inputValue(),
      "qa@example.com",
    );
    assert.equal(
      await page.locator("input[type=password]").nth(0).inputValue(),
      "",
    );
    await page.close();
    console.log(`Registration UI passed at ${width}px`);
  }
} finally {
  await browser.close();
}
