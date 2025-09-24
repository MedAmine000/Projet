import React, { useState, useEffect } from 'react';
import api from '../api';

const PlayerInjuries = ({ playerId }) => {
  const [injuries, setInjuries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Add injury form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    start_date: '',
    injury_type: '',
    end_date: '',
    games_missed: '',
    ttl_seconds: ''
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(null);

  useEffect(() => {
    if (playerId) {
      loadInjuries();
    }
  }, [playerId]);

  const loadInjuries = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getPlayerInjuries(playerId);
      setInjuries(response.injuries || []);
    } catch (err) {
      setError('Failed to load injuries');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInjury = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setError(null);
    setAddSuccess(null);

    try {
      const data = {
        start_date: addForm.start_date,
        injury_type: addForm.injury_type,
        end_date: addForm.end_date || null,
        games_missed: addForm.games_missed ? parseInt(addForm.games_missed) : null
      };

      if (addForm.ttl_seconds) {
        data.ttl_seconds = parseInt(addForm.ttl_seconds);
      }

      const result = await api.addInjury(playerId, data);
      setAddSuccess(result.message + (result.ttl_applied ? ' (TTL applied)' : ''));
      
      // Reset form
      setAddForm({
        start_date: '',
        injury_type: '',
        end_date: '',
        games_missed: '',
        ttl_seconds: ''
      });
      
      // Reload data
      loadInjuries();
      
      // Auto-hide success message
      setTimeout(() => setAddSuccess(null), 5000);
      
    } catch (err) {
      setError('Failed to add injury');
    } finally {
      setAddLoading(false);
    }
  };

  const handleDeleteInjury = async (startDate) => {
    if (!confirm(`Are you sure you want to delete the injury from ${formatDate(startDate)}? This will create a tombstone in Cassandra.`)) {
      return;
    }

    try {
      const result = await api.deleteInjury(playerId, startDate);
      setAddSuccess(result.message);
      
      // Reload data
      loadInjuries();
      
      // Auto-hide success message
      setTimeout(() => setAddSuccess(null), 5000);
      
    } catch (err) {
      setError('Failed to delete injury');
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const getInjuryStatus = (startDate, endDate) => {
    if (!endDate) return { status: 'active', text: 'Active' };
    
    const end = new Date(endDate);
    const now = new Date();
    
    if (end > now) {
      return { status: 'active', text: 'Recovering' };
    } else {
      return { status: 'recovered', text: 'Recovered' };
    }
  };

  const calculateDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const injuryTypes = [
    'Muscle Injury', 'Ligament Injury', 'Fracture', 'Concussion',
    'Knee Injury', 'Ankle Injury', 'Back Injury', 'Shoulder Injury',
    'Hamstring', 'Groin Injury', 'Other'
  ];

  return (
    <div>
      {/* Add Injury Form */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>🏥 Injury History</h3>
          <button
            className="btn btn-primary btn-small"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : 'Add Injury'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddInjury} style={{ background: '#fff3cd', padding: '1rem', borderRadius: '5px', marginBottom: '1rem', border: '2px solid #ffeaa7' }}>
            <h4>Add New Injury Record</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Start Date:</label>
                <input
                  type="date"
                  value={addForm.start_date}
                  onChange={(e) => setAddForm({...addForm, start_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>Injury Type:</label>
                <select
                  value={addForm.injury_type}
                  onChange={(e) => setAddForm({...addForm, injury_type: e.target.value})}
                  required
                >
                  <option value="">Select injury type</option>
                  {injuryTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>End Date (optional):</label>
                <input
                  type="date"
                  value={addForm.end_date}
                  onChange={(e) => setAddForm({...addForm, end_date: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Games Missed:</label>
                <input
                  type="number"
                  value={addForm.games_missed}
                  onChange={(e) => setAddForm({...addForm, games_missed: e.target.value})}
                  min="0"
                  placeholder="Number of games"
                />
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
              {addLoading ? 'Adding...' : 'Add Injury'}
            </button>
            <div style={{ fontSize: '0.8rem', color: '#856404', marginTop: '0.5rem' }}>
              ⚠️ TTL demonstration: Record will auto-expire after specified seconds (useful for temporary medical data)
            </div>
          </form>
        )}

        {addSuccess && <div className="success">{addSuccess}</div>}
        {error && <div className="error">{error}</div>}
      </div>

      {/* Injuries List */}
      <div className="card">
        <h3>📋 Injury Records ({injuries.length} injuries)</h3>
        
        {loading ? (
          <div className="loading">Loading injuries</div>
        ) : injuries.length > 0 ? (
          <div className="table" style={{ display: 'block', maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Start Date</th>
                  <th>Type</th>
                  <th>End Date</th>
                  <th>Duration</th>
                  <th>Games Missed</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {injuries.map((injury, index) => {
                  const status = getInjuryStatus(injury.start_date, injury.end_date);
                  return (
                    <tr key={`${injury.start_date}-${index}`}>
                      <td>{formatDate(injury.start_date)}</td>
                      <td>{injury.injury_type}</td>
                      <td>{injury.end_date ? formatDate(injury.end_date) : 'Ongoing'}</td>
                      <td>{calculateDuration(injury.start_date, injury.end_date)}</td>
                      <td>{injury.games_missed || 'N/A'}</td>
                      <td>
                        <span className={status.status === 'active' ? 'injury-active' : 'injury-recovered'}>
                          {status.text}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleDeleteInjury(injury.start_date)}
                          title="Delete (creates tombstone)"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No injury history available.</p>
        )}

        <div style={{ marginTop: '1rem', padding: '1rem', background: '#ffe6e6', borderRadius: '5px', fontSize: '0.9rem' }}>
          <strong>⚠️ NoSQL Patterns Demonstrated:</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li><strong>Time-Series:</strong> Injuries ordered by start_date DESC for recent-first display</li>
            <li><strong>TTL (Time To Live):</strong> Records can auto-expire for privacy compliance</li>
            <li><strong>Tombstones:</strong> DELETE creates markers instead of immediate removal</li>
            <li><strong>WARNING:</strong> Frequent DELETEs create tombstones that can impact read performance</li>
            <li><strong>Best Practice:</strong> Use TTL instead of DELETE for temporary data</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlayerInjuries;