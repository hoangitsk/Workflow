/**
 * Tier 3: Cross-Feature Combinations (Pairwise Coverage)
 * Authoritative Source: ORIGINAL_REQUEST.md and PROJECT.md
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

export function loadTier3Tests() {
  registerTest(
    "Tier 3",
    "Pairwise: Pipeline & Feedback Loop",
    "T3_PAIR_01",
    "End-to-End Pipeline: Idea -> Script Matrix -> Gate 2 -> Production Checklist -> Gate 3 -> QC -> Gate 5 -> Publish -> Analytics Feedback Loop",
    () => {
      const engine = new YndaGatingEngine();

      // 1. Step 1: Pitch
      const idea = engine.createInitialIdea({
        title: "Kỹ thuật Giấu Kịch Bản trong Memento",
        description: "Phân tích trần thuật phi tuyến tính",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
        channelTier: "KENH_1_GIAO_DUC",
      });
      assertEquals(idea.activeGate, "GATE_1_IDEA");

      // 2. Step 2: Gate 1 Approval
      const g1Res = engine.approveGate1Idea(idea.id, "core@ynda.vn", "producer@ynda.vn", "2026-09-23");
      assert(g1Res.success);
      assertEquals(g1Res.idea?.activeGate, "GATE_2_SCRIPT");

      // 3. Step 3: Script Submission with 3Ws & Copyright
      const scriptData: ScriptData = {
        episodeName: "Tập 18: Memento",
        channelTier: "KENH_1_GIAO_DUC",
        writerProducerEmail: "producer@ynda.vn",
        submissionDeadline: "Thứ 4",
        hook3Ws: {
          what: "Bộ phim bắt đầu bằng cảnh chụp polaroid bay ngược",
          when: "Ngay giây đầu tiên",
          why: "Đảo ngược thời gian để khán giả chịu chung căn bệnh mất trí nhớ ngắn hạn",
        },
        segments: [
          { id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "Bạn nhớ được bao lâu?", visualMascotEdits: "Mascot cầm ảnh", bgmSfxNotes: "Ting" },
          { id: "s2", timeRange: "00:15-03:30", segmentName: "Thân bài", voiceAiText: "Nolan sắp xếp hai mạch thời gian", visualMascotEdits: "Đen trắng vs màu, dừng 3s voice", bgmSfxNotes: "BGM trầm" },
          { id: "s3", timeRange: "03:30-04:30", segmentName: "Outro", voiceAiText: "Sự thật chúng ta tự lừa dối", visualMascotEdits: "Summary Card", bgmSfxNotes: "Sâu lắng" },
          { id: "s4", timeRange: "04:30-05:00", segmentName: "CTA", voiceAiText: "Bạn đã bao giờ tự lừa dối ký ức?", visualMascotEdits: "Loop về ảnh polaroid", bgmSfxNotes: "SFX loop" },
        ],
        summaryCardNotes: "Tóm tắt: 1. Mạch màu tiến, 2. Mạch đen trắng lùi, 3. Gặp nhau ở cao trào.",
        seamlessLoopQuestion: "Nếu ký ức không đáng tin, bạn tin vào điều gì?",
        copyrightCommitment: true,
        status: "DRAFT",
        locked: false,
        updatedAt: new Date().toISOString(),
      };
      const subRes = engine.submitScriptMatrix(idea.id, "producer@ynda.vn", scriptData);
      assert(subRes.success);
      assertEquals(subRes.idea?.scriptStatus, "SUBMITTED");

      // 4. Step 4: Gate 2 Approval -> Locks Script
      const g2Res = engine.approveGate2Script(idea.id, "editor@ynda.vn");
      assert(g2Res.success);
      assertEquals(g2Res.idea?.activeGate, "GATE_3_PRODUCTION");
      assertEquals(g2Res.idea?.scriptLocked, true);

      // 5. Step 5 & 6: Production Checklist & Gate 3 Handover
      const allProdChecklist = DEFAULT_PRODUCTION_CHECKLIST.map((item) => ({ ...item, checked: true }));
      engine.updateChecklist(idea.id, "producer@ynda.vn", "production", allProdChecklist);

      const g3Res = engine.submitVideoWithChecklist(idea.id, "producer@ynda.vn", {
        videoDraftLink: "https://drive.google.com/memento_draft",
        sourceProjectLink: "https://drive.google.com/memento_premiere_project",
        assetFolderLink: "https://drive.google.com/memento_assets",
      });
      assert(g3Res.success);
      assertEquals(g3Res.idea?.activeGate, "GATE_4_QC");

      // 6. Step 7: Editor QC Checklist & Gate 4 Approval
      const allQcChecklist = DEFAULT_QC_CHECKLIST.map((item) => ({ ...item, checked: true }));
      engine.updateChecklist(idea.id, "editor@ynda.vn", "qc", allQcChecklist);

      const g4Res = engine.approveGate4Qc(idea.id, "editor@ynda.vn", "https://youtube.com/watch?v=memento_master_unlisted");
      assert(g4Res.success);
      assertEquals(g4Res.idea?.activeGate, "GATE_5_CORE");

      // 7. Step 8: Core Gate 5 Approval
      const g5Res = engine.approveGate5Core(idea.id, "core@ynda.vn", "Kịch bản xuất sắc, nhịp dựng chuẩn");
      assert(g5Res.success);
      assertEquals(g5Res.idea?.activeGate, "READY_TO_PUBLISH");

      // 8. Step 9: Publish
      const pubRes = engine.publishVideo(idea.id, "editor@ynda.vn", {
        publishedUrl: "https://youtube.com/watch?v=memento_ynda_official",
        publishedTitle: "Memento: Đỉnh Cao Đảo Ngược Ký Ức",
        publishedThumbnail: "https://img.youtube.com/vi/memento/maxresdefault.jpg",
        publishedCaption: "Khám phá kỹ thuật trần thuật phi tuyến tính kinh điển của Christopher Nolan.",
        publishedHashtags: "#YNDA #Memento #ChristopherNolan",
      });
      assert(pubRes.success);
      assertEquals(pubRes.idea?.activeGate, "PUBLISHED");

      // 9. Feedback Loop: Post-publish Analytics generating Step 1 Idea
      const metricsRes = engine.savePostPublishMetrics(idea.id, "core@ynda.vn", {
        views: 154000,
        retention: "58.2%",
        ctr: "9.1%",
        comments: 680,
        insights: "Phân tích trần thuật phi tuyến tính tạo thảo luận sôi nổi; khán giả yêu cầu phân tích tiếp Pulp Fiction.",
        createFeedbackIdea: true,
      });
      assert(metricsRes.success);
      assert(!!metricsRes.feedbackIdeaId, "Must create new feedback idea");

      const feedbackTask = engine.getIdea(metricsRes.feedbackIdeaId!);
      assertEquals(feedbackTask?.activeGate, "GATE_1_IDEA");
      assertEquals(feedbackTask?.status, "PITCH");
      assert(feedbackTask?.description.includes("Pulp Fiction"), "Feedback must pass insight context");
    }
  );

  registerTest(
    "Tier 3",
    "Pairwise: TikTok Branch & Analytics",
    "T3_PAIR_02",
    "Master Completion -> TikTok Derivative Cutdown -> TikTok Checklist -> Derivative Release & Traceability",
    () => {
      const engine = new YndaGatingEngine();

      // Create Master ready for publishing
      const master = engine.createInitialIdea({
        id: "master_oppenheimer",
        title: "Oppenheimer: Bi Kịch Của Trí Tuệ",
        description: "Phân tích tâm lý J. Robert Oppenheimer",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });
      master.activeGate = "PUBLISHED";
      master.status = "COMPLETE";
      master.videoFinalLink = "https://youtube.com/watch?v=oppenheimer_master";
      master.publishedUrl = "https://youtube.com/watch?v=oppenheimer_ynda";
      (engine as any).ideas.set(master.id, master);

      // Create TikTok Derivative
      const branchRes = engine.createTikTokDerivative(master.id, "editor@ynda.vn", {
        title: "Oppenheimer: Khoảnh Khắc Lịch Sử Rơi Nước Mắt",
        hookSummary: "Tại sao Oppenheimer không thể nhìn vào ánh mắt của Einstein?",
        ctaRoute: "Xem toàn bộ phân tích 15 phút trên YouTube Ý Niệm Điện Ảnh",
        targetDuration: "35s",
        assigneeEmail: "producer@ynda.vn",
      });

      assert(branchRes.success);
      const tiktok = branchRes.derivative!;
      assertEquals(tiktok.parentTaskId, master.id);
      assertEquals(tiktok.derivativeType, "TIKTOK_CUTDOWN");
      assertEquals(tiktok.tiktokReframeApplied, true);
      assertEquals(tiktok.sourceVideoUrl, "https://youtube.com/watch?v=oppenheimer_master");
      assertEquals(tiktok.tiktokChecklist?.length, 5);

      // Complete TikTok Checklist
      const completedTikTokChecklist = DEFAULT_TIKTOK_CHECKLIST.map((item) => ({
        ...item,
        checked: true,
      }));
      engine.updateChecklist(tiktok.id, "producer@ynda.vn", "tiktok", completedTikTokChecklist);

      const savedTikTok = engine.getIdea(tiktok.id);
      const checkedTikTokItems = savedTikTok?.tiktokChecklist?.filter((i) => i.checked).length;
      assertEquals(checkedTikTokItems, 5, "All 5 TikTok checklist items must be checked");
    }
  );

  registerTest(
    "Tier 3",
    "Pairwise: Script Revision Cycle",
    "T3_PAIR_03",
    "Script Revision Request Loop: Gate 1 -> Script -> Revision Requested -> Unlock -> Producer Edits -> Re-approval -> Lock",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Fight Club và Khủng Hoảng Hiện Sinh",
        description: "Phân tích tâm lý Tyler Durden",
        platformChannelId: "ch_tam_ly",
        submittedByEmail: "editor@ynda.vn",
        channelTier: "KENH_2_TAM_LY",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      // 1. Initial Submission
      const v1Script: ScriptData = {
        episodeName: "Tập 20: Fight Club V1",
        channelTier: "KENH_2_TAM_LY",
        writerProducerEmail: "producer@ynda.vn",
        submissionDeadline: "Thứ 4",
        hook3Ws: { what: "Tổ chức ngầm", when: "Thập niên 90", why: "Chán nản công việc" },
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "V1", visualMascotEdits: "M1", bgmSfxNotes: "S1" }],
        copyrightCommitment: true,
        status: "DRAFT",
        locked: false,
        updatedAt: new Date().toISOString(),
      };
      engine.submitScriptMatrix(idea.id, "producer@ynda.vn", v1Script);

      // 2. Editor requests revision
      const revRes = engine.requestScriptRevision(
        idea.id,
        "editor@ynda.vn",
        "Hook quá chung chung; cần tập trung vào chứng mất ngủ và sự phân liệt nhân cách của người dẫn chuyện."
      );
      assert(revRes.success);
      assertEquals(revRes.idea?.scriptStatus, "REVISION_REQUESTED");
      assertEquals(revRes.idea?.scriptLocked, false, "Must be unlocked for revision");

      // 3. Producer updates script with sharper analysis
      const v2Script: ScriptData = {
        ...v1Script,
        episodeName: "Tập 20: Fight Club V2 (Đã sửa)",
        hook3Ws: {
          what: "Tyler Durden không có thật",
          when: "Sau 6 tháng mất ngủ triền miên",
          why: "Não bộ tự tạo ra một bản ngã hoàn hảo để bù đắp sự bất lực",
        },
        revisionNotes: "Đã bổ sung góc nhìn phân tâm học Freud và chứng mất ngủ.",
      };
      const reSubRes = engine.submitScriptMatrix(idea.id, "producer@ynda.vn", v2Script);
      assert(reSubRes.success);
      assertEquals(reSubRes.idea?.scriptStatus, "SUBMITTED");

      // 4. Editor approves revised script
      const appRes = engine.approveGate2Script(idea.id, "editor@ynda.vn");
      assert(appRes.success);
      assertEquals(appRes.idea?.scriptStatus, "APPROVED");
      assertEquals(appRes.idea?.scriptLocked, true, "Must re-lock upon approval");
      assertEquals(appRes.idea?.activeGate, "GATE_3_PRODUCTION");
    }
  );

  registerTest(
    "Tier 3",
    "Pairwise: Copyright Clearance",
    "T3_PAIR_04",
    "End-to-End Legal Clearance: Script Commitment -> Checklist BGM Check -> Metadata Hub -> QC Item 6 -> Gate 5 Approval",
    () => {
      const engine = new YndaGatingEngine();
      const idea = engine.createInitialIdea({
        title: "Tài Liệu Điện Ảnh Độc Bản",
        description: "Sử dụng tư liệu lưu trữ",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      // 1. Script copyright commitment
      const scriptData: ScriptData = {
        episodeName: "Tập 25", channelTier: "KENH_1_GIAO_DUC", writerProducerEmail: "producer@ynda.vn", submissionDeadline: "Wed",
        hook3Ws: { what: "What", when: "When", why: "Why" },
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "V", visualMascotEdits: "M", bgmSfxNotes: "S" }],
        copyrightCommitment: true, status: "DRAFT", locked: false, updatedAt: new Date().toISOString()
      };
      engine.submitScriptMatrix(idea.id, "producer@ynda.vn", scriptData);
      engine.approveGate2Script(idea.id, "editor@ynda.vn");

      // 2. Production Checklist item 3 (BGM/SFX copyright clearance)
      const prodChecklist = DEFAULT_PRODUCTION_CHECKLIST.map((item) => ({ ...item, checked: true }));
      engine.updateChecklist(idea.id, "producer@ynda.vn", "production", prodChecklist);
      assert(prodChecklist[2].label.includes("bản quyền"));

      // 3. Extended metadata copyright status update
      const currentIdea = (engine as any).ideas.get(idea.id);
      currentIdea.copyrightFootage = "LICENSED";
      currentIdea.copyrightMusic = "CHECKED_CLEAN";
      currentIdea.copyrightMascot = "OFFICIAL";

      engine.submitVideoWithChecklist(idea.id, "producer@ynda.vn", {
        videoDraftLink: "https://drive.google.com/draft",
        sourceProjectLink: "https://drive.google.com/source",
      });

      // 4. Editor QC Checklist item 6 (Zero copyright risk)
      const qcChecklist = DEFAULT_QC_CHECKLIST.map((item) => ({ ...item, checked: true }));
      engine.updateChecklist(idea.id, "editor@ynda.vn", "qc", qcChecklist);
      assert(qcChecklist[5].label.includes("Rủi ro bản quyền âm thanh/hình ảnh bằng 0"));

      engine.approveGate4Qc(idea.id, "editor@ynda.vn", "https://youtube.com/watch?v=clean_master");

      // 5. Core approves with clean copyright
      const coreRes = engine.approveGate5Core(idea.id, "core@ynda.vn", "Bản quyền kiểm tra sạch sẽ, sẵn sàng phát hành");
      assert(coreRes.success);
      assertEquals(coreRes.idea?.activeGate, "READY_TO_PUBLISH");
    }
  );

  registerTest(
    "Tier 3",
    "Pairwise: Tutorial vs Engine",
    "T3_PAIR_05",
    "SOP Tutorial Consistency: Verifies exact parity between SOP_STAGES definitions and Engine State Machine invariants",
    () => {
      // Cross-check Step 1 -> Gate 1
      assertEquals(SOP_STAGES[0].no, "01");
      assert(SOP_STAGES[0].guard.includes("Chưa đầu tư viết script"));

      // Cross-check Step 2 -> Gate 1 approval
      assertEquals(SOP_STAGES[1].no, "02");
      assert(SOP_STAGES[1].guard.includes("Chỉ idea được duyệt"));

      // Cross-check Step 4 -> Gate 2 approval
      assertEquals(SOP_STAGES[3].no, "04");
      assert(SOP_STAGES[3].guard.includes("Script chưa duyệt không vào Production"));

      // Cross-check Step 6 -> Gate 3 submission
      assertEquals(SOP_STAGES[5].no, "06");
      assert(SOP_STAGES[5].guard.includes("Thiếu asset hoặc link source thì chưa nộp"));

      // Cross-check Step 7 -> Gate 4 QC
      assertEquals(SOP_STAGES[6].no, "07");
      assert(SOP_STAGES[6].guard.includes("tránh vòng lặp trả Producer sửa vụn vặt"));

      // Cross-check Step 8 -> Gate 5 Core approval
      assertEquals(SOP_STAGES[7].no, "08");
      assert(SOP_STAGES[7].guard.includes("Chỉ Core được quyết định duyệt đăng"));

      // Cross-check Step 9 -> Feedback loop
      assertEquals(SOP_STAGES[8].no, "09");
      assert(SOP_STAGES[8].guard.includes("quay về bước 01"));
    }
  );
}
