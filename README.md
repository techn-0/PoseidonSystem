# Poseidon System

포세이돈 시스템은 기상청 초단기실황/초단기예보/단기예보를 React+Leaflet 지도 위에 표시하는 날씨 정보 제공 시스템입니다.

## 구조

```
PoseidonSystem/
├── server/          # Express.js 백엔드 서버
│   ├── index.js     # 메인 서버 파일
│   ├── auth.js      # 인증 관련
│   ├── db.js        # SQLite 데이터베이스 설정
│   ├── favorites.js # 즐겨찾기 기능
│   ├── kma.js       # 기상청 API 연동
│   ├── kma-grid.js  # 격자 좌표 변환
│   ├── poseidon.db  # SQLite 데이터베이스 파일
│   ├── package.json # 서버 의존성
│   └── .env         # 서버 환경변수
├── app/            # React + Vite 프론트엔드
│   ├── src/
│   │   ├── components/
│   │   │   ├── MapPanel.jsx    # Leaflet 지도 컴포넌트
│   │   │   ├── Sidebar.jsx     # 사이드바
│   │   │   ├── LoginModal.jsx  # 로그인 모달
│   │   │   ├── Login.jsx       # 로그인 컴포넌트
│   │   │   └── Search.jsx      # 검색 기능
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── api.js   # API 통신
│   │   └── styles.css # 스타일시트
│   ├── public/
│   │   ├── poseidon-logo.png # 로고 이미지
│   │   └── vite.svg
│   ├── package.json # 프론트엔드 의존성
│   └── vite.config.js # Vite 설정
├── API 문서(참조용)/  # 기상청 API 문서
│   ├── API 인증키.md
│   └── 기상청 API 가이드 문서들
├── 기능 코드/        # 개발 중 백업 코드
├── .env            # 루트 환경변수 설정
├── 로고 이미지.png   # 프로젝트 로고
└── README.md       # 이 파일
```

## 환경변수 설정

루트 디렉토리의 `.env` 파일과 `server/.env` 파일에 다음 설정이 필요합니다:

**루트 `.env` 파일:**
```
KMA_SERVICE_KEY=키를 발급받아 입력
```

**server/.env 파일:**
```
PORT=4000
JWT_SECRET=dev_secret_change_me
KMA_SERVICE_KEY=키를 발급받아 입력
```

## 실행 방법

### 1. 의존성 설치

**백엔드 의존성 설치:**
```cmd
cd server
npm install
```

**프론트엔드 의존성 설치:**
```cmd
cd app
npm install
```

### 2. 백엔드 서버 실행

```cmd
cd server
npm start
```

서버가 http://localhost:4000 에서 실행됩니다.

### 3. 프론트엔드 실행

```cmd
cd app
npm run dev
```

프론트엔드가 http://localhost:3000 에서 실행됩니다.

## 주요 기능

- 🗺️ **Leaflet 기반 지도 인터페이스**: 대화형 지도에서 날씨 정보 표시
- 🌤️ **기상청 API 연동**: 초단기실황/초단기예보/단기예보 데이터 실시간 조회
- 👤 **사용자 인증 시스템**: 이메일/비밀번호 기반 회원가입 및 로그인 (JWT)
- ⭐ **즐겨찾기 기능**: 자주 조회하는 지역 저장 및 관리
- 🔍 **위치 검색**: 지역명으로 위치 검색 및 이동
- 📍 **격자 좌표 변환**: 위경도를 기상청 격자 좌표로 자동 변환

## 기술 스택

- **백엔드**: 
  - Node.js + Express.js
  - SQLite (better-sqlite3)
  - JWT 인증 (jsonwebtoken + bcryptjs)
  - 기상청 API 프록시
  
- **프론트엔드**: 
  - React + Vite
  - Leaflet (지도)
  - 순수 CSS (최소 스타일링)

- **데이터베이스**: SQLite (로컬 파일 기반)

## 외부 API 상세 정보

### 기상청 공공데이터 API 연동
포세이돈 시스템은 **2개의 기상청 공공데이터 API**를 활용합니다.

---

## 🌦️ **API #1: 단기예보 조회서비스 (VilageFcstInfoService_2.0)**

#### 📋 **기본 정보**
- **API 서비스명**: 단기예보 조회서비스 (VillageFcstInfoService_2.0)
- **제공기관**: 기상청 (공공데이터포털)
- **서비스 URL**: `http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0`
- **인증방식**: ServiceKey 기반 인증
- **응답형식**: XML/JSON 선택 가능
- **갱신주기**: 수시 (일 8회)
- **TPS 한계**: 초당 최대 30 트랜잭션

#### 🔄 **세부 기능 (3개)**

##### **1-1. 초단기실황 조회 (`getUltraSrtNcst`)**
- **목적**: 현재 실제 관측된 기상 상황 조회
- **갱신**: 매시각 10분 이후 호출 가능 (정시 발표)
- **주요 파라미터**: `base_date`, `base_time`, `nx`, `ny` (격자 좌표)
- **응답 데이터**: T1H(기온), RN1(강수량), UUU/VVV(바람), REH(습도), PTY(강수형태), WSD(풍속) 등
- **프로젝트 활용**: 지도상 현재 기상 상황 표시, 침수 위험도 계산

##### **1-2. 초단기예보 조회 (`getUltraSrtFcst`)**
- **목적**: 6시간 이내 단기 예보 정보 제공
- **갱신**: 매시각 30분 이후 호출 가능
- **응답 데이터**: T1H(기온), RN1(강수량), SKY(하늘상태), PTY(강수형태), LGT(낙뢰) 등
- **프로젝트 활용**: 단기 강수 예측, 타임슬라이더 기능

##### **1-3. 단기예보 조회 (`getVilageFcst`)**
- **목적**: 3일간 상세 예보 정보 제공
- **갱신**: 1일 8회 (02, 05, 08, 11, 14, 17, 20, 23시)
- **응답 데이터**: POP(강수확률), PCP(강수량), TMN/TMX(최저/최고기온), REH(습도), SNO(적설) 등
- **프로젝트 활용**: 중장기 강수 예측, 침수 주의보 발령

---

## 🌡️ **API #2: 지상(종관, ASOS) 시간자료 조회서비스 (AsosHourlyInfoService)**

#### 📋 **기본 정보**
- **API 서비스명**: 지상(종관, ASOS) 시간자료 조회서비스
- **제공기관**: 기상청 (공공데이터포털)
- **서비스 URL**: `http://apis.data.go.kr/1360000/AsosHourlyInfoService`
- **인증방식**: ServiceKey 기반 인증
- **응답형식**: XML/JSON 선택 가능
- **갱신주기**: 전일(D-1) 자료까지 제공, 조회시간 기준 11시 이후 조회 가능
- **데이터 특성**: 종관기상관측장비(ASOS)로 관측한 **정밀 시간 기상자료**

#### 🔄 **세부 기능**

##### **2-1. 기상관측시간자료목록조회 (`getWthrDataList`)**
- **목적**: 전국 종관기상관측소의 시간별 정밀 관측 데이터 조회
- **주요 파라미터**: 
  - `dataCd`: ASOS (자료분류코드)
  - `dateCd`: HR (시간단위)
  - `startDt`/`endDt`: 조회 기간 (YYYYMMDD)
  - `startHh`/`endHh`: 조회 시간 (HH)
  - `stnIds`: 종관기상관측 지점번호 (예: 108=서울)
- **응답 데이터**:
  - `ta`: 기온(°C), `rn`: 강수량(mm), `ws`: 풍속(m/s), `wd`: 풍향
  - `hm`: 습도(%), `pa`: 현지기압(hPa), `ps`: 해면기압(hPa)
  - `ss`: 일조(hr), `icsr`: 일사(MJ/m²), `dsnw`: 적설(cm)
  - `vs`: 시정(10m), `ts`: 지면온도(°C), 지중온도 등
- **품질관리**: 각 관측값별 품질검사 플래그 제공 (`taQcflg`, `rnQcflg` 등)
- **프로젝트 활용**: 
  - **정밀 관측소 데이터 보정**: 격자 예보와 실제 관측값 비교
  - **과거 데이터 분석**: 침수 패턴 분석을 위한 이력 데이터
  - **검증 데이터**: 예보 정확도 검증 및 보정

---

## 🗺️ **격자 좌표 변환 시스템**
- **기능**: 위경도(WGS84) ↔ 기상청 격자 좌표(X,Y) 상호 변환
- **투영법**: Lambert Conformal Conic (LCC) 투영
- **격자 크기**: 5km × 5km
- **좌표 범위**: X(1~149), Y(1~253)
- **변환 공식**: 기상청 제공 DFS(Distance From Seoul) 좌표계 사용
- **구현 위치**: `server/kma-grid.js`

---

## 🔧 **프로젝트 내 API 통합 과정**

### **데이터 흐름**
1. **사용자 위치 입력** → 위경도 좌표
2. **좌표 변환** → 기상청 격자 좌표 (kma-grid.js)
3. **API #1 호출** → 격자 기반 예보 데이터 (실황/예보)
4. **API #2 호출** → 인근 관측소 실제 관측 데이터 (보정용)
5. **데이터 융합** → 예보 + 관측 데이터 결합
6. **침수 위험도 계산** → 강수량(RN1) + 강수확률(POP) 기반 위험도 산출
7. **지도 시각화** → Leaflet 지도에 색상 코딩으로 표시

### **API별 역할 분담**
- **단기예보 API**: 실시간 예보, 메인 데이터 소스
- **ASOS 시간자료 API**: 검증 및 보정, 이력 분석

### 내부 API 엔드포인트

#### 인증 관련
- `POST /api/auth/register` - 회원가입 (이메일, 비밀번호)
- `POST /api/auth/login` - 로그인 (JWT 토큰 반환)

#### 날씨 정보 프록시
- `GET /api/weather/current` - 초단기실황 조회
  - 파라미터: `lat`, `lng` (위경도)
  - 기상청 API 호출 후 가공된 데이터 반환
- `GET /api/weather/forecast` - 예보 정보 조회  
  - 파라미터: `lat`, `lng`, `type` (ultra_short/short)
  - 기상청 API 호출 후 가공된 데이터 반환

#### 즐겨찾기 관리
- `GET /api/favorites` - 사용자별 즐겨찾기 목록 조회
- `POST /api/favorites` - 새 즐겨찾기 추가
- `DELETE /api/favorites/:id` - 즐겨찾기 삭제

### API 인증 및 보안
- **기상청 API**: 서비스키 기반 인증 (`KMA_SERVICE_KEY`)
- **내부 API**: JWT 토큰 기반 인증
- **토큰 저장**: 프론트엔드 localStorage (개발용)
- **비밀번호 암호화**: bcryptjs 해시

## 시작하기

1. 기상청 API 서비스키가 이미 `.env` 파일에 설정되어 있습니다
2. 위의 실행 방법에 따라 의존성을 설치하고 백엔드와 프론트엔드를 각각 실행
3. 브라우저에서 http://localhost:3000 을 열어 확인

### 빠른 시작

**터미널 1 (백엔드):**
```cmd
cd server
npm install
npm start
```

**터미널 2 (프론트엔드):**
```cmd
cd app
npm install
npm run dev
```

## 개발 원칙

- **간단한 코드 원칙**: 복잡한 추상화 지양, 파일당 150줄 이내 목표
- **최소 의존성**: 필수 라이브러리만 사용
- **동기 처리**: better-sqlite3 사용으로 코드 단순화
- **Windows 환경 최적화**: cmd.exe 기반 명령어 제공