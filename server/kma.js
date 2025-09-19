// KMA API module
const express = require('express');
const axios = require('axios');
const { toXY } = require('./kma-grid');

const router = express.Router();

/**
 * 현재 시각을 기준으로 base_date, base_time 계산
 * @param {string} type - 'ncst' | 'fcst' | 'vilage'
 * @returns {object} {baseDate, baseTime}
 */
/**
 * 지상 관측 API용 시간 계산 (전일 데이터 사용)
 * @returns {object} {startDt, startHh, endDt, endHh}
 */
function getAsosDateTime() {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // KST
  
  // 전일 데이터 사용 (지상 관측은 D-1까지 제공)
  const prevDay = new Date(kstTime.getTime() - 24 * 60 * 60 * 1000);
  const dateStr = prevDay.toISOString().slice(0, 10).replace(/-/g, '');
  
  // 전일의 오후 3시 데이터 (더 안정적인 시간대)
  return {
    startDt: dateStr,
    startHh: '15',
    endDt: dateStr, 
    endHh: '15'
  };
}

function getBaseDateTime(type) {
  const now = new Date();
  const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // KST
  
  // 임시로 어제 날짜의 안정적인 데이터 사용
  const prevDay = new Date(kstTime.getTime() - 24 * 60 * 60 * 1000);
  let baseDate = prevDay.toISOString().slice(0, 10).replace(/-/g, '');
  let baseTime;
  
  const hour = kstTime.getHours();
  const minute = kstTime.getMinutes();
  
  switch (type) {
    case 'ncst': // 초단기실황: 어제 14시 데이터 사용 (안정적인 데이터)
      baseTime = '1400';
      break;
      
    case 'fcst': // 초단기예보: 분 < 45면 직전시, 아니면 현재시
      if (minute < 45) {
        baseTime = String(hour > 0 ? hour - 1 : 23).padStart(2, '0') + '30';
        if (hour === 0) {
          const prevDay = new Date(kstTime.getTime() - 24 * 60 * 60 * 1000);
          baseDate = prevDay.toISOString().slice(0, 10).replace(/-/g, '');
        }
      } else {
        baseTime = String(hour).padStart(2, '0') + '30';
      }
      break;
      
    case 'vilage': // 단기예보: 02, 05, 08, 11, 14, 17, 20, 23시
      const fcstHours = [2, 5, 8, 11, 14, 17, 20, 23];
      let fcstHour = fcstHours.filter(h => h <= hour).pop() || 23;
      if (fcstHour === 23 && hour < 2) {
        const prevDay = new Date(kstTime.getTime() - 24 * 60 * 60 * 1000);
        baseDate = prevDay.toISOString().slice(0, 10).replace(/-/g, '');
      }
      baseTime = String(fcstHour).padStart(2, '0') + '00';
      break;
  }
  
  return { baseDate, baseTime };
}

/**
 * KMA API 호출 헬퍼
 */
async function callKmaApi(serviceType, params) {
  const serviceKey = process.env.KMA_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error('KMA_SERVICE_KEY not configured');
  }

  const baseUrl = 'http://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';
  const url = `${baseUrl}/${serviceType}`;
  
  const requestParams = {
    serviceKey,
    pageNo: 1,
    numOfRows: 1000,
    dataType: 'JSON',
    ...params
  };
  
  console.log('KMA API 요청:', url);
  console.log('요청 파라미터:', requestParams);
  
  try {
    const response = await axios.get(url, {
      params: requestParams,
      timeout: 10000
    });
    
    console.log('KMA API 응답 상태:', response.status);
    console.log('KMA API 응답 데이터:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('KMA API Error:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
    throw error;
  }
}

// 주요 도시 격자 좌표 + 지상 관측소 번호
const MAJOR_CITIES = [
  { name: '서울', lat: 37.5665, lon: 126.9780, nx: 60, ny: 127, stnId: '108' },
  { name: '부산', lat: 35.1796, lon: 129.0756, nx: 98, ny: 76, stnId: '159' },
  { name: '대구', lat: 35.8714, lon: 128.6014, nx: 89, ny: 90, stnId: '143' },
  { name: '인천', lat: 37.4563, lon: 126.7052, nx: 55, ny: 124, stnId: '112' },
  { name: '광주', lat: 35.1595, lon: 126.8526, nx: 58, ny: 74, stnId: '156' },
  { name: '대전', lat: 36.3504, lon: 127.3845, nx: 67, ny: 100, stnId: '133' },
  { name: '울산', lat: 35.5384, lon: 129.3114, nx: 102, ny: 84, stnId: '152' },
  { name: '세종', lat: 36.4800, lon: 127.2890, nx: 66, ny: 103, stnId: '129' },
  { name: '전주', lat: 35.8242, lon: 127.1480, nx: 63, ny: 89, stnId: '146' }
];

/**
 * 지상 관측 API 호출 (AsosHourlyInfoService)
 * @param {string} stnId - 관측소 번호
 * @param {string} startDt - 시작일 (YYYYMMDD)
 * @param {string} startHh - 시작시 (HH)
 * @param {string} endDt - 종료일 (YYYYMMDD) 
 * @param {string} endHh - 종료시 (HH)
 * @returns {Promise<object>} API 응답 데이터
 */
async function callAsosApi(stnId, startDt, startHh, endDt, endHh) {
  const serviceKey = process.env.KMA_SERVICE_KEY;
  if (!serviceKey) {
    throw new Error('KMA_SERVICE_KEY not configured');
  }

  const baseUrl = 'http://apis.data.go.kr/1360000/AsosHourlyInfoService';
  const url = `${baseUrl}/getWthrDataList`;
  
  const requestParams = {
    serviceKey,
    pageNo: 1,
    numOfRows: 999,
    dataType: 'JSON',
    dataCd: 'ASOS',      // 필수: 자료 분류 코드
    dateCd: 'HR',        // 필수: 날짜 분류 코드 (시간자료)
    stnIds: stnId,
    startDt,
    startHh,
    endDt,
    endHh
  };
  
  console.log('지상 관측 API 요청:', url);
  console.log('요청 파라미터:', requestParams);
  
  try {
    const response = await axios.get(url, {
      params: requestParams,
      timeout: 10000
    });
    
    console.log('지상 관측 API 응답 상태:', response.status);
    console.log('지상 관측 API 응답 데이터:', JSON.stringify(response.data, null, 2));
    
    return response.data;
  } catch (error) {
    console.error('지상 관측 API Error:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', error.response.data);
    }
    throw error;
  }
}

// 여러 지점의 기상 데이터 조회 (격자 예보 + 지상 관측 혼합)
router.get('/weather-points', async (req, res) => {
  try {
    console.log('=== Weather Points API 호출 시작 (두 API 혼합) ===');
    console.log('현재 시간:', new Date().toISOString());
    
    const { baseDate, baseTime } = getBaseDateTime('ncst');
    const { startDt, startHh, endDt, endHh } = getAsosDateTime();
    
    console.log('격자 예보 기준시간:', baseDate, baseTime);
    console.log('지상 관측 기준시간:', startDt, startHh);
    
    const weatherPoints = [];
    
    // 각 도시에 대해 두 API 모두 시도
    for (const city of MAJOR_CITIES) {
      try {
        console.log(`\n=== ${city.name} 데이터 수집 ===`);
        
        const result = {
          name: city.name,
          lat: city.lat,
          lon: city.lon,
          nx: city.nx,
          ny: city.ny,
          stnId: city.stnId,
          dataSource: '',
          baseDate,
          baseTime
        };
        
        // 1. 지상 관측 API 우선 시도 (더 정확한 실측 데이터)
        try {
          console.log(`${city.name} - 지상 관측 API 시도 (stnId: ${city.stnId})`);
          
          const asosData = await callAsosApi(city.stnId, startDt, startHh, endDt, endHh);
          
          if (asosData.response?.header?.resultCode === '00' && 
              asosData.response?.body?.items?.item?.length > 0) {
            
            const item = asosData.response.body.items.item[0]; // 최신 데이터
            console.log(`${city.name} - 지상 관측 데이터:`, item);
            
            result.rn1 = parseFloat(item.rn) || 0;  // 강수량
            result.pty = item.rn > 0 ? 1 : 0;       // 강수형태 (강수량 기반 추정)
            result.t1h = parseFloat(item.ta) || 0;  // 기온
            result.hm = parseFloat(item.hm) || 0;   // 습도
            result.ws = parseFloat(item.ws) || 0;   // 풍속
            result.dataSource = 'ASOS (지상관측)';
            result.observedTime = item.tm;
            
            weatherPoints.push(result);
            console.log(`${city.name} - 지상 관측 데이터 사용 완료`);
            continue;
          } else {
            console.log(`${city.name} - 지상 관측 데이터 없음, 격자 예보 시도`);
          }
        } catch (error) {
          console.log(`${city.name} - 지상 관측 API 실패: ${error.message}, 격자 예보 시도`);
        }
        
        // 2. 격자 예보 API로 폴백
        try {
          console.log(`${city.name} - 격자 예보 API 시도 (nx:${city.nx}, ny:${city.ny})`);
          
          const gridData = await callKmaApi('getUltraSrtNcst', {
            base_date: baseDate,
            base_time: baseTime,
            nx: city.nx,
            ny: city.ny
          });
          
          if (gridData.response?.header?.resultCode === '00' && 
              gridData.response?.body?.items?.item) {
            
            const items = gridData.response.body.items.item;
            console.log(`${city.name} - 격자 예보 데이터:`, items);
            
            items.forEach(item => {
              switch (item.category) {
                case 'RN1':
                  result.rn1 = parseFloat(item.obsrValue) || 0;
                  break;
                case 'PTY':
                  result.pty = parseInt(item.obsrValue) || 0;
                  break;
                case 'T1H':
                  result.t1h = parseFloat(item.obsrValue) || 0;
                  break;
              }
            });
            
            result.dataSource = '격자예보';
            weatherPoints.push(result);
            console.log(`${city.name} - 격자 예보 데이터 사용 완료`);
          } else {
            console.log(`${city.name} - 격자 예보 데이터도 없음`);
          }
        } catch (error) {
          console.log(`${city.name} - 격자 예보 API도 실패: ${error.message}`);
        }
        
      } catch (error) {
        console.log(`${city.name} - 전체 데이터 수집 실패:`, error.message);
      }
    }
    
    // 전주 테스트 데이터 추가 (항상 표시)
    const jeonjuTestData = [
      {
        name: '전주 한옥마을',
        lat: 35.8160,
        lon: 127.1530,
        nx: 63,
        ny: 89,
        baseDate,
        baseTime,
        rn1: 25.0, // 위험 수준 (25mm/h)
        pty: 1,    // 비
        t1h: 18.5,
        dataSource: '테스트데이터',
        isTestData: true
      },
      {
        name: '전주 그랜드 힐스턴 호텔',
        lat: 35.8200,
        lon: 127.1440,
        nx: 63,
        ny: 89,
        baseDate,
        baseTime,
        rn1: 0,    // 안전 수준
        pty: 0,    // 맑음
        t1h: 23.5,
        dataSource: '테스트데이터',
        isTestData: true
      },
      {
        name: '영화의 거리',
        lat: 35.8150,
        lon: 127.1350,
        nx: 63,
        ny: 89,
        baseDate,
        baseTime,
        rn1: 8.0,  // 중간 수준 (8mm/h)
        pty: 1,    // 비
        t1h: 20.2,
        dataSource: '테스트데이터',
        isTestData: true
      }
    ];
    
    // 테스트 데이터 추가
    weatherPoints.push(...jeonjuTestData);
    
    console.log('\n=== 최종 결과 ===');
    console.log('총 수집된 데이터 포인트:', weatherPoints.length);
    console.log('지상 관측 데이터:', weatherPoints.filter(p => p.dataSource === 'ASOS (지상관측)').length);
    console.log('격자 예보 데이터:', weatherPoints.filter(p => p.dataSource === '격자예보').length);
    console.log('테스트 데이터:', weatherPoints.filter(p => p.isTestData).length);
    
    res.json({ points: weatherPoints, count: weatherPoints.length });
    
  } catch (error) {
    console.error('Weather Points Error:', error);
    res.json({ error: true, reason: 'weather-points-error' });
  }
});

// 초단기실황 조회 - RN1(1시간 강수량), PTY(강수형태), T1H(기온)
router.get('/ultra-ncst', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.json({ error: true, reason: 'Missing lat or lon parameter' });
    }
    
    // 위경도를 격자좌표로 변환
    const { nx, ny } = toXY(parseFloat(lat), parseFloat(lon));
    const { baseDate, baseTime } = getBaseDateTime('ncst');
    
    // KMA API 호출
    const data = await callKmaApi('getUltraSrtNcst', {
      base_date: baseDate,
      base_time: baseTime,
      nx,
      ny
    });
    
    console.log('처리된 KMA 응답:', JSON.stringify(data, null, 2));
    
    // 기상청 API 응답 구조 확인
    if (!data.response) {
      console.log('응답에 response 필드가 없음');
      return res.json({ error: true, reason: 'Invalid KMA API response structure', rawResponse: data });
    }
    
    // 기상청 API 오류 확인
    if (data.response.header) {
      console.log('응답 헤더:', data.response.header);
      if (data.response.header.resultCode !== '00') {
        return res.json({ 
          error: true, 
          reason: 'KMA API Error', 
          code: data.response.header.resultCode,
          message: data.response.header.resultMsg 
        });
      }
    }
    
    if (!data.response.body) {
      console.log('응답에 body 필드가 없음');
      console.log('전체 응답 구조:', Object.keys(data.response));
      return res.json({ error: true, reason: 'No body in KMA API response', responseKeys: Object.keys(data.response) });
    }
    
    if (!data.response.body.items) {
      console.log('응답에 items 필드가 없음');
      return res.json({ error: true, reason: 'No items in KMA API response' });
    }
    
    if (!data.response.body.items.item) {
      console.log('응답에 item 필드가 없음');
      return res.json({ error: true, reason: 'No data from KMA API' });
    }
    
    // 필요한 데이터만 추출
    const items = data.response.body.items.item;
    console.log('추출된 아이템들:', items);
    
    const result = {
      baseDate,
      baseTime,
      nx,
      ny,
      lat: parseFloat(lat),
      lon: parseFloat(lon)
    };
    
    items.forEach(item => {
      switch (item.category) {
        case 'RN1':
          result.rn1 = parseFloat(item.obsrValue) || 0; // 1시간 강수량(mm)
          break;
        case 'PTY':
          result.pty = parseInt(item.obsrValue) || 0; // 강수형태 (0:없음, 1:비, 2:눈/비, 3:눈, 5:빗방울, 6:빗방울+눈, 7:눈날림)
          break;
        case 'T1H':
          result.t1h = parseFloat(item.obsrValue) || 0; // 기온(℃)
          break;
      }
    });
    
    res.json(result);
    
  } catch (error) {
    console.error('Ultra NCST Error:', error);
    res.json({ error: true, reason: 'kma' });
  }
});

// 초단기예보 조회 - 0~+6h 시계열 (RN1, PTY, T1H 등)
router.get('/ultra-fcst', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.json({ error: true, reason: 'Missing lat or lon parameter' });
    }
    
    // 위경도를 격자좌표로 변환
    const { nx, ny } = toXY(parseFloat(lat), parseFloat(lon));
    const { baseDate, baseTime } = getBaseDateTime('fcst');
    
    // KMA API 호출
    const data = await callKmaApi('getUltraSrtFcst', {
      base_date: baseDate,
      base_time: baseTime,
      nx,
      ny
    });
    
    if (!data.response?.body?.items?.item) {
      return res.json({ error: true, reason: 'No data from KMA API' });
    }
    
    // 시계열 데이터 구성
    const items = data.response.body.items.item;
    const timeSeriesMap = new Map();
    
    items.forEach(item => {
      const key = `${item.fcstDate}_${item.fcstTime}`;
      if (!timeSeriesMap.has(key)) {
        timeSeriesMap.set(key, {
          fcstDate: item.fcstDate,
          fcstTime: item.fcstTime,
          datetime: `${item.fcstDate.slice(0,4)}-${item.fcstDate.slice(4,6)}-${item.fcstDate.slice(6,8)} ${item.fcstTime.slice(0,2)}:${item.fcstTime.slice(2,4)}`
        });
      }
      
      const forecast = timeSeriesMap.get(key);
      switch (item.category) {
        case 'RN1':
          forecast.rn1 = parseFloat(item.fcstValue) || 0;
          break;
        case 'PTY':
          forecast.pty = parseInt(item.fcstValue) || 0;
          break;
        case 'T1H':
          forecast.t1h = parseFloat(item.fcstValue) || 0;
          break;
      }
    });
    
    const series = Array.from(timeSeriesMap.values()).sort((a, b) => 
      a.fcstDate.localeCompare(b.fcstDate) || a.fcstTime.localeCompare(b.fcstTime)
    );
    
    const result = {
      baseDate,
      baseTime,
      nx,
      ny,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      series
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('Ultra FCST Error:', error);
    res.json({ error: true, reason: 'kma' });
  }
});

// 단기예보 조회 - POP(강수확률), PCP(강수량) 최소값
router.get('/vilage-fcst', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.json({ error: true, reason: 'Missing lat or lon parameter' });
    }
    
    // 위경도를 격자좌표로 변환
    const { nx, ny } = toXY(parseFloat(lat), parseFloat(lon));
    const { baseDate, baseTime } = getBaseDateTime('vilage');
    
    // KMA API 호출
    const data = await callKmaApi('getVilageFcst', {
      base_date: baseDate,
      base_time: baseTime,
      nx,
      ny
    });
    
    if (!data.response?.body?.items?.item) {
      return res.json({ error: true, reason: 'No data from KMA API' });
    }
    
    // 필요한 데이터만 추출 (POP, PCP)
    const items = data.response.body.items.item;
    const forecasts = new Map();
    
    items.forEach(item => {
      const key = `${item.fcstDate}_${item.fcstTime}`;
      if (!forecasts.has(key)) {
        forecasts.set(key, {
          fcstDate: item.fcstDate,
          fcstTime: item.fcstTime,
          datetime: `${item.fcstDate.slice(0,4)}-${item.fcstDate.slice(4,6)}-${item.fcstDate.slice(6,8)} ${item.fcstTime.slice(0,2)}:${item.fcstTime.slice(2,4)}`
        });
      }
      
      const forecast = forecasts.get(key);
      switch (item.category) {
        case 'POP':
          forecast.pop = parseInt(item.fcstValue) || 0; // 강수확률(%)
          break;
        case 'PCP':
          forecast.pcp = item.fcstValue === '강수없음' ? 0 : parseFloat(item.fcstValue) || 0; // 강수량(mm)
          break;
      }
    });
    
    const series = Array.from(forecasts.values())
      .filter(f => f.pop !== undefined || f.pcp !== undefined)
      .sort((a, b) => a.fcstDate.localeCompare(b.fcstDate) || a.fcstTime.localeCompare(b.fcstTime))
      .slice(0, 24); // 24시간치만
    
    const result = {
      baseDate,
      baseTime,
      nx,
      ny,
      lat: parseFloat(lat),
      lon: parseFloat(lon),
      pop: Math.min(...series.map(s => s.pop || 100).filter(p => p >= 0)),
      pcp: Math.min(...series.map(s => s.pcp || 999).filter(p => p >= 0)),
      series
    };
    
    res.json(result);
    
  } catch (error) {
    console.error('Vilage FCST Error:', error);
    res.json({ error: true, reason: 'kma' });
  }
});

// ASOS API 직접 테스트용 엔드포인트
router.get('/asos', async (req, res) => {
  try {
    const { stnId } = req.query;
    
    if (!stnId) {
      return res.status(400).json({ error: 'stnId parameter required' });
    }
    
    console.log('=== ASOS API 직접 테스트 ===');
    console.log('요청된 stnId:', stnId);
    
    const { startDt, startHh, endDt, endHh } = getAsosDateTime();
    console.log('ASOS 시간 범위:', startDt, startHh, '-', endDt, endHh);
    
    const asosData = await callAsosApi(stnId, startDt, startHh, endDt, endHh);
    
    res.json({
      success: true,
      stnId,
      dateRange: { startDt, startHh, endDt, endHh },
      data: asosData
    });
    
  } catch (error) {
    console.error('ASOS API 직접 테스트 에러:', error);
    res.status(500).json({ 
      error: true, 
      message: error.message,
      stnId: req.query.stnId 
    });
  }
});

module.exports = router;