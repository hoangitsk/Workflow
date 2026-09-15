# Handoff Report: M1 Schema & Types Specification
**Agent**: Explorer M1_1 (M1 Schema & Types Explorer)  
**Milestone**: M1 (Data Layer, Schema Migrations & Gating Engine)  
**Recipient**: Parent Orchestrator (`e6cd42b3-c0ef-40e3-869c-07faed8aea89`)  
**Date**: 2026-09-15  
**Artifact**: `/run/media/harlan/New Volume/workflow/.agents/explorer_m1_1/survey_report.md`

---

## 1. Observation

1. **Requirements & Scope**:
   - `ORIGINAL_REQUEST.md` (lines 85–195, section `2026-09-15T10:30:18Z`) specifies requirements R1 through R6 for the "Ý Niệm Điện Ảnh" (YNDA) Video Production SOP and System Upgrade.
   - `PROJECT.md` (lines 18–122) details Feature 1 (PostgreSQL DDL Migration) and Feature 2 (TypeScript Types & Contracts), specifying 48 new columns for the `ideas` table and associated domain interfaces.
2. **Existing Database Code**:
   - `src/lib/db.ts` (lines 45–80): `ensureSchema(sql)` contains a `migrations` string array of `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` queries executed on application startup with background de-duplication locks (`schemaEnsured`, `schemaEnsuringPromise`).
   - `src/lib/db.ts` (lines 190–228): `getAllData()` maps SQL rows `r` from `SELECT * FROM ideas` into `Idea` objects using camelCase properties.
   - `init-postgres.mjs` (lines 61–98, 174–204): Contains the initial DDL `CREATE TABLE IF NOT EXISTS ideas` and standalone schema migration statements.
3. **Existing TypeScript Contracts**:
   - `src/lib/types.ts` (lines 46–97): Defines `IdeaStatus` (`PITCH`, `ASSIGNMENT`, `SCRIPT`, `PRODUCTION`, `QA`, `COMPLETE`, `ARCHIVED_IDEA`, `CANCELLED`) and `Idea` interface with 38 existing fields.
   - `src/lib/types.ts` (lines 139–146): Defines legacy `ChecklistItem` with fields `{ id, name, assignedToEmail, dueDate, status, createdByEmail }`.
4. **Existing Codebase Usages & Baseline Verification**:
   - `src/app/components/ClientApp.tsx` (lines 4548–4566): Consumes `checklists: ChecklistItem[]` and renders `item.name`, `item.status`, and invokes `updateChecklistStatusAction`.
   - Baseline check `export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH" && npx tsc --noEmit` executed cleanly with 0 type errors in `db.ts` and `types.ts`, and caught strictly the 3 known TS1382 JSX unescaped `->` syntax errors in `ClientApp.tsx` (lines 1903, 1979, 2082) identified in `PROJECT.md` Feature 4.

---

## 2. Logic Chain

1. **Schema Extension Derivation**:
   - From R2 (Gating), R3 (Script 4-Column), R4 (Dual Checklists), R5 (TikTok Derivative), and R6 (Extended Lifecycle & Analytics), exactly 48 new columns are required on the `ideas` table:
     - 13 Gating fields: `active_gate`, `gate1_approved_at`, `gate1_approved_by_email`, `script_status`, `script_locked`, `script_revision_notes`, `gate2_approved_at`, `gate2_approved_by_email`, `gate4_approved_at`, `gate4_approved_by_email`, `gate5_approved_at`, `gate5_approved_by_email`, `core_approval_notes`.
     - 2 Script & Copyright fields: `script_data JSONB`, `copyright_commitment BOOLEAN`.
     - 3 Checklist fields: `production_checklist JSONB`, `qc_checklist JSONB`, `tiktok_checklist JSONB`.
     - 7 TikTok Derivative fields: `parent_task_id`, `derivative_type`, `source_video_url`, `tiktok_target_duration`, `tiktok_reframe_applied`, `tiktok_hook_summary`, `tiktok_cta_route`.
     - 14 Lifecycle & Resource fields: `platform_type`, `channel_tier`, `master_video_link`, `asset_folder_link`, `script_doc_link`, `video_draft_link`, `source_project_link`, `video_final_link`, `deadline_script`, `deadline_production`, `deadline_qc`, `target_publish_date`, `copyright_footage`, `copyright_music`, `copyright_mascot`.
     - 9 Publish & Analytics fields: `published_title`, `published_thumbnail`, `published_caption`, `published_hashtags`, `metrics_views`, `metrics_retention`, `metrics_ctr`, `metrics_comments`, `metrics_insights`.
     - 3 Performance Indexes: `idx_ideas_parent_task_id`, `idx_ideas_active_gate`, `idx_ideas_platform_type`.
2. **Safe Migration Logic**:
   - Using `ALTER TABLE ideas ADD COLUMN IF NOT EXISTS ...` with sensible defaults (`'GATE_1_IDEA'`, `'DRAFT'`, `FALSE`, `'NONE'`, `'YOUTUBE_MASTER'`, `'PENDING'`, `0`) guarantees that existing databases can be migrated non-destructively without table rewrites or downtime.
3. **Dual Checklist Backward Compatibility**:
   - Observation 3 showed `ChecklistItem` is used by legacy workspace checklists in `ClientApp.tsx:4548` expecting `item.name` and `item.status`.
   - By updating `ChecklistItem` to `{ id: string; label: string; checked: boolean; checkedAt?: string; checkedByEmail?: string; name?: string; status?: string; assignedToEmail?: string; dueDate?: string; createdByEmail?: string; }` and populating both sets of fields in `src/lib/db.ts:257`, both legacy workspace checklists and new SOP task checklists operate seamlessly without breaking strict type checks.
4. **Safe Data Parsing in Data Access Layer**:
   - Neon PostgreSQL returns JSONB as parsed JS objects. The introduction of `parseJsonField<T>(val, fallback)` provides resilience against nulls, undefineds, or raw JSON strings.
5. **View Safety & Non-Breaking Contract**:
   - All 48 new fields on `Idea` are optional (`?`). Therefore, existing views (Kanban board with 6 columns, Gantt timeline, Studio dashboard metrics, Portfolio archive) continue to render without runtime undefined errors.

---

## 3. Caveats

1. **JSX Errors Pending Fix**:
   - The 3 syntax errors in `ClientApp.tsx` (`->` in JSX at lines 1903, 1979, 2082) belong to Milestone 1 Feature 4. They do not stem from `types.ts` or `db.ts`, but must be resolved before `npx tsc --noEmit` exits with 0.
2. **Legacy Google Sheets Integration**:
   - `init-sheet.mjs` was an initial migration utility for Google Sheets. Neon Serverless Postgres is now the authoritative database, so new SOP fields do not need Google Sheets sync.
3. **Runtime Database Connectivity**:
   - Applying migrations via `ensureSchema()` requires a valid `POSTGRES_URL` or `DATABASE_URL` in `.env`.

---

## 4. Conclusion

A comprehensive, production-grade schema and types implementation plan has been formulated and recorded in:
`/run/media/harlan/New Volume/workflow/.agents/explorer_m1_1/survey_report.md`

The plan provides exact, line-by-line diffs for:
1. `src/lib/types.ts`: Adds `ActiveGate`, `ScriptStatus`, `PlatformType`, `ChannelTier`, `DerivativeType`, `CopyrightCheckStatus`, `ScriptSegmentRow`, `ScriptData`, `ChecklistItem`, default checklist templates (`DEFAULT_PRODUCTION_CHECKLIST`, `DEFAULT_QC_CHECKLIST`, `DEFAULT_TIKTOK_CHECKLIST`), and extends `Idea` with 48 optional fields.
2. `src/lib/db.ts`: Extends `ensureSchema()` with 48 idempotent `ALTER TABLE` statements and 3 indexes, adds `parseJsonField()`, and maps all 48 new fields in `getAllData()`.
3. `init-postgres.mjs`: Extends `CREATE TABLE IF NOT EXISTS ideas` and standalone migration runner with all 48 columns and indexes.

All proposed changes maintain 100% backward compatibility and strictly follow the project architecture.

---

## 5. Verification Method

To independently verify this specification:
1. **Inspect Artifacts**:
   - View `/run/media/harlan/New Volume/workflow/.agents/explorer_m1_1/survey_report.md` to review the line-by-line diff proposals and field matrix.
2. **Type Check Verification**:
   - After implementers apply the diffs to `src/lib/types.ts` and `src/lib/db.ts`, run:
     ```bash
     export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH" && npx tsc --noEmit
     ```
   - Verify that no type errors are introduced in `src/lib/types.ts` or `src/lib/db.ts`.
3. **Invalidation Conditions**:
   - Any modification that makes any of the 48 new `Idea` fields required (non-optional).
   - Any removal of legacy properties (`name`, `status`) from `ChecklistItem` that breaks `ClientApp.tsx:4548`.
   - Any missing columns from the 48 specified in `survey_report.md`.
