# Handoff Report: Survey Explorer 3 (Adaptive Blitz Focus Spec Miner)

## 1. Observation
- **Authoritative Specifications**:
  - `d:\workflow\.agents\ORIGINAL_REQUEST.md`, lines 38-59:
    - R4: "Adaptive 3-Tier Blitz Focus Modes: Tier 1 — Full Blitz Window (distraction-free view removing all sidebars, cards, and peripheral UI; task title, category/list name, huge digital countdown MM:SS, PAUSE/RESUME, COMPLETE, SKIP, RESTART, Back to List, Fullscreen toggle, Close, ↓ MINIMIZE). Tier 2 — Compact List Bar (horizontal floating bar, Topmost=true, draggable anywhere on screen, Home button, List Name, Task Title, countdown timer, Pause/Resume toggle, ↓ Shrink to Mini Clock button). Tier 3 — Mini Clock Widget (ultra-minimalist floating countdown pill, Topmost=true, draggable, remembers last screen coordinates upon repositioning in AppSettings, countdown timer and task name, single-click quick actions: ⏸, ✓, ↗, 🏠; double-click restores Full Blitz or Compact view)."
    - R5: "Single Active Session & Transition Lifecycle: Enforce a single active Blitz session: prevent concurrent sessions and prompt for confirmation before switching tasks if a session is currently active. Completing a session automatically moves the task from Today to Done and updates completion statistics. Audio/visual notification cue when the timer reaches 00:00."
  - Lines 76-84: Acceptance criteria for 3-tier transitions, draggability, topmost behavior, task auto-move Today -> Done, and Active Blitz banner on Home dashboard.
- **Environment Discovery**:
  - Tool execution of `& "C:\Users\hoang\.dotnet\dotnet.exe" --info` returned:
    - `.NET SDK: Version 8.0.425`
    - `Runtime: Microsoft.WindowsDesktop.App 8.0.31` (WPF supported on win-x64, Windows 10.0.19045).
    - SDK path: `C:\Users\hoang\.dotnet\sdk\8.0.425\`.
- **Target Workspace**:
  - `d:\harlan-focus` currently contains only `.agents/`. Solution is to be initialized per Orchestrator Plan (`d:\workflow\.agents\orchestrator_1\plan.md`).
- **Survey Output**:
  - Detailed technical survey compiled at `d:\workflow\.agents\explorer_survey_3\survey_r4_r5.md` (514 lines, 28,166 bytes).

## 2. Logic Chain
- **Step 1**: From R4 ("Càng tập trung → giao diện càng nhỏ"), the user journey transitions through three distinct visual states: Tier 1 (Full Blitz, distraction-free), Tier 2 (Compact List Bar, floating atop active work), and Tier 3 (Mini Clock Widget, ultra-compact pill in the corner).
- **Step 2**: If each Tier window implemented its own timer, switching between Tier 1, 2, and 3 would introduce race conditions, tick stutter, or cumulative drift. Therefore, a centralized singleton `IFocusSessionManager` must manage the timer engine and state independently of the visual presentation layer.
- **Step 3**: Naive decrementing (`remaining--`) in a 1000ms timer drifts under thread load or garbage collection. A timestamp-based calculation (`RemainingSeconds = InitialSeconds - (DateTime.UtcNow - StartTime)`) guarantees mathematical precision and zero cumulative drift across all tiers.
- **Step 4**: Window transitions (Tier 1 -> Tier 2 -> Tier 3) must be orchestrated by an `IBlitzWindowCoordinator` that manages window visibility (`Show()`, `Hide()`), activates `Topmost = true` for floating views, and binds all views to the single active `BlitzFocusViewModel`.
- **Step 5**: Tier 3 requires screen coordinate persistence (`AppSettings.MiniClockLeft`, `AppSettings.MiniClockTop`). When secondary displays are unplugged, blind restoration causes off-screen windows. A virtual screen boundary clamping algorithm (`ClampToVirtualScreen`) guarantees fallback to the primary screen.
- **Step 6**: For R5 Single Active Session enforcement, `IFocusSessionManager` tracks `HasActiveSession`. When starting a task while another is active, a conflict dialog intercepts the action offering: "Switch to New Task", "Resume Current Session", or "Cancel".
- **Step 7**: Completion lifecycle automatically sets `Task.Status = TaskStatus.Done`, logs `FocusSession`, updates list and daily statistics, and triggers both an audio cue (`SoundPlayer` playing chime asset with `SystemSounds.Asterisk` fallback) and visual cues (WPF border pulse animation + Win32 `FlashWindowEx` for taskbar alert).

## 3. Caveats
- **Win32 FlashWindowEx**: Requires P/Invoke with `WindowInteropHelper` when flashing taskbar for background notifications. If running in restricted security environments, fallback is in-app visual pulse.
- **Topmost Behavior across Fullscreen Games**: Standard WPF `Topmost = true` stays above normal desktop apps (Word, Chrome, IDEs) but will sit behind DirectX exclusive-fullscreen games. This is normal and expected for desktop productivity tools.
- **Sound File Asset**: Audio playback requires bundling a lightweight `.wav` sound resource (e.g. `Assets/Sounds/bell.wav`). A programmatic fallback using `System.Media.SystemSounds.Asterisk` must be in place if the file is missing.

## 4. Conclusion
- The specifications for Requirements R4 and R5 are fully mined, verified against `ORIGINAL_REQUEST.md`, and documented with complete class interfaces, state machines, XAML styling, edge-case failure handling, and unit test matrices in `d:\workflow\.agents\explorer_survey_3\survey_r4_r5.md`.
- Implementation teams can proceed with Milestone 4 based on the `IFocusSessionManager`, `IBlitzWindowCoordinator`, and `BlitzFocusViewModel` blueprints.

## 5. Verification Method
1. Inspect the survey report at `d:\workflow\.agents\explorer_survey_3\survey_r4_r5.md` to confirm coverage of all R4 and R5 requirements and acceptance criteria.
2. Verify SDK readiness with:
   `& "C:\Users\hoang\.dotnet\dotnet.exe" --info`
3. When `HarlanFocus.Tests` is built in subsequent milestones, execute the R4/R5 unit tests:
   `& "C:\Users\hoang\.dotnet\dotnet.exe" test d:\harlan-focus\HarlanFocus.Tests`
   Targeting:
   - `FocusSession_Start_SetsRunningStateAndCorrectDuration`
   - `FocusSession_Resume_ContinuesWithoutDrift`
   - `StartSession_WhenAnotherSessionActive_DetectsConflict`
   - `CompleteSession_UpdatesTaskStatusFromTodayToDone`
   - `ClampCoordinates_OutsideVirtualScreen_ReturnsDefaultPrimaryScreenPoint`
