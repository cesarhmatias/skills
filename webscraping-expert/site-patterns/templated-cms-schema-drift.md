# Templated CMS — schema drift across deployments

A pattern that bites everyone the first time: a vendor sells a CMS / portal product to many customers. Each customer deploys the same template, but **field names, column headers, and JSON keys drift between installations**. Mapping you wrote for customer A will silently miss data from customer B.

## When you see this

- Multiple sites use what is obviously the same template (same layout, same UI controls, same JS bundles)
- Vendor branding present (footer "Powered by X", JS namespace, URL patterns)
- You're tempted to write a single hardcoded schema mapping ("the date column is always called 'Decision Date'")

Common offenders:
- WordPress installs with the same plugin (custom field names vary)
- Salesforce orgs sharing a managed package (label translations vary)
- ServiceNow instances across enterprises
- Municipal / government portal products deployed across many councils
- Banking platforms (Temenos, Finastra) deployed across many banks

## How it goes wrong

You inspect deployment A, observe a field labeled `"Decision Date"`, hardcode the lookup, and ship. Six months later you onboard deployment B — same template, but the local admin renamed the field to `"Decision date"` (lowercase `d`), or to `"Determination Date"`, or just dropped it.

Your code:
```python
decision_date = payload["Decision Date"]  # KeyError on deployment B
```

…silently produces null values for an unknown percentage of records, and you discover it weeks later when someone asks why a dashboard is wrong.

## Real-world drift examples

For a single municipal portal product, observed across many deployments:

| Deployment | "Decision Date" key |
|---|---|
| A | `Decision Date` |
| B | `Decision date` (lowercase `d`) |
| C | `Responsible Authority Decision Date` |
| D | `Date` (only — needs context to disambiguate) |
| E | `Determination Date` |
| F | absent — site doesn't expose this field at all |

All six sites run the **exact same vendor template**.

## Mitigation — never assume, always validate

**Rule 1:** When configuring a new deployment, validate against real data before mapping:

```sql
-- Check what keys actually appear in raw payloads
SELECT k, COUNT(*) FILTER (WHERE coalesce(payload->>k, '') <> '') AS non_empty
FROM raw_records, jsonb_object_keys(payload) k
WHERE source = :deployment_name
  AND lower(k) ~ '(decision|determination|outcome|date)'
GROUP BY k ORDER BY non_empty DESC;
```

This single query, run against ~50 records, tells you which key actually holds the data.

**Rule 2:** Store the per-deployment mapping in config, not in code:

```python
# config.py — one entry per deployment
FIELD_MAPPING_PER_DEPLOYMENT: dict[str, dict[str, list[str]]] = {
    "deployment_a": {"decision_date": ["Decision Date"]},
    "deployment_b": {"decision_date": ["Decision date"]},
    "deployment_c": {"decision_date": ["Responsible Authority Decision Date"]},
    "deployment_d": {"decision_date": ["Date"]},  # contextually disambiguated upstream
}
```

Then the crawler is generic and the config is the only place that changes per deployment.

**Rule 3:** Normalize in the parser, not in the consumer. If deployment D uses `Date` but the canonical name is `Decision Date`, rename at extraction time:

```python
def _normalize_decision_date(payload: dict, deployment_key: str) -> dict:
    raw_keys = FIELD_MAPPING_PER_DEPLOYMENT[deployment_key]["decision_date"]
    for key in raw_keys:
        if payload.get(key):
            payload["Decision Date"] = payload[key]  # canonical name
            break
    return payload
```

Downstream code only knows about `Decision Date`. Adding deployment G with `Outcome Date` is a one-line config edit.

## When the field is genuinely absent

Sometimes a deployment legitimately doesn't expose the field. Make that explicit:

```python
FIELD_MAPPING_PER_DEPLOYMENT = {
    ...
    "deployment_f": {"decision_date": None},  # this deployment doesn't have it
}
```

Then dashboards can distinguish "0% because the field isn't exposed" from "0% because our mapping is wrong" — a critical difference for debugging.

## Case-sensitivity is the most common bug

Among all drifts, ASCII case is by far the most common: `Order Date` vs `Order date`, `Total Cost` vs `Total cost`, `Item Number` vs `Item number`. Many DOM-to-text conversions strip exactly one space or change exactly one letter.

When debugging a "this field is empty for this one deployment" issue, **always** print the exact key including case before assuming it's a data quality issue.

## Field discovery query (run for any new deployment)

```sql
-- All payload keys observed in this deployment, sorted by occurrence
SELECT k, COUNT(*) AS n
FROM raw_records, jsonb_object_keys(payload) k
WHERE source = :deployment
GROUP BY k ORDER BY n DESC LIMIT 50;
```

Run this immediately after the first batch lands. The list is your ground truth — don't trust intuition from another deployment.

## Related

- `../discovery/devtools-workflow.md` — how to inspect a new deployment cleanly
- `../parsing/document-extraction.md` — strategies for extracting data from drifting templates
