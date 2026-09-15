# Handoff Report: R1 Core Data Models & Local Persistence and Automated Build & Unit Tests

## 1. Observation
1. **Target Environment & .NET SDK**:
   - Running `dotnet --version` with default path resulted in exit code 1:
     ```
     The command could not be loaded, possibly because:
       * You intended to execute a .NET SDK command:
           No .NET SDKs were found.
     ```
   - Running `& "C:\Users\hoang\.dotnet\dotnet.exe" --info` returned:
     ```
     .NET SDK:
      Version:           8.0.425
      Base Path:         C:\Users\hoang\.dotnet\sdk\8.0.425\
     .NET runtimes installed:
       Microsoft.WindowsDesktop.App 8.0.31 [C:\Users\hoang\.dotnet\shared\Microsoft.WindowsDesktop.App]
     ```
   - Running `$env:PATH = "C:\Users\hoang\.dotnet;$env:PATH"; dotnet --version` exited with code 0 and output `8.0.425`.
   - Running `dotnet new list` confirmed availability of `wpf` (WPF Application) and `xunit` (xUnit Test Project) templates.
   - Probing `Invoke-WebRequest -Uri "https://api.nuget.org/v3/index.json" -UseBasicParsing` returned HTTP `StatusCode: 200`.

2. **Original Specification (`d:\workflow\.agents\ORIGINAL_REQUEST.md`)**:
   - Lines 12–20: Detailed requirement R1 for `List`, `Task`, `FocusSession`, `AppSettings`, Natural Language Parser ("Study Math 50m tomorrow"), and unit test project `HarlanFocus.Tests`.
   - Lines 62–69: Acceptance criteria for Automated Build & Unit Tests (`dotnet build` compiles cleanly, `dotnet test` executes 100% passing tests for natural language parsing, state transitions, countdown logic, single active session conflict check).

3. **Regex & Token Extraction Probing**:
   - Tested parsing with PowerShell regex on sample inputs:
     - `"Study Math 50m tomorrow !high"` yielded Duration: `50m`, Priority: `!high`, Date: `tomorrow`, Title: `"Study Math"`.
     - `"Chapter 1 reading 45min"` preserved `"Chapter 1 reading"` without falsely extracting `"1"` as 1 hour.
     - Mixed durations like `"Write report 2h30m"` cleanly extracted `2h30m` (`150` minutes).

## 2. Logic Chain
1. *From Observation 1*, the default PATH lacks the .NET SDK path; therefore, all subsequent build and test orchestration commands must prepend `C:\Users\hoang\.dotnet` to `$env:PATH` to invoke the .NET 8.0.425 SDK and compile WPF applications targeting `Microsoft.WindowsDesktop.App`.
2. *From Observation 2*, C# has built-in classes `System.Threading.Tasks.Task` and `System.Threading.Tasks.TaskStatus`. Using those names for domain models creates namespace collisions and compiler ambiguity across async/await and LINQ. Therefore, the models must be disambiguated as `TaskItem` (or `FocusTask`) and `TaskWorkflowStatus`.
3. *From Observation 2 & 3*, the natural language parser must parse composite duration formats (`Xh Ym`, `Xh`, `Xm`, `X.Yh`), map relative dates (`today`, `tomorrow`, `this/next [day]`), detect priority tags (`!high`, `!med`, `!low`, `p1`, `p2`), infer workflow status (`Today` for today, `ThisWeek` for upcoming days, `Backlog` for unscheduled), and preserve arbitrary text including digits in titles.
4. *From Observation 2*, local persistence must support crash resilience and concurrency safety. Standard single-file writing poses risk of data truncation on power loss; thus, an atomic write strategy using a temporary file (`.tmp`), optional backup (`.bak`), and atomic `File.Move(..., overwrite: true)` protected by `SemaphoreSlim(1, 1)` provides robust, zero-dependency persistence under `%LocalAppData%\HarlanFocus\`.
5. *From Observation 2*, acceptance criteria require 100% automated test coverage in `HarlanFocus.Tests` for parser cases, 4-status state transitions, countdown timer logic, and single active session concurrency prevention.

## 3. Caveats
- While `ORIGINAL_REQUEST.md` mentions "JSON/SQLite local storage", JSON file storage with `System.Text.Json` is recommended as the primary storage engine because it requires zero native SQLite interop binaries, eliminates schema migration overhead, allows instant inspection, and handles desktop workloads effortlessly. The `IDataStore` interface design allows a SQLite provider to be swapped in without modifying domain or UI logic.
- Natural language parsing relies on English and common calendar tokens; additional multi-lingual token dictionaries can be layered on if needed.

## 4. Conclusion
- The complete specification for Requirement R1 and Automated Build & Unit Tests has been documented and verified in `d:\workflow\.agents\explorer_survey_1\survey_r1.md`.
- All model contracts (`FocusList`, `TaskItem`, `FocusSession`, `AppSettings`), enums (`TaskPriority`, `TaskWorkflowStatus`, `BlitzTier`), parser regexes, atomic persistence contracts, and 5 distinct xUnit test suites (with over 30 test scenarios) are fully specified.
- The build environment is ready for implementation via .NET 8.0 SDK.

## 5. Verification Method
1. **Report Verification**: Inspect `d:\workflow\.agents\explorer_survey_1\survey_r1.md` to review the full interface specifications, regex patterns, and test suites.
2. **Environment Verification Command**:
   ```powershell
   $env:PATH = "C:\Users\hoang\.dotnet;$env:PATH"
   dotnet --version
   ```
   *Expected Output*: `8.0.425`
3. **Build & Test Verification (Once implemented by Builder)**:
   ```powershell
   $env:PATH = "C:\Users\hoang\.dotnet;$env:PATH"
   dotnet build "d:\harlan-focus\HarlanFocus.sln"
   dotnet test "d:\harlan-focus\tests\HarlanFocus.Tests\HarlanFocus.Tests.csproj" --logger "console;verbosity=normal"
   ```
   *Invalidation Condition*: Any compiler collision with `System.Threading.Tasks.Task`, regex failure on edge cases (e.g. digits in titles), or failing tests in `HarlanFocus.Tests`.
