// AirKorea API module
const express = require('express');
const axios = require('axios');

const router = express.Router();

// 에어코리아 API 기본 설정
const AIRKOREA_BASE_URL = 'http://apis.data.go.kr/B552584/MsrstnInfoInqireSvc';
const SERVICE_KEY = process.env.AIRKOREA_SERVICE_KEY;

/**
 * 에어코리아 API 호출 공통 함수 (목업 데이터 사용)
 * @param {string} endpoint - API 엔드포인트
 * @param {object} params - 요청 파라미터
 * @returns {Promise<object>} API 응답 데이터
 */
async function callAirKoreaApi(endpoint, params = {}) {
  try {
    console.log(`목업 API 호출: ${endpoint}`, params);
    
    // 목업 데이터 반환
    return {
      items: [
        {
          stationName: '종로구',
          addr: '서울 종로구 종로35길 19',
          tm: '0.0',
          dmX: '198138.550264',
          dmY: '452504.918479'
        },
        {
          stationName: '중구', 
          addr: '서울 중구 덕수궁길 15',
          tm: '0.0',
          dmX: '198500.123456',
          dmY: '452000.654321'
        }
      ],
      numOfRows: params.numOfRows || 10,
      pageNo: params.pageNo || 1,
      totalCount: 2
    };
  } catch (error) {
    console.error('목업 API 호출 오류:', error);
    throw error;
  }
}

/**
 * 측정소 목록 조회 (목업 데이터 사용)
 * @param {string} addr - 주소 (시도명)
 * @param {number} numOfRows - 결과 수
 * @param {number} pageNo - 페이지 번호
 */
async function getMsrstnList(addr = '', numOfRows = 100, pageNo = 1) {
  // 목업 데이터 반환
  return {
    items: [
      {
        stationName: '종로구',
        addr: '서울 종로구 종로35길 19',
        tm: '0.0',
        dmX: '198138.550264',
        dmY: '452504.918479'
      },
      {
        stationName: '중구',
        addr: '서울 중구 덕수궁길 15',
        tm: '0.0',
        dmX: '198500.123456',
        dmY: '452000.654321'
      }
    ],
    numOfRows: numOfRows,
    pageNo: pageNo,
    totalCount: 2
  };
}

/**
 * 근접 측정소 목록 조회
 * @param {number} tmX - TM X 좌표
 * @param {number} tmY - TM Y 좌표
 */
async function getNearbyMsrstnList(tmX, tmY) {
  return await callAirKoreaApi('/getNearbyMsrstnList', { tmX, tmY });
}

/**
 * TM 좌표 조회
 * @param {string} umdName - 읍면동명
 */
async function getTMStdrCrdnt(umdName) {
  return await callAirKoreaApi('/getTMStdrCrdnt', { umdName });
}

/**
 * WGS84 좌표를 TM 좌표로 변환 (간단한 근사 변환)
 * 실제 프로덕션에서는 정확한 좌표 변환 라이브러리 사용 권장
 */
function wgs84ToTm(lat, lon) {
  // 한국 중심부 기준 근사 변환 (정확하지 않음, 테스트용)
  const tmX = (lon - 126.0) * 200000 + 200000;
  const tmY = (lat - 37.0) * 200000 + 500000;
  return { tmX: Math.round(tmX), tmY: Math.round(tmY) };
}

// 주요 도시별 측정소 정보 (샘플 데이터)
const MAJOR_CITIES_STATIONS = [
  { name: '서울', lat: 37.5665, lon: 126.9780, stationName: '종로구' },
  { name: '부산', lat: 35.1796, lon: 129.0756, stationName: '부산' },
  { name: '대구', lat: 35.8714, lon: 128.6014, stationName: '대구' },
  { name: '인천', lat: 37.4563, lon: 126.7052, stationName: '인천' },
  { name: '광주', lat: 35.1595, lon: 126.8526, stationName: '광주' },
  { name: '대전', lat: 36.3504, lon: 127.3845, stationName: '대전' },
  { name: '울산', lat: 35.5384, lon: 129.3114, stationName: '울산' },
  { name: '세종', lat: 36.4800, lon: 127.2890, stationName: '세종' }
];

/**
 * 주요 도시의 측정소 정보 조회
 */
async function getMajorCitiesStations() {
  const stations = [];
  
  for (const city of MAJOR_CITIES_STATIONS) {
    try {
      // TM 좌표 변환
      const { tmX, tmY } = wgs84ToTm(city.lat, city.lon);
      
      // 근접 측정소 조회
      const nearbyData = await getNearbyMsrstnList(tmX, tmY);
      
      if (nearbyData.items && nearbyData.items.length > 0) {
        const station = nearbyData.items[0];
        stations.push({
          cityName: city.name,
          stationName: station.stationName,
          addr: station.addr,
          lat: city.lat,
          lon: city.lon,
          tmX,
          tmY,
          distance: station.tm
        });
      } else {
        // 데이터가 없는 경우 기본 정보만 추가
        stations.push({
          cityName: city.name,
          stationName: city.stationName,
          addr: `${city.name} 지역`,
          lat: city.lat,
          lon: city.lon,
          tmX,
          tmY,
          distance: 0,
          isDefault: true
        });
      }
    } catch (error) {
      console.error(`${city.name} 측정소 정보 조회 실패:`, error.message);
      // 에러 발생 시 기본 정보 추가
      stations.push({
        cityName: city.name,
        stationName: city.stationName,
        addr: `${city.name} 지역`,
        lat: city.lat,
        lon: city.lon,
        tmX: 0,
        tmY: 0,
        distance: 0,
        isDefault: true,
        error: error.message
      });
    }
  }
  
  return stations;
}

// 에어코리아 API 엔드포인트

// API 테스트 엔드포인트 (목업 데이터 사용)
router.get('/test', async (req, res) => {
  try {
    // 목업 데이터로 테스트
    const mockData = {
      items: [
        {
          stationName: '종로구',
          addr: '서울 종로구 종로35길 19',
          tm: '0.0',
          dmX: '198138.550264',
          dmY: '452504.918479'
        },
        {
          stationName: '중구',
          addr: '서울 중구 덕수궁길 15',
          tm: '0.0',
          dmX: '198500.123456',
          dmY: '452000.654321'
        }
      ],
      numOfRows: 2,
      pageNo: 1,
      totalCount: 2
    };
    
    res.json({
      success: true,
      message: 'API 테스트 성공 (목업 데이터)',
      data: mockData
    });
  } catch (error) {
    console.error('API 테스트 실패:', error);
    res.status(500).json({
      success: false,
      message: 'API 테스트 실패',
      error: error.message
    });
  }
});

// 미세먼지 측정소 목록 조회 (완전 목업 데이터)
router.get('/dust-stations', async (req, res) => {
  try {
    console.log('미세먼지 측정소 목록 조회 요청');
    
    // 완전한 목업 데이터
    const stations = [
      {
        cityName: '서울',
        stationName: '종로구',
        addr: '서울 종로구 종로35길 19',
        lat: 37.5665,
        lon: 126.978,
        tmX: 198138,
        tmY: 452504,
        distance: 0,
        isDefault: true
      },
      {
        cityName: '서울',
        stationName: '중구',
        addr: '서울 중구 덕수궁길 15',
        lat: 37.5636,
        lon: 126.9975,
        tmX: 198500,
        tmY: 452000,
        distance: 0,
        isDefault: false
      },
      {
        cityName: '부산',
        stationName: '부산진구',
        addr: '부산 부산진구 중앙대로 708',
        lat: 35.1595,
        lon: 129.0595,
        tmX: 244500,
        tmY: 412000,
        distance: 0,
        isDefault: false
      }
    ];
    
    console.log(`생성된 측정소 수: ${stations.length}`);
    
    res.json({
      success: true,
      stations: stations
    });
  } catch (error) {
    console.error('미세먼지 측정소 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 특정 지역의 측정소 목록 조회
router.get('/stations', async (req, res) => {
  try {
    const { addr, numOfRows = 50, pageNo = 1 } = req.query;
    console.log(`측정소 목록 조회: addr=${addr}, numOfRows=${numOfRows}, pageNo=${pageNo}`);
    
    const data = await getMsrstnList(addr, parseInt(numOfRows), parseInt(pageNo));
    
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('측정소 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 근접 측정소 조회
router.get('/nearby-stations', async (req, res) => {
  try {
    const { lat, lon, tmX, tmY } = req.query;
    
    let finalTmX, finalTmY;
    
    if (tmX && tmY) {
      finalTmX = parseFloat(tmX);
      finalTmY = parseFloat(tmY);
    } else if (lat && lon) {
      const tmCoords = wgs84ToTm(parseFloat(lat), parseFloat(lon));
      finalTmX = tmCoords.tmX;
      finalTmY = tmCoords.tmY;
    } else {
      return res.status(400).json({
        success: false,
        error: 'lat,lon 또는 tmX,tmY 파라미터가 필요합니다'
      });
    }
    
    console.log(`근접 측정소 조회: tmX=${finalTmX}, tmY=${finalTmY}`);
    
    const data = await getNearbyMsrstnList(finalTmX, finalTmY);
    
    res.json({
      success: true,
      data: data,
      coordinates: { tmX: finalTmX, tmY: finalTmY },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('근접 측정소 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// TM 좌표 조회
router.get('/tm-coordinates', async (req, res) => {
  try {
    const { umdName } = req.query;
    
    if (!umdName) {
      return res.status(400).json({
        success: false,
        error: 'umdName 파라미터가 필요합니다'
      });
    }
    
    console.log(`TM 좌표 조회: umdName=${umdName}`);
    
    const data = await getTMStdrCrdnt(umdName);
    
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('TM 좌표 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = {
  router,
  getMsrstnList,
  getNearbyMsrstnList,
  getTMStdrCrdnt,
  getMajorCitiesStations,
  wgs84ToTm
};