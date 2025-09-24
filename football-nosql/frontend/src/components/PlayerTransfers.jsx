import React, { useState, useEffect } from 'react';
import api from '../api';

const PlayerTransfers = ({ playerId }) => {
  const [transfers, setTransfers] = useState([]);
  const [topTransfers, setTopTransfers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedSeason, setSelectedSeason] = useState('2023-2024');
  
  // Add transfer form
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({
    transfer_date: '',
    from_team_id: '',
    to_team_id: '',
    fee_eur: '',
    contract_years: '',
    season: ''
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(null);

  useEffect(() => {
    if (playerId) {
      loadTransfers();
    }
  }, [playerId]);

  useEffect(() => {
    if (selectedSeason) {
      loadTopTransfers();
    }
  }, [selectedSeason]);

  const loadTransfers = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.getPlayerTransfers(playerId);
      setTransfers(response.transfers || []);
    } catch (err) {
      setError('Failed to load transfers');
    } finally {
      setLoading(false);
    }
  };

  const loadTopTransfers = async () => {
    try {
      const response = await api.getTopTransfersBySeason(selectedSeason);
      setTopTransfers(response.top_transfers || []);
    } catch (err) {
      console.warn('Failed to load top transfers');
      setTopTransfers([]);
    }
  };

  const handleAddTransfer = async (e) => {
    e.preventDefault();
    setAddLoading(true);
    setError(null);
    setAddSuccess(null);

    try {
      const data = {
        transfer_date: addForm.transfer_date,
        from_team_id: addForm.from_team_id || null,
        to_team_id: addForm.to_team_id || null,
        fee_eur: parseInt(addForm.fee_eur) * 1000000, // Convert millions to euros
        contract_years: addForm.contract_years ? parseInt(addForm.contract_years) : null,
        season: addForm.season || null
      };

      const result = await api.addTransfer(playerId, data);
      setAddSuccess(result.message + (result.pre_aggregated ? ' (Added to top transfers)' : ''));
      
      // Reset form
      setAddForm({
        transfer_date: '',
        from_team_id: '',
        to_team_id: '',
        fee_eur: '',
        contract_years: '',
        season: ''
      });
      
      // Reload data
      loadTransfers();
      if (addForm.season === selectedSeason) {
        loadTopTransfers();
      }
      
      // Auto-hide success message
      setTimeout(() => setAddSuccess(null), 5000);
      
    } catch (err) {
      setError('Failed to add transfer');
    } finally {
      setAddLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString();
  };

  const formatFee = (fee) => {
    if (!fee || fee === 0) return 'Free';
    return `€${(fee / 1000000).toFixed(1)}M`;
  };

  const seasons = ['2023-2024', '2022-2023', '2021-2022', '2020-2021', '2019-2020'];

  return (
    <div>
      {/* Add Transfer Form */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>🔄 Transfer History</h3>
          <button
            className="btn btn-primary btn-small"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? 'Cancel' : 'Add Transfer'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddTransfer} style={{ background: '#f8f9ff', padding: '1rem', borderRadius: '5px', marginBottom: '1rem' }}>
            <h4>Add New Transfer</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '1rem' }}>
              <div className="form-group">
                <label>Transfer Date:</label>
                <input
                  type="date"
                  value={addForm.transfer_date}
                  onChange={(e) => setAddForm({...addForm, transfer_date: e.target.value})}
                  required
                />
              </div>
              <div className="form-group">
                <label>From Team ID:</label>
                <input
                  type="text"
                  value={addForm.from_team_id}
                  onChange={(e) => setAddForm({...addForm, from_team_id: e.target.value})}
                  placeholder="Previous team"
                />
              </div>
              <div className="form-group">
                <label>To Team ID:</label>
                <input
                  type="text"
                  value={addForm.to_team_id}
                  onChange={(e) => setAddForm({...addForm, to_team_id: e.target.value})}
                  placeholder="New team"
                />
              </div>
              <div className="form-group">
                <label>Fee (millions €):</label>
                <input
                  type="number"
                  value={addForm.fee_eur}
                  onChange={(e) => setAddForm({...addForm, fee_eur: e.target.value})}
                  min="0"
                  step="0.1"
                  placeholder="0 for free transfer"
                  required
                />
              </div>
              <div className="form-group">
                <label>Contract Years:</label>
                <input
                  type="number"
                  value={addForm.contract_years}
                  onChange={(e) => setAddForm({...addForm, contract_years: e.target.value})}
                  min="1"
                  max="10"
                  placeholder="Contract length"
                />
              </div>
              <div className="form-group">
                <label>Season (for top transfers):</label>
                <select
                  value={addForm.season}
                  onChange={(e) => setAddForm({...addForm, season: e.target.value})}
                >
                  <option value="">Select season</option>
                  {seasons.map(season => (
                    <option key={season} value={season}>{season}</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" disabled={addLoading}>
              {addLoading ? 'Adding...' : 'Add Transfer'}
            </button>
            <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
              💡 Pre-aggregation: If season and fee &gt; 0, this will be added to top_transfers_by_season table
            </div>
          </form>
        )}

        {addSuccess && <div className="success">{addSuccess}</div>}
        {error && <div className="error">{error}</div>}
      </div>

      {/* Player Transfers */}
      <div className="card">
        <h3>📋 Player Transfer History ({transfers.length} transfers)</h3>
        
        {loading ? (
          <div className="loading">Loading transfers</div>
        ) : transfers.length > 0 ? (
          <div className="table" style={{ display: 'block', maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Fee</th>
                  <th>Contract</th>
                </tr>
              </thead>
              <tbody>
                {transfers.map((transfer, index) => (
                  <tr key={`${transfer.transfer_date}-${index}`}>
                    <td>{formatDate(transfer.transfer_date)}</td>
                    <td>{transfer.from_team_id || 'Unknown'}</td>
                    <td>{transfer.to_team_id || 'Unknown'}</td>
                    <td className="transfer-fee">
                      {formatFee(transfer.fee_eur)}
                    </td>
                    <td>{transfer.contract_years ? `${transfer.contract_years} years` : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No transfer history available.</p>
        )}
      </div>

      {/* Top Transfers by Season */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h3>🏆 Top Transfers by Season</h3>
          <select
            value={selectedSeason}
            onChange={(e) => setSelectedSeason(e.target.value)}
            style={{ padding: '0.5rem', borderRadius: '5px', border: '2px solid #e0e6ed' }}
          >
            {seasons.map(season => (
              <option key={season} value={season}>{season}</option>
            ))}
          </select>
        </div>

        {topTransfers.length > 0 ? (
          <div className="table" style={{ display: 'block', maxHeight: '400px', overflowY: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Player</th>
                  <th>Fee</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {topTransfers.map((transfer, index) => (
                  <tr key={`${transfer.player_id}-${transfer.fee_eur}`}>
                    <td style={{ fontWeight: 'bold' }}>#{index + 1}</td>
                    <td>
                      <span style={transfer.player_id === playerId ? { fontWeight: 'bold', color: '#667eea' } : {}}>
                        {transfer.player_id}
                      </span>
                    </td>
                    <td className="transfer-fee">
                      {formatFee(transfer.fee_eur)}
                    </td>
                    <td>{transfer.from_team_id || 'Unknown'}</td>
                    <td>{transfer.to_team_id || 'Unknown'}</td>
                    <td>{transfer.transfer_date ? formatDate(transfer.transfer_date) : 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>No top transfers data available for {selectedSeason}.</p>
        )}

        <div style={{ marginTop: '1rem', padding: '1rem', background: '#e8f5e8', borderRadius: '5px', fontSize: '0.9rem' }}>
          <strong>🗂️ NoSQL Patterns Demonstrated:</strong>
          <ul style={{ marginTop: '0.5rem', paddingLeft: '1.5rem' }}>
            <li><strong>Time-Series:</strong> Player transfers ordered by transfer_date DESC</li>
            <li><strong>Pre-Aggregation:</strong> Top transfers pre-calculated and sorted by fee DESC per season</li>
            <li><strong>Composite Partition:</strong> Season as partition key, fee as clustering column for fast ranked queries</li>
            <li><strong>Dual-Write Pattern:</strong> New transfers update both player history and season rankings</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default PlayerTransfers;