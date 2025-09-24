import React, { useState, useEffect } from 'react';
import api from '../api';

const PlayerMarketValues = ({ playerId }) => {
  const [marketValues, setMarketValues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagingState, setPagingState] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  
  // Add new market value form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    as_of_date: '',
    market_value_eur: '',
    source: 'manual',
    ttl_seconds: ''
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(null);

  useEffect(() => {
    if (playerId) {
      loadMarketValues(true);
    }
  }, [playerId]);

  const loadMarketValues = async (reset = false) => {
    setLoading(true);
    setError(null);

    try {
      const currentPagingState = reset ? null : pagingState;
      const response = await api.getMarketValueHistory(playerId, 20, currentPagingState);
      
      if (reset) {
        setMarketValues(response.data || []);
      } else {
        setMarketValues(prev => [...prev, ...(response.data || [])]);
      }
      
      setPagingState(response.paging_state);
      setHasMore(response.has_more);
    } catch (err) {
      setError('Failed to load market values');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMarketValue = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setError(null);
    setAddSuccess(null);

    try {
      const data = {
        as_of_date: addForm.as_of_date,
        market_value_eur: parseInt(addForm.market_value_eur) * 1000000, // Convert millions to euros
        source: addForm.source,
      };

      if (addForm.ttl_seconds) {
        data.ttl_seconds = parseInt(addForm.ttl_seconds);
      }

      const result = await api.addMarketValue(playerId, data);
      setAddSuccess(result.message + (result.ttl_applied ? ' (TTL applied)' : ''));
      
      // Reset form
      setAddForm({
        as_of_date: '',
        market_value_eur: '',
        source: 'manual',
        ttl_seconds: ''
      });
      
      // Reload data
      loadMarketValues(true);
      
      // Auto-hide success message
      setTimeout(() => setAddSuccess(null), 5000);
      
    } catch (err) {
      setError('Failed to add market value');
    } finally {
      setAddLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatMarketValue = (value) => {
    return `€${(value / 1000000).toFixed(1)}M`;
  };

  return (
    <div>
      {/* Add Market Value Form */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>💰 Market Value History</h3>
          <button
            className="btn btn-primary btn-small"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : 'Add Value'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddMarketValue} style={{ background: '#f8f9ff', padding: '1rem', borderRadius: '5px', marginBottom: '1rem' }}>
            <h4>Add New Market Value</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Date:</label>
                <input
                  type="date"
                  value={addForm.as_of_date}
                  onChange={(e) => setAddForm({...addForm, as_of_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Value (millions €):</label>
                <input
                  type="number"
                  value={addForm.market_value_eur}
                  onChange={(e) => setAddForm({...addForm, market_value_eur: e.target.value})}
                  min="0"
                  step="0.1"
                  placeholder="e.g., 25.5"
                  required
                />
              </div>
              <div className="form-group">
                <label>Source:</label>
                <select
                  value={addForm.source}
                  onChange={(e) => setAddForm({...addForm, source: e.target.value})}
                >
                  <option value="manual">Manual</option>
                  <option value="transfermarkt">Transfermarkt</option>
                  <option value="fbref">FBRef</option>
                </select>
              </div>
              <div className="form-group">
                <label>TTL (seconds, optional):</label>
                <input
                  type="number"
                  value={addForm.ttl_seconds}
                  onChange={(e) => setAddForm({...addForm, ttl_seconds: e.target.value})}
                  min="1"
                  placeholder="3600 (1 hour)"
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={addLoading}>
              {addLoading ? 'Adding...' : 'Add Market Value'}
            </button>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
              💡 TTL demonstration: Set TTL to make this record expire automatically (good for temporary data)
            </div>
          </form>
        )}

        {addSuccess && <div className="success">{addSuccess}</div>}
        {error && <div className="error">{error}</div>}
      </div>

      {/* Market Values List */}
      <div className="card">
        <h3>📈 Value History ({marketValues.length} records)</h3>
        
        {marketValues.length > 0 ? (
          <>
            <div className="table" style={{ display: 'block', maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Market Value</th>
                    <th>Source</th>
                  </tr>
                </thead>
                <tbody>
                  {marketValues.map((mv, index) => (
                    <tr key={`${mv.as_of_date}-${index}`}>
                      <td>{formatDate(mv.as_of_date)}</td>
                      <td className="market-value">
                        {formatMarketValue(mv.market_value_eur)}
                      </td>
                      <td>{mv.source}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            {hasMore && (
              <div className="pagination">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => loadMarketValues(false)}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More'}
                </button>
                <div className="pagination-info">
                  Showing {marketValues.length} values
                </div>
              </div>
            )}
          </>
        ) : (
          !loading && <p>No market value history available.</p>
        )}

        {loading && marketValues.length === 0 && (
          <div className="loading">Loading market values</div>
        )}

        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f0f8ff', borderRadius: '5px', fontSize: '0.9rem' }}>
          <strong>🗂️ NoSQL Patterns Demonstrated:</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li><strong>Time-Series:</strong> Clustered by as_of_date DESC for recent-first ordering</li>
            <li><strong>Pagination:</strong> Uses paging_state token (Base64 encoded) for efficient large dataset navigation</li>
            <li><strong>TTL:</strong> Optional expiration for temporary data (Cassandra automatically deletes expired records)</li>
            <li><strong>INSERT/UPSERT:</strong> New values update both history and latest value tables</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlayerMarketValues;