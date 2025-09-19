한국환경공단 에어코리아 OpenAPI 요약 가이드
1. 공통 정보
인증 방식: ServiceKey (URL Encode 필요)
데이터 형식: XML, JSON (&returnType=json)
호출 방식: REST (GET)
측정 항목 단위
SO2, CO, O3, NO2 → ppm
PM10, PM2.5 → ㎍/㎥
결과 등급 (Grade 값)
1: 좋음 / 2: 보통 / 3: 나쁨 / 4: 매우나쁨
2. 주요 API 정리
2.1 대기오염통계 서비스 (ArpltnStatsSvc)
URL: http://apis.data.go.kr/B552584/ArpltnStatsSvc
주요 기능
getCtprvnMesureLIst : 시도별 실시간 평균정보 조회
getCtprvnMesureSidoLIst : 시군구별 실시간 평균정보 조회
getMsrstnAcctoRDyrg : 측정소별 실시간 일평균 정보
getMsrstnAcctoRMmrg : 측정소별 실시간 월평균 정보
파라미터 예시
itemCode (SO2, CO, O3, NO2, PM10, PM25)
dataGubun=HOUR | DAILY
searchCondition=WEEK | MONTH
예시 호출
.../getCtprvnMesureLIst?itemCode=PM10&dataGubun=HOUR&pageNo=1&numOfRows=100&returnType=json&serviceKey=인증키
2.2 대기오염정보 조회 서비스 (ArpltnInforInqireSvc)
URL: http://apis.data.go.kr/B552584/ArpltnInforInqireSvc
주요 기능
getMsrstnAcctoRltmMesureDnsty : 측정소별 실시간 측정정보
getUnityAirEnvrnIdexSnstiveAboveMsrstnList : 나쁨 이상 측정소 목록
getCtprvnRltmMesureDnsty : 시도별 실시간 측정정보
getMinuDustFrcstDspth : 대기질 예보통보 조회
getMinuDustWeekFrcstDspth : 초미세먼지 주간예보 조회
주요 응답 값
so2Value, coValue, o3Value, no2Value, pm10Value, pm25Value
khaiValue (통합대기환경수치), khaiGrade (지수 등급)
각 항목별 Grade, Flag (점검/장애 여부)
2.3 고농도 초미세먼지(50초과) 예보 서비스 (MinuDustFrcstDspthSvc)
URL: http://apis.data.go.kr/B552584/MinuDustFrcstDspthSvc
주요 기능
getMinuDustFrcstDspth50Over : PM2.5 50㎍/㎥ 초과 여부 예보 조회
특징
제공 권역: 현재 서울/인천/경기 (향후 확대 예정)
지역50Over 필드: 50 초과 시 "O", 미만 시 null
예보는 매일 4회 발표 (05시, 11시, 17시, 23시)
2.4 통합대기환경지수(CAI) 조회 서비스 (RltmKhaiInfoSvc)
URL: http://apis.data.go.kr/B552584/RltmKhaiInfoSvc
주요 기능
getMsrstnKhaiRltmDnsty : 측정소별 실시간 CAI 조회
응답 값
khaiValue (수치), khaiGrade (등급), khaiItem (주 오염물질)
등급
1: 좋음 / 2: 보통 / 3: 나쁨 / 4: 매우나쁨
2.5 측정소 정보 조회 서비스 (MsrstnInfoInqireSvc)
URL: http://apis.data.go.kr/B552584/MsrstnInfoInqireSvc
주요 기능
getMsrstnList : 측정소 목록 조회 (주소/명칭 기반)
getNearbyMsrstnList : 좌표 기반 근접 측정소 조회
getTMStdrCrdnt : TM 기준좌표 조회
응답 값
stationCode, stationName, addr, year, mangName (측정망)
dmX, dmY (좌표, WGS84 기반)
item (측정 항목 목록)
3. 활용 예시
시도별 평균 PM10 시간평균 조회

GET http://apis.data.go.kr/B552584/ArpltnStatsSvc/getCtprvnMesureLIst
?itemCode=PM10&dataGubun=HOUR&returnType=json&serviceKey=인증키
종로구 측정소 실시간 데이터 조회

GET http://apis.data.go.kr/B552584/ArpltnInforInqireSvc/getMsrstnAcctoRltmMesureDnsty
?stationName=종로구&dataTerm=DAILY&returnType=json&serviceKey=인증키
PM2.5 50 초과 예보 확인

GET http://apis.data.go.kr/B552584/MinuDustFrcstDspthSvc/getMinuDustFrcstDspth50Over
?returnType=json&serviceKey=인증키
통합대기환경지수(CAI) 확인

GET http://apis.data.go.kr/B552584/RltmKhaiInfoSvc/getMsrstnKhaiRltmDnsty
?stationName=종로구&returnType=json&serviceKey=인증키
근접 측정소 조회 (위경도 기반)

GET http://apis.data.go.kr/B552584/MsrstnInfoInqireSvc/getNearbyMsrstnList
?tmX=127.005028&tmY=37.572025&returnType=json&serviceKey=인증키