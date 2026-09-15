# Test Infrastructure: "Ý Niệm Điện Ảnh" (YNDA) Video Production SOP

## 1. Overview & Architecture

The E2E Test Suite for the "Ý Niệm Điện Ảnh" (YNDA) Video Production SOP system is an independent, opaque-box, requirement-driven test infrastructure strictly derived from authoritative specifications in `ORIGINAL_REQUEST.md` (section `2026-09-15T10:30:18Z`) and `PROJECT.md`.

### Core Architectural Principles
1. **Opaque-Box & Requirement-Driven**: Tests assert behavior against documented specifications, role rules, state transitions, and schema invariants without coupling to internal volatile UI render states.
2. **Self-Contained & Isolated**: Every test manages its own state and executes deterministically with zero external network dependencies (bypassing flaky external cloud connections while maintaining full schema and relational fidelity).
3. **Multi-Tier Coverage**:
   - **Tier 1 (Feature Coverage)**: >=5 tests per feature for R1 through R6 (32 tests total).
   - **Tier 2 (Boundary & Corner Cases)**: >=5 tests per feature for R1 through R6 (32 tests total).
   - **Tier 3 (Cross-Feature Pairwise)**: 5 comprehensive pairwise cross-feature combination tests.
   - **Tier 4 (Real-World Workflows)**: 5 end-to-end production scenarios from pitch to publish & analytics.
   - **Total Tests**: **74 tests** executed with **100% Pass Rate**.

---

## 2. Directory Layout & File Organization

All test code is strictly co-located in `tests/e2e/` following project guidelines:

```
tests/
├── tsconfig.json                # Strict TypeScript configuration for test execution
└── e2e/
    ├── harness.ts               # Core contracts, state machine specifications, and assert helpers
    ├── tier1-feature.test.ts    # Tier 1: Feature Coverage (R1 - R6)
    ├── tier2-boundary.test.ts   # Tier 2: Boundary & Corner Cases (R1 - R6)
    ├── tier3-pairwise.test.ts   # Tier 3: Cross-Feature Pairwise Interactions
    ├── tier4-workflows.test.ts  # Tier 4: Real-World Multi-Role Production Scenarios
    └── test-runner.ts           # Master Test Runner with detailed reporter and exit codes
```

---

## 3. How to Run the Tests

### Primary Execution Command

```bash
export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH"
node --experimental-transform-types --no-warnings tests/e2e/test-runner.ts
```

### Typecheck Command

```bash
export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH"
npx tsc --project tests/tsconfig.json
```

---

## 4. Test Inventory & Coverage Matrix

### Tier 1: Feature Coverage (32 Tests)

| ID | Feature | Description | Status |
|---|---|---|---|
| `T1_R1_01` | R1: 9-Step SOP Tutorial | All 9 stages exist in strict numerical sequence ("01"-"09") with canonical titles | PASS |
| `T1_R1_02` | R1: 9-Step SOP Tutorial | Every stage defines all 5 mandatory fields (Role, Input, Tasks, Output, Gate) | PASS |
| `T1_R1_03` | R1: 9-Step SOP Tutorial | Clear role demarcation between Editor, Producer, and Core across all 9 stages | PASS |
| `T1_R1_04` | R1: 9-Step SOP Tutorial | 3-Module parallel pipeline specs (A: Content, B: Audio, C: Visuals) | PASS |
| `T1_R1_05` | R1: 9-Step SOP Tutorial | Asset classification: Pre-built (shared) vs On-demand (per episode) | PASS |
| `T1_R1_06` | R1: 9-Step SOP Tutorial | Dual-format publishing target specs (Master 16:9 2-5m vs TikTok 9:16 30-45s) | PASS |
| `T1_R2_01` | R2: Strict Gating Engine | Gate 1: Idea approval transitions task from PITCH to SCRIPT (activeGate: GATE_2_SCRIPT) | PASS |
| `T1_R2_02` | R2: Strict Gating Engine | Gate 2: Script approval locks content and unlocks Production (activeGate: GATE_3_PRODUCTION) | PASS |
| `T1_R2_03` | R2: Strict Gating Engine | Gate 2: Revision request unlocks script and sets status REVISION_REQUESTED | PASS |
| `T1_R2_04` | R2: Strict Gating Engine | Gate 3: Draft submission requires valid links and 100% completed Production Checklist | PASS |
| `T1_R2_05` | R2: Strict Gating Engine | Gate 4: Editor QC signoff requires valid final video link and 100% completed QC Checklist | PASS |
| `T1_R2_06` | R2: Strict Gating Engine | Gate 5: Core approval unlocks READY_TO_PUBLISH; Publish action finalizes to COMPLETE / PUBLISHED | PASS |
| `T1_R3_01` | R3: 4-Column Script Builder | Identity header validation (Episode name, Channel selector, Writer, Wednesday deadline) | PASS |
| `T1_R3_02` | R3: 4-Column Script Builder | Hook 3Ws requirement: Intro (00:00-00:15) mandates non-empty What, When, and Why | PASS |
| `T1_R3_03` | R3: 4-Column Script Builder | 4 Standard segments structure (Intro Hook, Body with pauses, Outro Summary Card, CTA Loop) | PASS |
| `T1_R3_04` | R3: 4-Column Script Builder | 4-Column matrix captures all 4 dimensions per segment row | PASS |
| `T1_R3_05` | R3: 4-Column Script Builder | Mandatory copyright agreement checkbox confirms rights for footage, audio, illustrations | PASS |
| `T1_R4_01` | R4: Dual Checklists | Production Checklist contains exactly 7 items covering all mandatory criteria | PASS |
| `T1_R4_02` | R4: Dual Checklists | Editor QC Checklist contains exactly 8 items covering all inspection standards | PASS |
| `T1_R4_03` | R4: Dual Checklists | Interactive toggle updates checked state and persists to idea task record | PASS |
| `T1_R4_04` | R4: Dual Checklists | Progress indicator calculates exact completion ratio and percentage (e.g. 5/7 and 8/8) | PASS |
| `T1_R4_05` | R4: Dual Checklists | Gate 3 enforces 100% production checklist completion (all 7 items checked) | PASS |
| `T1_R5_01` | R5: TikTok Cutdown Workflow | Enforces Master video approval precondition (Gate 5 Core approved or published) | PASS |
| `T1_R5_02` | R5: TikTok Cutdown Workflow | Enforces TikTok target extraction duration of 30 - 45 seconds | PASS |
| `T1_R5_03` | R5: TikTok Cutdown Workflow | Verifies 9:16 vertical reframe flag and dedicated 0-3 second mobile Hook summary | PASS |
| `T1_R5_04` | R5: TikTok Cutdown Workflow | Verifies backward linkage to Master ID/URL and bidirectional traceability | PASS |
| `T1_R5_05` | R5: TikTok Cutdown Workflow | Verifies dedicated 5-item TikTok checklist auto-initialization | PASS |
| `T1_R6_01` | R6: Extended Metadata | Verifies Platform types (YouTube, TikTok, Reels) and Channel tiers (Kênh 1, Kênh 2) | PASS |
| `T1_R6_02` | R6: Extended Metadata | Verifies support for all 5 essential resource links hub | PASS |
| `T1_R6_03` | R6: Extended Metadata | Verifies gate deadlines tracking (Script, Production, QC, Target publish date) | PASS |
| `T1_R6_04` | R6: Extended Metadata | Verifies triple copyright verification status tracking (Footage, Music, Mascot) | PASS |
| `T1_R6_05` | R6: Extended Metadata | Verifies post-publish analytics recording and Feedback Idea loop | PASS |

### Tier 2: Boundary & Corner Cases (32 Tests)

| ID | Feature | Boundary Condition Tested | Status |
|---|---|---|---|
| `T2_R1_01` | R1 Boundary: Tutorial | Out-of-bounds stage access returns undefined safely | PASS |
| `T2_R1_02` | R1 Boundary: Tutorial | Validates that no stage contains blank or whitespace-only field content | PASS |
| `T2_R1_03` | R1 Boundary: Tutorial | Step 1 input cannot depend on downstream Step 6 or Step 7 video output | PASS |
| `T2_R1_04` | R1 Boundary: Tutorial | Producer cannot be designated sole owner of Step 4 (Script Review) or Step 7 (QC) | PASS |
| `T2_R1_05` | R1 Boundary: Tutorial | Step sequence invariants: stages cannot be out of order or duplicate numbering | PASS |
| `T2_R2_01` | R2 Boundary: Gating | Jumping gates: Attempting Gate 3 video submission directly from GATE_1_IDEA rejected | PASS |
| `T2_R2_02` | R2 Boundary: Gating | Jumping gates: Attempting Gate 5 Core approval from GATE_2_SCRIPT rejected | PASS |
| `T2_R2_03` | R2 Boundary: Gating | Unauthorized role: Producer attempting to approve Gate 2 Script rejected | PASS |
| `T2_R2_04` | R2 Boundary: Gating | Unauthorized role: Editor or Producer attempting to approve Gate 5 Core rejected | PASS |
| `T2_R2_05` | R2 Boundary: Gating | Publishing video before Core Gate 5 approval rejected | PASS |
| `T2_R2_06` | R2 Boundary: Gating | State transitions on CANCELLED tasks rejected | PASS |
| `T2_R3_01` | R3 Boundary: Script | Hook 3Ws missing 'what' field rejected with explicit error | PASS |
| `T2_R3_02` | R3 Boundary: Script | Hook 3Ws missing 'when' or 'why' field rejected | PASS |
| `T2_R3_03` | R3 Boundary: Script | Script submission with copyright commitment unchecked (false) rejected | PASS |
| `T2_R3_04` | R3 Boundary: Script | Producer attempting to edit script when scriptLocked = true rejected | PASS |
| `T2_R3_05` | R3 Boundary: Script | Script matrix with empty segments array rejected | PASS |
| `T2_R3_06` | R3 Boundary: Script | Unassigned Producer attempting to submit script for another Producer's task rejected | PASS |
| `T2_R4_01` | R4 Boundary: Checklists | Incomplete Production Checklist (6 out of 7 items checked) rejected at Gate 3 | PASS |
| `T2_R4_02` | R4 Boundary: Checklists | Incomplete QC Checklist (7 out of 8 items checked) rejected at Gate 4 | PASS |
| `T2_R4_03` | R4 Boundary: Checklists | Producer role attempting to toggle QC checklist items rejected | PASS |
| `T2_R4_04` | R4 Boundary: Checklists | Checklist update with invalid/unknown item ID rejected | PASS |
| `T2_R4_05` | R4 Boundary: Checklists | Checklist update with empty array rejected | PASS |
| `T2_R5_01` | R5 Boundary: TikTok | Creating TikTok derivative from an unapproved Master still in GATE_1_IDEA rejected | PASS |
| `T2_R5_02` | R5 Boundary: TikTok | Creating TikTok derivative from a task in GATE_3_PRODUCTION rejected | PASS |
| `T2_R5_03` | R5 Boundary: TikTok | TikTok cutdown creation with empty hookSummary rejected | PASS |
| `T2_R5_04` | R5 Boundary: TikTok | TikTok cutdown creation with empty ctaRoute rejected | PASS |
| `T2_R5_05` | R5 Boundary: TikTok | TikTok cutdown creation targeting non-existent parent ID rejected | PASS |
| `T2_R6_01` | R6 Boundary: Metadata | Gate 3 submission with malformed or non-HTTP URL for videoDraftLink rejected | PASS |
| `T2_R6_02` | R6 Boundary: Metadata | Gate 3 submission with malformed or non-HTTP URL for sourceProjectLink rejected | PASS |
| `T2_R6_03` | R6 Boundary: Metadata | Post-publish metrics with negative views or comments count rejected | PASS |
| `T2_R6_04` | R6 Boundary: Metadata | Saving metrics on a task that is not published/complete rejected | PASS |
| `T2_R6_05` | R6 Boundary: Metadata | Publishing video with invalid official URL rejected | PASS |

### Tier 3: Cross-Feature Pairwise Combinations (5 Tests)

| ID | Combination Area | Interaction Tested | Status |
|---|---|---|---|
| `T3_PAIR_01` | Pipeline & Feedback Loop | Full Linear Pipeline: Idea -> Script Matrix -> Gate 2 -> Production Checklist -> Gate 3 -> QC -> Gate 5 -> Publish -> Analytics Feedback Loop | PASS |
| `T3_PAIR_02` | TikTok Branch & Analytics | Master Completion -> TikTok Derivative Cutdown -> TikTok Checklist -> Derivative Release & Traceability | PASS |
| `T3_PAIR_03` | Script Revision Cycle | Script Revision Request Loop: Gate 1 -> Script -> Revision Requested -> Unlock -> Producer Edits -> Re-approval -> Lock | PASS |
| `T3_PAIR_04` | Copyright Clearance | End-to-End Legal Clearance: Script Commitment -> Checklist BGM Check -> Metadata Hub -> QC Item 6 -> Gate 5 Approval | PASS |
| `T3_PAIR_05` | Tutorial vs Engine | SOP Tutorial Consistency: Verifies exact parity between SOP_STAGES definitions and Engine State Machine invariants | PASS |

### Tier 4: Real-World Scenarios (5 Tests)

| ID | Scenario | Scope Tested | Status |
|---|---|---|---|
| `T4_SCENARIO_01` | Channel 1 Full Lifecycle | Channel 1 Educational video from initial pitch to YouTube release and post-publish performance analytics | PASS |
| `T4_SCENARIO_02` | Script Revision Resolved | Channel 2 Psychology video where Editor requests script revision, Producer revises, and Editor approves | PASS |
| `T4_SCENARIO_03` | YouTube to TikTok Cutdown | Completed YouTube Master video successfully branched into a dedicated TikTok vertical derivative | PASS |
| `T4_SCENARIO_04` | Gate 3 Correction Loop | Draft submission rejected due to missing Premiere source project, corrected and accepted into Gate 4 | PASS |
| `T4_SCENARIO_05` | Multi-Role Collaboration | Full team multi-role collaboration (Producer, Editor, Core) with copyright verification and analytics feedback loop | PASS |

---

## 5. Execution Summary & Benchmark Results

```
================================================================================
📊 E2E TEST EXECUTION SUMMARY
================================================================================
Tier     | Feature Area               | Total | Passed | Failed | Success Rate | Duration
---------+----------------------------+-------+--------+--------+--------------+----------
Tier 1   | Feature Coverage (R1-R6)    |    32 |     32 |      0 |       100.0% | 15ms
Tier 2   | Boundaries & Corners (R1-R6) |    32 |     32 |      0 |       100.0% | 5ms
Tier 3   | Cross-Feature Pairwise       |     5 |      5 |      0 |       100.0% | 3ms
Tier 4   | Real-World Scenarios         |     5 |      5 |      0 |       100.0% | 5ms
---------+----------------------------+-------+--------+--------+--------------+----------
TOTAL    | All Tiers Combined         |    74 |     74 |      0 |       100.0% | 31ms
================================================================================

🏆 ALL 74 TESTS PASSED CLEANLY (100% Pass Rate).
✨ Status: Ready for verification audit.
```
