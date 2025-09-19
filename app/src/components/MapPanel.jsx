import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';

// Leaflet 기본 아이콘 설정
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const MapPanel = forwardRef(({ onUpdateTime }, ref) => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]); // 여러 마커들을 관리
  
  const [position, setPosition] = useState([37.5665, 126.9780]); // 서울시청 기본값
  const [loading, setLoading] = useState(false);
  const [selectedMarkerData, setSelectedMarkerData] = useState(null);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);

  // 현재 위치 획득
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setPosition([latitude, longitude]);
        },
        (error) => {
          console.warn('현재 위치를 가져올 수 없습니다. 서울시청으로 설정합니다.', error);
          // 기본값 유지
        }
      );
    }
  }, []);

  // 지역 주변의 기상 데이터 로드
  const loadWeatherDataForArea = useCallback(async () => {
    console.log('여러 지점 기상 데이터 요청');
    setLoading(true);
    
    // 기존 마커들 제거
    markersRef.current.forEach(marker => {
      mapInstanceRef.current.removeLayer(marker);
    });
    markersRef.current = [];
    
    try {
      // 여러 지점의 기상 데이터 조회
      const response = await fetch(`http://localhost:4000/kma/weather-points`);
      const data = await response.json();
      
      console.log('API 응답:', data);
      
      if (data && data.points && data.points.length > 0) {
        console.log(`${data.points.length}개 지점의 기상 데이터 로드됨`);
        
        // 각 지점에 마커 생성
        data.points.forEach(pointData => {
          console.log(`${pointData.name} 마커 생성:`, pointData.lat, pointData.lon, '색상:', getMarkerColor(pointData));
          
          const marker = L.circle([pointData.lat, pointData.lon], {
            color: getMarkerColor(pointData),
            fillColor: getMarkerColor(pointData),
            fillOpacity: 0.3, // 채우기 투명도
            radius: 500, // 반경 5km (미터 단위)
            weight: 1 // 테두리 두께
          }).addTo(mapInstanceRef.current);

          // 마커에 데이터 저장
          marker.weatherData = pointData;
          
          // 마커에 도시명 툴팁 추가
          marker.bindTooltip(pointData.name, {
            permanent: false,
            direction: 'top',
            offset: [0, -10]
          });
          
          // 마커 클릭 시 기상정보 표시
          marker.on('click', () => {
            console.log('마커 클릭:', pointData);
            setSelectedMarkerData(pointData);
          });
          
          markersRef.current.push(marker);
        });
        
        console.log('마커 추가 완료. 총 마커 수:', markersRef.current.length);
        const now = new Date();
        setLastUpdateTime(now);
        if (onUpdateTime) {
          onUpdateTime(now);
        }
      } else {
        console.error('API 에러 또는 데이터 없음:', data);
      }
    } catch (error) {
      console.error('기상 데이터 로드 실패:', error);
    }
    
    setLoading(false);
  }, [onUpdateTime]);

  // 외부에서 호출할 수 있는 함수들을 노출
  useImperativeHandle(ref, () => ({
    refreshWeatherData: loadWeatherDataForArea,
    getLastUpdateTime: () => lastUpdateTime,
    moveToLocation: (lat, lng) => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setView([lat, lng], mapInstanceRef.current.getZoom());
        setPosition([lat, lng]);
      }
    },
    getCenter: () => {
      if (mapInstanceRef.current) {
        const center = mapInstanceRef.current.getCenter();
        return { lat: center.lat, lng: center.lng };
      }
      return { lat: position[0], lng: position[1] };
    }
  }), [loadWeatherDataForArea, lastUpdateTime, position]);

  // 마커 색상 결정 (강수량에 따라)
  const getMarkerColor = (data) => {
    if (data.rn1 > 10) return '#e74c3c'; // 많은 비: 빨간색
    if (data.rn1 > 1) return '#f39c12';  // 적은 비: 주황색
    if (data.pty > 0) return '#3498db';  // 강수형태 있음: 파란색
    return '#2ecc71'; // 맑음: 녹색
  };

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    const map = L.map(mapRef.current).setView(position, 13); // 줌 레벨을 9로 설정하여 마커가 잘 보이게
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // 지도 클릭 시 중심 이동만 (데이터 로드하지 않음)
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      map.setView([lat, lng], map.getZoom());
    });

    mapInstanceRef.current = map;
    
    // 앱 시작 시 기상 데이터 로드
    loadWeatherDataForArea();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [position, loadWeatherDataForArea]);

  // 현재 위치 변경 시 지도 중심 이동
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.setView(position, mapInstanceRef.current.getZoom());
  }, [position]);

  // 강수량 정보 표시
  const renderPrecipitation = () => {
    return (
      <div className={`weather-info ${loading ? 'loading' : ''}`}>
        <h4>기상정보</h4>
        {lastUpdateTime && (
          <div className="last-update">
            마지막 업데이트: {lastUpdateTime.toLocaleTimeString()}
          </div>
        )}
        {loading && <p>데이터를 가져오는 중...</p>}
        
        {!loading && selectedMarkerData && (
          <div className="current-weather">
            <h5>{selectedMarkerData.name} 기상정보</h5>
            <div className="data-source">
              <span className={`source-badge ${getSourceClass(selectedMarkerData.dataSource)}`}>
                {selectedMarkerData.dataSource || '격자예보'}
              </span>
              {selectedMarkerData.stnId && (
                <span className="station-id">관측소: {selectedMarkerData.stnId}</span>
              )}
            </div>
            <ul>
              <li>위치: {selectedMarkerData.lat.toFixed(4)}, {selectedMarkerData.lon.toFixed(4)}</li>
              {selectedMarkerData.rn1 !== undefined && (
                <li className={getRainClass(selectedMarkerData.rn1)}>
                  1시간 강수량: {selectedMarkerData.rn1}mm {getRainLevel(selectedMarkerData.rn1)}
                </li>
              )}
              {selectedMarkerData.pty !== undefined && <li>강수형태: {getPtyText(selectedMarkerData.pty)}</li>}
              {selectedMarkerData.t1h !== undefined && <li>기온: {selectedMarkerData.t1h}°C</li>}
              {selectedMarkerData.hm !== undefined && <li>습도: {selectedMarkerData.hm}%</li>}
              {selectedMarkerData.ws !== undefined && <li>풍속: {selectedMarkerData.ws}m/s</li>}
              <li>관측시간: {selectedMarkerData.baseDate.slice(0,4)}-{selectedMarkerData.baseDate.slice(4,6)}-{selectedMarkerData.baseDate.slice(6,8)} {selectedMarkerData.baseTime.slice(0,2)}:{selectedMarkerData.baseTime.slice(2,4)}</li>
              {selectedMarkerData.observedTime && (
                <li>실제관측: {selectedMarkerData.observedTime}</li>
              )}
            </ul>
            {selectedMarkerData.isTestData && (
              <div className="test-data-notice">
                ⚠️ 시뮬레이션 테스트 데이터입니다
              </div>
            )}
          </div>
        )}

        {!loading && !selectedMarkerData && (
          <p>지도의 컬러 마커를 클릭하여 해당 도시의 기상정보를 확인하세요.</p>
        )}
      </div>
    );
  };

  // 강수형태 텍스트 변환
  const getPtyText = (pty) => {
    const ptyMap = {
      '0': '없음',
      '1': '비',
      '2': '비/눈',
      '3': '눈',
      '5': '빗방울',
      '6': '빗방울눈날림',
      '7': '눈날림'
    };
    return ptyMap[pty] || '알 수 없음';
  };

  // 데이터 소스별 CSS 클래스
  const getSourceClass = (dataSource) => {
    if (dataSource?.includes('ASOS')) return 'source-asos';
    if (dataSource?.includes('격자')) return 'source-grid';
    if (dataSource?.includes('테스트')) return 'source-test';
    return 'source-default';
  };

  // 강수량 레벨 텍스트
  const getRainLevel = (rn1) => {
    if (rn1 >= 20) return '(매우 위험)';
    if (rn1 >= 10) return '(위험)';
    if (rn1 >= 5) return '(주의)';
    if (rn1 > 0) return '(약함)';
    return '';
  };

  // 강수량별 CSS 클래스
  const getRainClass = (rn1) => {
    if (rn1 >= 20) return 'rain-danger';
    if (rn1 >= 10) return 'rain-warning';
    if (rn1 >= 5) return 'rain-caution';
    if (rn1 > 0) return 'rain-light';
    return 'rain-none';
  };

  return (
    <div className="map-panel">
      <div className="map-container">
        <div ref={mapRef} className="map" style={{ height: '400px', width: '100%' }}></div>
        {renderPrecipitation()}
      </div>
    </div>
  );
});

MapPanel.displayName = 'MapPanel';

export default MapPanel;