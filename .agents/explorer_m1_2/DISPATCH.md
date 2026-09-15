## 2026-09-15T11:18:31Z
You are Explorer M1_2 for Milestone 1 of the "Ý Niệm Điện Ảnh" (YNDA) Video Production SOP and System Upgrade.
Your identity: M1 State Machine & Server Actions Explorer
Your working directory: /run/media/harlan/New Volume/workflow/.agents/explorer_m1_2
Workspace root: /run/media/harlan/New Volume/workflow

MANDATORY FIRST STEP:
You MUST read the authoritative user requirements in:
/run/media/harlan/New Volume/workflow/.agents/ORIGINAL_REQUEST.md
Pay special attention to section "## 2026-09-15T10:30:18Z" and all requirements R1-R6 and Acceptance Criteria.
Also read the project architecture in:
/run/media/harlan/New Volume/workflow/.agents/PROJECT.md

Your mission:
Formulate the exact, concrete implementation plan for `src/actions/idea-actions.ts`:
1. Implement and harden the 5-Gate state machine transitions:
   - Gate 1: `approveGate1IdeaAction(ideaId, assigneeEmail, deadlineScript)`: Editor or Core approves idea, moves status to `ASSIGNMENT`, sets `active_gate = 'GATE_2_SCRIPT'`, assigns Producer.
   - Gate 2: `submitScriptMatrixAction(ideaId, scriptData)`: Producer submits script, sets `script_status = 'SUBMITTED'`.
   - Gate 2 Approval: `approveGate2ScriptAction(ideaId)`: Editor approves script, sets `script_status = 'APPROVED'`, `script_locked = true`, transitions status to `PRODUCTION`, sets `active_gate = 'GATE_3_PRODUCTION'`.
   - Gate 2 Revision: `requestScriptRevisionAction(ideaId, notes)`: Editor requests changes, sets `script_status = 'REVISION_REQUESTED'`, unlocks script, records notes.
   - Checklist Update: `updateChecklistAction(ideaId, checklistType, items)`: Updates persistent checklist state in database (`production_checklist`, `qc_checklist`, or `tiktok_checklist`).
   - Gate 3: `submitVideoWithChecklistAction(ideaId, payload)`: Validates that asset links (video draft link, source project link) are provided AND `production_checklist` has all 7 items checked (100%). If not, rejects with clear error! If valid, transitions status to `QA`, sets `active_gate = 'GATE_4_QC'`.
   - Gate 4: `approveGate4QcAction(ideaId, videoFinalLink)`: Validates that `qc_checklist` has all 8 items checked (100%). If valid, transitions status to `CORE_REVIEW` (new status or active gate), sets `active_gate = 'GATE_5_CORE'`.
   - Gate 5: `approveGate5CoreAction(ideaId, notes)`: Core role check (`member.role === 'Core'`). Approves video master, transitions status to `READY_TO_PUBLISH` (or active gate 'READY_TO_PUBLISH').
   - Gate 9 / Publish: `publishVideoAction(ideaId, publishData)`: Requires Gate 5 approval. Marks status `COMPLETE`, `active_gate = 'PUBLISHED'`, records publish metadata.
   - Post-Publish Analytics: `savePostPublishMetricsAction(ideaId, metrics)`: Records views, retention, ctr, comments, insights, and optionally pushes insight feedback back as a new Idea/Pitch.
   - TikTok Derivative: `createTikTokDerivativeAction(masterIdeaId, data)`: Verifies Master is approved/published, creates a new TikTok task linked to master via `parent_task_id`, `derivative_type = 'TIKTOK_CUTDOWN'`.
2. Inspect existing action implementations and ensure full compatibility with `revalidatePath("/")` and audit logs.
3. Write your report with exact line-by-line diff recommendations to:
   /run/media/harlan/New Volume/workflow/.agents/explorer_m1_2/survey_report.md
   and write a standard handoff report to:
   /run/media/harlan/New Volume/workflow/.agents/explorer_m1_2/handoff.md
4. Send a message to parent when done.
