당신은 시니어 웹 풀스텍 개발자 입니다
당신은 짧은시간동안 MVP 기능을 위주로 프로토 타입 웹을 개발해야 합니다

당신은 아래 규칙과 구조에 따라야 합니다

아래는 업로드한 최종 기획서를 그대로 반영해, “바이트/코파일럿/자동 코딩 에이전트”에 그대로 붙여 넣어 실행시키기 좋은 단계별 명령문입니다.
각 단계는 “목표→제약→해야 할 일→산출물/구조→완료 기준(DoD)” 순서로 짧고 명확하게 작성했습니다. 


---

목표

기상청 초단기실황/초단기예보/단기예보를 React+Leaflet 지도 위에 표시하고, 로그인·즐겨찾기·검색·타임슬라이더를 포함한 3시간 MVP를 완성한다.


제약(간단한 코드 원칙)

프론트: React + Leaflet만. 상태관리/라우팅 라이브러리 불필요(필수 시 react-router만 최소).

백엔드: Node.js(Express) + SQLite. Docker 금지, ORM 금지, better-sqlite3 사용(동기, 코드 단순).

인증: 아주 단순한 이메일/비밀번호 가입/로그인(bcryptjs + JWT). 프론트는 로컬스토리지로 토큰 저장(보안 최적화는 범위 외).

KMA 프록시: 필요한 최소 파라미터만. 격자 변환은 간단 함수(DFS/LCC 변환) 또는 내장 테이블 일부 샘플로 처리.

스타일 최소(기본 CSS). 복잡한 추상화/유틸 금지. 파일 1개당 150줄 이내를 목표.


환경변수(.env 예시)

PORT=4000
JWT_SECRET=dev_secret_change_me
KMA_SERVICE_KEY=발급키URL인코딩값

폴더 구조(최종)

/
├── server/          # Express.js 백엔드 서버
│   ├── index.js     # 메인 서버 파일
│   ├── auth.js      # 인증 관련
│   ├── db.js        # SQLite 데이터베이스 설정
│   ├── favorites.js # 즐겨찾기 기능
│   ├── kma.js       # 기상청 API 연동
│   └── kma-grid.js  # 격자 좌표 변환
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
│   │   └── api.js   # API 통신
├── .env            # 환경변수 설정
└── README.md       # 이 파일

---

명령하지않은 어떠한 다른 작업을 수행하지 마십시오
필요한 코딩 정보는 각 기술의 공식 문서를 주로 참고사십시오