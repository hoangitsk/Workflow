import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';
import dotenv from 'dotenv';

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

  const schemas = [
    {
      title: 'Members',
      headers: ['id', 'password', 'name', 'role', 'phone', 'facebook', 'primaryExpertise', 'secondaryExpertise'],
      rows: [
        { id: 'admin@ynda.vn', password: '123', name: 'Admin Core', role: 'Core', phone: '0901234567' }
      ]
    },
    {
      title: 'Channels',
      headers: ['id', 'name', 'color', 'archived'],
      rows: [
        { id: 'ch1', name: 'YNDA Youtube', color: '#5B9EE8', archived: 'FALSE' },
        { id: 'ch2', name: 'YNDA TikTok', color: '#E3A73C', archived: 'FALSE' }
      ]
    },
    {
      title: 'Ideas',
      headers: ['id', 'title', 'channelId', 'submittedByEmail', 'status', 'platform', 'durationDays', 'assignedToEmail', 'startDate', 'endDate', 'scriptLink', 'videoLink', 'qaFeedback', 'publishedLink', 'createdAt', 'assignedAt', 'videoSubmittedAt', 'creditsIdeaByEmail', 'creditsScriptByEmail', 'creditsEditedScriptByEmail', 'creditsProducedByEmail', 'creditsQaByEmail', 'creditsApprovedByEmail', 'cancelReason', 'cancelledByEmail', 'cancelledAt'],
    },
    {
      title: 'Checklists',
      headers: ['id', 'name', 'assignedToEmail', 'dueDate', 'status', 'createdByEmail']
    }
  ];

  for (const schema of schemas) {
    let sheet = doc.sheetsByTitle[schema.title];
    if (!sheet) {
      console.log(`Creating sheet ${schema.title}...`);
      sheet = await doc.addSheet({ title: schema.title, headerValues: schema.headers });
      if (schema.rows) {
        await sheet.addRows(schema.rows);
      }
    } else {
      console.log(`Sheet ${schema.title} already exists. Attempting to update headers...`);
      await sheet.resize({ rowCount: sheet.rowCount, columnCount: Math.max(sheet.columnCount, schema.headers.length) });
      await sheet.setHeaderRow(schema.headers);
    }
  }

  const defaultSheet = Object.values(doc.sheetsById).find(s => s.title.startsWith('Trang t') || s.title.startsWith('Sheet1'));
  if (defaultSheet && Object.keys(doc.sheetsById).length > 1) {
    try {
      await defaultSheet.delete();
      console.log(`Deleted default empty sheet: ${defaultSheet.title}`);
    } catch(err) {
      console.log("Could not delete default sheet, you can delete it manually.");
    }
  }

  console.log("Initialization complete! Your database is ready.");
}

init().catch(err => console.error("FATAL ERROR:", err));
