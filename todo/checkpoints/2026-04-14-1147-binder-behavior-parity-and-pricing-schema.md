# Checkpoint: Binder Behavior Parity & Pricing Schema

## Completed:
- **Binder Behavior Parity:** Achieved feature parity for the KadoHunter prototype, closing out the core mobile/web functional gap for the Binder.
- **Bulk Selection Mode:** Added right-click/long-press gestures to trigger multi-select interfaces with dimmed/highlighted visual indicators.
- **Bulk Actions:** Added floating Glassmorphic bar that triggers `deleteFromCollection` with optimistic updates across all selected items.
- **Filter/Sort Improvements:** Added Tag Dropdowns, Sort direction toggle (ASC/DESC), and expanded the sorting parameters directly into the view array logic.
- **Pricing Schema Prep (v2):** Appended `priceHistory` log array and `lastPriceUpdate` fields directly to the `savedScans` schema to prevent future structural lock-in, preparing the way for a daily hybrid pricing cron.

## Pipeline Decisions:
- **Data Architecture:** Explicitly chose NOT to pursue heavy AWS infrastructure (EC2/Dagster/dbt/Soda) like in `poke-cli`. We adopted the abstract "Validate -> Stage -> Check -> Promote" principle but stripped the bloat using serverless Convex CRONs (Hybrid hot-list pricing update).

## Verification:
- All packages successfully passed Linting (`tsc --noEmit`). Web/Mobile viewports checked.
