-- Football NoSQL Database Schema
-- Demonstrates NoSQL best practices: query-oriented modeling, time-series data,
-- pre-aggregations, partition keys, clustering columns, and denormalization

CREATE KEYSPACE IF NOT EXISTS football
WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};

USE football;

-- ========================================
-- A. PLAYER REFERENCE DATA
-- ========================================

-- Player profiles lookup table (partition by player_id for fast access)
CREATE TABLE IF NOT EXISTS player_profiles_by_id (
  player_id text,
  player_name text,
  nationality text,
  birth_date date,
  height_cm int,
  preferred_foot text,
  main_position text,
  current_team_id text,
  PRIMARY KEY (player_id)
);

-- Players grouped by team (navigation pattern - get roster quickly)
CREATE TABLE IF NOT EXISTS players_by_team (
  team_id text,
  player_id text,
  player_name text,
  position text,
  nationality text,
  PRIMARY KEY (team_id, player_id)
);

-- ========================================
-- B. MARKET VALUE TIME-SERIES
-- ========================================

-- Market value history (time-series with DESC clustering for recent-first reads)
CREATE TABLE IF NOT EXISTS market_value_by_player (
  player_id text,
  as_of_date date,
  market_value_eur bigint,
  source text,
  PRIMARY KEY (player_id, as_of_date)
) WITH CLUSTERING ORDER BY (as_of_date DESC);

-- Latest market value (materialized view pattern for fast latest-only reads)
CREATE TABLE IF NOT EXISTS latest_market_value_by_player (
  player_id text,
  as_of_date date,
  market_value_eur bigint,
  source text,
  PRIMARY KEY (player_id)
);

-- ========================================
-- C. TRANSFER HISTORY
-- ========================================

-- Transfer history per player (time-series with DESC clustering)
CREATE TABLE IF NOT EXISTS transfers_by_player (
  player_id text,
  transfer_date date,
  from_team_id text,
  to_team_id text,
  fee_eur bigint,
  contract_years int,
  PRIMARY KEY (player_id, transfer_date)
) WITH CLUSTERING ORDER BY (transfer_date DESC);

-- Pre-aggregated top transfers by season (sorted by fee DESC)
-- Demonstrates pre-aggregation pattern for common queries
CREATE TABLE IF NOT EXISTS top_transfers_by_season (
  season text,
  fee_eur bigint,
  player_id text,
  to_team_id text,
  from_team_id text,
  transfer_date date,
  PRIMARY KEY (season, fee_eur, player_id)
) WITH CLUSTERING ORDER BY (fee_eur DESC, player_id ASC);

-- ========================================
-- D. INJURIES TIME-SERIES
-- ========================================

-- Injury history per player (time-series with DESC clustering)
CREATE TABLE IF NOT EXISTS injuries_by_player (
  player_id text,
  start_date date,
  injury_type text,
  end_date date,
  games_missed int,
  PRIMARY KEY (player_id, start_date)
) WITH CLUSTERING ORDER BY (start_date DESC);

-- ========================================
-- E. PERFORMANCE DATA
-- ========================================

-- Club performances aggregated by player and season
CREATE TABLE IF NOT EXISTS club_performances_by_player_season (
  player_id text,
  season text,
  team_id text,
  matches int,
  goals int,
  assists int,
  minutes int,
  PRIMARY KEY (player_id, season, team_id)
);

-- National team performances by player and season
CREATE TABLE IF NOT EXISTS national_performances_by_player_season (
  player_id text,
  season text,
  national_team text,
  matches int,
  goals int,
  assists int,
  minutes int,
  PRIMARY KEY (player_id, season)
);

-- ========================================
-- F. TEAMMATES RELATIONSHIPS
-- ========================================

-- Teammates navigation (who played with whom)
CREATE TABLE IF NOT EXISTS teammates_by_player (
  player_id text,
  teammate_id text,
  teammate_name text,
  matches_together int,
  PRIMARY KEY (player_id, teammate_id)
);

-- ========================================
-- G. TEAM DATA
-- ========================================

-- Team details lookup
CREATE TABLE IF NOT EXISTS team_details_by_id (
  team_id text,
  team_name text,
  country text,
  city text,
  founded int,
  PRIMARY KEY (team_id)
);

-- Team hierarchy (parent-child relationships like B-teams, youth teams)
CREATE TABLE IF NOT EXISTS team_children_by_parent (
  parent_team_id text,
  child_team_id text,
  child_team_name text,
  relation text,   -- e.g., "B-team", "U19", "Reserve"
  PRIMARY KEY (parent_team_id, child_team_id)
);

-- Team competition participations by season
CREATE TABLE IF NOT EXISTS team_competitions_by_team_season (
  team_id text,
  season text,
  competition text,
  PRIMARY KEY (team_id, season, competition)
);