import { useState, useEffect } from 'react'

export default function AdvancedSearchBar({ onPlayerSelect }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [filters, setFilters] = useState({
    name: '',
    position: '',
    nationality: '', 
    team_name: '',
    min_age: '',
    max_age: '',
    min_market_value: '',
    max_market_value: ''
  })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState({
    positions: [],
    nationalities: []
  })

  // Charger les suggestions
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

  const handleSearch = async () => {
    if (!isExpanded) {
      setIsExpanded(true)
      return
    }

    setLoading(true)
    try {
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '')
      )

      const response = await fetch('http://127.0.0.1:8000/players/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanFilters)
      })

      const data = await response.json()
      setResults(data.data || [])
    } catch (error) {
      console.error('Erreur de recherche:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFilters({
      name: '', position: '', nationality: '', team_name: '',
      min_age: '', max_age: '', min_market_value: '', max_market_value: ''
    })
    setResults([])
  }

  const formatMarketValue = (value) => {
    if (!value) return 'N/A'
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  return (
    <div style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      borderRadius: '12px',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.2)',
      overflow: 'hidden'
    }}>
      {/* Barre de recherche compacte */}
      <div 
        onClick={() => setIsExpanded(!isExpanded)} 
        style={{ 
          cursor: 'pointer',
          padding: '1rem 1.5rem',
          color: 'white'
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem'
        }}>
          <span style={{ fontSize: '1.2rem' }}>🔍</span>
          <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>Recherche Avancée de Joueurs</span>
          <span style={{
            flex: 1,
            opacity: 0.9,
            fontSize: '0.9rem'
          }}>
            {!isExpanded ? 'Cliquez pour chercher par position, nationalité, âge...' : 'Filtres actifs'}
          </span>
          <span style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>{isExpanded ? '−' : '+'}</span>
        </div>
      </div>

      {/* Filtres étendus */}
      {isExpanded && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '1rem 1.5rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.2)'
        }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
            gap: '0.75rem',
            alignItems: 'center'
          }}>
            <input
              type="text"
              placeholder="Nom du joueur"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem'
              }}
            />
            
            <select
              value={filters.position}
              onChange={(e) => setFilters({ ...filters, position: e.target.value })}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem'
              }}
            >
              <option value="">Position</option>
              {suggestions.positions.map(pos => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>

            <select
              value={filters.nationality}
              onChange={(e) => setFilters({ ...filters, nationality: e.target.value })}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem'
              }}
            >
              <option value="">Nationalité</option>
              {suggestions.nationalities.map(nat => (
                <option key={nat} value={nat}>{nat}</option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Équipe"
              value={filters.team_name}
              onChange={(e) => setFilters({ ...filters, team_name: e.target.value })}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem'
              }}
            />

            <input
              type="number"
              placeholder="Âge min"
              value={filters.min_age}
              onChange={(e) => setFilters({ ...filters, min_age: e.target.value })}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem',
                maxWidth: '100px'
              }}
            />

            <input
              type="number"
              placeholder="Âge max"
              value={filters.max_age}
              onChange={(e) => setFilters({ ...filters, max_age: e.target.value })}
              style={{
                padding: '0.5rem 0.75rem',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                borderRadius: '6px',
                background: 'rgba(255, 255, 255, 0.9)',
                fontSize: '0.9rem',
                maxWidth: '100px'
              }}
            />

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={handleSearch}
                disabled={loading}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  background: '#10b981',
                  color: 'white'
                }}
              >
                {loading ? '⏳' : '🔍'} Chercher
              </button>
              <button 
                onClick={handleReset}
                style={{
                  padding: '0.5rem 1rem',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  fontWeight: '500',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: 'white'
                }}
              >
                🗑️ Reset
              </button>
            </div>
          </div>

          {/* Résultats */}
          {results.length > 0 && (
            <div style={{
              marginTop: '1rem',
              background: 'rgba(255, 255, 255, 0.95)',
              borderRadius: '8px',
              padding: '1rem'
            }}>
              <div style={{
                fontWeight: '600',
                marginBottom: '0.75rem',
                color: '#374151',
                fontSize: '0.9rem'
              }}>
                <span>{results.length} joueur{results.length > 1 ? 's' : ''} trouvé{results.length > 1 ? 's' : ''}</span>
              </div>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.5rem'
              }}>
                {results.slice(0, 5).map((player) => (
                  <div
                    key={player.player_id}
                    onClick={() => onPlayerSelect && onPlayerSelect(player.player_id)}
                    style={{
                      padding: '0.75rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#f9fafb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <div>
                      <div style={{
                        fontWeight: '600',
                        color: '#111827',
                        marginBottom: '0.25rem'
                      }}>{player.player_name}</div>
                      <div style={{
                        fontSize: '0.85rem',
                        color: '#6b7280'
                      }}>
                        {player.position} • {player.nationality} • {player.age} ans
                        {player.market_value_eur && (
                          <span style={{
                            color: '#059669',
                            fontWeight: '500'
                          }}> • {formatMarketValue(player.market_value_eur)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {results.length > 5 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '0.5rem',
                    fontSize: '0.85rem',
                    color: '#6b7280',
                    fontStyle: 'italic'
                  }}>+{results.length - 5} autres résultats...</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}


    </div>
  )
}