# Handoff Report: State Machine Gating Engine & Server Actions (`src/actions/idea-actions.ts`)

**Milestone:** M1 — Data Layer, Schema Migrations & Gating Engine  
**Agent:** Explorer M1_2 (M1 State Machine & Server Actions Explorer)  
**Date:** 2026-09-15  
**Working Directory:** `/run/media/harlan/New Volume/workflow/.agents/explorer_m1_2`  
**Target File:** `/run/media/harlan/New Volume/workflow/src/actions/idea-actions.ts`  

---

## 1. Observation

1. **Current Code State in `src/actions/idea-actions.ts`:**
   - File length: 738 lines.
   - Core mutation actions (`approveIdeaAction`, `submitScriptAction`, `startProductionAction`, `submitVideoAction`, `qaPassAction`, `qaFailAction`) currently operate only on basic `status` (`PITCH`, `ASSIGNMENT`, `SCRIPT`, `PRODUCTION`, `QA`, `COMPLETE`) without gating validation.
   - No tracking or enforcement exists for `active_gate`, `script_status`, `script_locked`, `production_checklist`, `qc_checklist`, `tiktok_checklist`, `core_approval_notes`, or post-publish analytics loop.
   - In `approveIdeaAction` (line 103), only `member.role === 'Core'` was allowed, whereas R1/R2 and SOP step 2 dictate that both Editor (`E`) and Core can approve ideas and assign Producers.
   - In `startProductionAction` (lines 231-270), no script validation or locking mechanism exists (`script_locked = true` is absent).
   - In `submitVideoAction` (lines 272-311), no checklist or source project link is validated before transitioning to QA.
   - In `qaPassAction` (lines 313-361), tasks jump directly from `QA` to `COMPLETE`, completely bypassing Gate 4 Editor QC, Gate 5 Core Approval, and the official Publish stage.

2. **Client Action Consumption in `src/app/components/ClientApp.tsx`:**
   - `runAction` helper (lines 741-754):
     ```typescript
     const runAction = (fn: any, ...args: any) => {
       startTransition(async () => {
         try {
           const res = await fn(...args);
           if (res && res.error) {
             alert(res.error);
             return;
           }
           router.refresh();
         } catch (err: any) {
           alert(err.message || "Có lỗi xảy ra");
         }
       });
     };
     ```
   - Legacy actions are invoked directly throughout `ClientApp.tsx` (e.g. lines 1333, 1498, 1536, 1563, 1590, 1625, 3248).
   - If legacy actions are altered incompatibly or removed, client views break.

3. **Compilation & Diagnostic Check:**
   - Command: `export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH" && npx tsc --noEmit`
   - Result: Exited with code 1 due to exactly 3 JSX unescaped `->` syntax errors in `ClientApp.tsx` (lines 1903, 1979, 2082), assigned to Explorer M1_3.
   - Zero errors currently exist in `src/actions/idea-actions.ts`.

4. **Peer Explorer Coordination:**
   - Explorer M1_1 (`.agents/explorer_m1_1`) is adding database columns and TypeScript interfaces (`ScriptData`, `ChecklistItem`, `ActiveGate`, `ScriptStatus`) to `src/lib/types.ts` and `src/lib/db.ts`.

---

## 2. Logic Chain

1. **State Machine Integrity (R2 & Acceptance Criteria):**
   - R2 dictates that transitions between gates must be strictly enforced on the server. Client-side checks alone are insufficient because Server Actions are public endpoints.
   - Transition Step 1: `approveGate1IdeaAction` moves `PITCH` or `ARCHIVED_IDEA` to `status = 'ASSIGNMENT'` and `active_gate = 'GATE_2_SCRIPT'`, assigning a Producer and initializing checklist templates.
   - Transition Step 2: `submitScriptMatrixAction` validates Hook 3Ws and copyright commitment, setting `script_status = 'SUBMITTED'`. It checks `script_locked !== true`, ensuring that once approved, Producer cannot alter the script without an explicit revision request from the Editor.
   - Transition Step 2 Approval: `approveGate2ScriptAction` approves the script (`script_status = 'APPROVED'`, `script_locked = true`), transitions `status = 'PRODUCTION'`, and advances `active_gate = 'GATE_3_PRODUCTION'`.
   - Transition Step 2 Revision: `requestScriptRevisionAction` unlocks the script (`script_locked = false`, `script_status = 'REVISION_REQUESTED'`), allowing Producer to revise and resubmit.
   - Transition Step 3: `submitVideoWithChecklistAction` enforces that `videoDraftLink` and `sourceProjectLink` are valid URLs AND that `production_checklist` has 100% (7/7) checked items. If incomplete, it rejects with a clear Vietnamese error message. If valid, it transitions to `status = 'QA'` and `active_gate = 'GATE_4_QC'`.
   - Transition Step 4: `approveGate4QcAction` verifies that `qc_checklist` has 100% (8/8) checked items and `videoFinalLink` is valid. If valid, it moves to `status = 'CORE_REVIEW'` and `active_gate = 'GATE_5_CORE'`.
   - Transition Step 5: `approveGate5CoreAction` restricts execution strictly to `member.role === 'Core'`. It checks that Gate 4 QC has passed, records Core approval metadata and notes, and transitions `status = 'READY_TO_PUBLISH'` and `active_gate = 'READY_TO_PUBLISH'`.
   - Gate 9 / Publish: `publishVideoAction` enforces that Core has approved Gate 5 (`active_gate === 'READY_TO_PUBLISH'` or `gate5_approved_at != null`). It records official publishing metadata and marks `status = 'COMPLETE'` and `active_gate = 'PUBLISHED'`.
   - Post-Publish Analytics Loop: `savePostPublishMetricsAction` records views, retention, ctr, comments, and insights. When requested, it generates a new Pitching idea (`status = 'PITCH'`, `active_gate = 'GATE_1_IDEA'`) with insight notes, closing the SOP feedback loop.
   - TikTok Cutdown Branch: `createTikTokDerivativeAction` verifies that the Master video is approved/published, creating a new child task linked via `parent_task_id`, `derivative_type = 'TIKTOK_CUTDOWN'`, and initial 5-item TikTok checklist.

2. **Checklist Persistence & Role Security:**
   - `updateChecklistAction` receives `(ideaId, checklistType, items)`.
   - For `checklistType === 'qc'`, R2 & R4 state that Editor QC is strictly an Editor/Core responsibility. Therefore, if a Producer attempts to update `qc_checklist`, the server rejects with an unauthorized error.

3. **Full Backward Compatibility:**
   - Existing functions (`approveIdeaAction`, `submitScriptAction`, `startProductionAction`, `submitVideoAction`, `qaPassAction`, `qaFailAction`) are preserved and updated to set `active_gate` and relevant statuses, preventing any breakage in existing views while new modular SOP components (Milestones M2-M6) are being introduced.

---

## 3. Caveats

1. **Dependency on Types from Explorer M1_1:**
   - The Server Actions import `ScriptData` and `ChecklistItem` from `../lib/types`. Explorer M1_1 must define these interfaces in `src/lib/types.ts` before the worker applies this patch to avoid TypeScript import errors.
2. **Database Schema Auto-Migration:**
   - Neon serverless database columns (`active_gate`, `script_status`, `script_locked`, `production_checklist`, `qc_checklist`, `tiktok_checklist`, etc.) must be added via `ensureSchema` in `src/lib/db.ts` (handled by Explorer M1_1) so queries don't fail at runtime.
3. **Checklist Item Interface Compatibility:**
   - If `ChecklistItem` in `src/lib/types.ts` is modified, all fields must be optional or unified so `src/lib/db.ts` mapping the standalone `checklists` table does not break.

---

## 4. Conclusion

The concrete implementation plan and complete line-by-line source code for `src/actions/idea-actions.ts` have been fully drafted and documented in `/run/media/harlan/New Volume/workflow/.agents/explorer_m1_2/survey_report.md`.
All 11 required Server Actions, role validations, strict 5-gate prerequisites, 100% checklist guards, TikTok derivative generation, post-publish feedback loop, and backward-compatible wrappers are ready for immediate application by the implementation worker.

---

## 5. Verification Method

To independently verify the implementation once applied by the Worker:

1. **Static Type Checking:**
   ```bash
   export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH"
   npx tsc --noEmit
   ```
   Must compile cleanly without errors in `src/actions/idea-actions.ts`.

2. **Gate 1 Validation:**
   - Call `approveGate1IdeaAction(ideaId, producerEmail, deadlineScript)` as Editor or Core -> Verify `status = 'ASSIGNMENT'`, `active_gate = 'GATE_2_SCRIPT'`, `gate1_approved_at != null`.
   - Call as Producer -> Verify rejection `{ success: false, error: "..." }`.

3. **Gate 2 Script Validation & Locking:**
   - Call `submitScriptMatrixAction` with missing Hook 3Ws -> Verify rejection.
   - Call `submitScriptMatrixAction` with `copyrightCommitment = false` -> Verify rejection.
   - Call `approveGate2ScriptAction(ideaId)` as Editor -> Verify `script_locked = true`, `active_gate = 'GATE_3_PRODUCTION'`.
   - Attempt to call `submitScriptMatrixAction` while locked -> Verify rejection with locking message.
   - Call `requestScriptRevisionAction(ideaId, notes)` -> Verify `script_locked = false`, `script_status = 'REVISION_REQUESTED'`.

4. **Gate 3 Video Submission & 100% Checklist Guard:**
   - Call `submitVideoWithChecklistAction` with 6/7 checklist items checked -> Verify rejection: `"Chưa hoàn thành 100% Production Checklist"`.
   - Call with missing `sourceProjectLink` -> Verify rejection.
   - Call with 7/7 checked and valid links -> Verify transition to `status = 'QA'`, `active_gate = 'GATE_4_QC'`.

5. **Gate 4 QC Guard & Gate 5 Core Review:**
   - Call `approveGate4QcAction` with 7/8 QC items checked -> Verify rejection.
   - Call `approveGate4QcAction` with 8/8 checked and `videoFinalLink` -> Verify `status = 'CORE_REVIEW'`, `active_gate = 'GATE_5_CORE'`.
   - Call `approveGate5CoreAction` as Producer or Editor -> Verify rejection.
   - Call `approveGate5CoreAction` as Core -> Verify `status = 'READY_TO_PUBLISH'`, `active_gate = 'READY_TO_PUBLISH'`.

6. **Publish & Analytics Loop:**
   - Call `publishVideoAction` before Core approval -> Verify rejection.
   - Call `publishVideoAction` after Core approval -> Verify `status = 'COMPLETE'`, `active_gate = 'PUBLISHED'`.
   - Call `savePostPublishMetricsAction` with `createFeedbackIdea: true` -> Verify new Pitch idea created in `ideas` table with title `[Feedback Loop] ...` and `active_gate = 'GATE_1_IDEA'`.

7. **TikTok Derivative:**
   - Call `createTikTokDerivativeAction` on approved Master -> Verify new task created with `parent_task_id = masterIdeaId`, `derivative_type = 'TIKTOK_CUTDOWN'`, and 5-item TikTok checklist.
