import { Link } from 'react-router-dom';
import './MembershipBenefits.css';

function MembershipBenefits() {
  return (
    <div className="membership-benefits-page">
      <div className="benefits-container">
        {/* 헤더 */}
        <div className="benefits-header">
          <h1>🎁 회원 등급 혜택</h1>
          <p>구매 금액에 따라 자동으로 등급이 올라가며, 다양한 혜택을 받으실 수 있습니다!</p>
        </div>

        {/* 등급 카드들 */}
        <div className="tier-cards-grid">
          {/* VIP 카드 */}
          <div className="benefit-tier-card vip">
            <div className="tier-badge">
              <span className="tier-icon">💎</span>
              <span className="tier-name">VIP</span>
            </div>
            <p className="tier-requirement">누적 구매 <strong>150만원</strong> 이상</p>
            
            <div className="benefits-detail-list">
              <div className="benefit-detail-item">
                <div className="benefit-icon">🚚</div>
                <div className="benefit-content">
                  <h4>무료 배송 (무제한)</h4>
                  <p>모든 주문에 대해 무료 배송</p>
                </div>
              </div>
              <div className="benefit-detail-item">
                <div className="benefit-icon">💰</div>
                <div className="benefit-content">
                  <h4>10% 상시 할인</h4>
                  <p>모든 상품 10% 할인 적용</p>
                </div>
              </div>
              <div className="benefit-detail-item">
                <div className="benefit-icon">🆕</div>
                <div className="benefit-content">
                  <h4>신상품 우선 구매</h4>
                  <p>신상품 출시 시 우선 구매 기회 제공</p>
                </div>
              </div>
              <div className="benefit-detail-item">
                <div className="benefit-icon">🎂</div>
                <div className="benefit-content">
                  <h4>??쿠폰 30,000원</h4>
                  <p>특별 쿠폰 지급</p>
                </div>
              </div>
            </div>
          </div>

          {/* 골드 카드 */}
          <div className="benefit-tier-card gold">
            <div className="tier-badge">
              <span className="tier-icon">🥇</span>
              <span className="tier-name">골드</span>
            </div>
            <p className="tier-requirement">누적 구매 <strong>80만원</strong> 이상</p>
            
            <div className="benefits-detail-list">
              <div className="benefit-detail-item">
                <div className="benefit-icon">🚚</div>
                <div className="benefit-content">
                  <h4>조건부 무료 배송</h4>
                  <p>5만원 이상 구매 시 무료 배송</p>
                </div>
              </div>
              <div className="benefit-detail-item">
                <div className="benefit-icon">💰</div>
                <div className="benefit-content">
                  <h4>5% 상시 할인</h4>
                  <p>모든 상품 5% 할인 적용</p>
                </div>
              </div>
              <div className="benefit-detail-item">
                <div className="benefit-icon">🎂</div>
                <div className="benefit-content">
                  <h4>?? 쿠폰 15,000원</h4>
                  <p>??? 달에 특별 쿠폰 지급</p>
                </div>
              </div>
            </div>
          </div>

          {/* 실버 카드 */}
          <div className="benefit-tier-card silver">
            <div className="tier-badge">
              <span className="tier-icon">🥈</span>
              <span className="tier-name">실버</span>
            </div>
            <p className="tier-requirement">누적 구매 <strong>40만원</strong> 이상</p>
            
            <div className="benefits-detail-list">
              <div className="benefit-detail-item">
                <div className="benefit-icon">🚚</div>
                <div className="benefit-content">
                  <h4>조건부 무료 배송</h4>
                  <p>7만원 이상 구매 시 무료 배송</p>
                </div>
              </div>
              <div className="benefit-detail-item">
                <div className="benefit-icon">🎟️</div>
                <div className="benefit-content">
                  <h4>3% 할인 쿠폰</h4>
                  <p>매월 3% 할인 쿠폰 지급</p>
                </div>
              </div>
              <div className="benefit-detail-item">
                <div className="benefit-icon">🎂</div>
                <div className="benefit-content">
                  <h4>?? 쿠폰 10,000원</h4>
                  <p>??? 달에 특별 쿠폰 지급</p>
                </div>
              </div>
            </div>
          </div>

          {/* 브론즈 카드 */}
          <div className="benefit-tier-card bronze">
            <div className="tier-badge">
              <span className="tier-icon">🥉</span>
              <span className="tier-name">브론즈</span>
            </div>
            <p className="tier-requirement">누적 구매 <strong>20만원</strong> 이상</p>
            
            <div className="benefits-detail-list">
              <div className="benefit-detail-item">
                <div className="benefit-icon">🎟️</div>
                <div className="benefit-content">
                  <h4>무료 배송 쿠폰</h4>
                  <p>매월 무료 배송 쿠폰 1장 지급</p>
                </div>
              </div>
              <div className="benefit-detail-item">
                <div className="benefit-icon">🎂</div>
                <div className="benefit-content">
                  <h4>?? 쿠폰 5,000원</h4>
                  <p>??? 달에 쿠폰 지급</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 안내 사항 */}
        <div className="benefits-notice">
          <h3>💡 안내 사항</h3>
          <ul>
            <li>등급은 누적 구매 금액을 기준으로 자동으로 산정됩니다.</li>
            <li>취소된 주문은 누적 금액에서 제외됩니다.</li>
            <li>등급은 실시간으로 변경되며, 즉시 혜택이 적용됩니다.</li>
            <li>할인은 결제 시 자동으로 적용됩니다.</li>
            <li>??? 쿠폰은 ???이 등록된 회원에 한해 지급됩니다.</li>
          </ul>
        </div>

        {/* CTA 버튼 */}
        <div className="benefits-cta">
          <Link to="/mypage" className="btn-primary">
            내 등급 확인하기
          </Link>
          <Link to="/products" className="btn-secondary">
            쇼핑하러 가기
          </Link>
        </div>
      </div>
    </div>
  );
}

export default MembershipBenefits;