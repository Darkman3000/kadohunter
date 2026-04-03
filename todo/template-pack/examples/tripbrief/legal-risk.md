# Domain Risk Classification (Per App)

**App slug**: `tripbrief`  
**Owner**: `Product owner`  
**Last reviewed**: `review before launch`  
**Applies to**: `web / iOS / Android / backend`

---

## App Summary

| Field | Value |
|-------|-------|
| **One-liner** | `AI trip-planning assistant for building and revisiting itineraries.` |
| **Primary user persona** | `frequent travelers who want a clear trip plan` |
| **Monetization** | `subscription` |
| **Regions** | `EU + US` |

---

## Risk Flags (Yes/No)

| Flag | Yes/No | Notes |
|------|--------|-------|
| UGC (public posting/sharing) | `No` | `sharing is optional and not public by default` |
| User-to-user messaging | `No` | `not part of MVP` |
| Minors likely / kids risk | `No` | `not a child-targeted product` |
| Health / mental health | `No` | `not a wellness or clinical product` |
| Finance / investing | `No` | `not a finance product` |
| Location / camera / mic | `Yes` | `location may improve itinerary relevance if enabled later` |
| Ads / tracking SDKs | `Yes` | `analytics and attribution may be added` |

---

## Enabled Modules

- [ ] `permissions`: `document any location or notification consent flow`
- [ ] `tracking`: `document analytics and attribution disclosures`
- [ ] `billing`: `document purchase, restore, and refund surfaces`
- [ ] `retention`: `document account deletion and data retention policy`

Replace these with the legal modules or policy checklists that apply to the project.

---

## Store Form Impact

| Field | Value |
|-------|-------|
| **Data collected** | `account data, trip preferences, and saved itineraries` |
| **Data shared** | `billing providers and analytics providers if enabled` |
| **Data used for tracking** | `TBD based on analytics choices` |
| **Data linked to identity** | `Yes` |

---

## Gate Sign-off

| Field | Value |
|-------|-------|
| **Approved to build** | `Yes` |
| **Blockers (if No)** | `none at planning time` |