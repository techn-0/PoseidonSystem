// API client module
const BASE_URL = 'http://localhost:4000';

// 토큰 관리
export const getToken = () => localStorage.getItem('auth_token');
export const setToken = (token) => localStorage.setItem('auth_token', token);
export const removeToken = () => localStorage.removeItem('auth_token');

// fetch 래퍼 (토큰 자동 부착)
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

// 인증 API
export const auth = {
  register: async (email, password) => {
    return apiRequest('/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },
  
  me: async () => {
    return apiRequest('/auth/me');
  },
};

// 즐겨찾기 API
export const favorites = {
  get: async () => {
    return apiRequest('/favorites');
  },
  
  add: async (name, lat, lon) => {
    return apiRequest('/favorites', {
      method: 'POST',
      body: JSON.stringify({ name, lat, lon }),
    });
  },
  
  remove: async (id) => {
    return apiRequest(`/favorites/${id}`, {
      method: 'DELETE',
    });
  },
};

// 기상 데이터 API
export const weather = {
  getUltraSrtNcst: async (lat, lon) => {
    return apiRequest(`/weather/ultra-srt-ncst?lat=${lat}&lon=${lon}`);
  },
  
  getUltraSrtFcst: async (lat, lon) => {
    return apiRequest(`/weather/ultra-srt-fcst?lat=${lat}&lon=${lon}`);
  },
  
  getVilageFcst: async (lat, lon) => {
    return apiRequest(`/weather/vilage-fcst?lat=${lat}&lon=${lon}`);
  },
};

// 검색 API (Nominatim)
export const search = {
  geocode: async (query) => {
    const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`);
    if (!response.ok) {
      throw new Error('Search failed');
    }
    return response.json();
  },
};

// 에어코리아 API
export const airkorea = {
  // 주요 도시 미세먼지 측정소 정보 조회
  getDustStations: async () => {
    return apiRequest('/airkorea/dust-stations');
  },
  
  // 특정 지역 측정소 목록 조회
  getStations: async (addr = '', numOfRows = 50, pageNo = 1) => {
    const params = new URLSearchParams();
    if (addr) params.append('addr', addr);
    params.append('numOfRows', numOfRows);
    params.append('pageNo', pageNo);
    
    return apiRequest(`/airkorea/stations?${params.toString()}`);
  },
  
  // 근접 측정소 조회
  getNearbyStations: async (lat, lon) => {
    return apiRequest(`/airkorea/nearby-stations?lat=${lat}&lon=${lon}`);
  },
  
  // TM 좌표 조회
  getTMCoordinates: async (umdName) => {
    return apiRequest(`/airkorea/tm-coordinates?umdName=${encodeURIComponent(umdName)}`);
  },
};