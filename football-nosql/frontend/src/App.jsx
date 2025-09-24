import React, { useState } from 'react';
import TeamPicker from './components/TeamPicker';
import PlayersList from './components/PlayersList';
import PlayerProfile from './components/PlayerProfile';
import PlayerMarketValues from './components/PlayerMarketValues';
import PlayerTransfers from './components/PlayerTransfers';
import PlayerInjuries from './components/PlayerInjuries';
import PlayerPerformances from './components/PlayerPerformances';
import Teammates from './components/Teammates';

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

      {/* NoSQL Cheatsheet */}
      <div className="nosql-cheatsheet">
        <h3>Concepts NoSQL Démontrés</h3>
        <p><strong>Clés de Partition :</strong> player_id, team_id (recherches rapides) | <strong>Clustering :</strong> Ordre DESC pour time-series</p>
        <p><strong>Dénormalisation :</strong> Plusieurs tables par entité | <strong>Pré-agrégation :</strong> Top transferts par saison</p>
        <p><strong>Pagination :</strong> paging_state pour gros datasets | <strong>TTL :</strong> Données temporaires avec expiration</p>
        <p><strong>Tombstones :</strong> DELETE crée des marqueurs (attention) | <strong>Vues Matérialisées :</strong> Dernières valeurs marchandes</p>
      </div>

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