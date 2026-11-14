# Startup Search

A single-file job-search tracker for startup roles in Los Angeles and Orange County. Paste a job posting or add a target company; the tool extracts the details, scores the lead against your profile, and tells you what to do next.

**Live app:** https://pancho0091.github.io/Startup-Search/ (works on desktop and phone). You can also download `index.html` and open it directly. There is nothing to install and no server.

Each device and browser keeps its own data. Use **Settings → Download backup** on one device and **Import** on another to move your leads.

## How it works

```
paste posting / add company ──► parse fields ──► score (0–100) ──► pipeline stage ──► next follow-up
```

**Score** = fit × access multiplier, then hard gates.

```
fit    = Σ weight × factor / 5        (factors 0–5, normalized to 100)
access = 0.6 (cold) … 1.0 (knows you well) … 1.1 (will refer you)
gates  = capped at 50 if role fit is weak; capped at 40 if below your cash floor
```

| Factor | Default weight | How it's measured |
|---|---|---|
| Role fit | 30 | Keyword-cluster coverage of the posting × lane priority, minus red flags (or Claude's read) |
| Focus fit | 15 | Talent/HR-tech or AI company; only counts fully when role fit is solid |
| Company health | 15 | Months since last raise (runway proxy), strong lead investor, recent layoffs |
| Timing | 10 | Postings: age (reposted or 45+ days scores low). Target companies: raise recency |
| Commute | 15 | Weekly hours in the car: one-way peak minutes × 2 × days on-site. Remote scores 3 (national applicant pool) |
| Level | 15 | Title vs. your target level, plus "reports to CEO/COO" and team-building scope in the description |

The Today view also tracks weekly targets (5 warm conversations, 3 referred applications, at most 5 cold applications) and shows whether high-scoring leads actually convert better, so the weights can be calibrated against real outcomes.

**Role types** (A–J) are detected from the posting and drive which proof points the tool suggests you lead with:
A first data hire, B HR-tech / AI recruiting, C BizOps / Strategy & Ops, D People Analytics, E analytics engineer, F ops analytics at hardware / medtech / DTC, G product ops / product analytics, H GTM / RevOps / growth analytics, I AI solutions / deployment, J strategic finance / programs.

**Optional Claude analysis.** Add an Anthropic API key in Settings to get structured extraction plus a "why you fit / gaps / lead with" read on each lead. The key is stored only in your browser and is never exported. This needs the file opened directly or hosted (for example on GitHub Pages).

## Watchlist

The **Watchlist** tab reads company job boards directly from your browser through the public Greenhouse, Ashby, and Lever posting APIs. Press **Check all boards** to pull every open role, keep the ones that match (analytics, strategy, operations, finance, or people roles at senior level, in LA / OC or remote at an LA-based or HR-tech company), and add any of them to your leads with one click.

It ships with a starter list of 32 LA/OC and HR-tech companies, taken from real postings found during research. Add more by pasting a company's careers link (`jobs.ashbyhq.com/…`, `job-boards.greenhouse.io/…`, `jobs.lever.co/…`). Rippling boards and companies without a known board are listed with a link to open or find them.

## Your data stays out of git

All leads, contacts, and settings live in your browser's local storage. Use **Settings → Download backup** regularly. The `private/` folder and backup files are git-ignored, so a personal profile file (settings + proof points) can sit next to the tool and be loaded with **Settings → Import**.

The repository ships with clearly marked, made-up sample data so the tool opens in a working state. Remove it with one click.

## CSV import

Columns recognized (any order, case-insensitive): `company, title, url, location, workplace, stage, posted, sector, funding_stage, raise_date, source, notes, comp_min, comp_max`. A row without a title becomes a target-company lead.

## Deployment

`.github/workflows/pages.yml` publishes `index.html` (and nothing else) to GitHub Pages on every push that changes it. One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
