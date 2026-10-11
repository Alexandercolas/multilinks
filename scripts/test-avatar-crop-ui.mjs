import assert from "node:assert/strict";
import { mkdir, writeFile, rm, access } from "node:fs/promises";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "../.analytics-test-runtime/node_modules/playwright/index.mjs"
);
const folder = "app/profile-qa-crop";
const src =
  "data:image/svg+xml;base64," +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400"><path fill="red" d="M0 0h400v400H0z"/><path fill="blue" d="M400 0h400v400H400z"/></svg>',
  ).toString("base64");
let existing = false;
try {
  await access(folder);
  existing = true;
} catch {}
if (existing) throw new Error("Refusing to overwrite an existing QA route");
await mkdir(folder, { recursive: true });
await writeFile(
  folder + "/page.tsx",
  `"use client";import {useState} from 'react';import {AvatarCropEditor} from '@/components/avatar-crop-editor';export default function QA(){const[result,setResult]=useState('');return <main className="bg-ink min-h-screen p-5 text-white"><AvatarCropEditor src="${src}" onCancel={()=>setResult('Cancelado')} onApply={file=>{const reader=new FileReader();reader.onload=()=>setResult(String(reader.result));reader.readAsDataURL(file);}}/>{result.startsWith('data:')?<img id="result" src={result} alt="Resultado"/>:<p>{result}</p>}</main>}`,
);
const browser = await chromium.launch({
  channel: "chrome",
  headless: true,
  args: ["--host-resolver-rules=MAP localhost 127.0.0.1", "--no-proxy-server"],
});
try {
  const page = await browser.newPage();
  page.on("pageerror", (error) => console.log("UI error:", error.message));
  page.on("console", (message) => {
    if (message.type() === "error")
      console.log("Browser error:", message.text());
  });
  page.setDefaultNavigationTimeout(90000);
  for (const width of [320, 390, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(
      (process.env.QA_BASE_URL || "http://localhost:3130") + "/profile-qa-crop",
      { waitUntil: "domcontentloaded" },
    );
    await page.getByRole("button", { name: "Aplicar recorte" }).waitFor();
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll("button")].some(
          (b) => b.textContent === "Aplicar recorte" && !b.disabled,
        ),
      {},
      { timeout: 60000 },
    );
    await page.getByLabel("Zoom", { exact: true }).fill("2");
    await page.getByLabel("Posición horizontal", { exact: true }).fill("0");
    await page.getByLabel("Posición vertical", { exact: true }).fill("100");
    await page.getByRole("button", { name: "Aplicar recorte" }).click();
    await page.locator("#result").waitFor();
    await page.waitForFunction(
      () => document.querySelector("#result").naturalWidth === 512,
    );
    assert.equal(
      await page.locator("#result").evaluate((img) => img.naturalHeight),
      512,
    );
    const pixel = await page.locator("#result").evaluate((img) => {
      const c = document.createElement("canvas");
      c.width = 512;
      c.height = 512;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0);
      return Array.from(ctx.getImageData(256, 256, 1, 1).data);
    });
    assert.ok(
      pixel[0] > 240 && pixel[2] < 10,
      "Horizontal crop should select the red half of the original image",
    );
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.getByRole("button", { name: "Cancelar", exact: true }).click();
    await page.getByText("Cancelado", { exact: true }).waitFor();
  }
  console.log(
    "Avatar crop passed: zoom, horizontal/vertical positioning, 512px export, cancel and no overflow at 320/390/1440px.",
  );
} finally {
  await browser.close();
  await rm(folder, { recursive: true, force: true });
}
