# GeoJSON map portal with bbox query

A pattern that recurs whenever someone built a "search on a map" UI without using ArcGIS or a standard GIS stack — typically council/municipal portals, real-estate search, asset locators, and bespoke spatial dashboards. The frontend renders a Leaflet/MapboxGL/OpenLayers map and POSTs the current viewport rectangle plus filter values to a custom endpoint that returns GeoJSON.

If your target speaks ArcGIS REST, see `arcgis-feature-server.md` instead — that's a documented protocol with consistent semantics. This page is for the *unbranded* equivalent: a bespoke spatial API with bbox-style filtering and no official spec.

## When you see this

- POST to an endpoint that takes a JSON body with `BBox` (or `bbox`, `bounds`, `extent`) — usually `{west, south, east, north}` or `[xmin, ymin, xmax, ymax]`
- Body also carries `ViewPort`, `PixelWidth`, `PixelHeight`, `Zoom`, or a similar viewport descriptor (server uses it to cluster or LOD-filter results)
- Response is GeoJSON-shaped: `{"features": [{"type": "Feature", "properties": {...}, "geometry": {...}}], "totalFeatures": N}`
- Frontend is Leaflet/MapboxGL/OpenLayers — the map UI has zoom controls, layer toggles, and a "draw a search box" tool
- No standard ArcGIS path (`/arcgis/rest/services/...`) anywhere in the HAR

## How it works

The map UI shows features within the current viewport. Every time the user pans, zooms, or applies a filter, the client sends the new bbox + filters and the server responds with the features inside that rectangle. There's no concept of "all features at once" from the server's perspective — it always answers a spatial slice.

For scraping you exploit that by **sending a bbox large enough to cover the entire dataset** in a single request, plus paginating with offset (when supported) or splitting the bbox into a quadtree when the server caps results.

```python
import httpx

WORLD_BBOX = {"BBox": {"west": -180, "south": -90, "east": 180, "north": 90}}

def fetch_all(client: httpx.Client, extra_filters: dict | None = None):
    body = {
        **WORLD_BBOX,
        "ViewPort": {"PixelWidth": 1920, "PixelHeight": 1080},  # often required
        "StartIndex": 0,
        "PageSize": 1000,
        **(extra_filters or {}),
    }
    r = client.post(ENDPOINT, json=body, timeout=120)
    payload = r.json()
    yield from payload["features"]
```

Three things to watch for that often break the "one giant bbox" approach:

1. **The server caps results per request** (e.g. `totalFeatures: 50000` but `len(features) == 5000`). Check `len(features)` vs the implied total; if capped, switch to bbox quadtree.
2. **The server returns clusters/LOD instead of individual features at wide zoom.** You get `{"properties": {"count": 142, ...}}` instead of `{"properties": {"id": "...", "address": "...", ...}}`. Workaround: send a higher Zoom value or split into smaller bboxes until cluster collapse threshold is passed.
3. **Date filters use epoch milliseconds** — `StartDateUnixEpochNumber: 1704067200000` (Jan 1 2024 UTC). Multiply unix seconds by 1000.

## Bbox quadtree fallback

When the server caps results and you need everything, recursively subdivide the bbox:

```python
def quadtree_fetch(client, bbox: dict, cap: int = 5000):
    body = {**bbox, "StartIndex": 0, "PageSize": cap + 1}
    payload = client.post(ENDPOINT, json=body, timeout=120).json()
    feats = payload["features"]
    if len(feats) <= cap:
        yield from feats
        return
    # Too many in this cell — split into 4 quadrants and recurse
    midx = (bbox["BBox"]["west"] + bbox["BBox"]["east"]) / 2
    midy = (bbox["BBox"]["south"] + bbox["BBox"]["north"]) / 2
    for west, south, east, north in [
        (bbox["BBox"]["west"], bbox["BBox"]["south"], midx, midy),
        (midx, bbox["BBox"]["south"], bbox["BBox"]["east"], midy),
        (bbox["BBox"]["west"], midy, midx, bbox["BBox"]["north"]),
        (midx, midy, bbox["BBox"]["east"], bbox["BBox"]["north"]),
    ]:
        sub = {"BBox": {"west": west, "south": south, "east": east, "north": north}}
        yield from quadtree_fetch(client, sub, cap)
```

Deduplicate features by stable ID at the end — features near a split boundary may be returned twice.

## Discovering the bbox params

The body schema isn't standardized — every bespoke portal invents its own naming. Capture one real request from a HAR and inspect:

```bash
# Look for any key that holds 4 floats or 2 nested {lat,lng} pairs
python3 -c "import json,sys; r=json.load(open(sys.argv[1])); \
  print(json.dumps([e['request']['postData'] for e in r['log']['entries'] \
                    if e['request']['method']=='POST' and 'postData' in e['request']][:3], indent=2))" capture.har
```

Common naming variants:
- `BBox`, `bbox`, `bounds`, `extent`, `mapBounds`, `viewBounds`
- `{west, south, east, north}` / `{xmin, ymin, xmax, ymax}` / `{minLng, minLat, maxLng, maxLat}` / `[w, s, e, n]`
- ViewPort meta: `PixelWidth/Height`, `Zoom`, `screenWidth/Height`, `mapZoom`

## Gotchas

- **Coordinate order trap:** GeoJSON's spec is `[longitude, latitude]`, but many bespoke APIs use `[latitude, longitude]` because that's how humans say it. Compare against a known reference point before trusting the data.
- **Spatial reference / projection** — most use WGS84 (lat/lon, EPSG:4326), but locally-deployed gov portals may use a country-specific projection (UTM zones, OSGB36, GDA2020). Coordinates look "wrong" until reprojected. Look for `spatialReference`, `srs`, `crs`, `epsg` keys in the response.
- **Server clustering kicks in at zoomed-out views.** A request with a continent-sized bbox often returns cluster aggregates, not individual features. Quadtree-down until you see `geometry.type: "Point"` (or whatever your detail shape is).
- **Date params in epoch milliseconds, not seconds and not ISO.** Off-by-1000 errors are silent here — the server filters on "anything since timestamp 1704067200" and you get the last 50 years of records.
- **Pagination conventions are inconsistent.** Look for `StartIndex`/`PageSize`, `offset`/`limit`, `page`/`per_page`, or "no pagination" (single-shot up to a cap). When in doubt, request a tiny page and inspect what changes between two consecutive calls.
- **CSRF / anti-bot on map APIs is light** (the API was designed for the public map UI, not for protected data), but rate limits often kick in around 5–10 requests/sec. Throttle to 2/sec by default.
- **Authentication is rare but exists.** Some portals require an opaque `mapToken` from the initial page load; grep the page HTML for `mapToken=`, `apiKey=`, or `bearer` and echo it in subsequent calls.

## Related

- `arcgis-feature-server.md` — when the target IS standard Esri ArcGIS (more common than you'd think)
- `../discovery/har-driven-workflow.md` — how to recover the bbox endpoint and body schema from a real session
- `spa-frameworks.md` — most map portals are SPAs; the hydration / API discovery flow applies
