/**
 * YNDA Video Production SOP - Opaque-Box E2E Test Harness & Contract Specification
 * Strictly based on ORIGINAL_REQUEST.md and PROJECT.md.
 */

// ============================================================================
// 1. DATA CONTRACTS & ENUMS
// ============================================================================

export type Role = "Core" | "E" | "P";

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

export type CopyrightCheckStatus = "CHECKED_CLEAN" | "FAIR_USE" | "LICENSED" | "PENDING" | "RISK" | "OFFICIAL";

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

export interface SopStageDefinition {
  no: string;
  title: string;
  owner: string;
  ownerTone: string;
  input: string;
  work: string;
  output: string;
  guard: string;
}

export interface IdeaRecord {
  id: string;
  title: string;
  description: string;
  platformChannelId: string;
  submittedByEmail: string;
  status: string;
  activeGate: ActiveGate;
  assignedToEmail?: string;
  durationDays: number;
  createdAt: string;
  assignedAt?: string;

  // Gate 1
  gate1ApprovedAt?: string;
  gate1ApprovedByEmail?: string;

  // Gate 2
  scriptStatus: ScriptStatus;
  scriptLocked: boolean;
  scriptRevisionNotes?: string;
  scriptData?: ScriptData;
  copyrightCommitment: boolean;
  gate2ApprovedAt?: string;
  gate2ApprovedByEmail?: string;

  // Checklists
  productionChecklist: ChecklistItem[];
  qcChecklist: ChecklistItem[];
  tiktokChecklist?: ChecklistItem[];

  // Gate 3 & Resources
  videoDraftLink?: string;
  sourceProjectLink?: string;
  assetFolderLink?: string;
  scriptDocLink?: string;
  masterVideoLink?: string;
  videoFinalLink?: string;
  videoSubmittedAt?: string;

  // Gate 4
  gate4ApprovedAt?: string;
  gate4ApprovedByEmail?: string;

  // Gate 5
  gate5ApprovedAt?: string;
  gate5ApprovedByEmail?: string;
  coreApprovalNotes?: string;

  // Deadlines
  deadlineScript?: string;
  deadlineProduction?: string;
  deadlineQc?: string;
  targetPublishDate?: string;

  // Derivative TikTok
  parentTaskId?: string;
  derivativeType: DerivativeType;
  sourceVideoUrl?: string;
  tiktokTargetDuration: string;
  tiktokReframeApplied: boolean;
  tiktokHookSummary?: string;
  tiktokCtaRoute?: string;

  // Metadata & Copyright
  platformType: PlatformType;
  channelTier?: ChannelTier;
  copyrightFootage: CopyrightCheckStatus;
  copyrightMusic: CopyrightCheckStatus;
  copyrightMascot: CopyrightCheckStatus;

  // Publish & Metrics
  publishedUrl?: string;
  publishedTitle?: string;
  publishedThumbnail?: string;
  publishedCaption?: string;
  publishedHashtags?: string;
  metricsViews: number;
  metricsRetention?: string;
  metricsCtr?: string;
  metricsComments: number;
  metricsInsights?: string;
}

export interface MemberRecord {
  id: string;
  name: string;
  role: Role;
  active: boolean;
}

// ============================================================================
// 2. AUTHORITATIVE DEFAULT SPECIFICATIONS (ORIGINAL_REQUEST.md)
// ============================================================================

export const DEFAULT_PRODUCTION_CHECKLIST: ChecklistItem[] = [
  { id: "prod_voice", label: "Voice rõ ràng, phát âm chuẩn, không tạp âm/nhiễu.", checked: false },
  { id: "prod_footage", label: "Footage bám sát script và có ghi rõ nguồn tư liệu.", checked: false },
  { id: "prod_bgm_sfx", label: "BGM & SFX đã kiểm tra quyền sử dụng, không vi phạm bản quyền.", checked: false },
  { id: "prod_subtitle", label: "Subtitle đúng chính tả, nằm trong vùng an toàn (safe zone).", checked: false },
  { id: "prod_format", label: "Định dạng chuẩn master ngang YouTube 16:9 (2 - 5 phút).", checked: false },
  { id: "prod_metadata", label: "Có đề xuất thumbnail, title và caption/hashtag.", checked: false },
  { id: "prod_source", label: "Đã xuất đầy đủ file source/project để Editor tiếp quản chỉnh sửa.", checked: false },
];

export const DEFAULT_QC_CHECKLIST: ChecklistItem[] = [
  { id: "qc_hook", label: "Hook 3 giây đầu đủ mạnh để giữ chân người xem.", checked: false },
  { id: "qc_content", label: "Nội dung bám sát Idea và Script đã duyệt.", checked: false },
  { id: "qc_pacing", label: "Nhịp dựng có khoảng thở kỹ thuật, không dồn dập.", checked: false },
  { id: "qc_audio", label: "Audio cân bằng âm lượng, voice nổi rõ trên nền BGM.", checked: false },
  { id: "qc_visual_identity", label: "Subtitle, font chữ, màu sắc và layout đồng bộ nhận diện thương hiệu.", checked: false },
  { id: "qc_copyright", label: "Rủi ro bản quyền âm thanh/hình ảnh bằng 0.", checked: false },
  { id: "qc_cta_loop", label: "CTA và seamless loop mượt mà, đúng định hướng.", checked: false },
  { id: "qc_technical", label: "Video đạt chuẩn kỹ thuật YouTube trước khi trình Core duyệt.", checked: false },
];

export const DEFAULT_TIKTOK_CHECKLIST: ChecklistItem[] = [
  { id: "tiktok_reframe", label: "Reframe bố cục dọc 9:16 chuyên nghiệp (không chỉ crop đơn thuần).", checked: false },
  { id: "tiktok_hook", label: "Hook mới xuất hiện ngay 0 - 3 giây đầu.", checked: false },
  { id: "tiktok_sub", label: "Subtitle kích thước lớn, dễ đọc trên di động.", checked: false },
  { id: "tiktok_cta", label: "CTA điều hướng rõ ràng về video đầy đủ trên YouTube và Cộng đồng Facebook.", checked: false },
  { id: "tiktok_link", label: "Liên kết ngược ID/URL của video YouTube Master để đo lường tỷ lệ chuyển đổi.", checked: false },
];

export const SOP_STAGES: SopStageDefinition[] = [
  { no: "01", title: "Xây dựng Idea", owner: "Editor · Ban Đào tạo", ownerTone: "bg-blue-100 text-blue-800", input: "Định hướng chủ đề từ Core", work: "Nghiên cứu insight, chọn vấn đề, góc khai thác và kênh phù hợp.", output: "Idea đề xuất / Content Brief", guard: "Chưa đầu tư viết script hoặc dựng video ở bước này." },
  { no: "02", title: "Chốt & Giao Idea", owner: "Editor · Ban Đào tạo", ownerTone: "bg-blue-100 text-blue-800", input: "Idea / Content Brief", work: "Đánh giá định hướng, giá trị, tính khả thi và giao việc cho Producer.", output: "Idea đã chốt", guard: "Chỉ idea được duyệt mới được đi tiếp." },
  { no: "03", title: "Nộp Script", owner: "Producer · Ban Dự án", ownerTone: "bg-violet-100 text-violet-800", input: "Idea đã chốt", work: "Viết Hook → Body → Outro → CTA/Loop; điền Voice, Visual, BGM/SFX, subtitle và reference.", output: "Bản nháp Script", guard: "Nộp theo ma trận 4 cột, không chỉ nộp phần lời đọc." },
  { no: "04", title: "Sửa & Duyệt Script", owner: "Editor · Ban Đào tạo", ownerTone: "bg-blue-100 text-blue-800", input: "Bản nháp Script", work: "Kiểm tra logic, tính chính xác, thông điệp, format và khả năng sản xuất.", output: "Script hoàn chỉnh", guard: "Script chưa duyệt không vào Production." },
  { no: "05", title: "Production & Assembly", owner: "Producer · Ban Dự án", ownerTone: "bg-violet-100 text-violet-800", input: "Script duyệt + guideline + reference", work: "Chuẩn bị voice, footage, graphic, subtitle, BGM/SFX rồi lắp ráp bản nháp.", output: "Video nháp 16:9", guard: "Voice và visual được làm song song; không tự đổi định hướng đã chốt." },
  { no: "06", title: "Nộp Video bàn giao", owner: "Producer · Ban Dự án", ownerTone: "bg-violet-100 text-violet-800", input: "Video nháp", work: "Tự đối chiếu script, format, guideline và bàn giao đủ file/source cần thiết.", output: "Gói bàn giao", guard: "Thiếu asset hoặc link source thì chưa nộp." },
  { no: "07", title: "QC & Hoàn thiện", owner: "Editor · Ban Đào tạo", ownerTone: "bg-blue-100 text-blue-800", input: "Video bàn giao + Script + Assets", work: "QC và chỉnh trực tiếp: hình, tiếng, nhịp dựng, text, subtitle, layout.", output: "Video hoàn thiện", guard: "Editor xử lý khâu hoàn thiện, tránh vòng lặp trả Producer sửa vụn vặt." },
  { no: "08", title: "Core Duyệt chốt", owner: "Core + Editor", ownerTone: "bg-amber-100 text-amber-800", input: "Video hoàn thiện", work: "Kiểm tra định hướng kênh và chất lượng tổng thể. Nếu có lỗi, Editor sửa rồi gửi lại.", output: "Video được duyệt cuối", guard: "Chỉ Core được quyết định duyệt đăng." },
  { no: "09", title: "Publish & Analytics", owner: "Publish + Editor/Core", ownerTone: "bg-emerald-100 text-emerald-800", input: "Video được duyệt", work: "Đăng đúng kênh, title, thumbnail, caption, hashtag, CTA; theo dõi retention và tương tác.", output: "Báo cáo + insight", guard: "Insight quay về bước 01 để cải thiện idea tiếp theo." },
];

// ============================================================================
// 3. OPAQUE-BOX SPECIFICATION ENGINE (State Machine & Business Rules)
// ============================================================================

export class YndaGatingEngine {
  private ideas: Map<string, IdeaRecord> = new Map();
  private members: Map<string, MemberRecord> = new Map();

  constructor() {
    this.seedDefaultMembers();
  }

  private seedDefaultMembers() {
    this.addMember({ id: "core@ynda.vn", name: "Core Director", role: "Core", active: true });
    this.addMember({ id: "editor@ynda.vn", name: "Lead Editor", role: "E", active: true });
    this.addMember({ id: "producer@ynda.vn", name: "Main Producer", role: "P", active: true });
    this.addMember({ id: "producer2@ynda.vn", name: "Junior Producer", role: "P", active: true });
  }

  public addMember(member: MemberRecord) {
    this.members.set(member.id.toLowerCase(), member);
  }

  public getMember(email: string): MemberRecord | undefined {
    return this.members.get(email.toLowerCase());
  }

  public getIdea(id: string): IdeaRecord | undefined {
    const record = this.ideas.get(id);
    return record ? JSON.parse(JSON.stringify(record)) : undefined;
  }

  public createInitialIdea(params: {
    id?: string;
    title: string;
    description: string;
    platformChannelId: string;
    submittedByEmail: string;
    channelTier?: ChannelTier;
  }): IdeaRecord {
    if (!params.title || !params.title.trim()) {
      throw new Error("Tên ý tưởng không được để trống");
    }
    if (!params.description || !params.description.trim()) {
      throw new Error("Mô tả ý tưởng là bắt buộc");
    }
    if (!params.platformChannelId || !params.platformChannelId.trim()) {
      throw new Error("Vui lòng chọn Kênh & Nền tảng cho ý tưởng");
    }

    const id = params.id || `idea_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const newIdea: IdeaRecord = {
      id,
      title: params.title.trim(),
      description: params.description.trim(),
      platformChannelId: params.platformChannelId.trim(),
      submittedByEmail: params.submittedByEmail.toLowerCase(),
      status: "PITCH",
      activeGate: "GATE_1_IDEA",
      durationDays: 7,
      createdAt: new Date().toISOString(),
      scriptStatus: "DRAFT",
      scriptLocked: false,
      copyrightCommitment: false,
      productionChecklist: JSON.parse(JSON.stringify(DEFAULT_PRODUCTION_CHECKLIST)),
      qcChecklist: JSON.parse(JSON.stringify(DEFAULT_QC_CHECKLIST)),
      platformType: "YOUTUBE_MASTER",
      channelTier: params.channelTier || "KENH_1_GIAO_DUC",
      derivativeType: "NONE",
      tiktokTargetDuration: "30-45s",
      tiktokReframeApplied: false,
      copyrightFootage: "PENDING",
      copyrightMusic: "PENDING",
      copyrightMascot: "OFFICIAL",
      metricsViews: 0,
      metricsComments: 0,
    };

    this.ideas.set(id, newIdea);
    return JSON.parse(JSON.stringify(newIdea));
  }

  // --- GATE 1: IDEA APPROVAL ---
  public approveGate1Idea(
    ideaId: string,
    actorEmail: string,
    assigneeEmail: string,
    deadlineScript?: string
  ): { success: boolean; idea?: IdeaRecord; error?: string } {
    const actor = this.getMember(actorEmail);
    if (!actor) return { success: false, error: "Người dùng không tồn tại" };
    if (actor.role !== "Core" && actor.role !== "E") {
      return { success: false, error: "Chỉ Editor hoặc Core mới có quyền duyệt Idea (Gate 1)" };
    }

    const idea = this.ideas.get(ideaId);
    if (!idea) return { success: false, error: "Không tìm thấy ý tưởng" };
    if (idea.status === "CANCELLED") {
      return { success: false, error: "Không thể duyệt ý tưởng đã bị huỷ" };
    }
    if (idea.activeGate !== "GATE_1_IDEA") {
      return { success: false, error: `Ý tưởng không ở Gate 1 (hiện tại: ${idea.activeGate})` };
    }
    if (!assigneeEmail || !assigneeEmail.trim()) {
      return { success: false, error: "Cần chỉ định Producer phụ trách viết kịch bản" };
    }

    const now = new Date().toISOString();
    idea.status = "ASSIGNMENT";
    idea.activeGate = "GATE_2_SCRIPT";
    idea.assignedToEmail = assigneeEmail.toLowerCase();
    idea.assignedAt = now;
    idea.gate1ApprovedAt = now;
    idea.gate1ApprovedByEmail = actor.id;
    if (deadlineScript) {
      idea.deadlineScript = deadlineScript;
    }

    return { success: true, idea: JSON.parse(JSON.stringify(idea)) };
  }

  // --- GATE 2: SCRIPT SUBMISSION & VALIDATION ---
  public submitScriptMatrix(
    ideaId: string,
    actorEmail: string,
    scriptData: ScriptData
  ): { success: boolean; idea?: IdeaRecord; error?: string } {
    const actor = this.getMember(actorEmail);
    if (!actor) return { success: false, error: "Người dùng không tồn tại" };

    const idea = this.ideas.get(ideaId);
    if (!idea) return { success: false, error: "Không tìm thấy ý tưởng" };

    if (idea.status === "CANCELLED") {
      return { success: false, error: "Không thể nộp kịch bản cho task đã bị huỷ" };
    }

    if (idea.activeGate !== "GATE_2_SCRIPT") {
      return { success: false, error: `Task không ở trạng thái nhận kịch bản Gate 2 (hiện tại: ${idea.activeGate})` };
    }

    if (idea.scriptLocked) {
      return { success: false, error: "Kịch bản đã được duyệt và đang bị khoá. Không thể chỉnh sửa trực tiếp." };
    }

    // Role check: Assigned Producer, Editor, or Core
    const isAssignedProducer = idea.assignedToEmail && idea.assignedToEmail.toLowerCase() === actor.id.toLowerCase();
    if (actor.role === "P" && !isAssignedProducer) {
      return { success: false, error: "Chỉ Producer được giao việc hoặc Editor/Core mới có quyền nộp kịch bản này" };
    }

    // Validation: Hook 3Ws
    if (!scriptData.hook3Ws || !scriptData.hook3Ws.what?.trim() || !scriptData.hook3Ws.when?.trim() || !scriptData.hook3Ws.why?.trim()) {
      return { success: false, error: "Bắt buộc phải điền đầy đủ cấu trúc Hook 3Ws (What - When - Why)" };
    }

    // Validation: Copyright Commitment
    if (!scriptData.copyrightCommitment) {
      return { success: false, error: "Bắt buộc phải tích xác nhận cam kết bản quyền tư liệu & âm nhạc" };
    }

    // Validation: Segments
    if (!scriptData.segments || scriptData.segments.length === 0) {
      return { success: false, error: "Ma trận kịch bản 4 cột phải có ít nhất một phân đoạn" };
    }

    for (const seg of scriptData.segments) {
      if (!seg.timeRange?.trim() || !seg.segmentName?.trim()) {
        return { success: false, error: "Mỗi phân đoạn trong ma trận phải có Thời gian và Tên phân đoạn" };
      }
    }

    idea.scriptData = JSON.parse(JSON.stringify(scriptData));
    idea.scriptStatus = "SUBMITTED";
    idea.copyrightCommitment = true;
    idea.status = "SCRIPT";

    return { success: true, idea: JSON.parse(JSON.stringify(idea)) };
  }

  // --- GATE 2: SCRIPT APPROVAL ---
  public approveGate2Script(
    ideaId: string,
    actorEmail: string
  ): { success: boolean; idea?: IdeaRecord; error?: string } {
    const actor = this.getMember(actorEmail);
    if (!actor) return { success: false, error: "Người dùng không tồn tại" };
    if (actor.role !== "Core" && actor.role !== "E") {
      return { success: false, error: "Chỉ Editor hoặc Core mới có quyền duyệt kịch bản (Gate 2)" };
    }

    const idea = this.ideas.get(ideaId);
    if (!idea) return { success: false, error: "Không tìm thấy ý tưởng" };

    if (idea.activeGate !== "GATE_2_SCRIPT") {
      return { success: false, error: `Ý tưởng không ở Gate 2 (hiện tại: ${idea.activeGate})` };
    }

    if (idea.scriptStatus !== "SUBMITTED" && !idea.scriptData) {
      return { success: false, error: "Chưa có bản thảo kịch bản nào được nộp để duyệt" };
    }

    const now = new Date().toISOString();
    idea.scriptStatus = "APPROVED";
    idea.scriptLocked = true;
    idea.gate2ApprovedAt = now;
    idea.gate2ApprovedByEmail = actor.id;
    idea.activeGate = "GATE_3_PRODUCTION";
    idea.status = "PRODUCTION";

    return { success: true, idea: JSON.parse(JSON.stringify(idea)) };
  }

  // --- GATE 2: SCRIPT REVISION REQUEST ---
  public requestScriptRevision(
    ideaId: string,
    actorEmail: string,
    revisionNotes: string
  ): { success: boolean; idea?: IdeaRecord; error?: string } {
    const actor = this.getMember(actorEmail);
    if (!actor) return { success: false, error: "Người dùng không tồn tại" };
    if (actor.role !== "Core" && actor.role !== "E") {
      return { success: false, error: "Chỉ Editor hoặc Core mới có quyền yêu cầu sửa kịch bản" };
    }

    if (!revisionNotes || !revisionNotes.trim()) {
      return { success: false, error: "Vui lòng nhập lý do/góp ý cần chỉnh sửa kịch bản" };
    }

    const idea = this.ideas.get(ideaId);
    if (!idea) return { success: false, error: "Không tìm thấy ý tưởng" };

    idea.scriptStatus = "REVISION_REQUESTED";
    idea.scriptLocked = false;
    idea.scriptRevisionNotes = revisionNotes.trim();
    idea.activeGate = "GATE_2_SCRIPT";
    idea.status = "SCRIPT";

    return { success: true, idea: JSON.parse(JSON.stringify(idea)) };
  }

  // --- CHECKLIST MANAGEMENT (R4) ---
  public updateChecklist(
    ideaId: string,
    actorEmail: string,
    checklistType: "production" | "qc" | "tiktok",
    items: ChecklistItem[]
  ): { success: boolean; idea?: IdeaRecord; error?: string } {
    const actor = this.getMember(actorEmail);
    if (!actor) return { success: false, error: "Người dùng không tồn tại" };

    const idea = this.ideas.get(ideaId);
    if (!idea) return { success: false, error: "Không tìm thấy ý tưởng" };

    // Role restrictions
    if (checklistType === "qc" && actor.role === "P") {
      return { success: false, error: "Producer không có quyền tick Editor QC checklist" };
    }

    if (!Array.isArray(items) || items.length === 0) {
      return { success: false, error: "Dữ liệu checklist không hợp lệ hoặc rỗng" };
    }

    // Validate item IDs match required template
    const template =
      checklistType === "production"
        ? DEFAULT_PRODUCTION_CHECKLIST
        : checklistType === "qc"
        ? DEFAULT_QC_CHECKLIST
        : DEFAULT_TIKTOK_CHECKLIST;

    const validIds = new Set(template.map((t) => t.id));
    for (const item of items) {
      if (!validIds.has(item.id)) {
        return { success: false, error: `Mục checklist không hợp lệ: ${item.id}` };
      }
    }

    if (checklistType === "production") {
      idea.productionChecklist = JSON.parse(JSON.stringify(items));
    } else if (checklistType === "qc") {
      idea.qcChecklist = JSON.parse(JSON.stringify(items));
    } else {
      idea.tiktokChecklist = JSON.parse(JSON.stringify(items));
    }

    return { success: true, idea: JSON.parse(JSON.stringify(idea)) };
  }

  // --- GATE 3: VIDEO HANDOVER SUBMISSION ---
  public submitVideoWithChecklist(
    ideaId: string,
    actorEmail: string,
    payload: { videoDraftLink: string; sourceProjectLink: string; assetFolderLink?: string }
  ): { success: boolean; idea?: IdeaRecord; error?: string } {
    const actor = this.getMember(actorEmail);
    if (!actor) return { success: false, error: "Người dùng không tồn tại" };

    const idea = this.ideas.get(ideaId);
    if (!idea) return { success: false, error: "Không tìm thấy ý tưởng" };

    if (idea.activeGate !== "GATE_3_PRODUCTION") {
      return { success: false, error: `Ý tưởng không ở Gate 3 Production (hiện tại: ${idea.activeGate})` };
    }

    // Check mandatory links
    if (!payload.videoDraftLink || !isValidUrl(payload.videoDraftLink)) {
      return { success: false, error: "Bắt buộc phải điền URL hợp lệ cho Video nháp (Draft)" };
    }

    if (!payload.sourceProjectLink || !isValidUrl(payload.sourceProjectLink)) {
      return { success: false, error: "Bắt buộc phải điền URL file source/project (Premiere/CapCut/DaVinci)" };
    }

    // Check Production Checklist 100% (7/7 items)
    const checklist = idea.productionChecklist || [];
    const totalRequired = DEFAULT_PRODUCTION_CHECKLIST.length; // 7
    const checkedCount = checklist.filter((item) => item.checked).length;

    if (checkedCount < totalRequired) {
      return {
        success: false,
        error: `Production Checklist chưa hoàn thành 100% (${checkedCount}/${totalRequired} mục). Vui lòng kiểm tra toàn bộ tiêu chí trước khi bàn giao.`,
      };
    }

    const now = new Date().toISOString();
    idea.videoDraftLink = payload.videoDraftLink;
    idea.sourceProjectLink = payload.sourceProjectLink;
    if (payload.assetFolderLink) idea.assetFolderLink = payload.assetFolderLink;
    idea.videoSubmittedAt = now;
    idea.activeGate = "GATE_4_QC";
    idea.status = "QA";

    return { success: true, idea: JSON.parse(JSON.stringify(idea)) };
  }

  // --- GATE 4: QC APPROVAL (EDITOR) ---
  public approveGate4Qc(
    ideaId: string,
    actorEmail: string,
    videoFinalLink: string
  ): { success: boolean; idea?: IdeaRecord; error?: string } {
    const actor = this.getMember(actorEmail);
    if (!actor) return { success: false, error: "Người dùng không tồn tại" };
    if (actor.role !== "Core" && actor.role !== "E") {
      return { success: false, error: "Chỉ Editor hoặc Core mới có quyền ký duyệt QC (Gate 4)" };
    }

    const idea = this.ideas.get(ideaId);
    if (!idea) return { success: false, error: "Không tìm thấy ý tưởng" };

    if (idea.activeGate !== "GATE_4_QC") {
      return { success: false, error: `Ý tưởng không ở Gate 4 QC (hiện tại: ${idea.activeGate})` };
    }

    if (!videoFinalLink || !isValidUrl(videoFinalLink)) {
      return { success: false, error: "Bắt buộc phải cung cấp link Video hoàn thiện (Final Master Link)" };
    }

    // Check QC Checklist 100% (8/8 items)
    const checklist = idea.qcChecklist || [];
    const totalRequired = DEFAULT_QC_CHECKLIST.length; // 8
    const checkedCount = checklist.filter((item) => item.checked).length;

    if (checkedCount < totalRequired) {
      return {
        success: false,
        error: `Editor QC Checklist chưa đạt 100% (${checkedCount}/${totalRequired} mục). Không thể trình Core duyệt.`,
      };
    }

    const now = new Date().toISOString();
    idea.videoFinalLink = videoFinalLink;
    idea.gate4ApprovedAt = now;
    idea.gate4ApprovedByEmail = actor.id;
    idea.activeGate = "GATE_5_CORE";
    idea.status = "CORE_REVIEW";

    return { success: true, idea: JSON.parse(JSON.stringify(idea)) };
  }

  // --- GATE 5: CORE FINAL APPROVAL ---
  public approveGate5Core(
    ideaId: string,
    actorEmail: string,
    notes?: string
  ): { success: boolean; idea?: IdeaRecord; error?: string } {
    const actor = this.getMember(actorEmail);
    if (!actor) return { success: false, error: "Người dùng không tồn tại" };
    if (actor.role !== "Core") {
      return { success: false, error: "CHỈ CORE mới có thẩm quyền duyệt chốt xuất bản (Gate 5)" };
    }

    const idea = this.ideas.get(ideaId);
    if (!idea) return { success: false, error: "Không tìm thấy ý tưởng" };

    if (idea.activeGate !== "GATE_5_CORE") {
      return { success: false, error: `Ý tưởng không ở Gate 5 Core Review (hiện tại: ${idea.activeGate})` };
    }

    if (!idea.gate4ApprovedAt) {
      return { success: false, error: "Chưa qua vòng kiểm duyệt QC của Editor (Gate 4)" };
    }

    const now = new Date().toISOString();
    idea.gate5ApprovedAt = now;
    idea.gate5ApprovedByEmail = actor.id;
    if (notes) idea.coreApprovalNotes = notes;
    idea.activeGate = "READY_TO_PUBLISH";
    idea.status = "READY_TO_PUBLISH";

    return { success: true, idea: JSON.parse(JSON.stringify(idea)) };
  }

  // --- PUBLISH ACTION ---
  public publishVideo(
    ideaId: string,
    actorEmail: string,
    publishData: {
      publishedUrl: string;
      publishedTitle?: string;
      publishedThumbnail?: string;
      publishedCaption?: string;
      publishedHashtags?: string;
    }
  ): { success: boolean; idea?: IdeaRecord; error?: string } {
    const actor = this.getMember(actorEmail);
    if (!actor) return { success: false, error: "Người dùng không tồn tại" };

    const idea = this.ideas.get(ideaId);
    if (!idea) return { success: false, error: "Không tìm thấy ý tưởng" };

    if (idea.activeGate !== "READY_TO_PUBLISH" && !idea.gate5ApprovedAt) {
      return { success: false, error: "Video chưa được Core phê duyệt chốt (Gate 5). Không thể xuất bản." };
    }

    if (!publishData.publishedUrl || !isValidUrl(publishData.publishedUrl)) {
      return { success: false, error: "Link video chính thức xuất bản không hợp lệ" };
    }

    idea.publishedUrl = publishData.publishedUrl;
    idea.publishedTitle = publishData.publishedTitle;
    idea.publishedThumbnail = publishData.publishedThumbnail;
    idea.publishedCaption = publishData.publishedCaption;
    idea.publishedHashtags = publishData.publishedHashtags;
    idea.activeGate = "PUBLISHED";
    idea.status = "COMPLETE";

    return { success: true, idea: JSON.parse(JSON.stringify(idea)) };
  }

  // --- POST-PUBLISH METRICS & FEEDBACK LOOP ---
  public savePostPublishMetrics(
    ideaId: string,
    actorEmail: string,
    metrics: {
      views: number;
      retention?: string;
      ctr?: string;
      comments: number;
      insights?: string;
      createFeedbackIdea?: boolean;
    }
  ): { success: boolean; idea?: IdeaRecord; feedbackIdeaId?: string; error?: string } {
    const actor = this.getMember(actorEmail);
    if (!actor) return { success: false, error: "Người dùng không tồn tại" };

    const idea = this.ideas.get(ideaId);
    if (!idea) return { success: false, error: "Không tìm thấy ý tưởng" };

    if (idea.activeGate !== "PUBLISHED" && idea.status !== "COMPLETE") {
      return { success: false, error: "Chỉ có thể nhập chỉ số sau khi video đã hoàn tất xuất bản" };
    }

    if (metrics.views < 0 || metrics.comments < 0) {
      return { success: false, error: "Chỉ số lượt xem và bình luận không được là số âm" };
    }

    idea.metricsViews = metrics.views;
    idea.metricsRetention = metrics.retention;
    idea.metricsCtr = metrics.ctr;
    idea.metricsComments = metrics.comments;
    idea.metricsInsights = metrics.insights;

    let feedbackIdeaId: string | undefined;
    if (metrics.createFeedbackIdea && metrics.insights?.trim()) {
      const fb = this.createInitialIdea({
        title: `[Feedback từ #${idea.id}] ${metrics.insights.slice(0, 50)}...`,
        description: `Ý tưởng phát triển từ số liệu và bài học của video ${idea.title}:\n${metrics.insights}`,
        platformChannelId: idea.platformChannelId,
        submittedByEmail: actor.id,
        channelTier: idea.channelTier,
      });
      feedbackIdeaId = fb.id;
    }

    return { success: true, idea: JSON.parse(JSON.stringify(idea)), feedbackIdeaId };
  }

  // --- TIKTOK DERIVATIVE BRANCHING (R5) ---
  public createTikTokDerivative(
    masterIdeaId: string,
    actorEmail: string,
    data: {
      title: string;
      hookSummary: string;
      ctaRoute: string;
      targetDuration?: string;
      assigneeEmail?: string;
    }
  ): { success: boolean; derivative?: IdeaRecord; error?: string } {
    const actor = this.getMember(actorEmail);
    if (!actor) return { success: false, error: "Người dùng không tồn tại" };

    const master = this.ideas.get(masterIdeaId);
    if (!master) return { success: false, error: "Không tìm thấy video Master nguồn" };

    // Master must be approved by Core or Published
    if (
      master.activeGate !== "GATE_5_CORE" &&
      master.activeGate !== "READY_TO_PUBLISH" &&
      master.activeGate !== "PUBLISHED" &&
      master.status !== "COMPLETE"
    ) {
      return {
        success: false,
        error: "Chỉ có thể tạo nhánh phái sinh TikTok từ video YouTube Master đã được duyệt hoặc xuất bản",
      };
    }

    if (!data.title || !data.title.trim()) {
      return { success: false, error: "Tiêu đề video phái sinh TikTok không được để trống" };
    }

    if (!data.hookSummary || !data.hookSummary.trim()) {
      return { success: false, error: "Bắt buộc phải có tóm tắt Hook 0-3s cho bản TikTok" };
    }

    if (!data.ctaRoute || !data.ctaRoute.trim()) {
      return { success: false, error: "Bắt buộc phải có CTA điều hướng về full video YouTube và cộng đồng" };
    }

    const derivativeId = `tiktok_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const derivative: IdeaRecord = {
      id: derivativeId,
      title: data.title.trim(),
      description: `Bản phái sinh dọc TikTok 9:16 trích xuất từ Master: ${master.title}`,
      platformChannelId: master.platformChannelId,
      submittedByEmail: actor.id,
      status: "ASSIGNMENT",
      activeGate: "GATE_2_SCRIPT",
      durationDays: 3,
      createdAt: new Date().toISOString(),
      parentTaskId: master.id,
      derivativeType: "TIKTOK_CUTDOWN",
      platformType: "TIKTOK_CUTDOWN",
      channelTier: master.channelTier,
      tiktokTargetDuration: data.targetDuration || "30-45s",
      tiktokReframeApplied: true,
      tiktokHookSummary: data.hookSummary.trim(),
      tiktokCtaRoute: data.ctaRoute.trim(),
      tiktokChecklist: JSON.parse(JSON.stringify(DEFAULT_TIKTOK_CHECKLIST)),
      productionChecklist: JSON.parse(JSON.stringify(DEFAULT_PRODUCTION_CHECKLIST)),
      qcChecklist: JSON.parse(JSON.stringify(DEFAULT_QC_CHECKLIST)),
      assignedToEmail: (data.assigneeEmail || actor.id).toLowerCase(),
      scriptStatus: "APPROVED", // Inherited approved script context
      scriptLocked: false,
      copyrightCommitment: true,
      copyrightFootage: master.copyrightFootage,
      copyrightMusic: master.copyrightMusic,
      copyrightMascot: master.copyrightMascot,
      sourceVideoUrl: master.videoFinalLink || master.publishedUrl || master.videoDraftLink,
      metricsViews: 0,
      metricsComments: 0,
    };

    this.ideas.set(derivativeId, derivative);
    return { success: true, derivative: JSON.parse(JSON.stringify(derivative)) };
  }
}

// ============================================================================
// 4. TEST ASSERTION & RUNNER UTILITIES
// ============================================================================

export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function assert(condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new Error(`Assertion failed: ${message || "Expected condition to be true"}`);
  }
}

export function assertEquals<T>(actual: T, expected: T, message?: string) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Assertion failed: ${message || "Expected values to match"}\n  Expected: ${JSON.stringify(
        expected
      )}\n  Actual:   ${JSON.stringify(actual)}`
    );
  }
}

export function assertThrows(fn: () => void, expectedMessageSubstr?: string) {
  let threw = false;
  try {
    fn();
  } catch (err: any) {
    threw = true;
    if (expectedMessageSubstr && !err.message.includes(expectedMessageSubstr)) {
      throw new Error(`Expected error message containing "${expectedMessageSubstr}", got "${err.message}"`);
    }
  }
  if (!threw) {
    throw new Error("Expected function to throw, but it did not");
  }
}

export interface TestCase {
  id: string;
  name: string;
  tier: "Tier 1" | "Tier 2" | "Tier 3" | "Tier 4";
  feature: string;
  run: () => void | Promise<void>;
}

export class TestRegistry {
  private static instance: TestRegistry;
  public tests: TestCase[] = [];

  public static getInstance(): TestRegistry {
    if (!TestRegistry.instance) {
      TestRegistry.instance = new TestRegistry();
    }
    return TestRegistry.instance;
  }

  public register(test: TestCase) {
    this.tests.push(test);
  }

  public clear() {
    this.tests = [];
  }
}

export function registerTest(
  tier: "Tier 1" | "Tier 2" | "Tier 3" | "Tier 4",
  feature: string,
  id: string,
  name: string,
  run: () => void | Promise<void>
) {
  TestRegistry.getInstance().register({ tier, feature, id, name, run });
}
