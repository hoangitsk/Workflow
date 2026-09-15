## 2026-09-15T11:40:02Z

You are Worker M1 for Milestone 1 of the "Ý Niệm Điện Ảnh" (YNDA) Video Production SOP and System Upgrade.
Your identity: M1 Implementation Worker
Your working directory: /run/media/harlan/New Volume/workflow/.agents/worker_m1
Workspace root: /run/media/harlan/New Volume/workflow

MANDATORY FIRST STEP:
You MUST read the authoritative user requirements in:
/run/media/harlan/New Volume/workflow/.agents/ORIGINAL_REQUEST.md
Pay special attention to section "## 2026-09-15T10:30:18Z" and all requirements R1-R6 and Acceptance Criteria.
Also read the project architecture in:
/run/media/harlan/New Volume/workflow/.agents/PROJECT.md

READ THE THREE EXPLORER REPORTS FIRST:
1. /run/media/harlan/New Volume/workflow/.agents/explorer_m1_1/survey_report.md (Schema & Types DDL and TypeScript contracts)
2. /run/media/harlan/New Volume/workflow/.agents/explorer_m1_2/survey_report.md (State Machine Server Actions & 5-gate logic)
3. /run/media/harlan/New Volume/workflow/.agents/explorer_m1_3/survey_report.md (Syntax & TypeScript build fixes)

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP:
You own and may edit ONLY these files:
- src/lib/types.ts
- src/lib/db.ts
- init-postgres.mjs
- src/actions/idea-actions.ts
- src/app/components/ClientApp.tsx (only for fixing lines 1903, 1979, 2082 JSX unescaped `->` syntax)
- src/lib/reference-utils.tsx (fixing `parseReferences` never typing and `FormattedText` useMemo hook call order)
- src/app/page.tsx (adding explicit `InitialData` type to initialData object)

Your implementation tasks:
1. Update `src/lib/types.ts`:
   - Add new types: `ActiveGate`, `ScriptStatus`, `PlatformType`, `ChannelTier`, `DerivativeType`, `CopyrightCheckStatus`, `ScriptSegmentRow`, `ScriptData`, `ChecklistItem`, and default templates.
   - Update `Idea` interface with all new fields as optional/nullable.
2. Update `src/lib/db.ts` & `init-postgres.mjs`:
   - In `ensureSchema` and `init-postgres.mjs`, add all new columns to the `ideas` table using `ALTER TABLE ideas ADD COLUMN IF NOT EXISTS ...`.
   - Ensure proper JSON parsing and fallback in `getAllData()`.
3. Update `src/actions/idea-actions.ts`:
   - Implement the 5-Gate state machine Server Actions:
     - `approveGate1IdeaAction(ideaId, assigneeEmail, deadlineScript)`
     - `submitScriptMatrixAction(ideaId, scriptData)` (validates Hook 3Ws & copyright, checks `script_locked !== true`)
     - `approveGate2ScriptAction(ideaId)` (locks script, moves to `PRODUCTION`, active_gate `GATE_3_PRODUCTION`)
     - `requestScriptRevisionAction(ideaId, notes)` (unlocks script, sets `REVISION_REQUESTED`)
     - `updateChecklistAction(ideaId, checklistType, items)` (persists checklist, enforces Producer cannot edit Editor QC checklist)
     - `submitVideoWithChecklistAction(ideaId, payload)` (enforces required asset links AND requires 100% / 7/7 checked items in `production_checklist`, moves to `QA`, active_gate `GATE_4_QC`)
     - `approveGate4QcAction(ideaId, videoFinalLink)` (requires 100% / 8/8 checked items in `qc_checklist`, moves to `CORE_REVIEW`, active_gate `GATE_5_CORE`)
     - `approveGate5CoreAction(ideaId, notes)` (Core role check, moves to `READY_TO_PUBLISH`, active_gate `READY_TO_PUBLISH`)
     - `publishVideoAction(ideaId, publishData)` (requires Core Gate 5 approval, marks `COMPLETE`, active_gate `PUBLISHED`)
     - `savePostPublishMetricsAction(ideaId, metrics)` (saves metrics, optionally creates feedback idea in `PITCH`)
     - `createTikTokDerivativeAction(masterIdeaId, data)` (creates derivative task linked via `parent_task_id`, `derivative_type = 'TIKTOK_CUTDOWN'`, 9:16 reframe flag, 5-item TikTok checklist)
   - Preserve all legacy actions (`approveIdeaAction`, `submitScriptAction`, `startProductionAction`, `submitVideoAction`, `qaPassAction`, `qaFailAction`) with internal active_gate mapping so existing views do not break.
4. Fix syntax and build blockers:
   - In `src/app/components/ClientApp.tsx`: replace unescaped `->` with `&rarr;` at lines 1903, 1979, 2082.
   - In `src/lib/reference-utils.tsx`: fix `input?: string | (ReferenceItem | string)[] | null` and move `useMemo` before `if (!text) return null;`.
   - In `src/app/page.tsx`: add explicit typing for `initialData`.
5. MANDATORY VERIFICATION:
   Run the following verification command using `run_command`:
   `export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH" && npx tsc --noEmit`
   Verify that it exits with code 0 and ZERO errors. Document the exact output.
6. Write your detailed handoff report to:
   /run/media/harlan/New Volume/workflow/.agents/worker_m1/handoff.md
   and send a completion message to parent when done.

## 2026-09-15T12:01:17Z
**Context**: Milestone 1 Implementation Status Check
**Content**: Heartbeat liveness check. Please report your progress on Steps 1 to 5 (types, schema, syntax fixes, idea-actions, tsc typecheck).
**Action**: Provide current status update and update your progress.md.
