# AGENTS.md — Project Development Rules

## 1. Purpose and working methodology

Follow Spec-Driven Development (SDD) throughout the project.

All implementation work must be grounded in the project's current documentation. Treat the approved specifications as the source of truth for product behavior and `plan.md` and `tasks.md` as the source of truth for implementation planning and task tracking.

Work incrementally, prioritize correctness, and verify changes before declaring tasks complete.

## 2. Documentation hierarchy

Before implementing any task, inspect the relevant project documentation:

- `briefing.md`: original context and project motivation.
- `prd.md`: product requirements.
- `spec/`: functional specifications, domain model, game rules, user flows, scope, acceptance criteria, and other project specifications.
- `plan.md`: technical architecture, implementation strategy, and milestones.
- `tasks.md`: task definitions, dependencies, implementation order, and completion status.

Respect the existing file locations and naming conventions.

If documents conflict, do not silently choose an interpretation. Identify the conflict and request clarification when it materially affects implementation.

Never change requirements merely to accommodate an implementation decision.

## 3. Milestone execution

When asked to implement a milestone:

1. Inspect the repository and current working-tree changes.
2. Read the relevant documentation and identify the requested milestone in `tasks.md`.
3. Verify the actual implementation status of prerequisite tasks.
4. Identify task dependencies and acceptance criteria.
5. Implement only the requested milestone, respecting task order and dependencies.
6. Verify each task before marking it complete.
7. Report the actual milestone status and any remaining blockers.

Do not implement future milestones, unrelated features, or unnecessary refactoring.

If a prerequisite is incomplete, a requirement is ambiguous, or an architectural decision needs approval, stop before making consequential changes and explain the issue.

## 4. Implementation standards

- Follow the approved architecture, technology stack, existing conventions, and dependency versions.
- Reuse existing code when appropriate; avoid unnecessary duplication and premature abstractions.
- Do not introduce new dependencies without a clear technical justification.
- Keep business logic independent of UI components wherever practical.
- Respect existing naming conventions, project structure, and TypeScript types.
- Handle errors and relevant edge cases explicitly.
- Do not overwrite unrelated user changes or discard existing work.
- Avoid modifying unrelated files.

### Next.js and client-side persistence

The project uses Next.js and may use IndexedDB through the `idb` library, as specified by the project documentation.

- Access IndexedDB only in a browser environment.
- Keep browser-dependent operations within appropriate client-side boundaries.
- Respect the documented separation between UI, domain logic, and persistence.
- Handle database initialization, asynchronous operations, failures, and schema upgrades where applicable.
- Do not introduce a backend or external persistence service unless explicitly approved.
- Avoid hydration errors caused by accessing browser-only state during server rendering.

Apply these rules only where relevant to the task being implemented.

## 5. Testing and verification

For each task, determine which checks are appropriate based on its acceptance criteria.

Use the project's existing tooling wherever possible:

- Automated tests for applicable business logic and behavior.
- TypeScript type checking.
- Linting and formatting checks when configured.
- Production builds when appropriate.
- Manual verification for relevant UI behavior and browser persistence.

Run the relevant checks after making changes. Fix regressions introduced by the implementation before proceeding.

Distinguish between pre-existing failures, newly introduced failures, and checks that could not be executed.

Never claim a test passed unless it was actually executed successfully.

## 6. Task tracking

Treat `tasks.md` as the authoritative record of implementation progress.

- Preserve existing task IDs and milestone definitions.
- Update task status only when its acceptance criteria have been verified.
- Do not mark blocked, partially implemented, or untested tasks as complete.
- Record relevant blockers and verification limitations.
- Do not rewrite the task plan or change milestone scope without approval.

## 7. Scope and decision control

Do not independently change approved requirements, domain rules, acceptance criteria, or architectural decisions.

When a proposed change materially affects scope, data structures, persistence, dependencies, security, or architecture:

1. Explain the issue and its impact.
2. Present a recommended solution.
3. Request approval before proceeding.

Routine implementation details consistent with the approved plan do not require unnecessary confirmation.

## 8. Completion report

At the end of each milestone, report:

1. Tasks completed, using their existing IDs.
2. Files created or modified and their purpose.
3. Relevant implementation decisions.
4. Tests and checks executed, including actual results.
5. Acceptance criteria verified and those still pending.
6. Known issues, blockers, and technical debt.
7. Actual milestone status: completed, partially completed, or blocked.
8. The next recommended task or milestone, without implementing it.

Only declare a milestone complete when its required tasks and acceptance criteria have been verified.

## 9. Communication

Communicate concisely and technically.

Explain significant decisions and unexpected changes. Do not hide failures, invent verification results, or claim completion without evidence.

Prioritize faithful implementation of the specification over adding features or making unsolicited improvements.

## 10. Language policy

- Communicate with the user in Spanish.
- Write all reports, explanations, implementation summaries, test results, and progress updates in Spanish.
- Write and maintain project documentation, including `tasks.md`, in Spanish, unless the existing document is intentionally written in another language.
- Keep source code identifiers, variable names, function names, class names, and technical conventions in English, following standard software development practices and the existing codebase.
- Preserve the original language of existing documentation unless explicitly asked to translate it.
- Do not translate library names, framework terminology, API identifiers, error messages, or code symbols when doing so would reduce technical accuracy.
