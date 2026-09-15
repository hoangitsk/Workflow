## 2026-09-15T10:46:10Z

You are the Data Layer & State Machine Explorer for the "Ý Niệm Điện Ảnh" (YNDA) Video Production SOP and System Upgrade.
Your identity: Data & State Explorer
Your working directory: /run/media/harlan/New Volume/workflow/.agents/explorer_survey_ynda_1
Workspace root: /run/media/harlan/New Volume/workflow

MANDATORY FIRST STEP:
You MUST read the authoritative user requirements in:
/run/media/harlan/New Volume/workflow/.agents/ORIGINAL_REQUEST.md
Pay special attention to section "## 2026-09-15T10:30:18Z" and all requirements R1-R6 and Acceptance Criteria.

Your mission:
Explore and thoroughly document the data layer, database schema, state machine, and backend API contracts of the existing codebase at /run/media/harlan/New Volume/workflow:
1. Locate and inspect the Prisma schema (prisma/schema.prisma or similar), database connection, database provider/adapter, seed files, and migration setup.
2. Inspect the current Task, Project, User, Status or related models. How are task statuses currently represented (enum or string)? What states exist?
3. Analyze what needs to be added/extended in the schema and backend logic to support:
   - R2: Strict Gating & Approval Enforcement for 5 gates:
     - Gate 1 (Idea approval -> Script): Idea status, Editor/Core approval flag/role check.
     - Gate 2 (Script approval -> Production): Script status, approval flag, revision request mechanism, content locking.
     - Gate 3 (Video submission -> QC): Requirement that asset links/source project links are filled AND Production Checklist is 100% complete before submitting draft video.
     - Gate 4 (Editor QC approval -> Core review): QC Checklist 100% complete, Editor QC approval flag.
     - Gate 5 (Core final approval -> Publish): Core approval flag before opening Publish state.
     - Analytics feedback loop back to Step 1.
   - R3: Standardized 4-Column Script Builder:
     - Script identity (Episode name, Channel 1 or 2, Writer Producer, Submission deadline).
     - 4 Standardized segments (Intro/Hook 3Ws, Body with pauses & keywords, Outro/Summary card, CTA & loop).
     - 4-column matrix: Time/Segment, Voice AI, Visual/Mascot/Edits, BGM/SFX.
     - Copyright commitment checkbox and locking on approval.
     - Determine best database schema design: relational Script table vs JSON field vs dedicated child tables.
   - R4: Dual Interactive Checklists:
     - Production Checklist (7 items) and QC Checklist (8 items).
     - How checklist states should be persisted per task (e.g. JSON field or relational checklist items).
   - R5: YouTube Master to TikTok Derivative Cutdown:
     - Task relationship: Master Task <-> TikTok derivative task (e.g. parentTaskId, derivativeType, sourceVideoUrl/Id).
     - TikTok specific checklist items (5 items) and target fields (30-45s, 9:16 reframe, hook 0-3s, CTA).
   - R6: Extended Task Lifecycle & Analytics Metadata:
     - Platform enum/array (YouTube Master, TikTok Cutdown, Facebook Reels).
     - Channel enum (Channel 1, Channel 2).
     - Resource links (Master Video, Asset folder, Script doc, Draft/Final video, Source project).
     - Active assignee per gate.
     - Per-gate deadlines (Script deadline, Production deadline, QC deadline, Target publish).
     - Copyright status for footage, music, mascot.
     - Publish info (URL, Title, Thumbnail, Caption, Hashtag).
     - Post-publish metrics (Views, Retention, CTR, Comments, Insights/lessons learned).
4. Review existing API routes or server actions handling task creation, update, status change, and deletion.
5. Write your complete, detailed analysis report to:
   /run/media/harlan/New Volume/workflow/.agents/explorer_survey_ynda_1/survey_report.md
   and write a standard handoff report to:
   /run/media/harlan/New Volume/workflow/.agents/explorer_survey_ynda_1/handoff.md
6. Send a completion message back to parent when done.
