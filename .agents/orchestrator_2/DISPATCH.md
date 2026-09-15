# Dispatch Log

## 2026-09-15T10:37:23Z

You are the Project Orchestrator for the "Ý Niệm Điện Ảnh" (YNDA) Video Production SOP and System Upgrade.

Workspace root: /run/media/harlan/New Volume/workflow
Your working directory: /run/media/harlan/New Volume/workflow/.agents/orchestrator_2

The complete authoritative user requirements are recorded in:
/run/media/harlan/New Volume/workflow/.agents/ORIGINAL_REQUEST.md under section "## 2026-09-15T10:30:18Z".

Please review the requirements thoroughly:
- R1. Interactive 9-Step SOP Tutorial & Operating Flow (visual tutorial/flowchart for the 9 steps of video production with 5 key fields per step: Role, Input, Tasks, Output, Gating condition).
- R2. Strict Gating & Approval Enforcement (state machine gating for 5 gates: Idea approval -> Script, Script approval -> Production, Draft Video submission -> Production checklist & asset links, Editor QC approval -> Core review, Core final approval -> Publish, plus analytics feedback loop).
- R3. Standardized 4-Column Script Builder (identity header, 4 standardized segments: Intro/Hook 3Ws, Body with technical pauses & keywords, Outro/Summary Card, CTA & Seamless Loop; 4-column matrix: Time/Segment, Voice AI, Visual/Mascot/Edits, BGM/SFX; copyright commitment checkbox).
- R4. Dual Interactive Checklists (Production Checklist for Producer before handoff, and QC Checklist for Editor before Core review, both with persistent state on tasks).
- R5. YouTube Master to TikTok Derivative Cutdown Workflow (create 30-45s 9:16 derivative task from approved YouTube Master video, dedicated TikTok checklist, backward link to Master).
- R6. Extended Task Lifecycle & Analytics Metadata (platforms, channel 1/2, resource links, active assignee per gate, per-gate deadlines, copyright status, publish info, post-publish analytics metrics).
- Acceptance Criteria & Verification: Gating and state progression, script matrix inputs & locking on approval, interactive checklists with progress indicator, TikTok cutdown branch creation, clean build with `npm run build` (zero TypeScript or ESLint errors), and full backward compatibility with existing views (Kanban, Gantt, Dashboard, Portfolio).

Instructions:
1. Initialize your working directory `/run/media/harlan/New Volume/workflow/.agents/orchestrator_2` with `BRIEFING.md`, `plan.md`, and `progress.md`.
2. Inspect the existing codebase structure, database schema/adapters, and UI components in `/run/media/harlan/New Volume/workflow`.
3. Decompose the task into manageable milestones, dispatch subagents to explore, implement, review, and test.
4. Keep `progress.md` continuously updated so the Sentinel liveness monitor sees regular updates.
5. Ensure `npm run build` passes with zero errors before claiming victory.
6. When complete, send your final handoff and victory claim back to the Sentinel. An independent victory audit will verify all acceptance criteria against ORIGINAL_REQUEST.md.
