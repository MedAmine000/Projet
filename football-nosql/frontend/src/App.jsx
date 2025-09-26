import React, { useState } from 'react';
import TeamPicker from './components/TeamPicker';
import PlayersList from './components/PlayersList';
import PlayerProfile from './components/PlayerProfile';
import PlayerMarketValues from './components/PlayerMarketValues';
import PlayerTransfers from './components/PlayerTransfers';
import PlayerInjuries from './components/PlayerInjuries';
import PlayerPerformances from './components/PlayerPerformances';
import Teammates from './components/Teammates';
import AdvancedSearchBar from './components/AdvancedSearchBar';

function App() {
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');

  const handleTeamSelect = (teamId) => {
    setSelectedTeam(teamId);
    setSelectedPlayer(null);
    setActiveTab('profile');
  };

  const handlePlayerSelect = (player) => {
    setSelectedPlayer(player);
    setActiveTab('profile');
  };

  const handleAdvancedPlayerSelect = async (playerId) => {
    try {
      // Récupérer les détails du joueur depuis l'API
      const response = await fetch(`http://127.0.0.1:8000/player/${playerId}/profile`);
      const playerData = await response.json();
      
      setSelectedPlayer({
        player_id: playerId,
        player_name: playerData.player_name,
        position: playerData.main_position,
        nationality: playerData.nationality
      });
      
      // Ne pas changer l'équipe sélectionnée, juste le joueur
      setActiveTab('profile');
    } catch (error) {
      console.error('Erreur lors de la récupération du profil joueur:', error);
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile', component: PlayerProfile },
    { id: 'market', label: 'Market Values', component: PlayerMarketValues },
    { id: 'transfers', label: 'Transfers', component: PlayerTransfers },
    { id: 'injuries', label: 'Injuries', component: PlayerInjuries },
    { id: 'performances', label: 'Performances', component: PlayerPerformances },
    { id: 'teammates', label: 'Teammates', component: Teammates },
  ];

  const ActiveComponent = tabs.find(tab => tab.id === activeTab)?.component;

  return (
    <div className="container">
      {/* Header with NoSQL cheatsheet */}
      <header className="header">
        <h1>Démo Football NoSQL</h1>
        <p>Démonstration des meilleures pratiques NoSQL avec Cassandra</p>
      </header>

      {/* Advanced Search Bar */}
      <AdvancedSearchBar onPlayerSelect={handleAdvancedPlayerSelect} />

      {/* Main Layout */}
      <div className="main-layout">
        {/* Sidebar */}
        <div className="sidebar">
          <TeamPicker onTeamSelect={handleTeamSelect} />
          
          {selectedTeam && (
            <PlayersList
              teamId={selectedTeam}
              selectedPlayer={selectedPlayer}
              onPlayerSelect={handlePlayerSelect}
            />
          )}
        </div>

        {/* Main Content */}
        <div className="content">
          {selectedPlayer ? (
            <>
              {/* Player Header */}
              <div className="card-header">
                <h2 className="card-title">
                  {selectedPlayer.player_name || selectedPlayer.player_id}
                </h2>
                <p>
                  {selectedPlayer.position && `${selectedPlayer.position} • `}
                  {selectedPlayer.nationality}
                </p>
              </div>

              {/* Tabs */}
              <nav className="tabs">
                <ul className="tabs-list">
                  {tabs.map(tab => (
                    <li key={tab.id}>
                      <button
                        className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                      >
                        {tab.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>

              {/* Tab Content */}
              {ActiveComponent && (
                <ActiveComponent playerId={selectedPlayer.player_id} />
              )}
            </>
          ) : selectedTeam ? (
            <div className="card">
              <h2>Select a Player</h2>
              <p>Choose a player from the list to view their detailed information and demonstrate NoSQL features.</p>
            </div>
          ) : (
            <div className="card">
              <h2>Welcome to Football NoSQL Demo</h2>
              <p>
                This application demonstrates NoSQL best practices using Cassandra with football data.
                Start by entering a team ID in the sidebar to explore:
              </p>
              <ul style={{ marginTop: '1rem', paddingLeft: '2rem' }}>
                <li><strong>Time-series data:</strong> Market values, transfers, injuries</li>
                <li><strong>Pagination:</strong> Large datasets with paging_state</li>
                <li><strong>Pre-aggregation:</strong> Top transfers by season</li>
                <li><strong>TTL:</strong> Temporary data with expiration</li>
                <li><strong>Tombstones:</strong> DELETE operations (use carefully)</li>
                <li><strong>Denormalization:</strong> Query-optimized table design</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;