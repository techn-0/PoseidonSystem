# 에어코리아 측정소정보 API 가이드

## API 기본 정보

### 서비스 개요
- **API명**: MsrstnInfoInqireSvc (측정소정보 조회 서비스)
- **설명**: 대기질 측정소 정보를 조회하기 위한 서비스로 TM 좌표 기반의 가까운 측정소 및 측정소 목록과 측정소의 정보를 조회할 수 있다
- **Base URL**: `http://apis.data.go.kr/B552584/MsrstnInfoInqireSvc`
- **인증방식**: ServiceKey 필요
- **응답형식**: XML, JSON 지원
- **전송방식**: REST (GET)

### 측정 단위
| 항목 | SO₂ | CO | O₃ | NO₂ | PM10 | PM2.5 |
|------|-----|----|----|-----|------|-------|
| 단위 | ppm | ppm | ppm | ppm | ㎍/㎥ | ㎍/㎥ |

## API 엔드포인트

### 1. 측정소 목록 조회 (getMsrstnList)

**URL**: `/getMsrstnList`

**파라미터**:
- `serviceKey` (필수): 공공데이터포털에서 받은 인증키
- `returnType` (선택): 응답 타입 (xml/json, 기본값: xml)
- `numOfRows` (선택): 한 페이지 결과 수 (기본값: 10)
- `pageNo` (선택): 페이지 번호 (기본값: 1)
- `addr` (선택): 주소 (시도 이름)

**응답 예시**:
```xml
<response>
  <header>
    <resultCode>00</resultCode>
    <resultMsg>NORMAL_SERVICE</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <stationName>종로구</stationName>
        <addr>서울 종로구 종로35길 19</addr>
        <tm>37.572016</tm>
        <dmX>198138.550264</dmX>
        <dmY>452504.918479</dmY>
      </item>
    </items>
    <numOfRows>10</numOfRows>
    <pageNo>1</pageNo>
    <totalCount>100</totalCount>
  </body>
</response>
```

### 2. 근접측정소 목록 조회 (getNearbyMsrstnList)

**URL**: `/getNearbyMsrstnList`

**파라미터**:
- `serviceKey` (필수): 공공데이터포털에서 받은 인증키
- `returnType` (선택): 응답 타입 (xml/json, 기본값: xml)
- `tmX` (필수): TM X 좌표
- `tmY` (필수): TM Y 좌표

**응답 예시**:
```xml
<response>
  <header>
    <resultCode>00</resultCode>
    <resultMsg>NORMAL_SERVICE</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <stationName>종로구</stationName>
        <addr>서울 종로구 종로35길 19</addr>
        <tm>1.1</tm>
      </item>
    </items>
  </body>
</response>
```

### 3. TM 기준좌표 조회 (getTMStdrCrdnt)

**URL**: `/getTMStdrCrdnt`

**파라미터**:
- `serviceKey` (필수): 공공데이터포털에서 받은 인증키
- `returnType` (선택): 응답 타입 (xml/json, 기본값: xml)
- `numOfRows` (선택): 한 페이지 결과 수 (기본값: 10)
- `pageNo` (선택): 페이지 번호 (기본값: 1)
- `umdName` (필수): 읍면동 이름

**응답 예시**:
```xml
<response>
  <header>
    <resultCode>00</resultCode>
    <resultMsg>NORMAL_SERVICE</resultMsg>
  </header>
  <body>
    <items>
      <item>
        <sggName>종로구</sggName>
        <umdName>청운동</umdName>
        <tmX>198138.550264</tmX>
        <tmY>452504.918479</tmY>
        <sidoName>서울</sidoName>
      </item>
    </items>
    <numOfRows>10</numOfRows>
    <pageNo>1</pageNo>
    <totalCount>100</totalCount>
  </body>
</response>
```

## 에러 코드

| 에러코드 | 메시지 | 설명 |
|----------|--------|------|
| 00 | NORMAL_SERVICE | 정상 |
| 01 | APPLICATION_ERROR | 어플리케이션 에러 |
| 02 | DB_ERROR | 데이터베이스 에러 |
| 03 | NODATA_ERROR | 데이터없음 에러 |
| 04 | HTTP_ERROR | HTTP 에러 |
| 05 | SERVICETIME_OUT | 서비스 연결실패 에러 |
| 10 | INVALID_REQUEST_PARAMETER_ERROR | 잘못된 요청 파라메터 에러 |
| 11 | NO_MANDATORY_REQUEST_PARAMETERS_ERROR | 필수요청 파라메터가 없음 |
| 12 | NO_OPENAPI_SERVICE_ERROR | 해당 오픈API서비스가 없거나 폐기됨 |
| 20 | SERVICE_ACCESS_DENIED_ERROR | 서비스 접근거부 |
| 21 | TEMPORARILY_DISABLE_THE_SERVICEKEY_ERROR | 일시적으로 사용할 수 없는 서비스 키 |
| 22 | LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR | 서비스 요청제한횟수 초과에러 |
| 30 | SERVICE_KEY_IS_NOT_REGISTERED_ERROR | 등록되지 않은 서비스키 |
| 31 | DEADLINE_HAS_EXPIRED_ERROR | 기한만료된 서비스키 |
| 32 | UNREGISTERED_IP_ERROR | 등록되지 않은 IP |
| 33 | UNSIGNED_CALL_ERROR | 서명되지 않은 호출 |

## 사용 예시 (JavaScript)

```javascript
const API_KEY = 'YOUR_SERVICE_KEY';
const BASE_URL = 'http://apis.data.go.kr/B552584/MsrstnInfoInqireSvc';

// 측정소 목록 조회
async function getMsrstnList(addr = '') {
  const url = `${BASE_URL}/getMsrstnList?serviceKey=${API_KEY}&returnType=json&numOfRows=100&pageNo=1&addr=${encodeURIComponent(addr)}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching station list:', error);
    throw error;
  }
}

// 근접 측정소 조회
async function getNearbyMsrstnList(tmX, tmY) {
  const url = `${BASE_URL}/getNearbyMsrstnList?serviceKey=${API_KEY}&returnType=json&tmX=${tmX}&tmY=${tmY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching nearby stations:', error);
    throw error;
  }
}

// TM 좌표 조회
async function getTMStdrCrdnt(umdName) {
  const url = `${BASE_URL}/getTMStdrCrdnt?serviceKey=${API_KEY}&returnType=json&umdName=${encodeURIComponent(umdName)}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching TM coordinates:', error);
    throw error;
  }
}
```

## 주요 응답 필드

### 측정소 정보
- `stationName`: 측정소명
- `addr`: 측정소 주소
- `tm`: 측정소와의 거리(km)
- `dmX`: TM X 좌표
- `dmY`: TM Y 좌표

### TM 좌표 정보
- `sidoName`: 시도명
- `sggName`: 시군구명
- `umdName`: 읍면동명
- `tmX`: TM X 좌표
- `tmY`: TM Y 좌표

## 데이터 갱신 주기
- 측정소 추가 시 갱신

## 참고사항
- 서비스키는 공공데이터포털(data.go.kr)에서 발급받아야 함
- TM 좌표계는 한국 측지계 기준
- 응답 데이터는 XML 또는 JSON 형식으로 제공
- API 호출 시 인코딩은 UTF-8 사용 권장