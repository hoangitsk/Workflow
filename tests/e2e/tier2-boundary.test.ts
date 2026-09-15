/**
 * Tier 2: Boundary & Corner Cases Test Suite
 * Minimum 5 tests per feature for R1 through R6 (Total: 33 tests)
 * Authoritative Source: ORIGINAL_REQUEST.md and PROJECT.md
 */

import {
  YndaGatingEngine,
  SOP_STAGES,
  DEFAULT_PRODUCTION_CHECKLIST,
  DEFAULT_QC_CHECKLIST,
  registerTest,
  assert,
  assertEquals,
  type ScriptData,
} from "./harness.ts";

export function loadTier2Tests() {
  // ==========================================================================
  // R1 BOUNDARY: 9-STEP SOP TUTORIAL
  // ==========================================================================

  registerTest(
    "Tier 2",
    "R1 Boundary: SOP Tutorial",
    "T2_R1_01",
    "Out-of-bounds stage access returns undefined and does not crash",
    () => {
      assertEquals(SOP_STAGES[9], undefined, "Index 9 must be out of bounds");
      assertEquals(SOP_STAGES[-1], undefined, "Negative index must be out of bounds");
    }
  );

  registerTest(
    "Tier 2",
    "R1 Boundary: SOP Tutorial",
    "T2_R1_02",
    "Validates that no stage contains blank or whitespace-only field content",
    () => {
      for (const stage of SOP_STAGES) {
        assert(stage.no.trim() !== "", `Stage no cannot be empty`);
        assert(stage.title.trim() !== "", `Stage ${stage.no} title cannot be blank`);
        assert(stage.input.trim() !== "", `Stage ${stage.no} input cannot be blank`);
        assert(stage.work.trim() !== "", `Stage ${stage.no} work cannot be blank`);
        assert(stage.output.trim() !== "", `Stage ${stage.no} output cannot be blank`);
        assert(stage.guard.trim() !== "", `Stage ${stage.no} guard cannot be blank`);
      }
    }
  );

  registerTest(
    "Tier 2",
    "R1 Boundary: SOP Tutorial",
    "T2_R1_03",
    "Stage forward-acyclic invariant: Step 1 input cannot depend on downstream Step 6 or Step 7 video output",
    () => {
      const step1Input = SOP_STAGES[0].input.toLowerCase();
      assert(!step1Input.includes("video nháp"), "Step 1 cannot take draft video as input");
      assert(!step1Input.includes("video hoàn thiện"), "Step 1 cannot take completed video as input");
    }
  );

  registerTest(
    "Tier 2",
    "R1 Boundary: SOP Tutorial",
    "T2_R1_04",
    "Role demarcation guard: Producer cannot be designated sole owner of Step 4 (Script Review) or Step 7 (QC)",
    () => {
      assert(!SOP_STAGES[3].owner.startsWith("Producer"), "Producer cannot be sole owner of Step 4 (Review)");
      assert(!SOP_STAGES[6].owner.startsWith("Producer"), "Producer cannot be sole owner of Step 7 (QC)");
      assert(SOP_STAGES[6].owner.includes("Editor"), "Step 7 must be owned by Editor");
    }
  );

  registerTest(
    "Tier 2",
    "R1 Boundary: SOP Tutorial",
    "T2_R1_05",
    "Step sequence invariants: stages cannot be out of order or duplicate numbering",
    () => {
      const seenNos = new Set<string>();
      for (let i = 0; i < SOP_STAGES.length; i++) {
        const no = SOP_STAGES[i].no;
        assert(!seenNos.has(no), `Duplicate stage number: ${no}`);
        seenNos.add(no);
        assertEquals(parseInt(no, 10), i + 1, `Stage numbering sequence broken at index ${i}`);
      }
    }
  );

  // ==========================================================================
  // R2 BOUNDARY: STRICT GATING STATE MACHINE
  // ==========================================================================

  registerTest(
    "Tier 2",
    "R2 Boundary: State Machine Gating",
    "T2_R2_01",
    "Jumping gates rejected: Attempting Gate 3 video submission directly from GATE_1_IDEA fails",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Jump Gate Test",
        description: "Attempting to skip gates",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });

      const res = engine.submitVideoWithChecklist(idea.id, "producer@ynda.vn", {
        videoDraftLink: "https://drive.google.com/draft",
        sourceProjectLink: "https://drive.google.com/source",
      });

      assertEquals(res.success, false, "Must reject skipping to Gate 3 from Gate 1");
      assert(res.error?.includes("Gate 3 Production") || res.error?.includes("GATE_1_IDEA"), "Must state gate mismatch");
    }
  );

  registerTest(
    "Tier 2",
    "R2 Boundary: State Machine Gating",
    "T2_R2_02",
    "Jumping gates rejected: Attempting Gate 5 Core approval from GATE_2_SCRIPT fails",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Jump to Core Test",
        description: "Attempting to skip to Core approval",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      const res = engine.approveGate5Core(idea.id, "core@ynda.vn", "Bypass review");
      assertEquals(res.success, false, "Must reject skipping to Gate 5");
      assert(res.error?.includes("Gate 5 Core Review"), "Must report current gate mismatch");
    }
  );

  registerTest(
    "Tier 2",
    "R2 Boundary: State Machine Gating",
    "T2_R2_03",
    "Unauthorized role: Producer attempting to approve Gate 2 Script is rejected (Editor/Core only)",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Unauthorized Script Approval",
        description: "Producer self-approving",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      const res = engine.approveGate2Script(idea.id, "producer@ynda.vn");
      assertEquals(res.success, false);
      assert(res.error?.includes("Chỉ Editor hoặc Core"), "Must enforce Editor/Core permission for Gate 2");
    }
  );

  registerTest(
    "Tier 2",
    "R2 Boundary: State Machine Gating",
    "T2_R2_04",
    "Unauthorized role: Editor or Producer attempting to approve Gate 5 Core is strictly rejected (Core ONLY)",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Gate 5 Role Test",
        description: "Editor trying to approve Gate 5",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      idea.activeGate = "GATE_5_CORE";
      idea.gate4ApprovedAt = new Date().toISOString();
      (engine as any).ideas.set(idea.id, idea);

      const editorRes = engine.approveGate5Core(idea.id, "editor@ynda.vn");
      assertEquals(editorRes.success, false);
      assert(editorRes.error?.includes("CHỈ CORE"), "Must enforce Core-only authority for Gate 5");

      const producerRes = engine.approveGate5Core(idea.id, "producer@ynda.vn");
      assertEquals(producerRes.success, false);
      assert(producerRes.error?.includes("CHỈ CORE"));
    }
  );

  registerTest(
    "Tier 2",
    "R2 Boundary: State Machine Gating",
    "T2_R2_05",
    "Publishing video before Core Gate 5 approval is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Early Publish Test",
        description: "Trying to publish at Gate 4",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      idea.activeGate = "GATE_4_QC";
      (engine as any).ideas.set(idea.id, idea);

      const pubRes = engine.publishVideo(idea.id, "producer@ynda.vn", {
        publishedUrl: "https://youtube.com/watch?v=early_leak",
      });

      assertEquals(pubRes.success, false);
      assert(pubRes.error?.includes("chưa được Core phê duyệt chốt"), "Must reject publish before Gate 5");
    }
  );

  registerTest(
    "Tier 2",
    "R2 Boundary: State Machine Gating",
    "T2_R2_06",
    "State transitions on CANCELLED tasks are strictly rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Cancelled Task Test",
        description: "Testing cancelled task guard",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      idea.status = "CANCELLED";
      (engine as any).ideas.set(idea.id, idea);

      const gate1Res = engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");
      assertEquals(gate1Res.success, false);
      assert(gate1Res.error?.includes("huỷ"), "Must reject approval on cancelled task");
    }
  );

  // ==========================================================================
  // R3 BOUNDARY: STANDARDIZED 4-COLUMN SCRIPT BUILDER
  // ==========================================================================

  registerTest(
    "Tier 2",
    "R3 Boundary: Script Builder",
    "T2_R3_01",
    "Hook 3Ws missing 'what' field is rejected with explicit error",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Missing What Test",
        description: "Testing 3Ws what validation",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      const scriptData: ScriptData = {
        episodeName: "Tập 1", channelTier: "KENH_1_GIAO_DUC", writerProducerEmail: "producer@ynda.vn", submissionDeadline: "Wed",
        hook3Ws: { what: "   ", when: "1999", why: "Reason" }, // Missing 'what'
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "V", visualMascotEdits: "M", bgmSfxNotes: "S" }],
        copyrightCommitment: true, status: "DRAFT", locked: false, updatedAt: new Date().toISOString()
      };

      const res = engine.submitScriptMatrix(idea.id, "producer@ynda.vn", scriptData);
      assertEquals(res.success, false);
      assert(res.error?.includes("Hook 3Ws"), "Must reject missing What field");
    }
  );

  registerTest(
    "Tier 2",
    "R3 Boundary: Script Builder",
    "T2_R3_02",
    "Hook 3Ws missing 'when' or 'why' field is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Missing Why Test",
        description: "Testing 3Ws why validation",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      const scriptData: ScriptData = {
        episodeName: "Tập 2", channelTier: "KENH_1_GIAO_DUC", writerProducerEmail: "producer@ynda.vn", submissionDeadline: "Wed",
        hook3Ws: { what: "What happens", when: "When it happens", why: "" }, // Missing 'why'
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "V", visualMascotEdits: "M", bgmSfxNotes: "S" }],
        copyrightCommitment: true, status: "DRAFT", locked: false, updatedAt: new Date().toISOString()
      };

      const res = engine.submitScriptMatrix(idea.id, "producer@ynda.vn", scriptData);
      assertEquals(res.success, false);
      assert(res.error?.includes("Hook 3Ws"), "Must reject missing Why field");
    }
  );

  registerTest(
    "Tier 2",
    "R3 Boundary: Script Builder",
    "T2_R3_03",
    "Script submission with copyright commitment unchecked (false) is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "No Copyright Commitment Test",
        description: "Testing copyright commitment guard",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      const scriptData: ScriptData = {
        episodeName: "Tập 3", channelTier: "KENH_1_GIAO_DUC", writerProducerEmail: "producer@ynda.vn", submissionDeadline: "Wed",
        hook3Ws: { what: "W", when: "W", why: "W" },
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "V", visualMascotEdits: "M", bgmSfxNotes: "S" }],
        copyrightCommitment: false, // Unchecked!
        status: "DRAFT", locked: false, updatedAt: new Date().toISOString()
      };

      const res = engine.submitScriptMatrix(idea.id, "producer@ynda.vn", scriptData);
      assertEquals(res.success, false);
      assert(res.error?.includes("cam kết bản quyền"), "Must reject uncommitted copyright");
    }
  );

  registerTest(
    "Tier 2",
    "R3 Boundary: Script Builder",
    "T2_R3_04",
    "Producer attempting to edit script when scriptLocked = true is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Script Lock Protection Test",
        description: "Producer trying to alter approved script",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      const scriptData: ScriptData = {
        episodeName: "Tập 4", channelTier: "KENH_1_GIAO_DUC", writerProducerEmail: "producer@ynda.vn", submissionDeadline: "Wed",
        hook3Ws: { what: "W", when: "W", why: "W" },
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "V", visualMascotEdits: "M", bgmSfxNotes: "S" }],
        copyrightCommitment: true, status: "DRAFT", locked: false, updatedAt: new Date().toISOString()
      };
      engine.submitScriptMatrix(idea.id, "producer@ynda.vn", scriptData);
      engine.approveGate2Script(idea.id, "editor@ynda.vn"); // Now locked!

      // Attempt to overwrite script
      const res = engine.submitScriptMatrix(idea.id, "producer@ynda.vn", {
        ...scriptData,
        episodeName: "Tập 4: Modified Behind Editor's Back",
      });

      assertEquals(res.success, false);
      assert(res.error?.includes("khoá") || res.error?.includes("Gate 2"), "Must reject edit on locked script");
    }
  );

  registerTest(
    "Tier 2",
    "R3 Boundary: Script Builder",
    "T2_R3_05",
    "Script matrix with empty segments array is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Empty Segments Test",
        description: "Testing empty matrix segments",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      const scriptData: ScriptData = {
        episodeName: "Tập 5", channelTier: "KENH_1_GIAO_DUC", writerProducerEmail: "producer@ynda.vn", submissionDeadline: "Wed",
        hook3Ws: { what: "W", when: "W", why: "W" },
        segments: [], // Empty segments!
        copyrightCommitment: true, status: "DRAFT", locked: false, updatedAt: new Date().toISOString()
      };

      const res = engine.submitScriptMatrix(idea.id, "producer@ynda.vn", scriptData);
      assertEquals(res.success, false);
      assert(res.error?.includes("phân đoạn"), "Must reject empty segments array");
    }
  );

  registerTest(
    "Tier 2",
    "R3 Boundary: Script Builder",
    "T2_R3_06",
    "Unassigned Producer attempting to submit script for another Producer's task is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Wrong Producer Test",
        description: "Testing producer ownership",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      // Assigned to producer@ynda.vn
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      const scriptData: ScriptData = {
        episodeName: "Tập 6", channelTier: "KENH_1_GIAO_DUC", writerProducerEmail: "producer2@ynda.vn", submissionDeadline: "Wed",
        hook3Ws: { what: "W", when: "W", why: "W" },
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "V", visualMascotEdits: "M", bgmSfxNotes: "S" }],
        copyrightCommitment: true, status: "DRAFT", locked: false, updatedAt: new Date().toISOString()
      };

      // producer2@ynda.vn attempts to submit
      const res = engine.submitScriptMatrix(idea.id, "producer2@ynda.vn", scriptData);
      assertEquals(res.success, false);
      assert(res.error?.includes("được giao việc"), "Must reject submission by unassigned Producer");
    }
  );

  // ==========================================================================
  // R4 BOUNDARY: DUAL INTERACTIVE CHECKLISTS
  // ==========================================================================

  registerTest(
    "Tier 2",
    "R4 Boundary: Checklists",
    "T2_R4_01",
    "Incomplete Production Checklist (6 out of 7 items checked) is rejected at Gate 3",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Incomplete Prod Checklist Test",
        description: "Only 6/7 checked",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");
      const sData: ScriptData = {
        episodeName: "Ep 1", channelTier: "KENH_1_GIAO_DUC", writerProducerEmail: "producer@ynda.vn", submissionDeadline: "Wed",
        hook3Ws: { what: "w", when: "w", why: "w" },
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "V", visualMascotEdits: "M", bgmSfxNotes: "S" }],
        copyrightCommitment: true, status: "DRAFT", locked: false, updatedAt: new Date().toISOString()
      };
      engine.submitScriptMatrix(idea.id, "producer@ynda.vn", sData);
      engine.approveGate2Script(idea.id, "editor@ynda.vn");

      // Check only 6 of 7
      const only6 = DEFAULT_PRODUCTION_CHECKLIST.map((item, idx) => ({
        ...item,
        checked: idx < 6, // 6 checked, 7th unchecked
      }));
      engine.updateChecklist(idea.id, "producer@ynda.vn", "production", only6);

      const res = engine.submitVideoWithChecklist(idea.id, "producer@ynda.vn", {
        videoDraftLink: "https://drive.google.com/draft",
        sourceProjectLink: "https://drive.google.com/source",
      });

      assertEquals(res.success, false);
      assert(res.error?.includes("6/7"), "Error message must report 6/7 completion");
      assert(res.error?.includes("chưa hoàn thành 100%"), "Must mandate 100% completion");
    }
  );

  registerTest(
    "Tier 2",
    "R4 Boundary: Checklists",
    "T2_R4_02",
    "Incomplete QC Checklist (7 out of 8 items checked) is rejected at Gate 4",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Incomplete QC Test",
        description: "Only 7/8 QC checked",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      idea.activeGate = "GATE_4_QC";

      // Check only 7 of 8 QC items
      const only7 = DEFAULT_QC_CHECKLIST.map((item, idx) => ({
        ...item,
        checked: idx < 7, // 7 checked, 8th unchecked
      }));
      idea.qcChecklist = only7;
      (engine as any).ideas.set(idea.id, idea);

      const res = engine.approveGate4Qc(idea.id, "editor@ynda.vn", "https://youtube.com/watch?v=final");
      assertEquals(res.success, false);
      assert(res.error?.includes("7/8"), "Error message must report 7/8 completion");
      assert(res.error?.includes("chưa đạt 100%"), "Must mandate 100% QC completion");
    }
  );

  registerTest(
    "Tier 2",
    "R4 Boundary: Checklists",
    "T2_R4_03",
    "Producer role attempting to toggle QC checklist items is rejected (Editor/Core only)",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Producer QC Tampering Test",
        description: "Producer trying to tick QC checklist",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });

      const res = engine.updateChecklist(idea.id, "producer@ynda.vn", "qc", DEFAULT_QC_CHECKLIST);
      assertEquals(res.success, false);
      assert(res.error?.includes("Producer không có quyền"), "Must prevent Producer from modifying QC checklist");
    }
  );

  registerTest(
    "Tier 2",
    "R4 Boundary: Checklists",
    "T2_R4_04",
    "Checklist update with invalid/unknown item ID is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Invalid Item ID Test",
        description: "Unknown ID",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });

      const corrupted = [
        { id: "hacked_item_id_999", label: "Tampered item", checked: true },
      ];

      const res = engine.updateChecklist(idea.id, "producer@ynda.vn", "production", corrupted);
      assertEquals(res.success, false);
      assert(res.error?.includes("không hợp lệ"), "Must reject unknown checklist item ID");
    }
  );

  registerTest(
    "Tier 2",
    "R4 Boundary: Checklists",
    "T2_R4_05",
    "Checklist update with empty array is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Empty Checklist Payload Test",
        description: "Empty array",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });

      const res = engine.updateChecklist(idea.id, "producer@ynda.vn", "production", []);
      assertEquals(res.success, false);
      assert(res.error?.includes("không hợp lệ hoặc rỗng"), "Must reject empty checklist array");
    }
  );

  // ==========================================================================
  // R5 BOUNDARY: YOUTUBE MASTER TO TIKTOK CUTDOWN WORKFLOW
  // ==========================================================================

  registerTest(
    "Tier 2",
    "R5 Boundary: TikTok Cutdown",
    "T2_R5_01",
    "Creating TikTok derivative from an unapproved Master still in GATE_1_IDEA is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Premature TikTok Test",
        description: "Still in Pitch",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });

      const res = engine.createTikTokDerivative(idea.id, "editor@ynda.vn", {
        title: "Premature Cutdown",
        hookSummary: "Hook",
        ctaRoute: "CTA",
      });

      assertEquals(res.success, false);
      assert(res.error?.includes("đã được duyệt hoặc xuất bản"), "Must reject derivative from unapproved Master");
    }
  );

  registerTest(
    "Tier 2",
    "R5 Boundary: TikTok Cutdown",
    "T2_R5_02",
    "Creating TikTok derivative from a task in GATE_3_PRODUCTION is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Production Stage Master",
        description: "In production",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });
      idea.activeGate = "GATE_3_PRODUCTION";
      (engine as any).ideas.set(idea.id, idea);

      const res = engine.createTikTokDerivative(idea.id, "editor@ynda.vn", {
        title: "Production Cutdown",
        hookSummary: "Hook",
        ctaRoute: "CTA",
      });

      assertEquals(res.success, false);
      assert(res.error?.includes("đã được duyệt hoặc xuất bản"));
    }
  );

  registerTest(
    "Tier 2",
    "R5 Boundary: TikTok Cutdown",
    "T2_R5_03",
    "TikTok cutdown creation with empty hookSummary is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Master Approved",
        description: "Approved",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });
      idea.activeGate = "PUBLISHED";
      idea.status = "COMPLETE";
      (engine as any).ideas.set(idea.id, idea);

      const res = engine.createTikTokDerivative(idea.id, "editor@ynda.vn", {
        title: "TikTok No Hook",
        hookSummary: "   ", // Empty!
        ctaRoute: "CTA YouTube",
      });

      assertEquals(res.success, false);
      assert(res.error?.includes("Hook 0-3s"), "Must mandate 0-3s hook summary");
    }
  );

  registerTest(
    "Tier 2",
    "R5 Boundary: TikTok Cutdown",
    "T2_R5_04",
    "TikTok cutdown creation with empty ctaRoute is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Master Approved",
        description: "Approved",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });
      idea.activeGate = "READY_TO_PUBLISH";
      (engine as any).ideas.set(idea.id, idea);

      const res = engine.createTikTokDerivative(idea.id, "editor@ynda.vn", {
        title: "TikTok No CTA",
        hookSummary: "Hook summary here",
        ctaRoute: "", // Empty CTA!
      });

      assertEquals(res.success, false);
      assert(res.error?.includes("CTA"), "Must mandate CTA route");
    }
  );

  registerTest(
    "Tier 2",
    "R5 Boundary: TikTok Cutdown",
    "T2_R5_05",
    "TikTok cutdown creation targeting non-existent parent ID is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const res = engine.createTikTokDerivative("non_existent_master_999", "editor@ynda.vn", {
        title: "Ghost Cutdown",
        hookSummary: "Hook",
        ctaRoute: "CTA",
      });

      assertEquals(res.success, false);
      assert(res.error?.includes("Không tìm thấy"), "Must reject non-existent parent master");
    }
  );

  // ==========================================================================
  // R6 BOUNDARY: EXTENDED METADATA & ANALYTICS
  // ==========================================================================

  registerTest(
    "Tier 2",
    "R6 Boundary: Metadata & Analytics",
    "T2_R6_01",
    "Gate 3 submission with malformed or non-HTTP URL for videoDraftLink is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Bad Draft URL Test",
        description: "Invalid URL format",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      idea.activeGate = "GATE_3_PRODUCTION";
      idea.productionChecklist = DEFAULT_PRODUCTION_CHECKLIST.map((i) => ({ ...i, checked: true }));
      (engine as any).ideas.set(idea.id, idea);

      const res = engine.submitVideoWithChecklist(idea.id, "producer@ynda.vn", {
        videoDraftLink: "not-a-valid-url-file",
        sourceProjectLink: "https://drive.google.com/source",
      });

      assertEquals(res.success, false);
      assert(res.error?.includes("URL hợp lệ cho Video nháp"), "Must validate draft link URL");
    }
  );

  registerTest(
    "Tier 2",
    "R6 Boundary: Metadata & Analytics",
    "T2_R6_02",
    "Gate 3 submission with malformed or non-HTTP URL for sourceProjectLink is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Bad Source URL Test",
        description: "Invalid source project link",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      idea.activeGate = "GATE_3_PRODUCTION";
      idea.productionChecklist = DEFAULT_PRODUCTION_CHECKLIST.map((i) => ({ ...i, checked: true }));
      (engine as any).ideas.set(idea.id, idea);

      const res = engine.submitVideoWithChecklist(idea.id, "producer@ynda.vn", {
        videoDraftLink: "https://drive.google.com/draft",
        sourceProjectLink: "ftp://invalid-project-path", // non-http/https
      });

      assertEquals(res.success, false);
      assert(res.error?.includes("file source/project"), "Must validate source project link URL");
    }
  );

  registerTest(
    "Tier 2",
    "R6 Boundary: Metadata & Analytics",
    "T2_R6_03",
    "Post-publish metrics with negative views or comments count is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Negative Metrics Test",
        description: "Negative numbers",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      idea.activeGate = "PUBLISHED";
      idea.status = "COMPLETE";
      (engine as any).ideas.set(idea.id, idea);

      const res = engine.savePostPublishMetrics(idea.id, "editor@ynda.vn", {
        views: -100, // Negative!
        comments: 10,
      });

      assertEquals(res.success, false);
      assert(res.error?.includes("không được là số âm"), "Must reject negative metrics");
    }
  );

  registerTest(
    "Tier 2",
    "R6 Boundary: Metadata & Analytics",
    "T2_R6_04",
    "Saving metrics on a task that is not published/complete is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Unpublished Metrics Test",
        description: "Premature metrics",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });

      const res = engine.savePostPublishMetrics(idea.id, "editor@ynda.vn", {
        views: 1000,
        comments: 50,
      });

      assertEquals(res.success, false);
      assert(res.error?.includes("sau khi video đã hoàn tất xuất bản"), "Must reject metrics on unpublished tasks");
    }
  );

  registerTest(
    "Tier 2",
    "R6 Boundary: Metadata & Analytics",
    "T2_R6_05",
    "Publishing video with invalid official URL is rejected",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Bad Publish URL Test",
        description: "Invalid official URL",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      idea.activeGate = "READY_TO_PUBLISH";
      idea.gate5ApprovedAt = new Date().toISOString();
      (engine as any).ideas.set(idea.id, idea);

      const res = engine.publishVideo(idea.id, "producer@ynda.vn", {
        publishedUrl: "bad-url-protocol",
      });

      assertEquals(res.success, false);
      assert(res.error?.includes("không hợp lệ"), "Must validate official publish URL");
    }
  );
}
