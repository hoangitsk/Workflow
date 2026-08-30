import React, { useState, useEffect, useMemo } from "react";
import { 
  Video, Play, FileText, FolderOpen, Music, Image as ImageIcon, 
  Link as LinkIcon, ExternalLink, Plus, Trash2, ListPlus, Sparkles, 
  ChevronDown, Globe, Check, Copy
} from "lucide-react";
import { ReferenceType, ReferenceItem } from "./types";

export const REFERENCE_TYPE_CONFIG: Record<ReferenceType, {
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  badgeClass: string;
  borderClass: string;
  bgClass: string;
  textClass: string;
}> = {
  video: {
    label: "Video mẫu",
    shortLabel: "Video",
    icon: Video,
    badgeClass: "bg-rose-50 text-rose-700 border-rose-200",
    borderClass: "border-rose-200 hover:border-rose-300",
    bgClass: "bg-rose-50/50 hover:bg-rose-50",
    textClass: "text-rose-700"
  },
  doc: {
    label: "Tài liệu / Script",
    shortLabel: "Tài liệu",
    icon: FileText,
    badgeClass: "bg-sky-50 text-sky-700 border-sky-200",
    borderClass: "border-sky-200 hover:border-sky-300",
    bgClass: "bg-sky-50/50 hover:bg-sky-50",
    textClass: "text-sky-700"
  },
  drive: {
    label: "Drive / File",
    shortLabel: "Drive",
    icon: FolderOpen,
    badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    borderClass: "border-emerald-200 hover:border-emerald-300",
    bgClass: "bg-emerald-50/50 hover:bg-emerald-50",
    textClass: "text-emerald-700"
  },
  audio: {
    label: "Âm thanh / Nhạc",
    shortLabel: "Âm thanh",
    icon: Music,
    badgeClass: "bg-purple-50 text-purple-700 border-purple-200",
    borderClass: "border-purple-200 hover:border-purple-300",
    bgClass: "bg-purple-50/50 hover:bg-purple-50",
    textClass: "text-purple-700"
  },
  image: {
    label: "Moodboard / Ảnh",
    shortLabel: "Moodboard",
    icon: ImageIcon,
    badgeClass: "bg-pink-50 text-pink-700 border-pink-200",
    borderClass: "border-pink-200 hover:border-pink-300",
    bgClass: "bg-pink-50/50 hover:bg-pink-50",
    textClass: "text-pink-700"
  },
  other: {
    label: "Liên kết khác",
    shortLabel: "Link",
    icon: Globe,
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    borderClass: "border-slate-200 hover:border-slate-300",
    bgClass: "bg-slate-50 hover:bg-slate-100",
    textClass: "text-slate-700"
  }
};

/**
 * Tự động đoán định dạng reference dựa trên URL
 */
export function detectReferenceType(url: string): ReferenceType {
  if (!url) return "other";
  const u = url.toLowerCase().trim();

  // Video
  if (
    u.includes("youtube.com") || 
    u.includes("youtu.be") || 
    u.includes("tiktok.com") || 
    u.includes("vimeo.com") || 
    u.includes("facebook.com/watch") || 
    u.includes("facebook.com/reel") || 
    u.includes("fb.watch") || 
    u.includes("instagram.com/reel") || 
    u.includes("instagram.com/p/") ||
    /\.(mp4|mov|avi|wmv|mkv|webm)(\?|$)/i.test(u)
  ) {
    return "video";
  }

  // Documents / Notion / Scripts
  if (
    u.includes("docs.google.com/document") ||
    u.includes("docs.google.com/presentation") ||
    u.includes("docs.google.com/spreadsheets") ||
    u.includes("notion.so") ||
    u.includes("notion.site") ||
    u.includes("medium.com") ||
    u.includes("substack.com") ||
    u.includes("coda.io") ||
    /\.(pdf|doc|docx|ppt|pptx|xls|xlsx|txt|md)(\?|$)/i.test(u)
  ) {
    return "doc";
  }

  // Drive / Storage / Design
  if (
    u.includes("drive.google.com") ||
    u.includes("dropbox.com") ||
    u.includes("onedrive.live.com") ||
    u.includes("1drv.ms") ||
    u.includes("box.com") ||
    u.includes("figma.com") ||
    u.includes("canva.com") ||
    /\.(zip|rar|7z|tar|psd|ai|prproj|aep)(\?|$)/i.test(u)
  ) {
    return "drive";
  }

  // Audio / Music
  if (
    u.includes("spotify.com") ||
    u.includes("soundcloud.com") ||
    u.includes("music.apple.com") ||
    u.includes("audiomack.com") ||
    u.includes("bandcamp.com") ||
    /\.(mp3|wav|m4a|aac|flac|ogg)(\?|$)/i.test(u)
  ) {
    return "audio";
  }

  // Images / Moodboard
  if (
    u.includes("pinterest.com") ||
    u.includes("pin.it") ||
    u.includes("behance.net") ||
    u.includes("dribbble.com") ||
    u.includes("imgur.com") ||
    u.includes("unsplash.com") ||
    /\.(jpg|jpeg|png|webp|gif|svg|bmp)(\?|$)/i.test(u)
  ) {
    return "image";
  }

  return "other";
}

/**
 * Phân tích chuỗi đầu vào thành mảng ReferenceItem
 * Hỗ trợ: JSON array, chuỗi nhiều dòng URL, text có link, single URL legacy
 */
export function parseReferences(input?: string | ReferenceItem[] | null): ReferenceItem[] {
  if (!input) return [];

  // Nếu đã là mảng
  if (Array.isArray(input)) {
    return input
      .filter(item => item && (typeof item === "string" || (typeof item === "object" && item.url)))
      .map(item => {
        if (typeof item === "string") {
          return {
            url: item.trim(),
            title: "",
            type: detectReferenceType(item)
          };
        }
        return {
          url: item.url.trim(),
          title: item.title?.trim() || "",
          type: item.type || detectReferenceType(item.url)
        };
      })
      .filter(i => i.url);
  }

  const raw = String(input).trim();
  if (!raw) return [];

  // Thử parse JSON
  if (raw.startsWith("[") && raw.endsWith("]")) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed
          .filter(item => item && (typeof item === "string" || (typeof item === "object" && item.url)))
          .map(item => {
            if (typeof item === "string") {
              return {
                url: item.trim(),
                title: "",
                type: detectReferenceType(item)
              };
            }
            return {
              url: item.url?.trim() || "",
              title: item.title?.trim() || "",
              type: item.type || detectReferenceType(item.url || "")
            };
          })
          .filter(i => i.url);
      }
    } catch {
      // Bỏ qua nếu không phải JSON hợp lệ
    }
  }

  const results: ReferenceItem[] = [];
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check markdown link [Title](url)
    const mdMatch = trimmed.match(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/);
    if (mdMatch) {
      results.push({
        title: mdMatch[1].trim(),
        url: mdMatch[2].trim(),
        type: detectReferenceType(mdMatch[2])
      });
      continue;
    }

    // Check URLs in line
    const urlMatches = trimmed.match(/https?:\/\/[^\s,;"]+/g);
    if (urlMatches && urlMatches.length > 0) {
      for (const matchedUrl of urlMatches) {
        // Lấy phần text còn lại làm title nếu có
        let titleCandidate = trimmed.replace(matchedUrl, "").replace(/^[-*•\d\.\s:\)]+/, "").trim();
        // Xoá các ký tự bao quanh như ngoặc
        titleCandidate = titleCandidate.replace(/^[\(\[\{]/, "").replace(/[\)\]\}]$/, "").trim();

        results.push({
          url: matchedUrl.trim(),
          title: titleCandidate || "",
          type: detectReferenceType(matchedUrl)
        });
      }
      continue;
    }

    // Nếu dòng có link dạng www.
    const wwwMatches = trimmed.match(/www\.[^\s,;"]+/g);
    if (wwwMatches && wwwMatches.length > 0) {
      for (const matchedUrl of wwwMatches) {
        const fullUrl = `https://${matchedUrl}`;
        let titleCandidate = trimmed.replace(matchedUrl, "").replace(/^[-*•\d\.\s:\)]+/, "").trim();
        results.push({
          url: fullUrl,
          title: titleCandidate || "",
          type: detectReferenceType(fullUrl)
        });
      }
    }
  }

  // Nếu không parse được gì nhưng chuỗi không rỗng
  if (results.length === 0 && (raw.startsWith("http://") || raw.startsWith("https://"))) {
    results.push({
      url: raw,
      title: "",
      type: detectReferenceType(raw)
    });
  }

  // Loại bỏ trùng lặp theo URL
  const seen = new Set<string>();
  const uniqueResults: ReferenceItem[] = [];
  for (const item of results) {
    if (item.url && !seen.has(item.url)) {
      seen.add(item.url);
      uniqueResults.push(item);
    }
  }

  return uniqueResults;
}

/**
 * Đóng gói mảng ReferenceItem thành chuỗi JSON lưu DB
 */
export function serializeReferences(items: ReferenceItem[]): string {
  const validItems = items
    .filter(i => i && i.url && i.url.trim())
    .map(i => ({
      url: i.url.trim(),
      title: i.title?.trim() || "",
      type: i.type || detectReferenceType(i.url)
    }));

  if (validItems.length === 0) return "";
  return JSON.stringify(validItems);
}

/**
 * Rút gọn hiển thị URL cho đẹp mắt
 */
export function formatUrlDisplay(url: string, maxLength: number = 36): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    let host = parsed.hostname.replace(/^www\./, "");
    let path = parsed.pathname + parsed.search;
    if (path === "/" || !path) return host;
    if (path.length > 18) {
      path = path.slice(0, 15) + "...";
    }
    const full = `${host}${path}`;
    return full.length > maxLength ? full.slice(0, maxLength - 3) + "..." : full;
  } catch {
    return url.length > maxLength ? url.slice(0, maxLength - 3) + "..." : url;
  }
}

/**
 * Component hiển thị văn bản với link tự động chuyển thành thẻ <a> có thể click
 * Hỗ trợ URL ở bất cứ đâu trong câu, markdown [title](url), ngắt dòng
 */
export function FormattedText({
  text,
  className = "",
  linkClassName = "text-blue-600 hover:text-blue-700 underline decoration-blue-300 hover:decoration-blue-600 font-medium inline-flex items-center gap-0.5 break-all"
}: {
  text?: string | null;
  className?: string;
  linkClassName?: string;
}) {
  if (!text) return null;

  // Regex nhận diện Markdown links [title](url) và standard URLs
  const tokens = useMemo(() => {
    const regex = /(\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\))|(https?:\/\/[^\s<>"]+)|(www\.[^\s<>"]+)/g;
    const parts: Array<{ type: "text" | "link"; content: string; url?: string; label?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      // Phần text trước match
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.substring(lastIndex, match.index)
        });
      }

      if (match[1]) {
        // Markdown link [title](url)
        parts.push({
          type: "link",
          content: match[1],
          label: match[2],
          url: match[3]
        });
      } else if (match[4]) {
        // http / https URL
        parts.push({
          type: "link",
          content: match[4],
          label: match[4],
          url: match[4]
        });
      } else if (match[5]) {
        // www. URL
        parts.push({
          type: "link",
          content: match[5],
          label: match[5],
          url: `https://${match[5]}`
        });
      }

      lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: "text",
        content: text.substring(lastIndex)
      });
    }

    return parts;
  }, [text]);

  return (
    <span className={`whitespace-pre-wrap leading-relaxed ${className}`}>
      {tokens.map((part, idx) => {
        if (part.type === "text") {
          return <React.Fragment key={idx}>{part.content}</React.Fragment>;
        }

        const targetUrl = part.url || "#";
        const displayLabel = part.label || part.content;

        return (
          <a
            key={idx}
            href={targetUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={linkClassName}
            title={targetUrl}
          >
            <span>{displayLabel}</span>
            <ExternalLink size={10} className="inline shrink-0 opacity-70 ml-0.5" />
          </a>
        );
      })}
    </span>
  );
}

/**
 * Component hiển thị danh sách đa Reference với icon và định dạng trực quan
 */
export function ReferenceList({
  references,
  title,
  className = "",
  compact = false
}: {
  references?: string | ReferenceItem[] | null;
  title?: string;
  className?: string;
  compact?: boolean;
}) {
  const items = useMemo(() => parseReferences(references), [references]);

  if (!items || items.length === 0) return null;

  if (compact) {
    return (
      <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
        {items.map((item, idx) => {
          const config = REFERENCE_TYPE_CONFIG[item.type || "other"] || REFERENCE_TYPE_CONFIG.other;
          const Icon = config.icon;
          const label = item.title || formatUrlDisplay(item.url, 24);

          return (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md border font-medium transition-colors ${config.badgeClass} hover:opacity-90`}
              title={`${config.label}: ${item.url}`}
            >
              <Icon size={10} className="shrink-0" />
              <span className="truncate max-w-[140px]">{label}</span>
              <ExternalLink size={8} className="shrink-0 opacity-60" />
            </a>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`space-y-1.5 ${className}`}>
      {title && (
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
          <Sparkles size={12} className="text-amber-500" />
          <span>{title} ({items.length})</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {items.map((item, idx) => {
          const config = REFERENCE_TYPE_CONFIG[item.type || "other"] || REFERENCE_TYPE_CONFIG.other;
          const Icon = config.icon;
          const displayTitle = item.title || formatUrlDisplay(item.url, 32);

          return (
            <a
              key={idx}
              href={item.url}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`group flex items-start gap-2.5 p-2 rounded-lg border transition-all text-xs ${config.borderClass} ${config.bgClass}`}
            >
              <div className={`p-1.5 rounded-md bg-white border shrink-0 ${config.badgeClass}`}>
                <Icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${config.textClass}`}>
                    {config.label}
                  </span>
                </div>
                <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                  {displayTitle}
                </div>
                <div className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5 font-mono">
                  <span className="truncate">{item.url}</span>
                  <ExternalLink size={10} className="shrink-0 opacity-50 group-hover:opacity-100 group-hover:text-blue-600" />
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Component nhập liệu đa Reference (Hỗ trợ 2-3+ link nhiều hình thức)
 * Tích hợp chế độ thêm từng link hoặc dán nhanh nhiều link cùng lúc
 */
export function MultiReferenceEditor({
  id = "referenceVideoLink",
  defaultValue,
  label = "Tài liệu & Video tham khảo (Reference - Hỗ trợ nhiều link)",
  helperText = "Có thể thêm 2-3 hoặc nhiều link với các định dạng: Video mẫu, Google Docs kịch bản, Drive asset, Nhạc nền, Moodboard ảnh...",
  placeholder = "Dán link YouTube, TikTok, Docs, Drive, Notion..."
}: {
  id?: string;
  defaultValue?: string | ReferenceItem[];
  label?: string;
  helperText?: string;
  placeholder?: string;
}) {
  const [items, setItems] = useState<ReferenceItem[]>(() => {
    const parsed = parseReferences(defaultValue);
    if (parsed.length > 0) return parsed;
    return [{ url: "", title: "", type: "video" }];
  });

  const [showQuickPaste, setShowQuickPaste] = useState(false);
  const [quickPasteText, setQuickPasteText] = useState("");

  // Cập nhật khi defaultValue thay đổi từ ngoài
  useEffect(() => {
    const parsed = parseReferences(defaultValue);
    if (parsed.length > 0) {
      setItems(parsed);
    } else {
      setItems([{ url: "", title: "", type: "video" }]);
    }
  }, [defaultValue]);

  // Chuỗi serialized để gửi qua form
  const serializedValue = useMemo(() => {
    return serializeReferences(items);
  }, [items]);

  const handleAddItem = () => {
    setItems(prev => [...prev, { url: "", title: "", type: "video" }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length === 0) {
        return [{ url: "", title: "", type: "video" }];
      }
      return next;
    });
  };

  const handleItemChange = (index: number, field: keyof ReferenceItem, value: string) => {
    setItems(prev => {
      const next = [...prev];
      const current = { ...next[index] };

      if (field === "url") {
        current.url = value;
        // Tự động nhận diện loại nếu trước đó chưa đổi hoặc là mặc định
        if (value.trim()) {
          const detected = detectReferenceType(value);
          current.type = detected;
        }
      } else if (field === "type") {
        current.type = value as ReferenceType;
      } else if (field === "title") {
        current.title = value;
      }

      next[index] = current;
      return next;
    });
  };

  const handleApplyQuickPaste = () => {
    if (!quickPasteText.trim()) {
      setShowQuickPaste(false);
      return;
    }
    const parsed = parseReferences(quickPasteText);
    if (parsed.length > 0) {
      setItems(prev => {
        const existingNonEmpty = prev.filter(p => p.url && p.url.trim());
        const combined = [...existingNonEmpty, ...parsed];
        // Deduplicate
        const seen = new Set<string>();
        const unique: ReferenceItem[] = [];
        for (const item of combined) {
          if (item.url && !seen.has(item.url)) {
            seen.add(item.url);
            unique.push(item);
          }
        }
        return unique.length > 0 ? unique : [{ url: "", title: "", type: "video" }];
      });
    }
    setQuickPasteText("");
    setShowQuickPaste(false);
  };

  return (
    <div className="space-y-2">
      {/* Hidden input chứa chuỗi JSON serialize để form submit lấy được */}
      <input type="hidden" id={id} name={id} value={serializedValue} />

      <div className="flex items-center justify-between">
        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700">
          {label}
        </label>
        <button
          type="button"
          onClick={() => setShowQuickPaste(!showQuickPaste)}
          className="text-[11px] text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 hover:underline cursor-pointer"
        >
          <ListPlus size={12} />
          {showQuickPaste ? "Đóng dán nhanh" : "Dán nhanh nhiều link"}
        </button>
      </div>

      {helperText && (
        <p className="text-[11px] text-slate-500 leading-tight">
          {helperText}
        </p>
      )}

      {/* QUICK PASTE BOX */}
      {showQuickPaste && (
        <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-xl space-y-2 text-xs">
          <div className="flex items-center justify-between font-semibold text-blue-900 text-[11px]">
            <span>Dán danh sách nhiều link (mỗi link 1 dòng, hoặc text kèm link):</span>
          </div>
          <textarea
            rows={3}
            value={quickPasteText}
            onChange={(e) => setQuickPasteText(e.target.value)}
            placeholder={`VD:\nhttps://youtube.com/watch?v=...\n[Kịch bản mẫu] https://docs.google.com/document/...\nhttps://drive.google.com/drive/...`}
            className="w-full text-xs font-mono p-2 bg-white border border-blue-200 rounded-lg focus:outline-none focus:border-blue-600 text-slate-800"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowQuickPaste(false)}
              className="px-2.5 py-1 text-[11px] rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
            >
              Huỷ
            </button>
            <button
              type="button"
              onClick={handleApplyQuickPaste}
              className="px-2.5 py-1 text-[11px] rounded bg-blue-600 text-white font-medium hover:bg-blue-700 cursor-pointer inline-flex items-center gap-1"
            >
              <Check size={11} /> Nhập vào danh sách
            </button>
          </div>
        </div>
      )}

      {/* REFERENCE ITEMS LIST */}
      <div className="space-y-2 max-h-[260px] overflow-y-auto pr-1">
        {items.map((item, index) => {
          const currentType = item.type || detectReferenceType(item.url);
          const typeConfig = REFERENCE_TYPE_CONFIG[currentType] || REFERENCE_TYPE_CONFIG.other;

          return (
            <div 
              key={index}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
            >
              <div className="flex items-center gap-2">
                {/* Type selector */}
                <div className="relative shrink-0">
                  <select
                    value={currentType}
                    onChange={(e) => handleItemChange(index, "type", e.target.value)}
                    className={`text-xs font-medium pl-2 pr-6 py-1.5 rounded-lg border bg-white cursor-pointer focus:outline-none focus:border-slate-900 appearance-none ${typeConfig.textClass} ${typeConfig.borderClass}`}
                  >
                    <option value="video">🎬 Video mẫu</option>
                    <option value="doc">📄 Tài liệu / Script</option>
                    <option value="drive">📁 Drive / File</option>
                    <option value="audio">🎵 Âm thanh / Nhạc</option>
                    <option value="image">🎨 Moodboard / Ảnh</option>
                    <option value="other">🔗 Liên kết khác</option>
                  </select>
                  <ChevronDown size={11} className="absolute right-2 top-2.5 pointer-events-none opacity-50" />
                </div>

                {/* Title / Description note */}
                <input
                  type="text"
                  value={item.title || ""}
                  onChange={(e) => handleItemChange(index, "title", e.target.value)}
                  placeholder="Ghi chú / Tiêu đề (VD: Video mẫu nhịp cắt, Doc kịch bản...)"
                  className="flex-1 text-xs px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-800"
                />

                {/* Delete row */}
                <button
                  type="button"
                  onClick={() => handleRemoveItem(index)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0"
                  title="Xoá reference này"
                >
                  <Trash2 size={13} />
                </button>
              </div>

              {/* URL Input */}
              <div className="flex items-center gap-2">
                <input
                  type="url"
                  value={item.url || ""}
                  onChange={(e) => handleItemChange(index, "url", e.target.value)}
                  placeholder={placeholder}
                  className="w-full text-xs font-mono px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-slate-900 text-slate-800"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD MORE BUTTON */}
      <button
        type="button"
        onClick={handleAddItem}
        className="w-full py-2 px-3 border border-dashed border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-600 text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
      >
        <Plus size={13} /> Thêm link tham khảo (Reference)
      </button>
    </div>
  );
}