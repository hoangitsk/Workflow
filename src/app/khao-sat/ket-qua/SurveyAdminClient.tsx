'use client';

import React, { useState, useEffect } from 'react';
import { getSurveyAdminDataAction, deleteSurveyItemAction } from '@/actions/survey-actions';
import { SurveyResponseRecord } from '@/lib/survey-db';
import { 
  Users, Star, Award, TrendingUp, Download, RefreshCw, Trash2, 
  Search, ExternalLink, MessageSquare, Phone, Mail, School, 
  Calendar, CheckCircle, AlertCircle, ArrowLeft 
} from 'lucide-react';
import Link from 'next/link';

export default function SurveyAdminClient() {
  const [loading, setLoading] = useState(true);
  const [responses, setResponses] = useState<SurveyResponseRecord[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getSurveyAdminDataAction();
      if (res.success && res.responses) {
        setResponses(res.responses);
        setStats(res.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Bạn có chắc chắn muốn xóa phản hồi của "${name}" không?`)) return;
    setDeletingId(id);
    try {
      const res = await deleteSurveyItemAction(id);
      if (res.success) {
        setResponses(prev => prev.filter(r => r.id !== id));
        fetchData();
      } else {
        alert(res.error || 'Lỗi khi xóa phản hồi.');
      }
    } catch (err) {
      alert('Không thể kết nối đến máy chủ.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleExportCSV = () => {
    if (responses.length === 0) {
      alert('Chưa có dữ liệu phản hồi để xuất file.');
      return;
    }

    const headers = [
      'Thời gian',
      'Họ và tên',
      'Trường / Lớp',
      'Số điện thoại / Zalo',
      'Email',
      'Độ rõ ràng (1-5)',
      'Hữu ích ý tưởng (1-5)',
      'Người hướng dẫn (1-5)',
      'Hài lòng chung (1-5)',
      'Tâm đắc nhất',
      'Chưa rõ / Muốn bổ sung',
      'Nguyện vọng tiếp tục',
      'Lý do'
    ];

    const escapeCsv = (str: any) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = responses.map(r => {
      const dateStr = r.submitted_at ? new Date(r.submitted_at).toLocaleString('vi-VN') : '';
      return [
        escapeCsv(dateStr),
        escapeCsv(r.fullname),
        escapeCsv(r.school),
        escapeCsv(r.phone),
        escapeCsv(r.email),
        escapeCsv(r.clarity),
        escapeCsv(r.usefulness),
        escapeCsv(r.facilitator),
        escapeCsv(r.satisfaction),
        escapeCsv(r.highlight),
        escapeCsv(r.gap),
        escapeCsv(r.continue_project),
        escapeCsv(r.reason)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `khao-sat-y-niem-dien-anh-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredResponses = responses.filter(r => {
    const q = search.toLowerCase().trim();
    const matchQuery = !q || 
      (r.fullname && r.fullname.toLowerCase().includes(q)) ||
      (r.phone && r.phone.toLowerCase().includes(q)) ||
      (r.email && r.email.toLowerCase().includes(q)) ||
      (r.school && r.school.toLowerCase().includes(q)) ||
      (r.highlight && r.highlight.toLowerCase().includes(q)) ||
      (r.reason && r.reason.toLowerCase().includes(q));

    if (!matchQuery) return false;

    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'YES' && r.continue_project.includes('Có')) return true;
    if (selectedFilter === 'MAYBE' && (r.continue_project.includes('Chưa chắc') || r.continue_project.includes('thêm thông tin'))) return true;
    if (selectedFilter === 'NO' && r.continue_project.includes('Không')) return true;

    return true;
  });

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* TOP BAR */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-800 uppercase tracking-wider mb-1">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse"></span>
              Khu Vực Quản Trị Đặc Biệt (Ẩn)
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Kết Quả Khảo Sát Định Hướng Dự Án
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Hệ thống theo dõi và phân tích các phản hồi buổi học từ form công khai <code className="text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded font-mono">/khao-sat</code>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/khao-sat"
              target="_blank"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <ExternalLink className="w-4 h-4 text-slate-500" />
              Mở Form Khảo Sát
            </Link>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
            >
              <Download className="w-4 h-4" />
              Xuất Excel (CSV)
            </button>

            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-slate-500 ${loading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>
        </div>

        {/* STATS CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Tổng phản hồi</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-3xl font-extrabold text-slate-900">{stats?.total || 0}</div>
            <div className="text-xs text-slate-500 mt-1">Lượt điền khảo sát</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Hài lòng chung</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="text-3xl font-extrabold text-amber-600">
              {stats?.avgSatisfaction ? stats.avgSatisfaction : '—'}<span className="text-sm font-normal text-slate-400"> / 5</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Điểm trung bình</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Nội dung rõ ràng</span>
              <Award className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-3xl font-extrabold text-indigo-600">
              {stats?.avgClarity ? stats.avgClarity : '—'}<span className="text-sm font-normal text-slate-400"> / 5</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Điểm trung bình</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Xây dựng ý tưởng</span>
              <TrendingUp className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-3xl font-extrabold text-emerald-600">
              {stats?.avgUsefulness ? stats.avgUsefulness : '—'}<span className="text-sm font-normal text-slate-400"> / 5</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Điểm trung bình</div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs col-span-2 md:col-span-1">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Người hướng dẫn</span>
              <CheckCircle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-3xl font-extrabold text-rose-600">
              {stats?.avgFacilitator ? stats.avgFacilitator : '—'}<span className="text-sm font-normal text-slate-400"> / 5</span>
            </div>
            <div className="text-xs text-slate-500 mt-1">Điểm trung bình</div>
          </div>
        </div>

        {/* DISTRIBUTION BAR */}
        {stats && stats.continueCounts && Object.keys(stats.continueCounts).length > 0 && (
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
              Nguyện vọng tiếp tục đồng hành cùng dự án:
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.continueCounts).map(([key, count]: [string, any]) => {
                const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                let bgBadge = 'bg-slate-100 text-slate-700 border-slate-200';
                if (key.includes('Có')) bgBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                else if (key.includes('Chưa chắc') || key.includes('thông tin')) bgBadge = 'bg-amber-50 text-amber-800 border-amber-200';
                else if (key.includes('Không')) bgBadge = 'bg-rose-50 text-rose-800 border-rose-200';

                return (
                  <div key={key} className={`border rounded-lg p-3 ${bgBadge}`}>
                    <div className="text-xs font-medium line-clamp-1" title={key}>{key}</div>
                    <div className="flex items-baseline justify-between mt-1.5">
                      <span className="text-xl font-bold">{count} lượt</span>
                      <span className="text-xs font-semibold">{percent}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SEARCH AND FILTER */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Tìm theo tên, SĐT, trường, nội dung..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <button
              onClick={() => setSelectedFilter('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                selectedFilter === 'ALL'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tất cả ({responses.length})
            </button>
            <button
              onClick={() => setSelectedFilter('YES')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                selectedFilter === 'YES'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Muốn tiếp tục
            </button>
            <button
              onClick={() => setSelectedFilter('MAYBE')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                selectedFilter === 'MAYBE'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
              }`}
            >
              Cân nhắc / Cần thông tin
            </button>
            <button
              onClick={() => setSelectedFilter('NO')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition ${
                selectedFilter === 'NO'
                  ? 'bg-rose-700 text-white shadow-xs'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Chưa phù hợp
            </button>
          </div>
        </div>

        {/* LIST / TABLE OF RESPONSES */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
          {loading ? (
            <div className="py-20 text-center text-slate-500">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto text-rose-700 mb-3" />
              Đang tải danh sách khảo sát...
            </div>
          ) : filteredResponses.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <MessageSquare className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-slate-700">Chưa có phản hồi nào</p>
              <p className="text-xs text-slate-400 mt-1">
                {search ? 'Không tìm thấy kết quả phù hợp với từ khóa.' : 'Khi có người điền form tại /khao-sat, danh sách sẽ hiển thị ở đây.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {filteredResponses.map((item, idx) => {
                const dateStr = item.submitted_at ? new Date(item.submitted_at).toLocaleString('vi-VN') : '';
                return (
                  <div key={item.id} className="p-5 md:p-6 hover:bg-slate-50/60 transition">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-400">#{filteredResponses.length - idx}</span>
                          <h4 className="text-base font-bold text-slate-900">{item.fullname}</h4>
                          {item.continue_project.includes('Có') ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                              <CheckCircle className="w-3 h-3" />
                              Tiếp tục
                            </span>
                          ) : item.continue_project.includes('Không') ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
                              Chưa phù hợp
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
                              Cân nhắc
                            </span>
                          )}
                        </div>

                        {/* CONTACT INFO */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                          {item.school && (
                            <span className="inline-flex items-center gap-1">
                              <School className="w-3.5 h-3.5 text-slate-400" />
                              {item.school}
                            </span>
                          )}
                          {item.phone && (
                            <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              <a href={`tel:${item.phone}`} className="hover:underline text-rose-700">
                                {item.phone}
                              </a>
                            </span>
                          )}
                          {item.email && (
                            <span className="inline-flex items-center gap-1">
                              <Mail className="w-3.5 h-3.5 text-slate-400" />
                              <a href={`mailto:${item.email}`} className="hover:underline">
                                {item.email}
                              </a>
                            </span>
                          )}
                          <span className="inline-flex items-center gap-1 text-slate-400">
                            <Calendar className="w-3.5 h-3.5" />
                            {dateStr}
                          </span>
                        </div>
                      </div>

                      {/* ACTION / DELETE */}
                      <div className="flex items-center gap-2 self-start md:self-auto">
                        <button
                          onClick={() => handleDelete(item.id, item.fullname)}
                          disabled={deletingId === item.id}
                          className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition"
                          title="Xóa phản hồi này"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* SCORES SUMMARY */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 rounded-lg p-3 border border-slate-100 text-xs mb-4">
                      <div>
                        <span className="text-slate-500">Rõ ràng:</span>{' '}
                        <strong className="text-indigo-700">{item.clarity || '—'}/5</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Ý tưởng:</span>{' '}
                        <strong className="text-emerald-700">{item.usefulness || '—'}/5</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Hướng dẫn:</span>{' '}
                        <strong className="text-purple-700">{item.facilitator || '—'}/5</strong>
                      </div>
                      <div>
                        <span className="text-slate-500">Hài lòng chung:</span>{' '}
                        <strong className="text-rose-700">{item.satisfaction}/5</strong>
                      </div>
                    </div>

                    {/* OPINIONS & FEEDBACK */}
                    <div className="space-y-2 text-xs md:text-sm text-slate-700">
                      {item.highlight && (
                        <div className="bg-amber-50/60 border border-amber-200/60 rounded-lg p-3">
                          <strong className="text-amber-900 block mb-0.5 text-xs font-semibold uppercase tracking-wider">
                            ✨ Điều tâm đắc nhất:
                          </strong>
                          <p className="whitespace-pre-line text-slate-800">{item.highlight}</p>
                        </div>
                      )}

                      {item.gap && (
                        <div className="bg-slate-100/70 border border-slate-200 rounded-lg p-3">
                          <strong className="text-slate-800 block mb-0.5 text-xs font-semibold uppercase tracking-wider">
                            💡 Chưa rõ / Muốn bổ sung:
                          </strong>
                          <p className="whitespace-pre-line text-slate-800">{item.gap}</p>
                        </div>
                      )}

                      <div className="bg-white border border-slate-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <strong className="text-slate-900 text-xs font-semibold uppercase tracking-wider">
                            Nguyện vọng tiếp tục:
                          </strong>
                          <span className="text-slate-700 font-medium">{item.continue_project}</span>
                        </div>
                        {item.reason && (
                          <p className="text-slate-600 text-xs mt-1 italic pl-2 border-l-2 border-rose-300">
                            &ldquo;{item.reason}&rdquo;
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
