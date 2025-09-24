import React, { useState, useEffect } from 'react';
import api from '../api';

const PlayerPerformances = ({ playerId }) => {
  const [clubPerformances, setClubPerformances] = useState([]);
  const [nationalPerformances, setNationalPerformances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState('');
  const [activeTab, setActiveTab] = useState('club');

  useEffect(() => {
    if (playerId) {
      loadPerformances();
    }
  }, [playerId, selectedSeason]);

  const loadPerformances = async () => {
    setLoading(true);
    setError(null);

    try {
      const [clubResponse, nationalResponse] = await Promise.all([
        api.getClubPerformances(playerId, selectedSeason),
        api.getNationalPerformances(playerId, selectedSeason)
      ]);
      
      setClubPerformances(clubResponse.club_performances || []);
      setNationalPerformances(nationalResponse.national_performances || []);
    } catch (err) {
      setError('Failed to load performances');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalStats = (performances) => {
    return performances.reduce((totals, perf) => {
      totals.matches += perf.matches || 0;
      totals.goals += perf.goals || 0;
      totals.assists += perf.assists || 0;
      totals.minutes += perf.minutes || 0;
      return totals;
    }, { matches: 0, goals: 0, assists: 0, minutes: 0 });
  };

  const formatMinutes = (minutes) => {
    if (!minutes) return '0';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const seasons = ['2023-2024', '2022-2023', '2021-2022', '2020-2021', '2019-2020'];

  const clubTotals = calculateTotalStats(clubPerformances);
  const nationalTotals = calculateTotalStats(nationalPerformances);

  return (
    <div>
      {/* Season Filter */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>⚽ Performance Data</h3>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '5px', border: '2px solid #e0e6ed' }}
          >
            <option value="">All Seasons</option>
            {seasons.map(season => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
        </div>

        {/* Performance Type Tabs */}
        <div className="tabs" style={{ marginBottom: '1rem' }}>
          <ul className="tabs-list">
            <li>
              <button
                className={`tab-button ${activeTab === 'club' ? 'active' : ''}`}
                onClick={() => setActiveTab('club')}
              >
                Club Performances
              </button>
            </li>
            <li>
              <button
                className={`tab-button ${activeTab === 'national' ? 'active' : ''}`}
                onClick={() => setActiveTab('national')}
              >
                National Team
              </button>
            </li>
          </ul>
        </div>

        {error && <div className="error">{error}</div>}
      </div>

      {/* Club Performances */}
      {activeTab === 'club' && (
        <div className="card">
          <h3>🏟️ Club Performances {selectedSeason && `(${selectedSeason})`}</h3>
          
          {/* Summary Stats */}
          <div className="performance-stats">
            <div className="stat-box">
              <div className="stat-value">{clubTotals.matches}</div>
              <div className="stat-label">Matches</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{clubTotals.goals}</div>
              <div className="stat-label">Goals</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{clubTotals.assists}</div>
              <div className="stat-label">Assists</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{formatMinutes(clubTotals.minutes)}</div>
              <div className="stat-label">Minutes</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">
                {clubTotals.matches > 0 ? (clubTotals.goals / clubTotals.matches).toFixed(2) : '0.00'}
              </div>
              <div className="stat-label">Goals/Game</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">
                {clubTotals.matches > 0 ? (clubTotals.assists / clubTotals.matches).toFixed(2) : '0.00'}
              </div>
              <div className="stat-label">Assists/Game</div>
            </div>
          </div>

          {/* Detailed Table */}
          {loading ? (
            <div className="loading">Loading club performances</div>
          ) : clubPerformances.length > 0 ? (
            <div className="table" style={{ display: 'block', maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>Team</th>
                    <th>Matches</th>
                    <th>Goals</th>
                    <th>Assists</th>
                    <th>Minutes</th>
                    <th>G+A</th>
                    <th>Mins/Game</th>
                  </tr>
                </thead>
                <tbody>
                  {clubPerformances.map((perf, index) => (
                    <tr key={`${perf.season}-${perf.team_id}-${index}`}>
                      <td>{perf.season}</td>
                      <td>{perf.team_id}</td>
                      <td>{perf.matches}</td>
                      <td>{perf.goals}</td>
                      <td>{perf.assists}</td>
                      <td>{formatMinutes(perf.minutes)}</td>
                      <td style={{ fontWeight: 'bold' }}>{(perf.goals || 0) + (perf.assists || 0)}</td>
                      <td>
                        {perf.matches > 0 ? Math.round((perf.minutes || 0) / perf.matches) : 0}min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No club performance data available.</p>
          )}
        </div>
      )}

      {/* National Performances */}
      {activeTab === 'national' && (
        <div className="card">
          <h3>🏆 National Team Performances {selectedSeason && `(${selectedSeason})`}</h3>
          
          {/* Summary Stats */}
          <div className="performance-stats">
            <div className="stat-box">
              <div className="stat-value">{nationalTotals.matches}</div>
              <div className="stat-label">Matches</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{nationalTotals.goals}</div>
              <div className="stat-label">Goals</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{nationalTotals.assists}</div>
              <div className="stat-label">Assists</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{formatMinutes(nationalTotals.minutes)}</div>
              <div className="stat-label">Minutes</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">
                {nationalTotals.matches > 0 ? (nationalTotals.goals / nationalTotals.matches).toFixed(2) : '0.00'}
              </div>
              <div className="stat-label">Goals/Game</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">
                {nationalTotals.matches > 0 ? (nationalTotals.assists / nationalTotals.matches).toFixed(2) : '0.00'}
              </div>
              <div className="stat-label">Assists/Game</div>
            </div>
          </div>

          {/* Detailed Table */}
          {loading ? (
            <div className="loading">Loading national performances</div>
          ) : nationalPerformances.length > 0 ? (
            <div className="table" style={{ display: 'block', maxHeight: '300px', overflowY: 'auto' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Season</th>
                    <th>National Team</th>
                    <th>Matches</th>
                    <th>Goals</th>
                    <th>Assists</th>
                    <th>Minutes</th>
                    <th>G+A</th>
                    <th>Mins/Game</th>
                  </tr>
                </thead>
                <tbody>
                  {nationalPerformances.map((perf, index) => (
                    <tr key={`${perf.season}-${perf.national_team}-${index}`}>
                      <td>{perf.season}</td>
                      <td>{perf.national_team}</td>
                      <td>{perf.matches}</td>
                      <td>{perf.goals}</td>
                      <td>{perf.assists}</td>
                      <td>{formatMinutes(perf.minutes)}</td>
                      <td style={{ fontWeight: 'bold' }}>{(perf.goals || 0) + (perf.assists || 0)}</td>
                      <td>
                        {perf.matches > 0 ? Math.round((perf.minutes || 0) / perf.matches) : 0}min
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p>No national team performance data available.</p>
          )}
        </div>
      )}

      {/* NoSQL Information */}
      <div style={{ marginTop: '1rem', padding: '1rem', background: '#e8f5e8', borderRadius: '5px', fontSize: '0.9rem' }}>
        <strong>🗂️ NoSQL Patterns Demonstrated:</strong>
        <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
          <li><strong>Separate Tables:</strong> Club and national performances in different tables for optimized queries</li>
          <li><strong>Composite Keys:</strong> player_id + season + team_id for club, player_id + season for national</li>
          <li><strong>Pre-Aggregated Data:</strong> Season summaries avoid real-time calculations</li>
          <li><strong>Query Flexibility:</strong> Filter by season or get all-time stats efficiently</li>
        </ul>
      </div>
    </div>
  );
};

export default PlayerPerformances;