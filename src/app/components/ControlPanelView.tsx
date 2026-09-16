"use client";

import React, { useState } from "react";
import { 
  Sliders, Bell, BellOff, CheckCircle2, AlertTriangle, Send, 
  Tv, Plus, Edit2, Trash2, ExternalLink, Hash, Check, 
  FolderTree, Layers, Video, Sparkles, RefreshCw, Calendar, 
  Settings, ShieldAlert, Users, Film, CheckSquare, Info
} from "lucide-react";
import { 
  ChannelGroup, Platform, PlatformChannel, Idea, Member, AppSettings 
} from "../../lib/types";
import { 
  toggleDiscordMuteAction, testDiscordWebhookAction 
} from "../../actions/notification-actions";
import { updateSettingsAction } from "../../actions/admin-actions";

interface ControlPanelViewProps {
  settings: AppSettings;
  channelGroups: ChannelGroup[];
  platforms: Platform[];
  platformChannels: PlatformChannel[];
  ideas: Idea[];
  members: Member[];
  actor: Member;
  onNewChannel: () => void;
  onEditChannel: (cg: ChannelGroup) => void;
  onDeleteChannel: (cg: ChannelGroup) => void;
  runAction: (fn: any, ...args: any) => void;
  showToast: (msg: string) => void;
}

export default function ControlPanelView({
  settings,
  channelGroups,
  platforms,
  platformChannels,
  ideas,
  members,
  actor,
  onNewChannel,
  onEditChannel,
  onDeleteChannel,
  runAction,
  showToast
}: ControlPanelViewProps) {
  const isCore = actor.role === "Core";
  const isDiscordMuted = !!settings.discordMuted;

  // Local state for inline Webhook edit
  const [editingWebhooks, setEditingWebhooks] = useState(false);
  const [generalWebhook, setGeneralWebhook] = useState(settings.discordWebhookUrl || "");
  const [ideaWebhook, setIdeaWebhook] = useState(settings.discordIdeaWebhookUrl || "");
  const [calendarUrl, setCalendarUrl] = useState(settings.externalCalendarUrl || "");
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Group channels by Topic Branch
  const topicMap = new Map<string, ChannelGroup[]>();
  channelGroups.filter(c => !c.archived).forEach(c => {
    const branch = (c.topicBranch && c.topicBranch.trim()) ? c.topicBranch.trim() : "Chưa phân nhánh chủ đề";
    const list = topicMap.get(branch) || [];
    list.push(c);
    topicMap.set(branch, list);
  });

  // Calculate platform channels for each channel
  const getPlatformsForChannel = (cgId: string) => {
    const pcs = platformChannels.filter(pc => pc.channelGroupId === cgId);
    return pcs.map(pc => {
      const plat = platforms.find(p => p.id === pc.platformId);
      return {
        id: pc.platformId,
        name: plat?.name || pc.platformId,
        isSecondary: pc.platformId === "plat_tt" || pc.platformId.includes("tiktok")
      };
    });
  };

  // Pipeline summary
  const ideaStats = {
    pitch: ideas.filter(i => i.status === "PITCH").length,
    assignment: ideas.filter(i => i.status === "ASSIGNMENT").length,
    script: ideas.filter(i => i.status === "SCRIPT").length,
    production: ideas.filter(i => i.status === "PRODUCTION").length,
    qa: ideas.filter(i => i.status === "QA").length,
    complete: ideas.filter(i => i.status === "COMPLETE").length,
  };

  const handleToggleDiscordMute = async () => {
    if (!isCore) {
      alert("Chỉ Core mới có quyền bật/tắt thông báo hệ thống");
      return;
    }
    const nextMuted = !isDiscordMuted;
    runAction(async () => {
      await toggleDiscordMuteAction(nextMuted);
      showToast(nextMuted ? "🔇 Đã TẮT thông báo Discord!" : "🔔 Đã BẬT thông báo Discord bình thường!");
    });
  };

  const handleSaveWebhooks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCore) return;
    runAction(async () => {
      await updateSettingsAction(generalWebhook, calendarUrl, ideaWebhook, isDiscordMuted);
      setEditingWebhooks(false);
      showToast("Đã lưu cấu hình kết nối Webhook!");
    });
  };

  const handleTestWebhook = async () => {
    if (!isCore) return;
    setTestingWebhook(true);
    setTestResult(null);
    try {
      await testDiscordWebhookAction(generalWebhook || undefined);
      setTestResult("Thành công! Đã gửi thông báo kiểm tra đến Discord.");
      showToast("Gửi tin test Discord thành công!");
    } catch (err: any) {
      setTestResult("Lỗi: " + (err.message || "Không thể gửi test"));
      showToast("Lỗi gửi tin test Discord");
    } finally {
      setTestingWebhook(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      
      {/* 1. TOP HEADER & QUICK STATS BAR */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Sliders size={22} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  Trang Điều Khiển Hệ Thống
                  <span className="text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                    Control Center
                  </span>
                </h1>
                <p className="text-xs text-slate-500">
                  Trung tâm quản lý thông báo Discord, cơ cấu Kênh theo Nhánh chủ đề & giám sát quy trình sản xuất
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {isCore && (
              <button
                onClick={onNewChannel}
                className="flex items-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors">
                <Plus size={15} /> Thêm Kênh Mới
              </button>
            )}
          </div>
        </div>

        {/* Status Indicators Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
              isDiscordMuted ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"
            }`}>
              {isDiscordMuted ? <BellOff size={16} /> : <Bell size={16} />}
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Thông báo Discord</div>
              <div className={`text-xs font-bold ${isDiscordMuted ? "text-amber-700" : "text-emerald-700"}`}>
                {isDiscordMuted ? "Đang Tắt (Muted)" : "Đang Bật (Active)"}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold">
              <Tv size={16} />
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Kênh hoạt động</div>
              <div className="text-xs font-bold text-slate-900">
                {channelGroups.filter(c => !c.archived).length} Kênh
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center text-xs font-bold">
              <FolderTree size={16} />
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Nhánh chủ đề</div>
              <div className="text-xs font-bold text-slate-900">
                {topicMap.size} Nhánh
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-800 flex items-center justify-center text-xs font-bold">
              <Film size={16} />
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Đang sản xuất</div>
              <div className="text-xs font-bold text-slate-900">
                {ideaStats.production + ideaStats.script + ideaStats.qa} Video
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. KHỐI TRỌNG TÂM: ĐIỀU KHIỂN THÔNG BÁO DISCORD */}
      <div className={`rounded-xl border transition-all p-5 shadow-xs ${
        isDiscordMuted 
          ? "bg-amber-50/50 border-amber-300 ring-1 ring-amber-200" 
          : "bg-white border-[#E2E8F0]"
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              isDiscordMuted 
                ? "bg-amber-500 text-white shadow-sm" 
                : "bg-emerald-500 text-white shadow-sm"
            }`}>
              {isDiscordMuted ? <BellOff size={24} /> : <Bell size={24} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900">
                  Điều Khiển Thông Báo Discord
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  isDiscordMuted 
                    ? "bg-amber-100 text-amber-800 border border-amber-300" 
                    : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                }`}>
                  {isDiscordMuted ? "🔇 ĐÃ TẮT THÔNG BÁO" : "🔔 ĐANG BẬT THÔNG BÁO"}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                {isDiscordMuted ? (
                  <span className="text-amber-800 font-medium">
                    ⚠️ Hệ thống đang ở chế độ <b>TẮT TIẾNG (MUTE)</b>. Mọi sự kiện giao việc, duyệt script, nộp video, phản hồi QA và báo cáo sẽ <b>KHÔNG</b> gửi tin nhắn vào Discord để tránh làm phiền.
                  </span>
                ) : (
                  <span>
                    Hệ thống đang tự động gửi tin nhắn báo việc, duyệt kịch bản, nộp video và kết quả QA vào các kênh Discord đã kết nối.
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Big Toggle Switch Button */}
          <div className="flex items-center gap-3 shrink-0">
            {isCore ? (
              <button
                onClick={handleToggleDiscordMute}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                  isDiscordMuted
                    ? "bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-400/40"
                    : "bg-amber-500 hover:bg-amber-600 text-white ring-2 ring-amber-300/40"
                }`}>
                {isDiscordMuted ? (
                  <>
                    <Bell size={16} /> Bật Lại Thông Báo Discord
                  </>
                ) : (
                  <>
                    <BellOff size={16} /> Tắt Toàn Bộ Thông Báo Discord
                  </>
                )}
              </button>
            ) : (
              <span className="text-xs text-slate-400 italic">Chỉ Core Team có quyền đổi trạng thái</span>
            )}
          </div>
        </div>

        {/* Webhook Configuration & Testing Sub-panel */}
        <div className="mt-4 pt-2">
          {!editingWebhooks ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-slate-50/80 rounded-lg p-3 border border-slate-200/80">
              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2 text-slate-700 font-medium">
                  <Hash size={14} className="text-indigo-500" />
                  <span>Webhook Task Tổng:</span>
                  <span className="font-mono text-slate-900 truncate max-w-xs sm:max-w-md">
                    {settings.discordWebhookUrl || "(Chưa cài đặt Webhook)"}
                  </span>
                </div>
                {settings.discordIdeaWebhookUrl && (
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Sparkles size={14} className="text-amber-500" />
                    <span>Webhook Ý Tưởng:</span>
                    <span className="font-mono text-slate-900 truncate max-w-xs sm:max-w-md">
                      {settings.discordIdeaWebhookUrl}
                    </span>
                  </div>
                )}
              </div>

              {isCore && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleTestWebhook}
                    disabled={testingWebhook || !settings.discordWebhookUrl}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 font-medium disabled:opacity-50 transition-colors">
                    <Send size={13} /> {testingWebhook ? "Đang gửi..." : "Gửi tin Test"}
                  </button>
                  <button
                    onClick={() => setEditingWebhooks(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 font-medium transition-colors">
                    <Edit2 size={13} /> Chỉnh sửa Webhook
                  </button>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleSaveWebhooks} className="bg-slate-50 rounded-lg p-4 border border-slate-200 space-y-3">
              <div className="font-semibold text-xs text-slate-800 flex items-center gap-1.5">
                <Settings size={14} /> Cấu hình Webhook Discord & Lịch
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Discord Webhook Task Tổng (Giao việc, QA, Báo cáo)
                  </label>
                  <input
                    type="text"
                    value={generalWebhook}
                    onChange={(e) => setGeneralWebhook(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-medium mb-1">
                    Discord Webhook Ý Tưởng Mặc Định (Kênh #💡-ý-tưởng)
                  </label>
                  <input
                    type="text"
                    value={ideaWebhook}
                    onChange={(e) => setIdeaWebhook(e.target.value)}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-500 font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingWebhooks(false)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-medium">
                  Huỷ
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs">
                  Lưu cấu hình
                </button>
              </div>
            </form>
          )}

          {testResult && (
            <div className={`mt-2 p-2 rounded text-xs font-medium ${
              testResult.startsWith("Thành công") ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-rose-50 text-rose-800 border border-rose-200"
            }`}>
              {testResult}
            </div>
          )}
        </div>
      </div>

      {/* 3. KHỐI TRỌNG TÂM: QUẢN LÝ KÊNH THEO NHÁNH CHỦ ĐỀ */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderTree size={18} className="text-indigo-600" />
              Quản Lý Kênh & Nhánh Chủ Đề
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Mỗi Kênh được tổ chức theo Nhánh chủ đề định hướng. Mặc định mỗi kênh sở hữu <b>YouTube (Chính)</b> và <b>TikTok (Phụ)</b>.
            </p>
          </div>

          {isCore && (
            <button
              onClick={onNewChannel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors shrink-0">
              <Plus size={14} /> Thêm Kênh Mới
            </button>
          )}
        </div>

        {/* Display Channels Grouped By Topic Branch */}
        {topicMap.size === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Chưa có kênh nào được tạo. Nhấn "Thêm Kênh Mới" để bắt đầu.
          </div>
        ) : (
          <div className="space-y-5">
            {Array.from(topicMap.entries()).map(([branchName, branchChannels]) => (
              <div key={branchName} className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
                
                {/* Branch Header */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Nhánh chủ đề: <span className="text-indigo-700 font-extrabold">{branchName}</span>
                    </h3>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                      {branchChannels.length} Kênh
                    </span>
                  </div>
                </div>

                {/* Channels Grid in this Topic Branch */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {branchChannels.map((cg) => {
                    const channelPlatforms = getPlatformsForChannel(cg.id);
                    const channelIdeas = ideas.filter(i => {
                      const pc = platformChannels.find(p => p.id === i.platformChannelId);
                      return pc?.channelGroupId === cg.id;
                    });
                    const activeIdeasCount = channelIdeas.filter(i => i.status !== "COMPLETE" && i.status !== "ARCHIVED_IDEA" && i.status !== "CANCELLED").length;

                    return (
                      <div 
                        key={cg.id}
                        className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs hover:border-indigo-300 transition-all space-y-3 flex flex-col justify-between">
                        
                        <div>
                          {/* Channel Title & Color Bar */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0">
                              <span 
                                className="w-3.5 h-3.5 rounded-md shrink-0 border border-black/10" 
                                style={{ backgroundColor: cg.color || "#5B9EE8" }} 
                              />
                              <div className="font-bold text-xs text-slate-900 truncate" title={cg.name}>
                                {cg.name}
                              </div>
                            </div>

                            {isCore && (
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  onClick={() => onEditChannel(cg)}
                                  title="Chỉnh sửa Kênh"
                                  className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                                  <Edit2 size={13} />
                                </button>
                                <button
                                  onClick={() => onDeleteChannel(cg)}
                                  title="Lưu trữ / Xoá Kênh"
                                  className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            )}
                          </div>

                          {/* Topic Branch Tag */}
                          <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                              <FolderTree size={10} /> {cg.topicBranch || "Chung"}
                            </span>

                            {cg.videoFormat && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 truncate max-w-[140px]">
                                {cg.videoFormat}
                              </span>
                            )}
                          </div>

                          {/* Description */}
                          {cg.description && (
                            <p className="text-[11px] text-slate-500 mt-2 line-clamp-2 leading-relaxed">
                              {cg.description}
                            </p>
                          )}
                        </div>

                        {/* Bottom: Platforms & Stats */}
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          {/* Platforms tags */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-slate-400 font-medium">Nền tảng:</span>
                            {channelPlatforms.length > 0 ? (
                              channelPlatforms.map((p) => (
                                <span 
                                  key={p.id}
                                  className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                    p.isSecondary 
                                      ? "bg-slate-100 text-slate-700 border-slate-200" 
                                      : "bg-red-50 text-red-700 border-red-200"
                                  }`}>
                                  {p.name} {p.isSecondary ? "(Phụ)" : "(Chính)"}
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">YouTube & TikTok</span>
                            )}
                          </div>

                          {/* Ideas in progress */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                            <span>Đang xử lý: <strong className="text-slate-800">{activeIdeasCount} video</strong></span>
                            {cg.discordWebhookUrl && (
                              <span className="text-[10px] text-indigo-600 font-medium flex items-center gap-1" title="Có Discord Thread/Webhook riêng">
                                <Hash size={10} /> Thread riêng
                              </span>
                            )}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. KHỐI TỔNG QUAN VẬN HÀNH & PIPELINE SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Pipeline Distribution Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-600" />
              Phân Bổ Tiến Độ Ý Tưởng
            </h3>
            <span className="text-xs font-bold text-slate-700">{ideas.length} Tổng</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-100">
              <span className="font-medium text-amber-900">1. Chờ duyệt Pitch Idea</span>
              <span className="font-bold text-amber-800">{ideaStats.pitch}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50/70 border border-blue-100">
              <span className="font-medium text-blue-900">2. Đã giao việc & Soạn Script</span>
              <span className="font-bold text-blue-800">{ideaStats.assignment + ideaStats.script}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-purple-50/70 border border-purple-100">
              <span className="font-medium text-purple-900">3. Đang quay dựng (Production)</span>
              <span className="font-bold text-purple-800">{ideaStats.production}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/70 border border-rose-100">
              <span className="font-medium text-rose-900">4. Chờ duyệt QA / Bản dựng</span>
              <span className="font-bold text-rose-800">{ideaStats.qa}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50/70 border border-emerald-100">
              <span className="font-medium text-emerald-900">5. Đã duyệt & Xuất bản xong</span>
              <span className="font-bold text-emerald-800">{ideaStats.complete}</span>
            </div>
          </div>
        </div>

        {/* Team Members Summary */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <Users size={14} className="text-indigo-600" />
              Đội Ngũ Nhân Sự
            </h3>
            <span className="text-xs font-bold text-slate-700">{members.filter(m => m.active).length} Hoạt động</span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-700 font-medium">Core Team (Quản lý)</span>
              <span className="font-bold text-slate-900">{members.filter(m => m.role === "Core" && m.active).length}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-700 font-medium">Editor (Biên tập & QA)</span>
              <span className="font-bold text-slate-900">{members.filter(m => m.role === "E" && m.active).length}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200/80">
              <span className="text-slate-700 font-medium">Producer (Sáng tạo & Quay dựng)</span>
              <span className="font-bold text-slate-900">{members.filter(m => m.role === "P" && m.active).length}</span>
            </div>
          </div>

          <p className="text-[11px] text-slate-400 pt-1">
            * Để thêm bớt nhân sự hoặc phân quyền, hãy vào tab <b>Đội ngũ & Audit Log</b>.
          </p>
        </div>

        {/* System Details Card */}
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
            <Info size={14} className="text-indigo-600" />
            Thông Tin Hệ Thống
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2 rounded bg-slate-50">
              <span className="text-slate-500">Cơ sở dữ liệu:</span>
              <span className="font-semibold text-slate-800">Neon Serverless Postgres</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50">
              <span className="text-slate-500">Môi trường:</span>
              <span className="font-semibold text-slate-800">Next.js 16 + React 19</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50">
              <span className="text-slate-500">Quy chuẩn Video:</span>
              <span className="font-semibold text-slate-800">YouTube Master 16:9 & TikTok 9:16</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-50">
              <span className="text-slate-500">Lịch bên ngoài:</span>
              <span className="font-semibold text-slate-800 truncate max-w-[140px]">
                {settings.externalCalendarUrl ? "Đã liên kết" : "Chưa liên kết"}
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
