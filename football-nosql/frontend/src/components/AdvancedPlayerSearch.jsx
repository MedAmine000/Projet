import { useState, useEffect } from 'react'

export default function AdvancedPlayerSearch({ onPlayerSelect }) {
  const [isOpen, setIsOpen] = useState(false)
  const [filters, setFilters] = useState({
    name: '',
    position: '',
    nationality: '', 
    team_id: '',
    min_age: '',
    max_age: '',
    min_market_value: '',
    max_market_value: ''
  })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState({
    positions: [],
    nationalities: [],
    teams: []
  })
  const [pagingState, setPagingState] = useState(null)
  const [hasMore, setHasMore] = useState(false)

  // Charger les suggestions au montage du composant
  useEffect(() => {
    loadSuggestions()
  }, [])

  const loadSuggestions = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/players/search/suggestions')
      const data = await response.json()
      setSuggestions(data)
    } catch (error) {
      console.error('Erreur lors du chargement des suggestions:', error)
    }
  }

  const handleSearch = async (loadMore = false) => {
    if (!loadMore) {
      setResults([])
      setPagingState(null)
    }
    
    setLoading(true)
    
    try {
      // Construire les filtres pour l'API
      const searchFilters = {}
      Object.keys(filters).forEach(key => {
        if (filters[key] && filters[key] !== '') {
          if (key.includes('age') || key.includes('market_value')) {
            searchFilters[key] = parseInt(filters[key])
          } else {
            searchFilters[key] = filters[key]
          }
        }
      })

      const url = new URL('http://127.0.0.1:8000/players/search')
      if (loadMore && pagingState) {
        url.searchParams.append('paging_state', pagingState)
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(searchFilters)
      })
      
      const data = await response.json()
      
      if (loadMore) {
        setResults(prev => [...prev, ...data.data])
      } else {
        setResults(data.data)
      }
      
      setPagingState(data.paging_state)
      setHasMore(data.has_more)
      
    } catch (error) {
      console.error('Erreur lors de la recherche:', error)
    }
    
    setLoading(false)
  }

  const handleReset = () => {
    setFilters({
      name: '',
      position: '',
      nationality: '', 
      team_id: '',
      min_age: '',
      max_age: '',
      min_market_value: '',
      max_market_value: ''
    })
    setResults([])
    setPagingState(null)
    setHasMore(false)
  }

  const formatMarketValue = (value) => {
    if (!value) return 'N/A'
    if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)}M €`
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(0)}K €`
    }
    return `${value} €`
  }

  if (!isOpen) {
    return (
      <div className="card" style={{ marginBottom: '20px' }}>
        <button 
          className="button" 
          onClick={() => setIsOpen(true)}
          style={{ width: '100%', background: '#2563eb' }}
        >
          🔍 Recherche Avancée de Joueurs
        </button>
      </div>
    )
  }

  return (
    <div className="card" style={{ marginBottom: '20px' }}>
      <h3 style={{ marginBottom: '1rem' }}>🔍 Recherche Avancée de Joueurs</h3>
      
      {/* Section informative */}
      <div style={{ 
        marginBottom: '1.5rem', 
        padding: '1rem', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        border: '1px solid #e9ecef'
      }}>
        <p style={{ 
          fontSize: '0.9rem', 
          color: '#495057', 
          margin: '0 0 0.5rem 0',
          fontWeight: '600'
        }}>
          💡 Stratégies de recherche NoSQL optimisées :
        </p>
        <div style={{ fontSize: '0.85rem', color: '#6c757d' }}>
          <div style={{ marginBottom: '4px' }}>
            <strong>Position :</strong> Recherche par partition (très rapide) - table players_by_position
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Nationalité :</strong> Recherche par partition (très rapide) - table players_by_nationality  
          </div>
          <div style={{ marginBottom: '4px' }}>
            <strong>Nom :</strong> Index de recherche avec clustering alphabétique
          </div>
          <div>
            <strong>Filtres combinés :</strong> Stratégie adaptative avec filtrage côté application
          </div>
        </div>
      </div>

      {/* Header avec bouton de fermeture */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 className="title" style={{ margin: 0 }}>Critères de recherche</h4>
        <button 
          className="button" 
          onClick={() => setIsOpen(false)}
          style={{ background: '#6b7280', padding: '6px 10px', fontSize: '0.9rem' }}
        >
          ✕ Fermer
        </button>
      </div>

      {/* Formulaire de recherche */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
        {/* Nom */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Nom du joueur
          </label>
          <input
            className="input"
            type="text"
            placeholder="ex: Messi"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
          />
        </div>

        {/* Position */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Position
          </label>
          <select
            className="input"
            value={filters.position}
            onChange={(e) => setFilters({ ...filters, position: e.target.value })}
          >
            <option value="">Toutes les positions</option>
            {suggestions.positions.map((pos, index) => (
              <option key={index} value={pos}>{pos}</option>
            ))}
          </select>
        </div>

        {/* Nationalité */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Nationalité
          </label>
          <select
            className="input"
            value={filters.nationality}
            onChange={(e) => setFilters({ ...filters, nationality: e.target.value })}
          >
            <option value="">Toutes les nationalités</option>
            {suggestions.nationalities.map((nat, index) => (
              <option key={index} value={nat}>{nat}</option>
            ))}
          </select>
        </div>

        {/* Équipe */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Équipe
          </label>
          <select
            className="input"
            value={filters.team_id}
            onChange={(e) => setFilters({ ...filters, team_id: e.target.value })}
          >
            <option value="">Toutes les équipes</option>
            {suggestions.teams.map((team) => (
              <option key={team.team_id} value={team.team_id}>{team.team_name}</option>
            ))}
          </select>
        </div>

        {/* Âge minimum */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Âge minimum
          </label>
          <input
            className="input"
            type="number"
            placeholder="ex: 18"
            value={filters.min_age}
            onChange={(e) => setFilters({ ...filters, min_age: e.target.value })}
          />
        </div>

        {/* Âge maximum */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Âge maximum
          </label>
          <input
            className="input"
            type="number"
            placeholder="ex: 35"
            value={filters.max_age}
            onChange={(e) => setFilters({ ...filters, max_age: e.target.value })}
          />
        </div>

        {/* Valeur minimum */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Valeur min (€)
          </label>
          <input
            className="input"
            type="number"
            placeholder="ex: 1000000"
            value={filters.min_market_value}
            onChange={(e) => setFilters({ ...filters, min_market_value: e.target.value })}
          />
        </div>

        {/* Valeur maximum */}
        <div>
          <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', fontWeight: '500' }}>
            Valeur max (€)
          </label>
          <input
            className="input"
            type="number"
            placeholder="ex: 100000000"
            value={filters.max_market_value}
            onChange={(e) => setFilters({ ...filters, max_market_value: e.target.value })}
          />
        </div>
      </div>

      {/* Boutons d'action */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button 
          className="button" 
          onClick={() => handleSearch(false)}
          disabled={loading}
          style={{ background: '#059669' }}
        >
          {loading ? 'Recherche...' : '🔍 Rechercher'}
        </button>
        <button 
          className="button" 
          onClick={handleReset}
          style={{ background: '#dc2626' }}
        >
          🗑️ Réinitialiser
        </button>
      </div>

      {/* Résultats */}
      {results.length > 0 && (
        <div>
          <h4 style={{ marginBottom: '12px' }}>
            Résultats ({results.length} joueur{results.length > 1 ? 's' : ''})
          </h4>
          
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px' }}>
            {results.map((player, index) => (
              <div
                key={`${player.player_id}-${index}`}
                style={{
                  padding: '12px',
                  borderBottom: index < results.length - 1 ? '1px solid #f3f4f6' : 'none',
                  cursor: 'pointer',
                  '&:hover': { backgroundColor: '#f9fafb' }
                }}
                onClick={() => onPlayerSelect && onPlayerSelect(player.player_id)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                      {player.player_name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '2px' }}>
                      {player.position} • {player.nationality}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {player.team_name} • {player.age} ans
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '14px' }}>
                    <div style={{ fontWeight: '600', color: '#059669' }}>
                      {formatMarketValue(player.market_value_eur)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button 
                className="button" 
                onClick={() => handleSearch(true)}
                disabled={loading}
                style={{ background: '#6366f1' }}
              >
                {loading ? 'Chargement...' : 'Charger plus'}
              </button>
            </div>
          )}
        </div>
      )}

      {results.length === 0 && !loading && (
        <p className="small" style={{ textAlign: 'center', padding: '20px' }}>
          Aucun résultat trouvé. Essayez de modifier vos critères de recherche.
        </p>
      )}

      {/* Statistiques et informations */}
      {results.length > 0 && (
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: '#e8f5e8', 
          borderRadius: '8px', 
          fontSize: '0.85rem',
          border: '1px solid #c3e6c3'
        }}>
          <strong>✅ Recherche terminée :</strong> {results.length} joueur{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}
          {hasMore && <span> (plus de résultats disponibles)</span>}
        </div>
      )}

      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        background: '#f0f9ff', 
        borderRadius: '8px', 
        fontSize: '0.8rem',
        border: '1px solid #bfdbfe'
      }}>
        <strong>🎯 Architecture NoSQL :</strong> Démonstration de modélisation orientée requête avec Cassandra
        <ul style={{ marginTop: '8px', paddingLeft: '16px', margin: 0 }}>
          <li><strong>Dénormalisation :</strong> Données dupliquées dans 3 tables pour des accès optimaux</li>
          <li><strong>Clés de partition :</strong> Distribution équilibrée selon position et nationalité</li>
          <li><strong>Clustering :</strong> Tri alphabétique des noms pour recherche efficace</li>
          <li><strong>Pagination :</strong> Token-based avec paging_state pour gros datasets</li>
        </ul>
      </div>
    </div>
  )
}