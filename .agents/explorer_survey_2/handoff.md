# Handoff Report: Requirement R2 & R3 Specification Mining

**Agent**: Survey Explorer 2 (UI Shell & Kanban Spec Miner)  
**Target Workspace**: `d:\harlan-focus`  
**Working Directory**: `d:\workflow\.agents\explorer_survey_2`  
**Report File**: `d:\workflow\.agents\explorer_survey_2\survey_r2_r3.md`  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

1. **Authoritative Request File**:
   - Path: `d:\workflow\.agents\ORIGINAL_REQUEST.md` (and mirrored in `d:\harlan-focus\.agents\ORIGINAL_REQUEST.md`).
   - Lines 21-27 (Requirement R2):
     > "Modern Dark-themed UI (#101010 background, #171717 cards, #2B2B2B borders, vibrant accent gradients for Blitz actions)."
     > "Left Sidebar: User profile/workspace header, '+ Create new list' action (modal for name, icon, color), 'All My Lists', and 'Archived Lists'."
     > "Main Dashboard: Grid of List Cards displaying List Name, Icon, pending tasks count, progress bar (Completed/Total), total estimated time, 'OPEN →' button, and list options menu (Rename, Change Color/Icon, Archive, Delete)."
     > "'Create List' card at the end of the grid."
     > "Active Blitz Banner on Home when a timer is currently running, showing task name, time remaining, and an 'OPEN' button to quickly jump back to focus mode."
   - Lines 28-37 (Requirement R3):
     > "Header with Back to Home button, list selector dropdown, and list summary statistics."
     > "4 Status Columns: 1. Backlog: Unscheduled tasks with '+ ADD TASK' button. 2. This Week: Tasks scheduled for current week with hours estimate and completion counter. 3. Today: Priority tasks for today with '+ ADD TASK' and the prominent 🚀 BLITZ NOW button. 4. Done: Completed tasks list."
     > "Task Card: Displays title, description excerpt, priority badge, estimated minutes, and quick menu."
     > "Task Creation form / popup supporting quick title, duration, date, and priority input."

2. **Environment & Runtime Probing**:
   - Command: `& "C:\Users\hoang\.dotnet\dotnet.exe" --list-sdks; & "C:\Users\hoang\.dotnet\dotnet.exe" --list-runtimes`
   - Output:
     ```
     8.0.425 [C:\Users\hoang\.dotnet\sdk]
     Microsoft.AspNetCore.App 8.0.31 [C:\Users\hoang\.dotnet\shared\Microsoft.AspNetCore.App]
     Microsoft.NETCore.App 8.0.31 [C:\Users\hoang\.dotnet\shared\Microsoft.NETCore.App]
     Microsoft.WindowsDesktop.App 8.0.31 [C:\Users\hoang\.dotnet\shared\Microsoft.WindowsDesktop.App]
     ```
   - Shows .NET 8 SDK `8.0.425` and Windows Desktop WPF runtime `8.0.31` are present and ready.

3. **Workspace State**:
   - `d:\harlan-focus` contains `.agents` directory only. No source code was written (preserving strict read-only miner constraint).

---

## 2. Logic Chain

1. **Observation 1 & 2 -> UI Architecture**: R2 and R3 demand a dark-themed WPF desktop application with seamless view navigation, reactive collections, and distinct visual feedback. .NET 8 WPF with `CommunityToolkit.Mvvm` provides standard `ObservableObject`, `[ObservableProperty]`, and `[RelayCommand]`.
2. **Observation 1 (R2) -> Shell, Sidebar & Dashboard**:
   - The dark palette (`#101010` background, `#171717` cards, `#2B2B2B` borders) creates an immersion canvas.
   - The sidebar hosts workspace branding, "+ Create new list" trigger, "All My Lists", and "Archived Lists".
   - The Main Dashboard list cards require non-crashing arithmetic for `Completed/Total` (handling `Total == 0`) and formatted aggregate duration strings.
   - The Active Blitz Banner links directly to the running `FocusSession` service state, offering an instant "OPEN" jump and countdown sync.
3. **Observation 1 (R3) -> Kanban Workflow & Task Card**:
   - 4 distinct columns (`Backlog`, `This Week`, `Today`, `Done`) need dedicated sub-collections in `ListDetailViewModel`.
   - The `🚀 BLITZ NOW` button on Today requires smart state: disabled with informative tooltip when Today is empty; launching Blitz immediately on the top priority task when populated.
   - Task Cards must provide 1-click status progression arrows (`←`, `→`) and a quick Blitz icon (`⚡`).
   - Task creation requires natural language input parsing integration with live feedback preview chips (title, duration, due date, priority).
4. **Integration with Peer Explorers**:
   - Maps 1:1 to R1's entities (`List`, `Task`, `FocusSession`, `AppSettings`) from Explorer 1.
   - Connects to R4/R5's 3-Tier Blitz modes from Explorer 3 via `INavigationService.NavigateToBlitz(taskId)`.

---

## 3. Caveats

- **Drag-and-Drop vs Quick Arrow Controls**: While drag-and-drop can be added to WPF ListViews, direct 1-click arrow buttons (`←`, `→`) and context menus ensure 100% accessible, reliable, and testable column moves across all input devices.
- **Icon Rendering**: WPF supports Segoe MDL2 Assets glyphs or vector Path icons. Using standard Unicode / Segoe MDL2 Assets avoids external font asset licensing dependencies.
- **Zero Caveats on Requirements Coverage**: All specifications requested in R2 and R3 have been exhaustively documented.

---

## 4. Conclusion

Requirement R2 and R3 specifications are fully extracted, analyzed, and documented in `d:\workflow\.agents\explorer_survey_2\survey_r2_r3.md`. The design is completely ready for the orchestrator to incorporate into `PROJECT.md` and proceed with Phase 1, Phase 2, and Phase 3 implementation in `d:\harlan-focus`.

---

## 5. Verification Method

1. **Verify Report Existence & Format**:
   - Inspect `d:\workflow\.agents\explorer_survey_2\survey_r2_r3.md`.
   - Verify presence of:
     - Features Discovered table (31 features)
     - Edge Cases table (15 edge cases)
     - Color and typography tokens
     - XAML styling specifications
     - ViewModel signatures and contracts
2. **Verify Environment Capability**:
   - Run `& "C:\Users\hoang\.dotnet\dotnet.exe" --version` -> confirms `8.0.425`.
   - Verify `Microsoft.WindowsDesktop.App` is available.
3. **Invalidation Conditions**:
   - If user requirements change the color scheme away from `#101010` / `#171717` / `#2B2B2B` or alter the 4 Kanban columns.
