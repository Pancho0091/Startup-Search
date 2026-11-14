# Startup Search

A single-file job-search tracker for startup roles in Los Angeles and Orange County. Paste a job posting or add a target company; the tool extracts the details, scores the lead against your profile, and tells you what to do next.

Open `index.html` in a browser. There is nothing to install and no server.

## How it works

```
paste posting / add company ──► parse fields ──► score (0–100) ──► pipeline stage ──► next follow-up
```

**Score** = Σ weight × factor / 5, with each factor on a 0–5 scale. Weights are editable in Settings.

| Factor | Default weight | How it's measured |
|---|---|---|
| Role fit | 25 | Keyword-cluster coverage of the posting × role-type priority, minus red flags |
| Domain | 15 | Talent / HR-tech / future-of-work company |
| AI relevance | 15 | AI-native company or AI keywords |
| Access | 20 | Warmest contact you have at the company (0 cold → 5 will refer you) |
| Timing | 10 | Posting age, or months since the last funding round |
| Geography | 10 | Commute from your home base, softened by fewer on-site days; remote = 5 |
| Level | 5 | Lead / Head-of / Manager titles score high; junior titles flagged |
| Comp | 0 | Range vs. your comp floor (weight it if it matters) |

**Role types** (A–J) are detected from the posting and drive which proof points the tool suggests you lead with:
A first data hire, B HR-tech / AI recruiting, C BizOps / Strategy & Ops, D People Analytics, E analytics engineer, F ops analytics at hardware / medtech / DTC, G product ops / product analytics, H GTM / RevOps / growth analytics, I AI solutions / deployment, J strategic finance / programs.

**Optional Claude analysis.** Add an Anthropic API key in Settings to get structured extraction plus a "why you fit / gaps / lead with" read on each lead. The key is stored only in your browser and is never exported. This needs the file opened directly or hosted (for example on GitHub Pages).

## Your data stays out of git

All leads, contacts, and settings live in your browser's local storage. Use **Settings → Download backup** regularly. The `private/` folder and backup files are git-ignored, so a personal profile file (settings + proof points) can sit next to the tool and be loaded with **Settings → Import**.

The repository ships with clearly marked, made-up sample data so the tool opens in a working state. Remove it with one click.

## CSV import

Columns recognized (any order, case-insensitive): `company, title, url, location, workplace, stage, posted, sector, funding_stage, raise_date, source, notes, comp_min, comp_max`. A row without a title becomes a target-company lead.
