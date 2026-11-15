// Fetch open roles from every watchlist company's public job board and write site/jobs.json.
// Runs in GitHub Actions (Node 20+, built-in fetch). Reads the starter watchlist from index.html
// so the app and this script share one list.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
const start = html.indexOf("const STARTER_WATCHLIST = [");
const end = html.indexOf("];", start);
const rows = JSON.parse(html.slice(html.indexOf("[", start), end + 1));
const boards = rows.map(([name, ats, slug, sector, lane, hqLA]) => ({ name, ats, slug, sector, lane, hqLA }))
  .filter((b) => ["greenhouse", "ashby", "lever"].includes(b.ats) && b.slug);

// Keep roles whose title is in scope (analytics, strategy, ops, finance, people...). Seniority and
// location are judged in the app so its "show every role" view still works.
const ROLE_RX = /\b(analytics?|analyst|data|insights?|strateg(y|ic)|operations|ops|bizops|chief of staff|revenue|revops|growth|fp&a|finance|planning|program|people|business intelligence|bi)\b/i;
const NOT_ROLE_RX = /\b(software|developer|intern(ship)?|technician|machinist|recruiter|sourcer|account executive|sales development|sdr|bdr|nurse|driver|warehouse|assembler|welder|counsel|attorney|designer|scientist|mechanic|electrician|inspector)\b/i;
const inScope = (t) => ROLE_RX.test(t) && !(NOT_ROLE_RX.test(t) && !/analytics engineer/i.test(t));

const ENT = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", apos: "'", nbsp: " " };
const decode = (s) => String(s || "").replace(/&(#\d+|#x[0-9a-f]+|[a-z]+\d*);/gi, (m, e) =>
  e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : +e.slice(1)) : (ENT[e.toLowerCase()] ?? m));
const toText = (h) => decode(decode(h).replace(/<\/(p|li|div|h\d)>|<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, " "))
  .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();
const day = (v) => { if (!v) return ""; const d = new Date(v); return isNaN(d) ? "" : d.toISOString().slice(0, 10); };
const wp = (v) => { v = String(v || "").toLowerCase(); return v.includes("remote") ? "remote" : v.includes("hybrid") ? "hybrid" : /on.?site/.test(v) ? "onsite" : "unknown"; };

async function getJSON(url) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const r = await fetch(url, { headers: { "user-agent": "startup-search-jobs/1.0" } });
    if (r.status === 429 || r.status >= 500) { await new Promise((ok) => setTimeout(ok, 1500 * (attempt + 1))); continue; }
    if (!r.ok) throw new Error("HTTP " + r.status);
    return r.json();
  }
  throw new Error("gave up after retries");
}

const ADAPTERS = {
  async greenhouse(slug) {
    const d = await getJSON(`https://boards-api.greenhouse.io/v1/boards/${encodeURIComponent(slug)}/jobs?content=true`);
    return (d.jobs || []).map((j) => ({ id: "gh" + j.id, title: j.title, url: j.absolute_url, location: j.location?.name || "",
      workplace: wp(j.location?.name), posted: day(j.first_published || j.updated_at), compMin: 0, compMax: 0, desc: toText(j.content) }));
  },
  async ashby(slug) {
    const d = await getJSON(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(slug)}?includeCompensation=true`);
    return (d.jobs || []).filter((j) => j.isListed !== false).map((j) => {
      const comp = (j.compensation?.summaryComponents || []).find((c) => /salary/i.test(c.compensationType || ""));
      return { id: "ab" + j.id, title: j.title, url: j.jobUrl,
        location: [j.location, ...(j.secondaryLocations || []).map((x) => x.location)].filter(Boolean).join(" / "),
        workplace: j.isRemote ? "remote" : wp(j.workplaceType), posted: day(j.publishedAt),
        compMin: comp?.minValue || 0, compMax: comp?.maxValue || 0, desc: j.descriptionPlain || toText(j.descriptionHtml) };
    });
  },
  async lever(slug) {
    const d = await getJSON(`https://api.lever.co/v0/postings/${encodeURIComponent(slug)}?mode=json`);
    return (Array.isArray(d) ? d : []).map((j) => ({ id: "lv" + j.id, title: j.text, url: j.hostedUrl,
      location: (j.categories?.allLocations || [j.categories?.location]).filter(Boolean).join(" / "),
      workplace: wp(j.workplaceType), posted: day(j.createdAt), compMin: j.salaryRange?.min || 0, compMax: j.salaryRange?.max || 0,
      desc: [j.descriptionPlain, ...(j.lists || []).map((l) => l.text + "\n" + toText(l.content)), j.additionalPlain].filter(Boolean).join("\n") }));
  },
};

const out = [];
let ok = 0, failed = 0, kept = 0, total = 0;
const queue = [...boards];
async function worker() {
  while (queue.length) {
    const b = queue.shift();
    try {
      const jobs = await ADAPTERS[b.ats](b.slug);
      const scoped = jobs.filter((j) => inScope(j.title)).map((j) => ({ ...j, desc: (j.desc || "").slice(0, 5000) }));
      out.push({ name: b.name, ats: b.ats, slug: b.slug, status: "ok", total: jobs.length, jobs: scoped });
      ok++; total += jobs.length; kept += scoped.length;
      console.log(`ok    ${b.ats.padEnd(10)} ${b.slug.padEnd(36)} ${String(jobs.length).padStart(4)} roles, ${scoped.length} in scope`);
    } catch (e) {
      out.push({ name: b.name, ats: b.ats, slug: b.slug, status: "error: " + e.message, total: 0, jobs: [] });
      failed++;
      console.log(`FAIL  ${b.ats.padEnd(10)} ${b.slug.padEnd(36)} ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
out.sort((a, b) => a.name.localeCompare(b.name));
mkdirSync(new URL("../site/", import.meta.url), { recursive: true });
writeFileSync(new URL("../site/jobs.json", import.meta.url), JSON.stringify({ generatedAt: new Date().toISOString(), boards: out }));
console.log(`\n${ok} boards read, ${failed} failed · ${total} open roles · ${kept} in scope`);
if (ok === 0) process.exit(1);
