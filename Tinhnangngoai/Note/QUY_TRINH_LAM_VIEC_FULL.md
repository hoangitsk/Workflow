# QUY TRINH LAM VIEC FULL - YNDA WORKSPACE

Cap nhat: 18/09/2026  
Muc dich: Tai lieu nay dung de sua tay, dao tao thanh vien moi va lam nguon noi dung cho trang huong dan `/huong-dan`.

> Ban nay la note van hanh. Khong ghi token, mat khau, webhook, email rieng, link Drive rieng tu hoac thong tin noi bo nhay cam vao file nay.

---

## 1. Tom tat quy trinh tong

Luon chay cong viec theo vong lap:

```text
Dinh huong
  -> Idea
  -> Script
  -> Production
  -> Editor QC
  -> Core duyet
  -> Dang video
  -> Analytics
  -> Quay lai Dinh huong
```

Y nghia tung giai doan:

| Giai doan | Muc dich | Ket qua can co |
|---|---|---|
| Dinh huong | Chot muc tieu kenh, tuyen noi dung, nhan su va deadline | Checklist thang, dot pitching, the cong viec |
| Idea | Tim goc nhin moi, viet de xuat va duyet y tuong | Idea duoc duyet hoac yeu cau sua |
| Script | Bien idea thanh kich ban phan canh co the dung duoc | Script approved va khoa version |
| Production | Tao voice, dung hinh, lam phu de, hau ky | Video Draft V01 + source |
| Editor QC | Kiem tra chat luong va sua loi | Final Review Version |
| Core duyet | Duyet san pham cuoi ve thuong hieu, rui ro va chien luoc | Core Approved / Tra ve sua |
| Dang video | Chuan bi metadata, dang len nen tang, luu URL | Trang thai Published |
| Analytics | Do so lieu, rut bai hoc, cap nhat tri thuc kenh | Bao cao 24h / 7 ngay / 28 ngay |

---

## 2. Nguyen tac van hanh

1. Khong san xuat khi chua co dinh huong ro.
2. Khong viet script neu idea chua duoc duyet.
3. Khong tao voice hoac dung video neu script chua approved.
4. Khong gui Core neu Editor QC chua dat.
5. Khong dang video neu Core chua duyet dung ban final.
6. Dang hen lich tren nen tang chua tinh la da published.
7. Moi lan thay file final, script chinh, voice chinh hoac metadata quan trong sau khi duyet phai tao version moi va review lai.
8. Moi feedback phai co: vi tri loi, van de, cach sua, deadline.
9. Moi cong viec phai co owner, deadline va nguoi nhan tiep theo.
10. Analytics phai tao bai hoc quay nguoc ve vong dinh huong.

---

## 3. Vai tro

### 3.1. Core

Core giu dinh vi kenh, dieu phoi uu tien va cap quyen xuat ban.

Viec chinh:

- Xay checklist dinh huong thang.
- Mo dot pitching va chot tuyen noi dung.
- Duyet idea va phan cong Producer.
- Duyet san pham cuoi truoc khi dang.
- Quan ly ket noi kenh, API, lich dang va bao cao tong.

Cong gate Core giu:

- Pitch Gate: duyet idea.
- Core Final Gate: duyet video cuoi.

### 3.2. Editor

Editor giu chat luong noi dung, logic ke chuyen va ky thuat hau ky.

Viec chinh:

- Phan bien va duyet script.
- QC video draft.
- Sua loi nho hoac tra ve Producer kem timecode.
- Chuan bi final review version.
- Ho tro goi xuat ban: title, thumbnail, caption, hashtag.

Cong gate Editor giu:

- Script Gate.
- Editor QC Gate.

### 3.3. Producer

Producer la nguoi bien idea thanh san pham nghe nhin.

Viec chinh:

- Nghien cuu va nop idea.
- Viet script phan canh.
- Tao voice AI hoac voice-over.
- Dung video, lam subtitle, BGM, SFX.
- Tu kiem tra Self-QC truoc khi nop Editor.

Cong gate Producer giu:

- Self-QC Gate.

---

## 4. Trang thai cong viec

| Ten de hieu | State goi y | Owner | Buoc tiep theo |
|---|---|---|---|
| Y tuong nhap | DRAFT_IDEA | Producer | Hoan thien va nop idea |
| Dang pitching | PITCH | Editor / Core | Duyet hoac yeu cau sua |
| Da phan cong | ASSIGNMENT | Producer | Viet script |
| Soan script | SCRIPT_DRAFT | Producer | Nop script |
| Duyet script | SCRIPT_REVIEW | Editor | Approved hoac revision |
| San xuat | PRODUCTION | Producer | Tao voice, dung video, Self-QC |
| Editor QC | QA | Editor | Sua loi, xuat final review |
| Core review | CORE_REVIEW | Core | Approved hoac tra ve |
| San sang dang | READY_TO_PUBLISH | Editor / Core | Dang video |
| Da xuat ban | PUBLISHED | Core / Analytics | Do analytics |

---

## 5. Nam cong chat luong

| Cong | Nguoi giu | Tieu chuan dat |
|---|---|---|
| Pitch Gate | Core / Editor | Dung kenh, goc nhin moi, insight ro, 3 luan diem vung, kha thi footage |
| Script Gate | Editor | Kich ban co phan canh ro, logic chat, an toan ban quyen, du huong dan dung |
| Self-QC Gate | Producer | Da xem lai 100%, dung script, khong loi tho, du source |
| Editor QC Gate | Editor | Hinh/tieng/sub/mau/safe zone dat chuan |
| Core Final Gate | Core | An toan thuong hieu, thong diep tot, title/thumbnail/caption san sang |

---

## 6. Mau feedback chuan

Dung mau nay de tranh feedback kieu "chua hay", "sua lai di", "cam giac sai sai".

```text
[Ma cong viec / Ten video]
Vi tri loi: [timecode / muc script / truong idea]
Van de: [noi ro loi]
Ly do can sua: [anh huong den nguoi xem / chat luong / rui ro]
Yeu cau sua: [hanh dong cu the]
Deadline: [ngay gio]
Trang thai sau sua: [nop lai / editor check lai / core check lai]
```

Vi du:

```text
EP01 - Joker
Vi tri loi: 00:14 - 00:18
Van de: Footage bi keo dan, nhan vat meo mat.
Ly do can sua: Giam cam giac chuyen nghiep va co the lam nguoi xem thoat som.
Yeu cau sua: Thay bang ban footage 1080p trong folder /03_Footage.
Deadline: 15:00 hom nay.
Trang thai sau sua: Nop lai Draft V02 cho Editor QC.
```

---

## 7. SOP 01 - Dinh huong & checklist noi dung kenh

**Giai doan:** Dinh huong  
**Owner:** Core  
**Nguoi tham gia:** Core  
**Muc tieu:** Chot muc tieu chien luoc, chan dung khan gia va ty le cac tuyen noi dung truoc khi mo dot san xuat dinh ky.  
**Input:** Dinh vi thuong hieu kenh, ket qua do luong ky truoc, phan bo nguon luc doi ngu.  
**Output:** Bang Content Checklist dinh huong theo thang duoc Core phe duyet.  
**Deadline:** Truoc ngay 28 hang thang hoac truoc khi mo dot pitching tiep theo.  
**Nguoi nhan tiep theo:** Ban dao tao / Lead Editor.

### Cac buoc

1. Tao ban sao checklist master, dat ten: `[Ten kenh] - Content Checklist - [Thang/Nam]`.
2. Xac dinh chan dung khan gia, ty le TOF / MOF / BOF, tuyen bai chu dao va KPI.
3. Phan bo dinh dang: TOF uu tien TikTok/Shorts, MOF uu tien YouTube dai, BOF uu tien gan ket cong dong.
4. Ra soat nhan su, ngan sach va suc san xuat trong thang.
5. Core kiem tra, ky duyet ty le noi dung va ban giao de bai khung cho Editor.

### Vi du dat

Kenh Y Niem Dien Anh - 10/2026: 4 video YouTube phan tich dai, 8 Shorts/TikTok, 2 Producer, 1 Editor, 1 Core duyet.

### Loi thuong gap

- Len idea tu do, khong bam khung TOF/MOF/BOF.
- Giao so luong vuot suc team, lam tre ca day chuyen.

### Bai tap

Lap bang phan bo noi dung 1 tuan gom 1 YouTube va 2 TikTok. Ghi ro muc tieu tung video va gia tri cho nguoi xem.

---

## 8. SOP 02 - Checklist cong viec & phan cong ban giao

**Giai doan:** Dinh huong  
**Owner:** Core / Leader  
**Nguoi tham gia:** Core, Editor  
**Muc tieu:** Moi video co owner, deadline va tieu chuan dau ra ro rang.  
**Input:** Content checklist thang, danh sach nhan su san sang nhan viec.  
**Output:** The cong viec co nguoi lam va deadline tung cong.  
**Deadline:** Giao viec truoc san xuat it nhat 3 ngay.  
**Nguoi nhan tiep theo:** Editor va Producer duoc phan cong.

### Cac buoc

1. Tao the cong viec: ma EP, tieu de tam, kenh, tuyen noi dung, owner.
2. Dat deadline: script, draft, QC, Core duyet, ngay dang.
3. Tao folder tai nguyen va cap quyen truy cap.
4. Gan trang thai khoi tao: DRAFT_IDEA hoac ASSIGNMENT.
5. Theo doi tien do hang ngay va ghi blocker som.

### Vi du dat

`[EP01] Nghe thuat ke chuyen trong Oppenheimer`  
Owner: Producer An  
Deadline Script: 05/10  
Deadline Draft: 08/10  
Folder source: da cap quyen.

### Loi thuong gap

- Chi co deadline tong, khong co deadline tung cong.
- Chua cap quyen folder truoc khi giao viec.

### Bai tap

Chia 1 video thanh 5 moc: script, voice, draft, QC, publish. Moi moc co owner va deadline.

---

## 9. SOP 03 - Tao & phat dong dot pitching

**Giai doan:** Dinh huong  
**Owner:** Core / Ban dao tao  
**Nguoi tham gia:** Core, Editor  
**Muc tieu:** Bien dinh huong kenh thanh de bai cu the de thanh vien gui idea chat luong.  
**Input:** Checklist thang va cac khoang trong de tai.  
**Output:** Dot pitching mo tren he thong, co mo ta, format, han nop.  
**Deadline:** Tao dot truoc ngay mo nhan idea toi thieu 24h; han nop thuong 3-5 ngay.  
**Nguoi nhan tiep theo:** Producer va thanh vien sang tao.

### Cac buoc

1. Vao ban lam viec, tao dot pitching.
2. Dien tieu de dot, kenh ap dung, tuyen bai, ngay dong dot va so idea ky vong.
3. Viet de bai: khan gia muon cham den, cam xuc muon kich hoat, goc goi y, video tham khao.
4. Kiem tra tieu chi danh gia truoc khi kich hoat.
5. Phat dong den Producer va tra loi thac mac trong 12h.

### Vi du dat

Dot Pitching T10: `Giai ma tam ly nhan vat phan dien duoc yeu thich`.  
Format: YouTube 10 phut.  
Yeu cau: 3 luan diem tam ly hoc, toi thieu 2 dan chung phan canh phim.

### Loi thuong gap

- De bai qua rong lam idea phan tan.
- Khong ghi han nop ro rang.

### Bai tap

Soan de bai pitching chu de `Cu may one-shot lam thay doi nhip phim`, co format, goi y va reference.

---

## 10. SOP 04 - Nghien cuu, viet & nop Idea

**Giai doan:** Idea  
**Owner:** Producer / Thanh vien sang tao  
**Nguoi tham gia:** Producer, Editor  
**Muc tieu:** Trinh bay goc nhin moi, insight ro va kha thi truoc khi viet script.  
**Input:** De bai pitching, dinh huong kenh, tu lieu phim va reference.  
**Output:** Ho so idea da nop, cho duyet.  
**Deadline:** Truoc khi dong pitching; idea tu de xuat nen nop truoc thu 3 hang tuan.  
**Nguoi nhan tiep theo:** Editor va Core.

### Form idea nen co

```text
Ten idea:
Kenh / nen tang:
Dot pitching:
Insight khan gia:
Hook mo dau:
Van de trung tam:
Goc tiep can rieng:
Luan diem 1:
Luan diem 2:
Luan diem 3:
Gia tri khan gia nhan duoc:
CTA:
Reference / footage:
Rui ro ban quyen:
```

### Cac buoc

1. Mo `Y tuong moi`, chon kenh va dot pitching.
2. Dat ten goi mo, xac dinh insight va hook.
3. Ghi van de trung tam, goc tiep can, 3 luan diem va gia tri nguoi xem nhan duoc.
4. Them CTA va link phim/footage tham khao.
5. Doc man hinh Preview, sau do nop idea.

### Vi du dat

Ten idea: `Vi sao ta khong the ghet Joker cua Joaquin Phoenix?`  
Insight: Khan gia khong dong tinh toi ac nhung dong cam voi su bi ruong bo.  
Hook: `Khi nao su thuong cam bien thanh dong loa?`  
3 luan diem:

- Noi co don bi the che hoa.
- Benh cuoi nhu tieng keu cuu.
- Cu truot nga khong co nguoi do.

### Tieu chuan duyet

Idea dat khi co:

- Dung kenh.
- Insight ro.
- 3 luan diem co dan chung.
- Kha thi footage.
- Khong chi la tom tat noi dung phim.

### Loi thuong gap

- Chi ke lai phim, khong co goc nhin phan tich.
- Hook hay nhung than bai khong tra loi hook.

### Bai tap

Viet 1 idea hoan chinh theo khung: Ten -> Insight -> Hook -> 3 luan diem -> CTA -> Reference.

---

## 11. SOP 05 - Danh gia, duyet Idea & giao nhiem vu

**Giai doan:** Idea  
**Owner:** Editor / Core  
**Nguoi tham gia:** Editor, Core  
**Muc tieu:** Loc idea tot, phan hoi cu the va giao viec ro rang.  
**Input:** Danh sach idea da nop.  
**Output:** APPROVED kem owner/deadline hoac REVISION kem feedback.  
**Deadline:** Phan hoi trong 24-48h sau khi dong pitching.  
**Nguoi nhan tiep theo:** Producer duoc giao.

### Cac buoc

1. Doc insight, hook, 3 luan diem va tinh kha thi footage.
2. Doi chieu voi checklist kenh va lich noi dung thang.
3. Neu chua dat: yeu cau sua, noi ro can sua gi, han sua.
4. Neu dat: duyet idea, phan cong Producer, chot deadline script va draft.
5. He thong ghi lich su va thong bao nguoi nhan viec.

### Mau phe duyet

```text
Idea dat yeu cau. Goc nhin sac, dan chung kha thi.
Giao Producer [ten] trien khai script.
Deadline script: [ngay gio].
Deadline draft: [ngay gio].
```

### Mau yeu cau sua

```text
Luan diem 3 con chung.
Can bo sung 1 phan canh doi thoai doi chieu.
Han nop lai: [ngay gio].
```

### Loi thuong gap

- Feedback cam tinh, khong co cach sua.
- Duyet idea khong kha thi footage.

### Bai tap

Cham 3 idea theo thang: Dinh huong 30%, Insight 30%, Kha thi 20%, Loi cuon 20%.

---

## 12. SOP 06 - Soan, phan bien & duyet kich ban phan canh

**Giai doan:** Script  
**Owner:** Producer viet, Editor duyet  
**Nguoi tham gia:** Producer, Editor  
**Muc tieu:** Tao ban thiet ke chi tiet cho video: loi doc, hinh anh, am thanh, nhip dieu.  
**Input:** Idea approved, guideline phong cach, template kich ban.  
**Output:** Script APPROVED va khoa version.  
**Deadline:** Producer nop trong 48h sau duyet idea; Editor phan hoi trong 24h.  
**Nguoi nhan tiep theo:** Producer san xuat / nguoi lam voice.

### Khung script

```text
Hook: 0-15s
Body: 3 luan diem chinh
Outro: duc ket bai hoc
CTA / Loop: keo nguoi xem sang hanh dong tiep theo
```

### Bang phan canh

| Timecode | Voice-over | Visual / Footage | Subtitle / Text | Audio / SFX | Source |
|---|---|---|---|---|---|
| 00:00-00:08 |  |  |  |  |  |

### Cac buoc

1. Viet cau truc 4 phan: Hook, Body, Outro, CTA/Loop.
2. Lap ma tran phan canh co timecode, voice, visual, text, audio va source.
3. Producer doc thanh tieng de kiem tra nhip va thoi luong.
4. Editor duyet logic, lap luan, ban quyen va nhip ke chuyen.
5. Neu can sua: feedback theo phan canh. Khi dat: APPROVE va khoa script.

### Vi du dat

Phan canh 01 `[00:00 - 00:08]`  
Voice: `Co bao gio ban nhan ra, bo phim khien ta khoc nhieu nhat lai khong co lay mot giot nuoc mat?`  
Visual: Can canh anh mat nhan vat trong canh mua.  
SFX: Tieng mua nho dan, cello u uat.

### Loi thuong gap

- Viet nhu bai van xuoi, khong co chi dan dung.
- Tao voice hoac dung video truoc khi script duoc duyet.

### Bai tap

Bien 200 tu phan tich thanh 3 phan canh, moi phan canh co timecode, voice, visual, audio va source.

---

## 13. SOP 07 - Tao voice AI bang giong chuan kenh

**Giai doan:** Production  
**Owner:** Producer  
**Nguoi tham gia:** Producer, Editor  
**Muc tieu:** Tao file voice-over chuan ngu dieu, dung nhip ngat va hop nhan dien kenh.  
**Input:** Script approved, voice profile, tu dien phien am thuat ngu/ten rieng.  
**Output:** File audio tung doan va file master WAV.  
**Deadline:** Trong 24h sau khi script duoc duyet.  
**Nguoi nhan tiep theo:** Producer dung video / Editor QC am thanh.

### Luu y hien trang

- Hien chua co voice trained san sang.
- Space Hugging Face `Harlanitsk/ynda-voice-studio` da tao nhung dang loi build, chua tao duoc audio that.
- Khong dan URL trang Hugging Face vao endpoint roi coi la da ket noi.
- Can co adapter backend rieng, job queue va noi luu file audio.

### Cac buoc van hanh khi he thong am thanh da san sang

1. Mo Phong am thanh.
2. Chon dung voice profile cua kenh.
3. Nap loi doc tu script approved.
4. Chia doan duoi 150 tu de giu chat luong.
5. Soat ten rieng, phim nuoc ngoai, dau cau va ky tu dac biet.
6. Tao audio tung doan.
7. Nghe lai tung doan ngay sau khi tao.
8. Doan nao sai thi sua text va tao lai rieng doan do.
9. Khi tat ca doan dat, ghep WAV master.
10. Dat ten file: `[MaVideo]_[PhanCanh]_VO_V01.wav`.

### Tieu chuan nghiem thu am thanh

- Phat am dung.
- Khong nuot chu.
- Ngat nghi tu nhien.
- Khong re, vo tieng, meo giong.
- Am luong can bang; muc goi y cho web la khoang -14 LUFS.
- Ten rieng va thuat ngu doc muot.

### Loi thuong gap

- Tao hang loat nhung khong nghe lai tung doan.
- De doan qua dai lam AI meo giong o cuoi cau.
- Sua script sau khi tao voice ma khong tao lai audio.

### Bai tap

Tao 2 doan doc ngan co ten rieng tieng Anh/Phap. Dieu chinh dau cau de doi nhip doc tu nhanh sang lang dong.

---

## 14. SOP 08 - Quay dung, hau ky & tu kiem tra Self-QC

**Giai doan:** Production  
**Owner:** Producer  
**Nguoi tham gia:** Producer  
**Muc tieu:** Dung ban video nhap hoan chinh theo script va tu kiem tra truoc khi ban giao.  
**Input:** Script approved, voice, footage, BGM/SFX ban quyen, huong dan safe zone.  
**Output:** Video Draft V01, file project source va checklist Self-QC.  
**Deadline:** 2-3 ngay tuy lich san xuat.  
**Nguoi nhan tiep theo:** Lead Editor QC.

### Cau truc thu muc chuan

```text
/01_Script
/02_Voice
/03_Footage
/04_Audio
/05_Project
/06_Exports
```

### Cac buoc

1. Tao folder du an theo cau truc chuan.
2. Rough cut: dat timeline voice, chen footage dung script.
3. Fine cut: them chuyen canh, graphic, effect, can mau.
4. Subtitle: dung chinh ta, font chuan, nam trong safe zone.
5. Audio: voice noi bat, BGM nho hon voice, SFX vua du.
6. Self-QC: xem lai 100% video toc do 1x tren may tinh va dien thoai.
7. Xuat Draft V01 va nop kem source.

### Checklist Self-QC

- [ ] Dung ban script approved.
- [ ] Khong thieu canh quan trong.
- [ ] Footage khong bi meo, nhap nhay, sai ti le.
- [ ] Subtitle dung chinh ta.
- [ ] Chu khong bi che boi nut TikTok/Reels/Shorts.
- [ ] Voice nghe ro tren loa dien thoai.
- [ ] BGM khong at voice.
- [ ] Co fade in/out hop ly.
- [ ] File export dung dinh dang.
- [ ] Folder source day du va co quyen truy cap.

### Loi thuong gap

- Phu de bi che boi nut like/share.
- BGM qua to.
- Nop draft nhung thieu source project.

### Bai tap

Dung va Self-QC mot video 60 giay bang checklist 10 diem.

---

## 15. SOP 09 - Editor QC, chinh sua hoan thien & chuan bi ban duyet

**Giai doan:** QC  
**Owner:** Editor  
**Nguoi tham gia:** Editor  
**Muc tieu:** Kiem tra chat luong ky thuat va tham my truoc khi trinh Core.  
**Input:** Video Draft V01, script approved, checklist Self-QC, source project.  
**Output:** Final Review Version va bien ban QC dat chuan.  
**Deadline:** Trong 24h sau khi nhan draft.  
**Nguoi nhan tiep theo:** Core Team.

### Cac buoc

1. Mo song song video draft va script approved.
2. Kiem tra thong diep, nhip dan va su khop giua voice - hinh.
3. Visual QC: do phan giai, ti le, mau, font, safe zone, ban quyen.
4. Audio QC: loudness, voice, SFX, BGM, clipping.
5. Neu loi nho: Editor sua truc tiep.
6. Neu loi cau truc: feedback theo timecode va tra ve Producer.
7. Khi dat: xuat Final Review Version, kem title/thumbnail de xuat, gui Core.

### Mau feedback QC

```text
00:14 - 00:18
Loi: Footage bi bet den va sai ti le khung hinh.
Yeu cau: Thay bang trich doan Remastered 1080p trong /03_Footage.
Deadline: 15:00 hom nay.
```

### Loi thuong gap

- Feedback khong co timecode.
- Gui Core khi van con loi subtitle co ban.
- Tu y doi cau truc noi dung da duyet.

### Bai tap

Tim 5 loi tren mot video mau: sai font, clip lech nhip, audio clipping, drop frame, safe zone sai.

---

## 16. SOP 10 - Core duyet san pham cuoi & dieu kien xuat ban

**Giai doan:** Core duyet  
**Owner:** Core  
**Nguoi tham gia:** Core  
**Muc tieu:** Kiem dinh tong the ve thuong hieu, chien luoc va rui ro truoc khi dang.  
**Input:** Final Review Version, bien ban QC, title, thumbnail, caption, hashtag.  
**Output:** CORE_APPROVED hoac yeu cau sua khan.  
**Deadline:** Truoc gio dang toi thieu 6-12h.  
**Nguoi nhan tiep theo:** Editor / Publisher.

### Cac buoc

1. Xem tron video o goc nhin khan gia muc tieu.
2. Danh gia 5 giay dau, thong diep va cam xuc cuoi video.
3. Kiem tra an toan cong dong, ban quyen va thuong hieu.
4. Danh gia title, thumbnail, caption.
5. Neu chua dat: tra ve Editor kem diem can sua.
6. Neu dat: Core Approve dung version final.

### Mau phe duyet Core

```text
Da duyet ban Final_V03.
Video nhip tot, ket thuc co gia tri.
Duyet dang YouTube luc 19:30 hom nay.
Dung thumbnail phuong an A.
```

### Loi thuong gap

- Duyet voi vang, khong xem het video.
- Doi phong cach vao phut cuoi khi quy trinh da hoan tat.

### Bai tap

So sanh 2 thumbnail va 3 title cho cung mot video. Chon phuong an tot nhat va ghi ly do.

---

## 17. SOP 11 - Chuan bi goi xuat ban & dang video theo kenh

**Giai doan:** Dang  
**Owner:** Editor / Core  
**Nguoi tham gia:** Editor, Core  
**Muc tieu:** Dang dung ban final len dung nen tang, toi uu metadata va luu URL chinh thuc.  
**Input:** Video approved, thumbnail, title, caption, hashtag, lich dang.  
**Output:** Bai dang cong khai va URL luu vao he thong.  
**Deadline:** Dung khung gio da chot.  
**Nguoi nhan tiep theo:** Core Team va Analytics.

### Publish package

```text
Ma video:
Nen tang:
Ban video final:
Thumbnail:
Title 1:
Title 2:
Mo ta / caption:
Hashtag:
Ngay gio dang:
Nguoi dang:
URL sau khi public:
Ghi chu:
```

### Cac buoc thu cong

1. Mo trang Dang video trong workspace.
2. Chon dung kenh va cong viec trang thai `Cho dang`.
3. Doi chieu version final voi ban Core approved.
4. Mo YouTube Studio / TikTok Creator Center bang tai khoan chinh thuc.
5. Upload video, thumbnail, title, description, hashtag.
6. Cai dat lich dang hoac dang ngay.
7. Doi nen tang xu ly xong HD/4K neu co.
8. Mo URL bang cua so an danh de kiem tra hien thi.
9. Dan URL chinh thuc vao he thong va xac nhan Published.

### Luu y API YouTube / TikTok

- YouTube can OAuth user consent, scope upload va token store ma hoa.
- TikTok Direct Post co yeu cau xet duyet; tool noi bo chi dang cho team co the khong du dieu kien.
- Neu chua co API approved, giu luong thu cong: chuan bi goi dang, mo Studio, dang tay, dan URL lai.
- Khong upload video that bang API khi chua co xac nhan cua chu kenh.

### Loi thuong gap

- Dang nham ban draft.
- Hen lich xong da danh dau Published trong khi video chua cong khai.
- TikTok bi mute vi am nhac ban quyen nhung khong nghe lai sau khi dang.

### Bai tap

Chuan bi 1 publish package gom 2 title A/B, caption 150 chu, 5 hashtag va thumbnail dung ti le.

---

## 18. SOP 12 - Do luong analytics, bai hoc & cai tien vong doi

**Giai doan:** Analytics  
**Owner:** Core / Editor / Producer  
**Nguoi tham gia:** Core, Editor, Producer  
**Muc tieu:** Do hieu qua that, tim nguyen nhan thanh bai va dua bai hoc ve vong idea tiep theo.  
**Input:** URL video, YouTube/TikTok Analytics: view, retention, CTR, watch time, comment.  
**Output:** Bao cao hieu suat, bai hoc va de xuat cai tien.  
**Deadline:** Moc 24h, 7 ngay, 28 ngay; tong ket trong hop tuan.  
**Nguoi nhan tiep theo:** Toan bo team sang tao.

### Cac buoc

1. Ghi nhan view, CTR, watch time, retention o moc 24h va 7 ngay.
2. Doc bieu do retention, xac dinh giay khan gia rot manh.
3. Doc comment va phan loai: khen, che, tranh luan, cau hoi, idea moi.
4. Rut 3 ket luan: gi can giu, gi can bo, gia thuyet moi can thu.
5. Cap nhat bang tri thuc kenh.
6. Dua chu de tiem nang quay lai Dinh huong/Pitching.

### Mau bao cao ngan

```text
Video:
Nen tang:
Moc do:
Views:
CTR:
Retention:
Watch time:
Comment noi bat:
Dieu lam tot:
Dieu can sua:
Gia thuyet cho video tiep theo:
Idea moi phat sinh:
```

### Vi du dat

EP01: CTR 8.5% do thumbnail tuong phan tot. Retention giam 30% o giay 00:25 vi phan mo dau dai. Bai hoc: video sau vao luan diem chinh trong 10 giay dau.

### Loi thuong gap

- Ket luan thang/thua qua som sau 2 gio.
- Chi nhin view, bo qua retention.

### Bai tap

Doc mot retention chart mau va viet 1 trang phan tich nguyen nhan drop view, kem 2 cach sua.

---

## 19. Checklist truoc khi chuyen cong

### Tu Idea sang Script

- [ ] Idea co insight ro.
- [ ] Co hook.
- [ ] Co 3 luan diem.
- [ ] Co reference/footage.
- [ ] Editor/Core da duyet.
- [ ] Da gan Producer va deadline script.

### Tu Script sang Production

- [ ] Script da approved.
- [ ] Version script da khoa.
- [ ] Co bang phan canh.
- [ ] Co source footage goi y.
- [ ] Co note ve ban quyen.
- [ ] Co nguoi lam voice/dung video.

### Tu Production sang QC

- [ ] Da tao voice xong.
- [ ] Da dung dung script.
- [ ] Da xem lai 100%.
- [ ] Subtitle dung.
- [ ] Audio can bang.
- [ ] Source folder day du.

### Tu QC sang Core

- [ ] Editor da xem het video.
- [ ] Loi ky thuat da sua.
- [ ] Co final review version.
- [ ] Co title/thumbnail/caption de xuat.
- [ ] Co bien ban QC.

### Tu Core sang Dang

- [ ] Core da approved dung version final.
- [ ] Publish package day du.
- [ ] Lich dang da chot.
- [ ] Nguoi dang co quyen tai khoan kenh.

### Tu Dang sang Analytics

- [ ] Video da cong khai that.
- [ ] URL mo duoc bang an danh.
- [ ] URL da luu vao he thong.
- [ ] Da dat lich do 24h / 7 ngay / 28 ngay.

---

## 20. Phan can tu chinh tay

Ban co the sua cac muc nay cho khop team that:

```text
Ten kenh chinh:
Nen tang uu tien:
Gio vang dang:
Core phu trach:
Editor phu trach:
Producer chinh:
Template folder Drive:
Template script:
Voice profile mong muon:
Quy chuan thumbnail:
Quy chuan caption:
Danh sach hashtag nen dung:
Danh sach tu cam / rui ro thuong hieu:
```

---

## 21. Ghi chu rieng cho trang huong dan public

Trang `/huong-dan` duoc phep hien:

- Quy trinh tong.
- Vai tro Core / Editor / Producer o muc mo ta.
- SOP da lam sach.
- Checklist chat luong.
- Mau feedback.
- Bai tap dao tao.

Trang `/huong-dan` khong duoc hien:

- Email thanh vien.
- Ten that neu chua muon public.
- Link Drive rieng tu.
- Token, webhook, secret.
- Du lieu idea noi bo.
- Thong bao noi bo.
- Cau hinh kenh that neu chua duoc phep cong khai.

---

## 22. Viec Codex nen lam va viec Antigravity nen lam

### Codex nen lam

- Sua auth/session, phan quyen va data leak.
- Thiet ke state machine.
- Gop action trung lap va kiem tra gate duyet.
- Thiet ke schema DB, versioning, job queue.
- Review backend YouTube/TikTok/Hugging Face.
- Viet test cho permission, retry, idempotency va race condition.

### Antigravity nen lam

- Lam UI theo spec da co.
- Tinh responsive, accessibility, empty state, loading state.
- Cai thien form idea va trang huong dan.
- Lam screenshot SOP hoac training mode.
- Viet adapter UI theo contract backend da chot.
- Don CSS, layout va trai nghiem nhap lieu.

---

## 23. Prompt ngan de dua cho AI khac

```text
Lam tiep du an D:\workflow.
Doc truoc:
- AGENTS.md
- WORKLOG.md
- PLAN_TONG_THE.md
- Tinhnangngoai/Note/QUY_TRINH_LAM_VIEC_FULL.md

Uu tien backend va an toan du lieu truoc khi mo rong UI.
Khong deploy, khong commit/push, khong dung secret vao chat/log.
Khong danh dau DONE neu chua co test hoac bang chung that.
Trang /huong-dan phai public, khong can dang nhap, khong ro ri du lieu noi bo.
```

