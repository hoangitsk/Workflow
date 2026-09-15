## 2026-09-15T11:18:31Z

You are the E2E Test Writer for the "Ý Niệm Điện Ảnh" (YNDA) Video Production SOP and System Upgrade.
Your identity: E2E Test Writer
Your working directory: /run/media/harlan/New Volume/workflow/.agents/test_writer_e2e_1
Workspace root: /run/media/harlan/New Volume/workflow

MANDATORY FIRST STEP:
You MUST read the authoritative user requirements in:
/run/media/harlan/New Volume/workflow/.agents/ORIGINAL_REQUEST.md
Pay special attention to section "## 2026-09-15T10:30:18Z" and all requirements R1-R6 and Acceptance Criteria.
Also read the project architecture in:
/run/media/harlan/New Volume/workflow/.agents/PROJECT.md

Your mission:
Design and implement the complete opaque-box E2E test infrastructure and comprehensive test suite for the YNDA Video Production SOP system:
1. Philosophy: Opaque-box, requirement-driven testing based strictly on ORIGINAL_REQUEST.md.
2. Architecture:
   - Set up test harness in `tests/e2e/` that can be run with Node / TypeScript (`export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH"`).
   - Can use node:test, tsx, vitest, or custom test runner that executes cleanly with exit code 0 on pass.
3. Test Tiers:
   - Tier 1 - Feature Coverage (>=5 tests per feature for R1 through R6):
     - R1: 9-step SOP flow fields (Role, Input, Tasks, Output, Gate).
     - R2: Strict 5-gate state transitions (Idea approval, Script approval, Video submission checklist check, Editor QC, Core final approval).
     - R3: Standardized 4-column script builder (Header, Hook 3Ws, 4 columns, Outro, CTA loop, copyright checkbox, locking).
     - R4: Dual checklists (Production 7 items, QC 8 items, toggle, progress 100% requirement).
     - R5: YouTube Master to TikTok cutdown (30-45s, 9:16 reframe, hook 0-3s, CTA, backward link).
     - R6: Extended metadata (platforms, channels, 5 resource links, active assignee per gate, deadlines, copyright status, post-publish analytics).
   - Tier 2 - Boundary & Corner Cases (>=5 tests per feature):
     - Empty inputs, missing required links at Gate 3, incomplete checklists (e.g. 6/7 items checked rejected at Gate 3; 7/8 rejected at Gate 4), unauthorized role attempts (Producer attempting to approve Script or Core gate), script edit attempt when locked.
   - Tier 3 - Cross-Feature Combinations (pairwise coverage):
     - Idea approval -> Script matrix -> Approval -> Video submission with checklist -> QC -> Core approval -> Publish -> Analytics feedback loop to new Idea.
     - YouTube Master publish -> TikTok cutdown branch -> TikTok checklist -> Publish -> analytics comparison.
   - Tier 4 - Real-World Application Scenarios (>=5 full scenarios):
     - Scenario 1: Channel 1 Educational video full lifecycle from Pitch to Publish & Analytics.
     - Scenario 2: Channel 2 Psychology video with Script Revision requested by Editor and successfully resolved.
     - Scenario 3: YouTube Master video completed and branched into a TikTok 9:16 derivative video.
     - Scenario 4: Production video rejected at Gate 3 due to missing project source link, corrected and accepted.
     - Scenario 5: Full team multi-role collaboration (Producer, Editor, Core) with copyright validation and analytics insight feedback.
4. Deliverables:
   - `tests/e2e/` test runner and test files.
   - `/run/media/harlan/New Volume/workflow/.agents/TEST_INFRA.md` documenting architecture, runner command, and test inventory.
   - `/run/media/harlan/New Volume/workflow/.agents/TEST_READY.md` once tests are implemented and ready to run.
   - Handoff report in `/run/media/harlan/New Volume/workflow/.agents/test_writer_e2e_1/handoff.md`.
5. Send a message to parent when done.
