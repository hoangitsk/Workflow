'use server';

import { 
  saveSurveyResponse, 
  getAllSurveyResponses, 
  deleteSurveyResponseById, 
  SurveyInput, 
  SurveyResponseRecord 
} from '@/lib/survey-db';

export async function submitSurveyAction(input: SurveyInput) {
  try {
    if (!input.fullname || !input.fullname.trim()) {
      return { success: false, error: 'Vui lòng nhập Họ và tên của bạn.' };
    }

    if (!input.satisfaction || Number(input.satisfaction) < 1 || Number(input.satisfaction) > 5) {
      return { success: false, error: 'Vui lòng chọn mức độ hài lòng chung (1 - 5).' };
    }

    if (!input.continue_project || !input.continue_project.trim()) {
      return { success: false, error: 'Vui lòng chọn phương án cho câu hỏi nguyện vọng tiếp tục tham gia.' };
    }

    const saved = await saveSurveyResponse(input);
    return { success: true, id: saved.id };
  } catch (err: any) {
    console.error('Lỗi khi nộp khảo sát:', err);
    return { success: false, error: 'Có lỗi xảy ra trong quá trình gửi, vui lòng thử lại sau.' };
  }
}

export async function getSurveyAdminDataAction(passcode?: string) {
  try {
    // Nếu có mật mã đặt trong biến môi trường SURVEY_ADMIN_PASSCODE hoặc mặc định 'ynda2026'
    // Hoặc nếu không cần passcode, cho phép truy cập qua URL ẩn đặc biệt
    const validPasscode = process.env.SURVEY_ADMIN_PASSCODE || 'ynda2026';
    if (passcode && passcode.trim() !== '' && passcode.trim() !== validPasscode) {
      return { success: false, error: 'Mật mã quản trị viên không chính xác.', responses: [], stats: null };
    }

    const responses = await getAllSurveyResponses();

    const total = responses.length;
    const calcAvg = (key: keyof Pick<SurveyResponseRecord, 'clarity' | 'usefulness' | 'facilitator' | 'satisfaction'>) => {
      const valid = responses.map(r => Number(r[key])).filter(n => !isNaN(n) && n > 0);
      if (valid.length === 0) return 0;
      return +(valid.reduce((sum, v) => sum + v, 0) / valid.length).toFixed(1);
    };

    const continueCounts: Record<string, number> = {};
    responses.forEach(r => {
      const key = r.continue_project || 'Khác';
      continueCounts[key] = (continueCounts[key] || 0) + 1;
    });

    const stats = {
      total,
      avgClarity: calcAvg('clarity'),
      avgUsefulness: calcAvg('usefulness'),
      avgFacilitator: calcAvg('facilitator'),
      avgSatisfaction: calcAvg('satisfaction'),
      continueCounts
    };

    return {
      success: true,
      responses,
      stats
    };
  } catch (err: any) {
    console.error('Lỗi khi lấy dữ liệu khảo sát:', err);
    return {
      success: false,
      error: 'Không thể tải dữ liệu khảo sát.',
      responses: [],
      stats: null
    };
  }
}

export async function deleteSurveyItemAction(id: string) {
  try {
    if (!id) return { success: false, error: 'ID không hợp lệ.' };
    const ok = await deleteSurveyResponseById(id);
    return { success: ok };
  } catch (err: any) {
    console.error('Lỗi khi xóa phản hồi khảo sát:', err);
    return { success: false, error: 'Không thể xóa phản hồi này.' };
  }
}
