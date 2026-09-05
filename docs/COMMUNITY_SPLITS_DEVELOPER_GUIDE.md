# Community splits: contributor guide

## Data model

`Split.createdById` is the existing owner field and remains nullable for compatibility with prebuilt data. Community metadata is stored on `Split`:

- `visibility`: `PRIVATE` or `COMMUNITY`
- `publishedAt`, `creatorDisplayName`, `splitTypeTag`
- `forkedFromSplitId` self-reference
- denormalized `likeCount` and `saveCount`

`UserSplit` is the user’s library entry. It has one row per `[userId, splitId]`, a `savedAt` timestamp, and `isActive`. Application mutations maintain a single active entry for each user. `SplitLike` is unique per `[userId, splitId]` and backs the like count.

The migration `20260720000000_add_split_library_and_community` de-duplicates legacy saved and active rows before adding the constraints.

## API workflows

All routes require authentication.

| Endpoint | Purpose |
| --- | --- |
| `GET /splits` | Saved library entries, active first. |
| `PUT /splits/user/active` | Activates an already-saved library entry transactionally. |
| `DELETE /splits/:id/library` | Removes a non-active saved entry. |
| `POST /splits/:id/publish` / `unpublish` | Changes visibility for an original, owned split only. |
| `GET /splits/community` | Paged community browse; accepts `page`, `limit`, `daysPerWeek`, `splitTypeTag`, and `sort`. |
| `GET /splits/community/:id` | Community details with viewer-specific `liked`. |
| `POST /splits/community/:id/like` | Transactional like toggle and count update. |
| `POST /splits/community/:id/fork` | Creates a private deep copy and library entry. |

Forking accepts `activateForOnboarding`. The server only honours it while `User.onboardingDone` is false; clients cannot use it to auto-activate a later community save.

## Guardrails

- Never expose a private split unless it is owned or already in the caller’s library.
- Do not allow publishing prebuilt splits or forks. Training days without exercises block publishing.
- A fork must deep-copy `SplitDay` and `SplitDayExercise`; do not retain live references to source days.
- Do count mutations and active-state changes inside a Prisma transaction. The unique constraints protect against duplicate library/like rows, while the transaction makes user-visible state coherent.
- `createdById` uses `ON DELETE SET NULL`; account deletion explicitly removes only private owned splits, while published community originals retain their content and creator-name snapshot.

## Mobile behaviour

`SplitSwitcherScreen` is the saved library, `CommunitySplitsScreen` is the browse surface, and `SplitDetailsScreen` shows either a library program or a community program. Profile creation saves without activation. Onboarding is intentionally the only auto-activation path.

Run `prisma generate`, API type checks and the split/onboarding controller tests after schema or endpoint changes.
