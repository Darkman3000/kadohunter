# Product Requirements Document - `TripBrief`

> Purpose: define exactly what `TripBrief` is building before architecture work expands.  
> Rule: if a feature is not in this PRD, it is not part of the MVP.

## 1. Product Definition

`TripBrief` is a `cross-platform AI travel-planning assistant` product for `frequent travelers who want a trip plan they can trust and revisit`.

## 2. Problem

`Trip planning is fragmented across too many tools, which makes it slow to compare options, build an itinerary, and keep plans updated across devices.`

## 3. Target User

Primary user:

- `frequent travelers planning city breaks or short vacations`

Primary user story:

- As a `traveler`, I want to `build and edit a complete trip plan in one place`, so I can `book with confidence and reuse the plan on web or mobile`.

## 4. Core Promise

`TripBrief` should make `the first useful itinerary appear quickly and stay editable across devices`.

The first user-facing promise is:

- `enter destination and dates`
- `get a draft itinerary with structured days`
- `save the trip plan to the account`
- `reopen and refine the plan on another device`

## 5. MVP Scope

### P0 - Must Have

- `web and mobile clients with a shared backend`
- `account-based saved trip plans`
- `AI-assisted itinerary generation`
- `trip editing and persistence across sessions`

### P1 - Should Have

- `collaboration or trip sharing`
- `booking link storage`
- `travel preference onboarding`

### P2 - Later

- `offline itinerary access`
- `calendar sync`
- `group expense planning`

## 6. Explicit Non-Goals For MVP

- `full booking checkout inside the app`
- `multi-user real-time collaboration`
- `airline or hotel loyalty integrations`

## 7. User Journey

1. User lands in the app and understands the promise quickly.
2. User completes `a simple destination and travel-style intake flow`.
3. User signs in or creates an account.
4. User completes `destination, dates, and traveler preference input`.
5. User completes `trip constraints such as budget and pace`.
6. System runs `itinerary generation and trip structuring`.
7. User receives `a day-by-day trip plan with recommendations`.
8. User saves or shares `the itinerary`.
9. User can return on another session or device and recover state.
10. User sees `a usage limit or upgrade prompt` at the correct point in the funnel.

## 8. Default Technical Direction

- Web: `Next.js`
- Mobile: `Expo`
- Backend: `Express`
- Auth: `Clerk`
- Data: `Convex`
- Hosting: `Railway`
- AI: `OpenAI`

## 9. Monetization Hypothesis

- Free tier: `a limited number of saved or generated trips per month`
- Paid tier: `higher generation limits plus premium trip organization features`
- Upgrade trigger: `users who revisit or edit saved itineraries`

## 10. Success Metrics

- Primary metric: `first 20 users who create and revisit a saved trip plan`
- Secondary metric 1: `trip-plan completion rate`
- Secondary metric 2: `week-one return rate`
- Secondary metric 3: `paid conversion from repeat planners`

## 11. Kill Criteria

- `users do not complete the first itinerary flow`
- `saved-trip retention remains weak after onboarding improvements`
- `no users convert after repeat usage is established`

## 12. Open Questions

- `What is the right free-tier generation limit?`
- `Should itinerary sharing be in MVP or P1?`
- `Which analytics tool should be the default?`

## 13. Sign-Off Checklist

- [x] Problem is clear
- [x] User is clear
- [x] MVP scope is locked
- [x] Non-goals are explicit
- [x] Metrics are defined
- [ ] Open questions are either answered or accepted