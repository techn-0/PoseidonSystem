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