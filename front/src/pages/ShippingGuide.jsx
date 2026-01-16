import './ShippingGuide.css';

function ShippingGuide() {
  return (
    <div className="shipping-guide-page">
      <div className="page-header">
        <h1>배송 안내</h1>
        <p>안전하고 빠른 배송을 위해 최선을 다하겠습니다</p>
      </div>

      <div className="container">
        <div className="guide-content">
          
          {/* 배송비 안내 */}
          <section className="guide-section">
            <div className="section-icon">📦</div>
            <h2>배송비 안내</h2>
            <div className="info-box">
              <div className="info-row">
                <span className="label">기본 배송비</span>
                <span className="value">3,000원</span>
              </div>
              <div className="info-row highlight">
                <span className="label">무료배송 기준</span>
                <span className="value">50,000원 이상 구매 시</span>
              </div>
              <div className="info-row">
                <span className="label">도서산간 추가 배송비</span>
                <span className="value">3,000원 ~ 5,000원</span>
              </div>
            </div>
            <p className="note">
              * 제주도 및 도서산간 지역은 추가 배송비가 발생할 수 있습니다.<br/>
              * 배송비는 1회 주문 기준이며, 같은 날 여러 번 주문하실 경우 각각 부과됩니다.
            </p>
          </section>

          {/* 배송 기간 */}
          <section className="guide-section">
            <div className="section-icon">🚚</div>
            <h2>배송 기간</h2>
            <div className="timeline">
              <div className="timeline-item">
                <div className="timeline-dot">1</div>
                <div className="timeline-content">
                  <h3>결제 완료</h3>
                  <p>주문 접수 및 결제 확인</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot">2</div>
                <div className="timeline-content">
                  <h3>상품 준비 (1일)</h3>
                  <p>검수 및 포장 작업</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot">3</div>
                <div className="timeline-content">
                  <h3>배송 중 (2-3일)</h3>
                  <p>택배사를 통한 배송</p>
                </div>
              </div>
              <div className="timeline-item">
                <div className="timeline-dot">4</div>
                <div className="timeline-content">
                  <h3>배송 완료</h3>
                  <p>상품 수령</p>
                </div>
              </div>
            </div>
            <div className="highlight-box">
              <strong>평균 배송 기간:</strong> 결제 완료 후 2-3일 (영업일 기준)
            </div>
            <p className="note">
              * 주말 및 공휴일은 배송되지 않습니다.<br/>
              * 도서산간 지역은 1-2일 추가 소요될 수 있습니다.<br/>
              * 천재지변, 물량 폭주 등의 사유로 배송이 지연될 수 있습니다.
            </p>
          </section>

          {/* 배송 조회 */}
          <section className="guide-section">
            <div className="section-icon">🔍</div>
            <h2>배송 조회</h2>
            <div className="step-cards">
              <div className="step-card">
                <div className="step-number">STEP 1</div>
                <h3>마이페이지 접속</h3>
                <p>로그인 후 마이페이지로 이동합니다</p>
              </div>
              <div className="step-card">
                <div className="step-number">STEP 2</div>
                <h3>주문내역 확인</h3>
                <p>주문내역 메뉴에서 해당 주문을 찾습니다</p>
              </div>
              <div className="step-card">
                <div className="step-number">STEP 3</div>
                <h3>운송장 번호 확인</h3>
                <p>택배사와 운송장 번호를 확인합니다</p>
              </div>
              <div className="step-card">
                <div className="step-number">STEP 4</div>
                <h3>배송 추적</h3>
                <p>택배사 홈페이지에서 실시간 조회합니다</p>
              </div>
            </div>
          </section>

          {/* 배송 택배사 */}
          <section className="guide-section">
            <div className="section-icon">🏢</div>
            <h2>배송 택배사</h2>
            <div className="courier-list">
              <div className="courier-item">
                <h3>CJ대한통운</h3>
                <p>📞 1588-1255</p>
                <a href="https://www.cjlogistics.com" target="_blank" rel="noopener noreferrer">
                  배송조회 →
                </a>
              </div>
              <div className="courier-item">
                <h3>우체국택배</h3>
                <p>📞 1588-1300</p>
                <a href="https://service.epost.go.kr" target="_blank" rel="noopener noreferrer">
                  배송조회 →
                </a>
              </div>
              <div className="courier-item">
                <h3>로젠택배</h3>
                <p>📞 1588-9988</p>
                <a href="https://www.ilogen.com" target="_blank" rel="noopener noreferrer">
                  배송조회 →
                </a>
              </div>
            </div>
            <p className="note">
              * 택배사는 재고 및 배송 상황에 따라 달라질 수 있습니다.
            </p>
          </section>

          {/* 배송 관련 FAQ */}
          <section className="guide-section">
            <div className="section-icon">❓</div>
            <h2>자주 묻는 질문</h2>
            <div className="faq-list">
              <div className="faq-item">
                <h3>Q. 배송지 변경이 가능한가요?</h3>
                <p>A. 배송 준비 중 단계까지는 변경 가능합니다. 고객센터(1588-0000)로 빠르게 연락주세요.</p>
              </div>
              <div className="faq-item">
                <h3>Q. 주말에도 배송되나요?</h3>
                <p>A. 토요일은 배송되지만, 일요일 및 공휴일은 배송되지 않습니다.</p>
              </div>
              <div className="faq-item">
                <h3>Q. 해외 배송도 가능한가요?</h3>
                <p>A. 죄송하지만 현재는 국내 배송만 가능합니다.</p>
              </div>
              <div className="faq-item">
                <h3>Q. 배송 전 연락이 오나요?</h3>
                <p>A. 배송 시작 시 SMS로 운송장 번호를 안내해드립니다.</p>
              </div>
            </div>
          </section>

          {/* 유의사항 */}
          <section className="guide-section notice-section">
            <div className="section-icon">⚠️</div>
            <h2>배송 유의사항</h2>
            <ul className="notice-list">
              <li>주문 시 입력하신 배송지 정보를 다시 한번 확인해주세요.</li>
              <li>부재 시 경비실이나 무인 택배함에 배송될 수 있습니다.</li>
              <li>장기간 부재로 인한 반송 시 왕복 배송비가 청구될 수 있습니다.</li>
              <li>배송 완료 후 분실 및 도난에 대해서는 책임지지 않습니다.</li>
              <li>천재지변, 택배사 사정 등으로 배송이 지연될 수 있습니다.</li>
            </ul>
          </section>

        </div>

        {/* 고객센터 안내 */}
        <div className="contact-box">
          <h3>배송 관련 문의</h3>
          <p>배송에 관한 궁금한 점이 있으시면 언제든 문의해주세요.</p>
          <div className="contact-info">
            <div className="contact-item">
              <span className="icon">📞</span>
              <div>
                <strong>전화 문의</strong>
                <p>1588-0000</p>
              </div>
            </div>
            <div className="contact-item">
              <span className="icon">✉️</span>
              <div>
                <strong>이메일 문의</strong>
                <p>support@fashionshop.com</p>
              </div>
            </div>
            <div className="contact-item">
              <span className="icon">🕐</span>
              <div>
                <strong>운영 시간</strong>
                <p>평일 09:00 - 18:00<br/>(주말/공휴일 휴무)</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default ShippingGuide;