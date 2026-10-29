# Scripts

**Scope:** Deterministic helpers for fragile extraction protocols. Keep private HARs and live session values outside the skill repository.

## Files

| File | Use |
|---|---|
| `natural_for_ajax.py` | Parse and exactly reserialize Natural for Ajax request streams from a HAR (`roundtrip`), or compare reference and replica entries with explicit dynamic slots (`compare`). Standard library only; emits sanitized structural JSON. |
| `test_natural_for_ajax.py` | Synthetic unit tests for UTF-16 lengths, `encodeURIComponent`, round-trips, header order, static mismatches, and session provenance. |

Run the tests from the repository root:

```bash
python webscraping-expert/scripts/test_natural_for_ajax.py
```

Read `../discovery/har-exact-replay.md` before using the comparator. A passing HAR comparison does not certify TLS, HTTP framing, or wire order.
