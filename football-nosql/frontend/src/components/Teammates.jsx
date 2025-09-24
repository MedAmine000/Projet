import React, { useState, useEffect } from 'react';
import api from '../api';

const Teammates = ({ playerId }) => {
  const [teammates, setTeammates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('matches'); // matches or name

  useEffect(() => {
    if (playerId) {
      loadTeammates();
    }
  }, [playerId]);

  const loadTeammates = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getPlayerTeammates(playerId);
      setTeammates(response.teammates || []);
    } catch (err) {
      setError('Failed to load teammates');
    } finally {
      setLoading(false);
    }
  };

  const sortedTeammates = [...teammates].sort((a, b) => {
    if (sortBy === 'matches') {
      return (b.matches_together || 0) - (a.matches_together || 0);
    } else {
      return (a.teammate_name || a.teammate_id || '').localeCompare(
        b.teammate_name || b.teammate_id || ''
      );
    }
  });

  const totalMatches = teammates.reduce((sum, teammate) => sum + (teammate.matches_together || 0), 0);
  const averageMatches = teammates.length > 0 ? (totalMatches / teammates.length).toFixed(1) : 0;
  const topTeammate = sortedTeammates[0];

  return (
    <div>
      {/* Summary Stats */}
      <div className="card">
        <h3>👥 Teammates Overview</h3>
        
        <div className="performance-stats">
          <div className="stat-box">
            <div className="stat-value">{teammates.length}</div>
            <div className="stat-label">Total Teammates</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{totalMatches}</div>
            <div className="stat-label">Total Matches</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{averageMatches}</div>
            <div className="stat-label">Avg per Teammate</div>
          </div>
          {topTeammate && (
            <div className="stat-box">
              <div className="stat-value">{topTeammate.matches_together}</div>
              <div className="stat-label">Most with {topTeammate.teammate_name || topTeammate.teammate_id}</div>
            </div>
          )}
        </div>
      </div>

      {/* Teammates List */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>🤝 Teammates List ({teammates.length})</h3>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '5px', border: '2px solid #e0e6ed' }}
          >
            <option value="matches">Sort by Matches Together</option>
            <option value="name">Sort by Name</option>
          </select>
        </div>

        {loading ? (
          <div className="loading">Loading teammates</div>
        ) : error ? (
          <div className="error">{error}</div>
        ) : sortedTeammates.length > 0 ? (
          <div className="table" style={{ display: 'block', maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Teammate</th>
                  <th>Teammate ID</th>
                  <th>Matches Together</th>
                  <th>Partnership %</th>
                </tr>
              </thead>
              <tbody>
                {sortedTeammates.map((teammate, index) => {
                  const partnershipPercentage = totalMatches > 0 
                    ? ((teammate.matches_together || 0) / totalMatches * 100).toFixed(1)
                    : 0;
                  
                  return (
                    <tr key={teammate.teammate_id}>
                      <td style={{ fontWeight: 'bold', color: '#667eea' }}>
                        #{index + 1}
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>
                          {teammate.teammate_name || 'Unknown Name'}
                        </div>
                      </td>
                      <td style={{ color: '#666', fontSize: '0.9rem' }}>
                        {teammate.teammate_id}
                      </td>
                      <td>
                        <span style={{ 
                          fontWeight: 'bold', 
                          color: (teammate.matches_together || 0) > 20 ? '#28a745' : '#667eea' 
                        }}>
                          {teammate.matches_together || 0}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{
                            width: '60px',
                            height: '8px',
                            background: '#e0e6ed',
                            borderRadius: '4px',
                            overflow: 'hidden'
                          }}>
                            <div style={{
                              width: `${Math.min(parseFloat(partnershipPercentage), 100)}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #667eea, #764ba2)',
                              transition: 'width 0.3s ease'
                            }} />
                          </div>
                          <span style={{ fontSize: '0.9rem', color: '#666' }}>
                            {partnershipPercentage}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No teammate data available.</p>
        )}

        {/* Top Partnerships Highlight */}
        {sortedTeammates.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <h4>🌟 Top Partnerships</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
              {sortedTeammates.slice(0, 3).map((teammate, index) => (
                <div key={teammate.teammate_id} style={{
                  padding: '1rem',
                  background: index === 0 ? '#fff8e1' : '#f8f9ff',
                  border: `2px solid ${index === 0 ? '#ffc107' : '#e0e6ed'}`,
                  borderRadius: '8px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <span style={{ 
                      fontSize: '1.2rem',
                      color: index === 0 ? '#ffc107' : '#667eea'
                    }}>
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </span>
                    <strong>{teammate.teammate_name || teammate.teammate_id}</strong>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#333' }}>
                    {teammate.matches_together} matches
                  </div>
                  <div style={{ fontSize: '0.9rem', color: '#666' }}>
                    {((teammate.matches_together || 0) / totalMatches * 100).toFixed(1)}% of all partnerships
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f8ff', borderRadius: '5px', fontSize: '0.9rem' }}>
          <strong>🗂️ NoSQL Patterns Demonstrated:</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li><strong>Relationship Data:</strong> Player-to-player relationships stored efficiently</li>
            <li><strong>Denormalization:</strong> Teammate names duplicated for fast display without JOINs</li>
            <li><strong>Single Partition:</strong> All teammates for a player in one partition for fast retrieval</li>
            <li><strong>Query Optimization:</strong> No complex relationships - simple key-value lookups</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Teammates;