# Hatchet Value Digest — a growth proof-of-concept

A small prototype that turns the value Hatchet already measures into value the customer can see.

Built with the Hatchet TypeScript SDK. It runs as a real Hatchet workflow — cron-scheduled, fan-out/fan-in, with automatic retries.

## The idea in one line

Hatchet already tracks how much work it saves you — retries recovered, tasks completed, failures caught. But that data lives in observability, as raw metrics for engineers debugging. The customer never sees it. This POC builds the missing layer: it reads run telemetry and turns it into a per-user value message.

Instead of `retried_tasks_total: 340`, the customer gets:
> *"This month Hatchet recovered 340 tasks that would have failed — saving you about 14 hours of recovery work."*

## Why this matters for a usage-based product

Hatchet is priced by usage: the more tasks you run, the more you pay. That creates a quiet fear — the more I use it, the bigger the bill. The value digest flips it: when the customer sees what Hatchet saves them, usage stops being a cost to fear and becomes value they can see. It's strongest exactly where Hatchet wins — AI-first teams, where failures are frequent and expensive.

## What it does

A single `value-digest` workflow:

- `fetch-users` — lists active users (the DAG entry point)
- `compute-acme` / `compute-globex` — compute each user's value summary in parallel (fan-out). Each carries a retry policy, because in production this reads a metrics API that can rate-limit.
- `aggregate-digest` — waits for both (fan-in), then generates the value message.

It's cron-scheduled (`0 8 * * *`) and can be triggered manually for a demo.

## Why build it with Hatchet

The digest is itself a textbook Hatchet workload — scheduled, parallel, durable, with retries. Using the product to do growth on the product.

## Proof it runs

One compute task is intentionally made to fail once, to show Hatchet's automatic recovery live.

### Terminal output:
```
🪓 [INFO/ctx] Computing value summary for Acme Corp...
🪓 [INFO/ctx] Simulating a transient failure for demonstration purposes...
🪓 [ERROR] Task run failed: Simulated transient failure   compute-acme
🪓 [INFO] Task run starting...   compute-acme        ← Hatchet retries automatically
🪓 [INFO] Task run completed     compute-acme        ← recovered

======================================================
                 HATCHET VALUE DIGEST                 
======================================================

🏢 Customer: Acme Corp
✅ Recovered Tasks: 340
⏱️  Engineering Time Saved: ~14.2 hours

🏢 Customer: Globex Inc
✅ Recovered Tasks: 1250
⏱️  Engineering Time Saved: ~52.1 hours

======================================================
```

![Hatchet run — fan-out, compute-acme failing and being retried, aggregate fanning in](docs/dashboard-run.png?v=2)

*Waterfall view: fetch-users runs first, then compute-acme and compute-globex fan out in parallel. compute-acme fails on purpose (red) and Hatchet retries it automatically; aggregate-digest waits for both (fan-in).*

In the dashboard, `compute-acme` goes red → retry → green while `compute-globex` runs clean — fan-out and automatic recovery, visible live.

## What's real and what I'd validate

This is an outside-in prototype. I don't have Hatchet's internal data, so I'm explicit about what's solid and what isn't:

| Metric | Source / Status |
|---|---|
| **Tasks recovered** | `hatchet_retried_tasks_total` — Hatchet already exposes it (Real) |
| **Time saved** | recovered × per-incident time (Needs a calibrated multiplier, not hardcoded) |
| **Cost saved** | (not re-paying for an expensive step after a checkpoint) needs a `cost_per_step` signal (Future — Hatchet doesn't have this data yet) |

I'd ship time-saved first with an honest multiplier, and treat cost-saved as the v2 that needs one new piece of data.
The metrics in this demo are simulated behind a `MetricsSource` interface — swapping the simulated source for a real `HatchetMetricsSource` is a one-line change.

## Run it

```bash
npm install
# add your HATCHET_CLIENT_TOKEN to a .env file
npm run demo
```

The worker registers the workflow, then triggers one run. Watch the dashboard for the fan-out and the red→green recovery; the value digest prints in the terminal.

---
*Built by Marco Milanello as an outside-in growth prototype for Hatchet. The point isn't the code — it's how I'd think about growth inside a product like this.*
