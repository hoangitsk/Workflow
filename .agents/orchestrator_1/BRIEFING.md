# BRIEFING — 2026-09-12T17:13:08Z

## Mission
Orchestrate the end-to-end development of FOCUS (Harlan Focus / Blitz Focus) native Windows desktop focus timer and task management application in C# .NET WPF, ensuring R1-R5 requirements, clean compilation, and 100% passing tests.

## 🔒 My Identity
- Archetype: orchestrator
- Roles: orchestrator, user_liaison, human_reporter, successor
- Working directory: d:\workflow\.agents\orchestrator_1
- Original parent: parent
- Original parent conversation ID: 2b366ea7-f05b-47f5-8ad6-7754735d01fb

## 🔒 My Workflow
- **Pattern**: Project
- **Scope document**: d:\workflow\.agents\PROJECT.md
1. **Decompose**: Survey full scope with 3 parallel Explorers/Spec Miners, merge findings into PROJECT.md § Feature Inventory, decompose into 3-7 coherent milestones across module boundaries with interface contracts.
2. **Dispatch & Execute**:
   - Run Explorer -> Worker -> Reviewer -> Challenger -> Auditor cycle per milestone.
   - Enforce hard integrity gate veto.
   - Run test validation: dotnet build and dotnet test HarlanFocus.Tests.
3. **On failure** (in this order):
   - Retry: nudge stuck agent or re-send task
   - Replace: spawn fresh agent with partial progress
   - Skip: proceed without (only if non-critical)
   - Redistribute: split stuck agent's remaining work
   - Redesign: re-partition decomposition
   - Escalate: report to parent (sub-orchestrators only, last resort)
4. **Succession**: At 16 spawns, write handoff.md, spawn successor
- **Work items**:
  1. Survey and Scope Mapping [in-progress]
  2. Architecture & Data Persistence (R1) [pending]
  3. UI Shell & List Management (R2) [pending]
  4. Kanban Workflow & List Detail (R3) [pending]
  5. 3-Tier Blitz Focus Modes & Lifecycle (R4, R5) [pending]
  6. E2E Test Suite & Adversarial Hardening [pending]
- **Current phase**: Survey & Decomposition
- **Current focus**: 0. Survey full scope and extract technical specs

## 🔒 Key Constraints
- NEVER write, modify, or create source code files directly.
- NEVER run build/test commands yourself — require workers to do so.
- NEVER investigate or explore the problem at the code level — dispatch Explorers for technical investigation.
- File-editing tools ONLY for metadata/state files (.md) in .agents/ folder.
- DO NOT CHEAT: zero tolerance for facades, hardcoded mocks, or circumvented logic. Forensic auditor veto is absolute.
- Target workspace: d:\harlan-focus.
- Authoritative request: d:\workflow\.agents\ORIGINAL_REQUEST.md.

## Current Parent
- Conversation ID: 2b366ea7-f05b-47f5-8ad6-7754735d01fb
- Updated: not yet

## Key Decisions Made
- Use Project Orchestration Pattern with 3 parallel Survey Explorers.

## Team Roster
| Agent | Type | Work Item | Status | Conv ID |
|-------|------|-----------|--------|---------|
| explorer_survey_1 | teamwork_preview_spec_miner | Survey R1 & Tests | in-progress | d633be1f-05df-446d-9260-337257bb20b7 |
| explorer_survey_2 | teamwork_preview_spec_miner | Survey R2 & R3 UI/Kanban | in-progress | 7cf32e19-9d95-4fb4-982d-5eb868bc4e2e |
| explorer_survey_3 | teamwork_preview_spec_miner | Survey R4 & R5 Focus Modes | in-progress | 68bb9744-e620-4f2b-9e93-49ef4d27f74b |

## Succession Status
- Succession required: no
- Spawn count: 3 / 16
- Pending subagents: d633be1f-05df-446d-9260-337257bb20b7, 7cf32e19-9d95-4fb4-982d-5eb868bc4e2e, 68bb9744-e620-4f2b-9e93-49ef4d27f74b
- Predecessor: none
- Successor: not yet spawned

## Active Timers
- Heartbeat cron: 949e0ba9-8a0c-43be-b683-587c54f767d9/task-15
- Safety timer: none
- On succession: kill all timers before spawning successor
- On context truncation: run `manage_task(Action="list")` — re-create if missing

## Artifact Index
- d:\workflow\.agents\ORIGINAL_REQUEST.md — User request
- d:\workflow\.agents\orchestrator_1\DISPATCH.md — Dispatch log
- d:\workflow\.agents\orchestrator_1\BRIEFING.md — Persistent working memory
- d:\workflow\.agents\orchestrator_1\progress.md — Execution progress tracking
- d:\workflow\.agents\orchestrator_1\plan.md — Orchestration execution plan
