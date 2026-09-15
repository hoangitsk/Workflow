# Specification & Survey Report: Requirement R1 (Core Data Models & Local Persistence) and Automated Build & Unit Tests

**Document ID**: SPEC-R1-DATA-TESTS  
**Target Project**: HarlanFocus (`d:\harlan-focus`)  
**Author**: Survey Explorer 1 (Data & Test Spec Miner)  
**Date**: 2026-09-12T17:20:00Z  
**Runtime Environment**: .NET 8.0 (SDK 8.0.425 located at `C:\Users\hoang\.dotnet\dotnet.exe`, Windows Desktop Runtime 8.0.31, Win-x64)

---

## Executive Summary & Environment Discovery

During the environment probing phase, the following critical platform characteristics were established:
1. **.NET SDK Resolution**: The system default `C:\Program Files\dotnet\dotnet.exe` only contains runtimes without an installed SDK. However, a complete **.NET 8.0.425 SDK** with `Microsoft.WindowsDesktop.App` (WPF support) is installed at `C:\Users\hoang\.dotnet`.
2. **Build CLI Requirement**: Any build and test command in PowerShell must prepend `C:\Users\hoang\.dotnet` to `$env:PATH`:
   ```powershell
   $env:PATH = "C:\Users\hoang\.dotnet;$env:PATH"; dotnet build
   $env:PATH = "C:\Users\hoang\.dotnet;$env:PATH"; dotnet test
   ```
3. **NuGet Availability**: The official NuGet feed (`https://api.nuget.org/v3/index.json`) is enabled and verified with 200 OK connectivity.
4. **WPF and Test Templates**: Standard `wpf` and `xunit` templates are installed and available in the .NET 8.0 SDK.

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Model | `FocusList` Domain Entity | Represents a task list/category with metadata and progress metrics | `Name`, `Icon`, `Color`, optional `Tasks` collection | Instance of `FocusList` with generated `Guid Id` | Validation error if `Name` is null or empty string | `ORIGINAL_REQUEST.md` R1, R2 |
| 2 | Model | `TaskItem` Domain Entity | Represents an actionable task with scheduling, priority, and workflow state | `Title`, `ListId`, `EstimatedMinutes`, `DueDate`, `Priority`, `Status` | Instance of `TaskItem` with generated `Guid Id` | Validation error if `Title` is blank or `EstimatedMinutes <= 0` | `ORIGINAL_REQUEST.md` R1, R3 |
| 3 | Model | `FocusSession` Domain Entity | Tracks an active or completed Blitz focus timer execution | `TaskId`, `DurationMinutes`, `RemainingSeconds` | Instance of `FocusSession` with timestamps | Validation error if `DurationMinutes <= 0` | `ORIGINAL_REQUEST.md` R1, R4, R5 |
| 4 | Model | `AppSettings` Configuration | Stores desktop window coordinates, Topmost preferences, and audio settings | Window positions, mini-clock X/Y, flags | Instance of `AppSettings` with defaults | Reverts to default safe coordinates if values are invalid | `ORIGINAL_REQUEST.md` R1, R4 |
| 5 | Parser | Natural Language Duration Parsing | Extracts duration in minutes from expressions like "50m", "1h", "2h30m", "45min", "1.5h" | Raw input string containing duration tokens | Integer minutes (e.g. 50, 60, 150, 45, 90) | Defaults to 25 minutes if omitted or unparseable | `ORIGINAL_REQUEST.md` R1, Acceptance Criteria |
| 6 | Parser | Natural Language Date Parsing | Extracts target date from relative keywords ("today", "tomorrow", "next monday", "this friday") | Raw input string containing date tokens | Nullable `DateTime` representing resolved calendar date | Returns `null` if no date token found | `ORIGINAL_REQUEST.md` R1, Acceptance Criteria |
| 7 | Parser | Natural Language Priority Parsing | Extracts priority from explicit tag markers (`!high`, `!medium`, `!low`, `!urgent`, `p1`, `p2`, `p3`) | Raw input string containing priority tokens | `TaskPriority` enum value (High, Medium, Low) | Defaults to `TaskPriority.Medium` if omitted | `ORIGINAL_REQUEST.md` R1, R3 |
| 8 | Parser | Natural Language Title Normalization | Strips extracted duration, date, and priority tokens, leaving clean task title | Raw input string (e.g. "Study Math 50m tomorrow !high") | Clean title (e.g. "Study Math") | Retains trimmed string; throws if input is completely empty | `ORIGINAL_REQUEST.md` R1, Acceptance Criteria |
| 9 | Parser | Status Inferencing | Automatically infers initial workflow status based on parsed date | Parsed `DueDate` | `TaskWorkflowStatus.Today`, `ThisWeek`, or `Backlog` | Defaults to `Backlog` when unscheduled | `ORIGINAL_REQUEST.md` R1, R3 |
| 10 | Persistence | Atomic File Store (`JsonDataStore`) | Thread-safe, crash-resilient JSON storage in `%LocalAppData%\HarlanFocus` using temp-write & replace | Domain entities or collections to persist | Formatted JSON written to disk atomically | Recovers from `.bak` backup if primary file is corrupted | `ORIGINAL_REQUEST.md` R1 |
| 11 | Concurrency | Single Active Session Manager | Prevents concurrent Blitz timer sessions across lists and tasks | Start session request with `TaskId` | Active session context or conflict exception | Rejects concurrent start; prompts user before switching | `ORIGINAL_REQUEST.md` R5, Acceptance Criteria |
| 12 | State Machine | Task Workflow State Transitions | Governs lifecycle progression: `Backlog` -> `ThisWeek` -> `Today` -> `Done` | Transition request with target status | Updated `TaskItem` with timestamp updates (`CompletedAt`) | Rejects invalid status values; sets/clears `CompletedAt` | `ORIGINAL_REQUEST.md` R1, R3, Acceptance Criteria |
| 13 | State Machine | Blitz Countdown Timer Service | High-precision countdown timer with pause, resume, skip, restart, and completion signals | Interval ticks or state change commands | Tick events, remaining seconds, state changes | Clamps at 0; fires completion event at 00:00 | `ORIGINAL_REQUEST.md` R4, R5, Acceptance Criteria |
| 14 | Testing | Automated Unit Test Suite (`HarlanFocus.Tests`) | Full xUnit test suite executing via `dotnet test` covering parser, models, persistence, and timer | Test fixtures and test input data | Test execution pass/fail reports | Fails build if any test fails | `ORIGINAL_REQUEST.md` Acceptance Criteria |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | NL Parser | Number in title: `"Chapter 1 reading 45min"` | Parser captures `45min` (45 min) as duration; leaves `"Chapter 1 reading"` intact without swallowing `"1"` as 1 hour. |
| 2 | NL Parser | Decimal hour: `"Review pull request 1.5h today"` | Parser calculates `1.5 * 60 = 90` minutes; resolves date to today; cleans title to `"Review pull request"`. |
| 3 | NL Parser | Mixed duration units: `"Write report 2h30m"` | Parser calculates `(2 * 60) + 30 = 150` minutes; clean title is `"Write report"`. |
| 4 | NL Parser | Token ordering: `"50m tomorrow Study Math"` | Parser extracts duration (`50m`) and date (`tomorrow`) regardless of token position; preserves remainder as `"Study Math"`. |
| 5 | NL Parser | Multiple punctuation and symbols: `"Fix bug #104 20m !high"` | Parser extracts priority (`!high`) and duration (`20m`); preserves `"Fix bug #104"` as title. |
| 6 | NL Parser | Non-English / Unicode input: `"Học toán 45m ngày mai !high"` | Parser extracts `45m`, `!high`; leaves `"Học toán ngày mai"` intact without character encoding corruption. |
| 7 | NL Parser | Empty or whitespace-only input: `""` or `"   "` | Throws `ArgumentException` with message indicating task title cannot be empty. |
| 8 | NL Parser | Input with no duration: `"Prepare presentation tomorrow"` | Defaults duration to `25` minutes; extracts date as tomorrow; status inferred as `ThisWeek`. |
| 9 | NL Parser | Input with no date: `"Refactor database 40m"` | Extracts duration `40m`; date is `null`; status defaults to `Backlog`. |
| 10 | State Machine | Reverting task from `Done` to `Today` | `CompletedAt` timestamp is cleared (set to `null`); list progress ratio and pending count recalculate immediately. |
| 11 | State Machine | Transitioning task from `Today` to `Done` | `CompletedAt` is stamped with current UTC time; if an active session was running for this task, session completes. |
| 12 | Single Session | Attempting to start Blitz when another session is active | `SessionConflictException` thrown with details of active task, requiring explicit user prompt/confirmation to abort or switch. |
| 13 | Timer Logic | Rapid Pause/Resume toggling | Timer internal stopwatch/delta accumulation prevents time dilation or lost seconds; thread-safe lock prevents racing state flags. |
| 14 | Timer Logic | Timer hits 00:00 | Countdown clamps to 0 (never negative); `IsCompleted` set to `true`; `SessionCompleted` event dispatched; task transitions to `Done`. |
| 15 | Persistence | Process kill or crash during file write | Because writes are performed to `data.json.tmp` and atomically moved, original `data.json` remains uncorrupted. |
| 16 | Persistence | Missing data directory or file at first run | Auto-creates `%LocalAppData%\HarlanFocus` directory; initializes with default empty store and default settings. |
| 17 | Persistence | Corrupted JSON file on disk | Attempts recovery from `data.json.bak`; if unrecoverable, creates backup timestamped file and initializes safe default store. |

---

## 1. Exact Model Properties, Relationships, and Enums

### 1.1 Critical C# Type Collision Prevention
In C# .NET:
- `System.Threading.Tasks.Task` is a foundational BCL class. Naming a domain class `Task` causes severe compiler ambiguities across async/await methods, MVVM `ICommand` handlers, and LINQ queries.
- `System.Threading.Tasks.TaskStatus` is also a BCL enum.
- **Specification Decision**: 
  - Domain entity is named **`TaskItem`** (or aliased as `FocusTask`).
  - Status enum is named **`TaskWorkflowStatus`**.
  - Priority enum is named **`TaskPriority`**.

### 1.2 Model Specifications

#### A. Enums
```csharp
namespace HarlanFocus.Core.Models;

public enum TaskPriority
{
    Low = 0,
    Medium = 1,
    High = 2
}

public enum TaskWorkflowStatus
{
    Backlog = 0,
    ThisWeek = 1,
    Today = 2,
    Done = 3
}

public enum BlitzTier
{
    FullBlitz = 1,
    CompactBar = 2,
    MiniClock = 3
}
```

#### B. `TaskItem`
```csharp
namespace HarlanFocus.Core.Models;

public class TaskItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ListId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int EstimatedMinutes { get; set; } = 25;
    public DateTime? DueDate { get; set; }
    public TaskPriority Priority { get; set; } = TaskPriority.Medium;
    public TaskWorkflowStatus Status { get; set; } = TaskWorkflowStatus.Backlog;
    public DateTime? CompletedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public int Order { get; set; } = 0;
}
```

#### C. `FocusList`
```csharp
namespace HarlanFocus.Core.Models;

public class FocusList
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "Folder";
    public string Color { get; set; } = "#4D96FF";
    public List<TaskItem> Tasks { get; set; } = new();
    public bool IsArchived { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Derived / Computed Metrics for Dashboard Cards
    [System.Text.Json.Serialization.JsonIgnore]
    public int TotalTasksCount => Tasks.Count;

    [System.Text.Json.Serialization.JsonIgnore]
    public int PendingTasksCount => Tasks.Count(t => t.Status != TaskWorkflowStatus.Done);

    [System.Text.Json.Serialization.JsonIgnore]
    public int CompletedTasksCount => Tasks.Count(t => t.Status == TaskWorkflowStatus.Done);

    [System.Text.Json.Serialization.JsonIgnore]
    public double ProgressRatio => TotalTasksCount > 0 
        ? (double)CompletedTasksCount / TotalTasksCount 
        : 0.0;

    [System.Text.Json.Serialization.JsonIgnore]
    public int TotalEstimatedMinutes => Tasks
        .Where(t => t.Status != TaskWorkflowStatus.Done)
        .Sum(t => t.EstimatedMinutes);

    [System.Text.Json.Serialization.JsonIgnore]
    public string FormattedTotalEstimatedTime => TotalEstimatedMinutes >= 60 
        ? $"{TotalEstimatedMinutes / 60}h {TotalEstimatedMinutes % 60}m" 
        : $"{TotalEstimatedMinutes}m";
}
```

#### D. `FocusSession`
```csharp
namespace HarlanFocus.Core.Models;

public class FocusSession
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TaskId { get; set; }
    public int DurationMinutes { get; set; } = 25;
    public int RemainingSeconds { get; set; } = 1500;
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? EndedAt { get; set; }
    public bool IsPaused { get; set; } = false;
    public bool IsCompleted { get; set; } = false;
    public BlitzTier CurrentTier { get; set; } = BlitzTier.FullBlitz;

    [System.Text.Json.Serialization.JsonIgnore]
    public int ElapsedSeconds => Math.Max(0, (DurationMinutes * 60) - RemainingSeconds);
}
```

#### E. `AppSettings`
```csharp
namespace HarlanFocus.Core.Models;

public class AppSettings
{
    // Main Window State
    public double MainWindowWidth { get; set; } = 1200;
    public double MainWindowHeight { get; set; } = 800;
    public double? MainWindowTop { get; set; }
    public double? MainWindowLeft { get; set; }
    public bool IsMainWindowMaximized { get; set; } = false;

    // Mini-Clock Widget State
    public double MiniClockLeft { get; set; } = 100;
    public double MiniClockTop { get; set; } = 100;
    public bool MiniClockAlwaysOnTop { get; set; } = true;

    // Compact Bar State
    public double CompactBarLeft { get; set; } = 100;
    public double CompactBarTop { get; set; } = 100;
    public bool CompactBarAlwaysOnTop { get; set; } = true;

    // User Preferences
    public int DefaultFocusDurationMinutes { get; set; } = 25;
    public bool SoundCueEnabled { get; set; } = true;
    public Guid? LastSelectedListId { get; set; }
    public string Theme { get; set; } = "Dark";
}
```

---

## 2. Natural Language Task Input Parser Specification

### 2.1 Parser Objective
The `NaturalLanguageTaskParser` takes an unstructured text input (e.g. `"Study Math 50m tomorrow !high"`) and produces a strongly typed `NaturalLanguageParseResult` containing:
- `Title` (e.g. `"Study Math"`)
- `EstimatedMinutes` (e.g. `50`)
- `DueDate` (e.g. Tomorrow's `DateTime`)
- `Priority` (e.g. `TaskPriority.High`)
- `InferredStatus` (e.g. `TaskWorkflowStatus.ThisWeek` or `TaskWorkflowStatus.Today`)

### 2.2 Token Regex Patterns

#### A. Duration Token Pattern
Matches combinations like `1h30m`, `50m`, `2h`, `45min`, `90 mins`, `1.5h`:
```csharp
private static readonly Regex DurationRegex = new(
    @"(?i)\b(?:(?<hours>\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?))?\s*(?:(?<mins>\d+)\s*(?:m|min|mins|minutes?))\b|\b(?<hoursOnly>\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hours?)\b",
    RegexOptions.Compiled);
```
**Parsing Formula**:
- If `hours` and `mins` matched: `(int)(double.Parse(hours) * 60) + int.Parse(mins)`
- If `hoursOnly` matched: `(int)(double.Parse(hoursOnly) * 60)`
- If `mins` only matched: `int.Parse(mins)`
- Fallback: if no match, default to `25` minutes.

#### B. Priority Token Pattern
Matches tags like `!high`, `!medium`, `!low`, `!urgent`, `!h`, `!m`, `!l`, `p1`, `p2`, `p3`:
```csharp
private static readonly Regex PriorityRegex = new(
    @"(?i)(?:!|#)(?<prio>high|med|medium|low|urgent|h|m|l)\b|\b(?<prioKey>p1|p2|p3)\b",
    RegexOptions.Compiled);
```
**Mapping Rules**:
- `high`, `urgent`, `h`, `p1` -> `TaskPriority.High`
- `med`, `medium`, `m`, `p2` -> `TaskPriority.Medium`
- `low`, `l`, `p3` -> `TaskPriority.Low`
- Fallback: `TaskPriority.Medium`

#### C. Relative Date Token Pattern
Matches `"today"`, `"tomorrow"`, `"tonight"`, `"next [day]"`, `"this [day]"`:
```csharp
private static readonly Regex DateRegex = new(
    @"(?i)\b(?<rel>today|tomorrow|tonight|next\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|week)|this\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun))\b",
    RegexOptions.Compiled);
```

#### D. Relative Date Resolution Algorithm
Given reference date `DateTime today = DateTime.Today`:
1. `"today"`, `"tonight"` -> `today`
2. `"tomorrow"` -> `today.AddDays(1)`
3. `"this [DayOfWeek]"` -> calculates days until that day of the week in current/upcoming week:
   ```csharp
   int daysUntil = ((int)targetDay - (int)today.DayOfWeek + 7) % 7;
   if (daysUntil == 0) daysUntil = 7; // next occurrence if today
   DateTime targetDate = today.AddDays(daysUntil);
   ```
4. `"next [DayOfWeek]"` -> `today.AddDays(daysUntil + 7)`
5. `"next week"` -> `today.AddDays(7)`

### 2.3 Status Inferencing Logic
- If `DueDate.HasValue` and `DueDate.Value.Date == DateTime.Today`:
  - `InferredStatus = TaskWorkflowStatus.Today`
- If `DueDate.HasValue` and `DueDate.Value.Date > DateTime.Today` and `DueDate.Value.Date <= DateTime.Today.AddDays(7)`:
  - `InferredStatus = TaskWorkflowStatus.ThisWeek`
- If `DueDate == null`:
  - `InferredStatus = TaskWorkflowStatus.Backlog`

### 2.4 Title Cleaning Algorithm
1. Locate character span `[Index, Index + Length]` for each matched token (Duration, Priority, Date).
2. Remove matched token spans from the original input string.
3. Collapse multiple whitespace sequences into single spaces: `Regex.Replace(text, @"\s+", " ")`.
4. Trim leading/trailing whitespace, hyphens, and commas.
5. If stripped result is empty (e.g. user typed only `"50m tomorrow"`): throw `ArgumentException("Task title cannot be empty.")`.

---

## 3. Persistence Strategy (.NET 8 & System.Text.Json)

### 3.1 Storage Location
- File Path: `%LocalAppData%\HarlanFocus\`
- Resolved via:
  ```csharp
  string appDataDir = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "HarlanFocus");
  string dataPath = Path.Combine(appDataDir, "data.json");
  string settingsPath = Path.Combine(appDataDir, "settings.json");
  ```

### 3.2 Thread-Safe & Atomic File Writes
To protect against file corruption caused by sudden system shutdown, sleep, or application crashes:
1. **Concurrency Lock**: Use `SemaphoreSlim(1, 1)` to serialize async reads and writes across background timer threads and UI actions.
2. **Atomic Write Protocol**:
   - Step 1: Serialize data payload to JSON using `System.Text.Json.JsonSerializerOptions` (`WriteIndented = true`, camelCase or PascalCase).
   - Step 2: Write serialized string to a temporary file in the same directory: `data.json.tmp`.
   - Step 3: If `data.json` exists, write a backup copy to `data.json.bak`.
   - Step 4: Perform atomic swap using `File.Move(tempPath, targetPath, overwrite: true)`. On Windows NTFS, `File.Move` within the same volume is an atomic metadata update.
   - Step 5: Clean up temp file.

### 3.3 Storage Container Schema
```csharp
public class DataStoreContainer
{
    public int Version { get; set; } = 1;
    public DateTime LastSavedAt { get; set; } = DateTime.UtcNow;
    public List<FocusList> Lists { get; set; } = new();
    public List<FocusSession> SessionHistory { get; set; } = new();
}
```

### 3.4 Repository Interface Contract
```csharp
public interface IDataStore
{
    Task<DataStoreContainer> LoadDataAsync();
    Task SaveDataAsync(DataStoreContainer container);
    Task<AppSettings> LoadSettingsAsync();
    Task SaveSettingsAsync(AppSettings settings);
}
```

---

## 4. Single Active Session Manager Specification

### 4.1 Invariant Rules (Requirement R5)
1. **Single Concurrency Rule**: At most **one** Blitz focus session may be in an active running/paused state at any given moment across the entire application.
2. **Conflict Prevention**: If a user attempts to start a Blitz session on Task B while Task A has an active session:
   - The session manager returns a `SessionConflictResult` indicating conflict details (active task title, elapsed time, remaining seconds).
   - The UI displays a prompt dialog asking the user whether to abandon/complete the current session or cancel the switch.
3. **Session Completion Hook**: When a session reaches 00:00 or the user clicks "COMPLETE":
   - The target `TaskItem.Status` is automatically transitioned to `TaskWorkflowStatus.Done`.
   - `TaskItem.CompletedAt` is set to `DateTime.UtcNow`.
   - The session is appended to `SessionHistory`.
   - The active session is cleared (`null`).
   - The Home screen Active Blitz banner disappears.

---

## 5. Comprehensive Unit Testing Plan for `HarlanFocus.Tests`

### 5.1 Project Setup & Dependencies
- **Project Type**: xUnit Test Project (`Microsoft.NET.Sdk`) targeting `net8.0`
- **Dependencies**:
  - `xunit` (2.8+)
  - `xunit.runner.visualstudio`
  - `Microsoft.NET.Test.Sdk`
  - Project reference to `HarlanFocus.Core`

### 5.2 Test Suites Breakdown

#### Suite 1: `NaturalLanguageParserTests`
| Test Method | Input | Expected Output / Assertion |
|-------------|-------|-----------------------------|
| `Parse_StandardInput_ExtractsAllFields` | `"Study Math 50m tomorrow !high"` | Title: `"Study Math"`, Duration: `50`, DueDate: `Tomorrow`, Priority: `High`, Status: `ThisWeek` |
| `Parse_DurationInHours_ConvertsToMinutes` | `"Deep Work 2h today"` | Title: `"Deep Work"`, Duration: `120`, DueDate: `Today`, Status: `Today` |
| `Parse_DurationHoursAndMinutes_SumsCorrectly` | `"Code Review 1h30m"` | Title: `"Code Review"`, Duration: `90`, DueDate: `null`, Status: `Backlog` |
| `Parse_DecimalHours_ConvertsAccurately` | `"Research 1.5h tomorrow"` | Title: `"Research"`, Duration: `90`, DueDate: `Tomorrow` |
| `Parse_TitleWithNumbers_PreservesTitleDigits` | `"Chapter 1 reading 45min"` | Title: `"Chapter 1 reading"`, Duration: `45` |
| `Parse_LeadingTokens_ExtractsRegardlessOfPosition` | `"45m tomorrow Prepare Pitch !high"` | Title: `"Prepare Pitch"`, Duration: `45`, Priority: `High` |
| `Parse_RelativeDayOfWeek_NextFriday` | `"Submit taxes next friday"` | DueDate: matches upcoming Friday + 7 days |
| `Parse_RelativeDayOfWeek_ThisWednesday` | `"Sync meeting this wednesday"` | DueDate: matches next occurring Wednesday |
| `Parse_PriorityVariants_P1P2P3` | `"Fix prod bug 30m p1"` | Title: `"Fix prod bug"`, Duration: `30`, Priority: `High` |
| `Parse_NoDuration_DefaultsTo25Minutes` | `"Plan marketing campaign today"` | Duration: `25`, Title: `"Plan marketing campaign"` |
| `Parse_NoDate_DefaultsToNullAndBacklog` | `"Clean desk 15m"` | DueDate: `null`, Status: `Backlog` |
| `Parse_UnicodeAndVietnamese_PreservesEncoding` | `"Ôn tập giải tích 45m ngày mai !high"` | Title contains `"Ôn tập giải tích"`, Duration: `45`, Priority: `High` |
| `Parse_EmptyOrWhitespace_ThrowsArgumentException` | `""` or `"   "` | Throws `ArgumentException` |
| `Parse_OnlyTokensNoTitle_ThrowsArgumentException` | `"50m tomorrow !high"` | Throws `ArgumentException` ("Task title cannot be empty") |

#### Suite 2: `TaskWorkflowStateMachineTests`
| Test Method | Scenario | Expected Behavior |
|-------------|----------|-------------------|
| `Transition_BacklogToThisWeek_UpdatesStatus` | Task in Backlog moved to ThisWeek | `Status == ThisWeek`, `CompletedAt == null` |
| `Transition_ThisWeekToToday_UpdatesStatus` | Task in ThisWeek moved to Today | `Status == Today`, `CompletedAt == null` |
| `Transition_TodayToDone_SetsCompletedAtTimestamp` | Task in Today marked Done | `Status == Done`, `CompletedAt` is within past 5 seconds of `DateTime.UtcNow` |
| `Transition_DoneToToday_ClearsCompletedAtTimestamp` | Reopening a completed task | `Status == Today`, `CompletedAt == null` |
| `List_ProgressRatio_CalculatesAccurately` | List with 4 tasks: 1 Done, 3 pending | `PendingTasksCount == 3`, `CompletedTasksCount == 1`, `ProgressRatio == 0.25` |
| `List_ProgressRatio_EmptyList_ReturnsZero` | List with 0 tasks | `ProgressRatio == 0.0`, no divide-by-zero |
| `List_TotalEstimatedMinutes_ExcludesDoneTasks` | Tasks: 30m (Done), 45m (Today), 25m (Backlog) | `TotalEstimatedMinutes == 70` |

#### Suite 3: `FocusTimerServiceTests`
| Test Method | Scenario | Expected Behavior |
|-------------|----------|-------------------|
| `Initialize_SetsDurationAndRemainingSeconds` | Created with 25 minutes | `DurationMinutes == 25`, `RemainingSeconds == 1500` |
| `Start_TransitionsStateToRunning` | Calling `Start()` | `IsRunning == true`, `IsPaused == false` |
| `Tick_DecrementsRemainingSeconds` | Simulating 1 second tick | `RemainingSeconds == 1499`, `ElapsedSeconds == 1` |
| `Pause_StopsTickDecrements` | Calling `Pause()`, then ticking | `IsPaused == true`, `RemainingSeconds` unchanged |
| `Resume_ContinuesTickDecrements` | Calling `Resume()`, then ticking | `IsPaused == false`, `RemainingSeconds` resumes decrementing |
| `Restart_ResetsCountdownToInitialDuration` | Calling `Restart()` after 300s elapsed | `RemainingSeconds == 1500`, `ElapsedSeconds == 0` |
| `ZeroCrossing_ClampsToZeroAndFiresCompletion` | Countdown reaches 0 | `RemainingSeconds == 0`, `IsCompleted == true`, `TimerCompleted` event fired |

#### Suite 4: `SingleActiveSessionManagerTests`
| Test Method | Scenario | Expected Behavior |
|-------------|----------|-------------------|
| `StartSession_WhenIdle_Succeeds` | No active session, start Task 1 | Returns success, `HasActiveSession == true`, `ActiveTaskId == Task1.Id` |
| `StartSession_WhenAlreadyActive_ReturnsConflict` | Session active on Task 1, start Task 2 | Returns `SessionConflictResult` with Task 1 metadata |
| `CompleteSession_MarksTaskDoneAndClearsActive` | Complete active Task 1 session | `HasActiveSession == false`, Task 1 status is `Done`, `CompletedAt` is set |
| `CancelSession_ClearsActiveWithoutMarkingDone` | User aborts session on Task 1 | `HasActiveSession == false`, Task 1 status remains unchanged (`Today`) |

#### Suite 5: `JsonDataStoreTests`
| Test Method | Scenario | Expected Behavior |
|-------------|----------|-------------------|
| `SaveAndLoad_RoundTrip_PreservesAllData` | Save lists with tasks, reload | Deserialized objects match all original IDs, strings, dates, and enums |
| `Save_AtomicWrite_NeverCorruptsOriginalOnFailure` | Inject failure during write | Original `data.json` remains untouched and readable |
| `Load_WhenFileMissing_CreatesDefaultStore` | Target path does not exist | Returns new `DataStoreContainer` with empty lists, no exception thrown |
| `Load_WhenFileCorrupted_RecoversFromBackup` | Target file invalid JSON, backup exists | Successfully loads data from `.bak` |

---

## 6. Build & Test Commands Specification

To verify requirement R1 and automated build & unit tests:
```powershell
# Set PATH to point to .NET 8.0.425 SDK
$env:PATH = "C:\Users\hoang\.dotnet;$env:PATH"

# Build solution cleanly
dotnet build "d:\harlan-focus\HarlanFocus.sln" -c Debug

# Execute unit tests with full test output
dotnet test "d:\harlan-focus\tests\HarlanFocus.Tests\HarlanFocus.Tests.csproj" --logger "console;verbosity=normal"
```
