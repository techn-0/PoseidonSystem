import { useState, useEffect, useCallback } from 'react';
import { search, favorites } from '../api';

function Sidebar({ user, mapRef, lastUpdateTime, onLocationChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [favoritesList, setFavoritesList] = useState([]);
  const [isLoadingFavorites, setIsLoadingFavorites] = useState(false);

  // 즐겨찾기 목록 로드
  const loadFavorites = useCallback(async () => {
    if (!user) return;
    
    setIsLoadingFavorites(true);
    try {
      const data = await favorites.get();
      setFavoritesList(data);
    } catch (error) {
      console.error('Failed to load favorites:', error);
      alert('즐겨찾기를 불러오는데 실패했습니다.');
    } finally {
      setIsLoadingFavorites(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadFavorites();
    }
  }, [user, loadFavorites]);

  const handleRefresh = () => {
    if (mapRef?.current?.refreshWeatherData) {
      mapRef.current.refreshWeatherData();
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const results = await search.geocode(searchQuery);
      if (results && results.length > 0) {
        const firstResult = results[0];
        const lat = parseFloat(firstResult.lat);
        const lon = parseFloat(firstResult.lon);
        
        // 지도 이동
        if (onLocationChange) {
          onLocationChange(lat, lon);
        }
        
        setSearchQuery(''); // 검색 후 입력창 클리어
      } else {
        alert('검색 결과가 없습니다.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddFavorite = async () => {
    if (!user) {
      alert('로그인이 필요합니다.');
      return;
    }

    // 현재 지도 중심 좌표 가져오기
    const center = mapRef?.current?.getCenter();
    if (!center) {
      alert('현재 위치를 가져올 수 없습니다.');
      return;
    }

    const name = prompt('즐겨찾기 이름을 입력하세요:');
    if (!name || !name.trim()) return;

    try {
      await favorites.add(name.trim(), center.lat, center.lng);
      await loadFavorites(); // 목록 새로고침
      alert('즐겨찾기에 추가되었습니다.');
    } catch (error) {
      console.error('Failed to add favorite:', error);
      alert('즐겨찾기 추가에 실패했습니다.');
    }
  };

  const handleFavoriteClick = (favorite) => {
    if (onLocationChange) {
      onLocationChange(favorite.lat, favorite.lon);
    }
  };

  const handleRemoveFavorite = async (favoriteId, e) => {
    e.stopPropagation(); // 클릭 이벤트 버블링 방지
    
    if (!confirm('이 즐겨찾기를 삭제하시겠습니까?')) {
      return;
    }

    try {
      await favorites.remove(favoriteId);
      await loadFavorites(); // 목록 새로고침
      alert('즐겨찾기가 삭제되었습니다.');
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      alert('즐겨찾기 삭제에 실패했습니다.');
    }
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <h3>기상 정보</h3>
        
        <div className="sidebar-section">
          <button 
            onClick={handleRefresh} 
            className="refresh-button"
            style={{
              width: '100%',
              padding: '10px',
              marginBottom: '15px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            🔄 날씨 정보 새로고침
          </button>
          {lastUpdateTime && (
            <div className="last-update" style={{ 
              fontSize: '12px', 
              color: '#666', 
              marginBottom: '15px',
              textAlign: 'center'
            }}>
              마지막 업데이트: {lastUpdateTime.toLocaleString()}
            </div>
          )}
        </div>

        {/* 검색 섹션 */}
        <div className="sidebar-section">
          <h4>위치 검색</h4>
          <div style={{ display: 'flex', gap: '5px', marginBottom: '10px' }}>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="장소명을 입력하세요"
              className="search-input"
              disabled={isSearching}
            />
            <button
              onClick={handleSearch}
              disabled={isSearching || !searchQuery.trim()}
              style={{
                padding: '8px 12px',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isSearching ? 'not-allowed' : 'pointer',
                opacity: isSearching || !searchQuery.trim() ? 0.6 : 1
              }}
            >
              {isSearching ? '검색중...' : '검색'}
            </button>
          </div>
        </div>

        {user ? (
          <div className="sidebar-section">
            <h4>즐겨찾기</h4>
            <button
              onClick={handleAddFavorite}
              style={{
                width: '100%',
                padding: '8px',
                marginBottom: '10px',
                backgroundColor: '#ffc107',
                color: '#000',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ⭐ 현재 위치 즐겨찾기 추가
            </button>
            
            {isLoadingFavorites ? (
              <p style={{ textAlign: 'center', color: '#666' }}>로딩중...</p>
            ) : favoritesList.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#666' }}>
                즐겨찾기가 없습니다.
              </p>
            ) : (
              <div className="favorites-list">
                {favoritesList.map((favorite) => (
                  <div
                    key={favorite.id}
                    className="favorite-item"
                    onClick={() => handleFavoriteClick(favorite)}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      marginBottom: '5px',
                      backgroundColor: '#f8f9fa',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      border: '1px solid #dee2e6'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{favorite.name}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {favorite.lat.toFixed(4)}, {favorite.lon.toFixed(4)}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleRemoveFavorite(favorite.id, e)}
                      style={{
                        background: 'none',
                        border: 'none',
                        fontSize: '16px',
                        cursor: 'pointer',
                        color: '#dc3545',
                        padding: '5px'
                      }}
                      title="삭제"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p>로그인하면 더 많은 기능을 이용할 수 있습니다.</p>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;