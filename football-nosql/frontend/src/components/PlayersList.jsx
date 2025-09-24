import React, { useState, useEffect } from 'react';
import api from '../api';

const PlayersList = ({ teamId, selectedPlayer, onPlayerSelect }) => {
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (teamId) {
      loadPlayers();
    }
  }, [teamId]);

  const loadPlayers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getPlayersByTeam(teamId);
      setPlayers(response.players || []);
    } catch (err) {
      setError('Failed to load players');
      setPlayers([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="card">
        <h3>👥 Team Players</h3>
        <div className="loading">Loading players</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <h3>👥 Team Players</h3>
        <div className="error">{error}</div>
      </div>
    );
  }

  if (players.length === 0) {
    return (
      <div className="card">
        <h3>👥 Team Players</h3>
        <p>No players found for this team.</p>
      </div>
    );
  }

  return (
    <div className="card">
      <h3>👥 Team Players ({players.length})</h3>
      <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
        {players.map((player) => (
          <div
            key={player.player_id}
            className={`player-card ${
              selectedPlayer?.player_id === player.player_id ? 'selected' : ''
            }`}
            onClick={() => onPlayerSelect(player)}
            style={{ marginBottom: '0.5rem', cursor: 'pointer' }}
          >
            <div className="player-name">
              {player.player_name || player.player_id}
            </div>
            <div className="player-info">
              {player.position && `${player.position} • `}
              {player.nationality}
            </div>
          </div>
        ))}
      </div>
      
      <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: '#666' }}>
        <strong>🗂️ NoSQL Pattern:</strong> Denormalized data - player info duplicated in players_by_team table for fast team roster queries.
      </div>
    </div>
  );
};

export default PlayersList;