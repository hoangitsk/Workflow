'use client';

import React, { useState } from 'react';
import { submitSurveyAction } from '@/actions/survey-actions';
import { CheckCircle2, Sparkles, Send, Loader2, ArrowRight } from 'lucide-react';

export default function SurveyFormClient() {
  const [fullname, setFullname] = useState('');
  const [school, setSchool] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

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
      // scroll to first error
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
        school,
        phone,
        email,
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
    <div className="survey-container">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,600;1,500&family=Be+Vietnam+Pro:wght@400;500;600;700&display=swap');

        :root {
          --burgundy: #381412;
          --burgundy-2: #552824;
          --burgundy-3: #734D44;
          --cream: #F1E7DC;
          --cream-2: #FBF6EF;
          --behong: #E4C7B5;
          --taupe: #C8A898;
          --line: #271E1B;
          --shadow: #1A0A07;
          --danger: #8C2B22;
        }

        .survey-wrapper {
          min-height: 100vh;
          background-color: var(--cream);
          color: var(--burgundy);
          font-family: 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.6;
          padding: 40px 16px 80px;
        }

        .survey-sheet {
          max-width: 640px;
          margin: 0 auto;
          background: var(--cream-2);
          border: 1px solid var(--behong);
          border-radius: 4px;
          box-shadow: 0 4px 20px rgba(56, 20, 18, 0.04);
          overflow: hidden;
        }

        .survey-leader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 14px 28px;
          border-bottom: 1px solid var(--behong);
          font-size: 12px;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          color: var(--burgundy-3);
        }

        .survey-leader-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--taupe);
          display: inline-block;
          margin-right: 6px;
        }

        .survey-hero {
          padding: 36px 28px 28px;
          border-bottom: 1px solid var(--behong);
        }

        .survey-kicker {
          font-size: 13px;
          color: var(--burgundy-3);
          margin: 0 0 10px;
          font-weight: 500;
        }

        .survey-hero h1 {
          font-family: 'Lora', Georgia, serif;
          font-weight: 600;
          font-size: 26px;
          line-height: 1.35;
          margin: 0 0 14px;
          color: var(--burgundy);
        }

        .survey-intro {
          font-size: 15px;
          color: var(--burgundy-2);
          max-width: 54ch;
          margin: 0;
          line-height: 1.65;
        }

        .survey-q {
          padding: 26px 28px;
          border-bottom: 1px solid var(--behong);
        }

        .survey-q-num {
          font-family: 'Lora', Georgia, serif;
          font-style: italic;
          font-size: 13px;
          color: var(--taupe);
          display: block;
          margin-bottom: 8px;
        }

        .survey-q-title {
          font-size: 16px;
          font-weight: 600;
          margin: 0 0 4px;
          color: var(--burgundy);
        }

        .survey-q-hint {
          font-size: 13px;
          color: var(--burgundy-3);
          margin: 0 0 16px;
        }

        .survey-scale {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .survey-scale-btn {
          flex: 1;
          min-width: 52px;
          text-align: center;
          border: 1px solid var(--taupe);
          padding: 10px 4px;
          font-size: 14px;
          font-weight: 500;
          color: var(--burgundy-2);
          cursor: pointer;
          user-select: none;
          background: transparent;
          border-radius: 2px;
          transition: all 0.15s ease;
        }

        .survey-scale-btn:hover {
          border-color: var(--burgundy);
          background: rgba(228, 199, 181, 0.25);
        }

        .survey-scale-btn.active {
          background: var(--burgundy);
          border-color: var(--burgundy);
          color: var(--cream-2);
          box-shadow: 0 2px 6px rgba(56, 20, 18, 0.2);
        }

        .survey-scale-labels {
          display: flex;
          justify-content: space-between;
          font-size: 11.5px;
          color: var(--burgundy-3);
          margin-top: 8px;
        }

        .survey-input, .survey-textarea {
          width: 100%;
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 14.5px;
          color: var(--burgundy);
          background: #ffffff;
          border: 1px solid var(--taupe);
          border-radius: 3px;
          padding: 11px 14px;
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }

        .survey-input:focus, .survey-textarea:focus {
          outline: none;
          border-color: var(--burgundy);
          box-shadow: 0 0 0 2px rgba(56, 20, 18, 0.12);
        }

        .survey-textarea {
          min-height: 86px;
          resize: vertical;
        }

        .survey-choice-list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .survey-choice {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          border: 1px solid var(--taupe);
          padding: 13px 15px;
          cursor: pointer;
          border-radius: 3px;
          background: #ffffff;
          transition: all 0.15s ease;
        }

        .survey-choice:hover {
          border-color: var(--burgundy-2);
          background: rgba(228, 199, 181, 0.15);
        }

        .survey-choice.checked {
          border-color: var(--burgundy);
          background: var(--behong);
        }

        .survey-choice input[type="radio"] {
          margin-top: 3px;
          accent-color: var(--burgundy);
          cursor: pointer;
        }

        .survey-choice-text {
          font-size: 14.5px;
          color: var(--burgundy-2);
          font-weight: 500;
        }

        .survey-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        @media (max-width: 540px) {
          .survey-grid-2 {
            grid-template-columns: 1fr;
          }
          .survey-hero, .survey-q, .survey-footer, .survey-leader {
            padding-left: 20px !important;
            padding-right: 20px !important;
          }
          .survey-hero h1 {
            font-size: 22px;
          }
        }

        .survey-field {
          margin-top: 12px;
        }

        .survey-field label {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--burgundy-3);
          margin-bottom: 6px;
        }

        .survey-footer {
          padding: 28px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          align-items: flex-start;
        }

        .survey-submit-btn {
          font-family: 'Be Vietnam Pro', sans-serif;
          font-size: 15px;
          font-weight: 600;
          color: var(--cream-2);
          background: var(--burgundy);
          border: none;
          padding: 13px 32px;
          cursor: pointer;
          border-radius: 3px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          transition: background 0.15s ease, transform 0.1s ease;
          box-shadow: 0 4px 12px rgba(56, 20, 18, 0.15);
        }

        .survey-submit-btn:hover:not(:disabled) {
          background: var(--burgundy-2);
          transform: translateY(-1px);
        }

        .survey-submit-btn:disabled {
          background: var(--taupe);
          cursor: not-allowed;
          box-shadow: none;
        }

        .survey-error-text {
          font-size: 12.5px;
          color: var(--danger);
          margin-top: 6px;
          font-weight: 500;
        }

        .survey-done {
          padding: 70px 32px;
          text-align: center;
        }

        .survey-done h2 {
          font-family: 'Lora', Georgia, serif;
          font-weight: 600;
          font-size: 24px;
          margin: 16px 0 12px;
          color: var(--burgundy);
        }

        .survey-done p {
          font-size: 15px;
          color: var(--burgundy-2);
          max-width: 44ch;
          margin: 0 auto;
          line-height: 1.65;
        }
      `}</style>

      <div className="survey-wrapper">
        <div className="survey-sheet">
          <div className="survey-leader">
            <span>
              <span className="survey-leader-dot"></span>
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
                {/* THÔNG TIN CÁ NHÂN (Họ và tên nổi bật) */}
                <div className="survey-q" style={{ backgroundColor: 'rgba(228, 199, 181, 0.12)' }}>
                  <span className="survey-q-num">Thông tin người tham gia</span>
                  <p className="survey-q-title">
                    Bạn cho tụi mình xin họ tên và cách liên hệ nhé <span style={{ color: 'var(--danger)' }}>*</span>
                  </p>
                  <p className="survey-q-hint">Để tụi mình biết ai đang chia sẻ và tiện liên hệ khi cần thiết.</p>

                  <div className="survey-field">
                    <label htmlFor="fullname">
                      Họ và tên của bạn <span style={{ color: 'var(--danger)' }}>*</span>
                    </label>
                    <input
                      type="text"
                      id="fullname"
                      className="survey-input"
                      placeholder="Ví dụ: Nguyễn Minh Thư"
                      value={fullname}
                      onChange={e => setFullname(e.target.value)}
                    />
                    {errors.fullname && (
                      <p className="survey-error-text" id="err-fullname">{errors.fullname}</p>
                    )}
                  </div>

                  <div className="survey-grid-2" style={{ marginTop: '12px' }}>
                    <div className="survey-field" style={{ margin: 0 }}>
                      <label htmlFor="school">Trường / lớp hoặc đơn vị công tác</label>
                      <input
                        type="text"
                        id="school"
                        className="survey-input"
                        placeholder="THPT / Đại học / Freelance..."
                        value={school}
                        onChange={e => setSchool(e.target.value)}
                      />
                    </div>
                    <div className="survey-field" style={{ margin: 0 }}>
                      <label htmlFor="phone">Số điện thoại / Zalo</label>
                      <input
                        type="tel"
                        id="phone"
                        className="survey-input"
                        placeholder="09xx xxx xxx"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="survey-field" style={{ marginTop: '12px' }}>
                    <label htmlFor="email">Email</label>
                    <input
                      type="email"
                      id="email"
                      className="survey-input"
                      placeholder="tenban@email.com"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
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
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang gửi phản hồi...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
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
                <CheckCircle2 className="w-10 h-10" />
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
                    setPhone('');
                    setEmail('');
                    setSchool('');
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
                    borderRadius: '3px',
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Gửi một phản hồi khác
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
