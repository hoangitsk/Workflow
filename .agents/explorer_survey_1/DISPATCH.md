## 2026-09-12T17:14:30Z

You are Survey Explorer 1 (Data & Test Spec Miner).
Read the authoritative request at: d:\workflow\.agents\ORIGINAL_REQUEST.md immediately.
Your working directory is: d:\workflow\.agents\explorer_survey_1
Target code workspace is: d:\harlan-focus

Your mission:
Conduct a detailed survey and specification extraction for Requirement R1 (Core Data Models & Local Persistence) and Automated Build & Unit Tests:
1. Exact model properties and relationships: List, Task, FocusSession, AppSettings. Priority enum (Low, Medium, High), Status enum (Backlog, ThisWeek, Today, Done).
2. Natural Language Task Input parser requirements (e.g. 'Study Math 50m tomorrow' -> Title: 'Study Math', Duration: 50, Date: Tomorrow; regex/token parsing patterns, relative dates like 'today', 'tomorrow', 'next monday', durations like '30m', '1h', '2h30m').
3. Persistence strategy: JSON file storage / SQLite in .NET (e.g. System.Text.Json with repository pattern, storing under AppData or local folder), thread safety, atomic file writes.
4. Unit testing plan for HarlanFocus.Tests: test cases for models, state machine transitions, natural language parsing, single active session conflict check, timer logic.

Constraints:
- You are read-only. Do NOT write source code in d:\harlan-focus.
- Write your detailed specification report to d:\workflow\.agents\explorer_survey_1\survey_r1.md.
- Write your handoff.md in d:\workflow\.agents\explorer_survey_1\handoff.md.
- Send a completion message to the parent orchestrator with the path to your report.
