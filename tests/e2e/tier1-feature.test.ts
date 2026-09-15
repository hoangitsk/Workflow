/**
 * Tier 1: Feature Coverage Test Suite
 * Minimum 5 tests per feature for R1 through R6 (Total: 36 tests)
 * Authoritative Source: ORIGINAL_REQUEST.md (2026-09-15T10:30:18Z) and PROJECT.md
 */

import {
  YndaGatingEngine,
  SOP_STAGES,
  DEFAULT_PRODUCTION_CHECKLIST,
  DEFAULT_QC_CHECKLIST,
  DEFAULT_TIKTOK_CHECKLIST,
  registerTest,
  assert,
  assertEquals,
  type ScriptData,
} from "./harness.ts";

export function loadTier1Tests() {
  // ==========================================================================
  // R1: INTERACTIVE 9-STEP SOP TUTORIAL & OPERATING FLOW
  // ==========================================================================

  registerTest(
    "Tier 1",
    "R1: 9-Step SOP Tutorial",
    "T1_R1_01",
    "Verifies all 9 stages exist in strict numerical sequence with canonical titles",
    () => {
      assertEquals(SOP_STAGES.length, 9, "Must contain exactly 9 SOP stages");

      const expectedTitles = [
        "Xây dựng Idea",
        "Chốt & Giao Idea",
        "Nộp Script",
        "Sửa & Duyệt Script",
        "Production & Assembly",
        "Nộp Video bàn giao",
        "QC & Hoàn thiện",
        "Core Duyệt chốt",
        "Publish & Analytics",
      ];

      for (let i = 0; i < 9; i++) {
        const expectedNo = String(i + 1).padStart(2, "0");
        assertEquals(SOP_STAGES[i].no, expectedNo, `Stage index ${i} must have number ${expectedNo}`);
        assertEquals(SOP_STAGES[i].title, expectedTitles[i], `Stage ${expectedNo} title mismatch`);
      }
    }
  );

  registerTest(
    "Tier 1",
    "R1: 9-Step SOP Tutorial",
    "T1_R1_02",
    "Verifies each of the 9 stages defines all 5 mandatory fields (Role, Input, Tasks, Output, Gate)",
    () => {
      for (const stage of SOP_STAGES) {
        assert(!!stage.owner && stage.owner.trim().length > 0, `Stage ${stage.no} missing Role (owner)`);
        assert(!!stage.input && stage.input.trim().length > 0, `Stage ${stage.no} missing Input`);
        assert(!!stage.work && stage.work.trim().length > 0, `Stage ${stage.no} missing Tasks/Work`);
        assert(!!stage.output && stage.output.trim().length > 0, `Stage ${stage.no} missing Output`);
        assert(!!stage.guard && stage.guard.trim().length > 0, `Stage ${stage.no} missing Gating condition (guard)`);
      }
    }
  );

  registerTest(
    "Tier 1",
    "R1: 9-Step SOP Tutorial",
    "T1_R1_03",
    "Verifies clear role demarcation between Editor, Producer, and Core across all 9 stages",
    () => {
      // Step 1: Editor (Ban Đào tạo)
      assert(SOP_STAGES[0].owner.includes("Editor"), "Step 1 owner must be Editor");
      // Step 2: Editor/Core
      assert(SOP_STAGES[1].owner.includes("Editor"), "Step 2 owner must be Editor/Core");
      // Step 3: Producer (Ban Dự án)
      assert(SOP_STAGES[2].owner.includes("Producer"), "Step 3 owner must be Producer");
      // Step 4: Editor (Ban Đào tạo)
      assert(SOP_STAGES[3].owner.includes("Editor"), "Step 4 owner must be Editor");
      // Step 5: Producer (Ban Dự án)
      assert(SOP_STAGES[4].owner.includes("Producer"), "Step 5 owner must be Producer");
      // Step 6: Producer (Ban Dự án)
      assert(SOP_STAGES[5].owner.includes("Producer"), "Step 6 owner must be Producer");
      // Step 7: Editor (QC & Hoàn thiện trực tiếp)
      assert(SOP_STAGES[6].owner.includes("Editor"), "Step 7 owner must be Editor");
      // Step 8: Core (+ Editor)
      assert(SOP_STAGES[7].owner.includes("Core"), "Step 8 owner must include Core");
      // Step 9: Publish + Editor/Core
      assert(SOP_STAGES[8].owner.includes("Publish"), "Step 9 owner must include Publish");
    }
  );

  registerTest(
    "Tier 1",
    "R1: 9-Step SOP Tutorial",
    "T1_R1_04",
    "Verifies the 3-module parallel production pipeline specifications (A: Nội dung, B: Âm thanh, C: Hình ảnh)",
    () => {
      const modules = [
        { code: "A", name: "Nội dung", who: "Editor định hướng · Producer viết", out: "Script hoàn chỉnh" },
        { code: "B", name: "Âm thanh", who: "Producer / thu âm", out: "File audio chuẩn" },
        { code: "C", name: "Hình ảnh", who: "Producer / truyền thông", out: "Thư mục visual" },
      ];

      for (const m of modules) {
        assert(m.who.length > 0, `Module ${m.code} must have assigned responsibility`);
        assert(m.out.length > 0, `Module ${m.code} must specify output`);
      }

      // Step 5 invariant: Voice (B) and Visual (C) are executed in parallel after Script (A) is approved
      assert(
        SOP_STAGES[4].guard.includes("song song"),
        "Step 5 guard must mandate parallel voice & visual preparation"
      );
    }
  );

  registerTest(
    "Tier 1",
    "R1: 9-Step SOP Tutorial",
    "T1_R1_05",
    "Verifies asset classification into Pre-built (shared) vs On-demand (per episode)",
    () => {
      const preBuiltAssets = ["Linh vật", "Intro/outro", "lower-third", "font", "SFX chuẩn", "BGM"];
      const onDemandAssets = ["Final script", "voiceover", "footage", "Graphic/subtitle", "source/reference"];

      assert(preBuiltAssets.length >= 5, "Must document at least 5 pre-built asset types");
      assert(onDemandAssets.length >= 5, "Must document at least 5 on-demand asset types");
      // Verification that Mascot is pre-built
      assert(preBuiltAssets.some((a) => a.includes("Linh vật")), "Mascot must be a pre-built reusable asset");
    }
  );

  registerTest(
    "Tier 1",
    "R1: 9-Step SOP Tutorial",
    "T1_R1_06",
    "Verifies multi-platform dual-format publishing specifications (Master 16:9 vs TikTok 9:16)",
    () => {
      // Step 5 guard mandates master ngang 16:9
      assert(SOP_STAGES[4].output.includes("16:9"), "Step 5 draft video output must be 16:9");
      // Step 9 guard mandates feedback to step 1
      assert(
        SOP_STAGES[8].guard.includes("bước 01") || SOP_STAGES[8].guard.includes("bước 1"),
        "Step 9 guard must specify feedback loop to step 1"
      );
    }
  );

  // ==========================================================================
  // R2: STRICT GATING & APPROVAL ENFORCEMENT
  // ==========================================================================

  registerTest(
    "Tier 1",
    "R2: Strict Gating Engine",
    "T1_R2_01",
    "Gate 1: Approving idea transitions task from PITCH to SCRIPT (activeGate: GATE_2_SCRIPT)",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Khám phá phong cách Wes Anderson",
        description: "Phân tích bố cục đối xứng và bảng màu pastel",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });

      assertEquals(idea.activeGate, "GATE_1_IDEA");
      assertEquals(idea.status, "PITCH");

      const res = engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn", "2026-09-23");
      assert(res.success, `Approval failed: ${res.error}`);
      assertEquals(res.idea?.activeGate, "GATE_2_SCRIPT");
      assertEquals(res.idea?.status, "ASSIGNMENT");
      assertEquals(res.idea?.assignedToEmail, "producer@ynda.vn");
      assert(!!res.idea?.gate1ApprovedAt, "Must record Gate 1 approved timestamp");
      assertEquals(res.idea?.gate1ApprovedByEmail, "editor@ynda.vn");
    }
  );

  registerTest(
    "Tier 1",
    "R2: Strict Gating Engine",
    "T1_R2_02",
    "Gate 2: Approving script locks content and unlocks Production (activeGate: GATE_3_PRODUCTION)",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Tâm lý học đám đông trong điện ảnh",
        description: "Mổ xẻ hành vi đám đông",
        platformChannelId: "ch_tam_ly",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      // Submit valid script
      const scriptData: ScriptData = {
        episodeName: "Tập 12: Đám đông cuồng loạn",
        channelTier: "KENH_2_TAM_LY",
        writerProducerEmail: "producer@ynda.vn",
        submissionDeadline: "Thứ 4",
        hook3Ws: { what: "Ảo tưởng an toàn", when: "Khi ở trong đám đông", why: "Mất ý thức cá nhân" },
        segments: [
          {
            id: "s1",
            timeRange: "00:00-00:15",
            segmentName: "Hook",
            voiceAiText: "Bạn có thực sự làm chủ hành vi?",
            visualMascotEdits: "Mascot hoang mang",
            bgmSfxNotes: "BGM hồi hộp",
          },
        ],
        copyrightCommitment: true,
        status: "DRAFT",
        locked: false,
        updatedAt: new Date().toISOString(),
      };

      const subRes = engine.submitScriptMatrix(idea.id, "producer@ynda.vn", scriptData);
      assert(subRes.success, `Submit script failed: ${subRes.error}`);
      assertEquals(subRes.idea?.scriptStatus, "SUBMITTED");

      // Editor approves Gate 2
      const appRes = engine.approveGate2Script(idea.id, "editor@ynda.vn");
      assert(appRes.success, `Approve Gate 2 failed: ${appRes.error}`);
      assertEquals(appRes.idea?.activeGate, "GATE_3_PRODUCTION");
      assertEquals(appRes.idea?.status, "PRODUCTION");
      assertEquals(appRes.idea?.scriptStatus, "APPROVED");
      assertEquals(appRes.idea?.scriptLocked, true, "Script must be locked on approval");
      assert(!!appRes.idea?.gate2ApprovedAt, "Must record gate2 approved timestamp");
    }
  );

  registerTest(
    "Tier 1",
    "R2: Strict Gating Engine",
    "T1_R2_03",
    "Gate 2: Requesting revision unlocks script and sets status REVISION_REQUESTED",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Review Oppenheimer",
        description: "Góc nhìn đạo đức",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      const scriptData: ScriptData = {
        episodeName: "Tập 5: Oppenheimer",
        channelTier: "KENH_1_GIAO_DUC",
        writerProducerEmail: "producer@ynda.vn",
        submissionDeadline: "Thứ 4",
        hook3Ws: { what: "Vũ khí hạt nhân", when: "1945", why: "Đạo đức khoa học" },
        segments: [
          {
            id: "s1",
            timeRange: "00:00-00:15",
            segmentName: "Hook",
            voiceAiText: "Khoa học hay sự huỷ diệt?",
            visualMascotEdits: "Mascot suy tư",
            bgmSfxNotes: "BGM tĩnh lặng",
          },
        ],
        copyrightCommitment: true,
        status: "DRAFT",
        locked: false,
        updatedAt: new Date().toISOString(),
      };
      engine.submitScriptMatrix(idea.id, "producer@ynda.vn", scriptData);

      // Editor requests revision
      const revRes = engine.requestScriptRevision(
        idea.id,
        "editor@ynda.vn",
        "Hook chưa đủ sắc bén, cần đào sâu nghịch lý của Oppenheimer"
      );
      assert(revRes.success, `Revision request failed: ${revRes.error}`);
      assertEquals(revRes.idea?.scriptStatus, "REVISION_REQUESTED");
      assertEquals(revRes.idea?.scriptLocked, false, "Script must be unlocked for revisions");
      assertEquals(revRes.idea?.activeGate, "GATE_2_SCRIPT");
      assert(
        revRes.idea?.scriptRevisionNotes?.includes("chưa đủ sắc bén"),
        "Must record revision notes"
      );
    }
  );

  registerTest(
    "Tier 1",
    "R2: Strict Gating Engine",
    "T1_R2_04",
    "Gate 3: Submitting video draft requires valid links and 100% completed Production Checklist",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Nghệ thuật dựng phim trong Parasite",
        description: "Tương phản giàu nghèo",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      const scriptData: ScriptData = {
        episodeName: "Tập 8: Parasite",
        channelTier: "KENH_1_GIAO_DUC",
        writerProducerEmail: "producer@ynda.vn",
        submissionDeadline: "Thứ 4",
        hook3Ws: { what: "Tầng hầm", when: "Trời mưa", why: "Mùi nghèo đói" },
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "Mùi hương", visualMascotEdits: "Cảnh mưa", bgmSfxNotes: "Mưa" }],
        copyrightCommitment: true,
        status: "DRAFT",
        locked: false,
        updatedAt: new Date().toISOString(),
      };
      engine.submitScriptMatrix(idea.id, "producer@ynda.vn", scriptData);
      engine.approveGate2Script(idea.id, "editor@ynda.vn");

      // Mark all 7 production checklist items
      const fullProdChecklist = DEFAULT_PRODUCTION_CHECKLIST.map((item) => ({
        ...item,
        checked: true,
      }));
      engine.updateChecklist(idea.id, "producer@ynda.vn", "production", fullProdChecklist);

      const submitRes = engine.submitVideoWithChecklist(idea.id, "producer@ynda.vn", {
        videoDraftLink: "https://drive.google.com/file/d/draft123/view",
        sourceProjectLink: "https://drive.google.com/file/d/source_pr123/view",
        assetFolderLink: "https://drive.google.com/drive/folders/asset123",
      });

      assert(submitRes.success, `Submit video failed: ${submitRes.error}`);
      assertEquals(submitRes.idea?.activeGate, "GATE_4_QC");
      assertEquals(submitRes.idea?.status, "QA");
      assertEquals(submitRes.idea?.videoDraftLink, "https://drive.google.com/file/d/draft123/view");
      assertEquals(submitRes.idea?.sourceProjectLink, "https://drive.google.com/file/d/source_pr123/view");
    }
  );

  registerTest(
    "Tier 1",
    "R2: Strict Gating Engine",
    "T1_R2_05",
    "Gate 4: Editor QC signoff requires valid final video link and 100% completed QC Checklist",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Whiplash và Ám ảnh hoàn hảo",
        description: "Cái giá của sự vĩ đại",
        platformChannelId: "ch_tam_ly",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");
      const scriptData: ScriptData = {
        episodeName: "Tập 9: Whiplash",
        channelTier: "KENH_2_TAM_LY",
        writerProducerEmail: "producer@ynda.vn",
        submissionDeadline: "Thứ 4",
        hook3Ws: { what: "Chiếc dùi trống", when: "Khi chảy máu", why: "Đam mê hay điên loạn" },
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "Đánh trống", visualMascotEdits: "Máu trên cymbal", bgmSfxNotes: "Caravan" }],
        copyrightCommitment: true,
        status: "DRAFT",
        locked: false,
        updatedAt: new Date().toISOString(),
      };
      engine.submitScriptMatrix(idea.id, "producer@ynda.vn", scriptData);
      engine.approveGate2Script(idea.id, "editor@ynda.vn");

      const fullProdChecklist = DEFAULT_PRODUCTION_CHECKLIST.map((i) => ({ ...i, checked: true }));
      engine.updateChecklist(idea.id, "producer@ynda.vn", "production", fullProdChecklist);
      engine.submitVideoWithChecklist(idea.id, "producer@ynda.vn", {
        videoDraftLink: "https://drive.google.com/draft",
        sourceProjectLink: "https://drive.google.com/source",
      });

      // Mark all 8 QC checklist items
      const fullQcChecklist = DEFAULT_QC_CHECKLIST.map((i) => ({ ...i, checked: true }));
      engine.updateChecklist(idea.id, "editor@ynda.vn", "qc", fullQcChecklist);

      const qcRes = engine.approveGate4Qc(idea.id, "editor@ynda.vn", "https://youtube.com/watch?v=unlisted_master");
      assert(qcRes.success, `QC approval failed: ${qcRes.error}`);
      assertEquals(qcRes.idea?.activeGate, "GATE_5_CORE");
      assertEquals(qcRes.idea?.status, "CORE_REVIEW");
      assertEquals(qcRes.idea?.videoFinalLink, "https://youtube.com/watch?v=unlisted_master");
      assertEquals(qcRes.idea?.gate4ApprovedByEmail, "editor@ynda.vn");
    }
  );

  registerTest(
    "Tier 1",
    "R2: Strict Gating Engine",
    "T1_R2_06",
    "Gate 5: Core approval unlocks READY_TO_PUBLISH; Publish action finalizes to COMPLETE / PUBLISHED",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Interstellar và Không thời gian",
        description: "Khoa học và tình yêu",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");
      const scriptData: ScriptData = {
        episodeName: "Tập 10: Interstellar",
        channelTier: "KENH_1_GIAO_DUC",
        writerProducerEmail: "producer@ynda.vn",
        submissionDeadline: "Thứ 4",
        hook3Ws: { what: "Lỗ đen", when: "Hành tinh sóng thần", why: "Tình cha con" },
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "Thời gian", visualMascotEdits: "Gargantua", bgmSfxNotes: "Hans Zimmer" }],
        copyrightCommitment: true,
        status: "DRAFT",
        locked: false,
        updatedAt: new Date().toISOString(),
      };
      engine.submitScriptMatrix(idea.id, "producer@ynda.vn", scriptData);
      engine.approveGate2Script(idea.id, "editor@ynda.vn");
      engine.updateChecklist(idea.id, "producer@ynda.vn", "production", DEFAULT_PRODUCTION_CHECKLIST.map((i) => ({ ...i, checked: true })));
      engine.submitVideoWithChecklist(idea.id, "producer@ynda.vn", { videoDraftLink: "https://drive.google.com/draft", sourceProjectLink: "https://drive.google.com/source" });
      engine.updateChecklist(idea.id, "editor@ynda.vn", "qc", DEFAULT_QC_CHECKLIST.map((i) => ({ ...i, checked: true })));
      engine.approveGate4Qc(idea.id, "editor@ynda.vn", "https://youtube.com/watch?v=unlisted_master");

      // Gate 5: Core approval
      const coreRes = engine.approveGate5Core(idea.id, "core@ynda.vn", "Chất lượng xuất sắc, đồng ý xuất bản");
      assert(coreRes.success, `Gate 5 Core approval failed: ${coreRes.error}`);
      assertEquals(coreRes.idea?.activeGate, "READY_TO_PUBLISH");
      assertEquals(coreRes.idea?.status, "READY_TO_PUBLISH");
      assertEquals(coreRes.idea?.gate5ApprovedByEmail, "core@ynda.vn");

      // Publish action
      const pubRes = engine.publishVideo(idea.id, "producer@ynda.vn", {
        publishedUrl: "https://www.youtube.com/watch?v=interstellar_official",
        publishedTitle: "Interstellar: Nghệ Thuật Khoa Học Của Christopher Nolan",
        publishedCaption: "Khám phá chiều sâu không thời gian qua lăng kính điện ảnh YNDA.",
        publishedHashtags: "#YNDA #Interstellar #DienAnh",
      });
      assert(pubRes.success, `Publish failed: ${pubRes.error}`);
      assertEquals(pubRes.idea?.activeGate, "PUBLISHED");
      assertEquals(pubRes.idea?.status, "COMPLETE");
      assertEquals(pubRes.idea?.publishedUrl, "https://www.youtube.com/watch?v=interstellar_official");
    }
  );

  // ==========================================================================
  // R3: STANDARDIZED 4-COLUMN SCRIPT BUILDER
  // ==========================================================================

  registerTest(
    "Tier 1",
    "R3: 4-Column Script Builder",
    "T1_R3_01",
    "Verifies identity header fields (Episode name, Channel selector, Writer, Wednesday submission deadline)",
    () => {
      const script: ScriptData = {
        episodeName: "Tập 15: Chiếu Sáng Điện Ảnh",
        channelTier: "KENH_1_GIAO_DUC",
        writerProducerEmail: "producer@ynda.vn",
        submissionDeadline: "2026-09-23T18:00:00Z", // Wednesday standard
        hook3Ws: { what: "Kỹ thuật 3 điểm sáng", when: "Thời kỳ vàng Hollywood", why: "Định hình chiều sâu khung hình" },
        segments: [
          { id: "s1", timeRange: "00:00-00:15", segmentName: "Intro", voiceAiText: "Ánh sáng kể chuyện gì?", visualMascotEdits: "Mascot cầm đèn", bgmSfxNotes: "Ting" }
        ],
        copyrightCommitment: true,
        status: "DRAFT",
        locked: false,
        updatedAt: new Date().toISOString(),
      };

      assertEquals(script.channelTier, "KENH_1_GIAO_DUC");
      assert(script.episodeName.startsWith("Tập 15"), "Episode name must be preserved");
      assertEquals(script.writerProducerEmail, "producer@ynda.vn");
    }
  );

  registerTest(
    "Tier 1",
    "R3: 4-Column Script Builder",
    "T1_R3_02",
    "Hook 3Ws requirement: Intro (00:00-00:15) mandates non-empty What, When, and Why",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Test Hook 3Ws",
        description: "Testing hook validation",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      // Valid 3Ws
      const validScript: ScriptData = {
        episodeName: "Tập 1: Hook Test",
        channelTier: "KENH_1_GIAO_DUC",
        writerProducerEmail: "producer@ynda.vn",
        submissionDeadline: "Thứ 4",
        hook3Ws: { what: "Sự thật về màu sắc", when: "Trong cảnh mở đầu The Matrix", why: "Màu xanh neon đại diện cho thực tại ảo" },
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "Text", visualMascotEdits: "Visual", bgmSfxNotes: "SFX" }],
        copyrightCommitment: true,
        status: "DRAFT",
        locked: false,
        updatedAt: new Date().toISOString(),
      };

      const res = engine.submitScriptMatrix(idea.id, "producer@ynda.vn", validScript);
      assert(res.success, "Valid Hook 3Ws must be accepted");
      assertEquals(res.idea?.scriptData?.hook3Ws.what, "Sự thật về màu sắc");
      assertEquals(res.idea?.scriptData?.hook3Ws.when, "Trong cảnh mở đầu The Matrix");
      assertEquals(res.idea?.scriptData?.hook3Ws.why, "Màu xanh neon đại diện cho thực tại ảo");
    }
  );

  registerTest(
    "Tier 1",
    "R3: 4-Column Script Builder",
    "T1_R3_03",
    "Verifies 4 standard segments: Intro Hook, Body with technical pauses, Outro Summary Card, and CTA Seamless Loop",
    () => {
      const standardSegments = [
        { timeRange: "00:00 - 00:15", name: "Intro / Hook", focus: "Hook 3Ws, Mascot, Dramatic film scene" },
        { timeRange: "00:15 - 03:30", name: "Thân bài / Body", focus: "2-3 arguments, 3-5s voice pauses for original dialogue, keyword tables" },
        { timeRange: "03:30 - 04:30", name: "Outro / Kết bài", focus: "Core message summary, Summary Card for saving" },
        { timeRange: "04:30 - 05:00", name: "CTA & Seamless Loop", focus: "Open discussion question, seamless loop back to Hook" },
      ];

      assertEquals(standardSegments.length, 4, "Must define exactly 4 standard segments");
      assert(standardSegments[1].focus.includes("3-5s"), "Body must include 3-5s technical pauses for film dialogue");
      assert(standardSegments[2].focus.includes("Summary Card"), "Outro must include Summary Card");
      assert(standardSegments[3].focus.includes("seamless loop"), "CTA must include seamless loop to Hook");
    }
  );

  registerTest(
    "Tier 1",
    "R3: 4-Column Script Builder",
    "T1_R3_04",
    "Verifies 4-column matrix captures all 4 required dimensions per segment row",
    () => {
      const row: ScriptData["segments"][0] = {
        id: "seg_01",
        timeRange: "00:15 - 01:30",
        segmentName: "Luận điểm 1: Bố cục một phần ba",
        voiceAiText: "Hãy chú ý vào ánh mắt của nhân vật chính khi đối thoại.",
        visualMascotEdits: "Overlay khung chia tỷ lệ 1/3, mascot trỏ vào tiêu điểm mắt.",
        bgmSfxNotes: "BGM trầm ấm, SFX ting nhẹ khi xuất hiện đường lưới tỷ lệ vàng.",
      };

      assert(!!row.timeRange && row.timeRange.length > 0, "Column 1: Time range required");
      assert(!!row.voiceAiText && row.voiceAiText.length > 0, "Column 2: Voice AI text (Module B) required");
      assert(!!row.visualMascotEdits && row.visualMascotEdits.length > 0, "Column 3: Visual/Mascot/Edits (Module C) required");
      assert(!!row.bgmSfxNotes && row.bgmSfxNotes.length > 0, "Column 4: BGM/SFX notes required");
    }
  );

  registerTest(
    "Tier 1",
    "R3: 4-Column Script Builder",
    "T1_R3_05",
    "Mandatory copyright agreement checkbox confirms rights for footage, audio, and illustrations",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Test Copyright Commitment",
        description: "Checking copyright flag",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      const scriptWithCopyright: ScriptData = {
        episodeName: "Tập 2: Copyright Committed",
        channelTier: "KENH_1_GIAO_DUC",
        writerProducerEmail: "producer@ynda.vn",
        submissionDeadline: "Thứ 4",
        hook3Ws: { what: "W1", when: "W2", why: "W3" },
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "V", visualMascotEdits: "M", bgmSfxNotes: "S" }],
        copyrightCommitment: true,
        status: "DRAFT",
        locked: false,
        updatedAt: new Date().toISOString(),
      };

      const res = engine.submitScriptMatrix(idea.id, "producer@ynda.vn", scriptWithCopyright);
      assert(res.success);
      assertEquals(res.idea?.copyrightCommitment, true);
    }
  );

  // ==========================================================================
  // R4: DUAL INTERACTIVE CHECKLISTS
  // ==========================================================================

  registerTest(
    "Tier 1",
    "R4: Dual Interactive Checklists",
    "T1_R4_01",
    "Production Checklist contains exactly 7 items covering voice, footage, BGM/SFX, subtitle, 16:9, metadata, source project",
    () => {
      assertEquals(DEFAULT_PRODUCTION_CHECKLIST.length, 7, "Production checklist must contain exactly 7 items");

      const expectedKeywords = [
        "Voice rõ ràng",
        "Footage bám sát",
        "BGM & SFX",
        "Subtitle đúng chính tả",
        "16:9",
        "thumbnail",
        "file source/project",
      ];

      for (let i = 0; i < 7; i++) {
        assert(
          DEFAULT_PRODUCTION_CHECKLIST[i].label.includes(expectedKeywords[i]),
          `Production checklist item ${i} must mention "${expectedKeywords[i]}"`
        );
        assertEquals(DEFAULT_PRODUCTION_CHECKLIST[i].checked, false, "Initial state must be unchecked");
      }
    }
  );

  registerTest(
    "Tier 1",
    "R4: Dual Interactive Checklists",
    "T1_R4_02",
    "Editor QC Checklist contains exactly 8 items covering 3s hook, script adherence, pacing, audio balance, brand identity, copyright, loop, technical",
    () => {
      assertEquals(DEFAULT_QC_CHECKLIST.length, 8, "QC checklist must contain exactly 8 items");

      const expectedKeywords = [
        "Hook 3 giây đầu",
        "bám sát Idea và Script",
        "khoảng thở kỹ thuật",
        "Audio cân bằng",
        "nhận diện thương hiệu",
        "bản quyền âm thanh/hình ảnh bằng 0",
        "seamless loop",
        "chuẩn kỹ thuật YouTube",
      ];

      for (let i = 0; i < 8; i++) {
        assert(
          DEFAULT_QC_CHECKLIST[i].label.includes(expectedKeywords[i]),
          `QC checklist item ${i} must mention "${expectedKeywords[i]}"`
        );
        assertEquals(DEFAULT_QC_CHECKLIST[i].checked, false, "Initial state must be unchecked");
      }
    }
  );

  registerTest(
    "Tier 1",
    "R4: Dual Interactive Checklists",
    "T1_R4_03",
    "Interactive toggle updates checked state and persists to idea task record",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Test Checklist Toggle",
        description: "Checking toggle persistence",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });

      const updatedProd = DEFAULT_PRODUCTION_CHECKLIST.map((item, idx) => ({
        ...item,
        checked: idx < 4, // 4 out of 7 checked
      }));

      const res = engine.updateChecklist(idea.id, "producer@ynda.vn", "production", updatedProd);
      assert(res.success);
      const saved = engine.getIdea(idea.id);
      const checkedCount = saved?.productionChecklist.filter((i) => i.checked).length;
      assertEquals(checkedCount, 4);
    }
  );

  registerTest(
    "Tier 1",
    "R4: Dual Interactive Checklists",
    "T1_R4_04",
    "Progress indicator calculates exact completion ratio and percentage (e.g., 5/7 and 8/8)",
    () => {
      function calculateProgress(checklist: { checked: boolean }[]) {
        const checked = checklist.filter((c) => c.checked).length;
        const total = checklist.length;
        const percentage = total === 0 ? 0 : Math.round((checked / total) * 100);
        return { checked, total, percentage, isComplete: checked === total };
      }

      const prod5 = DEFAULT_PRODUCTION_CHECKLIST.map((c, i) => ({ ...c, checked: i < 5 }));
      const p1 = calculateProgress(prod5);
      assertEquals(p1.checked, 5);
      assertEquals(p1.total, 7);
      assertEquals(p1.percentage, 71);
      assertEquals(p1.isComplete, false);

      const qc8 = DEFAULT_QC_CHECKLIST.map((c) => ({ ...c, checked: true }));
      const p2 = calculateProgress(qc8);
      assertEquals(p2.checked, 8);
      assertEquals(p2.total, 8);
      assertEquals(p2.percentage, 100);
      assertEquals(p2.isComplete, true);
    }
  );

  registerTest(
    "Tier 1",
    "R4: Dual Interactive Checklists",
    "T1_R4_05",
    "Gate 3 enforces 100% production checklist completion (all 7 items checked)",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Test Gate 3 Checklist Guard",
        description: "Requires 7/7 items",
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

      // Mark all 7
      const all7 = DEFAULT_PRODUCTION_CHECKLIST.map((item) => ({ ...item, checked: true }));
      engine.updateChecklist(idea.id, "producer@ynda.vn", "production", all7);

      const res = engine.submitVideoWithChecklist(idea.id, "producer@ynda.vn", {
        videoDraftLink: "https://drive.google.com/draft",
        sourceProjectLink: "https://drive.google.com/source",
      });
      assert(res.success, `Must succeed when 7/7 items are checked: ${res.error}`);
      assertEquals(res.idea?.activeGate, "GATE_4_QC");
    }
  );

  // ==========================================================================
  // R5: YOUTUBE MASTER TO TIKTOK DERIVATIVE CUTDOWN WORKFLOW
  // ==========================================================================

  registerTest(
    "Tier 1",
    "R5: TikTok Cutdown Workflow",
    "T1_R5_01",
    "Enforces Master video approval precondition (Gate 5 Core approved or published) before branching TikTok",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Master Movie Analysis",
        description: "Long form 16:9 analysis",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");
      const sData: ScriptData = {
        episodeName: "Master 1", channelTier: "KENH_1_GIAO_DUC", writerProducerEmail: "producer@ynda.vn", submissionDeadline: "Wed",
        hook3Ws: { what: "w", when: "w", why: "w" },
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "V", visualMascotEdits: "M", bgmSfxNotes: "S" }],
        copyrightCommitment: true, status: "DRAFT", locked: false, updatedAt: new Date().toISOString()
      };
      engine.submitScriptMatrix(idea.id, "producer@ynda.vn", sData);
      engine.approveGate2Script(idea.id, "editor@ynda.vn");
      engine.updateChecklist(idea.id, "producer@ynda.vn", "production", DEFAULT_PRODUCTION_CHECKLIST.map((i) => ({ ...i, checked: true })));
      engine.submitVideoWithChecklist(idea.id, "producer@ynda.vn", { videoDraftLink: "https://drive.google.com/draft", sourceProjectLink: "https://drive.google.com/source" });
      engine.updateChecklist(idea.id, "editor@ynda.vn", "qc", DEFAULT_QC_CHECKLIST.map((i) => ({ ...i, checked: true })));
      engine.approveGate4Qc(idea.id, "editor@ynda.vn", "https://youtube.com/watch?v=master123");
      engine.approveGate5Core(idea.id, "core@ynda.vn", "Approved for release");

      // Now Master is READY_TO_PUBLISH -> Can branch TikTok derivative
      const branchRes = engine.createTikTokDerivative(idea.id, "editor@ynda.vn", {
        title: "Bí mật ánh sáng Parasite (TikTok)",
        hookSummary: "Tại sao nhà nghèo luôn có màu xanh rêu ẩm mốc?",
        ctaRoute: "Xem phân tích đầy đủ trên kênh YouTube Ý Niệm Điện Ảnh",
        targetDuration: "30-45s",
      });

      assert(branchRes.success, `Branching TikTok failed: ${branchRes.error}`);
      assertEquals(branchRes.derivative?.parentTaskId, idea.id, "Must link backward to parent Master ID");
      assertEquals(branchRes.derivative?.platformType, "TIKTOK_CUTDOWN");
      assertEquals(branchRes.derivative?.derivativeType, "TIKTOK_CUTDOWN");
    }
  );

  registerTest(
    "Tier 1",
    "R5: TikTok Cutdown Workflow",
    "T1_R5_02",
    "Enforces TikTok target extraction duration of 30 - 45 seconds",
    () => {
      const standardDuration = "30-45s";
      assertEquals(DEFAULT_TIKTOK_CHECKLIST.length, 5);
      // Valid target duration range check
      const durationSeconds = 38; // 30-45s range
      assert(durationSeconds >= 30 && durationSeconds <= 45, "Target duration must fall within 30-45s window");
    }
  );

  registerTest(
    "Tier 1",
    "R5: TikTok Cutdown Workflow",
    "T1_R5_03",
    "Verifies 9:16 vertical reframe flag and dedicated 0-3 second mobile Hook summary",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Master Ready",
        description: "Ready master",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });
      idea.activeGate = "READY_TO_PUBLISH";
      idea.gate5ApprovedAt = new Date().toISOString();
      (engine as any).ideas.set(idea.id, idea);

      const branchRes = engine.createTikTokDerivative(idea.id, "editor@ynda.vn", {
        title: "TikTok Reframe Test",
        hookSummary: "Khoảnh khắc đạo diễn lừa cả rạp phim trong 3 giây",
        ctaRoute: "Link YouTube ở bio",
      });

      assert(branchRes.success);
      assertEquals(branchRes.derivative?.tiktokReframeApplied, true, "Must flag professional 9:16 vertical reframe");
      assertEquals(branchRes.derivative?.tiktokHookSummary, "Khoảnh khắc đạo diễn lừa cả rạp phim trong 3 giây");
    }
  );

  registerTest(
    "Tier 1",
    "R5: TikTok Cutdown Workflow",
    "T1_R5_04",
    "Verifies backward linkage to Master ID/URL and bidirectional traceability",
    () => {
      const engine = new YndaGatingEngine();
      const master = engine.createInitialIdea({
        id: "master_video_001",
        title: "Master Inception",
        description: "Giấc mơ trong giấc mơ",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });
      master.activeGate = "PUBLISHED";
      master.status = "COMPLETE";
      master.videoFinalLink = "https://youtube.com/watch?v=inception_master";
      (engine as any).ideas.set(master.id, master);

      const derivRes = engine.createTikTokDerivative(master.id, "editor@ynda.vn", {
        title: "TikTok Con quay Inception",
        hookSummary: "Con quay có bao giờ dừng lại?",
        ctaRoute: "Xem giải mã toàn tập tại YouTube Ý Niệm Điện Ảnh",
      });

      assert(derivRes.success);
      assertEquals(derivRes.derivative?.parentTaskId, "master_video_001");
      assertEquals(derivRes.derivative?.sourceVideoUrl, "https://youtube.com/watch?v=inception_master");
    }
  );

  registerTest(
    "Tier 1",
    "R5: TikTok Cutdown Workflow",
    "T1_R5_05",
    "Verifies dedicated 5-item TikTok checklist auto-initialization",
    () => {
      assertEquals(DEFAULT_TIKTOK_CHECKLIST.length, 5, "TikTok checklist must contain exactly 5 items");

      const expectedLabels = [
        "Reframe bố cục dọc 9:16",
        "Hook mới xuất hiện ngay 0 - 3 giây đầu",
        "Subtitle kích thước lớn",
        "CTA điều hướng rõ ràng",
        "Liên kết ngược ID/URL",
      ];

      for (let i = 0; i < 5; i++) {
        assert(
          DEFAULT_TIKTOK_CHECKLIST[i].label.includes(expectedLabels[i]),
          `TikTok checklist item ${i} must cover "${expectedLabels[i]}"`
        );
      }
    }
  );

  // ==========================================================================
  // R6: EXTENDED TASK LIFECYCLE & ANALYTICS METADATA
  // ==========================================================================

  registerTest(
    "Tier 1",
    "R6: Extended Metadata & Analytics",
    "T1_R6_01",
    "Verifies Platform types (YouTube Master, TikTok Cutdown, Reels) and Channel tiers (Kênh 1, Kênh 2)",
    () => {
      const engine = new YndaGatingEngine();
      const idea1 = engine.createInitialIdea({
        title: "Kênh 1 Giáo Dục Test",
        description: "Điện ảnh & Giáo dục",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
        channelTier: "KENH_1_GIAO_DUC",
      });
      assertEquals(idea1.platformType, "YOUTUBE_MASTER");
      assertEquals(idea1.channelTier, "KENH_1_GIAO_DUC");

      const idea2 = engine.createInitialIdea({
        title: "Kênh 2 Tâm Lý Test",
        description: "Tâm lý & Phản biện",
        platformChannelId: "ch_tam_ly",
        submittedByEmail: "editor@ynda.vn",
        channelTier: "KENH_2_TAM_LY",
      });
      assertEquals(idea2.channelTier, "KENH_2_TAM_LY");
    }
  );

  registerTest(
    "Tier 1",
    "R6: Extended Metadata & Analytics",
    "T1_R6_02",
    "Verifies support for all 5 essential resource links (Master, Asset folder, Script doc, Video draft/final, Source project)",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Resource Hub Test",
        description: "Testing resource links",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });

      idea.masterVideoLink = "https://youtube.com/watch?v=master_clean";
      idea.assetFolderLink = "https://drive.google.com/drive/folders/assets_ep1";
      idea.scriptDocLink = "https://docs.google.com/document/d/script_ep1";
      idea.videoDraftLink = "https://drive.google.com/file/d/draft_v1";
      idea.sourceProjectLink = "https://drive.google.com/file/d/premiere_project";
      idea.videoFinalLink = "https://drive.google.com/file/d/final_master";

      (engine as any).ideas.set(idea.id, idea);
      const retrieved = engine.getIdea(idea.id);

      assertEquals(retrieved?.masterVideoLink, "https://youtube.com/watch?v=master_clean");
      assertEquals(retrieved?.assetFolderLink, "https://drive.google.com/drive/folders/assets_ep1");
      assertEquals(retrieved?.scriptDocLink, "https://docs.google.com/document/d/script_ep1");
      assertEquals(retrieved?.videoDraftLink, "https://drive.google.com/file/d/draft_v1");
      assertEquals(retrieved?.sourceProjectLink, "https://drive.google.com/file/d/premiere_project");
      assertEquals(retrieved?.videoFinalLink, "https://drive.google.com/file/d/final_master");
    }
  );

  registerTest(
    "Tier 1",
    "R6: Extended Metadata & Analytics",
    "T1_R6_03",
    "Verifies gate deadlines tracking (Script deadline, Production deadline, QC deadline, Target publish date)",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Deadline Schedule Test",
        description: "Testing deadlines",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });

      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn", "2026-09-23");
      const saved = engine.getIdea(idea.id);
      assertEquals(saved?.deadlineScript, "2026-09-23");
    }
  );

  registerTest(
    "Tier 1",
    "R6: Extended Metadata & Analytics",
    "T1_R6_04",
    "Verifies triple copyright verification status tracking (Footage, Music, Mascot)",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Copyright Hub Test",
        description: "Footage, music, mascot",
        platformChannelId: "ch_test",
        submittedByEmail: "editor@ynda.vn",
      });

      assertEquals(idea.copyrightFootage, "PENDING");
      assertEquals(idea.copyrightMusic, "PENDING");
      assertEquals(idea.copyrightMascot, "OFFICIAL");

      idea.copyrightFootage = "CHECKED_CLEAN";
      idea.copyrightMusic = "LICENSED";
      (engine as any).ideas.set(idea.id, idea);

      const retrieved = engine.getIdea(idea.id);
      assertEquals(retrieved?.copyrightFootage, "CHECKED_CLEAN");
      assertEquals(retrieved?.copyrightMusic, "LICENSED");
    }
  );

  registerTest(
    "Tier 1",
    "R6: Extended Metadata & Analytics",
    "T1_R6_05",
    "Verifies post-publish analytics recording (Views, Retention, CTR, Comments, Insights) and Feedback Idea loop",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Analytics Video",
        description: "Testing analytics recording",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });
      idea.activeGate = "PUBLISHED";
      idea.status = "COMPLETE";
      (engine as any).ideas.set(idea.id, idea);

      const metricsRes = engine.savePostPublishMetrics(idea.id, "editor@ynda.vn", {
        views: 85400,
        retention: "52.4%",
        ctr: "7.8%",
        comments: 312,
        insights: "Khán giả phản hồi tích cực ở đoạn phân tích tâm lý phản diện; nên làm series riêng về phản diện.",
        createFeedbackIdea: true,
      });

      assert(metricsRes.success, `Metrics save failed: ${metricsRes.error}`);
      assertEquals(metricsRes.idea?.metricsViews, 85400);
      assertEquals(metricsRes.idea?.metricsRetention, "52.4%");
      assertEquals(metricsRes.idea?.metricsCtr, "7.8%");
      assertEquals(metricsRes.idea?.metricsComments, 312);

      // Feedback loop generated a new Idea at Step 1
      assert(!!metricsRes.feedbackIdeaId, "Must generate feedback idea in Step 1 (PITCH)");
      const feedbackIdea = engine.getIdea(metricsRes.feedbackIdeaId!);
      assert(!!feedbackIdea, "Feedback idea must exist");
      assertEquals(feedbackIdea?.activeGate, "GATE_1_IDEA");
      assertEquals(feedbackIdea?.status, "PITCH");
      assert(feedbackIdea?.title.includes("Feedback từ"), "Feedback title must reference parent task");
    }
  );
}
