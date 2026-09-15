/**
 * Tier 4: Real-World Application Scenarios
 * Minimum 5 comprehensive end-to-end production scenarios
 * Authoritative Source: ORIGINAL_REQUEST.md and PROJECT.md
 */

import {
  YndaGatingEngine,
  DEFAULT_PRODUCTION_CHECKLIST,
  DEFAULT_QC_CHECKLIST,
  DEFAULT_TIKTOK_CHECKLIST,
  registerTest,
  assert,
  assertEquals,
  type ScriptData,
} from "./harness.ts";

export function loadTier4Tests() {
  // ==========================================================================
  // SCENARIO 1: Channel 1 Educational Video Full Lifecycle (Pitch to Publish & Analytics)
  // ==========================================================================
  registerTest(
    "Tier 4",
    "Scenario 1: Channel 1 Full Lifecycle",
    "T4_SCENARIO_01",
    "Channel 1 Educational video from initial pitch to YouTube release and post-publish performance analytics",
    () => {
      const engine = new YndaGatingEngine();

      // Step 1: Pitching
      const pitch = engine.createInitialIdea({
        title: "Bí Mật Ánh Sáng Của Roger Deakins Trong Blade Runner 2049",
        description: "Phân tích nghệ thuật thị giác và cách xử lý ánh sáng tự nhiên nhân tạo",
        platformChannelId: "ch_giao_duc_dien_anh",
        submittedByEmail: "editor@ynda.vn",
        channelTier: "KENH_1_GIAO_DUC",
      });
      assertEquals(pitch.status, "PITCH");
      assertEquals(pitch.activeGate, "GATE_1_IDEA");

      // Step 2: Editor/Core approves idea at Gate 1
      const g1 = engine.approveGate1Idea(pitch.id, "editor@ynda.vn", "producer@ynda.vn", "2026-09-30");
      assert(g1.success);
      assertEquals(g1.idea?.activeGate, "GATE_2_SCRIPT");

      // Step 3: Producer writes & submits 4-column script
      const script: ScriptData = {
        episodeName: "Tập 32: Roger Deakins",
        channelTier: "KENH_1_GIAO_DUC",
        writerProducerEmail: "producer@ynda.vn",
        submissionDeadline: "2026-09-30",
        hook3Ws: {
          what: "Ánh sáng vàng cam phủ kín thành phố Las Vegas hoang tàn",
          when: "Khoảnh khắc K bước vào sòng bạc cũ",
          why: "Tạo cảm giác cô độc và hoài niệm về một nền văn minh đã mất",
        },
        segments: [
          {
            id: "seg_1",
            timeRange: "00:00 - 00:15",
            segmentName: "Intro / Hook",
            voiceAiText: "Tại sao một cảnh phim toàn cát bụi lại đẹp đến nao lòng?",
            visualMascotEdits: "Mascot đeo kính bảo hộ, cảnh sương mù vàng cam của Las Vegas",
            bgmSfxNotes: "Ting / Pop-up mở đầu, BGM synth u ám kiểu Vangelis",
          },
          {
            id: "seg_2",
            timeRange: "00:15 - 03:30",
            segmentName: "Thân bài: 3 thủ pháp của Roger Deakins",
            voiceAiText: "Thủ pháp thứ nhất: Silhouette và ánh sáng ngược. Dừng 4s lắng nghe tiếng bước chân.",
            visualMascotEdits: "Biểu đồ ánh sáng ngược, dừng voice 4s chạy thoại phim gốc",
            bgmSfxNotes: "BGM chuyển tông trầm lắng, SFX bước chân vang vọng",
          },
          {
            id: "seg_3",
            timeRange: "03:30 - 04:30",
            segmentName: "Outro: Bài học ứng dụng",
            voiceAiText: "Không cần thiết bị đắt tiền, bạn có thể tạo bóng silhouette bằng đèn bàn.",
            visualMascotEdits: "Summary Card hiển thị sơ đồ 3 bước setup ánh sáng tại nhà",
            bgmSfxNotes: "BGM dịu xuống, ấm áp",
          },
          {
            id: "seg_4",
            timeRange: "04:30 - 05:00",
            segmentName: "CTA & Loop",
            voiceAiText: "Cảnh quay nào khiến bạn choáng ngợp nhất? Đăng ký kênh và bình luận bên dưới.",
            visualMascotEdits: "Khung CTA đăng ký, logo YNDA, nối mượt về khung hình sương mù vàng",
            bgmSfxNotes: "SFX Subscribe click, chuông thông báo",
          },
        ],
        summaryCardNotes: "Tóm tắt: 1. Ánh sáng ngược tạo bóng; 2. Màu đơn sắc tạo không khí; 3. Nguồn sáng thực tế.",
        seamlessLoopQuestion: "Bạn có bao giờ tự hỏi điều gì làm nên một khung hình bất tử?",
        copyrightCommitment: true,
        status: "DRAFT",
        locked: false,
        updatedAt: new Date().toISOString(),
      };

      const g2Sub = engine.submitScriptMatrix(pitch.id, "producer@ynda.vn", script);
      assert(g2Sub.success);

      // Step 4: Editor reviews and approves Gate 2
      const g2App = engine.approveGate2Script(pitch.id, "editor@ynda.vn");
      assert(g2App.success);
      assertEquals(g2App.idea?.scriptLocked, true, "Script must be locked");

      // Step 5: Production & Checklist completion
      const prodChecklist = DEFAULT_PRODUCTION_CHECKLIST.map((item) => ({
        ...item,
        checked: true,
        checkedAt: new Date().toISOString(),
        checkedByEmail: "producer@ynda.vn",
      }));
      engine.updateChecklist(pitch.id, "producer@ynda.vn", "production", prodChecklist);

      // Step 6: Handover submission at Gate 3
      const g3Sub = engine.submitVideoWithChecklist(pitch.id, "producer@ynda.vn", {
        videoDraftLink: "https://drive.google.com/file/d/blade_runner_draft_v1",
        sourceProjectLink: "https://drive.google.com/file/d/blade_runner_prproj",
        assetFolderLink: "https://drive.google.com/drive/folders/blade_runner_raw_assets",
      });
      assert(g3Sub.success);
      assertEquals(g3Sub.idea?.activeGate, "GATE_4_QC");

      // Step 7: Editor QC directly refines and signs off Gate 4
      const qcChecklist = DEFAULT_QC_CHECKLIST.map((item) => ({
        ...item,
        checked: true,
        checkedAt: new Date().toISOString(),
        checkedByEmail: "editor@ynda.vn",
      }));
      engine.updateChecklist(pitch.id, "editor@ynda.vn", "qc", qcChecklist);

      const g4App = engine.approveGate4Qc(
        pitch.id,
        "editor@ynda.vn",
        "https://youtube.com/watch?v=blade_runner_master_4k"
      );
      assert(g4App.success);
      assertEquals(g4App.idea?.activeGate, "GATE_5_CORE");

      // Step 8: Core final signoff Gate 5
      const g5App = engine.approveGate5Core(pitch.id, "core@ynda.vn", "Đạt chuẩn phong cách YNDA, duyệt xuất bản ngay.");
      assert(g5App.success);
      assertEquals(g5App.idea?.activeGate, "READY_TO_PUBLISH");

      // Step 9: Release to YouTube
      const pub = engine.publishVideo(pitch.id, "editor@ynda.vn", {
        publishedUrl: "https://youtube.com/watch?v=roger_deakins_blade_runner_ynda",
        publishedTitle: "Roger Deakins Đã Thổi Hồn Vào Blade Runner 2049 Như Thế Nào? | Ý Niệm Điện Ảnh",
        publishedThumbnail: "https://img.youtube.com/vi/blade_runner/maxresdefault.jpg",
        publishedCaption: "Phân tích chuyên sâu về phong cách ánh sáng của bậc thầy Roger Deakins.",
        publishedHashtags: "#YNDA #RogerDeakins #BladeRunner2049 #DienAnh",
      });
      assert(pub.success);
      assertEquals(pub.idea?.status, "COMPLETE");
      assertEquals(pub.idea?.activeGate, "PUBLISHED");

      // Step 10: Performance metrics after 7 days
      const analytics = engine.savePostPublishMetrics(pitch.id, "core@ynda.vn", {
        views: 215000,
        retention: "61.8%",
        ctr: "11.2%",
        comments: 940,
        insights: "Tỷ lệ giữ chân tăng vọt ở đoạn dừng voice 4s nghe thoại gốc. Cần áp dụng cho các tập sau.",
        createFeedbackIdea: true,
      });
      assert(analytics.success);
      assert(!!analytics.feedbackIdeaId);
    }
  );

  // ==========================================================================
  // SCENARIO 2: Channel 2 Psychology Video with Script Revision Loop
  // ==========================================================================
  registerTest(
    "Tier 4",
    "Scenario 2: Script Revision Resolved",
    "T4_SCENARIO_02",
    "Channel 2 Psychology video where Editor requests script revision, Producer revises, and Editor approves",
    () => {
      const engine = new YndaGatingEngine();

      const idea = engine.createInitialIdea({
        title: "Hiệu Ứng Khán Giả Điếc Trong Điện Ảnh",
        description: "Phân tích tâm lý nhân vật khi phát hiện sự thật mà người xem đã biết từ trước",
        platformChannelId: "ch_tam_ly_phan_bien",
        submittedByEmail: "editor@ynda.vn",
        channelTier: "KENH_2_TAM_LY",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");

      // Initial weak script submission
      const weakScript: ScriptData = {
        episodeName: "Tập 14: Hiệu Ứng Khán Giả Điếc",
        channelTier: "KENH_2_TAM_LY",
        writerProducerEmail: "producer@ynda.vn",
        submissionDeadline: "Thứ 4",
        hook3Ws: { what: "Kịch tính", when: "Xem phim", why: "Thấy hồi hộp" }, // Weak 3Ws
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "Hồi hộp lắm", visualMascotEdits: "Mascot", bgmSfxNotes: "BGM" }],
        copyrightCommitment: true,
        status: "DRAFT",
        locked: false,
        updatedAt: new Date().toISOString(),
      };
      engine.submitScriptMatrix(idea.id, "producer@ynda.vn", weakScript);

      // Editor rejects at Gate 2 with precise actionable critique
      const rev = engine.requestScriptRevision(
        idea.id,
        "editor@ynda.vn",
        "Hook 3Ws quá hời hợt. Hãy lấy ví dụ kinh điển quả bom dưới bàn ăn của Hitchcock: người xem biết có bom nhưng nhân vật vẫn vui vẻ nói chuyện."
      );
      assert(rev.success);
      assertEquals(rev.idea?.scriptStatus, "REVISION_REQUESTED");
      assertEquals(rev.idea?.scriptLocked, false, "Must unlock for editing");

      // Producer strengthens script based on critique
      const strongScript: ScriptData = {
        ...weakScript,
        hook3Ws: {
          what: "Quả bom hẹn giờ dưới gầm bàn ăn",
          when: "Khoảnh khắc hai nhân vật đang hào hứng bàn chuyện bóng đá",
          why: "Hitchcock tạo ra sự hồi hộp tột cùng khi khán giả biết trước thảm hoạ",
        },
        revisionNotes: "Đã làm lại toàn bộ Hook theo lý thuyết Suspense của Alfred Hitchcock.",
      };
      const reSub = engine.submitScriptMatrix(idea.id, "producer@ynda.vn", strongScript);
      assert(reSub.success);
      assertEquals(reSub.idea?.scriptStatus, "SUBMITTED");

      // Editor reviews and is satisfied -> Approves Gate 2
      const app = engine.approveGate2Script(idea.id, "editor@ynda.vn");
      assert(app.success);
      assertEquals(app.idea?.scriptStatus, "APPROVED");
      assertEquals(app.idea?.scriptLocked, true, "Must re-lock upon approval");
      assertEquals(app.idea?.activeGate, "GATE_3_PRODUCTION");
    }
  );

  // ==========================================================================
  // SCENARIO 3: YouTube Master Completed and Branched into TikTok 9:16 Derivative
  // ==========================================================================
  registerTest(
    "Tier 4",
    "Scenario 3: YouTube to TikTok Cutdown Branch",
    "T4_SCENARIO_03",
    "Completed YouTube Master video successfully branched into a dedicated TikTok vertical derivative",
    () => {
      const engine = new YndaGatingEngine();

      // Master reaches READY_TO_PUBLISH
      const master = engine.createInitialIdea({
        id: "master_godfather",
        title: "The Godfather: Ánh Mắt Quyền Lực Của Don Corleone",
        description: "Phân tích 5 phút mở đầu lịch sử điện ảnh",
        platformChannelId: "ch_giao_duc_dien_anh",
        submittedByEmail: "editor@ynda.vn",
      });
      master.activeGate = "READY_TO_PUBLISH";
      master.videoFinalLink = "https://youtube.com/watch?v=godfather_master_4k";
      master.publishedUrl = "https://youtube.com/watch?v=godfather_ynda";
      master.gate5ApprovedAt = new Date().toISOString();
      (engine as any).ideas.set(master.id, master);

      // Branch into TikTok cutdown
      const cutdownRes = engine.createTikTokDerivative(master.id, "editor@ynda.vn", {
        title: "Tại Sao Don Corleone Luôn Vuốt Mèo Khi Bàn Chuyện Giết Người? (TikTok)",
        hookSummary: "Chiếc mèo trên tay Marlon Brando thực chất là mèo hoang đi lạc vào phim trường.",
        ctaRoute: "Xem phân tích trọn vẹn 10 phút trên YouTube Ý Niệm Điện Ảnh",
        targetDuration: "35s",
        assigneeEmail: "producer@ynda.vn",
      });

      assert(cutdownRes.success);
      const tiktok = cutdownRes.derivative!;
      assertEquals(tiktok.parentTaskId, master.id);
      assertEquals(tiktok.platformType, "TIKTOK_CUTDOWN");
      assertEquals(tiktok.tiktokTargetDuration, "35s");
      assertEquals(tiktok.tiktokReframeApplied, true);
      assert(tiktok.tiktokChecklist?.length === 5);

      // Verify TikTok checklist progress
      const completedTikTokList = DEFAULT_TIKTOK_CHECKLIST.map((item) => ({ ...item, checked: true }));
      engine.updateChecklist(tiktok.id, "producer@ynda.vn", "tiktok", completedTikTokList);

      const savedTikTok = engine.getIdea(tiktok.id);
      assertEquals(savedTikTok?.tiktokChecklist?.filter((i) => i.checked).length, 5);
    }
  );

  // ==========================================================================
  // SCENARIO 4: Video Rejected at Gate 3 for Missing Source Link, Corrected & Accepted
  // ==========================================================================
  registerTest(
    "Tier 4",
    "Scenario 4: Gate 3 Correction Loop",
    "T4_SCENARIO_04",
    "Draft submission rejected due to missing Premiere source project, corrected and accepted into Gate 4",
    () => {
      const engine = new YndaGatingEngine();

      const idea = engine.createInitialIdea({
        title: "Dune 2 và Thiết Kế Âm Thanh Sa Mạc",
        description: "Phân tích âm thanh tiếng giun cát",
        platformChannelId: "ch_giao_duc",
        submittedByEmail: "editor@ynda.vn",
      });
      engine.approveGate1Idea(idea.id, "editor@ynda.vn", "producer@ynda.vn");
      const sData: ScriptData = {
        episodeName: "Dune 2", channelTier: "KENH_1_GIAO_DUC", writerProducerEmail: "producer@ynda.vn", submissionDeadline: "Wed",
        hook3Ws: { what: "W", when: "W", why: "W" },
        segments: [{ id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "V", visualMascotEdits: "M", bgmSfxNotes: "S" }],
        copyrightCommitment: true, status: "DRAFT", locked: false, updatedAt: new Date().toISOString()
      };
      engine.submitScriptMatrix(idea.id, "producer@ynda.vn", sData);
      engine.approveGate2Script(idea.id, "editor@ynda.vn");

      // Mark all 7 production checklist items
      engine.updateChecklist(
        idea.id,
        "producer@ynda.vn",
        "production",
        DEFAULT_PRODUCTION_CHECKLIST.map((i) => ({ ...i, checked: true }))
      );

      // Faulty submission: missing sourceProjectLink
      const failedSubmit = engine.submitVideoWithChecklist(idea.id, "producer@ynda.vn", {
        videoDraftLink: "https://drive.google.com/dune2_draft",
        sourceProjectLink: "", // Missing!
      });
      assertEquals(failedSubmit.success, false);
      assert(failedSubmit.error?.includes("file source/project"), "Must reject missing source project link");
      assertEquals(engine.getIdea(idea.id)?.activeGate, "GATE_3_PRODUCTION", "Gate must not advance");

      // Producer provides valid Premiere source project link
      const validSubmit = engine.submitVideoWithChecklist(idea.id, "producer@ynda.vn", {
        videoDraftLink: "https://drive.google.com/dune2_draft",
        sourceProjectLink: "https://drive.google.com/file/d/dune2_premiere_project_full.prproj",
        assetFolderLink: "https://drive.google.com/drive/folders/dune2_assets",
      });
      assert(validSubmit.success);
      assertEquals(validSubmit.idea?.activeGate, "GATE_4_QC");
      assertEquals(validSubmit.idea?.sourceProjectLink, "https://drive.google.com/file/d/dune2_premiere_project_full.prproj");
    }
  );

  // ==========================================================================
  // SCENARIO 5: Full Team Multi-Role Collaboration with Copyright & Feedback Loop
  // ==========================================================================
  registerTest(
    "Tier 4",
    "Scenario 5: Multi-Role Team Collaboration",
    "T4_SCENARIO_05",
    "Full team multi-role collaboration (Producer, Editor, Core) with copyright verification and analytics feedback loop",
    () => {
      const engine = new YndaGatingEngine();

      // 1. Editor pitches new concept
      const idea = engine.createInitialIdea({
        title: "Tâm Lý Học Kẻ Thao Túng Trong Phim Ký Sinh Trùng",
        description: "Bóc tách các kỹ thuật thao túng tâm lý (Gaslighting) của gia đình Kim",
        platformChannelId: "ch_tam_ly_phan_bien",
        submittedByEmail: "editor@ynda.vn",
        channelTier: "KENH_2_TAM_LY",
      });

      // 2. Core approves and assigns Producer
      const g1 = engine.approveGate1Idea(idea.id, "core@ynda.vn", "producer@ynda.vn", "2026-10-07");
      assert(g1.success);

      // 3. Producer prepares script with 3Ws & Copyright Commitment
      const script: ScriptData = {
        episodeName: "Tập 40: Kẻ Thao Túng",
        channelTier: "KENH_2_TAM_LY",
        writerProducerEmail: "producer@ynda.vn",
        submissionDeadline: "2026-10-07",
        hook3Ws: {
          what: "Chiếc đào gây dị ứng",
          when: "Cảnh người quản gia ho sặc sụa",
          why: "Gia đình Kim biến điểm yếu sinh học của người khác thành vũ khí hạ bệ",
        },
        segments: [
          { id: "s1", timeRange: "00:00-00:15", segmentName: "Hook", voiceAiText: "Làm sao biến trái đào thành vũ khí?", visualMascotEdits: "Mascot giật mình", bgmSfxNotes: "Ting" },
          { id: "s2", timeRange: "00:15-03:30", segmentName: "Body", voiceAiText: "Kỹ thuật thao túng từng bước", visualMascotEdits: "Cắt cảnh đối chiếu", bgmSfxNotes: "Trầm" },
          { id: "s3", timeRange: "03:30-04:30", segmentName: "Outro", voiceAiText: "Dấu hiệu nhận biết kẻ thao túng", visualMascotEdits: "Summary Card", bgmSfxNotes: "Dịu" },
          { id: "s4", timeRange: "04:30-05:00", segmentName: "CTA", voiceAiText: "Bạn đã từng gặp kẻ thao túng như vậy?", visualMascotEdits: "Loop", bgmSfxNotes: "SFX" },
        ],
        copyrightCommitment: true,
        status: "DRAFT",
        locked: false,
        updatedAt: new Date().toISOString(),
      };
      engine.submitScriptMatrix(idea.id, "producer@ynda.vn", script);

      // 4. Editor reviews and approves Gate 2
      const g2 = engine.approveGate2Script(idea.id, "editor@ynda.vn");
      assert(g2.success);

      // 5. Producer tries to tick QC checklist -> BLOCKED
      const badToggle = engine.updateChecklist(idea.id, "producer@ynda.vn", "qc", DEFAULT_QC_CHECKLIST);
      assertEquals(badToggle.success, false);
      assert(badToggle.error?.includes("Producer không có quyền"));

      // 6. Producer completes 7 production items and hands over
      engine.updateChecklist(idea.id, "producer@ynda.vn", "production", DEFAULT_PRODUCTION_CHECKLIST.map((i) => ({ ...i, checked: true })));
      const g3 = engine.submitVideoWithChecklist(idea.id, "producer@ynda.vn", {
        videoDraftLink: "https://drive.google.com/parasite_draft",
        sourceProjectLink: "https://drive.google.com/parasite_premiere",
      });
      assert(g3.success);

      // 7. Editor conducts QC, fixes subtitle & safe zone directly, ticks 8 items
      engine.updateChecklist(idea.id, "editor@ynda.vn", "qc", DEFAULT_QC_CHECKLIST.map((i) => ({ ...i, checked: true })));
      const g4 = engine.approveGate4Qc(idea.id, "editor@ynda.vn", "https://youtube.com/watch?v=parasite_final");
      assert(g4.success);

      // 8. Core conducts final executive review & approves Gate 5
      const g5 = engine.approveGate5Core(idea.id, "core@ynda.vn", "Đạt chuẩn thương hiệu YNDA, thông điệp sắc sảo.");
      assert(g5.success);

      // 9. Video published
      const pub = engine.publishVideo(idea.id, "producer@ynda.vn", {
        publishedUrl: "https://youtube.com/watch?v=gaslighting_parasite_official",
        publishedTitle: "Tâm Lý Học Kẻ Thao Túng Trong Parasite | Ý Niệm Điện Ảnh",
      });
      assert(pub.success);

      // 10. Analytics recorded & Feedback loop triggered
      const feedbackRes = engine.savePostPublishMetrics(idea.id, "editor@ynda.vn", {
        views: 340000,
        retention: "64.5%",
        ctr: "12.8%",
        comments: 1850,
        insights: "Chủ đề 'Kẻ thao túng' có lượt bình luận thảo luận tâm lý cao kỷ lục; mở rộng sang nhân vật Amy Dunne trong Gone Girl.",
        createFeedbackIdea: true,
      });
      assert(feedbackRes.success);
      assert(!!feedbackRes.feedbackIdeaId);

      const feedbackIdea = engine.getIdea(feedbackRes.feedbackIdeaId!);
      assert(feedbackIdea?.description.includes("Amy Dunne trong Gone Girl"));
      assertEquals(feedbackIdea?.activeGate, "GATE_1_IDEA");
      assertEquals(feedbackIdea?.status, "PITCH");
    }
  );
}
