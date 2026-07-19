# Ryze admin control-panel guide

The Ryze control panel is for authorized operators who manage shared product content and respond to operational requests. It is separate from the member-facing mobile app.

## Operational areas

| Area | Typical operator workflow |
| --- | --- |
| Dashboard | Review the current administrative overview before taking action. |
| Activity | Review recent administrative and product activity. |
| Users | Find and review member accounts. |
| Exercises | Search/filter the shared catalogue, preview an exercise, and create or update supported exercise content. |
| Exercise requests | Review a member’s requested exercise and update its status after a decision. |
| Splits | Create, edit, or delete shared split templates and control whether a template is offered as prebuilt. |
| Support tickets | Review a request, add a response, and track the ticket through resolution. |
| Notifications | Review and manage notification content or operational delivery controls available in the panel. |
| Settings | Review and update application settings that are exposed to administrators. |
| Onboarding | Review the onboarding-related information exposed by the panel. |

## Core workflows

### Manage the exercise catalogue

1. Open **Exercises** and use the available search and filters to find an entry.
2. Preview the exercise before changing it so names, muscle groups, equipment, and instructions remain consistent.
3. Create or update exercise content only after checking that the catalogue does not already contain an equivalent entry.
4. Review member exercise requests regularly; update their status once accepted, rejected, or otherwise handled.

Exercise names affect plan generation and AI validation, so avoid casual renames or duplicates. The AI Split Builder is restricted to the catalogue’s known exercise names.

### Manage prebuilt splits

1. Open **Splits** and review the days, exercise assignments, and muscle-group balance.
2. Create or edit a template using the standard split-day structure.
3. Mark the template as prebuilt only when it is safe to recommend in onboarding.
4. Remove or disable a template only after considering active users and historical workout records.

Changing a template should not rewrite a user’s saved workout history. Completed workouts preserve the split-day context recorded at completion.

### Handle support

1. Open **Support Tickets**.
2. Read the issue and relevant account context available in the panel.
3. Respond clearly, without requesting secrets or sending sensitive account information in a ticket.
4. Keep the ticket’s status current so follow-up work is visible.

### Manage settings and notifications

1. Review the intended scope and user impact before changing an application setting or notification behavior.
2. Use the panel’s settings/notification controls rather than making one-off database edits.
3. Verify the result in a safe environment when a change affects delivery, onboarding, or many users.

## Administrative safeguards

- Access is for authorized operators only; never share administrative credentials.
- Treat exercise, split, settings, and notification changes as product changes with user impact.
- Use the panel for supported operations. Schema changes, direct database fixes, and production data corrections require the engineering workflow and review.
- Do not use AI-generated text as an unreviewed administrative decision. Confirm its factual accuracy before sending or applying it.

## When to involve engineering

Escalate to engineering when an action needs a code change, migration, bulk correction, authorization change, broken integration, or data repair outside the panel’s supported controls. Include reproducible steps, affected account identifiers only through approved support channels, and the expected versus actual behavior.
