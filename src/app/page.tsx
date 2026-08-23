import { getSpreadsheet } from "../lib/sheets";
import { getCurrentMember } from "../actions/auth-actions";
import ClientApp from "./components/ClientApp";

export const dynamic = "force-dynamic";

export default async function Page() {
  const currentMember = await getCurrentMember();

  let members: any[] = [];
  let channels: any[] = [];
  let ideas: any[] = [];
  let checklists: any[] = [];

  try {
    const doc = await getSpreadsheet();
    
    const membersSheet = doc.sheetsByTitle["Members"];
    if (membersSheet) {
      const rows = await membersSheet.getRows();
      members = rows.map(r => ({
        id: r.get('id'),
        name: r.get('name'),
        role: r.get('role'),
        phone: r.get('phone') || "",
        facebook: r.get('facebook') || "",
        primaryExpertise: r.get('primaryExpertise') || "",
        secondaryExpertise: r.get('secondaryExpertise') || ""
      }));
    }

    const channelsSheet = doc.sheetsByTitle["Channels"];
    if (channelsSheet) {
      const rows = await channelsSheet.getRows();
      channels = rows.map(r => ({
        id: r.get('id'),
        name: r.get('name'),
        color: r.get('color'),
        archived: r.get('archived') === 'TRUE' || r.get('archived') === 'true'
      }));
    }

    const ideasSheet = doc.sheetsByTitle["Ideas"];
    if (ideasSheet) {
      const rows = await ideasSheet.getRows();
      ideas = rows.map(r => ({
        id: r.get('id'),
        title: r.get('title'),
        channelId: r.get('channelId'),
        submittedById: r.get('submittedByEmail'),
        status: r.get('status') || 'PITCH',
        platform: r.get('platform'),
        durationDays: parseInt(r.get('durationDays') || '0', 10),
        assignedToId: r.get('assignedToEmail'),
        startDate: r.get('startDate'),
        endDate: r.get('endDate'),
        scriptLink: r.get('scriptLink'),
        videoLink: r.get('videoLink'),
        qaFeedback: r.get('qaFeedback'),
        publishedLink: r.get('publishedLink'),
        createdAt: r.get('createdAt'),
        assignedAt: r.get('assignedAt'),
        videoSubmittedAt: r.get('videoSubmittedAt'),
        
        creditsIdeaById: r.get('creditsIdeaByEmail'),
        creditsScriptById: r.get('creditsScriptByEmail'),
        creditsEditedScriptById: r.get('creditsEditedScriptByEmail'),
        creditsProducedById: r.get('creditsProducedByEmail'),
        creditsQaById: r.get('creditsQaByEmail'),
        creditsApprovedById: r.get('creditsApprovedByEmail'),
        cancelReason: r.get('cancelReason') || "",
        cancelledByEmail: r.get('cancelledByEmail') || "",
        cancelledAt: r.get('cancelledAt') || ""
      })).reverse(); // Lấy mới nhất lên đầu
    }
  } catch (err) {
    console.error("Lỗi đọc Google Sheets:", err);
  }

  try {
    const doc = await getSpreadsheet();
    const checklistsSheet = doc.sheetsByTitle["Checklists"];
    if (checklistsSheet) {
      const rows = await checklistsSheet.getRows();
      checklists = rows.map(r => ({
        id: r.get('id'),
        name: r.get('name'),
        assignedToEmail: r.get('assignedToEmail'),
        dueDate: r.get('dueDate'),
        status: r.get('status') || 'Chưa bắt đầu',
        createdByEmail: r.get('createdByEmail')
      }));
    }
  } catch(err) {}

  return (
    <ClientApp 
      initialMembers={members}
      initialChannels={channels}
      initialIdeas={ideas}
      initialChecklists={checklists}
      currentMemberId={currentMember?.id || null}
    />
  );
}
