# Ryze developer and contributor guide

This guide is for contributors extending the Ryze mobile app or API. Keep changes small, typed, and aligned with the existing feature boundaries.

## Repository map

| Area | Purpose |
| --- | --- |
| `expo-app/` | Expo/React Native client, screens, UI components, state, hooks, and utilities |
| `api/` | Express and TypeScript API, Prisma data access, controllers, routes, services, jobs, and tests |
| `cpanel/` | Web-based administrative control panel for operational product management |
| `docs/` | Product, contributor, and technical documentation |
| `api/prisma/` | Prisma schema and migrations |
| `graphify-out/` | Generated codebase knowledge graph; do not treat it as handwritten product code |

## Architecture and data flow

The client owns navigation, local interaction state, and presentation. It calls the API for persisted data and server-derived progress. The API owns authentication, authorization, business rules, database reads/writes, AI service calls, and scheduled suggestion work.

The control panel is a separate administrative client. It uses the API to manage operational features such as users, exercises, splits, exercise requests, support tickets, notifications, settings, activity, and onboarding data. See [Admin guide](ADMIN_GUIDE.md) for the operator-facing workflows.

```text
Expo screens/components
  -> feature hooks and API client
  -> Express routes/controllers/services
  -> Prisma/PostgreSQL and external services
  -> typed response back to the client
```

Use the existing feature folders rather than creating cross-cutting abstractions for a single screen. Keep TypeScript strict and remove only imports or code made unused by your own change.

## Local setup

1. Install the project dependencies for the app and API using the repository’s package-manager configuration.
2. Configure environment variables from the project examples or deployment configuration; never commit secrets.
3. Start the API and mobile app in separate terminals using the scripts defined by each package.
4. Ensure the database is available before exercising authenticated or persistence-dependent flows.

Before changing commands or dependency versions, read the relevant package scripts and current configuration. The app uses Expo/React Native and TypeScript; the API uses Express, Prisma, PostgreSQL, JWT authentication, Cloudinary integration, and Gemini-backed AI features.

## Standard feature workflow

1. Identify the affected user flow, screen, route, model, and tests.
2. Extend shared types and request/response contracts first.
3. Make the smallest schema or migration change needed, when persistence changes are required.
4. Implement validation, authorization, and business logic on the API.
5. Add or update the mobile hook, state handling, and screen/component UI.
6. Add focused tests for the rule, error paths, and regression case.
7. Run the app/API checks required by the changed surfaces.
8. Update the relevant Markdown documentation in `docs/`.

## Core product domains

### Workouts and splits

- A split defines training days and exercise assignments.
- Workout sessions store completed logs, and retain the split-day identifier and name used at completion so history remains meaningful after split edits.
- Rest-day records are part of the workout-history experience; preserve their reason and distinct semantics from a completed workout.
- Treat historical sessions as records, not as a live projection of today’s split.

### Progress and progressive overload

- Exercise history uses real set logs only.
- Progress endpoints calculate volume, estimated one-rep maximum, records, streaks, and overload data server-side.
- The app also presents date-based activity and muscle-volume data; changing a calculation should account for all consumer screens, not only the dashboard.
- The app’s progression helper derives a next-set recommendation from recent valid sets. Do not present that recommendation as a guaranteed prescription.
- Current tab/filter changes are intentionally handled from already fetched history where possible; avoid unnecessary new network requests.

### Onboarding and split recommendations

The deterministic split recommendation has a clear baseline rule:

- Beginner with three or fewer days: Full Body.
- Intermediate with six or more days: Push/Pull/Legs.
- Otherwise, five or more days: Bro Split.

Recommendations are ranked and shown to the user; do not silently overwrite an active split.

### Check-ins and split suggestions

- Check-ins are analyzed asynchronously.
- Repeated struggled check-ins over the configured lookback window may trigger an evaluation.
- Suggestions may propose an exercise swap, volume reduction, deload, or rest adjustment.
- Respect user settings and active-split age checks; avoid duplicate pending suggestions.
- A user must accept or dismiss a suggestion. Never apply one invisibly.

## API and database practices

- Validate request input at the boundary and return controlled errors.
- Scope every user-owned read and write to the authenticated user.
- Use Prisma migrations for schema changes. Review generated migrations before applying them.
- Preserve existing API response conventions and error shapes.
- Prefer transactions when a change writes multiple records that must stay consistent.
- Avoid N+1 queries; load only the relations the endpoint needs.

## Mobile-app practices

- Keep screens focused on UI and user interactions; place data fetching and reusable business logic in the existing hooks/utilities structure.
- Give loading, empty, error, and offline states deliberate treatment.
- Keep navigation parameters typed and backward-compatible when possible.
- Reuse existing design patterns and tokens rather than introducing a separate visual language.
- For anything that writes a plan change, surface a clear review/confirm step.
- Photo capture, upload, comparison, and deletion are separate user journeys; retain upload-state handling and do not expose stored media without the owner’s authorization.

## Control-panel practices

- Treat the control panel as privileged software. Any new API used by `cpanel/` needs explicit administrative authorization and input validation.
- Keep management actions auditable and understandable: create/update/delete controls should explain what they affect and require confirmation for destructive operations.
- When a mobile feature gains a moderation or configuration need, document whether it belongs in the control panel and add the corresponding operator workflow.

## AI integration rules

- Gemini calls use structured JSON responses and schema-constrained parsing where supported.
- Treat model output as untrusted input: validate referenced exercises, enumerated actions, and assumptions against application data.
- Preserve timeouts, retry behavior for transient failures, and controlled error messages.
- Keep the Coach confirmation-only for changes that alter a user’s plan or schedule.
- Never frame AI output as medical advice or diagnosis.

See [AI and algorithms reference](AI_AND_ALGORITHMS_REFERENCE.md) for the current product rules.

## Quality gates

Before handoff, run the relevant checks from the package scripts:

- Type checking/linting for touched TypeScript.
- Unit and API tests for changed backend behavior.
- App tests or targeted manual mobile verification for changed screens.
- Build checks for touched app/API packages when practical.
- Migration validation for Prisma schema changes.

Report exactly what you ran and any environment limitation. Do not claim that a mobile build, API, or database-dependent workflow passed if it was not run.
