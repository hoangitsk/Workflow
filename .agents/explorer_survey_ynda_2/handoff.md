# Handoff Report — UI Architecture & Components Explorer

- **Author**: UI Architecture & Components Explorer
- **Date**: 2026-09-15
- **Working Directory**: `/run/media/harlan/New Volume/workflow/.agents/explorer_survey_ynda_2`
- **Primary Survey Report**: `/run/media/harlan/New Volume/workflow/.agents/explorer_survey_ynda_2/survey_report.md`

---

## 1. Observation

1. **Framework & Dependencies (`package.json`)**:
   - `next`: `16.3.2`, `react`: `19.2.8`, `tailwindcss`: `^4`, `@tailwindcss/postcss`: `^4`, `lucide-react`: `^1.33.0`, `@neondatabase/serverless`: `^1.1.0`.
   - Node runtime: `v24.20.0` at `/usr/lib/chatgpt/resources/cua_node/bin/node` with npm `11.19.0`.
2. **Component Architecture (`src/app/components/`)**:
   - `ClientApp.tsx`: Monolithic client component of 4,674 lines (`226,412` bytes) containing all workspace tabs (`dashboard`, `board`, `gantt`, `timeline`, `calendar`, `reports`, `members`, `portfolio`), dialog modals, and the right slide-over task detail drawer (`IdeaSlideOverDrawer` lines 3118-3610).
   - `ProductionTutorialView.tsx`: 116 lines (`17,019` bytes), renders the 9 stages with fields `no, title, owner, ownerTone, input, work, output, guard, icon`. Rendered at `ClientApp.tsx:1121` under `tab === "tutorial"`.
3. **State Management & Actions**:
   - Mutations executed via `runAction(fn, ...args)` (`ClientApp.tsx:741-754`) using React 19 `startTransition` and `router.refresh()`.
   - `src/app/page.tsx` re-fetches from Neon Postgres via `getAllData()` and passes updated props into `ClientApp`.
   - `ClientApp.tsx:627-632` syncs open task state:
     ```tsx
     useEffect(() => {
       if (openIdea) {
         const updated = ideas.find(i => i.id === openIdea.id);
         if (updated) setOpenIdea(updated);
       }
     }, [ideas]);
     ```
4. **Current Gaps Against Requirements R1-R6**:
   - **R1 (SOP Flow)**: `ProductionTutorialView.tsx` exists only as a sidebar tab, without quick header link or contextual step breadcrumb in the task detail drawer.
   - **R2 (Strict Gating)**: The status state machine only supports `PITCH` -> `ASSIGNMENT` -> `SCRIPT` -> `PRODUCTION` -> `QA` -> `COMPLETE`. `qaPassAction` (`idea-actions.ts:313-361`) directly transitions to `COMPLETE`, skipping Core final publish approval. Video submission (`submitVideoAction`, lines 272-311) does not check production checklists or asset links.
   - **R3 (4-Column Script Builder)**: `submitScriptTarget` (`ClientApp.tsx:1529-1553`) only inputs a single URL string (`scriptLink`). No Hook 3Ws builder, no 4-column matrix, no copyright checkbox.
   - **R4 (Dual Checklists)**: `checklist-actions.ts` only handles generic standalone tasks (`name, assigned_to_email, due_date`), not task-embedded Production (7 items) or QC (8 items) checklists.
   - **R5 (TikTok Cutdown)**: No action button or data link between YouTube Master and TikTok derivative tasks.
   - **R6 (Metadata & Analytics)**: Drawer lacks structured resource hub, multi-gate assignee matrix, gate deadlines, copyright hub, and post-publish analytics metrics loop.
5. **Existing Build Failure**:
   - Running `export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH"; npx tsc --noEmit` fails with 3 errors:
     - `src/app/components/ClientApp.tsx:1903:100 - error TS1382: Unexpected token. Did you mean {'>'} or &gt;?`
     - `src/app/components/ClientApp.tsx:1979:100 - error TS1382: Unexpected token. Did you mean {'>'} or &gt;?`
     - `src/app/components/ClientApp.tsx:2082:115 - error TS1382: Unexpected token. Did you mean {'>'} or &gt;?`

---

## 2. Logic Chain

1. **Premise**: `package.json` specifies Next.js 16 App Router and Tailwind v4. The system is already built and fully functional around `ClientApp.tsx` and Server Actions in `src/actions/`.
2. **Inference 1**: Any new UI components must be compatible with React 19 Client Component conventions, use existing Tailwind utility classes and CSS tokens (`C` object in `ClientApp.tsx`), and call server actions via the established `runAction` pattern.
3. **Inference 2 (Architecture & Maintainability)**: Since `ClientApp.tsx` is already 4,674 lines long, adding R1-R6 directly into `ClientApp.tsx` will cause excessive file bloat and merge risk. Therefore, subcomponents should be implemented in separate files in `src/app/components/` (e.g. `ScriptBuilderModal.tsx`, `DualChecklistSection.tsx`, `TikTokCutdownModal.tsx`, `MetadataSections.tsx`) and imported cleanly.
4. **Inference 3 (Gating & State Flow)**: Enforcing strict gating (R2) requires adding checks in both UI (disabling action buttons, displaying gate blocking warnings) and Server Actions (validating that `checklists_data.production` has 7/7 checked before moving to QA, and requiring Core approval before moving to Complete).
5. **Inference 4 (Data Persistence)**: Extending data structures without breaking existing records can be achieved seamlessly by adding JSONB/TEXT columns in `src/lib/db.ts:ensureSchema` (`ALTER TABLE ideas ADD COLUMN IF NOT EXISTS ...`), which already runs on app initialization.
6. **Inference 5 (Build Health)**: Fixing lines 1903, 1979, and 2082 (replacing unescaped `>` in JSX with `→`) is a prerequisite for passing `npx tsc --noEmit` and `npm run build`.

---

## 3. Caveats

1. **Read-Only Investigation**: In accordance with the Explorer archetype instructions, no source code in `src/` has been altered. Proposed bug fixes and component implementations are documented as guidance for the implementation agent.
2. **Local Environment PATH**: The system shell does not have `node` and `npm` in its default `PATH`. The Node v24.20.0 runtime is located at `/usr/lib/chatgpt/resources/cua_node/bin`. Commands must export `PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH"`.
3. **Database Connection**: Neon Postgres database connection is active via `POSTGRES_URL` in `.env`. Database migrations can be executed dynamically via `ensureSchema()` in `src/lib/db.ts`.

---

## 4. Conclusion

The UI architecture is thoroughly analyzed, well-understood, and ready for implementation. The upgrade requirements R1 to R6 can be cleanly integrated through modular components in `src/app/components/` adhering to the existing Tailwind v4 design system, `runAction` data flow, and Neon Postgres persistence.

A complete technical specification, component hierarchy, data models, gating state machine, and code fix guidance have been produced in `survey_report.md`.

---

## 5. Verification Method

1. **Verify Survey Report Artifacts**:
   - Check file existence: `view_file` on `/run/media/harlan/New Volume/workflow/.agents/explorer_survey_ynda_2/survey_report.md`.
2. **Verify TypeScript Compilation & Syntax Issues**:
   - Run:
     ```bash
     export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH"
     npx tsc --noEmit
     ```
   - Confirms the 3 exact JSX unescaped `>` errors at lines 1903, 1979, and 2082 of `src/app/components/ClientApp.tsx`.
3. **Verify Component Paths**:
   - `src/app/components/ClientApp.tsx`
   - `src/app/components/ProductionTutorialView.tsx`
   - `src/app/page.tsx`
   - `src/lib/db.ts`
   - `src/lib/types.ts`
