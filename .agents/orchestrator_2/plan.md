# Orchestration Plan: YNDA Video Production SOP & System Upgrade

## Overview
Comprehensive upgrade of the internal workflow web system to support the standardized "Ý Niệm Điện Ảnh" (YNDA) 9-Step Video Production SOP, strict state-machine gating, 4-column script builder, dual interactive checklists, TikTok derivative cutdown workflow, and extended lifecycle/analytics metadata with zero regressions on existing views.

## Phase 0: Scope Survey & Codebase Exploration
- **Survey Explorer 1 (Data & State Engine)**:
  - Inspect Prisma schema (`schema.prisma`), database client/adapter, task data models, status enums, migrations, and seed scripts.
  - Analyze requirements for 5-gate state machine, checklists persistence, script matrix storage, derivative tasks, and analytics metadata.
- **Survey Explorer 2 (UI Architecture & Component System)**:
  - Inspect Next.js App/Pages router layout, existing task dialogs, editors, forms, checklist components, and styling (Tailwind/CSS modules/shadcn/etc.).
  - Map UI touchpoints for 9-step SOP visual tutorial, 4-column script editor, dual checklists, TikTok derivative creation modal, and gate action buttons.
- **Survey Explorer 3 (Existing Views & Backward Compatibility)**:
  - Inspect Kanban board, Gantt chart, Dashboard, Portfolio view, and search/filter mechanisms.
  - Identify all potential breaking changes or regression risks when extending task models/statuses/metadata.

## Phase 1: Synthesis & Project Blueprinting
- Consolidate explorer findings into `/run/media/harlan/New Volume/workflow/.agents/PROJECT.md`.
- Establish Feature Inventory (all 6 requirements decomposed with exact mappings).
- Define Interface Contracts and Database Schemas.
- Establish Code Layout and file ownership boundaries.

## Phase 2: Dual Track Execution
### Track 1: Implementation Track
- **M1: Data Models, Migrations & State Machine Gating Engine**
  - Prisma schema updates (Extended metadata, Script model/fields, Checklist models, TikTok link).
  - Backend validation & state transition gating rules (Gates 1-5 enforcement).
- **M2: Standardized 4-Column Script Builder (R3)**
  - Script editor UI with Identity header, 4 standardized segments (Intro 3Ws, Body with pauses, Outro/Summary card, CTA/loop).
  - 4-column matrix: Time/Segment, Voice AI, Visual/Mascot/Edits, BGM/SFX.
  - Copyright commitment checkbox & locked-on-approval behavior.
- **M3: Dual Interactive Checklists & Gate Approval Flows (R4, R2)**
  - Production Checklist (Producer handoff) with progress indicator.
  - Editor QC Checklist (Editor -> Core) with progress indicator.
  - Interactive gate approval controls & transition guards.
- **M4: TikTok Derivative Cutdown Workflow & Interactive 9-Step SOP Tutorial (R5, R1)**
  - YouTube Master -> TikTok derivative task creation action with 30-45s 9:16 target, backward link, and TikTok checklist.
  - Visual 9-Step SOP Tutorial / Flowchart modal or page with Role, Input, Tasks, Output, Gating condition.
- **M5: Integration, Analytics Feedback Loop & Backward Compatibility (R6, R2)**
  - Post-publish analytics metadata inputs (Views, Retention, CTR, Comments, Insights) and loop back to Step 1.
  - Verify Kanban, Gantt, Dashboard, and Portfolio render seamlessly with new task types/statuses.

### Track 2: E2E Testing Track (Independent Sub-orchestrator)
- Initialize opaque-box E2E test infra.
- Implement Tier 1 (Feature Coverage >= 5 per feature), Tier 2 (Boundary & Corner cases), Tier 3 (Cross-feature interactions), Tier 4 (Real-world scenarios).
- Publish `TEST_READY.md`.

## Phase 3: Final Milestone & Hardening
- **Phase 1**: Pass 100% E2E test suite (Tiers 1-4).
- **Phase 2**: Adversarial Coverage Hardening (Tier 5) with Challengers.
- **Forensic Integrity Audit**: Zero-tolerance audit for shortcuts, hardcoded mocks, or cheating.
- **Build Verification**: Confirm clean `npm run build` with zero TypeScript or ESLint errors.

## Phase 4: Delivery & Handoff
- Generate final handoff documentation.
- Deliver victory report and verification evidence to Sentinel.
