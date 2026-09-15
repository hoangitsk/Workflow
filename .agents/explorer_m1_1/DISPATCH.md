## 2026-09-15T11:18:31Z

You are Explorer M1_1 for Milestone 1 of the "Ý Niệm Điện Ảnh" (YNDA) Video Production SOP and System Upgrade.
Your identity: M1 Schema & Types Explorer
Your working directory: /run/media/harlan/New Volume/workflow/.agents/explorer_m1_1
Workspace root: /run/media/harlan/New Volume/workflow

MANDATORY FIRST STEP:
You MUST read the authoritative user requirements in:
/run/media/harlan/New Volume/workflow/.agents/ORIGINAL_REQUEST.md
Pay special attention to section "## 2026-09-15T10:30:18Z" and all requirements R1-R6 and Acceptance Criteria.
Also read the project architecture in:
/run/media/harlan/New Volume/workflow/.agents/PROJECT.md

Your mission:
Formulate the exact, concrete implementation plan for:
1. Updating `src/lib/db.ts` (the `ensureSchema` function) and `init-postgres.mjs` with all new PostgreSQL columns on the `ideas` table:
   - Gating & state fields: `active_gate`, `gate1_approved_at`, `gate1_approved_by_email`, `script_status`, `script_locked`, `script_revision_notes`, `gate2_approved_at`, `gate2_approved_by_email`, `gate4_approved_at`, `gate4_approved_by_email`, `gate5_approved_at`, `gate5_approved_by_email`, `core_approval_notes`.
   - Script 4-column & copyright: `script_data JSONB`, `copyright_commitment BOOLEAN`.
   - Dual checklists: `production_checklist JSONB`, `qc_checklist JSONB`, `tiktok_checklist JSONB`.
   - TikTok derivative: `parent_task_id`, `derivative_type`, `source_video_url`, `tiktok_target_duration`, `tiktok_reframe_applied`, `tiktok_hook_summary`, `tiktok_cta_route`.
   - Extended lifecycle & resource links: `platform_type`, `channel_tier`, `master_video_link`, `asset_folder_link`, `script_doc_link`, `video_draft_link`, `source_project_link`, `video_final_link`, `deadline_script`, `deadline_production`, `deadline_qc`, `target_publish_date`, `copyright_footage`, `copyright_music`, `copyright_mascot`.
   - Publish & analytics: `published_title`, `published_thumbnail`, `published_caption`, `published_hashtags`, `metrics_views`, `metrics_retention`, `metrics_ctr`, `metrics_comments`, `metrics_insights`.
2. Updating `src/lib/types.ts`:
   - Adding all new types: `ActiveGate`, `ScriptStatus`, `PlatformType`, `ChannelTier`, `DerivativeType`, `CopyrightCheckStatus`, `ScriptSegmentRow`, `ScriptData`, `ChecklistItem`.
   - Updating the `Idea` interface with all new fields as optional/nullable so existing queries and views (Kanban, Gantt, Dashboard, Portfolio) remain 100% backward compatible without breakage.
3. Write your report with exact line-by-line diff recommendations to:
   /run/media/harlan/New Volume/workflow/.agents/explorer_m1_1/survey_report.md
   and write a standard handoff report to:
   /run/media/harlan/New Volume/workflow/.agents/explorer_m1_1/handoff.md
4. Send a message to parent when done.
