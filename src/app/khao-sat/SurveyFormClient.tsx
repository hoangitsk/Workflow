'use client';

import React, { useState } from 'react';
import { submitSurveyAction } from '@/actions/survey-actions';
import { CheckCircle2, Send, Loader2 } from 'lucide-react';

export default function SurveyFormClient() {
  const [fullname, setFullname] = useState('');

  const [clarity, setClarity] = useState<number>(0);
  const [usefulness, setUsefulness] = useState<number>(0);
  const [facilitator, setFacilitator] = useState<number>(0);
  const [satisfaction, setSatisfaction] = useState<number>(0);

  const [highlight, setHighlight] = useState('');
  const [gap, setGap] = useState('');
  const [continueProject, setContinueProject] = useState('');
  const [reason, setReason] = useState('');

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const continueOptions = [
    { value: 'Có, chắc chắn rồi', label: 'Có, chắc chắn rồi — mình muốn tham gia các buổi tiếp theo' },
    { value: 'Có, nhưng cần thêm thông tin', label: 'Có, nhưng cần biết thêm thông tin trước khi quyết định' },
    { value: 'Chưa chắc, cần thời gian', label: 'Chưa chắc — cần thêm thời gian suy nghĩ' },
    { value: 'Không, chưa phù hợp lúc này', label: 'Không, hiện tại chưa phù hợp với mình' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: { [key: string]: string } = {};

    if (!fullname.trim()) {
      newErrors.fullname = 'Vui lòng điền họ và tên của bạn nhé.';
    }
    if (!satisfaction) {
      newErrors.satisfaction = 'Chọn một mức độ hài lòng trước khi gửi nhé.';
    }
    if (!continueProject) {
      newErrors.continueProject = 'Chọn một phương án trước khi gửi nhé.';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstKey = Object.keys(newErrors)[0];
      const el = document.getElementById(`err-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      const res = await submitSurveyAction({
        fullname,
        clarity,
        usefulness,
        facilitator,
        satisfaction,
        highlight,
        gap,
        continue_project: continueProject,
        reason
      });

      if (res.success) {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(res.error || 'Có lỗi xảy ra khi gửi khảo sát, bạn vui lòng thử lại nhé.');
      }
    } catch (err) {
      alert('Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng và thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="survey-body">
      <div className="survey-sheet">
        <div className="survey-leader">
          <span>
            <span className="survey-dot"></span>
            Ý NIỆM ĐIỆN ẢNH
          </span>
          <span>Khảo sát buổi học</span>
        </div>

        {!submitted ? (
          <>
            <header className="survey-hero">
              <p className="survey-kicker">Buổi học đầu tiên · Định hướng dự án, cách xây dựng ý tưởng</p>
              <h1>Buổi học đầu tiên đã khép lại — còn bạn thì sao?</h1>
              <p className="survey-intro">
                Vài câu hỏi ngắn để tụi mình biết buổi học đầu tiên này có giúp ích được gì, và quan trọng hơn — liệu bạn có muốn tiếp tục đồng hành cùng các buổi học và dự án tiếp theo hay không. Mất khoảng 3 phút.
              </p>
            </header>

            <form onSubmit={handleSubmit}>
              {/* CHỈ ĐIỀN TÊN (Theo yêu cầu: bỏ hết chỉ điền tên) */}
              <div className="survey-q">
                <span className="survey-q-num">Thông tin của bạn</span>
                <p className="survey-q-title">
                  Họ và tên của bạn <span style={{ color: 'var(--danger)' }}>*</span>
                </p>
                <div className="survey-field" style={{ marginTop: '8px' }}>
                  <input
                    type="text"
                    id="fullname"
                    className="survey-input"
                    placeholder="Nhập họ và tên của bạn..."
                    value={fullname}
                    onChange={e => {
                      setFullname(e.target.value);
                      if (errors.fullname) {
                        setErrors(prev => ({ ...prev, fullname: '' }));
                      }
                    }}
                  />
                  {errors.fullname && (
                    <p className="survey-error-text" id="err-fullname">{errors.fullname}</p>
                  )}
                </div>
              </div>

              {/* CÂU 01: NỘI DUNG RÕ RÀNG */}
              <div className="survey-q">
                <span className="survey-q-num">01</span>
                <p className="survey-q-title">Nội dung buổi học rõ ràng, dễ hiểu</p>
                <div className="survey-scale">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      type="button"
                      key={num}
                      className={`survey-scale-btn ${clarity === num ? 'active' : ''}`}
                      onClick={() => setClarity(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="survey-scale-labels">
                  <span>Không rõ lắm</span>
                  <span>Rất rõ ràng</span>
                </div>
              </div>

              {/* CÂU 02: HÌNH DUNG Ý TƯỞNG */}
              <div className="survey-q">
                <span className="survey-q-num">02</span>
                <p className="survey-q-title">Buổi học giúp bạn hình dung được cách xây dựng ý tưởng cho dự án của mình</p>
                <div className="survey-scale">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      type="button"
                      key={num}
                      className={`survey-scale-btn ${usefulness === num ? 'active' : ''}`}
                      onClick={() => setUsefulness(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="survey-scale-labels">
                  <span>Chưa hình dung được</span>
                  <span>Rất hữu ích</span>
                </div>
              </div>

              {/* CÂU 03: NGƯỜI HƯỚNG DẪN */}
              <div className="survey-q">
                <span className="survey-q-num">03</span>
                <p className="survey-q-title">Người hướng dẫn trình bày dễ tiếp cận, giải đáp thắc mắc tốt</p>
                <div className="survey-scale">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      type="button"
                      key={num}
                      className={`survey-scale-btn ${facilitator === num ? 'active' : ''}`}
                      onClick={() => setFacilitator(num)}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="survey-scale-labels">
                  <span>Khó tiếp cận</span>
                  <span>Rất dễ tiếp cận</span>
                </div>
              </div>

              {/* CÂU 04: HÀI LÒNG CHUNG */}
              <div className="survey-q">
                <span className="survey-q-num">04</span>
                <p className="survey-q-title">
                  Mức độ hài lòng chung của bạn về buổi học <span style={{ color: 'var(--danger)' }}>*</span>
                </p>
                <div className="survey-scale">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      type="button"
                      key={num}
                      className={`survey-scale-btn ${satisfaction === num ? 'active' : ''}`}
                      onClick={() => {
                        setSatisfaction(num);
                        if (errors.satisfaction) {
                          setErrors(prev => ({ ...prev, satisfaction: '' }));
                        }
                      }}
                    >
                      {num}
                    </button>
                  ))}
                </div>
                <div className="survey-scale-labels">
                  <span>Chưa hài lòng</span>
                  <span>Rất hài lòng</span>
                </div>
                {errors.satisfaction && (
                  <p className="survey-error-text" id="err-satisfaction">{errors.satisfaction}</p>
                )}
              </div>

              {/* CÂU 05: ĐIỀU TÂM ĐẮC */}
              <div className="survey-q">
                <span className="survey-q-num">05</span>
                <p className="survey-q-title">Điều gì trong buổi học khiến bạn tâm đắc nhất?</p>
                <textarea
                  className="survey-textarea"
                  placeholder="Một ý, một ví dụ, hay một cách nghĩ nào đó đã đọng lại..."
                  value={highlight}
                  onChange={e => setHighlight(e.target.value)}
                />
              </div>

              {/* CÂU 06: ĐIỀU CHƯA RÕ */}
              <div className="survey-q">
                <span className="survey-q-num">06</span>
                <p className="survey-q-title">Điều gì bạn thấy còn chưa rõ, hoặc muốn được bổ sung thêm?</p>
                <textarea
                  className="survey-textarea"
                  placeholder="Có thể là một phần nội dung, một kỹ năng, hoặc đơn giản là cần thêm ví dụ..."
                  value={gap}
                  onChange={e => setGap(e.target.value)}
                />
              </div>

              {/* CÂU 07: TIẾP TỤC DỰ ÁN */}
              <div className="survey-q">
                <span className="survey-q-num">07</span>
                <p className="survey-q-title">
                  Sau buổi học đầu tiên này, bạn có muốn tiếp tục tham gia các buổi học và dự án tiếp theo không? <span style={{ color: 'var(--danger)' }}>*</span>
                </p>
                <p className="survey-q-hint">Chọn phương án gần với suy nghĩ hiện tại của bạn nhất.</p>

                <div className="survey-choice-list">
                  {continueOptions.map(opt => {
                    const isChecked = continueProject === opt.value;
                    return (
                      <label
                        key={opt.value}
                        className={`survey-choice ${isChecked ? 'checked' : ''}`}
                        onClick={() => {
                          setContinueProject(opt.value);
                          if (errors.continueProject) {
                            setErrors(prev => ({ ...prev, continueProject: '' }));
                          }
                        }}
                      >
                        <input
                          type="radio"
                          name="continue_project"
                          value={opt.value}
                          checked={isChecked}
                          onChange={() => {}}
                        />
                        <span className="survey-choice-text">{opt.label}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.continueProject && (
                  <p className="survey-error-text" id="err-continueProject">{errors.continueProject}</p>
                )}

                <div className="survey-field" style={{ marginTop: '16px' }}>
                  <label htmlFor="reason">Vì sao bạn chọn phương án đó? (không bắt buộc)</label>
                  <textarea
                    id="reason"
                    className="survey-textarea"
                    placeholder="Chia sẻ ngắn gọn lý do..."
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                  />
                </div>
              </div>

              {/* FOOTER & NÚT GỬI */}
              <div className="survey-footer">
                <button
                  type="submit"
                  className="survey-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                      Đang gửi...
                    </>
                  ) : (
                    <>
                      <Send style={{ width: 16, height: 16 }} />
                      Gửi khảo sát
                    </>
                  )}
                </button>
                <p style={{ fontSize: '11.5px', color: 'var(--burgundy-3)', margin: 0 }}>
                  Phản hồi của bạn được dùng nội bộ để cải thiện các buổi học tiếp theo của Ý Niệm Điện Ảnh.
                </p>
              </div>
            </form>
          </>
        ) : (
          /* MÀN HÌNH CẢM ƠN */
          <div className="survey-done">
            <div style={{ display: 'inline-flex', padding: '12px', background: 'var(--behong)', borderRadius: '50%', color: 'var(--burgundy)' }}>
              <CheckCircle2 style={{ width: 40, height: 40 }} />
            </div>
            <h2>Cảm ơn bạn {fullname ? fullname : ''} đã chia sẻ!</h2>
            <p>
              Phản hồi của bạn đã được ghi nhận thành công. Nếu bạn chọn tiếp tục đồng hành, tụi mình sẽ sớm liên hệ với bạn nhé.
            </p>
            <div style={{ marginTop: '28px' }}>
              <button
                type="button"
                onClick={() => {
                  setSubmitted(false);
                  setFullname('');
                  setClarity(0);
                  setUsefulness(0);
                  setFacilitator(0);
                  setSatisfaction(0);
                  setHighlight('');
                  setGap('');
                  setContinueProject('');
                  setReason('');
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--taupe)',
                  color: 'var(--burgundy-2)',
                  padding: '8px 18px',
                  borderRadius: '2px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                Gửi một phản hồi khác
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
