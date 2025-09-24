import React, { useState, useEffect } from 'react';
import api from '../api';

const PlayerProfile = ({ playerId }) => {
  const [profile, setProfile] = useState(null);
  const [latestMarketValue, setLatestMarketValue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (playerId) {
      loadPlayerData();
    }
  }, [playerId]);

  const loadPlayerData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load profile and latest market value in parallel
      const [profileResponse, marketValueResponse] = await Promise.all([
        api.getPlayerProfile(playerId),
        api.getLatestMarketValue(playerId)
      ]);
      
      setProfile(profileResponse);
      setLatestMarketValue(marketValueResponse);
    } catch (err) {
      setError('Failed to load player data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading player profile</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!profile) {
    return <div>No profile data available</div>;
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString();
  };

  const formatMarketValue = (value) => {
    if (!value) return 'N/A';
    return `€${(value / 1000000).toFixed(1)}M`;
  };

  return (
    <div>
      <div className="card">
        <h3>👤 Player Information</h3>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
          {/* Basic Info */}
          <div>
            <h4>Basic Information</h4>
            <p><strong>Name:</strong> {profile.player_name || 'Unknown'}</p>
            <p><strong>Nationality:</strong> {profile.nationality || 'Unknown'}</p>
            <p><strong>Birth Date:</strong> {formatDate(profile.birth_date)}</p>
            <p><strong>Height:</strong> {profile.height_cm ? `${profile.height_cm} cm` : 'Unknown'}</p>
            <p><strong>Preferred Foot:</strong> {profile.preferred_foot || 'Unknown'}</p>
          </div>

          {/* Position & Team */}
          <div>
            <h4>Position & Team</h4>
            <p><strong>Main Position:</strong> {profile.main_position || 'Unknown'}</p>
            <p><strong>Current Team ID:</strong> {profile.current_team_id || 'Free Agent'}</p>
          </div>

          {/* Market Value */}
          <div>
            <h4>Current Market Value</h4>
            {latestMarketValue?.market_value ? (
              <>
                <div className="market-value-large">
                  {formatMarketValue(latestMarketValue.market_value_eur)}
                </div>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  As of: {formatDate(latestMarketValue.as_of_date)}
                </p>
                <p style={{ fontSize: '0.9rem', color: '#666' }}>
                  Source: {latestMarketValue.source}
                </p>
              </>
            ) : (
              <p>No market value data available</p>
            )}
          </div>
        </div>

        <div style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9ff', borderRadius: '5px', fontSize: '0.9rem' }}>
          <strong>🗂️ NoSQL Patterns Demonstrated:</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li><strong>Single Partition Lookup:</strong> Profile data retrieved by player_id partition key</li>
            <li><strong>Materialized View:</strong> Latest market value maintained separately for fast access</li>
            <li><strong>Denormalization:</strong> Player info duplicated across tables to avoid JOINs</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;