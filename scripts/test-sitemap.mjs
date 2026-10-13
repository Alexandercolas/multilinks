import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";
const moduleUrl = (code) =>
  "data:text/javascript;base64," + Buffer.from(code).toString("base64");
const clientModule = moduleUrl(
  `export function createClient(url,key,options){if(key!=='public-key'||options.auth.persistSession!==false)throw new Error('Sitemap must use an anonymous client');return globalThis.sitemapFixture;}`,
);
const envModule = moduleUrl(
  `export const supabaseUrl='https://example.supabase.co';export const supabaseAnonKey='public-key';`,
);
const source = (
  await readFile(new URL("../app/sitemap.ts", import.meta.url), "utf8")
)
  .replace('"@supabase/supabase-js"', JSON.stringify(clientModule))
  .replace('"@/lib/supabase/env"', JSON.stringify(envModule));
const code = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.ESNext,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
let calls = [];
let fail = false;
const profiles = Array.from({ length: 2001 }, (_, i) => ({
  username: "profile" + i,
  updated_at: "2026-10-01T00:00:00Z",
  published: true,
}));
const all = [
  ...profiles,
  { username: "private", published: false },
  { username: null, published: true, updated_at: "bad-date" },
];
globalThis.sitemapFixture = {
  from(table) {
    assert.equal(table, "profiles");
    return {
      select() {
        return this;
      },
      eq(field, value) {
        assert.equal(field, "published");
        assert.equal(value, true);
        return this;
      },
      order(field) {
        assert.equal(field, "username");
        return this;
      },
      async range(start, end) {
        calls.push([start, end]);
        return fail
          ? { error: { message: "fixture failure" }, data: null }
          : {
              error: null,
              data: all.filter((p) => p.published).slice(start, end + 1),
            };
      },
    };
  },
};
try {
  const { default: sitemap } = await import(moduleUrl(code));
  const entries = await sitemap();
  assert.equal(entries.length, 2007);
  assert.deepEqual(calls, [
    [0, 999],
    [1000, 1999],
    [2000, 2999],
  ]);
  assert.ok(entries.some((e) => e.url.endsWith("/planes")));
  assert.ok(entries.some((e) => e.url.endsWith("/profile2000")));
  assert.ok(
    !entries.some((e) => e.url.endsWith("/private") || e.url.endsWith("/null")),
  );
  assert.equal(entries[0].lastModified, undefined);
  assert.equal(
    entries.find((e) => e.url.endsWith("/profile0")).lastModified.toISOString(),
    "2026-10-01T00:00:00.000Z",
  );
  fail = true;
  await assert.rejects(sitemap, /Could not load/);
  console.log(
    "Sitemap: anonymous access, multi-page profiles, real modification dates, pricing URL, invalid/private exclusions and query failure passed.",
  );
} finally {
  delete globalThis.sitemapFixture;
}
