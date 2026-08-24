import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID;
const EMAIL = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const KEY = process.env.GOOGLE_PRIVATE_KEY;

async function init() {
  if (!EMAIL || !KEY) {
    throw new Error("Missing Google Service Account credentials in .env");
  }

  const serviceAccountAuth = new JWT({
    email: EMAIL,
    key: KEY.replace(/\\n/g, '\n'),
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo();

  console.log("Connected to document: " + doc.title);

  const defaultPasswordHash = await bcrypt.hash('123', 10);

  const schemas = [
    {
      title: 'Members',
      headers: ['id', 'password', 'name', 'role', 'phone', 'facebook', 'primaryExpertise', 'secondaryExpertise', 'active'],
      rows: [
        { id: 'admin@ynda.vn', password: defaultPasswordHash, name: 'Nguyễn Khoa (Core)', role: 'Core', phone: '0901234567', primaryExpertise: 'Content', secondaryExpertise: 'Quay dựng', active: 'TRUE' },
        { id: 'editor@ynda.vn', password: defaultPasswordHash, name: 'Trần Minh (Editor)', role: 'E', phone: '0902345678', primaryExpertise: 'Dựng-Edit', secondaryExpertise: 'Content', active: 'TRUE' },
        { id: 'producer1@ynda.vn', password: defaultPasswordHash, name: 'Lê Hoàng (Producer)', role: 'P', phone: '0903456789', primaryExpertise: 'Quay dựng', secondaryExpertise: 'Dựng-Edit', active: 'TRUE' },
        { id: 'producer2@ynda.vn', password: defaultPasswordHash, name: 'Phạm Linh (Producer)', role: 'P', phone: '0904567890', primaryExpertise: 'Content', secondaryExpertise: 'Thiết kế', active: 'TRUE' }
      ]
    },
    {
      title: 'Platforms',
      headers: ['id', 'name', 'defaultDurationDays'],
      rows: [
        { id: 'plat_yt', name: 'YouTube', defaultDurationDays: '4' },
        { id: 'plat_tt', name: 'TikTok', defaultDurationDays: '2' },
        { id: 'plat_reels', name: 'Facebook Reels', defaultDurationDays: '1' }
      ]
    },
    {
      title: 'ChannelGroups',
      headers: ['id', 'name', 'color', 'archived'],
      rows: [
        { id: 'cg_main', name: 'Kênh Chính YNDA', color: '#5B9EE8', archived: 'FALSE' },
        { id: 'cg_sub', name: 'Kênh Phụ Review', color: '#E3A73C', archived: 'FALSE' }
      ]
    },
    {
      title: 'PlatformChannels',
      headers: ['id', 'channelGroupId', 'platformId'],
      rows: [
        { id: 'pc_main_yt', channelGroupId: 'cg_main', platformId: 'plat_yt' },
        { id: 'pc_main_tt', channelGroupId: 'cg_main', platformId: 'plat_tt' },
        { id: 'pc_main_reels', channelGroupId: 'cg_main', platformId: 'plat_reels' },
        { id: 'pc_sub_yt', channelGroupId: 'cg_sub', platformId: 'plat_yt' },
        { id: 'pc_sub_tt', channelGroupId: 'cg_sub', platformId: 'plat_tt' }
      ]
    },
    {
      title: 'Ideas',
      headers: [
        'id', 'title', 'description', 'platformChannelId', 'submittedByEmail', 'status', 
        'durationDays', 'assignedToEmail', 'startDate', 'endDate', 'scriptLink', 'videoLink', 
        'publishedLink', 'qaFeedback', 'scheduledPostDate', 'createdAt', 'assignedAt', 
        'videoSubmittedAt', 'creditsIdeaByEmail', 'creditsScriptByEmail', 'creditsEditedScriptByEmail', 
        'creditsProducedByEmail', 'creditsQaByEmail', 'creditsApprovedByEmail', 'cancelReason', 
        'cancelledByEmail', 'cancelledAt', 'lastPitchWeek', 'internalNote', 'rating', 'tags'
      ],
      rows: [
        {
          id: 'idea_demo_1',
          title: 'Hậu trường sản xuất phim ngắn Tết 2026',
          description: 'Video phóng sự ngắn hậu trường cảnh quay pháo hoa và phân cảnh xúc động đêm giao thừa. Tone cảm xúc, ấm áp.',
          platformChannelId: 'pc_main_yt',
          submittedByEmail: 'producer1@ynda.vn',
          status: 'COMPLETE',
          durationDays: '4',
          assignedToEmail: 'producer1@ynda.vn',
          startDate: '2026-08-10',
          endDate: '2026-08-13',
          scriptLink: 'https://docs.google.com/document/d/demo1',
          videoLink: 'https://drive.google.com/file/d/demo1',
          publishedLink: 'https://youtube.com/watch?v=demo1',
          qaFeedback: '',
          scheduledPostDate: '2026-08-20',
          createdAt: new Date('2026-08-08').toISOString(),
          assignedAt: new Date('2026-08-10').toISOString(),
          videoSubmittedAt: new Date('2026-08-13').toISOString(),
          creditsIdeaByEmail: 'producer1@ynda.vn',
          creditsScriptByEmail: 'producer1@ynda.vn',
          creditsEditedScriptByEmail: 'editor@ynda.vn',
          creditsProducedByEmail: 'producer1@ynda.vn',
          creditsQaByEmail: 'editor@ynda.vn',
          creditsApprovedByEmail: 'admin@ynda.vn'
        },
        {
          id: 'idea_demo_2',
          title: 'Top 5 mẹo góc máy điện ảnh bằng điện thoại',
          description: 'Format chia sẻ nhanh các kỹ thuật Dutch angle, Whip pan và Low angle. Nhịp cắt nhanh, âm thanh bắt tai.',
          platformChannelId: 'pc_main_tt',
          submittedByEmail: 'editor@ynda.vn',
          status: 'PRODUCTION',
          durationDays: '2',
          assignedToEmail: 'producer2@ynda.vn',
          startDate: '2026-08-23',
          endDate: '2026-08-24',
          scriptLink: 'https://docs.google.com/document/d/demo2',
          videoLink: '',
          publishedLink: '',
          qaFeedback: '',
          scheduledPostDate: '2026-08-26',
          createdAt: new Date('2026-08-20').toISOString(),
          assignedAt: new Date('2026-08-23').toISOString(),
          videoSubmittedAt: '',
          creditsIdeaByEmail: 'editor@ynda.vn',
          creditsScriptByEmail: 'producer2@ynda.vn',
          creditsEditedScriptByEmail: 'editor@ynda.vn',
          creditsProducedByEmail: '',
          creditsQaByEmail: '',
          creditsApprovedByEmail: 'admin@ynda.vn'
        },
        {
          id: 'idea_demo_3',
          title: 'Review lens Anamorphic giá rẻ cho người mới',
          description: 'Đánh giá chi tiết lens anamorphic gắn điện thoại/mirrorless, kèm test flare xanh và bokeh oval trong studio.',
          platformChannelId: 'pc_sub_yt',
          submittedByEmail: 'admin@ynda.vn',
          status: 'PITCH',
          durationDays: '4',
          assignedToEmail: '',
          startDate: '',
          endDate: '',
          scriptLink: '',
          videoLink: '',
          publishedLink: '',
          qaFeedback: '',
          scheduledPostDate: '',
          createdAt: new Date('2026-08-22').toISOString(),
          assignedAt: '',
          videoSubmittedAt: '',
          creditsIdeaByEmail: 'admin@ynda.vn',
          creditsScriptByEmail: '',
          creditsEditedScriptByEmail: '',
          creditsProducedByEmail: '',
          creditsQaByEmail: '',
          creditsApprovedByEmail: ''
        }
      ]
    },
    {
      title: 'Comments',
      headers: ['id', 'ideaId', 'memberId', 'content', 'createdAt'],
      rows: [
        {
          id: 'cmt_1',
          ideaId: 'idea_demo_2',
          memberId: 'editor@ynda.vn',
          content: 'Đoạn hook 3s đầu nhớ thêm sound effect sweep và text highlight nhé!',
          createdAt: new Date('2026-08-23T14:30:00').toISOString()
        }
      ]
    },
    {
      title: 'AuditLogs',
      headers: ['id', 'ideaId', 'memberId', 'action', 'metadata', 'timestamp'],
      rows: [
        {
          id: 'log_1',
          ideaId: 'idea_demo_2',
          memberId: 'admin@ynda.vn',
          action: 'Duyệt idea PITCH -> ASSIGNMENT',
          metadata: JSON.stringify({ durationDays: 2, assignedTo: 'producer2@ynda.vn', platform: 'TikTok' }),
          timestamp: new Date('2026-08-23T09:00:00').toISOString()
        }
      ]
    },
    {
      title: 'Notifications',
      headers: ['id', 'memberId', 'type', 'relatedIdeaId', 'message', 'read', 'createdAt'],
      rows: [
        {
          id: 'notif_1',
          memberId: 'producer2@ynda.vn',
          type: 'assigned',
          relatedIdeaId: 'idea_demo_2',
          message: 'Bạn được giao sản xuất idea "Top 5 mẹo góc máy điện ảnh bằng điện thoại"',
          read: 'FALSE',
          createdAt: new Date('2026-08-23T09:00:00').toISOString()
        }
      ]
    },
    {
      title: 'Checklists',
      headers: ['id', 'name', 'assignedToEmail', 'dueDate', 'status', 'createdByEmail'],
      rows: [
        { id: 'chk_1', name: 'Kiểm tra pin và thẻ nhớ máy quay A', assignedToEmail: 'producer1@ynda.vn', dueDate: '2026-08-25', status: 'Đang thực hiện', createdByEmail: 'admin@ynda.vn' },
        { id: 'chk_2', name: 'Backup footage studio tuần 34', assignedToEmail: 'editor@ynda.vn', dueDate: '2026-08-25', status: 'Done', createdByEmail: 'admin@ynda.vn' }
      ]
    },
    {
      title: 'Settings',
      headers: ['key', 'value'],
      rows: [
        { key: 'discordWebhookUrl', value: '' },
        { key: 'externalCalendarUrl', value: '' }
      ]
    }
  ];

  for (const schema of schemas) {
    let sheet = doc.sheetsByTitle[schema.title];
    if (!sheet) {
      console.log(`Creating sheet ${schema.title}...`);
      sheet = await doc.addSheet({ title: schema.title, headerValues: schema.headers });
      if (schema.rows && schema.rows.length > 0) {
        await sheet.addRows(schema.rows);
      }
    } else {
      console.log(`Sheet ${schema.title} already exists. Updating headers...`);
      await sheet.resize({ rowCount: Math.max(sheet.rowCount, (schema.rows ? schema.rows.length + 5 : 20)), columnCount: Math.max(sheet.columnCount, schema.headers.length) });
      await sheet.setHeaderRow(schema.headers);
      const rows = await sheet.getRows();
      if (rows.length === 0 && schema.rows && schema.rows.length > 0) {
        await sheet.addRows(schema.rows);
      }
    }
  }

  console.log("Initialization complete! All YNDA v4 database sheets are ready.");
}

init().catch(err => console.error("FATAL ERROR:", err));

