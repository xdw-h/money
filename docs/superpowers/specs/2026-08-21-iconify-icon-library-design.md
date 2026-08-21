# Iconify Mobile Icon Library Design

## Goal

Expand the mobile bookkeeping icon library for both categories and ledgers while preserving existing Emoji data, offline display, and ZIP backup portability.

## User Experience

- Replace the current fixed Emoji sheet with one shared mobile picker used by category and ledger editors.
- Keep a search field at the top and three tabs: `常用`, `在线`, and `Emoji`.
- `常用` shows built-in recommendations and recently selected icons without a network request.
- `在线` searches approved Iconify collections after the user enters a query. Search accepts common Chinese bookkeeping terms and English keywords.
- `Emoji` retains the current categorized Emoji library.
- Selecting any item closes the picker and immediately updates the editor preview, matching current behavior.
- Loading, no-results, offline, and request-failure states use concise Chinese messages and never leave an empty unexplained panel.

## Icon Sources

- Use the public Iconify API only for discovery and fetching icons that are not already cached.
- Limit results to two or three approved open-source collections with consistent visual weight, initially Material Design Icons and Tabler Icons.
- Do not expose the entire Iconify collection catalog because mixed licenses and visual styles would make the product inconsistent.
- Keep a small local Chinese-to-English keyword map for bookkeeping terms such as `餐饮`, `咖啡`, `交通`, `地铁`, `医疗`, `宠物`, and `工资`. Unknown Chinese queries show a helpful suggestion instead of sending meaningless searches.

## Data Model

- Existing Emoji values remain plain Unicode strings, for example `📒`.
- New SVG selections use `iconify:<prefix>:<name>`, for example `iconify:mdi:coffee`.
- Add an `IconAsset` record containing the icon key, sanitized Iconify body, dimensions, collection, and cache timestamp.
- Add an IndexedDB `iconAssets` table in the next Dexie schema version. Categories and ledgers continue to store only the compact icon key.
- Add a bounded recent-icon list in local storage. Remove least-recent entries after 30 items; do not evict assets still referenced by a category or ledger.

## Rendering

- Introduce one shared icon renderer used everywhere categories and ledgers appear.
- Plain Unicode values render as text exactly as they do today.
- `iconify:` values resolve from the local `iconAssets` table and render an SVG with `currentColor`.
- When a referenced SVG is missing, render a safe `✦` fallback and attempt a background fetch only while online.
- Sanitize and validate Iconify icon data before persistence. Never render arbitrary SVG markup received outside the expected Iconify JSON shape.

## Online And Offline Flow

1. The picker loads local recommendations, recent choices, Emoji, and cached SVG assets immediately.
2. Online searches are debounced and cancel stale requests.
3. Search results show lightweight previews from validated Iconify data.
4. Selecting a result persists its asset before emitting the icon key.
5. Offline mode disables only remote search. Existing Emoji and cached SVG icons remain usable.
6. Network failure shows `网络不可用，已展示本地图标` and preserves the current results.

## Backup And Restore

- Add cached assets referenced by exported categories and ledgers to `icons.json` inside the ZIP.
- Advance the backup manifest to version 2 while continuing to accept version 1 backups.
- Version 1 imports restore exactly as today and contain only Emoji unless their records already use an unknown future key, which safely falls back.
- Version 2 imports validate icon keys and asset records before writing them to `iconAssets`.
- Do not export unused search cache entries, keeping backups compact.

## Component Boundaries

- `IconDisplay`: renders Emoji or locally cached Iconify SVG with a fallback.
- `IconPickerField`: owns sheet state, tabs, search text, recent choices, and selection events.
- `iconCatalog`: contains approved collections, Chinese keyword aliases, and built-in recommendations.
- `iconService`: performs search, fetch, validation, caching, and referenced-asset lookup.
- Existing category and ledger stores continue accepting a string icon key and require no record migration.

## Testing

- Preserve all existing Emoji picker, category, and ledger tests.
- Cover icon-key parsing and invalid values.
- Cover Chinese keyword mapping, approved-collection filtering, debounce, stale-response cancellation, empty results, and offline failure.
- Cover cache-first rendering, selected-asset persistence, missing-asset fallback, and recent-item limits.
- Cover category and ledger create/edit flows with Iconify keys.
- Cover ZIP v2 export/import, referenced-only assets, and backward-compatible v1 restore.
- Perform mobile viewport checks for search keyboard space, scrolling, safe-area padding, and all four picker states.

## Out Of Scope

- User-uploaded SVG files.
- Self-hosting the Iconify API.
- Replacing navigation or system action icons.
- Automatically converting existing Emoji selections to SVG.
