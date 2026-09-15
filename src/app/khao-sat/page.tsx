import { Metadata } from 'next';
import SurveyFormClient from './SurveyFormClient';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Khảo sát — Định hướng dự án, cách xây dựng ý tưởng | Ý Niệm Điện Ảnh',
  description: 'Vài câu hỏi ngắn để tụi mình biết buổi học đầu tiên này có giúp ích được gì cho bạn. Mất khoảng 3 phút.',
  openGraph: {
    title: 'Khảo sát — Định hướng dự án, cách xây dựng ý tưởng | Ý Niệm Điện Ảnh',
    description: 'Vài câu hỏi ngắn để tụi mình biết buổi học đầu tiên này có giúp ích được gì cho bạn.',
    images: ['/logo.png'],
  }
};

export default function KhaoSatPage() {
  return <SurveyFormClient />;
}
