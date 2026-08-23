import { GoogleSpreadsheet } from 'google-spreadsheet';
import { JWT } from 'google-auth-library';

// We use the ID provided by the user in the prompt or env
const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID || '1waF1GLS6iB9JJ3pftQOSl1d27tRNUNhM245LlK_tUB0';

export async function getSpreadsheet() {
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    throw new Error("Missing Google Service Account credentials in .env.local");
  }

  // Initialize auth
  const serviceAccountAuth = new JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
    ],
  });

  const doc = new GoogleSpreadsheet(SPREADSHEET_ID, serviceAccountAuth);
  await doc.loadInfo(); 
  return doc;
}
