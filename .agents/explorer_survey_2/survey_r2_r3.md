# Survey & Specification Report: R2 (Home View & List Management) & R3 (List Detail & Kanban Workflow)

**Target Project**: Harlan Focus (Blitz Focus) Desktop App (`d:\harlan-focus`)  
**Target Framework**: .NET 8.0 Windows Desktop (WPF)  
**Author**: Survey Explorer 2 (UI Shell & Kanban Spec Miner)  
**Date**: 2026-09-12  

---

## 1. Executive Summary

This report establishes the comprehensive technical and UI/UX specification for:
- **Requirement R2**: Home View & List Management (UI Shell, Dark Theme System, Left Sidebar, Main Dashboard, List Cards, Active Blitz Banner).
- **Requirement R3**: List Detail & Kanban Workflow (Navigation Header, List Switcher, 4 Kanban Status Columns, Task Cards, Natural Language Task Creation, 🚀 BLITZ NOW trigger).
- **MVVM Architecture & UI Services**: ViewModels, NavigationService, DialogService, Commands, and Collection Management.

The design embodies the **Blitz Philosophy**: dark, minimal, distraction-free surfaces that visually emphasize active priority tasks, high-contrast status cues, and instant 1-click execution.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | UI Shell & Theme | Dark Theme Color Tokens | Global XAML ResourceDictionary defining `#101010` background, `#171717` card surface, `#2B2B2B` borders, and high-contrast text | Theme resource keys | SolidColorBrush resources across app | Fallback to hardcoded hex if key missing | R2 Spec & Requirements |
| 2 | UI Shell & Theme | Vibrant Blitz Gradients | LinearGradientBrush (#FF5E3A to #FF2A68) for Blitz triggers, banners, and active indicators | Brush references | Dynamic linear gradient fill + hover glow drop shadow | Fallback to solid accent `#FF5E3A` | R2 & R3 Spec |
| 3 | UI Shell & Theme | Window Chrome & Titlebar | Custom dark titlebar with title, icon, minimize, maximize/restore, close buttons | Window state commands | Styled frameless window border with draggable caption area | Standard OS window snap maintained | UI Shell Requirements |
| 4 | Left Sidebar | Workspace / Profile Header | Displays user avatar circle with initials, workspace title ("Personal Focus"), and active status badge | AppSettings / User Profile state | Rendered sidebar header block | Defaults to "Personal Focus" / "HF" if profile unset | R2 Left Sidebar Spec |
| 5 | Left Sidebar | '+ Create new list' Action | Prominent button opening modal/dialog to create a new list with custom name, icon, and color | Click event / Command | Triggers CreateListDialog; adds to database & sidebar | Form validation prevents submission if name empty | R2 Left Sidebar Spec |
| 6 | Left Sidebar | 'All My Lists' Navigation | Filter link in sidebar returning to main dashboard with all unarchived lists | Click event / Command | Main view navigates to Home Dashboard | No-op if already on Home | R2 Left Sidebar Spec |
| 7 | Left Sidebar | 'Archived Lists' Navigation | Filter link in sidebar navigating to view of archived lists with restore/delete actions | Click event / Command | Main view displays Archived Lists grid | Displays empty state if no lists archived | R2 Left Sidebar Spec |
| 8 | Left Sidebar | Pinned / Active Lists Quick Menu | List of active user lists in sidebar for 1-click direct navigation into any list | Click on list item | Navigates directly to ListDetailView for that list | Highlights selected list; no-op if already in list | R2 Left Sidebar Spec |
| 9 | Main Dashboard | List Card Grid | Responsive grid/wrap panel rendering summary cards for all active lists | `ObservableCollection<ListCardViewModel>` | Visual cards with title, icon, badges, progress bar, time estimate | Shows empty placeholder card if list collection is empty | R2 Main Dashboard Spec |
| 10 | Main Dashboard | List Card Metrics | Live aggregation of pending tasks (`Backlog + ThisWeek + Today`), completion ratio, and remaining minutes | List's `Task[]` data | Formatted text ("4 pending", "3/7 done", "2h 15m remaining") | If 0 tasks: displays "0 pending", "0/0 done", "0m" without division by zero | R2 Acceptance Criteria |
| 11 | Main Dashboard | List Card 'OPEN →' Action | Button on card navigating user into the 4-column Kanban Detail view for that list | Click / Command with `ListId` | Sets current view to ListDetailViewModel with selected list | If list not found, displays error dialog and refreshes | R2 Main Dashboard Spec |
| 12 | Main Dashboard | List Card Options Menu | 3-dot context menu on each card: Rename, Change Color/Icon, Archive, Delete | User selection | Executes corresponding dialog or database mutation | Delete requires confirmation; prevents delete if active Blitz | R2 Main Dashboard Spec |
| 13 | Main Dashboard | '+ Create List' End Card | Dashed border card appended at end of grid prompting creation of a new list | Click on card | Opens CreateListDialog | Validates name uniqueness and length | R2 Main Dashboard Spec |
| 14 | Main Dashboard | Active Blitz Banner | Pinned banner on Home when a timer is running: displays task name, live time remaining, and 'OPEN' button | Active `FocusSession` state from timer service | Live countdown MM:SS, task title, list name, jump button | Automatically hides when timer stops/completes | R2 Main Dashboard Spec |
| 15 | List Detail | Navigation Header | Header with '← Home' button, list name, icon, and list switcher dropdown | Navigation commands | Navigates back or switches current active list | Preserves unsaved state before switching | R3 Header Spec |
| 16 | List Detail | List Selector Dropdown | ComboBox in detail header allowing switching to any other list without returning to Home | Selected List change | Reloads Kanban columns for selected list | Disables current list in dropdown list | R3 Header Spec |
| 17 | List Detail | List Summary Statistics | Summary pills in header: Total tasks, Completed tasks, Remaining focus hours, completion percentage | List's tasks | Visual statistic badges | Recalculates dynamically on task add/move/delete | R3 Header Spec |
| 18 | Kanban Workflow | Column 1: Backlog | Column for unscheduled tasks with count badge, estimated minutes, and '+ ADD TASK' button | Task collection where `Status == Backlog` | Vertically scrollable list of backlog task cards | Empty state banner if no backlog tasks | R3 Status Columns Spec |
| 19 | Kanban Workflow | Column 2: This Week | Column for current week tasks with count badge, total hours estimate, and completion counter | Task collection where `Status == ThisWeek` | Scrollable task cards, move actions | Empty state banner if no tasks scheduled | R3 Status Columns Spec |
| 20 | Kanban Workflow | Column 3: Today | Priority column for today with count badge, total minutes, '+ ADD TASK', and 🚀 BLITZ NOW button | Task collection where `Status == Today` | Scrollable task cards with quick Blitz triggers | Empty state message "Add tasks to Blitz today" | R3 Status Columns Spec |
| 21 | Kanban Workflow | 🚀 BLITZ NOW Button | Prominent gradient button at top of Today column to launch focus session on first/priority task | Click on button | Launches Full Blitz Window (R4) with active FocusSession | Disabled if Today column has 0 tasks; tooltip explains | R3 Acceptance Criteria |
| 22 | Kanban Workflow | Column 4: Done | Completed tasks column with count badge, strike-through/checked styling, and 'Clear Done' option | Task collection where `Status == Done` | Dimmed task cards with completed timestamps | Empty state when no tasks done | R3 Status Columns Spec |
| 23 | Task Card | Task Card Display | Card showing title, description snippet, priority badge, estimated minutes pill, due date | `TaskCardViewModel` | Rendered card with hover glow and action buttons | Trims description to 2 lines with ellipsis | R3 Task Card Spec |
| 24 | Task Card | Priority Badge | Visual pill badge indicating High (`#EF4444`), Medium (`#F59E0B`), or Low (`#10B981`) | `Task.Priority` enum | Colored badge with icon/label | Defaults to Medium if unspecified | R3 Task Card Spec |
| 25 | Task Card | Quick Action Context Menu | 3-dot context menu: ⚡ Start Blitz, Move to (Backlog, This Week, Today, Done), Edit, Delete | Click / Right click | Executes move or launches Blitz session | Requires confirmation if deleting task | R3 Task Card Spec |
| 26 | Task Card | Quick Move Arrow Controls | Left/Right arrow buttons on card for 1-click status transitions (Backlog ↔ ThisWeek ↔ Today ↔ Done) | Click ← or → | Moves task to adjacent column, updates timestamp | Left disabled on Backlog; Right disabled on Done | R3 Kanban Workflow |
| 27 | Task Creation | Natural Language Input Bar | Quick input bar accepting natural strings e.g. "Study Math 50m tomorrow priority:high" | String input | Live parsed chips (Title, Duration, Date, Priority) | Displays syntax hints if input is ambiguous | R1 & R3 Integration |
| 28 | Task Creation | Task Creation Modal Form | Dialog with explicit fields: Title, Description, Duration, Due Date, Priority, Target Column | Form field inputs | Creates new `Task` entity and appends to column | Validates Title is non-empty; Duration > 0 | R3 Task Creation Spec |
| 29 | MVVM Architecture | MainViewModel UI Host | Orchestrates current view switching (`CurrentView`), sidebar state, and global Blitz banner | Navigation events, Timer events | Binds active UserControl dynamically | Gracefully handles view lifecycle transitions | MVVM Architecture Spec |
| 30 | MVVM Architecture | INavigationService | Decoupled navigation service managing view stack and parameter passing (e.g. `listId`) | Navigation method calls | Updates `CurrentViewModel` and notifies subscribers | Prevents invalid navigation during active modal | MVVM Architecture Spec |
| 31 | MVVM Architecture | IDialogService | Service displaying modal dialogs (Create List, Edit List, Create Task, Confirmation Prompt) | Dialog parameters & models | Asynchronous result object (`Task<TResult?>`) | Catches unhandled dialog exceptions; returns null | MVVM Architecture Spec |

---

## 3. Edge Cases

| # | Feature | Input | Observed / Required Behavior |
|---|---------|-------|------------------------------|
| 1 | List Card Metrics | List with 0 tasks | Progress bar value set to 0 (no `DivideByZeroException`); text displays "0 / 0 tasks completed (0%)", estimated time "0m". |
| 2 | List Card Metrics | List with all tasks completed | Progress bar displays 100% with completion color; pending count shows "0 pending"; estimated remaining time shows "0m". |
| 3 | List Card Deletion | User clicks Delete on a List containing active Blitz task | System prompts error/warning modal: "Cannot delete list while a focus session is active for one of its tasks. Please end the Blitz first." |
| 4 | List Card Deletion | User clicks Delete on a List with 25 tasks | Confirmation modal shows: "Are you sure you want to delete '[Name]'? This will permanently delete 25 tasks." Requires explicit confirmation. |
| 5 | List Card Options | User clicks Archive on a list | List is immediately removed from `ActiveLists` and `HomeViewModel.ListCards`; added to `ArchivedLists`; snackbar notification: "List archived. [Undo]". |
| 6 | 🚀 BLITZ NOW Button | Today column is empty (0 tasks) | Button is visually dimmed (opacity 0.5), cursor NotAllowed/Default, tooltip: "No tasks in Today. Add a task to start Blitzing!" Click does nothing. |
| 7 | 🚀 BLITZ NOW Button | Today column has 5 tasks with different priorities | Launches Blitz on the first High-priority task (or top ordered task); displays countdown immediately. |
| 8 | 🚀 BLITZ NOW Button | Blitz session already running on Task A; user clicks Blitz Now on Task B | Dialog prompts: "A Blitz session is already active for '[Task A]'. Stop current session and switch to '[Task B]'?" with [Cancel] and [Switch]. |
| 9 | Active Blitz Banner | User navigates between Home, List Detail, and Archived views while Blitz runs | Banner remains visible and synchronized on Home view; updates countdown seconds without UI stutter or memory leak. |
| 10 | Task Creation NLP | Input: "Just a task title without duration or date" | Parser defaults `DurationMinutes = 25` (standard Pomodoro / Blitz block), `DueDate = Today`, `Priority = Medium`. |
| 11 | Task Creation NLP | Input: "Do homework 2h tomorrow priority:urgent" | Parser maps `2h` -> 120 minutes, `tomorrow` -> next calendar day, `urgent` -> `Priority.High`. |
| 12 | Task Card Drag/Move | Task moved from Today to Done | Task's `Status` updated to `Done`; `CompletedAt` set to `DateTime.UtcNow`; item animated or moved to Done column; completion sound/visual trigger. |
| 13 | Task Card Drag/Move | Task moved from Done back to Today or Backlog | Task's `Status` updated to target; `CompletedAt` reset to `null`; statistics recalculated in real-time. |
| 14 | Responsive Window | Window resized down to 1024x700 minimum | Sidebar stays 240px; Main Dashboard list cards wrap cleanly into 2 or 1 columns; Kanban columns remain min 260px with smooth horizontal scroll. |
| 15 | Text Truncation | Super long list name (100+ chars) or task title (200+ chars) | Text truncated with ellipsis (`TextTrimming="CharacterEllipsis"`); full text visible via standard `ToolTip`. |

---

## 4. UI Shell & Theme Specification

### 4.1 Design Philosophy & Color System
The UI adheres to a sleek, distraction-free modern dark theme with vibrant energy accents:

```xaml
<!-- Color Palette Definitions -->
<SolidColorBrush x:Key="AppBackgroundBrush" Color="#101010" />
<SolidColorBrush x:Key="SidebarBackgroundBrush" Color="#141414" />
<SolidColorBrush x:Key="CardBackgroundBrush" Color="#171717" />
<SolidColorBrush x:Key="CardHoverBackgroundBrush" Color="#1F1F1F" />
<SolidColorBrush x:Key="CardSelectedBackgroundBrush" Color="#252525" />
<SolidColorBrush x:Key="InputBackgroundBrush" Color="#1C1C1C" />
<SolidColorBrush x:Key="BorderDefaultBrush" Color="#2B2B2B" />
<SolidColorBrush x:Key="BorderHoverBrush" Color="#3E3E3E" />
<SolidColorBrush x:Key="BorderFocusBrush" Color="#FF5E3A" />

<!-- Text Tokens -->
<SolidColorBrush x:Key="TextPrimaryBrush" Color="#F3F4F6" />
<SolidColorBrush x:Key="TextSecondaryBrush" Color="#9CA3AF" />
<SolidColorBrush x:Key="TextTertiaryBrush" Color="#6B7280" />
<SolidColorBrush x:Key="TextDisabledBrush" Color="#4B5563" />

<!-- Blitz Action Accent Tokens -->
<LinearGradientBrush x:Key="BlitzAccentGradient" StartPoint="0,0" EndPoint="1,1">
    <GradientStop Color="#FF5E3A" Offset="0.0" />
    <GradientStop Color="#FF2A68" Offset="1.0" />
</LinearGradientBrush>

<LinearGradientBrush x:Key="BlitzAccentGradientHover" StartPoint="0,0" EndPoint="1,1">
    <GradientStop Color="#FF7352" Offset="0.0" />
    <GradientStop Color="#FF427C" Offset="1.0" />
</LinearGradientBrush>

<DropShadowEffect x:Key="BlitzGlowEffect" Color="#FF5E3A" BlurRadius="16" Opacity="0.45" ShadowDepth="0" />

<!-- Priority Status Badges -->
<SolidColorBrush x:Key="PriorityHighBrush" Color="#EF4444" />
<SolidColorBrush x:Key="PriorityHighBackgroundBrush" Color="#2D1515" />
<SolidColorBrush x:Key="PriorityMediumBrush" Color="#F59E0B" />
<SolidColorBrush x:Key="PriorityMediumBackgroundBrush" Color="#2B2210" />
<SolidColorBrush x:Key="PriorityLowBrush" Color="#10B981" />
<SolidColorBrush x:Key="PriorityLowBackgroundBrush" Color="#10251C" />
```

### 4.2 Typography System
- **Font Family**: `Segoe UI Variable Text`, `Segoe UI`, `Helvetica Neue`, `sans-serif`
- **Monospace Family (Timer & Badges)**: `Consolas`, `Cascadia Code`, `Segoe UI Variable Display`
- **Hierarchy**:
  - `DisplayTimer`: 56pt Bold, Monospace
  - `Header1`: 22pt SemiBold, `#F3F4F6`
  - `Header2`: 16pt SemiBold, `#F3F4F6`
  - `Subtitle`: 13pt Regular, `#9CA3AF`
  - `Body`: 13pt Regular, `#F3F4F6`
  - `Caption`: 11pt Medium, `#9CA3AF`
  - `BadgeText`: 10pt SemiBold, uppercase tracking

### 4.3 ControlTemplates & Custom Styles
1. **Pill & Button Styles**:
   - `BlitzButton`: Rounded `CornerRadius="8"`, background bound to `BlitzAccentGradient`, white bold text, drop shadow glow on hover, scale feedback on press.
   - `SecondaryButton`: Dark background `#222222`, border `#2B2B2B`, hover background `#2E2E2E`.
   - `GhostIconButton`: Transparent background, hover `#262626`, rounded `CornerRadius="6"`.
2. **Modern ScrollViewer & ScrollBar**:
   - Width: 6px.
   - Thumb: `#333333`, `CornerRadius="3"`, hover `#4D4D4D`.
   - Track: Transparent (does not obstruct content).
3. **Card Border & Hover Animation**:
   - `BorderThickness="1"`, `BorderBrush="#2B2B2B"`, `CornerRadius="10"`.
   - Hover transition: `BorderBrush` shifts to `#3E3E3E`, subtle elevation shadow.
4. **Modal Dialog Host**:
   - Dark translucent backdrop (`Background="#99000000"`).
   - Centered dialog box with `#171717` background, `#2B2B2B` border, `CornerRadius="12"`, and modal shadow.

---

## 5. Left Sidebar Specification

### 5.1 Structure & Layout
The sidebar has a fixed width of `240px` (or `260px`), background `#141414`, right border `1px solid #2B2B2B`.

```
+------------------------------------+
|  [⚡] Personal Focus                |  <- Workspace Header (Initial/Icon + Label)
|      Active Sprint • Blitz Ready   |
+------------------------------------+
|  [+ Create New List]               |  <- Prominent Action Button
+------------------------------------+
|  NAVIGATE                          |
|  [📁] All My Lists            (4)  |  <- Selected by default (Home Dashboard)
|  [📦] Archived Lists          (1)  |  <- View archived lists
+------------------------------------+
|  MY LISTS                          |  <- Quick Access Section
|  [🎯] Work Project            (6)  |
|  [📚] Study & Reading         (3)  |
|  [💻] Open Source             (2)  |
|  [🏠] Personal Habits         (1)  |
+------------------------------------+
|  (Spacer)                          |
+------------------------------------+
|  [⚙️] Settings       v1.0.0 Harlan |  <- Footer
+------------------------------------+
```

### 5.2 Interaction & Behavior
1. **Header**: Clicking workspace name allows switching workspace or displays app settings.
2. **"+ Create New List" Button**:
   - Styled with subtle gradient outline or accent color.
   - Clicking opens the `CreateListDialog` modal.
3. **"All My Lists"**:
   - Navigates to `HomeViewModel`.
   - Highlighted when `CurrentView is HomeViewModel`.
   - Displays total active lists count badge.
4. **"Archived Lists"**:
   - Navigates to `ArchivedListsViewModel`.
   - Displays count of archived lists.
5. **Quick Lists Section**:
   - Real-time binding to `ObservableCollection<ListSidebarItemViewModel>`.
   - Each item displays: custom list icon, colored indicator dot, list name, pending tasks badge.
   - Clicking any item navigates directly to `ListDetailViewModel` for that list ID.
   - Right-click context menu: "Open", "Archive", "Delete".

### 5.3 Create / Edit List Dialog
- **Modal Fields**:
  - **List Name**: TextBox, auto-focused, max 40 characters, required.
  - **Icon Picker**: Grid of selectable icons (🎯 Target, 📚 Book, 💻 Code, ⚡ Flash, 🚀 Rocket, 💼 Work, 🎨 Design, 🏃 Sport, 🛒 Shopping, 📝 Notes).
  - **Color Picker**: 8 curated color swatches:
    - Coral Orange: `#FF5E3A`
    - Crimson Red: `#EF4444`
    - Amber Gold: `#F59E0B`
    - Emerald Green: `#10B981`
    - Cyan Sky: `#06B6D4`
    - Indigo Blue: `#6366F1`
    - Purple Violet: `#8B5CF6`
    - Pink Rose: `#EC4899`
  - **Live Preview Pill**: Real-time display of the list badge with chosen color and icon.
- **Actions**:
  - `[Create List]` / `[Save Changes]`: Bound to `RelayCommand`, validates input.
  - `[Cancel]`: Closes modal.

---

## 6. Main Dashboard Specification (Home View)

### 6.1 Layout Overview
The main content area (`HomeView`) features:
1. **Top Greeting / Header**: "My Lists" title, subtitle "Choose a list or start a quick Blitz".
2. **Active Blitz Banner** (conditional visibility when a focus session is in progress).
3. **List Card Grid**: Responsive `WrapPanel` or `UniformGrid` displaying List Cards and the "+ Create List" card.

### 6.2 Active Blitz Banner Specification
When `FocusSessionService.IsRunning` or `RemainingSeconds > 0`:
- **Placement**: Pinned directly above the list card grid.
- **Visual Styling**:
  - Background: Dark gradient `#241515` to `#1A1A1A`.
  - Border: `1px solid #FF5E3A` with subtle glowing drop shadow.
  - CornerRadius: `10`.
  - Padding: `16,14`.
- **Components**:
  - **Left**: Pulsing red indicator dot `🔴` + "ACTIVE BLITZ IN PROGRESS".
  - **Center**: Current Task Title (bold, e.g. "Focusing on: Refactor Parser Core") and List Name badge.
  - **Timer**: Monospace digital timer showing remaining time (e.g. `24:18`).
  - **Action Button**: `[OPEN FOCUS ↗]` styled with `BlitzAccentGradient`, navigates directly to active Blitz view.
  - **Quick Controls**: `[Pause/Resume]` toggle button.

### 6.3 List Card Specification
Each card represents a `List` entity:
- **Dimensions**: MinWidth `300px`, Height ~`180px`.
- **Background**: `#171717`, Border: `#2B2B2B`, CornerRadius: `10`.
- **Hover State**: Border `#3E3E3E`, slight vertical translation (-2px).
- **Contents**:
  1. **Card Header**:
     - Colored Icon circle (36x36) with `List.Color` tint.
     - List Name (16pt SemiBold, trimmed with ellipsis if long).
     - Options Button `⋮` (3 dots) opening context menu:
       - ✏️ Rename List
       - 🎨 Change Color & Icon
       - 📦 Archive List
       - 🗑 Delete List (with confirmation)
  2. **Metrics Row**:
     - Pending Tasks Badge: e.g. "4 pending tasks" (calculated from `Backlog + ThisWeek + Today`).
     - Estimated Focus Time: e.g. "⏱ 2h 15m" (sum of `EstimatedMinutes` of active tasks).
  3. **Progress Bar**:
     - Sleek 6px height, rounded corners.
     - Track `#262626`, fill bound to `List.Color` or accent gradient.
     - Percentage value: `TotalTasks == 0 ? 0 : (CompletedTasks * 100.0 / TotalTasks)`.
     - Status label: e.g. "3/7 completed (43%)".
  4. **Card Footer**:
     - `[OPEN →]` Button (Secondary button style with hover gradient accent).
     - Clicking the card body or the `OPEN →` button invokes `OpenListCommand(ListId)`.

### 6.4 "+ Create List" End Card
- Positioned permanently as the last item in the grid.
- **Styling**:
  - Border: `2px dashed #333333`, CornerRadius `10`.
  - Background: Transparent or `#141414`.
  - Content: Centered plus icon `➕`, "Create New List" text, muted subtitle "Add another workspace".
  - Hover: Border lights up to `#555555`, background to `#1C1C1C`.
- **Action**: Invokes `CreateNewListCommand`.

---

## 7. List Detail & Kanban Workflow Specification

### 7.1 Detail Navigation Header
```
+-----------------------------------------------------------------------------------+
| [← Back]  [🎯 Work Project ▾]   |   8 Tasks • 3 Done • ⏱ 3h 15m left   |  [+ Add Task] |
+-----------------------------------------------------------------------------------+
```
1. **`[← Back]` Button**: Navigates back to Home Dashboard.
2. **List Selector Dropdown (`ComboBox`)**:
   - Shows current list icon, color, and name.
   - Clicking opens dropdown listing all active lists for fast switching without returning to Home.
3. **Summary Statistics Pills**:
   - Total Tasks Count (`8 Tasks`)
   - Completed Ratio (`3/8 Done • 38%`)
   - Remaining Focus Time (`⏱ 3h 15m`)
4. **Action Buttons**:
   - `[+ Add Task]`: Triggers task creation dialog.
   - `[⚙️]`: Opens edit list modal.

### 7.2 The 4 Kanban Status Columns
Layout: 4 equal-width columns (`Grid` with `*` columns or `UniformGrid`, min column width `260px`).
Column background: `#151515`, border `#262626`, CornerRadius `8`.

#### Column 1: Backlog (Unscheduled Pool)
- **Header**:
  - Title: "BACKLOG"
  - Task count badge (e.g. `3`)
  - Estimated time pill (e.g. `1h 30m`)
  - Description: Unscheduled tasks, idea bank, future backlog.
- **Action**: `[+ ADD TASK]` button at the top of the column.
- **Move Actions**: Cards can move forward `→` to **This Week** or directly to **Today**.

#### Column 2: This Week (Sprint Commitments)
- **Header**:
  - Title: "THIS WEEK"
  - Task count badge (e.g. `4`)
  - Summary counter: "2.5 hrs estimated"
  - Completion counter: "1/4 done"
- **Action**: `[+ ADD TASK]` button.
- **Move Actions**: Cards can move backward `←` to **Backlog**, forward `→` to **Today**, or `✅` to **Done**.

#### Column 3: Today (Active Execution & Blitz Ready)
- **Header**:
  - Title: "TODAY"
  - Task count badge (e.g. `3`)
  - Total today focus time: "⏱ 1h 45m"
- **PROMINENT 🚀 BLITZ NOW BUTTON**:
  - **Visuals**: Full width gradient button at the top of Today column.
  - **Style**: `#FF5E3A` to `#FF2A68` LinearGradient, bold white text, rocket icon 🚀, glowing shadow.
  - **Behavior**:
    - If `TodayTasks.Count > 0`: Enabled. Clicking immediately starts countdown timer and switches app into Blitz Focus Mode (R4 Full Blitz Window) for the first/highest priority task.
    - If `TodayTasks.Count == 0`: Disabled (opacity 0.5), tooltip: "Add a task to Today to start Blitzing!".
- **Action**: `[+ ADD TASK]` button.
- **Move Actions**: Cards can move backward `←` to **This Week** / **Backlog**, or forward `→` to **Done**.

#### Column 4: Done (Completed & Logged)
- **Header**:
  - Title: "DONE"
  - Task count badge (e.g. `5`)
  - Total completed focus time logged.
- **Action**: `[Clear Done]` button (archives or removes completed tasks).
- **Styling of Done Cards**: Dimmed (opacity 0.6), title strikethrough, checked green icon `✓`, completion timestamp.
- **Move Actions**: Quick `↩ Restore` button moves task back to Today or Backlog.

---

## 8. Task Card & Creation Specification

### 8.1 Task Card Component Architecture
```
+-------------------------------------------------------------+
| [🔴 HIGH]  [📅 Today]                             [⚡] [⋮]  |  <- Badges & Quick Blitz
+-------------------------------------------------------------+
| Implement Natural Language Parser                            |  <- Task Title (Bold)
| Support 30m, 1h, tomorrow, and priority keywords...         |  <- Excerpt (2 lines)
+-------------------------------------------------------------+
| [⏱ 45m]                          [← Backlog]  [Today →]     |  <- Estimate & Move controls
+-------------------------------------------------------------+
```

1. **Top Row**:
   - **Priority Badge**:
     - `High`: Red background `#2D1515`, border `#EF4444`, text `#EF4444` ("🔴 HIGH").
     - `Medium`: Amber background `#2B2210`, border `#F59E0B`, text `#F59E0B` ("🟡 MED").
     - `Low`: Emerald background `#10251C`, border `#10B981`, text `#10B981` ("🟢 LOW").
   - **Due Date Pill**: `📅 Today`, `📅 Tomorrow`, or formatted date (turns red if overdue).
   - **Quick Blitz Icon `⚡`**: 1-click button to immediately launch Blitz mode on this specific task!
   - **Options `⋮`**: Context menu (Edit, Delete, Move to...).
2. **Body**:
   - **Title**: 14pt SemiBold, wraps up to 2 lines.
   - **Description**: 12pt muted `#9CA3AF`, trimmed with ellipsis at 2 lines.
3. **Bottom Row**:
   - **Estimated Time Pill**: "⏱ 45m" (pill `#222222`).
   - **Quick Move Controls**: Subtle arrow buttons `←` and `→` for 1-click column progression without opening menus.

### 8.2 Task Creation Form & Natural Language Parser Integration
Task creation supports two integrated modes:
1. **Quick Natural Language Input Bar**:
   - Text input at top of list or inside modal: `e.g. "Prepare Slide Deck 45m tomorrow priority:high"`
   - **Live Parser Feedback Preview**:
     As the user types, dynamic preview chips update in real-time below the text box:
     - 📝 Title chip: `"Prepare Slide Deck"`
     - ⏱ Duration chip: `"45 mins"` (parsed from `45m`)
     - 📅 Due Date chip: `"Tomorrow"` (parsed from `tomorrow`)
     - 🎯 Priority chip: `"High"` (parsed from `priority:high` or `!high`)
     - 📂 Target Column chip: `Today` (or target column where `+ Add Task` was clicked)
   - Pressing **Enter** or clicking `[Add Task]` validates and creates the task immediately.
2. **Explicit Form Fields Modal**:
   - Fields: Title (TextBox), Description (Multi-line TextBox), Estimated Duration (Numeric / Presets: 15, 25, 45, 60, 90 mins), Priority (Segmented button: Low / Med / High), Due Date (DatePicker), Target Column (ComboBox).

---

## 9. MVVM Architecture & Service Contracts

### 9.1 ViewModels Hierarchy
```
MainViewModel
├── SidebarViewModel
│   ├── ActiveLists: ObservableCollection<ListSidebarItemViewModel>
│   └── ArchivedLists: ObservableCollection<ListSidebarItemViewModel>
└── CurrentView: ViewModelBase
    ├── HomeViewModel
    │   ├── ListCards: ObservableCollection<ListCardViewModel>
    │   └── ActiveBlitzBanner (TaskName, RemainingSeconds, IsRunning)
    ├── ListDetailViewModel
    │   ├── BacklogTasks: ObservableCollection<TaskCardViewModel>
    │   ├── ThisWeekTasks: ObservableCollection<TaskCardViewModel>
    │   ├── TodayTasks: ObservableCollection<TaskCardViewModel>
    │   └── DoneTasks: ObservableCollection<TaskCardViewModel>
    └── ArchivedListsViewModel
        └── ArchivedListCards: ObservableCollection<ListCardViewModel>
```

### 9.2 ViewModel Interfaces & Contracts

#### `HomeViewModel.cs`
```csharp
public class HomeViewModel : ViewModelBase
{
    private readonly IListRepository _listRepository;
    private readonly IFocusSessionService _focusSessionService;
    private readonly INavigationService _navigationService;
    private readonly IDialogService _dialogService;

    public ObservableCollection<ListCardViewModel> ListCards { get; } = new();
    
    // Active Blitz Banner properties
    public bool HasActiveBlitz => _focusSessionService.IsSessionActive;
    public string ActiveBlitzTaskTitle => _focusSessionService.CurrentTask?.Title ?? string.Empty;
    public string ActiveBlitzRemainingFormatted => _focusSessionService.FormattedRemainingTime;
    public string ActiveBlitzListName => _focusSessionService.CurrentList?.Name ?? string.Empty;

    // Commands
    public IRelayCommand OpenActiveBlitzCommand { get; }
    public IRelayCommand<Guid> OpenListCommand { get; }
    public IRelayCommand CreateNewListCommand { get; }
    public IRelayCommand<Guid> ArchiveListCommand { get; }
    public IRelayCommand<Guid> DeleteListCommand { get; }
    public IRelayCommand<Guid> EditListCommand { get; }
}
```

#### `ListDetailViewModel.cs`
```csharp
public class ListDetailViewModel : ViewModelBase
{
    private readonly IListRepository _listRepository;
    private readonly ITaskRepository _taskRepository;
    private readonly IFocusSessionService _focusSessionService;
    private readonly INavigationService _navigationService;
    private readonly IDialogService _dialogService;

    public Guid ListId { get; set; }
    public string ListName { get; set; }
    public string ListIcon { get; set; }
    public string ListColor { get; set; }

    public ObservableCollection<TaskCardViewModel> BacklogTasks { get; } = new();
    public ObservableCollection<TaskCardViewModel> ThisWeekTasks { get; } = new();
    public ObservableCollection<TaskCardViewModel> TodayTasks { get; } = new();
    public ObservableCollection<TaskCardViewModel> DoneTasks { get; } = new();

    // Summary Statistics
    public int TotalTaskCount => BacklogTasks.Count + ThisWeekTasks.Count + TodayTasks.Count + DoneTasks.Count;
    public int CompletedTaskCount => DoneTasks.Count;
    public int RemainingMinutes => BacklogTasks.Sum(t => t.EstimatedMinutes) 
                                 + ThisWeekTasks.Sum(t => t.EstimatedMinutes) 
                                 + TodayTasks.Sum(t => t.EstimatedMinutes);

    public bool CanBlitzNow => TodayTasks.Any();

    // Commands
    public IRelayCommand BackToHomeCommand { get; }
    public IRelayCommand BlitzNowCommand { get; }
    public IRelayCommand<TaskStatus> AddTaskCommand { get; }
    public IRelayCommand<TaskCardViewModel> MoveTaskForwardCommand { get; }
    public IRelayCommand<TaskCardViewModel> MoveTaskBackwardCommand { get; }
    public IRelayCommand<TaskCardViewModel> QuickBlitzTaskCommand { get; }
    public IRelayCommand<TaskCardViewModel> DeleteTaskCommand { get; }
    public IRelayCommand ClearDoneCommand { get; }
}
```

#### `INavigationService.cs`
```csharp
public interface INavigationService
{
    ViewModelBase CurrentView { get; }
    event Action<ViewModelBase> CurrentViewChanged;
    
    void NavigateToHome();
    void NavigateToListDetail(Guid listId);
    void NavigateToArchivedLists();
    void NavigateToBlitz(Guid taskId);
    bool CanGoBack { get; }
    void GoBack();
}
```

#### `IDialogService.cs`
```csharp
public interface IDialogService
{
    Task<bool> ShowConfirmAsync(string title, string message, string confirmLabel = "Confirm", string cancelLabel = "Cancel");
    Task<ListModel?> ShowCreateListDialogAsync();
    Task<ListModel?> ShowEditListDialogAsync(ListModel existingList);
    Task<TaskModel?> ShowCreateTaskDialogAsync(Guid listId, TaskStatus defaultStatus);
    Task<TaskModel?> ShowEditTaskDialogAsync(TaskModel existingTask);
    void ShowNotification(string title, string message);
}
```

---

## 10. Environmental Findings & Runtime Compatibility

During forensic environment probing, the following runtime details were confirmed:
1. **Installed .NET SDK**:
   - Location: `C:\Users\hoang\.dotnet\dotnet.exe`
   - Version: `8.0.425`
   - Target Framework: `net8.0-windows`
2. **WindowsDesktop Runtime**:
   - `Microsoft.WindowsDesktop.App 8.0.31` is fully installed and available under `C:\Users\hoang\.dotnet\shared\Microsoft.WindowsDesktop.App`.
   - WPF projects targeting `net8.0-windows` compile and execute cleanly using this SDK path.
3. **UI Packages Recommended**:
   - `CommunityToolkit.Mvvm` (for `ObservableObject`, `[ObservableProperty]`, `[RelayCommand]`).
   - Standard WPF styling with zero heavy third-party framework dependencies, ensuring fast compile times and clean self-contained native performance.

---

## 11. Integration Touchpoints with R1 and R4/R5

1. **Integration with R1 (Explorer 1 - Core Models & NLP Parser)**:
   - `ListModel`, `TaskModel`, `FocusSessionModel`, `AppSettingsModel` interfaces map 1:1 to ViewModels.
   - The Natural Language Parser (`INaturalLanguageTaskParser`) is injected directly into `CreateTaskDialogViewModel` to power live syntax preview chips.
   - Persistence operations (`IListRepository`, `ITaskRepository`) execute atomically during Kanban transitions.
2. **Integration with R4 & R5 (Explorer 3 - Adaptive 3-Tier Blitz Focus Modes)**:
   - Clicking `🚀 BLITZ NOW` on the Today column or `⚡` on a Task Card calls `INavigationService.NavigateToBlitz(task.Id)`.
   - `FocusSessionService` maintains the single active timer instance and synchronizes with the `ActiveBlitzBanner` on `HomeViewModel`.
   - When a session completes in Tier 1/2/3, the timer service automatically updates the task status to `Done`, and UI collections update reactively.

---

## 12. Verification & Acceptance Checklist

- [x] Dark Theme tokens defined with exact hex codes: `#101010` background, `#171717` card surface, `#2B2B2B` borders, `#FF5E3A` / `#FF2A68` Blitz gradients.
- [x] Left Sidebar fully specified: Profile header, `+ Create new list` button, `All My Lists`, `Archived Lists`, and quick list items.
- [x] Main Dashboard fully specified: List Card grid, metrics calculation without division-by-zero, options menu, `+ Create List` card, and Active Blitz Banner.
- [x] List Detail & Kanban Workflow fully specified: Header with Back button and List Switcher ComboBox, 4 Status Columns (Backlog, This Week, Today, Done) with summaries.
- [x] `🚀 BLITZ NOW` button prominently positioned at the top of Today column with state handling for empty / populated column.
- [x] Task Card component defined with priority badges, duration estimate, quick menu, and 1-click status move buttons.
- [x] Task creation with live Natural Language Input parsing feedback chips specified.
- [x] Complete MVVM architecture, ViewModels, `INavigationService`, `IDialogService`, and Commands designed.
