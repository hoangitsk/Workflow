# Orchestration Plan: Harlan Focus (Blitz Focus)

## Objective
Deliver a production-ready, fully functional native Windows desktop focus timer and task management application in C# .NET WPF under `d:\harlan-focus` satisfying all requirements (R1 - R5) and acceptance criteria, with 100% passing tests in `HarlanFocus.Tests` and verified clean build.

## Phased Approach

### Phase 0: Survey & Scope Specification
- Dispatch 3 parallel Explorers / Spec Miners:
  1. Survey Explorer 1: Data models, persistence, JSON/SQLite, natural language parsing, and unit test architecture.
  2. Survey Explorer 2: UI shell, dark theme, Home dashboard, List detail, Kanban workflow, and navigation architecture in WPF MVVM.
  3. Survey Explorer 3: Adaptive 3-Tier Blitz Focus modes (Full Blitz, Compact List Bar, Mini Clock Widget), window lifecycle, topmost behaviors, timer state machine, and audio/visual cues.
- Synthesize findings into `PROJECT.md` at `d:\workflow\.agents\PROJECT.md` (and mirror at `d:\harlan-focus\.agents\PROJECT.md`).
- Define Feature Inventory, milestone boundaries, interface contracts, and code layout.

### Phase 1: Milestone 1 — Core Models, Persistence & NLP Parser (R1)
- Solution & project setup (`HarlanFocus.Core`, `HarlanFocus.Data`, `HarlanFocus.Tests`).
- Models: List, Task, FocusSession, AppSettings.
- Natural Language Task Input parser.
- Persistence layer (JSON / SQLite).
- Full unit test coverage in `HarlanFocus.Tests`.
- Worker -> Reviewer -> Challenger -> Auditor validation cycle.

### Phase 2: Milestone 2 — UI Shell, Home View & List Management (R2)
- WPF UI application setup with modern dark theme (#101010 background, #171717 cards, #2B2B2B borders).
- Left Sidebar (navigation, create list modal, list filters).
- Main Dashboard (list cards with progress ratio, total estimated time, options).
- Active Blitz Banner on Home.
- Worker -> Reviewer -> Challenger -> Auditor validation cycle.

### Phase 3: Milestone 3 — List Detail & Kanban Workflow (R3)
- Kanban view with 4 columns: Backlog, This Week, Today, Done.
- Task Card rendering, priority badges, estimates.
- Task Creation modal/form with natural language parser integration.
- Prominent 🚀 BLITZ NOW button in Today column.
- Worker -> Reviewer -> Challenger -> Auditor validation cycle.

### Phase 4: Milestone 4 — Adaptive 3-Tier Blitz Focus Modes & Lifecycle (R4, R5)
- Tier 1: Full Blitz distraction-free window with digital countdown, session controls (Pause/Resume, Complete, Skip, Restart).
- Tier 2: Compact List Bar (always-on-top, draggable floating bar, controls).
- Tier 3: Mini Clock Widget (ultra-minimalist floating pill, draggable, coordinates memory, expand/collapse).
- Single active session enforcement, state transitions, auto-move to Done on completion, audio/visual cues.
- Worker -> Reviewer -> Challenger -> Auditor validation cycle.

### Phase 5: Milestone 5 — E2E Testing & Coverage Hardening
- Complete test suite execution (`dotnet test`).
- Ensure 100% test pass rate.
- Adversarial test coverage and edge case verification.
- Final forensic audit verification.
- User report & handoff.
