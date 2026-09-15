# Project: "Ý Niệm Điện Ảnh" (YNDA) Video Production SOP & System Upgrade

## Architecture
The system is an internal video production workflow web platform for the "Ý Niệm Điện Ảnh" (YNDA) creative studio.
- **Frontend & App Framework**: Next.js 16.3.2 (App Router with Turbopack), React 19.2.8, Tailwind CSS v4, Lucide React icons.
- **Backend & State Mutation**: Next.js Server Actions (`src/actions/idea-actions.ts`, etc.) executing with `"use server"` semantics, validated via TypeScript contracts and role-based permissions (`Core`, `E` - Editor, `P` - Producer).
- **Database & Persistence**: Vercel Neon Serverless PostgreSQL (`@neondatabase/serverless` v1.1.0) connected via `src/lib/db.ts`. Dynamic migrations executed through `ensureSchema()` on initialization and `init-postgres.mjs`.
- **Core Domain Entity**: The `ideas` table represents video production tasks across their full lifecycle (YouTube Master, TikTok Cutdown, Facebook Reels).
- **UI Modularization**: View coordination managed in `src/app/components/ClientApp.tsx` (Kanban Board, Gantt, Dashboard, Portfolio), with modular SOP upgrade components:
  - `src/app/components/ProductionTutorialView.tsx` (Interactive 9-step SOP flowchart)
  - `src/app/components/ScriptBuilderModal.tsx` (4-column matrix, Hook 3Ws, copyright checkbox, locking)
  - `src/app/components/DualChecklistSection.tsx` (Production 7-item & QC 8-item interactive checklists)
  - `src/app/components/TikTokCutdownModal.tsx` (Master -> TikTok derivative creation & 5-item checklist)
  - `src/app/components/MetadataSections.tsx` (Resource hub, gate deadlines, copyright status, post-publish analytics)

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | PostgreSQL DDL Migration & Schema Extensions | Add columns to `ideas` table for active gate, approvals, script data, checklists, derivative links, metadata, and analytics | M1 | R2, R3, R4, R5, R6 |
| 2 | TypeScript Types & Data Contracts | Define `ActiveGate`, `ScriptStatus`, `ScriptData`, `ProductionChecklist`, `QcChecklist`, `TikTokChecklist`, `PlatformType`, etc., in `src/lib/types.ts` | M1 | R2-R6 |
| 3 | State Machine Gating Engine & Validations | Backend transition logic for 5 gates (`PITCH` -> `ASSIGNMENT` -> `SCRIPT` -> `PRODUCTION` -> `QA` -> `CORE_REVIEW` -> `READY_TO_PUBLISH`) in `src/actions/idea-actions.ts` | M1 | R2 |
| 4 | JSX Syntax & TypeScript Build Fixes | Resolve 3 TS1382 JSX unescaped `->` syntax errors in `ClientApp.tsx` (lines 1903, 1979, 2082) and fix ESLint errors | M1 | AC |
| 5 | Script Builder Header & Hook 3Ws | Episode name, Channel 1/2 selector, Writer Producer, Wednesday deadline, and What-When-Why 3Ws inputs | M2 | R3 |
| 6 | 4-Column Script Matrix Editor | Editable matrix: Time/Segment, Voice AI (Module B), Visual/Mascot/Edits (Module C), BGM/SFX | M2 | R3 |
| 7 | Script Outro Summary Card & CTA Loop | Outro core message, Summary Card notes, open discussion question, and seamless loop back to Hook | M2 | R3 |
| 8 | Copyright Commitment & Content Locking | Mandatory copyright agreement checkbox; lock script on approval; revision request flow | M2 | R3, R2 |
| 9 | Production Interactive Checklist | 7-item checklist for Producer before video submission with live toggle and progress indicator (X/7) | M3 | R4, R2 |
| 10 | Editor QC Interactive Checklist | 8-item checklist for Editor before Core submission with live toggle and progress indicator (X/8) | M3 | R4, R2 |
| 11 | Gate Transition Controls & Approval Dialogs | UI buttons for Gate 1-5 transitions, gate prerequisite warning banners, and Core approval modal | M3 | R2 |
| 12 | YouTube Master to TikTok Derivative Cutdown Action | Action button on approved Master tasks to branch a 30-45s 9:16 derivative task | M4 | R5 |
| 13 | TikTok Derivative Metadata & 5-Item Checklist | Pre-populated TikTok checklist, hook 0-3s, reframe 9:16, YouTube CTA, and backward link to Master | M4 | R5 |
| 14 | Interactive 9-Step SOP Tutorial & Operating Flow | Visual flowchart / step-by-step interactive tutorial rendering the 9 steps with Role, Input, Tasks (Editor vs Producer), Output, and Gating condition | M5 | R1 |
| 15 | Extended Task Lifecycle & Resource Hub | Platform, Channel, 5 Resource links (Master, Asset folder, Script doc, Video draft/final, Source project), Assignee matrix, Gate deadlines | M6 | R6 |
| 16 | Copyright Status & Official Publish Metadata | Copyright verification hub (footage, music, mascot) and publish details (URL, title, thumbnail, caption, hashtags) | M6 | R6 |
| 17 | Post-Publish Analytics & Feedback Loop | Metrics recording (Views, Retention, CTR, Comments, Insights) and loop back to Step 1 (Pitching) | M6 | R6, R2 |
| 18 | Backward Compatibility for Kanban, Gantt, Dashboard, Portfolio | Safe status labels/colors, null-safe renderers, and fix for Kanban archived tab | M6 | AC |
| 19 | Opaque-Box E2E Testing Suite (Tiers 1-4) | Independent test infra and comprehensive test cases verifying all acceptance criteria, publishing TEST_READY.md | E2E | AC |
| 20 | Adversarial Hardening & Final Victory Audit | White-box stress tests, edge cases (Tier 5), clean `npm run build` verification, and Forensic Audit veto check | FINAL | AC |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Data Layer, Schema Migrations & Gating Engine | PostgreSQL schema updates in `ensureSchema` / `init-postgres.mjs`, TypeScript interfaces in `src/lib/types.ts`, 5-gate Server Actions in `src/actions/idea-actions.ts`, and fix 3 JSX syntax errors in `ClientApp.tsx` | None | PLANNED |
| M2 | Standardized 4-Column Script Builder | Header identity, Hook 3Ws, 4-segment 4-column matrix, Outro summary card, CTA loop, copyright commitment, and approval locking in `src/app/components/ScriptBuilderModal.tsx` | M1 | PLANNED |
| M3 | Dual Interactive Checklists & Gate Approval Flows | Production checklist (7 items), QC checklist (8 items), completion progress indicators, gate transition guards, and approval UI in `src/app/components/DualChecklistSection.tsx` & Drawer | M1 | PLANNED |
| M4 | TikTok Derivative Cutdown Workflow | YouTube Master to TikTok branch button, creation modal, 5-item TikTok checklist, and bidirectional link in `src/app/components/TikTokCutdownModal.tsx` | M1, M3 | PLANNED |
| M5 | Interactive 9-Step SOP Tutorial & Flowchart | Enhanced 9-step SOP visual tutorial with all 5 mandatory fields (Role, Input, Tasks, Output, Gating condition), quick launcher header button, and contextual breadcrumbs | M1 | PLANNED |
| M6 | Lifecycle Metadata Hub, Post-Publish Analytics Loop & View Compatibility | Extended metadata tabs in drawer, post-publish analytics feedback to Step 1, safe status mappings and archived tab fix for Kanban, Gantt, Dashboard, Portfolio | M1, M2, M3, M4 | PLANNED |
| E2E | Opaque-Box E2E Test Suite (Tiers 1-4) | Independent test harness and runner covering feature coverage (Tier 1), boundaries (Tier 2), combinations (Tier 3), and workflows (Tier 4); publishes `TEST_READY.md` | M1 | PLANNED |
| FINAL | E2E Pass, Adversarial Hardening (Tier 5) & Final Victory Audit | Pass 100% E2E tests, execute Tier 5 adversarial stress tests, verify clean `npm run build`, and pass Forensic Integrity Audit | M1-M6, E2E | PLANNED |

---

## Interface Contracts

### 1. Database Schema DDL (Neon Serverless PostgreSQL)
```sql
-- Gating and State Machine
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS active_gate VARCHAR(50) DEFAULT 'GATE_1_IDEA';
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate1_approved_at VARCHAR(100);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate1_approved_by_email VARCHAR(255);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_status VARCHAR(50) DEFAULT 'DRAFT';
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_locked BOOLEAN DEFAULT FALSE;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_revision_notes TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate2_approved_at VARCHAR(100);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate2_approved_by_email VARCHAR(255);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate4_approved_at VARCHAR(100);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate4_approved_by_email VARCHAR(255);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate5_approved_at VARCHAR(100);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS gate5_approved_by_email VARCHAR(255);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS core_approval_notes TEXT;

-- Script 4-Column & Copyright
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_data JSONB;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_commitment BOOLEAN DEFAULT FALSE;

-- Dual Interactive Checklists
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS production_checklist JSONB;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS qc_checklist JSONB;

-- TikTok Derivative Workflow
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS parent_task_id VARCHAR(100);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS derivative_type VARCHAR(50) DEFAULT 'NONE';
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS source_video_url TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_target_duration VARCHAR(50) DEFAULT '30-45s';
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_reframe_applied BOOLEAN DEFAULT FALSE;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_hook_summary TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_cta_route TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS tiktok_checklist JSONB;

-- Extended Metadata & Deadlines
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS platform_type VARCHAR(50) DEFAULT 'YOUTUBE_MASTER';
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS channel_tier VARCHAR(50);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS master_video_link TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS asset_folder_link TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS script_doc_link TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS video_draft_link TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS source_project_link TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS video_final_link TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_script VARCHAR(50);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_production VARCHAR(50);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS deadline_qc VARCHAR(50);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS target_publish_date VARCHAR(50);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_footage VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_music VARCHAR(50) DEFAULT 'PENDING';
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS copyright_mascot VARCHAR(50) DEFAULT 'OFFICIAL';

-- Publish & Post-Publish Analytics
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_title TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_thumbnail TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_caption TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS published_hashtags TEXT;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_views NUMERIC DEFAULT 0;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_retention VARCHAR(50);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_ctr VARCHAR(50);
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_comments INT DEFAULT 0;
ALTER TABLE ideas ADD COLUMN IF NOT EXISTS metrics_insights TEXT;
```

### 2. TypeScript Contracts (`src/lib/types.ts`)
```typescript
export type ActiveGate =
  | "GATE_1_IDEA"
  | "GATE_2_SCRIPT"
  | "GATE_3_PRODUCTION"
  | "GATE_4_QC"
  | "GATE_5_CORE"
  | "READY_TO_PUBLISH"
  | "PUBLISHED";

export type ScriptStatus = "DRAFT" | "SUBMITTED" | "APPROVED" | "REVISION_REQUESTED";
export type PlatformType = "YOUTUBE_MASTER" | "TIKTOK_CUTDOWN" | "FACEBOOK_REELS";
export type ChannelTier = "KENH_1_GIAO_DUC" | "KENH_2_TAM_LY";
export type DerivativeType = "NONE" | "TIKTOK_CUTDOWN" | "REELS_CUTDOWN";
export type CopyrightCheckStatus = "CHECKED_CLEAN" | "FAIR_USE" | "LICENSED" | "PENDING" | "RISK";

export interface ScriptSegmentRow {
  id: string;
  timeRange: string;
  segmentName: string;
  voiceAiText: string;
  visualMascotEdits: string;
  bgmSfxNotes: string;
}

export interface ScriptData {
  episodeName: string;
  channelTier: ChannelTier;
  writerProducerEmail: string;
  submissionDeadline: string;
  hook3Ws: {
    what: string;
    when: string;
    why: string;
  };
  segments: ScriptSegmentRow[];
  summaryCardNotes?: string;
  seamlessLoopQuestion?: string;
  copyrightCommitment: boolean;
  status: ScriptStatus;
  locked: boolean;
  revisionNotes?: string;
  updatedAt: string;
}

export interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  checkedAt?: string;
  checkedByEmail?: string;
}
```

### 3. Server Actions (`src/actions/idea-actions.ts`)
```typescript
// Gating Transitions
export async function approveGate1IdeaAction(ideaId: string, assigneeEmail: string, deadlineScript?: string): Promise<{ success: boolean; error?: string }>;
export async function submitScriptMatrixAction(ideaId: string, scriptData: ScriptData): Promise<{ success: boolean; error?: string }>;
export async function approveGate2ScriptAction(ideaId: string): Promise<{ success: boolean; error?: string }>;
export async function requestScriptRevisionAction(ideaId: string, notes: string): Promise<{ success: boolean; error?: string }>;
export async function updateChecklistAction(ideaId: string, checklistType: "production" | "qc" | "tiktok", items: ChecklistItem[]): Promise<{ success: boolean; error?: string }>;
export async function submitVideoWithChecklistAction(ideaId: string, payload: { videoDraftLink: string; sourceProjectLink: string; assetFolderLink?: string }): Promise<{ success: boolean; error?: string }>;
export async function approveGate4QcAction(ideaId: string, videoFinalLink: string): Promise<{ success: boolean; error?: string }>;
export async function approveGate5CoreAction(ideaId: string, notes?: string): Promise<{ success: boolean; error?: string }>;
export async function publishVideoAction(ideaId: string, publishData: { publishedUrl: string; publishedTitle?: string; publishedThumbnail?: string; publishedCaption?: string; publishedHashtags?: string }): Promise<{ success: boolean; error?: string }>;
export async function savePostPublishMetricsAction(ideaId: string, metrics: { views: number; retention: string; ctr: string; comments: number; insights: string; createFeedbackIdea?: boolean }): Promise<{ success: boolean; error?: string }>;
export async function createTikTokDerivativeAction(masterIdeaId: string, data: { title: string; hookSummary: string; ctaRoute: string; targetDuration: string; assigneeEmail?: string }): Promise<{ success: boolean; derivativeId?: string; error?: string }>;
```

---

## Code Layout
```
/run/media/harlan/New Volume/workflow/
├── src/
│   ├── actions/
│   │   └── idea-actions.ts              # Server actions for 5-gate state transitions, checklists, scripts, derivatives
│   ├── app/
│   │   ├── components/
│   │   │   ├── ClientApp.tsx            # Main shell, view coordinator (Kanban, Gantt, Dashboard, Portfolio), drawer host
│   │   │   ├── ProductionTutorialView.tsx # 9-step SOP visual tutorial & interactive flowchart (R1)
│   │   │   ├── ScriptBuilderModal.tsx   # Standardized 4-column script builder, Hook 3Ws, matrix, locking (R3)
│   │   │   ├── DualChecklistSection.tsx # Production (7 items) & Editor QC (8 items) checklists with progress bars (R4)
│   │   │   ├── TikTokCutdownModal.tsx   # YouTube Master -> TikTok derivative branch creator & 5-item checklist (R5)
│   │   │   └── MetadataSections.tsx     # Resource hub, gate deadlines, copyright status, post-publish analytics (R6)
│   │   └── page.tsx                     # Server component initial data fetcher
│   └── lib/
│       ├── db.ts                        # Neon PostgreSQL connection & ensureSchema auto-migrations
│       ├── types.ts                     # Full TypeScript interfaces for SOP models, gates, scripts, checklists
│       └── reference-utils.tsx          # Utility functions and clean hooks
├── tests/
│   ├── e2e/                             # Opaque-box E2E test suites (Tiers 1-4)
│   │   ├── test-runner.ts               # Test execution engine
│   │   ├── tier1-feature.test.ts        # >=5 test cases per feature
│   │   ├── tier2-boundary.test.ts       # Limit, corner, and validation tests
│   │   ├── tier3-pairwise.test.ts       # Cross-feature interaction tests
│   │   └── tier4-workflows.test.ts      # Real-world end-to-end video production workflows
│   └── adversarial/                     # Tier 5 Adversarial & stress testing
└── .agents/                             # Orchestrator & subagent metadata (no source code here)
```

## Build & Test Tooling
- Node runtime: `/usr/lib/chatgpt/resources/cua_node/bin/node` (Node v24.20.0, npm 11.19.0).
- All command executions must use: `export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH"`
- TypeScript compile validation: `npx tsc --noEmit`
- Production build validation: `npm run build`
- Zero-tolerance integrity: No dummy mocks, no hardcoded bypasses, full genuine implementation.
