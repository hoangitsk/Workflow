import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default function SurveyAdminRedirect() {
  redirect('/khao-sat/ket-qua');
}
