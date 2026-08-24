import fs from 'fs';

const appendCode = `
export async function triggerDailyCronAction() {
  const doc = await getSpreadsheet();
  const ideaSheet = doc.sheetsByTitle["Ideas"];
  if (!ideaSheet) return;

  const rows = await ideaSheet.getRows();
  let updated = false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const twoWeeksAgo = new Date(today);
  twoWeeksAgo.setDate(today.getDate() - 14);
  const nowStr = new Date().toISOString().slice(0, 10);

  for (const row of rows) {
    const status = row.get('status');
    const pitchWeek = row.get('lastPitchWeek');
    const assignedTo = row.get('assignedToEmail');
    const ideaId = row.get('id');
    const endDateStr = row.get('endDate');
    
    // Auto-archive old PITCH
    if (status === 'PITCH') {
      const pitchDateStr = pitchWeek || row.get('createdAt');
      if (pitchDateStr) {
        const pitchDate = new Date(pitchDateStr);
        if (pitchDate < twoWeeksAgo) {
          row.set('status', 'ARCHIVED_IDEA');
          await row.save();
          updated = true;
          
          await recordAuditLog(ideaId, "SYSTEM", "Tự động lưu trữ ý tưởng PITCH quá hạn (14 ngày)", {});
        }
      }
    }

    // Overdue notifications
    if ((status === 'ASSIGNMENT' || status === 'SCRIPT' || status === 'PRODUCTION' || status === 'QA') && endDateStr) {
      const endDate = new Date(endDateStr);
      if (endDate < today && assignedTo) {
        // Find if we already notified today (check Notifications sheet logic is hard without querying it all, 
        // but let's assume we can just create it. To prevent spam, client rate-limits to 1 per day).
        await createNotification(
          assignedTo, 
          'warning', 
          ideaId, 
          \`Nhiệm vụ của bạn đang trễ hạn!\`
        );
      }
    }
  }

  if (updated) {
    revalidateTag("sheets");
    revalidatePath("/");
  }
  return { success: true };
}
`;

fs.appendFileSync('src/actions/idea-actions.ts', appendCode, 'utf8');
