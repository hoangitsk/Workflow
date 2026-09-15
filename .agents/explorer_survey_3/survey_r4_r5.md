# Technical Survey & Specification: Requirement R4 & R5
## Adaptive 3-Tier Blitz Focus Modes & Transition Lifecycle

**Author**: Survey Explorer 3 (Adaptive Blitz Focus Spec Miner)  
**Target Solution**: Harlan Focus (`d:\harlan-focus`)  
**Target Framework**: C# .NET 8 WPF (`net8.0-windows`)  
**Reference Document**: `ORIGINAL_REQUEST.md` (Requirements R4, R5)  
**Date**: 2026-09-12  

---

## 1. Executive Summary & The "Blitz" Philosophy

The Harlan Focus application is anchored in a core psychological insight:
> **"Càng tập trung → giao diện càng nhỏ" (The deeper the focus → the smaller the UI)**

Traditional focus timers force users into an awkward binary choice: either sacrifice their entire screen to a full timer window (preventing work in IDEs, browsers, or documents), or keep the timer minimized to the system tray where focus ambient awareness is completely lost.

**Adaptive 3-Tier Blitz Focus** solves this with a progressive 3-tier shrinking workflow:
1. **Tier 1 — Full Blitz Window**: Used during the commitment and ramp-up phase. Zero distractions, no sidebars or peripheral Kanban cards, huge digital timer, clear task context.
2. **Tier 2 — Compact List Bar**: Used during active multi-window work (e.g. coding, writing, research). A sleek, floating horizontal toolbar that sits permanently on top (`Topmost = true`) of active software, providing continuous ambient accountability with zero workspace blockage.
3. **Tier 3 — Mini Clock Widget**: Used during hyper-focused deep flow. An ultra-minimalist draggable pill in the screen periphery showing just `MM:SS` and task title. Single-click reveals quick controls; double-click expands back to full focus mode.

All three tiers share a **single, unified, drift-free session engine**. When switching tiers, the timer does not stutter, restart, or desynchronize.

---

## 2. Architecture & State Machine

### 2.1 State Transition Diagram

```
                 [ Kanban Today View ]
                           │
                 Click "🚀 BLITZ NOW"
                           │
             ┌─────────────┴─────────────┐
             ▼                           ▼
    [Tier 1: Full Blitz]        (Conflict Check: If session active,
             │                   prompt "Switch / Resume / Cancel")
     Click "↓ MINIMIZE"
             ▼
    [Tier 2: Compact Bar]
             │
     Click "↓ Shrink"
             ▼
    [Tier 3: Mini Clock] ─── Double-Click / Expand ───► [Tier 1 or Tier 2]
             │
             ├── Click "COMPLETE" / Timer Reaches 00:00
             ▼
    [Completion Pipeline]
     ├── 1. Stop Timer & Record FocusSession
     ├── 2. Auto-move Task: Today -> Done
     ├── 3. Recalculate Statistics (Progress, Total Mins)
     ├── 4. Audio Cue (Chime) + Visual Flash (WPF Glow / Taskbar Flash)
     └── 5. Return to List / Offer Next Task in Today
```

### 2.2 Blitz Tier State Definition
```csharp
public enum BlitzTier
{
    None = 0,        // Not in Blitz mode (Home / Kanban view)
    Tier1Full = 1,   // Distraction-free full window
    Tier2Compact = 2,// Horizontal floating bar
    Tier3Mini = 3    // Ultra-minimalist draggable pill widget
}

public enum FocusSessionStatus
{
    NotStarted,
    Running,
    Paused,
    Completed,
    Discarded
}
```

---

## 3. Requirement R4: Adaptive 3-Tier Blitz Focus Modes

### 3.1 Tier 1: Full Blitz Window

#### A. Window Characteristics & Behavior
- **Window Type**: Borderless custom window (`WindowStyle.None`, custom dark title bar).
- **Background**: Modern Dark `#101010` with subtle radial gradient or accent border glow.
- **Distraction-Free Isolation**: Completely omits left sidebar, list navigation, Kanban columns, search inputs, and peripheral task cards.
- **Window States**:
  - `WindowState.Normal` (default centered, 1100x680)
  - `WindowState.Maximized` / Fullscreen mode (toggled via `F11` or button).
- **Topmost**: `false` by default (standard application focus window).

#### B. UI Layout & Visual Hierarchy
1. **Top Bar (Window & Navigation Controls)**:
   - `Back to List` Button: Positioned at top-left (`← Back to List`). Navigates user back to List Detail view while keeping timer running in the background. (Active Blitz Banner appears on Home/List views).
   - `Category / List Badge`: Displays list name and color dot (e.g. `[Project Alpha]`, color `#FF7A00`).
   - `Top-Right Control Group`:
     - `Fullscreen Toggle` (`⛶` / `F11`): Toggles true borderless fullscreen.
     - `↓ MINIMIZE` Button (`↓ Compact`): Transitions immediately to Tier 2 Compact List Bar.
     - `Close (✕)` Button: Prompts user if session is running: "Keep running in background or discard?".
2. **Central Hero Focus Stage**:
   - `Task Title`: 32pt bold Segoe UI Variable Display, crisp white `#FFFFFF`, centered.
   - `Task Description / Notes`: Muted `#888888`, max 2 lines, centered.
   - `Digital Countdown Timer`:
     - Huge display (80pt to 96pt).
     - Format: `MM:SS` (e.g. `24:59`).
     - Monospaced / Tabular numerals (`FontFamily="Consolas, Segoe UI"`, `FontTypography.TabularNumbers`) to eliminate horizontal jitter during countdown ticks.
     - Vibrant Accent Gradient: Running `#FF7A00` to `#FF4B2B` (Orange/Amber Fire), Paused `#4A90E2` (Cool Slate Blue).
   - `Progress Indicator`: Circular radial SVG path ring or sleek horizontal glowing gradient progress bar showing `(ElapsedSeconds / TotalSeconds) * 100%`.
   - `Status Indicator Badge`: `FOCUSING` (pulsing dot), `PAUSED`, or `COMPLETED`.
3. **Session Control Action Bar (Bottom Center)**:
   - `PAUSE / RESUME` (Primary Action): Large pill button with vibrant gradient background. Toggles running state.
   - `COMPLETE` (Checkmark `✓`): Green accent `#38EF7D`. Marks task as Done, logs session, triggers completion cues.
   - `SKIP` (`⏭`): Advances to the next task in Today column. Confirmation prompt if timer is running.
   - `RESTART` (`↺`): Resets countdown timer to task's initial estimated duration.

#### C. Keyboard Shortcuts
| Key | Action |
|-----|--------|
| `Space` | Toggle Pause / Resume |
| `Ctrl + Enter` | Complete Task |
| `Ctrl + S` | Skip to Next Task |
| `Ctrl + R` | Restart Timer |
| `F11` | Toggle Fullscreen |
| `Esc` | Back to List View |
| `Down Arrow` / `Ctrl + M` | Minimize to Tier 2 Compact Bar |

---

### 3.2 Tier 2: Compact List Bar

#### A. Window Characteristics & Behavior
- **Window Form**: Horizontal floating pill/bar.
- **Dimensions**: Width ~460px, Height ~44px.
- **Window Style**: `WindowStyle.None`, `AllowsTransparency.True`, `Background.Transparent`.
- **Card Container**: Rounded border (`CornerRadius="12"`, `Background="#171717"`, `BorderBrush="#2B2B2B"`, `BorderThickness="1"`), subtle drop shadow (`BlurRadius="16"`, `Opacity="0.6"`).
- **Window Flags**: `Topmost = true` (permanently stays atop active IDEs, word processors, browsers), `ShowInTaskbar = false` (or small auxiliary icon).
- **Draggability**: Draggable anywhere on the bar via `MouseDown -> DragMove()`.

#### B. UI Layout (Left to Right Horizontal Strip)
1. **🏠 Home Button**: Single-click navigates Main Window to Home/List view or activates main app.
2. **List Name Badge**: Muted text or colored dot (e.g. `Work`), max width 70px with ellipsis.
3. **Task Title**: White `#FFFFFF`, 12pt semibold, `TextTrimming="CharacterEllipsis"`, max width 160px. Tooltip displays full title.
4. **Countdown Timer**: Crisp digital `MM:SS`, 13pt bold monospace, accent color.
5. **Pause / Resume Button**: Compact icon toggle (`⏸` / `▶`).
6. **✓ Complete Button**: One-click quick task completion.
7. **↓ Shrink to Mini Clock Button**: Transitions directly to Tier 3 Mini Clock Widget.
8. **↗ Expand Button**: Restores Tier 1 Full Blitz Window.

---

### 3.3 Tier 3: Mini Clock Widget

#### A. Window Characteristics & Behavior
- **Window Form**: Ultra-minimalist floating countdown pill.
- **Dimensions**: Width ~150px, Height ~36px (compact mode).
- **Window Style**: `WindowStyle.None`, `AllowsTransparency.True`, `Background.Transparent`.
- **Pill Container**: Pill border (`CornerRadius="18"`, `Background="#171717"`, `BorderBrush="#FF7A00"` with 1px stroke), drop shadow.
- **Topmost**: `true`.
- **ShowInTaskbar**: `false`.
- **Screen Coordinate Memory**:
  - Remembers last (X, Y) coordinates in `AppSettings.MiniClockLeft` and `AppSettings.MiniClockTop`.
  - On repositioning: Updates coordinates on `LocationChanged` (debounced).
  - Multi-Monitor Boundary Check: If saved coordinates fall outside virtual desktop bounds (e.g. detached secondary screen), automatically resets to top-right corner of primary screen (`WorkArea.Right - 180`, `WorkArea.Top + 60`).

#### B. Dual-Mode Interactive UX
1. **Minimal Ambient Mode (Passive State)**:
   - Displays:
     - Tiny Blitz flame icon.
     - Digital countdown: `MM:SS` (13pt bold monospace).
     - Task name snippet (or icon).
   - Draggable: Left-click and drag anywhere on the pill repositions the widget.
2. **Quick Action Controls Overlay (Hover / Single-Click State)**:
   - Clicking once on the pill expands the pill or reveals floating action buttons:
     - `⏸` / `▶` (Pause / Resume)
     - `✓` (Complete task)
     - `↗` (Expand to Tier 2 or Tier 1)
     - `🏠` (Return to Home view)
   - Auto-collapses back to minimal pill after mouse leaves or 3-second timeout.
3. **Double-Click Action**:
   - Double-clicking the pill instantly restores the Full Blitz Window (Tier 1) or Compact List Bar (Tier 2), configured via `AppSettings`.

---

## 4. Requirement R5: Single Active Session & Transition Lifecycle

### 4.1 Single Active Session Enforcement

#### Conflict Prevention Rules
1. **Rule**: At any moment in time, the system allows **at most ONE** active focus session across all lists and tasks.
2. **Conflict Detection**:
   - When the user clicks "🚀 BLITZ NOW" or "START" on Task B:
   - The system checks `IFocusSessionManager.HasActiveSession`.
   - If `HasActiveSession == true` and `ActiveSession.TaskId != TaskB.Id`:
     - System displays a modal confirmation dialog:
       - **Title**: "Active Blitz Session in Progress"
       - **Message**: "A Blitz session is already running for '**{CurrentTask.Title}**' with {RemainingMinutes}m {RemainingSeconds}s remaining. Starting a new session will replace the active one."
       - **Actions**:
         1. **"Switch to New Task"**: Pauses/archives current session, saves elapsed time, initiates new session for Task B.
         2. **"Resume Current Session"**: Dismisses dialog and immediately activates the Blitz tier for the current active task.
         3. **"Cancel"**: Dismisses dialog with no changes.
3. **Task & List Deletion Safeguards**:
   - Deleting or archiving a task/list that holds the active Blitz session is blocked with an alert: "Cannot delete or archive task while a Blitz session is active. Please complete or cancel the session first."

---

### 4.2 Drift-Free Timer Synchronization Engine

#### The Problem of Timer Drift
Naive timer implementations perform `RemainingSeconds--` on every tick of a 1000ms `DispatcherTimer`. If the UI thread is busy rendering or garbage collecting, ticks are delayed or dropped. Over a 25-minute session, this can accumulate up to 5–30 seconds of drift. Furthermore, switching windows would restart or glitch the interval.

#### The Authoritative Drift-Free Solution
```csharp
public class FocusSessionManager : IFocusSessionManager, INotifyPropertyChanged
{
    private DispatcherTimer _timer;
    private DateTime _sessionStartTime;
    private int _initialRemainingSeconds;
    private int _remainingSeconds;

    public int RemainingSeconds
    {
        get => _remainingSeconds;
        private set { _remainingSeconds = value; OnPropertyChanged(); OnPropertyChanged(nameof(FormattedTime)); }
    }

    public void StartSession(TaskItem task, int durationMinutes)
    {
        CurrentTask = task;
        DurationMinutes = durationMinutes;
        _initialRemainingSeconds = durationMinutes * 60;
        _remainingSeconds = _initialRemainingSeconds;
        _sessionStartTime = DateTime.UtcNow;

        _timer = new DispatcherTimer { Interval = TimeSpan.FromMilliseconds(250) };
        _timer.Tick += OnTimerTick;
        _timer.Start();
        Status = FocusSessionStatus.Running;
    }

    private void OnTimerTick(object sender, EventArgs e)
    {
        if (Status != FocusSessionStatus.Running) return;

        var elapsedSeconds = (DateTime.UtcNow - _sessionStartTime).TotalSeconds;
        var newRemaining = Math.Max(0, (int)(_initialRemainingSeconds - elapsedSeconds));

        RemainingSeconds = newRemaining;

        if (RemainingSeconds <= 0)
        {
            _timer.Stop();
            CompleteSession();
        }
    }

    public void PauseSession()
    {
        if (Status != FocusSessionStatus.Running) return;
        _timer.Stop();
        _initialRemainingSeconds = RemainingSeconds; // Save point
        Status = FocusSessionStatus.Paused;
    }

    public void ResumeSession()
    {
        if (Status != FocusSessionStatus.Paused) return;
        _sessionStartTime = DateTime.UtcNow; // Reset origin
        _timer.Start();
        Status = FocusSessionStatus.Running;
    }
}
```
**Benefits**:
- Drift-free: Time is derived directly from `DateTime.UtcNow`.
- Zero tick accumulation error.
- Works continuously across all 3 Tiers because the timer runs in a shared singleton service on the application dispatcher.

---

### 4.3 Task Completion Pipeline (Today -> Done)

When a session completes (either timer reaches `00:00` or user clicks `COMPLETE`):

```
[Trigger Complete]
       │
       ▼
1. Halt Timer Engine (Status = Completed, RemainingSeconds = 0)
       │
       ▼
2. Update FocusSession Model:
   - IsCompleted = true
   - CompletedAt = DateTime.UtcNow
   - Log to Database/JSON storage
       │
       ▼
3. Auto-Transition Task:
   - Task.Status = TaskStatus.Done
   - Task.CompletedAt = DateTime.UtcNow
   - Save Task to Repository
       │
       ▼
4. Update Aggregated Statistics:
   - Increment List CompletedTasks count
   - Recalculate List Progress Ratio (Completed / Total)
   - Update Today focus minutes total
       │
       ▼
5. Trigger Audio & Visual Notification Cues
       │
       ▼
6. Post-Completion Navigation:
   - If more tasks in Today: Prompt "Start Next Task: [Title]?"
   - Otherwise: Return to Home/List view
```

---

### 4.4 Audio and Visual Notification Cues

When the timer reaches `00:00`:

#### A. Audio Cue
1. **Primary**: Play crisp, modern notification chime (e.g. `chime.wav` or `bell.wav`) via `System.Media.SoundPlayer` asynchronously:
   ```csharp
   using (var stream = Application.GetResourceStream(new Uri("pack://application:,,,/Assets/Sounds/bell.wav")).Stream)
   {
       var player = new System.Media.SoundPlayer(stream);
       player.Play();
   }
   ```
2. **Fallback**: If custom sound file is missing or audio driver errors out, fallback to `System.Media.SystemSounds.Asterisk.Play()`.
3. **Mute Preference**: Respects `AppSettings.IsSoundEnabled`.

#### B. Visual Cues
1. **In-App Visual Pulse / Flash**:
   - The active window (Tier 1, Tier 2, or Tier 3) triggers a double pulse animation on its border/glow brush (`DoubleAnimation` on Opacity from 0.3 to 1.0 back and forth over 1.5 seconds) with a vibrant celebratory green `#38EF7D` or golden amber `#FFD700`.
2. **OS Taskbar Flash (`FlashWindowEx`)**:
   - If the user is working in another application (e.g. IDE or Word) when Tier 2/3 completes:
   - Call Win32 `FlashWindowEx` via `WindowInteropHelper` to flash the Windows taskbar icon until the user brings the application to the foreground.
3. **Windows Toast Notification (Optional/Enhanced)**:
   - Show desktop notification: "🎉 Blitz Session Completed! Great job on [Task Title]!".

---

### 4.5 Active Blitz Banner on Home Dashboard

When a Blitz session is running or paused, and the user navigates to the Home view:
- **Location**: Top of the main dashboard, directly above the List Grid.
- **Visual Design**: High-contrast card with gradient accent border (`#FF7A00` to `#FF4B2B`), glowing dot.
- **Content**:
  - Left: Pulsing Blitz icon + "ACTIVE BLITZ SESSION".
  - Center: Current Task Title + List Name + Remaining Time (`MM:SS`).
  - Right:
    - Pause/Resume quick toggle.
    - **"OPEN →" Button**: Clicking immediately switches the view back to the active Blitz Tier (Tier 1 Full Blitz or last active tier).

---

## 5. WPF MVVM Architecture Blueprint

### 5.1 Service Contracts

#### `IFocusSessionManager.cs`
```csharp
public interface IFocusSessionManager : INotifyPropertyChanged
{
    TaskItem? CurrentTask { get; }
    ListItem? CurrentList { get; }
    FocusSession? CurrentSession { get; }
    int DurationMinutes { get; }
    int RemainingSeconds { get; }
    string FormattedTime { get; }
    double ProgressPercentage { get; }
    FocusSessionStatus Status { get; }
    bool HasActiveSession { get; }

    event EventHandler<FocusSessionCompletedEventArgs> SessionCompleted;
    event EventHandler<EventArgs> SessionTick;

    void StartSession(TaskItem task, ListItem list, int durationMinutes);
    void PauseSession();
    void ResumeSession();
    void CompleteSession();
    void SkipToNextTask();
    void RestartSession();
    void DiscardSession();
}
```

#### `IBlitzWindowCoordinator.cs`
```csharp
public interface IBlitzWindowCoordinator
{
    BlitzTier CurrentTier { get; }
    void OpenTier(BlitzTier targetTier);
    void SwitchTier(BlitzTier fromTier, BlitzTier toTier);
    void RestoreFromMiniClock();
    void CloseAllBlitzWindows();
    void SaveCoordinates(BlitzTier tier, double left, double top);
}
```

### 5.2 Window Coordination Architecture
To ensure maximum responsiveness, zero memory leaks, and flicker-free transitions:
- `FullBlitzView`: Designed as a UserControl hosted inside `MainWindow` (or full standalone window).
- `CompactBarWindow`: Standalone transparent `Topmost` window (`Topmost=true`, `ShowInTaskbar=false`).
- `MiniClockWindow`: Standalone transparent `Topmost` window (`Topmost=true`, `ShowInTaskbar=false`).
- All 3 views bind to the **same singleton `BlitzFocusViewModel`**, which wraps `IFocusSessionManager`.
- Transitioning from Tier 1 -> Tier 2:
  1. `MainWindow.Hide()` (or minimize).
  2. `CompactBarWindow.Show()`, `Activate()`.
  3. `CurrentTier = BlitzTier.Tier2Compact`.
- Transitioning Tier 2 -> Tier 3:
  1. `CompactBarWindow.Hide()`.
  2. `MiniClockWindow.Show()`, `Activate()`.
  3. `CurrentTier = BlitzTier.Tier3Mini`.
- Transitioning Tier 3 -> Tier 1:
  1. `MiniClockWindow.Hide()`.
  2. `MainWindow.Show()`, `MainWindow.WindowState = WindowState.Normal`, `Activate()`.
  3. `CurrentTier = BlitzTier.Tier1Full`.

### 5.3 Coordinate Clamping Algorithm
```csharp
public Point ClampToVirtualScreen(double requestedLeft, double requestedTop, double width, double height)
{
    double minX = SystemParameters.VirtualScreenLeft;
    double minY = SystemParameters.VirtualScreenTop;
    double maxX = minX + SystemParameters.VirtualScreenWidth;
    double maxY = minY + SystemParameters.VirtualScreenHeight;

    // Safety fallback to primary screen if invalid or disconnected monitor
    if (requestedLeft < minX || requestedLeft + width > maxX ||
        requestedTop < minY || requestedTop + height > maxY)
    {
        return new Point(
            SystemParameters.WorkArea.Right - width - 30,
            SystemParameters.WorkArea.Top + 60
        );
    }

    return new Point(requestedLeft, requestedTop);
}
```

---

## 6. Features Discovered Table

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | R4 - Tier 1 | Full Blitz Distraction-Free Shell | Fullscreen/maximized window isolating focus, hides all peripheral navigation and sidebars | Task, List, Duration | Distraction-free focus view | Falls back to centered normal window if fullscreen unsupported | ORIGINAL_REQUEST.md § R4 |
| 2 | R4 - Tier 1 | Huge Digital Monospace Timer | Monospaced digital countdown MM:SS preventing digit wobble during ticks | RemainingSeconds | Formatted time string, Progress Bar | Clamps at 00:00 | ORIGINAL_REQUEST.md § R4 |
| 3 | R4 - Tier 1 | Full Blitz Session Controls | Pause/Resume, Complete, Skip to next Today task, Restart timer | Button clicks, Hotkeys | Session state updates, Timer adjustments | Skip disabled if Today column has no further tasks | ORIGINAL_REQUEST.md § R4 |
| 4 | R4 - Tier 1 | Tier 1 Minimization Trigger | ↓ MINIMIZE button shrinks Full Blitz into Tier 2 Compact List Bar | Click ↓ MINIMIZE | Full window hides, Tier 2 shows | Preserves exact timer state | ORIGINAL_REQUEST.md § R4 |
| 5 | R4 - Tier 1 | Back to List Navigation | Returns to Kanban list view while session remains active in background | Click "Back to List" | Full Blitz hides, Kanban shows, Home banner activates | Session continues running | ORIGINAL_REQUEST.md § R4 |
| 6 | R4 - Tier 2 | Floating Compact List Bar | Horizontal floating bar atop active apps (IDE/Word) with Topmost=true | Task, List, Timer | Draggable floating bar | Falls back to screen bounds if dragged off-screen | ORIGINAL_REQUEST.md § R4 |
| 7 | R4 - Tier 2 | Compact Bar Draggability | Bar responds to mouse drag anywhere on container | MouseDown + Drag | Window repositions | Clamps to virtual screen area | ORIGINAL_REQUEST.md § R4 |
| 8 | R4 - Tier 2 | Compact Bar Controls | Home button, List Name, Task Title, Timer, Pause/Resume toggle, Shrink button | Click events | Action execution, transitions | Ellipsis truncates long task titles | ORIGINAL_REQUEST.md § R4 |
| 9 | R4 - Tier 2 | Shrink to Mini Clock Trigger | ↓ button on Compact Bar transitions directly to Tier 3 Mini Clock Widget | Click ↓ | Tier 2 hides, Tier 3 shows at remembered coordinates | Falls back to default coordinates if not set | ORIGINAL_REQUEST.md § R4 |
| 10| R4 - Tier 3 | Ultra-Minimalist Mini Clock Widget | Draggable floating pill displaying countdown timer and task snippet with Topmost=true | Task, Timer | Floating pill widget | Restores to primary screen if monitor disconnected | ORIGINAL_REQUEST.md § R4 |
| 11| R4 - Tier 3 | Screen Coordinate Persistence | Remembers (Left, Top) coordinates in AppSettings upon repositioning | Window LocationChanged | Persisted AppSettings coordinates | Debounced to prevent disk thrashing during drag | ORIGINAL_REQUEST.md § R4 |
| 12| R4 - Tier 3 | Single-Click Quick Action Controls | Single-click reveals quick controls (⏸, ✓, ↗, 🏠) | Mouse click on pill | Quick action overlay expands | Auto-collapses on mouse leave or 3s timeout | ORIGINAL_REQUEST.md § R4 |
| 13| R4 - Tier 3 | Double-Click Restore Action | Double-clicking the pill restores Full Blitz or Compact Bar view | Mouse double click | Tier 3 hides, target view opens | Configurable target view in AppSettings | ORIGINAL_REQUEST.md § R4 |
| 14| R5 - Lifecycle| Single Active Session Enforcement | Prohibits concurrent Blitz sessions across app; prompts confirmation before switching | Start new session command | Conflict dialog: Switch, Resume, Cancel | Blocks multiple timers from running concurrently | ORIGINAL_REQUEST.md § R5 |
| 15| R5 - Lifecycle| Drift-Free Timer Engine | Timestamp-based calculation using DateTime.UtcNow; immune to UI thread lag | Session start timestamp, duration | Exact RemainingSeconds | Zero cumulative drift over long sessions | Architectural probe |
| 16| R5 - Lifecycle| Auto-Move Today -> Done | Completing session moves task from Today to Done column automatically | Complete action or 00:00 tick | Task status updated to Done, CompletedAt set | Transactional update with repository | ORIGINAL_REQUEST.md § R5 |
| 17| R5 - Lifecycle| Statistics Recalculation | Increments completed count, decrements pending, updates list progress bar ratio | Task completion event | Recalculated list & daily stats | Updates UI reactively via INotifyPropertyChanged | ORIGINAL_REQUEST.md § R5 |
| 18| R5 - Lifecycle| Audio Completion Cue | Plays celebration chime at 00:00 via SoundPlayer | Timer == 00:00 | Audio chime playback | Silent fallback if audio device absent | ORIGINAL_REQUEST.md § R5 |
| 19| R5 - Lifecycle| Visual Completion Cue | In-app border glow flash and OS taskbar flash (FlashWindowEx) | Timer == 00:00 | Animated glow pulse, flashing taskbar | Graceful degradation if OS API restricted | ORIGINAL_REQUEST.md § R5 |
| 20| R5 - Lifecycle| Active Blitz Banner on Home | Persistent banner on Home dashboard showing task, time left, and OPEN button | Active session != null | Interactive banner on Home view | Disappears when session completes or discarded | ORIGINAL_REQUEST.md § R2, R5 |

---

## 7. Edge Cases & Failure Recovery

| # | Feature | Input / Scenario | Observed / Specified Behavior |
|---|---------|------------------|-------------------------------|
| 1 | Single Active Session | User clicks "BLITZ NOW" on Task B while Task A is actively running | Modal dialog intercepts: "A Blitz session is already running for '[Task A]'. Switch / Resume / Cancel". Session A is not silently overwritten. |
| 2 | Window Transition | User switches Tier 1 -> Tier 2 -> Tier 3 while timer is running | Timer does not reset, stutter, or pause. Remaining seconds continue monotonically without loss. |
| 3 | Coordinate Persistence | Secondary monitor is disconnected after user positioned Mini Clock on it | Clamping algorithm detects (Left, Top) is outside VirtualScreen bounds and resets to primary screen top-right corner. |
| 4 | Task Deletion Conflict | User tries to delete or archive a list or task while its Blitz session is active | Operation is rejected with warning: "Cannot delete or archive task while a Blitz session is active." |
| 5 | Skip on Last Task | User clicks "SKIP" in Tier 1, but no further tasks exist in Today column | Alert prompt: "This was the last task in Today. Would you like to complete it or return to the list?" |
| 6 | System Sleep / Hibernate | Laptop enters sleep mode for 20 minutes while a 25-minute timer is running | On wake-up, timestamp difference `(DateTime.UtcNow - StartTime)` correctly accounts for elapsed real time, clamping to 00:00 and triggering completion. |
| 7 | Zero or Negative Duration | Task has EstimatedMinutes = 0 or negative | Natural Language parser / validation defaults duration to 25 minutes (standard Pomodoro) or prompts for duration. |
| 8 | Rapid Window Toggling | User rapidly clicks minimize/expand between Tier 1, 2, and 3 | Debounced coordinator prevents multiple window instances; guarantees exactly one window visible. |
| 9 | Audio Failure | Audio driver muted or absent when timer hits 00:00 | SoundPlayer exception caught; visual flash and taskbar flash fire normally. |
| 10| App Crash / Force Close | Process killed unexpectedly during active session | On relaunch, database records last saved session state; incomplete session is marked interrupted/abandoned. |

---

## 8. Unit & Integration Test Matrix for R4 & R5

To be implemented in `HarlanFocus.Tests`:

1. **Timer State Machine Tests**:
   - `FocusSession_Start_SetsRunningStateAndCorrectDuration`
   - `FocusSession_Pause_StopsTimerAndRetainsRemainingSeconds`
   - `FocusSession_Resume_ContinuesWithoutDrift`
   - `FocusSession_Complete_SetsIsCompletedAndMovesTaskToDone`
   - `FocusSession_Restart_ResetsRemainingSecondsToInitial`
2. **Single Active Session Conflict Tests**:
   - `StartSession_WhenAnotherSessionActive_DetectsConflict`
   - `SwitchSession_ArchivesPreviousSessionAndStartsNew`
3. **Task Status Transition Tests**:
   - `CompleteSession_UpdatesTaskStatusFromTodayToDone`
   - `CompleteSession_SetsCompletedAtTimestamp`
   - `CompleteSession_UpdatesListProgressMetrics`
4. **Coordinate Clamping Logic Tests**:
   - `ClampCoordinates_WithinVirtualScreen_ReturnsSamePoint`
   - `ClampCoordinates_OutsideVirtualScreen_ReturnsDefaultPrimaryScreenPoint`
