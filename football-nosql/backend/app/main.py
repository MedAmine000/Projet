"""
Application FastAPI - Base de données Football NoSQL
Démontre les meilleures pratiques NoSQL : pagination, TTL, tombstones, requêtes time-series
"""
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import logging
import sys
import os
from datetime import date, datetime

# Add backend to path for imports
backend_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_path)

import settings
from app.dao import dao
from app.utils import *

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="API Football NoSQL",
    description="Application démontrant les meilleures pratiques NoSQL avec des données de football",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ========================================
# PYDANTIC MODELS
# ========================================

class PlayerProfile(BaseModel):
    player_id: str
    player_name: Optional[str] = None
    nationality: Optional[str] = None
    birth_date: Optional[date] = None
    height_cm: Optional[int] = None
    preferred_foot: Optional[str] = None
    main_position: Optional[str] = None
    current_team_id: Optional[str] = None

class MarketValue(BaseModel):
    as_of_date: date
    market_value_eur: int
    source: Optional[str] = None

class MarketValueAdd(BaseModel):
    as_of_date: date
    market_value_eur: int
    source: Optional[str] = "manual"
    ttl_seconds: Optional[int] = None  # For TTL demonstration

class Transfer(BaseModel):
    transfer_date: date
    from_team_id: Optional[str] = None
    to_team_id: Optional[str] = None
    fee_eur: int
    contract_years: Optional[int] = None

class TransferAdd(BaseModel):
    transfer_date: date
    from_team_id: Optional[str] = None
    to_team_id: Optional[str] = None
    fee_eur: int
    contract_years: Optional[int] = None
    season: Optional[str] = None  # For pre-aggregation

class Injury(BaseModel):
    start_date: date
    injury_type: str
    end_date: Optional[date] = None
    games_missed: Optional[int] = None

class InjuryAdd(BaseModel):
    start_date: date
    injury_type: str
    end_date: Optional[date] = None
    games_missed: Optional[int] = None
    ttl_seconds: Optional[int] = None  # For TTL demonstration

class PaginatedResponse(BaseModel):
    data: List[Dict[str, Any]]
    paging_state: Optional[str] = None
    has_more: bool = False

# ========================================
# STARTUP/SHUTDOWN EVENTS
# ========================================

@app.on_event("startup")
async def startup_event():
    """Initialise la connexion à la base de données au démarrage"""
    try:
        dao.connect()
        logger.info("Connexion à la base de données établie")
    except Exception as e:
        logger.error(f"Échec de connexion à la base de données : {e}")
        raise

@app.on_event("shutdown") 
async def shutdown_event():
    """Ferme la connexion à la base de données lors de l'arrêt"""
    dao.close()
    logger.info("Connexion à la base de données fermée")

# ========================================
# BASIC ENDPOINTS
# ========================================

@app.get("/health")
async def health_check():
    """Point de contrôle de santé de l'API"""
    return {"status": "healthy", "message": "API Football NoSQL opérationnelle"}

# ========================================
# TEAM & PLAYER LOOKUPS
# ========================================

@app.get("/players/by-team/{team_id}")
async def get_players_by_team(
    team_id: str,
    limit: int = Query(100, ge=1, le=settings.MAX_PAGE_SIZE)
):
    """
    Récupère les joueurs par équipe (démontre l'utilisation des clés de partition)
    """
    try:
        query = """
        SELECT player_id, player_name, position, nationality 
        FROM players_by_team 
        WHERE team_id = ? 
        LIMIT ?
        """
        
        result = dao.session.execute(dao.session.prepare(query), (team_id, limit))
        players = []
        
        for row in result:
            players.append({
                "player_id": row.player_id,
                "player_name": row.player_name,
                "position": row.position,
                "nationality": row.nationality
            })
        
        return {"team_id": team_id, "players": players}
        
    except Exception as e:
        logger.error(f"Erreur lors de la récupération des joueurs par équipe : {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@app.get("/player/{player_id}/profile")
async def get_player_profile(player_id: str):
    """
    Get player profile (demonstrates single partition lookup)
    """
    try:
        result = dao.execute_statement('get_player_profile', (player_id,))
        rows = list(result)
        
        if not rows:
            raise HTTPException(status_code=404, detail="Joueur non trouvé")
        
        row = rows[0]
        
        return {
            "player_id": row.player_id,
            "player_name": row.player_name,
            "nationality": row.nationality,
            "birth_date": row.birth_date.date().isoformat() if row.birth_date else None,
            "height_cm": row.height_cm,
            "preferred_foot": row.preferred_foot,
            "main_position": row.main_position,
            "current_team_id": row.current_team_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting player profile: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ========================================
# MARKET VALUES (TIME-SERIES & PAGINATION)
# ========================================

@app.get("/player/{player_id}/market/latest")
async def get_latest_market_value(player_id: str):
    """
    Get latest market value (demonstrates materialized view pattern)
    """
    try:
        query = """
        SELECT player_id, as_of_date, market_value_eur, source
        FROM latest_market_value_by_player 
        WHERE player_id = ?
        """
        
        result = dao.session.execute(dao.session.prepare(query), (player_id,))
        rows = list(result)
        
        if not rows:
            return {"player_id": player_id, "market_value": None}
        
        row = rows[0]
        
        return {
            "player_id": row.player_id,
            "as_of_date": row.as_of_date.date().isoformat() if row.as_of_date else None,
            "market_value_eur": row.market_value_eur,
            "source": row.source
        }
        
    except Exception as e:
        logger.error(f"Error getting latest market value: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/player/{player_id}/market/history")
async def get_market_value_history(
    player_id: str,
    page_size: int = Query(settings.DEFAULT_PAGE_SIZE, ge=1, le=settings.MAX_PAGE_SIZE),
    paging_state: Optional[str] = Query(None)
):
    """
    Get market value history with pagination (demonstrates NoSQL pagination with paging_state)
    """
    try:
        query = """
        SELECT as_of_date, market_value_eur, source
        FROM market_value_by_player 
        WHERE player_id = ?
        """
        
        rows, next_paging_state = dao.get_paginated_results(
            query, (player_id,), page_size, paging_state
        )
        
        data = []
        for row in rows:
            data.append({
                "as_of_date": row.as_of_date.date().isoformat() if row.as_of_date else None,
                "market_value_eur": row.market_value_eur,
                "source": row.source
            })
        
        return PaginatedResponse(
            data=data,
            paging_state=next_paging_state,
            has_more=next_paging_state is not None
        )
        
    except Exception as e:
        logger.error(f"Error getting market value history: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/player/{player_id}/market/add")
async def add_market_value(player_id: str, market_value: MarketValueAdd):
    """
    Add new market value (demonstrates TTL and upsert patterns)
    """
    try:
        # Insert with optional TTL
        if market_value.ttl_seconds:
            dao.execute_statement('insert_market_value_ttl', (
                player_id, market_value.as_of_date, market_value.market_value_eur,
                market_value.source, market_value.ttl_seconds
            ))
        else:
            dao.execute_statement('insert_market_value', (
                player_id, market_value.as_of_date, market_value.market_value_eur,
                market_value.source
            ))
        
        # Check if this is now the latest value and update materialized view
        latest_query = """
        SELECT as_of_date FROM latest_market_value_by_player WHERE player_id = ?
        """
        result = dao.session.execute(dao.session.prepare(latest_query), (player_id,))
        latest_rows = list(result)
        
        if not latest_rows or market_value.as_of_date > latest_rows[0].as_of_date:
            # Update latest market value
            dao.execute_statement('upsert_latest_market_value', (
                player_id, market_value.as_of_date, market_value.market_value_eur,
                market_value.source
            ))
        
        return {"message": "Market value added successfully", "ttl_applied": market_value.ttl_seconds is not None}
        
    except Exception as e:
        logger.error(f"Error adding market value: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ========================================
# TRANSFERS (TIME-SERIES & PRE-AGGREGATION)
# ========================================

@app.get("/player/{player_id}/transfers")
async def get_player_transfers(
    player_id: str,
    limit: int = Query(50, ge=1, le=settings.MAX_PAGE_SIZE)
):
    """
    Get player transfer history (demonstrates time-series with DESC clustering)
    """
    try:
        query = """
        SELECT transfer_date, from_team_id, to_team_id, fee_eur, contract_years
        FROM transfers_by_player 
        WHERE player_id = ?
        LIMIT ?
        """
        
        result = dao.session.execute(dao.session.prepare(query), (player_id, limit))
        transfers = []
        
        for row in result:
            transfers.append({
                "transfer_date": row.transfer_date.date().isoformat() if row.transfer_date else None,
                "from_team_id": row.from_team_id,
                "to_team_id": row.to_team_id,
                "fee_eur": row.fee_eur,
                "contract_years": row.contract_years
            })
        
        return {"player_id": player_id, "transfers": transfers}
        
    except Exception as e:
        logger.error(f"Error getting player transfers: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/transfers/top/{season}")
async def get_top_transfers_by_season(
    season: str,
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get top transfers by season (demonstrates pre-aggregation pattern)
    """
    try:
        query = """
        SELECT fee_eur, player_id, to_team_id, from_team_id, transfer_date
        FROM top_transfers_by_season 
        WHERE season = ?
        LIMIT ?
        """
        
        result = dao.session.execute(dao.session.prepare(query), (season, limit))
        transfers = []
        
        for row in result:
            transfers.append({
                "fee_eur": row.fee_eur,
                "player_id": row.player_id,
                "to_team_id": row.to_team_id,
                "from_team_id": row.from_team_id,
                "transfer_date": row.transfer_date.date().isoformat() if row.transfer_date else None
            })
        
        return {"season": season, "top_transfers": transfers}
        
    except Exception as e:
        logger.error(f"Error getting top transfers: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/player/{player_id}/transfer/add")
async def add_transfer(player_id: str, transfer: TransferAdd):
    """
    Add new transfer (demonstrates upsert and pre-aggregation update)
    """
    try:
        # Insert into main transfer table
        dao.execute_statement('insert_transfer', (
            player_id, transfer.transfer_date, transfer.from_team_id,
            transfer.to_team_id, transfer.fee_eur, transfer.contract_years
        ))
        
        # Update pre-aggregation if season provided and fee > 0
        if transfer.season and transfer.fee_eur > 0:
            dao.execute_statement('insert_top_transfer', (
                transfer.season, transfer.fee_eur, player_id,
                transfer.to_team_id, transfer.from_team_id, transfer.transfer_date
            ))
        
        return {"message": "Transfer added successfully", "pre_aggregated": bool(transfer.season and transfer.fee_eur > 0)}
        
    except Exception as e:
        logger.error(f"Error adding transfer: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ========================================
# INJURIES (TTL & TOMBSTONES DEMO)
# ========================================

@app.get("/player/{player_id}/injuries")
async def get_player_injuries(
    player_id: str,
    limit: int = Query(100, ge=1, le=settings.MAX_PAGE_SIZE)
):
    """
    Get player injury history (demonstrates time-series)
    """
    try:
        query = """
        SELECT start_date, injury_type, end_date, games_missed
        FROM injuries_by_player 
        WHERE player_id = ?
        LIMIT ?
        """
        
        result = dao.session.execute(dao.session.prepare(query), (player_id, limit))
        injuries = []
        
        for row in result:
            injuries.append({
                "start_date": row.start_date.date().isoformat() if row.start_date else None,
                "injury_type": row.injury_type,
                "end_date": row.end_date.date().isoformat() if row.end_date else None,
                "games_missed": row.games_missed
            })
        
        return {"player_id": player_id, "injuries": injuries}
        
    except Exception as e:
        logger.error(f"Error getting player injuries: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/player/{player_id}/injuries/add")
async def add_injury(player_id: str, injury: InjuryAdd):
    """
    Add new injury (demonstrates TTL usage)
    """
    try:
        if injury.ttl_seconds:
            dao.execute_statement('insert_injury_ttl', (
                player_id, injury.start_date, injury.injury_type,
                injury.end_date, injury.games_missed, injury.ttl_seconds
            ))
        else:
            dao.execute_statement('insert_injury', (
                player_id, injury.start_date, injury.injury_type,
                injury.end_date, injury.games_missed
            ))
        
        return {"message": "Injury added successfully", "ttl_applied": injury.ttl_seconds is not None}
        
    except Exception as e:
        logger.error(f"Error adding injury: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.delete("/player/{player_id}/injuries")
async def delete_injury(
    player_id: str,
    start_date: date = Query(..., description="Start date of injury to delete")
):
    """
    Delete injury record (demonstrates tombstone creation)
    WARNING: This creates tombstones - use sparingly in production
    """
    try:
        dao.execute_statement('delete_injury', (player_id, start_date))
        
        return {
            "message": "Injury deleted (tombstone created)",
            "warning": "Tombstones created - monitor for performance impact"
        }
        
    except Exception as e:
        logger.error(f"Error deleting injury: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ========================================
# PERFORMANCE DATA
# ========================================

@app.get("/player/{player_id}/club-perf")
async def get_club_performances(
    player_id: str,
    season: Optional[str] = Query(None, description="Specific season (YYYY-YYYY)")
):
    """
    Get club performance data
    """
    try:
        if season:
            query = """
            SELECT season, team_id, matches, goals, assists, minutes
            FROM club_performances_by_player_season 
            WHERE player_id = ? AND season = ?
            """
            result = dao.session.execute(dao.session.prepare(query), (player_id, season))
        else:
            query = """
            SELECT season, team_id, matches, goals, assists, minutes
            FROM club_performances_by_player_season 
            WHERE player_id = ?
            """
            result = dao.session.execute(dao.session.prepare(query), (player_id,))
        
        performances = []
        for row in result:
            performances.append({
                "season": row.season,
                "team_id": row.team_id,
                "matches": row.matches,
                "goals": row.goals,
                "assists": row.assists,
                "minutes": row.minutes
            })
        
        return {"player_id": player_id, "club_performances": performances}
        
    except Exception as e:
        logger.error(f"Error getting club performances: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/player/{player_id}/nat-perf")
async def get_national_performances(
    player_id: str,
    season: Optional[str] = Query(None, description="Specific season (YYYY-YYYY)")
):
    """
    Get national team performance data
    """
    try:
        if season:
            query = """
            SELECT season, national_team, matches, goals, assists, minutes
            FROM national_performances_by_player_season 
            WHERE player_id = ? AND season = ?
            """
            result = dao.session.execute(dao.session.prepare(query), (player_id, season))
        else:
            query = """
            SELECT season, national_team, matches, goals, assists, minutes
            FROM national_performances_by_player_season 
            WHERE player_id = ?
            """
            result = dao.session.execute(dao.session.prepare(query), (player_id,))
        
        performances = []
        for row in result:
            performances.append({
                "season": row.season,
                "national_team": row.national_team,
                "matches": row.matches,
                "goals": row.goals,
                "assists": row.assists,
                "minutes": row.minutes
            })
        
        return {"player_id": player_id, "national_performances": performances}
        
    except Exception as e:
        logger.error(f"Error getting national performances: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ========================================
# TEAMMATES
# ========================================

@app.get("/player/{player_id}/teammates")
async def get_player_teammates(
    player_id: str,
    limit: int = Query(100, ge=1, le=settings.MAX_PAGE_SIZE)
):
    """
    Get player teammates
    """
    try:
        query = """
        SELECT teammate_id, teammate_name, matches_together
        FROM teammates_by_player 
        WHERE player_id = ?
        LIMIT ?
        """
        
        result = dao.session.execute(dao.session.prepare(query), (player_id, limit))
        teammates = []
        
        for row in result:
            teammates.append({
                "teammate_id": row.teammate_id,
                "teammate_name": row.teammate_name,
                "matches_together": row.matches_together
            })
        
        return {"player_id": player_id, "teammates": teammates}
        
    except Exception as e:
        logger.error(f"Error getting teammates: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# ========================================
# TEAM DATA
# ========================================

@app.get("/teams/search")
async def search_teams(
    q: str = Query(..., min_length=1, description="Terme de recherche pour le nom d'équipe"),
    limit: int = Query(10, ge=1, le=50)
):
    """
    Recherche d'équipes par nom (pour l'autocomplétion)
    """
    try:
        # Récupération de toutes les équipes et filtrage côté application
        # (alternative à LIKE qui nécessite un index secondaire en Cassandra)
        query = """
        SELECT team_id, team_name, country, city
        FROM team_details_by_id 
        LIMIT 1000
        """
        
        result = dao.session.execute(dao.session.prepare(query))
        teams = []
        search_term = q.lower()
        count = 0
        
        for row in result:
            if count >= limit:
                break
                
            team_name_lower = row.team_name.lower() if row.team_name else ""
            if search_term in team_name_lower:
                teams.append({
                    "team_id": row.team_id,
                    "team_name": row.team_name,
                    "country": row.country,
                    "city": row.city
                })
                count += 1
        
        return {"query": q, "teams": teams}
        
    except Exception as e:
        logger.error(f"Erreur lors de la recherche d'équipes : {e}")
        raise HTTPException(status_code=500, detail="Erreur interne du serveur")

@app.get("/team/{team_id}/details")
async def get_team_details(team_id: str):
    """
    Get team details
    """
    try:
        query = """
        SELECT team_id, team_name, country, city, founded
        FROM team_details_by_id 
        WHERE team_id = ?
        """
        
        result = dao.session.execute(dao.session.prepare(query), (team_id,))
        rows = list(result)
        
        if not rows:
            raise HTTPException(status_code=404, detail="Team not found")
        
        row = rows[0]
        
        return {
            "team_id": row.team_id,
            "team_name": row.team_name,
            "country": row.country,
            "city": row.city,
            "founded": row.founded
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting team details: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/team/{team_id}/children")
async def get_team_children(team_id: str):
    """
    Get team children (youth teams, reserves, etc.)
    """
    try:
        query = """
        SELECT child_team_id, child_team_name, relation
        FROM team_children_by_parent 
        WHERE parent_team_id = ?
        """
        
        result = dao.session.execute(dao.session.prepare(query), (team_id,))
        children = []
        
        for row in result:
            children.append({
                "child_team_id": row.child_team_id,
                "child_team_name": row.child_team_name,
                "relation": row.relation
            })
        
        return {"parent_team_id": team_id, "children": children}
        
    except Exception as e:
        logger.error(f"Error getting team children: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/team/{team_id}/competitions")
async def get_team_competitions(
    team_id: str,
    season: Optional[str] = Query(None, description="Specific season (YYYY-YYYY)")
):
    """
    Get team competition participations
    """
    try:
        if season:
            query = """
            SELECT season, competition
            FROM team_competitions_by_team_season 
            WHERE team_id = ? AND season = ?
            """
            result = dao.session.execute(dao.session.prepare(query), (team_id, season))
        else:
            query = """
            SELECT season, competition
            FROM team_competitions_by_team_season 
            WHERE team_id = ?
            """
            result = dao.session.execute(dao.session.prepare(query), (team_id,))
        
        competitions = []
        for row in result:
            competitions.append({
                "season": row.season,
                "competition": row.competition
            })
        
        return {"team_id": team_id, "competitions": competitions}
        
    except Exception as e:
        logger.error(f"Error getting team competitions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)