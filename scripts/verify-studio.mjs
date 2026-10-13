import fs from "node:fs/promises";
import path from "node:path";

const origin = "http://127.0.0.1:3000";
const checks = [];
async function page(route) {
  const response = await fetch(origin + route);
  const html = await response.text();
  if (response.status !== 200 || !html.includes("<html"))
    throw new Error(`${route}: HTTP ${response.status}`);
  checks.push({ route, status: response.status });
  return html;
}
const home = await page("/");
for (const anchor of [
  "features",
  "pricing",
  "about",
  "how-it-works",
  "integrations",
  "infra",
  "security",
  "projects",
  "blog",
  "book-meeting",
  "contact",
]) {
  if (!home.includes(`id="${anchor}"`))
    throw new Error(`Missing existing home anchor: ${anchor}`);
}
if (home.includes("framer-bundle") || home.includes("<iframe"))
  throw new Error("A cloned application is embedded in the homepage");
const projects = await page("/projects");
const project = projects.match(/href="(\/projects\/[^"#?]+)"/);
if (project) await page(project[1]);
const blog = await page("/blog");
const post = blog.match(/href="(\/blog\/[^"#?]+)"/);
if (post) await page(post[1]);
await page("/contact");
await page("/admin/login");
for (const [old, destination] of [
  ["/about", "/#about"],
  ["/services", "/#features"],
  ["/book-meeting", "/#book-meeting"],
]) {
  const response = await fetch(origin + old, { redirect: "manual" });
  if (
    response.status !== 308 ||
    !response.headers.get("location")?.endsWith(destination)
  )
    throw new Error(`Existing redirect changed: ${old}`);
  checks.push({ route: old, status: response.status, destination });
}
const invalid = await fetch(origin + "/api/contact", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: "{}",
});
if (invalid.status !== 400)
  throw new Error("Contact validation no longer rejects empty submissions");
checks.push({
  route: "/api/contact",
  status: invalid.status,
  note: "Empty request rejected; no customer submission created",
});
for (const route of ["/.well-known/oauth-authorization-server", "/.well-known/oauth-protected-resource", "/api/agent/openapi.json"]) {
  const response = await fetch(origin + route);
  const data = await response.json();
  if (response.status !== 200) throw new Error(`${route}: HTTP ${response.status}`);
  if (route.endsWith("openapi.json") && Object.keys(data.paths || {}).length < 23)
    throw new Error("Agent operation discovery is incomplete");
  checks.push({ route, status: response.status, ...(data.paths ? { operations: Object.keys(data.paths).length } : {}) });
}
const mcp = await fetch(origin + "/api/mcp", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
if (mcp.status !== 401 || !mcp.headers.get("www-authenticate")?.includes("resource_metadata"))
  throw new Error("MCP authentication challenge changed");
checks.push({ route: "/api/mcp", status: mcp.status, note: "Anonymous requests remain protected; no operation executed" });
const assets = JSON.parse(
  await fs.readFile("public/studio/asset-provenance.json", "utf8"),
);
const missing = [];
for (const file of Object.values(assets.assets)) {
  try {
    await fs.access(path.join("public", file));
  } catch {
    missing.push(file);
  }
}
if (missing.length) throw new Error(`Missing media: ${missing.join(", ")}`);
const result = {
  checks,
  existingHomeAnchors: "passed",
  nativeNextPages: "passed",
  mediaAssets: Object.keys(assets.assets).length,
  missingAssets: missing,
};
await fs.mkdir("artifacts/studio-redesign", { recursive: true });
await fs.writeFile(
  "artifacts/studio-redesign/http-verification.json",
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result, null, 2));
