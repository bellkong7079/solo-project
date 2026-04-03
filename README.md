# 계절 - 패션 쇼핑몰

React + Node.js 기반 풀스택 패션 이커머스 플랫폼. 사용자 쇼핑 기능부터 관리자 대시보드까지 전 기능을 단독 개발.

---

## 기술 스택

| 구분 | 기술 |
|---|---|
| Frontend | React 18, Vite, React Router v6, Chart.js, Socket.io-client |
| Backend | Node.js, Express.js 5, Socket.io |
| Database | MySQL / MariaDB |
| 인증 | JWT, bcryptjs |
| 파일 업로드 | Multer |
| 이메일 | Nodemailer (Gmail SMTP) |

---

## 주요 기능

### 사용자
- 회원가입 / 로그인 / 프로필 수정 / 회원 탈퇴
- 비밀번호 찾기 (이메일 인증 링크 방식)
- 구매액 기반 자동 등급 산정 (일반 / 브론즈 / 실버 / 골드 / VIP)
- 상품 목록 / 상세 / 카테고리 필터
- 장바구니 (React Context API 전역 상태 관리)
- 주문 생성 / 상세 조회 / 취소 (DB 트랜잭션으로 재고 자동 복구)
- 상품 리뷰 작성 / 조회
- 실시간 고객 채팅 (Socket.io)
- 마이페이지, FAQ, 배송 안내, 멤버십 혜택

### 관리자
- 별도 관리자 계정 및 JWT 인증
- 대시보드 (실시간 통계 카드 + Chart.js 차트)
- 상품 / 주문 / 회원 / 카테고리 CRUD
- 매출 분석 (월별 / 일별 / 시간대별 / 요일별)
- 상품 분석 / 고객 분석 / 재고 관리
- 고객 채팅 관리 (실시간 1:1 상담, 읽음 처리, 상담 종료)

---

## 프로젝트 구조

```
solo-project/
├── back/                   # Node.js 백엔드
│   ├── config/
│   │   └── database.js     # MySQL 커넥션 풀
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── adminController.js
│   │   ├── cartController.js
│   │   └── orderController.js
│   ├── middlewares/
│   │   ├── auth.js         # 사용자 인증 미들웨어
│   │   ├── authMiddleware.js # 관리자 인증 미들웨어
│   │   └── upload.js       # Multer 파일 업로드
│   ├── routes/
│   │   ├── auth.js
│   │   ├── admin.js
│   │   ├── products.js
│   │   ├── cart.js
│   │   ├── orders.js
│   │   ├── chat.js
│   │   ├── categories.js
│   │   └── review.js
│   ├── uploads/            # 업로드된 상품 이미지
│   ├── server.js           # 서버 진입점 (Express + Socket.io)
│   ├── createAdmin.js      # 관리자 계정 생성 스크립트
│   └── .env
└── front/                  # React 프론트엔드
    └── src/
        ├── api/
        ├── components/     # Header, Footer, ChatWidget, ReviewForm 등
        ├── contexts/
        │   └── CartContext.jsx
        └── pages/          # 사용자/관리자 페이지
```

---

## 실행 방법

### 1. 환경변수 설정

`back/.env` 파일 작성:

```env
PORT=5000
DB_HOST=YOUR_DB_HOST
DB_USER=root
DB_PASSWORD=YOUR_PASSWORD
DB_NAME=fashion_shop
JWT_SECRET=your_jwt_secret_key
EMAIL_USER=your_gmail@gmail.com
EMAIL_PASS=your_gmail_app_password
```

> Gmail 앱 비밀번호는 Google 계정 → 보안 → 2단계 인증 활성화 후 발급

### 2. DB 테이블 생성

MySQL에서 `fashion_shop` 데이터베이스 생성 후 테이블 구성 필요.

### 3. 관리자 계정 생성

```bash
cd back
node createAdmin.js
```

기본 관리자 계정:
- 이메일: `admin@test.com`
- 비밀번호: `admin123`

### 4. 백엔드 실행

```bash
cd back
npm install
npm run dev
```

### 5. 프론트엔드 실행

```bash
cd front
npm install
npm run dev
```

프론트엔드: `http://localhost:5173`  
백엔드 API: `http://localhost:5000`

---

## API 구조

| 메서드 | 경로 | 설명 |
|---|---|---|
| POST | /api/auth/signup | 회원가입 |
| POST | /api/auth/login | 로그인 |
| GET | /api/auth/me | 내 정보 조회 |
| PUT | /api/auth/me | 회원정보 수정 |
| DELETE | /api/auth/me | 회원 탈퇴 |
| POST | /api/auth/forgot-password | 비밀번호 찾기 이메일 발송 |
| POST | /api/auth/reset-password | 비밀번호 재설정 |
| GET | /api/products | 상품 목록 |
| GET | /api/products/:id | 상품 상세 |
| GET | /api/cart | 장바구니 조회 |
| POST | /api/orders | 주문 생성 |
| GET | /api/orders/:orderId | 주문 상세 |
| DELETE | /api/orders/:orderId | 주문 취소 |
| POST | /api/chat/rooms | 채팅방 생성 |
| GET | /api/chat/admin/rooms | 관리자 채팅방 목록 |
| POST | /api/admin/login | 관리자 로그인 |
| GET | /api/admin/dashboard | 대시보드 통계 |
| GET | /api/admin/analytics/sales | 매출 분석 |

---

## 주요 구현 포인트

- **DB 트랜잭션**: 주문 생성/취소 시 재고 변경을 원자적으로 처리
- **실시간 채팅**: Socket.io room 기반 고객-관리자 1:1 채팅
- **등급 시스템**: 총 구매액 기반 서버사이드 등급 자동 계산
- **이미지 업로드**: Multer로 상품 이미지 서버 저장 및 정적 제공
- **비밀번호 찾기**: 토큰 기반 이메일 인증 (30분 유효)
