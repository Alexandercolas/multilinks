// Local fixtures only. Run next dev on 3107. Never seeds profiles or analytics.
import assert from "node:assert/strict";
import {
  mkdir,
  writeFile,
  readFile,
  rm,
  rmdir,
  access,
} from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";
import jsQR from "../.profile-test-runtime/node_modules/jsqr/dist/jsQR.js";
const playwright = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "../.profile-test-runtime/node_modules/playwright/index.mjs"
);
const folder = new URL("../app/profile-qa/", import.meta.url),
  file = new URL("page.tsx", folder);
let exists = false;
try {
  await access(file);
  exists = true;
} catch {}
if (exists) throw new Error("Refusing to overwrite an existing QA route");
const output = new URL(
  "../.profile-test-runtime/screenshots/",
  import.meta.url,
);
await mkdir(folder, { recursive: true });
await mkdir(output, { recursive: true });
await writeFile(
  file,
  String.raw`import {notFound} from 'next/navigation';
import {PublicProfileShell} from '@/components/public-profile-shell';
import {ProfileViewTracker} from '@/components/profile-view-tracker';
import {generateProfileQr} from '@/lib/qr';
import {publicProfileUrl} from '@/lib/public-profile-url';
import type {Profile} from '@/types/profile';
export default async function QA({searchParams}:{searchParams:Promise<Record<string,string>>}){if(process.env.NODE_ENV!=='development')notFound();const q=await searchParams;const url=await publicProfileUrl('studio-fixture');const theme=(['lime','violet','sunset','neon'].includes(q.theme)?q.theme:'neon') as Profile['theme'];const colors={lime:'#c9ff58',violet:'#8566ff',sunset:'#ff7356',neon:'#0f1115'};const profile:Profile={username:'studio-fixture',displayName:q.long?'Estudio de música, diseño y proyectos extraordinariamente creativos':'Ari Studio',bio:'Música, diseño y pequeñas ideas que se convierten en grandes proyectos.\nEncuentra aquí lo que estoy creando.',avatar:'AS',theme,backgroundColor:colors[theme],accentColor:'#c9ff58',buttonStyle:q.style as Profile['buttonStyle']||'rounded',backgroundPreset:q.background,backgroundImage:q.image?'/backgrounds/pink-marble.png':undefined,coverImage:q.cover?'/backgrounds/fuchsia-ribbon.png':undefined,links:[{id:'30000000-0000-0000-0000-000000000001',title:'Instagram',url:'https://instagram.com/example',active:true,linkType:'social'},{id:'30000000-0000-0000-0000-000000000002',title:q.long?'Un título de enlace largo que debe leerse completo en cualquier teléfono y sin desaparecer':'Explora mi último proyecto',description:'Ideas y colaboraciones. Un espacio para crear algo que importe.',url:'https://example.com/project',active:true,featured:true,icon:'↗'},{id:'30000000-0000-0000-0000-000000000003',title:'Hablemos de tu próxima idea',description:'Consultas, proyectos y colaboraciones',url:'https://example.com/contact',active:true,icon:'✉'},{id:'30000000-0000-0000-0000-000000000004',title:'Un día en el estudio',description:'Un vistazo al proceso creativo.',url:'https://youtu.be/dQw4w9WgXcQ',active:true,linkType:'media'},{id:'30000000-0000-0000-0000-000000000005',title:'La playlist del estudio',description:'Lo que escucho mientras creo.',url:'https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M',active:true,linkType:'media'},{id:'30000000-0000-0000-0000-000000000006',title:'Mis favoritos en YouTube Music',url:'https://music.youtube.com/watch?v=dQw4w9WgXcQ',active:true,linkType:'media'}]};return <><ProfileViewTracker profileId="30000000-0000-0000-0000-000000000099"/><PublicProfileShell profile={profile} url={url} qrSvg={await generateProfileQr(url)} showBranding={q.premium!=='true'} richMedia={q.free!=='true'} isOwner={q.owner==='true'}/></>}
`,
);
const engines = (process.env.QA_ENGINES ?? "chrome,edge,firefox,webkit").split(
  ",",
);
const base = process.env.QA_BASE_URL ?? "http://localhost:3107";
let browser;
try {
  for (const engine of engines) {
    browser = await (
      engine === "firefox"
        ? playwright.firefox
        : engine === "webkit"
          ? playwright.webkit
          : playwright.chromium
    ).launch({
      headless: true,
      ...(["chrome", "edge"].includes(engine)
        ? { channel: engine === "edge" ? "msedge" : "chrome" }
        : {}),
    });
    const page = await browser.newPage();
    page.setDefaultNavigationTimeout(
      Number(process.env.QA_NAVIGATION_TIMEOUT || 30000),
    );
    const errors = [];
    const tracking = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("requestfailed", (r) => {
      if (r.url().includes("/_next/"))
        console.log(
          engine + " asset failure: " + r.url() + " " + r.failure()?.errorText,
        );
    });
    await page.addInitScript(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async (text) => {
            window.__copied = text;
          },
        },
      });
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: undefined,
      });
    });
    await page.route("**/api/view/**", (route) => {
      tracking.push("view");
      return route.fulfill({ status: 204 });
    });
    await page.route("**/api/impressions/**", (route) => {
      tracking.push("impressions");
      return route.fulfill({ status: 204 });
    });
    await page.route("**/api/play/**", (route) => {
      tracking.push("play");
      return route.fulfill({ status: 200, body: "{}" });
    });
    await page.route("**/api/favicon?*", (route) =>
      route.fulfill({ status: 404, body: "" }),
    );
    await page.route("https://i.ytimg.com/**", (route) => route.abort());
    await page.route("https://i.scdn.co/**", (route) => route.abort());
    await page.route("https://cdn.simpleicons.org/**", (route) =>
      route.abort(),
    );
    await page.route("https://www.youtube-nocookie.com/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<title>Official player fixture</title>",
      }),
    );
    await page.route("https://open.spotify.com/embed/**", (route) =>
      route.fulfill({
        contentType: "text/html",
        body: "<title>Official player fixture</title>",
      }),
    );
    const overflow = async () => {
      const result = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        offenders: [...document.querySelectorAll("main *")]
          .filter((el) => el.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 8)
          .map((el) => ({
            tag: el.tagName,
            classes: el.className,
            width: el.getBoundingClientRect().width,
            right: el.getBoundingClientRect().right,
          })),
      }));
      assert.ok(
        result.scroll <= result.width + 1,
        engine + " horizontal overflow " + JSON.stringify(result),
      );
    };
    const decode = async (locator) => {
      const png = await locator.screenshot();
      const { data, info } = await sharp(png)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      const code = jsQR(new Uint8ClampedArray(data), info.width, info.height);
      assert.ok(code, "QR must decode from its rendered size");
      return code.data;
    };
    for (const [width, height] of [
      [360, 800],
      [375, 812],
      [390, 844],
      [414, 896],
      [430, 932],
      [768, 1024],
      [1024, 768],
      [1366, 768],
      [1440, 900],
      [1920, 1080],
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto(base + "/profile-qa");
      await page
        .getByRole("heading", { name: "Ari Studio", exact: true })
        .waitFor();
      await page.waitForFunction(
        () =>
          parseFloat(
            getComputedStyle(document.querySelector("main")).paddingLeft,
          ) > 0,
      );
      await page.addStyleTag({
        content: "nextjs-portal{display:none !important}",
      });
      await overflow();
      assert.equal(
        await page.locator("iframe").count(),
        0,
        "Embeds load only after interaction",
      );
      const video = await page
        .getByRole("button", {
          name: "Reproducir Un día en el estudio (YouTube)",
          exact: true,
        })
        .boundingBox();
      assert.ok(
        Math.abs(video.width / video.height - 16 / 9) < 0.03,
        "Video aspect ratio",
      );
      const artwork = page.locator('[data-media-artwork="video"]');
      await artwork.scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () => !document.querySelector('[data-media-artwork="video"] img'),
      );
      assert.equal(
        await artwork.locator("svg").count(),
        1,
        "Video keeps its fallback when the thumbnail fails",
      );
      if (width < 1024) {
        assert.equal(
          await page
            .getByRole("img", { name: "Código QR del perfil de Ari Studio" })
            .isVisible(),
          false,
        );
        await page
          .getByRole("button", { name: "Mostrar QR", exact: true })
          .click();
        await page.getByRole("dialog").waitFor();
        const url = await decode(
          page
            .getByRole("dialog")
            .getByRole("img", { name: "Código QR del perfil de Ari Studio" }),
        );
        assert.ok(url.endsWith("/studio-fixture"));
        await page.keyboard.press("Escape");
        assert.equal(await page.getByRole("dialog").isVisible(), false);
      } else {
        const qr = page
          .getByRole("complementary", {
            name: "Compartir perfil en escritorio",
          })
          .getByRole("img", { name: "Código QR del perfil de Ari Studio" });
        assert.ok((await decode(qr)).endsWith("/studio-fixture"));
        assert.equal((await qr.boundingBox()).width, 112);
      }
      await page
        .getByRole("button", {
          name: width < 1024 ? "Copiar enlace del perfil" : "Copiar enlace",
          exact: true,
        })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "Enlace copiado" })
        .waitFor();
      assert.ok(
        (await page.evaluate(() => window.__copied)).endsWith(
          "/studio-fixture",
        ),
      );
      await page
        .getByRole("button", { name: "Compartir", exact: true })
        .click();
      await page
        .getByRole("status")
        .filter({ hasText: "Enlace copiado" })
        .waitFor();
      if (
        engine === "chrome" &&
        [360, 390, 430, 768, 1366, 1440, 1920].includes(width)
      )
        await page.screenshot({
          path: fileURLToPath(new URL("profile-" + width + ".png", output)),
          fullPage: true,
        });
    }
    await page.evaluate(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async (data) => {
          window.__shared = data;
        },
      });
    });
    await page.getByRole("button", { name: "Compartir", exact: true }).click();
    await page
      .getByRole("status")
      .filter({ hasText: "Perfil compartido" })
      .waitFor();
    assert.ok(
      (await page.evaluate(() => window.__shared.url)).endsWith(
        "/studio-fixture",
      ),
    );
    await page.evaluate(() => {
      Object.defineProperty(navigator, "share", {
        configurable: true,
        value: async () => {
          throw new DOMException("Canceled", "AbortError");
        },
      });
    });
    await page.getByRole("button", { name: "Compartir", exact: true }).click();
    await page.evaluate(() => {
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error("Denied");
          },
        },
      });
      document.execCommand = () => false;
    });
    await page
      .getByRole("button", { name: "Copiar enlace", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Enlace público para copiar" })
      .waitFor();
    const impressionRequest = page.waitForRequest((request) =>
      request.url().includes("/api/impressions/"),
    );
    await page.goto(base + "/profile-qa");
    await page
      .getByRole("button", {
        name: "Reproducir Un día en el estudio (YouTube)",
        exact: true,
      })
      .click();
    await page
      .locator('iframe[src^="https://www.youtube-nocookie.com/embed/"]')
      .waitFor();
    await page
      .getByRole("button", {
        name: "Reproducir La playlist del estudio (Spotify)",
        exact: true,
      })
      .click();
    await page
      .locator('iframe[src^="https://open.spotify.com/embed/playlist/"]')
      .waitFor();
    assert.ok(tracking.includes("play"));
    assert.ok(tracking.includes("view"));
    const impression = await impressionRequest;
    assert.ok(
      impression
        .postDataJSON()
        .links.includes("30000000-0000-0000-0000-000000000002"),
    );
    assert.equal(
      await page
        .getByRole("link")
        .filter({ hasText: "Mis favoritos en YouTube Music" })
        .getAttribute("href"),
      "/api/click/30000000-0000-0000-0000-000000000006",
    );
    if (engine === "chrome") {
      const axe = await readFile(
        new URL(
          "../.profile-test-runtime/node_modules/axe-core/axe.min.js",
          import.meta.url,
        ),
        "utf8",
      );
      for (const query of [
        "theme=lime",
        "theme=violet",
        "theme=sunset",
        "theme=neon",
        "background=champagne",
        "background=soft-violet",
        "background=pink-marble",
        "background=black-gold-marble",
        "image=1&cover=1",
        "long=1&style=pill",
        "free=true",
        "premium=true",
        "owner=true",
      ]) {
        await page.setViewportSize({ width: 390, height: 844 });
        await page.goto(base + "/profile-qa?" + query);
        await page.addStyleTag({
          content: "nextjs-portal{display:none !important}",
        });
        await overflow();
        await page.addScriptTag({ content: axe });
        const violations = await page.evaluate(async () => {
          const result = await window.axe.run(document.querySelector("main"), {
            runOnly: { type: "tag", values: ["wcag2a", "wcag2aa"] },
          });
          return result.violations.map((v) => ({
            id: v.id,
            nodes: v.nodes.map((n) => n.target),
          }));
        });
        assert.deepEqual(violations, [], query + " accessibility");
        assert.equal(
          await page
            .locator("footer")
            .getByRole("link", { name: "Crear mi perfil", exact: true })
            .getAttribute("href"),
          "/sign-in?mode=signup",
          query + " direct registration button",
        );
        if (query === "free=true")
          assert.equal(
            await page.getByRole("button", { name: /Reproducir/ }).count(),
            0,
          );
        if (query === "premium=true")
          assert.equal(
            await page
              .getByRole("link", { name: "MultiLinks — inicio" })
              .count(),
            0,
          );
        if (query === "owner=true")
          assert.equal(
            await page
              .getByRole("link", { name: "Editar mi perfil" })
              .getAttribute("href"),
            "/dashboard",
          );
        if (query === "image=1&cover=1")
          await page.screenshot({
            path: fileURLToPath(new URL("profile-background.png", output)),
            fullPage: true,
          });
      }
      await page.goto(base + "/demo");
      assert.equal(
        await page
          .getByRole("heading", { name: "MultiLinks", exact: true })
          .count(),
        1,
      );
      assert.ok(
        await page.locator('link[rel="canonical"]').getAttribute("href"),
      );
      await overflow();
      const audioArtwork = page.locator('[data-media-artwork="audio"]');
      await audioArtwork.scrollIntoViewIfNeeded();
      await page.waitForFunction(
        () => !document.querySelector('[data-media-artwork="audio"] img'),
      );
      assert.equal(
        await audioArtwork.locator("svg").count(),
        1,
        "Audio keeps its fallback when the thumbnail fails",
      );
    }
    assert.deepEqual(errors, []);
    console.log(
      engine +
        ": 10 viewports, QR decoding, copy/share/fallback, keyboard modal, official embed URLs, lazy players and analytics passed.",
    );
    await browser.close();
    browser = undefined;
  }
} finally {
  if (browser) await browser.close();
  await rm(file);
  await rmdir(folder);
  await rm(
    new URL("../.next/dev/types/app/profile-qa/page.ts", import.meta.url),
    { force: true },
  );
}
