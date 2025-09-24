import React, { useState, useEffect, useRef } from 'react';
import api from '../api';

const TeamPicker = ({ onTeamSelect }) => {
  const [teamId, setTeamId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchMode, setSearchMode] = useState('id'); // 'id' ou 'name'
  const searchTimeout = useRef(null);
  const resultsRef = useRef(null);

  // Recherche d'équipes avec debounce
  const searchTeams = async (query) => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await api.get(`/teams/search?q=${encodeURIComponent(query)}&limit=8`);
      setSearchResults(response.teams);
      setShowResults(true);
    } catch (err) {
      console.error('Erreur de recherche:', err);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  // Effect pour la recherche avec debounce
  useEffect(() => {
    if (searchMode === 'name' && searchQuery) {
      // Clear previous timeout
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }

      // Set new timeout
      searchTimeout.current = setTimeout(() => {
        searchTeams(searchQuery);
      }, 300);

      return () => {
        if (searchTimeout.current) {
          clearTimeout(searchTimeout.current);
        }
      };
    } else {
      setSearchResults([]);
      setShowResults(false);
    }
  }, [searchQuery, searchMode]);

  // Fermer les résultats si on clique dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedTeamId = searchMode === 'id' ? teamId.trim() : teamId;
    if (!selectedTeamId) return;

    setLoading(true);
    setError(null);
    setShowResults(false);

    try {
      // Valider que l'équipe existe
      await api.getPlayersByTeam(selectedTeamId);
      onTeamSelect(selectedTeamId);
    } catch (err) {
      setError('Équipe non trouvée ou aucun joueur disponible');
    } finally {
      setLoading(false);
    }
  };

  const selectTeam = (team) => {
    setTeamId(team.team_id);
    setSearchQuery(team.team_name);
    setShowResults(false);
    setError(null);
  };

  const handleSearchInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Si l'utilisateur efface, réinitialiser le teamId
    if (!value) {
      setTeamId('');
    }
  };

  return (
    <div className="card">
      <h3>Sélectionner une équipe</h3>
      
      {/* Toggle entre recherche par ID et par nom */}
      <div className="form-group">
        <label>Mode de recherche :</label>
        <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
          <button
            type="button"
            className={`btn ${searchMode === 'id' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setSearchMode('id');
              setSearchQuery('');
              setTeamId('');
              setSearchResults([]);
              setShowResults(false);
            }}
            style={{ fontSize: '0.9rem', padding: '5px 10px' }}
          >
            Par ID
          </button>
          <button
            type="button"
            className={`btn ${searchMode === 'name' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => {
              setSearchMode('name');
              setSearchQuery('');
              setTeamId('');
              setSearchResults([]);
              setShowResults(false);
            }}
            style={{ fontSize: '0.9rem', padding: '5px 10px' }}
          >
            Par nom
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {searchMode === 'id' ? (
          <div className="form-group">
            <label htmlFor="teamId">ID de l'équipe :</label>
            <input
              id="teamId"
              type="text"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              placeholder="ex: 123"
              disabled={loading}
            />
          </div>
        ) : (
          <div className="form-group" style={{ position: 'relative' }} ref={resultsRef}>
            <label htmlFor="teamSearch">Nom de l'équipe :</label>
            <input
              id="teamSearch"
              type="text"
              value={searchQuery}
              onChange={handleSearchInputChange}
              placeholder="Tapez le nom d'une équipe..."
              disabled={loading}
              autoComplete="off"
            />
            
            {searchLoading && (
              <div style={{ 
                position: 'absolute', 
                right: '10px', 
                top: '32px', 
                fontSize: '0.8rem',
                color: '#666'
              }}>
                Recherche...
              </div>
            )}

            {/* Résultats de recherche */}
            {showResults && searchResults.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                zIndex: 1000,
                maxHeight: '200px',
                overflowY: 'auto'
              }}>
                {searchResults.map((team) => (
                  <div
                    key={team.team_id}
                    onClick={() => selectTeam(team)}
                    style={{
                      padding: '10px',
                      borderBottom: '1px solid #eee',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f5f5f5'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                  >
                    <div style={{ fontWeight: 'bold' }}>{team.team_name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                      {team.city && `${team.city}, `}{team.country} • ID: {team.team_id}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {showResults && searchResults.length === 0 && searchQuery.length >= 2 && !searchLoading && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: '0',
                right: '0',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '4px',
                padding: '10px',
                fontSize: '0.9rem',
                color: '#666'
              }}>
                Aucune équipe trouvée pour "{searchQuery}"
              </div>
            )}
          </div>
        )}
        
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading || (searchMode === 'id' ? !teamId.trim() : !teamId)}
        >
          {loading ? 'Chargement...' : 'Charger les joueurs'}
        </button>
      </form>

      {error && (
        <div className="error" style={{ marginTop: '1rem' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '1.5rem', fontSize: '0.9rem', color: '#666' }}>
        <p><strong>Astuce :</strong> Ceci démontre la recherche par clé de partition dans Cassandra.</p>
        {searchMode === 'name' && (
          <p><strong>Note :</strong> La recherche par nom utilise ALLOW FILTERING (éviter en production sur de gros datasets).</p>
        )}
      </div>
    </div>
  );
};

export default TeamPicker;