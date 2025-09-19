// KMA Grid conversion module
// 기상청 격자 좌표계 변환 (위경도 → nx,ny)
// Lambert Conformal Conic 투영법 사용

/**
 * 위경도를 기상청 격자좌표로 변환 (단순화된 DFS 변환)
 * @param {number} lat - 위도 (decimal degrees)
 * @param {number} lon - 경도 (decimal degrees)
 * @returns {object} {nx, ny} - 격자 좌표
 */
function toXY(lat, lon) {
  // 기상청 격자 투영 파라미터 (DFS 격자계)
  const RE = 6371.00877; // 지구 반지름 (km)
  const GRID = 5.0; // 격자 간격 (km)
  const SLAT1 = 30.0; // 투영 위도1 (degree)
  const SLAT2 = 60.0; // 투영 위도2 (degree)
  const OLON = 126.0; // 기준점 경도 (degree)
  const OLAT = 38.0; // 기준점 위도 (degree)
  const XO = 43; // 기준점 X좌표 (GRID)
  const YO = 136; // 기준점 Y좌표 (GRID)

  const DEGRAD = Math.PI / 180.0;
  const RADDEG = 180.0 / Math.PI;

  const re = RE / GRID;
  const slat1 = SLAT1 * DEGRAD;
  const slat2 = SLAT2 * DEGRAD;
  const olon = OLON * DEGRAD;
  const olat = OLAT * DEGRAD;

  let sn = Math.tan(Math.PI * 0.25 + slat2 * 0.5) / Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sn = Math.log(Math.cos(slat1) / Math.cos(slat2)) / Math.log(sn);
  let sf = Math.tan(Math.PI * 0.25 + slat1 * 0.5);
  sf = Math.pow(sf, sn) * Math.cos(slat1) / sn;
  let ro = Math.tan(Math.PI * 0.25 + olat * 0.5);
  ro = re * sf / Math.pow(ro, sn);

  // 변환 계산
  let ra = Math.tan(Math.PI * 0.25 + lat * DEGRAD * 0.5);
  ra = re * sf / Math.pow(ra, sn);
  let theta = lon * DEGRAD - olon;
  if (theta > Math.PI) theta -= 2.0 * Math.PI;
  if (theta < -Math.PI) theta += 2.0 * Math.PI;
  theta *= sn;

  const nx = Math.floor(ra * Math.sin(theta) + XO + 0.5);
  const ny = Math.floor(ro - ra * Math.cos(theta) + YO + 0.5);

  return { nx, ny };
}

module.exports = { toXY };