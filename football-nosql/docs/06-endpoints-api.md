# 🛠️ Endpoints API et Intégration - Architecture Moderne

## 🎯 **Architecture API - Pattern REST Adapté NoSQL**

### 🏗️ **Structure Générale**
```python
# app/main.py - FastAPI moderne avec async/await
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
import asyncio
import time

app = FastAPI(
    title="Football NoSQL API",
    description="API moderne pour données football avec Cassandra",
    version="1.0.0",
    docs_url="/docs",          # Swagger UI automatique
    redoc_url="/redoc"         # ReDoc automatique
)

# CORS pour intégration frontend React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 🔍 **Endpoints de Recherche - Innovation Multi-Stratégies**

### ⚡ **1. Endpoint Principal: Recherche Adaptative**
```python
@app.post("/api/players/search", 
          summary="Recherche adaptative de joueurs",
          description="Sélectionne automatiquement la meilleure stratégie selon les filtres")
async def search_players_adaptive(
    filters: PlayerSearchFilters,
    background_tasks: BackgroundTasks
) -> PlayerSearchResponse:
    """
    🚀 INNOVATION: Sélection automatique de stratégie optimale
    
    Analyse les filtres et choisit:
    - players_by_position pour filtre position seul
    - players_by_nationality pour filtre nationalité seul  
    - players_search_index pour recherche nom
    - Stratégie hybride pour multi-critères
    """
    
    start_time = time.time()
    
    try:
        # 🧠 IA de sélection de stratégie
        strategy_selector = StrategySelector()
        optimal_strategy = strategy_selector.choose_optimal_strategy(filters)
        
        # 📊 Logging pour analytics (asynchrone)
        background_tasks.add_task(log_search_analytics, filters, optimal_strategy)
        
        # 🎯 Exécution de la stratégie choisie
        search_engine = AdaptiveSearchEngine()
        results = await search_engine.execute_strategy(optimal_strategy, filters)
        
        execution_time = (time.time() - start_time) * 1000
        
        return PlayerSearchResponse(
            data=results.data,
            meta=SearchMetadata(
                strategy_used=optimal_strategy,
                execution_time_ms=execution_time,
                total_results=len(results.data),
                table_accessed=results.table_used,
                performance_tier=classify_performance(execution_time),
                cache_hit=results.from_cache if hasattr(results, 'from_cache') else False
            ),
            pagination=PaginationInfo(
                current_page=1,
                has_next_page=results.has_more,
                paging_token=results.paging_state
            ) if hasattr(results, 'paging_state') else None
        )
        
    except Exception as e:
        logger.error(f"Search error: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erreur de recherche: {str(e)}"
        )

class PlayerSearchFilters(BaseModel):
    """Modèle Pydantic avec validation automatique"""
    position: Optional[str] = Field(None, regex="^(Goalkeeper|Defender|Midfielder|Forward)$")
    nationality: Optional[str] = Field(None, min_length=2, max_length=50)
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    min_age: Optional[int] = Field(None, ge=15, le=50)
    max_age: Optional[int] = Field(None, ge=15, le=50)
    min_market_value: Optional[int] = Field(None, ge=0)
    max_market_value: Optional[int] = Field(None, ge=0)
    team_name: Optional[str] = Field(None, max_length=100)
    limit: int = Field(50, ge=1, le=500)

class PlayerSearchResponse(BaseModel):
    """Réponse enrichie avec métadonnées performance"""
    data: List[PlayerProfile]
    meta: SearchMetadata
    pagination: Optional[PaginationInfo] = None

class SearchMetadata(BaseModel):
    """Métadonnées pour debugging et optimisation"""
    strategy_used: str
    execution_time_ms: float
    total_results: int
    table_accessed: str
    performance_tier: str        # 'excellent' | 'good' | 'acceptable' | 'slow'
    cache_hit: bool = False

def classify_performance(execution_time_ms: float) -> str:
    """Classification performance pour monitoring"""
    if execution_time_ms < 20:      return 'excellent'  # < 20ms
    elif execution_time_ms < 50:    return 'good'       # 20-50ms  
    elif execution_time_ms < 100:   return 'acceptable' # 50-100ms
    else:                           return 'slow'       # > 100ms
```

### 🎯 **2. Endpoints Spécialisés par Stratégie**

```python
@app.get("/api/players/by-position/{position}",
         summary="Recherche optimisée par position",
         description="Accès direct table players_by_position")
async def get_players_by_position(
    position: str = Path(..., regex="^(Goalkeeper|Defender|Midfielder|Forward)$"),
    limit: int = Query(50, ge=1, le=500),
    offset: Optional[str] = Query(None, description="Token pagination")
) -> PositionSearchResponse:
    """
    🎯 Endpoint spécialisé - accès direct table optimisée
    
    Performance garantie: < 30ms pour toute position
    Usage: Interface tactique, analyse par poste
    """
    
    dao = PlayerDAO()
    
    if offset:  # Pagination
        results = await dao.get_players_by_position_paginated(position, limit, offset)
    else:       # Première page
        results = await dao.get_players_by_position(position, limit)
    
    return PositionSearchResponse(
        position=position,
        players=results.data,
        count=len(results.data),
        execution_time_ms=results.execution_time,
        next_page_token=results.paging_state
    )

@app.get("/api/players/by-nationality/{nationality}",
         summary="Recherche par nationalité",
         description="Optimisé pour sélections nationales")
async def get_players_by_nationality(
    nationality: str = Path(..., min_length=2),
    limit: int = Query(50, ge=1, le=500),
    include_stats: bool = Query(False, description="Inclure statistiques détaillées")
) -> NationalitySearchResponse:
    """
    🌍 Endpoint géographique - idéal pour sélections nationales
    
    Gestion intelligente des hot partitions (Brésil, Allemagne...)
    """
    
    dao = PlayerDAO()
    
    # Détection hot partition
    is_hot_partition = nationality in ['Brazil', 'Germany', 'England', 'France', 'Spain', 'Italy']
    
    if is_hot_partition:
        # Pagination automatique pour éviter timeouts
        results = await dao.get_players_by_nationality_paginated(nationality, limit)
    else:
        # Scan direct pour petits pays
        results = await dao.get_players_by_nationality_direct(nationality, limit)
    
    response_data = {
        'nationality': nationality,
        'players': results.data,
        'count': len(results.data),
        'is_hot_partition': is_hot_partition,
        'execution_time_ms': results.execution_time
    }
    
    # Statistiques optionnelles (coûteuses)
    if include_stats:
        stats = await dao.calculate_nationality_statistics(nationality)
        response_data['statistics'] = stats
    
    return NationalitySearchResponse(**response_data)

@app.get("/api/players/search-name",
         summary="Recherche textuelle par nom",
         description="Autocomplétion et recherche fuzzy")
async def search_players_by_name(
    q: str = Query(..., min_length=1, max_length=50, description="Nom ou préfixe"),
    fuzzy: bool = Query(False, description="Activer recherche approximative"),
    limit: int = Query(20, ge=1, le=100)
) -> NameSearchResponse:
    """
    🔤 Recherche textuelle avancée
    
    - Prefix search: rapide, pour autocomplétion
    - Fuzzy search: plus lent mais tolérant aux fautes
    """
    
    dao = PlayerDAO()
    
    if len(q) >= 3 and not fuzzy:
        # Recherche par préfixe (rapide)
        results = await dao.search_players_by_name_prefix(q, limit)
        search_type = 'prefix'
    else:
        # Recherche fuzzy (plus coûteuse)  
        results = await dao.search_players_by_name_fuzzy(q, limit)
        search_type = 'fuzzy'
    
    return NameSearchResponse(
        query=q,
        search_type=search_type,
        players=results.data,
        count=len(results.data),
        execution_time_ms=results.execution_time,
        suggestions=results.suggestions if hasattr(results, 'suggestions') else []
    )
```

---

## 📊 **Endpoints Données Détaillées**

### 🏆 **3. Profil Joueur Complet**
```python
@app.get("/api/players/{player_id}",
         summary="Profil complet d'un joueur", 
         description="Toutes les données d'un joueur (performances, blessures, transferts...)")
async def get_player_profile(
    player_id: str = Path(..., description="ID unique du joueur"),
    include_sections: List[str] = Query(
        default=['basic', 'performance', 'market_value'], 
        description="Sections à inclure: basic, performance, injuries, transfers, teammates, market_value"
    )
) -> CompletePlayerProfile:
    """
    👤 Profil 360° - Démonstration requêtes multi-tables
    
    Innovation: Agrégation asynchrone de plusieurs tables spécialisées
    """
    
    dao = PlayerDAO()
    
    # Exécution parallèle des requêtes (performance optimale)
    tasks = []
    
    if 'basic' in include_sections:
        tasks.append(dao.get_player_basic_info(player_id))
    
    if 'performance' in include_sections:
        tasks.append(dao.get_player_performances(player_id))
    
    if 'injuries' in include_sections:
        tasks.append(dao.get_player_injuries(player_id))
    
    if 'transfers' in include_sections:
        tasks.append(dao.get_player_transfers(player_id))
    
    if 'teammates' in include_sections:
        tasks.append(dao.get_player_teammates(player_id))
    
    if 'market_value' in include_sections:
        tasks.append(dao.get_player_market_values(player_id))
    
    # Attendre tous les résultats en parallèle
    start_time = time.time()
    results = await asyncio.gather(*tasks, return_exceptions=True)
    execution_time = (time.time() - start_time) * 1000
    
    # Assemblage du profil complet
    profile_data = {}
    
    for i, section in enumerate(include_sections):
        if i < len(results) and not isinstance(results[i], Exception):
            profile_data[section] = results[i]
        else:
            profile_data[section] = None
            if isinstance(results[i], Exception):
                logger.error(f"Error loading {section} for player {player_id}: {results[i]}")
    
    return CompletePlayerProfile(
        player_id=player_id,
        sections=profile_data,
        loaded_sections=include_sections,
        total_execution_time_ms=execution_time,
        timestamp=datetime.utcnow()
    )

@app.get("/api/players/{player_id}/performances",
         summary="Performances détaillées par saison")
async def get_player_performances(
    player_id: str,
    season: Optional[str] = Query(None, regex="^20[0-9]{2}-[0-9]{2}$"),
    competition: Optional[str] = Query(None)
) -> PlayerPerformancesResponse:
    """
    📈 Time-series des performances - Pattern Cassandra optimisé
    """
    
    dao = PlayerDAO()
    
    if season:
        # Requête spécifique à une saison (très rapide)
        performances = await dao.get_player_season_performances(player_id, season, competition)
    else:
        # Toutes les saisons (scan plus large)
        performances = await dao.get_all_player_performances(player_id, competition)
    
    # Calculs d'agrégations côté application
    stats = calculate_performance_statistics(performances)
    
    return PlayerPerformancesResponse(
        player_id=player_id,
        performances=performances,
        aggregated_stats=stats,
        seasons_count=len(set(p.season for p in performances)) if performances else 0
    )
```

### 💰 **4. Données Marché et Transferts**
```python
@app.get("/api/players/{player_id}/market-evolution",
         summary="Évolution valeur marchande", 
         description="Time-series valeur marchande avec tendances")
async def get_market_evolution(
    player_id: str,
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None)
) -> MarketEvolutionResponse:
    """
    💹 Time-series valeur marchande - Pattern Cassandra temporel
    """
    
    dao = PlayerDAO()
    
    # Récupération des données brutes
    market_data = await dao.get_player_market_values(
        player_id, start_date, end_date
    )
    
    if not market_data:
        raise HTTPException(404, "Aucune donnée de marché trouvée")
    
    # Analyse des tendances côté application
    analysis = MarketAnalyzer()
    trends = analysis.calculate_trends(market_data)
    predictions = analysis.predict_next_values(market_data, horizon_months=6)
    
    return MarketEvolutionResponse(
        player_id=player_id,
        data_points=market_data,
        trends=trends,
        predictions=predictions,
        current_value=market_data[-1].value_eur if market_data else None,
        peak_value=max(d.value_eur for d in market_data) if market_data else None,
        value_change_percent=calculate_percentage_change(market_data)
    )

@app.get("/api/players/{player_id}/transfer-history",
         summary="Historique des transferts")
async def get_transfer_history(
    player_id: str,
    include_rumors: bool = Query(False, description="Inclure les rumeurs non confirmées")
) -> TransferHistoryResponse:
    """
    🔄 Historique transferts avec clubs et montants
    """
    
    dao = PlayerDAO()
    transfers = await dao.get_player_transfers(player_id, include_rumors)
    
    # Enrichissement avec données des clubs
    enriched_transfers = []
    for transfer in transfers:
        # Récupération des infos club (parallélisable)
        club_info = await dao.get_team_details(transfer.team_id)
        
        enriched_transfers.append(TransferWithClubInfo(
            **transfer.dict(),
            club_name=club_info.name if club_info else "Unknown",
            club_country=club_info.country if club_info else None,
            club_league=club_info.league if club_info else None
        ))
    
    return TransferHistoryResponse(
        player_id=player_id,
        transfers=enriched_transfers,
        total_transfers=len(enriched_transfers),
        total_value=sum(t.transfer_fee for t in transfers if t.transfer_fee),
        clubs_played_for=len(set(t.team_id for t in transfers))
    )
```

---

## 🏆 **Endpoints Équipes et Analyses**

### ⚽ **5. Données Équipes**
```python
@app.get("/api/teams", 
         summary="Liste des équipes avec filtres")
async def get_teams(
    country: Optional[str] = Query(None),
    league: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200)
) -> TeamsListResponse:
    """
    🏟️ Endpoint équipes avec filtres géographiques
    """
    
    dao = TeamDAO()
    teams = await dao.get_teams_filtered(country, league, limit)
    
    return TeamsListResponse(
        teams=teams,
        total_count=len(teams),
        filters_applied={
            'country': country,
            'league': league
        }
    )

@app.get("/api/teams/{team_id}/squad",
         summary="Effectif complet d'une équipe")
async def get_team_squad(
    team_id: str,
    season: str = Query("2023-24", description="Saison (format: YYYY-YY)"),
    group_by_position: bool = Query(True, description="Grouper par poste")
) -> TeamSquadResponse:
    """
    👥 Effectif équipe - Démonstration requête "équipe → joueurs"
    
    Challenge NoSQL: Requête inverse des joueurs (normalement par joueur)
    Solution: Table dénormalisée team_players
    """
    
    dao = TeamDAO()
    
    # Récupération effectif via table dénormalisée
    squad_members = await dao.get_team_squad(team_id, season)
    
    if group_by_position:
        # Groupement côté application
        grouped_squad = {}
        for player in squad_members:
            position = player.position
            if position not in grouped_squad:
                grouped_squad[position] = []
            grouped_squad[position].append(player)
        
        return TeamSquadResponse(
            team_id=team_id,
            season=season,
            squad_by_position=grouped_squad,
            total_players=len(squad_members),
            average_age=sum(calculate_age(p.birth_date) for p in squad_members) / len(squad_members),
            total_market_value=sum(p.market_value_eur or 0 for p in squad_members)
        )
    else:
        return TeamSquadResponse(
            team_id=team_id,
            season=season,
            squad_list=squad_members,
            total_players=len(squad_members)
        )
```

---

## 📈 **Endpoints Analytics et Statistiques**

### 📊 **6. Analyses Avancées**
```python
@app.get("/api/analytics/position-distribution",
         summary="Distribution des joueurs par poste")
async def get_position_distribution(
    nationality: Optional[str] = Query(None),
    min_market_value: Optional[int] = Query(None)
) -> PositionDistributionResponse:
    """
    📊 Analytics - Requête d'agrégation NoSQL
    
    Démonstration: Comment faire des GROUP BY en NoSQL
    """
    
    dao = AnalyticsDAO()
    
    # Récupération données selon filtres
    if nationality:
        players = await dao.get_players_by_nationality(nationality)
    else:
        # Échantillonnage pour performance (pas tout le dataset)
        players = await dao.get_players_sample(sample_size=10000)
    
    # Agrégation côté application (pattern NoSQL)
    distribution = {}
    for player in players:
        # Filtre valeur marchande si demandé
        if min_market_value and (not player.market_value_eur or player.market_value_eur < min_market_value):
            continue
        
        position = player.position
        if position not in distribution:
            distribution[position] = {
                'count': 0,
                'total_market_value': 0,
                'avg_age': 0,
                'ages': []
            }
        
        distribution[position]['count'] += 1
        distribution[position]['total_market_value'] += player.market_value_eur or 0
        distribution[position]['ages'].append(calculate_age(player.birth_date))
    
    # Calculs finaux
    for position_data in distribution.values():
        if position_data['ages']:
            position_data['avg_age'] = sum(position_data['ages']) / len(position_data['ages'])
        position_data['avg_market_value'] = position_data['total_market_value'] / position_data['count']
        del position_data['ages']  # Nettoyer les données temporaires
    
    return PositionDistributionResponse(
        distribution=distribution,
        total_players=sum(d['count'] for d in distribution.values()),
        filters_applied={'nationality': nationality, 'min_market_value': min_market_value}
    )

@app.get("/api/analytics/market-trends",
         summary="Tendances marché par position/nationalité")
async def get_market_trends(
    groupby: str = Query("position", regex="^(position|nationality|age_group)$"),
    period: str = Query("last_year", regex="^(last_month|last_year|all_time)$")
) -> MarketTrendsResponse:
    """
    📈 Tendances marché - Analyse temporelle NoSQL
    """
    
    dao = AnalyticsDAO()
    
    # Définir la période
    date_filter = get_date_range_for_period(period)
    
    # Récupérer les données de marché
    market_data = await dao.get_market_values_in_period(
        start_date=date_filter['start'],
        end_date=date_filter['end']
    )
    
    # Groupement selon le critère demandé
    trends = {}
    
    for data_point in market_data:
        # Définir la clé de groupement
        if groupby == 'position':
            group_key = data_point.position
        elif groupby == 'nationality':
            group_key = data_point.nationality
        elif groupby == 'age_group':
            age = calculate_age(data_point.birth_date)
            group_key = get_age_group(age)  # "U21", "21-25", "26-30", "30+"
        
        if group_key not in trends:
            trends[group_key] = {
                'values': [],
                'dates': [],
                'player_count': set()
            }
        
        trends[group_key]['values'].append(data_point.value_eur)
        trends[group_key]['dates'].append(data_point.date)
        trends[group_key]['player_count'].add(data_point.player_id)
    
    # Calcul des tendances
    analyzed_trends = {}
    for group, data in trends.items():
        if len(data['values']) >= 2:
            # Régression linéaire simple pour tendance
            trend_coefficient = calculate_trend_coefficient(data['values'], data['dates'])
            
            analyzed_trends[group] = {
                'avg_value': sum(data['values']) / len(data['values']),
                'min_value': min(data['values']),
                'max_value': max(data['values']),
                'trend_direction': 'up' if trend_coefficient > 0 else 'down',
                'trend_strength': abs(trend_coefficient),
                'players_tracked': len(data['player_count']),
                'data_points': len(data['values'])
            }
    
    return MarketTrendsResponse(
        groupby=groupby,
        period=period,
        trends=analyzed_trends,
        total_groups=len(analyzed_trends)
    )
```

---

## ⚙️ **Endpoints Système et Monitoring**

### 🔧 **7. Health Check et Metrics**
```python
@app.get("/api/health", 
         summary="Santé système et performance")
async def health_check() -> HealthCheckResponse:
    """
    ❤️ Health check avec métriques Cassandra
    """
    
    dao = SystemDAO()
    
    # Tests de connectivité Cassandra
    cassandra_status = await dao.test_cassandra_connection()
    
    # Métriques de performance
    performance_metrics = await dao.get_performance_metrics()
    
    # Statistiques des tables
    table_stats = await dao.get_table_statistics()
    
    return HealthCheckResponse(
        status="healthy" if cassandra_status['connected'] else "unhealthy",
        timestamp=datetime.utcnow(),
        cassandra=cassandra_status,
        performance=performance_metrics,
        tables=table_stats,
        version="1.0.0"
    )

@app.get("/api/metrics/query-performance",
         summary="Métriques de performance des requêtes")
async def get_query_metrics(
    last_hours: int = Query(24, ge=1, le=168)
) -> QueryMetricsResponse:
    """
    📊 Métriques détaillées pour optimisation
    """
    
    # Récupération depuis logs ou cache metrics
    metrics_collector = MetricsCollector()
    
    metrics = await metrics_collector.get_query_metrics(
        since=datetime.utcnow() - timedelta(hours=last_hours)
    )
    
    return QueryMetricsResponse(
        period_hours=last_hours,
        total_queries=metrics['total_queries'],
        avg_response_time=metrics['avg_response_time'],
        slowest_queries=metrics['slowest_queries'],
        most_frequent_strategies=metrics['strategy_distribution'],
        error_rate=metrics['error_rate'],
        cache_hit_rate=metrics['cache_hit_rate']
    )

@app.get("/api/debug/strategy-explanation",
         summary="Explication du choix de stratégie")
async def explain_strategy_choice(
    position: Optional[str] = None,
    nationality: Optional[str] = None,
    name: Optional[str] = None
) -> StrategyExplanationResponse:
    """
    🧠 Endpoint pédagogique - pourquoi cette stratégie ?
    """
    
    filters = PlayerSearchFilters(
        position=position,
        nationality=nationality, 
        name=name,
        limit=50
    )
    
    selector = StrategySelector()
    
    # Analyse complète du choix
    analysis = selector.analyze_strategy_choice(filters)
    
    return StrategyExplanationResponse(
        filters=filters.dict(),
        recommended_strategy=analysis['chosen_strategy'],
        reasoning=analysis['reasoning'],
        alternatives=analysis['alternative_strategies'],
        performance_estimates=analysis['performance_estimates'],
        table_usage=analysis['table_usage']
    )
```

---

## 🔗 **Intégration Frontend React**

### ⚛️ **Client API Moderne**
```javascript
// src/api.js - Client API avec gestion erreurs et cache
class FootballAPI {
    constructor(baseURL = 'http://localhost:8000/api') {
        this.baseURL = baseURL;
        this.cache = new Map();
        this.requestId = 0;
    }
    
    // 🔍 Recherche adaptative avec feedback temps réel
    async searchPlayers(filters, onProgress = null) {
        const requestId = ++this.requestId;
        
        try {
            if (onProgress) onProgress({ status: 'starting', requestId });
            
            const response = await fetch(`${this.baseURL}/players/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(filters)
            });
            
            if (onProgress) onProgress({ status: 'processing', requestId });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.detail || 'Erreur de recherche');
            }
            
            if (onProgress) {
                onProgress({ 
                    status: 'completed', 
                    requestId,
                    strategy: data.meta.strategy_used,
                    executionTime: data.meta.execution_time_ms
                });
            }
            
            return {
                players: data.data,
                metadata: data.meta,
                pagination: data.pagination
            };
            
        } catch (error) {
            if (onProgress) onProgress({ status: 'error', requestId, error: error.message });
            throw error;
        }
    }
    
    // 👤 Profil joueur avec cache intelligent
    async getPlayerProfile(playerId, sections = ['basic', 'performance']) {
        const cacheKey = `player-${playerId}-${sections.join(',')}`;
        
        // Cache check (5 minutes)
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < 5 * 60 * 1000) {
                return cached.data;
            }
        }
        
        const params = new URLSearchParams();
        sections.forEach(section => params.append('include_sections', section));
        
        const response = await fetch(
            `${this.baseURL}/players/${playerId}?${params.toString()}`
        );
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.detail || 'Erreur chargement profil');
        }
        
        // Mise en cache
        this.cache.set(cacheKey, {
            data: data,
            timestamp: Date.now()
        });
        
        return data;
    }
    
    // 📊 Analytics avec streaming pour gros datasets
    async getAnalytics(analysisType, filters = {}) {
        const params = new URLSearchParams(filters);
        
        const response = await fetch(
            `${this.baseURL}/analytics/${analysisType}?${params.toString()}`
        );
        
        return await response.json();
    }
}

// Hook React pour intégration
const useFootballAPI = () => {
    const [api] = useState(() => new FootballAPI());
    
    return api;
};

// Composant exemple avec feedback temps réel
const SearchWithFeedback = () => {
    const [searchResults, setSearchResults] = useState(null);
    const [searchProgress, setSearchProgress] = useState(null);
    const [searchMeta, setSearchMeta] = useState(null);
    
    const api = useFootballAPI();
    
    const handleSearch = async (filters) => {
        try {
            const results = await api.searchPlayers(filters, (progress) => {
                setSearchProgress(progress);
                
                if (progress.status === 'completed') {
                    setSearchMeta({
                        strategy: progress.strategy,
                        executionTime: progress.executionTime
                    });
                }
            });
            
            setSearchResults(results.players);
            
        } catch (error) {
            console.error('Erreur de recherche:', error);
        }
    };
    
    return (
        <div>
            <SearchForm onSearch={handleSearch} />
            
            {/* Feedback temps réel */}
            {searchProgress && (
                <SearchProgressIndicator 
                    progress={searchProgress}
                    metadata={searchMeta}
                />
            )}
            
            {/* Résultats */}
            {searchResults && (
                <SearchResults players={searchResults} />
            )}
        </div>
    );
};
```

---

**Cette architecture API moderne démontre l'intégration parfaite entre les patterns NoSQL Cassandra et une interface utilisateur réactive avec feedback temps réel sur les performances.**