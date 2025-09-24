/**
 * API client for Football NoSQL backend
 * Handles all HTTP requests to the FastAPI backend
 */

const API_BASE_URL = 'http://127.0.0.1:8000';

class ApiClient {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Convenience method for GET requests
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  // Health check
  async checkHealth() {
    return this.request('/health');
  }

  // Teams and Players
  async getPlayersByTeam(teamId, limit = 100) {
    return this.request(`/players/by-team/${teamId}?limit=${limit}`);
  }

  async getPlayerProfile(playerId) {
    return this.request(`/player/${playerId}/profile`);
  }

  // Market Values
  async getLatestMarketValue(playerId) {
    return this.request(`/player/${playerId}/market/latest`);
  }

  async getMarketValueHistory(playerId, pageSize = 50, pagingState = null) {
    let url = `/player/${playerId}/market/history?page_size=${pageSize}`;
    if (pagingState) {
      url += `&paging_state=${encodeURIComponent(pagingState)}`;
    }
    return this.request(url);
  }

  async addMarketValue(playerId, marketValueData) {
    return this.request(`/player/${playerId}/market/add`, {
      method: 'POST',
      body: JSON.stringify(marketValueData),
    });
  }

  // Transfers
  async getPlayerTransfers(playerId, limit = 50) {
    return this.request(`/player/${playerId}/transfers?limit=${limit}`);
  }

  async getTopTransfersBySeason(season, limit = 20) {
    return this.request(`/transfers/top/${season}?limit=${limit}`);
  }

  async addTransfer(playerId, transferData) {
    return this.request(`/player/${playerId}/transfer/add`, {
      method: 'POST',
      body: JSON.stringify(transferData),
    });
  }

  // Injuries
  async getPlayerInjuries(playerId, limit = 100) {
    return this.request(`/player/${playerId}/injuries?limit=${limit}`);
  }

  async addInjury(playerId, injuryData) {
    return this.request(`/player/${playerId}/injuries/add`, {
      method: 'POST',
      body: JSON.stringify(injuryData),
    });
  }

  async deleteInjury(playerId, startDate) {
    return this.request(`/player/${playerId}/injuries?start_date=${startDate}`, {
      method: 'DELETE',
    });
  }

  // Performance Data
  async getClubPerformances(playerId, season = null) {
    let url = `/player/${playerId}/club-perf`;
    if (season) {
      url += `?season=${season}`;
    }
    return this.request(url);
  }

  async getNationalPerformances(playerId, season = null) {
    let url = `/player/${playerId}/nat-perf`;
    if (season) {
      url += `?season=${season}`;
    }
    return this.request(url);
  }

  // Teammates
  async getPlayerTeammates(playerId, limit = 100) {
    return this.request(`/player/${playerId}/teammates?limit=${limit}`);
  }

  // Team Data
  async getTeamDetails(teamId) {
    return this.request(`/team/${teamId}/details`);
  }

  async getTeamChildren(teamId) {
    return this.request(`/team/${teamId}/children`);
  }

  async getTeamCompetitions(teamId, season = null) {
    let url = `/team/${teamId}/competitions`;
    if (season) {
      url += `?season=${season}`;
    }
    return this.request(url);
  }
}

export default new ApiClient();