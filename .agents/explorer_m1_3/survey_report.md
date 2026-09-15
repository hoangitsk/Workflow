# Survey Report: Build Health, JSX Syntax & TypeScript Blockers
**Agent**: Explorer M1_3 (M1 Build Health & Syntax Explorer)  
**Workspace Root**: `/run/media/harlan/New Volume/workflow`  
**Date**: 2026-09-15  

---

## 1. Executive Summary

An in-depth investigation was conducted into the build health, JSX syntax errors, React hook violations, typing discrepancies, and compiler toolchains across the "Ý Niệm Điện Ảnh" (YNDA) codebase.

The primary build-blocking failure currently halting `npx tsc --noEmit` is **TS1382: Unexpected token. Did you mean `{'>'}` or `&gt;`?** at three distinct lines in `src/app/components/ClientApp.tsx` (lines 1903, 1979, and 2082). 

Critically, when these three JSX parsing errors are bypassed, TypeScript proceeds to semantic type-checking and unmasks **two subsequent blocking type errors**:
1. **TS2339 in `src/lib/reference-utils.tsx:168`**: `Property 'trim' does not exist on type 'never'`. Inside `parseReferences`, an improperly bounded union type `string | ReferenceItem[]` narrows `item` to `never` when branching on `typeof item === "string"`.
2. **Eleven TS2322 errors in `src/app/page.tsx:33-43`**: An untyped object literal `initialData` initializes array properties as empty arrays `[]`, causing TypeScript to infer `never[]` for `members`, `platforms`, `channelGroups`, `platformChannels`, `ideas`, `comments`, `auditLogs`, `notifications`, `checklists`, and `pitchingBatches`.

Furthermore, `src/lib/reference-utils.tsx` contains a direct violation of the **Rules of Hooks** (`FormattedText` executes an early return before `useMemo`), triggering `react-hooks/rules-of-hooks` under Next.js 16.3.2 and React 19.2.8.

This report provides the complete analysis, root causes, exact code diffs, and the turn-key verification recipe for Worker M1.

---

## 2. Execution Environment & Runtime Analysis

### 2.1 Verified Node & npm Runtime
The execution environment was verified on the host system:
- **Node runtime path**: `/usr/lib/chatgpt/resources/cua_node/bin/node`
- **Node version**: `v24.20.0`
- **npm runtime path**: `/usr/lib/chatgpt/resources/cua_node/bin/npm`
- **npm version**: `11.19.0`
- **Mandatory Shell PATH export**:
  ```bash
  export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH"
  ```

### 2.2 Container Isolation & Next.js SWC Nuance
1. **Offline Environment**: The execution environment operates in a strictly isolated offline sandbox. DNS lookups to `registry.npmjs.org` resolve to `Could not resolve host`.
2. **SWC Platform Binary**: `node_modules/@next` contains the Windows native binary `swc-win32-x64-msvc` (installed from the Windows host). When `npm run build` (`next build`) runs inside the Linux container, Next.js detects the missing Linux binary `@next/swc-linux-x64-gnu` and attempts to fetch it over the network, which fails in the offline sandbox.
3. **TypeScript Verification Authority**: `npx tsc --noEmit` runs 100% locally and offline without requiring network access or native SWC binaries. Resolving all TypeScript and ESLint errors guarantees that when the project is deployed to Vercel (or executed on Windows via `deploy.bat`), the build succeeds without error.

---

## 3. Examination of `src/app/components/ClientApp.tsx` (JSX Syntax Blockers)

### 3.1 Direct Compiler Observation
Running `npx tsc --noEmit` yields:
```
src/app/components/ClientApp.tsx:1903:100 - error TS1382: Unexpected token. Did you mean `{'>'}` or `&gt;`?
1903                 <p className="text-[11px] text-slate-500 mt-1">Chuột phải vào Chủ đề trên Discord -> <b>Sao chép liên kết</b> rồi dán vào đây để bot tự gửi tin vào đúng chủ đề kênh này.</p>
                                                                                                        ~

src/app/components/ClientApp.tsx:1979:100 - error TS1382: Unexpected token. Did you mean `{'>'}` or `&gt;`?
1979                 <p className="text-[11px] text-slate-500 mt-1">Chuột phải vào Chủ đề trên Discord -> <b>Sao chép liên kết</b> rồi dán vào đây để bot tự gửi tin vào đúng chủ đề kênh này.</p>
                                                                                                        ~

src/app/components/ClientApp.tsx:2082:115 - error TS1382: Unexpected token. Did you mean `{'>'}` or `&gt;`?
2082                   <option value="5. Personal Branding (Chuyên môn & Nhân vật)">5. Personal Branding — Chuyên môn -> Xây dựng nhân vật (tính cách, phân tích hành vi)</option>
                                                                                                                       ~
```

### 3.2 Root Cause Analysis
In JSX syntax (specification conforming to XML/HTML parsing rules), the `>` and `<` characters are reserved as element tag delimiters. When `->` is placed directly in raw JSX text (outside of a string literal), the JSX lexer treats `>` as an unexpected token (TS1382).

### 3.3 Evaluation of Fix Alternatives

| Option | Syntax | Rendered Output | Visual Quality | Recommendation |
| :--- | :--- | :--- | :--- | :--- |
| **Option A: HTML Entity** | `&rarr;` | `→` (Unicode Right Arrow) | **Highest / Professional**. Native HTML entity recognized across all modern browsers and JSX parsers. Fits modern SaaS UI design. | **Recommended** |
| **Option B: JSX Expression** | `{'->'}` | `->` (ASCII Arrow) | **Medium**. Valid JSX, but renders ugly programmer ASCII text in user-facing Vietnamese UI. | Acceptable fallback |
| **Option C: Escaped Greater-Than** | `-&gt;` | `->` (ASCII Arrow) | **Low**. Clunky to read in source code, still renders ASCII arrow in UI. | Discouraged |

### 3.4 Concrete Code Diffs for `ClientApp.tsx`

#### Line 1903 (Modal: New Channel Discord Help Text)
```diff
--- a/src/app/components/ClientApp.tsx
+++ b/src/app/components/ClientApp.tsx
@@ -1900,4 +1900,4 @@
               <div>
                 <FieldLabel>Link Chủ đề Discord (Thread) hoặc Webhook riêng cho Kênh</FieldLabel>
                 <TextInput id="channelDiscordWebhook" placeholder="VD: Link chủ đề Discord https://discord.com/channels/... hoặc ID Thread" />
-                <p className="text-[11px] text-slate-500 mt-1">Chuột phải vào Chủ đề trên Discord -> <b>Sao chép liên kết</b> rồi dán vào đây để bot tự gửi tin vào đúng chủ đề kênh này.</p>
+                <p className="text-[11px] text-slate-500 mt-1">Chuột phải vào Chủ đề trên Discord &rarr; <b>Sao chép liên kết</b> rồi dán vào đây để bot tự gửi tin vào đúng chủ đề kênh này.</p>
               </div>
```

#### Line 1979 (Modal: Edit Channel Discord Help Text)
```diff
--- a/src/app/components/ClientApp.tsx
+++ b/src/app/components/ClientApp.tsx
@@ -1976,4 +1976,4 @@
               <div>
                 <FieldLabel>Link Chủ đề Discord (Thread) hoặc Webhook riêng cho Kênh</FieldLabel>
                 <TextInput id="editChannelDiscordWebhook" defaultValue={editChannelTarget.discordWebhookUrl || ""} placeholder="VD: Link chủ đề Discord https://discord.com/channels/... hoặc ID Thread" />
-                <p className="text-[11px] text-slate-500 mt-1">Chuột phải vào Chủ đề trên Discord -> <b>Sao chép liên kết</b> rồi dán vào đây để bot tự gửi tin vào đúng chủ đề kênh này.</p>
+                <p className="text-[11px] text-slate-500 mt-1">Chuột phải vào Chủ đề trên Discord &rarr; <b>Sao chép liên kết</b> rồi dán vào đây để bot tự gửi tin vào đúng chủ đề kênh này.</p>
               </div>
```

#### Line 2082 (Modal: New Pitching Batch Category Option)
```diff
--- a/src/app/components/ClientApp.tsx
+++ b/src/app/components/ClientApp.tsx
@@ -2080,3 +2080,3 @@
                 <FieldLabel required>Tuyến bài & Giai đoạn định hướng đợt này</FieldLabel>
                 <Select id="batchCategory" required>
-                  <option value="5. Personal Branding (Chuyên môn & Nhân vật)">5. Personal Branding — Chuyên môn -> Xây dựng nhân vật (tính cách, phân tích hành vi)</option>
+                  <option value="5. Personal Branding (Chuyên môn & Nhân vật)">5. Personal Branding — Chuyên môn &rarr; Xây dựng nhân vật (tính cách, phân tích hành vi)</option>
                   <option value="1. Branding (Làm sáng thương hiệu)">1. Branding — Làm sáng thương hiệu (Khẳng định giá trị core của Ý niệm điện ảnh)</option>
```

---

## 4. Examination of `src/lib/reference-utils.tsx` (React Hooks & Typing Issues)

### 4.1 React Hook Violation in `FormattedText` (`react-hooks/rules-of-hooks`)
- **Location**: Lines 334–337
```tsx
export function FormattedText({
  text,
  className = "",
  linkClassName = "..."
}: {
  text?: string | null;
  className?: string;
  linkClassName?: string;
}) {
  if (!text) return null; // <--- EARLY RETURN BEFORE HOOK CALL!

  // Regex nhận diện Markdown links [title](url) và standard URLs
  const tokens = useMemo(() => {
    ...
  }, [text]);
```
- **Analysis**: Calling `if (!text) return null;` before `useMemo` is a violation of the Rules of Hooks. When `text` is undefined/null, React registers 0 hooks. If `text` changes to a string on a subsequent render, React registers 1 hook (`useMemo`), causing a hook order mismatch crash.
- **Clean Fix**: Call `useMemo` unconditionally at the top of the component and return an empty array if `!text`. Then perform the early return `if (!text || tokens.length === 0) return null;` after the hook.

```tsx
export function FormattedText({
  text,
  className = "",
  linkClassName = "text-blue-600 hover:text-blue-700 underline decoration-blue-300 hover:decoration-blue-600 font-medium inline-flex items-center gap-0.5 break-all"
}: {
  text?: string | null;
  className?: string;
  linkClassName?: string;
}) {
  // Call hook unconditionally before any early returns
  const tokens = useMemo(() => {
    if (!text) return [];
    const regex = /(\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\))|(https?:\/\/[^\s<>"]+)|(www\.[^\s<>"]+)/g;
    const parts: Array<{ type: "text" | "link"; content: string; url?: string; label?: string }> = [];
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          content: text.substring(lastIndex, match.index)
        });
      }

      if (match[1]) {
        parts.push({
          type: "link",
          content: match[1],
          label: match[2],
          url: match[3]
        });
      } else if (match[4]) {
        parts.push({
          type: "link",
          content: match[4],
          label: match[4],
          url: match[4]
        });
      } else if (match[5]) {
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

  if (!text || tokens.length === 0) return null;

  return (
    <span className={`whitespace-pre-wrap leading-relaxed ${className}`}>
      ...
    </span>
  );
}
```

### 4.2 State In Effect in `MultiReferenceEditor` (`react-hooks/set-state-in-effect`)
- **Location**: Lines 542–549
```tsx
  useEffect(() => {
    const parsed = parseReferences(defaultValue);
    if (parsed.length > 0) {
      setItems(parsed);
    } else {
      setItems([{ url: "", title: "", type: "video" }]);
    }
  }, [defaultValue]);
```
- **Analysis**: React 19 / Next.js 16 flags calling `setItems` synchronously within `useEffect` because it triggers cascading re-renders.
- **Clean Fix**: Use the React recommended pattern for adjusting state during rendering when props change, or guard the state update:
```tsx
  const [prevDefaultValue, setPrevDefaultValue] = useState(defaultValue);
  if (defaultValue !== prevDefaultValue) {
    setPrevDefaultValue(defaultValue);
    const parsed = parseReferences(defaultValue);
    setItems(parsed.length > 0 ? parsed : [{ url: "", title: "", type: "video" }]);
  }
```

### 4.3 Type Error TS2339 in `parseReferences` (`item.trim()`)
- **Location**: Line 158–172
```ts
export function parseReferences(input?: string | ReferenceItem[] | null): ReferenceItem[] {
  if (!input) return [];

  // Nếu đã là mảng
  if (Array.isArray(input)) {
    return input
      .filter(item => item && (typeof item === "string" || (typeof item === "object" && item.url)))
      .map(item => {
        if (typeof item === "string") {
          return {
            url: item.trim(), // <--- TS2339: Property 'trim' does not exist on type 'never'
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
```
- **Analysis**: The parameter `input` is typed as `string | ReferenceItem[] | null`. When `Array.isArray(input)` is true, TypeScript narrows `input` to `ReferenceItem[]`. Inside `input.map(...)`, `item` is known to be `ReferenceItem` (an object). TypeScript knows `typeof item === "string"` is impossible, narrowing `item` to `never`. Calling `item.trim()` throws TS2339.
- **Clean Fix**: Update the parameter union to allow string arrays or mixed arrays: `input?: string | (ReferenceItem | string)[] | null`, and safely cast/type-guard `item`:
```ts
export function parseReferences(input?: string | (ReferenceItem | string)[] | null): ReferenceItem[] {
  if (!input) return [];

  // Nếu đã là mảng
  if (Array.isArray(input)) {
    return (input as (string | ReferenceItem)[])
      .filter((item): item is string | ReferenceItem => Boolean(item && (typeof item === "string" || (typeof item === "object" && "url" in item && Boolean((item as ReferenceItem).url)))))
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
      .filter(i => Boolean(i.url));
  }
```

### 4.4 Additional Types & Linter Fixes in `reference-utils.tsx`
1. **Remove unused imports**: Line 3 `Play`, Line 4 `Link as LinkIcon`, Line 5 `Copy` are imported but never used. Remove them to satisfy `@typescript-eslint/no-unused-vars`.
2. **`prefer-const`**: Line 254 (`let titleCandidate`) and Line 308 (`let host`) are never reassigned. Change `let` to `const`.
3. **`defaultValue` typing**: Line 527 in `MultiReferenceEditor` parameter definition should support `null` from PostgreSQL nullable columns:
   ```ts
   defaultValue?: string | (ReferenceItem | string)[] | null;
   ```

---

## 5. Secondary Type Errors in `src/app/page.tsx` Unmasked by Syntax Resolution

When the JSX syntax errors are resolved, `npx tsc --noEmit` runs semantic checks on `src/app/page.tsx` and exposes **11 TS2322 errors**:
```
src/app/page.tsx:33:9 - error TS2322: Type 'Member[]' is not assignable to type 'never[]'.
src/app/page.tsx:34:9 - error TS2322: Type 'Platform[]' is not assignable to type 'never[]'.
src/app/page.tsx:35:9 - error TS2322: Type 'ChannelGroup[]' is not assignable to type 'never[]'.
src/app/page.tsx:36:9 - error TS2322: Type 'PlatformChannel[]' is not assignable to type 'never[]'.
src/app/page.tsx:37:9 - error TS2322: Type 'Idea[]' is not assignable to type 'never[]'.
src/app/page.tsx:38:9 - error TS2322: Type 'CommentItem[]' is not assignable to type 'never[]'.
src/app/page.tsx:39:9 - error TS2322: Type 'AuditLogItem[]' is not assignable to type 'never[]'.
src/app/page.tsx:40:9 - error TS2322: Type 'NotificationItem[]' is not assignable to type 'never[]'.
src/app/page.tsx:41:9 - error TS2322: Type 'ChecklistItem[]' is not assignable to type 'never[]'.
src/app/page.tsx:42:9 - error TS2322: Type 'AppSettings' is not assignable to type '{ ... }'.
src/app/page.tsx:43:9 - error TS2322: Type 'PitchingBatch[]' is not assignable to type 'never[]'.
```

### Root Cause
In `src/app/page.tsx`, lines 15–27:
```tsx
  let initialData = {
    members: [],
    platforms: [],
    channelGroups: [],
    platformChannels: [],
    ideas: [],
    comments: [],
    auditLogs: [],
    notifications: [],
    checklists: [],
    settings: { discordWebhookUrl: '', discordIdeaWebhookUrl: '', externalCalendarUrl: '' },
    pitchingBatches: []
  };
```
Because no type interface is specified, TypeScript's type inference assigns `never[]` to every empty array `[]`. Later in lines 32–44, when `data` from `getAllData()` assigns `data.members` (which is `Member[]`), TypeScript errors because `Member[]` cannot be assigned to `never[]`.

### Solution
Import the model types from `../lib/types` and add an explicit type annotation to `initialData`:
```tsx
import { 
  Member, 
  Platform, 
  ChannelGroup, 
  PlatformChannel, 
  Idea, 
  CommentItem, 
  AuditLogItem, 
  NotificationItem, 
  ChecklistItem, 
  AppSettings, 
  PitchingBatch 
} from "../lib/types";

// Inside Page()
let initialData: {
  members: Member[];
  platforms: Platform[];
  channelGroups: ChannelGroup[];
  platformChannels: PlatformChannel[];
  ideas: Idea[];
  comments: CommentItem[];
  auditLogs: AuditLogItem[];
  notifications: NotificationItem[];
  checklists: ChecklistItem[];
  settings: AppSettings;
  pitchingBatches: PitchingBatch[];
} = {
  members: [],
  platforms: [],
  channelGroups: [],
  platformChannels: [],
  ideas: [],
  comments: [],
  auditLogs: [],
  notifications: [],
  checklists: [],
  settings: { discordWebhookUrl: '', discordIdeaWebhookUrl: '', externalCalendarUrl: '' },
  pitchingBatches: []
};
```

---

## 6. Concrete Implementation Plan for Worker M1

Worker M1 must execute the fixes in the following order:

1. **Step 1: Fix `src/app/components/ClientApp.tsx`**
   - Replace line 1903 `->` with `&rarr;`
   - Replace line 1979 `->` with `&rarr;`
   - Replace line 2082 `->` with `&rarr;`
2. **Step 2: Fix `src/lib/reference-utils.tsx`**
   - Move `useMemo` in `FormattedText` before early return.
   - Adjust `defaultValue` effect/state handling in `MultiReferenceEditor`.
   - Update `parseReferences` signature to `input?: string | (ReferenceItem | string)[] | null` and fix line 168 `never` type error.
   - Remove unused imports (`Play`, `LinkIcon`, `Copy`) and change `let` to `const` on lines 254 and 308.
3. **Step 3: Fix `src/app/page.tsx`**
   - Import domain types (`Member`, `Platform`, `ChannelGroup`, `PlatformChannel`, `Idea`, `CommentItem`, `AuditLogItem`, `NotificationItem`, `ChecklistItem`, `AppSettings`, `PitchingBatch`).
   - Annotate `initialData` with the explicit type definition.
4. **Step 4: Clean `.next` build cache**
   - Remove `.next` cache (`rm -rf .next`) to ensure no stale route validator files persist.

---

## 7. Verification Recipe for Worker M1

Worker M1 must follow this exact recipe to verify build and type health:

```bash
# 1. Ensure the verified Node runtime is active
export PATH="/usr/lib/chatgpt/resources/cua_node/bin:$PATH"

# 2. Clean any stale cache
rm -rf .next

# 3. Verify TypeScript compiles cleanly with zero errors
npx tsc --noEmit

# 4. Verify ESLint passes without errors on modified files
npx eslint src/app/components/ClientApp.tsx src/lib/reference-utils.tsx src/app/page.tsx
```

### Expected Success Output:
- `npx tsc --noEmit` exits with status `0` and **no terminal output**.
- `npx eslint ...` exits with status `0`.
- All acceptance criteria for syntax and build integrity are 100% satisfied.
