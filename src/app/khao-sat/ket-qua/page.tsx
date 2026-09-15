import { Metadata } from 'next';
import SurveyAdminClient from './SurveyAdminClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Bảng Quản Trị Khảo Sát | Ý Niệm Điện Ảnh',
  description: 'Trang quản trị và thống kê kết quả khảo sát định hướng dự án.',
  robots: {
    index: false,
    follow: false
  }
};

export default function SurveyKetQuaPage() {
  return <SurveyAdminClient />;
}
