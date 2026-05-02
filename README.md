# Micro-SaaS Unit Economics Studio

A dark-mode-first web app for founders who want to pressure-test whether a Micro-SaaS or AI-SaaS idea can become economically viable.

The app helps answer:

- How many paid users are needed to hit a target MRR or ARR?
- What price is needed to keep gross margin healthy?
- How much do API-heavy features cost per user and per month?
- How do free users, paid users, conversion, churn, hosting costs, and AI usage affect profitability?
- Which assumptions make the business healthy, risky, or structurally weak?

## What is included

- Dashboard with MRR, ARR, costs, profit, margins, break-even users, and health status
- Scenario Builder for traffic, conversion, pricing, churn, and cost assumptions
- AI/API Cost Guard for feature-level usage and model cost assumptions
- Break-even and Pricing page with practical founder readouts
- Scenario Comparison for up to three saved scenarios
- Risk Radar with a sensitivity table and founder recommendations
- Interactive Growth Simulator for MRR, costs, AI/API spend, profit, and asset value over time
- Idea Score, experiment plan, and TrustMRR-style asset benchmark
- Scenario templates for common Micro-SaaS shapes
- 10 built-in SaaS idea scenarios, including a TrustMRR-inspired revenue intelligence idea
- Two demo scenarios:
  - Lean B2B Micro-SaaS
  - AI-heavy Freemium SaaS
- Browser-only persistence with `localStorage`
- JSON import/export for backups and sharing
- CSV export for lightweight spreadsheet analysis
- Shareable single-scenario links encoded in the URL
- Recharts visualizations
- Pure TypeScript calculation utilities with Vitest tests

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful checks:

```bash
npm run test
npm run lint
npm run build
```

## Deploy to Vercel

1. Push this repository to GitHub.
2. Create a new Vercel project from the repo.
3. Keep the default Next.js build settings.
4. Deploy.

No environment variables are required for v0.1.

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy-pages.yml`.

After pushing to `main`, GitHub can build and publish the static app to:

```text
https://niklasnikvisualsmedia333.github.io/micro-saas-unit-economics-studio/
```

If Pages is not enabled yet, open the repository on GitHub, go to **Settings → Pages**, and choose **GitHub Actions** as the source.

## Intentionally not included in v0.1

- No authentication
- No database
- No paid APIs
- No Stripe integration
- No Supabase integration
- No OpenAI API usage
- No live model pricing
- No server-side persistence for share links

Model prices in the app are editable planning assumptions. The OpenAI defaults were seeded from the public OpenAI API pricing page, but you should verify current provider pricing before making real launch decisions.

## Roadmap

### v0.2

- Supabase Auth and database
- Persistent shareable scenario links
- Optional OpenAI-powered pricing critique button
- More pricing templates
- Team workspaces

### v0.3

- Public templates
- Founder-market-fit module
- Startup job radar module
- Company snapshot module
- Benchmark database
