"""
Data Access Object (DAO) for Cassandra operations
Handles connection, keyspace creation, and provides prepared statements
"""
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
from cassandra import ConsistencyLevel
from cassandra.query import BatchStatement, SimpleStatement, PreparedStatement
from cassandra.policies import DCAwareRoundRobinPolicy
import logging
import base64
from typing import Optional, List, Dict, Any, Tuple
import os
import sys

# Add backend to path for imports
backend_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(backend_path)

import settings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CassandraDAO:
    """
    Cassandra Data Access Object
    Manages connection, keyspace setup, and provides query methods
    """
    
    def __init__(self):
        self.cluster = None
        self.session = None
        self.prepared_statements = {}
        
    def connect(self):
        """
        Establish connection to Cassandra cluster and create keyspace if needed
        """
        try:
            # Connect to cluster
            self.cluster = Cluster(
                settings.CASSANDRA_HOSTS,
                port=settings.CASSANDRA_PORT,
                load_balancing_policy=DCAwareRoundRobinPolicy()
            )
            
            self.session = self.cluster.connect()
            logger.info(f"Connected to Cassandra at {settings.CASSANDRA_HOSTS}")
            
            # Create keyspace if it doesn't exist
            self._create_keyspace()
            
            # Use the keyspace
            self.session.set_keyspace(settings.KEYSPACE)
            logger.info(f"Using keyspace: {settings.KEYSPACE}")
            
            # Create tables if they don't exist
            self._create_tables()
            
            # Prepare common statements
            self._prepare_statements()
            
        except Exception as e:
            logger.error(f"Failed to connect to Cassandra: {e}")
            raise
    
    def _create_keyspace(self):
        """
        Create the keyspace if it doesn't exist
        """
        create_keyspace = f"""
        CREATE KEYSPACE IF NOT EXISTS {settings.KEYSPACE}
        WITH replication = {{'class': 'SimpleStrategy', 'replication_factor': 1}}
        """
        self.session.execute(create_keyspace)
        logger.info(f"Keyspace {settings.KEYSPACE} ensured")
    
    def _create_tables(self):
        """
        Create all necessary tables programmatically
        """
        try:
            tables = [
                # Player profiles
                """
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
                )
                """,
                
                # Players by team
                """
                CREATE TABLE IF NOT EXISTS players_by_team (
                  team_id text,
                  player_id text,
                  player_name text,
                  position text,
                  nationality text,
                  PRIMARY KEY (team_id, player_id)
                )
                """,
                
                # Market value time-series
                """
                CREATE TABLE IF NOT EXISTS market_value_by_player (
                  player_id text,
                  as_of_date date,
                  market_value_eur bigint,
                  source text,
                  PRIMARY KEY (player_id, as_of_date)
                ) WITH CLUSTERING ORDER BY (as_of_date DESC)
                """,
                
                # Latest market value
                """
                CREATE TABLE IF NOT EXISTS latest_market_value_by_player (
                  player_id text,
                  as_of_date date,
                  market_value_eur bigint,
                  source text,
                  PRIMARY KEY (player_id)
                )
                """,
                
                # Transfers by player
                """
                CREATE TABLE IF NOT EXISTS transfers_by_player (
                  player_id text,
                  transfer_date date,
                  from_team_id text,
                  to_team_id text,
                  fee_eur bigint,
                  contract_years int,
                  PRIMARY KEY (player_id, transfer_date)
                ) WITH CLUSTERING ORDER BY (transfer_date DESC)
                """,
                
                # Top transfers by season (pre-aggregated)
                """
                CREATE TABLE IF NOT EXISTS top_transfers_by_season (
                  season text,
                  fee_eur bigint,
                  player_id text,
                  to_team_id text,
                  from_team_id text,
                  transfer_date date,
                  PRIMARY KEY (season, fee_eur, player_id)
                ) WITH CLUSTERING ORDER BY (fee_eur DESC, player_id ASC)
                """,
                
                # Injuries by player
                """
                CREATE TABLE IF NOT EXISTS injuries_by_player (
                  player_id text,
                  start_date date,
                  injury_type text,
                  end_date date,
                  games_missed int,
                  PRIMARY KEY (player_id, start_date)
                ) WITH CLUSTERING ORDER BY (start_date DESC)
                """,
                
                # Club performances
                """
                CREATE TABLE IF NOT EXISTS club_performances_by_player_season (
                  player_id text,
                  season text,
                  team_id text,
                  matches int,
                  goals int,
                  assists int,
                  minutes int,
                  PRIMARY KEY (player_id, season)
                )
                """,
                
                # National performances
                """
                CREATE TABLE IF NOT EXISTS national_performances_by_player_season (
                  player_id text,
                  season text,
                  national_team text,
                  matches int,
                  goals int,
                  assists int,
                  minutes int,
                  PRIMARY KEY (player_id, season)
                )
                """,
                
                # Team details
                """
                CREATE TABLE IF NOT EXISTS team_details_by_id (
                  team_id text,
                  team_name text,
                  country text,
                  city text,
                  founded int,
                  PRIMARY KEY (team_id)
                )
                """,
                
                # Team children
                """
                CREATE TABLE IF NOT EXISTS team_children_by_parent (
                  parent_team_id text,
                  child_team_id text,
                  child_team_name text,
                  relation text,
                  PRIMARY KEY (parent_team_id, child_team_id)
                )
                """,
                
                # Team competitions
                """
                CREATE TABLE IF NOT EXISTS team_competitions_by_team_season (
                  team_id text,
                  season text,
                  competition text,
                  PRIMARY KEY (team_id, season, competition)
                )
                """,
                
                # Teammates
                """
                CREATE TABLE IF NOT EXISTS teammates_by_player (
                  player_id text,
                  teammate_id text,
                  teammate_name text,
                  matches_together int,
                  PRIMARY KEY (player_id, teammate_id)
                )
                """,
                
                # Advanced search tables
                """
                CREATE TABLE IF NOT EXISTS players_by_position (
                  position text,
                  player_id text,
                  player_name text,
                  nationality text,
                  team_id text,
                  team_name text,
                  birth_date date,
                  market_value_eur bigint,
                  PRIMARY KEY (position, player_id)
                )
                """,
                
                """
                CREATE TABLE IF NOT EXISTS players_by_nationality (
                  nationality text,
                  player_id text,
                  player_name text,
                  position text,
                  team_id text,
                  team_name text,
                  birth_date date,
                  market_value_eur bigint,
                  PRIMARY KEY (nationality, player_id)
                )
                """,
                
                """
                CREATE TABLE IF NOT EXISTS players_search_index (
                  search_partition text,
                  player_name_lower text,
                  player_id text,
                  player_name text,
                  position text,
                  nationality text,
                  team_id text,
                  team_name text,
                  birth_date date,
                  market_value_eur bigint,
                  PRIMARY KEY (search_partition, player_name_lower, player_id)
                ) WITH CLUSTERING ORDER BY (player_name_lower ASC, player_id ASC)
                """
            ]
            
            for table in tables:
                try:
                    self.session.execute(table.strip())
                except Exception as e:
                    logger.warning(f"Table creation warning: {e}")
            
            logger.info("Database schema created successfully")
            
        except Exception as e:
            logger.error(f"Error creating tables: {e}")
            raise
    
    def _prepare_statements(self):
        """
        Prepare commonly used SQL statements for better performance
        """
        statements = {
            # Player profiles
            'get_player_profile': """
                SELECT player_id, player_name, nationality, birth_date, height_cm, 
                       preferred_foot, main_position, current_team_id
                FROM player_profiles_by_id 
                WHERE player_id = ?
            """,
            
            'get_market_history': """
                SELECT as_of_date, market_value_eur, source
                FROM market_value_by_player 
                WHERE player_id = ?
            """,
            
            'insert_player_profile': """
                INSERT INTO player_profiles_by_id 
                (player_id, player_name, nationality, birth_date, height_cm, preferred_foot, main_position, current_team_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            
            'insert_player_by_team': """
                INSERT INTO players_by_team 
                (team_id, player_id, player_name, position, nationality)
                VALUES (?, ?, ?, ?, ?)
            """,
            
            # Market values
            'insert_market_value': """
                INSERT INTO market_value_by_player 
                (player_id, as_of_date, market_value_eur, source)
                VALUES (?, ?, ?, ?)
            """,
            
            'insert_market_value_ttl': """
                INSERT INTO market_value_by_player 
                (player_id, as_of_date, market_value_eur, source)
                VALUES (?, ?, ?, ?) USING TTL ?
            """,
            
            'upsert_latest_market_value': """
                INSERT INTO latest_market_value_by_player 
                (player_id, as_of_date, market_value_eur, source)
                VALUES (?, ?, ?, ?)
            """,
            
            # Transfers
            'insert_transfer': """
                INSERT INTO transfers_by_player 
                (player_id, transfer_date, from_team_id, to_team_id, fee_eur, contract_years)
                VALUES (?, ?, ?, ?, ?, ?)
            """,
            
            'insert_top_transfer': """
                INSERT INTO top_transfers_by_season 
                (season, fee_eur, player_id, to_team_id, from_team_id, transfer_date)
                VALUES (?, ?, ?, ?, ?, ?)
            """,
            
            # Injuries
            'insert_injury': """
                INSERT INTO injuries_by_player 
                (player_id, start_date, injury_type, end_date, games_missed)
                VALUES (?, ?, ?, ?, ?)
            """,
            
            'insert_injury_ttl': """
                INSERT INTO injuries_by_player 
                (player_id, start_date, injury_type, end_date, games_missed)
                VALUES (?, ?, ?, ?, ?) USING TTL ?
            """,
            
            'delete_injury': """
                DELETE FROM injuries_by_player 
                WHERE player_id = ? AND start_date = ?
            """,
            
            # Performances
            'insert_club_performance': """
                INSERT INTO club_performances_by_player_season 
                (player_id, season, team_id, matches, goals, assists, minutes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            
            'insert_national_performance': """
                INSERT INTO national_performances_by_player_season 
                (player_id, season, national_team, matches, goals, assists, minutes)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            
            # Teams
            'insert_team_details': """
                INSERT INTO team_details_by_id 
                (team_id, team_name, country, city, founded)
                VALUES (?, ?, ?, ?, ?)
            """,
            
            'insert_team_child': """
                INSERT INTO team_children_by_parent 
                (parent_team_id, child_team_id, child_team_name, relation)
                VALUES (?, ?, ?, ?)
            """,
            
            'insert_team_competition': """
                INSERT INTO team_competitions_by_team_season 
                (team_id, season, competition)
                VALUES (?, ?, ?)
            """,
            
            # Teammates
            'insert_teammate': """
                INSERT INTO teammates_by_player 
                (player_id, teammate_id, teammate_name, matches_together)
                VALUES (?, ?, ?, ?)
            """,
            
            # Advanced search tables
            'insert_player_by_position': """
                INSERT INTO players_by_position 
                (position, player_id, player_name, nationality, team_id, team_name, birth_date, market_value_eur)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            
            'insert_player_by_nationality': """
                INSERT INTO players_by_nationality 
                (nationality, player_id, player_name, position, team_id, team_name, birth_date, market_value_eur)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            
            'insert_player_search_index': """
                INSERT INTO players_search_index 
                (search_partition, player_name_lower, player_id, player_name, position, nationality, team_id, team_name, birth_date, market_value_eur)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
        }
        
        for name, stmt in statements.items():
            try:
                self.prepared_statements[name] = self.session.prepare(stmt)
            except Exception as e:
                logger.error(f"Failed to prepare statement {name}: {e}")
        
        logger.info(f"Prepared {len(self.prepared_statements)} statements")
    
    def execute_batch(self, statements_with_params: List[Tuple[str, tuple]]) -> None:
        """
        Execute multiple statements in a batch for better performance
        
        Args:
            statements_with_params: List of (statement_name, params) tuples
        """
        if not statements_with_params:
            return
            
        batch = BatchStatement(consistency_level=ConsistencyLevel.LOCAL_QUORUM)
        
        for stmt_name, params in statements_with_params:
            if stmt_name in self.prepared_statements:
                batch.add(self.prepared_statements[stmt_name], params)
        
        if batch._statements_and_parameters:
            self.session.execute(batch)
    
    def execute_statement(self, stmt_name: str, params: tuple) -> Any:
        """
        Execute a single prepared statement
        """
        if stmt_name in self.prepared_statements:
            return self.session.execute(self.prepared_statements[stmt_name], params)
        else:
            raise ValueError(f"Unknown prepared statement: {stmt_name}")
    
    def get_paginated_results(self, query: str, params: tuple = None, 
                            page_size: int = settings.DEFAULT_PAGE_SIZE,
                            paging_state: str = None) -> Tuple[List[Any], Optional[str]]:
        """
        Execute a paginated query and return results with next page token
        
        Returns:
            Tuple of (results_list, next_paging_state_base64_or_none)
        """
        # Prepare statement for better performance and correct parameter handling
        prepared_stmt = self.session.prepare(query)
        prepared_stmt.fetch_size = page_size
        
        # Decode paging state if provided
        decoded_paging_state = None
        if paging_state:
            try:
                decoded_paging_state = base64.b64decode(paging_state)
            except Exception:
                logger.warning(f"Invalid paging state: {paging_state}")
        
        # Execute with paging state
        if params:
            result = self.session.execute(prepared_stmt, params, paging_state=decoded_paging_state)
        else:
            result = self.session.execute(prepared_stmt, paging_state=decoded_paging_state)
        
        # Convert to list
        rows = list(result.current_rows)
        
        # Encode next paging state if available
        next_paging_state = None
        if result.paging_state:
            next_paging_state = base64.b64encode(result.paging_state).decode('utf-8')
        
        return rows, next_paging_state
    
    def close(self):
        """
        Close the connection
        """
        if self.cluster:
            self.cluster.shutdown()
            logger.info("Cassandra connection closed")


# Global DAO instance
dao = CassandraDAO()