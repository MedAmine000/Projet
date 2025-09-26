"""
Ingestion script for advanced player search tables
Populates players_by_position, players_by_nationality, and players_search_index
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pandas as pd
from cassandra.query import BatchStatement, SimpleStatement
from cassandra import ConsistencyLevel
import logging

import settings
from app.dao import dao
from app.utils import *

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_search_tables():
    """Create the advanced search tables if they don't exist"""
    statements = [
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
        );
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
        );
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
        ) WITH CLUSTERING ORDER BY (player_name_lower ASC, player_id ASC);
        """
    ]
    
    for statement in statements:
        try:
            dao.session.execute(SimpleStatement(statement, consistency_level=ConsistencyLevel.ONE))
            logger.info("Table created successfully")
        except Exception as e:
            logger.warning(f"Table creation warning (may already exist): {e}")

def clean_nationality(nationality):
    """Clean and normalize nationality values"""
    if not nationality or nationality == 'None':
        return 'Unknown'
    
    # Remove any weird characters and normalize
    cleaned = str(nationality).strip()
    
    # Skip entries that look like IDs or contain numbers/special chars
    if any(char.isdigit() for char in cleaned):
        return 'Unknown'
    
    if len(cleaned) < 2 or len(cleaned) > 50:
        return 'Unknown'
        
    # Common problematic values to filter out
    problematic = ['null', 'none', 'n/a', 'na', 'unknown', '']
    if cleaned.lower() in problematic:
        return 'Unknown'
    
    return cleaned

def clean_position(position):
    """Clean and normalize position values"""
    if not position or position == 'None':
        return 'Unknown'
    
    # Common position mappings
    position_map = {
        'Defender': 'Defender',
        'Midfielder': 'Midfielder', 
        'Forward': 'Forward',
        'Goalkeeper': 'Goalkeeper',
        'Centre-Back': 'Defender',
        'Left-Back': 'Defender',
        'Right-Back': 'Defender',
        'Defensive Midfield': 'Midfielder',
        'Central Midfield': 'Midfielder',
        'Attacking Midfield': 'Midfielder',
        'Left Winger': 'Forward',
        'Right Winger': 'Forward',
        'Centre-Forward': 'Forward',
        'Left Midfield': 'Midfielder',
        'Right Midfield': 'Midfielder'
    }
    
    cleaned = str(position).strip()
    return position_map.get(cleaned, cleaned if len(cleaned) < 30 else 'Unknown')

def get_enhanced_player_data():
    """
    Collect player data from multiple sources to create comprehensive search records
    """
    logger.info("Collecting player profiles...")
    
    # Get basic player profiles
    profiles_query = """
    SELECT player_id, player_name, nationality, birth_date, main_position, current_team_id
    FROM player_profiles_by_id
    """
    profiles_result = dao.session.execute(profiles_query)
    
    players_data = []
    
    for row in profiles_result:
        player_data = {
            'player_id': row.player_id,
            'player_name': row.player_name or 'Unknown',
            'nationality': clean_nationality(row.nationality),
            'birth_date': row.birth_date,
            'position': clean_position(row.main_position),
            'team_id': row.current_team_id,
            'team_name': None,
            'market_value_eur': None
        }
        
        # Try to get team name
        if row.current_team_id:
            try:
                team_query = """
                SELECT team_name FROM team_details_by_id WHERE team_id = ?
                """
                team_result = list(dao.session.execute(dao.session.prepare(team_query), (row.current_team_id,)))
                if team_result:
                    player_data['team_name'] = team_result[0].team_name
            except Exception as e:
                logger.debug(f"Could not get team name for {row.current_team_id}: {e}")
        
        # Try to get latest market value
        try:
            market_query = """
            SELECT market_value_eur FROM latest_market_value_by_player WHERE player_id = ?
            """
            market_result = list(dao.session.execute(dao.session.prepare(market_query), (row.player_id,)))
            if market_result:
                player_data['market_value_eur'] = market_result[0].market_value_eur
        except Exception as e:
            logger.debug(f"Could not get market value for {row.player_id}: {e}")
        
        players_data.append(player_data)
    
    logger.info(f"Collected data for {len(players_data)} players")
    return players_data

def ingest_search_tables(players_data):
    """
    Insert player data into the search-optimized tables
    """
    logger.info("Starting ingestion into search tables...")
    
    # Prepare statements
    position_stmt = dao.session.prepare("""
        INSERT INTO players_by_position (position, player_id, player_name, nationality, team_id, team_name, birth_date, market_value_eur)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """)
    
    nationality_stmt = dao.session.prepare("""
        INSERT INTO players_by_nationality (nationality, player_id, player_name, position, team_id, team_name, birth_date, market_value_eur)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """)
    
    search_index_stmt = dao.session.prepare("""
        INSERT INTO players_search_index (search_partition, player_name_lower, player_id, player_name, position, nationality, team_id, team_name, birth_date, market_value_eur)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    """)
    
    # Batch processing
    batch_size = 50
    batch = BatchStatement()
    processed = 0
    
    for player in players_data:
        try:
            # Insert into players_by_position
            batch.add(position_stmt, (
                player['position'],
                player['player_id'],
                player['player_name'],
                player['nationality'],
                player['team_id'],
                player['team_name'],
                player['birth_date'],
                player['market_value_eur']
            ))
            
            # Insert into players_by_nationality  
            batch.add(nationality_stmt, (
                player['nationality'],
                player['player_id'],
                player['player_name'],
                player['position'],
                player['team_id'],
                player['team_name'],
                player['birth_date'],
                player['market_value_eur']
            ))
            
            # Insert into search index
            player_name_lower = player['player_name'].lower() if player['player_name'] else ''
            batch.add(search_index_stmt, (
                'all',  # Fixed partition key
                player_name_lower,
                player['player_id'],
                player['player_name'],
                player['position'],
                player['nationality'],
                player['team_id'],
                player['team_name'],
                player['birth_date'],
                player['market_value_eur']
            ))
            
            processed += 1
            
            # Execute batch when it reaches the limit
            if len(batch) >= batch_size * 3:  # 3 inserts per player
                dao.session.execute(batch)
                batch = BatchStatement()
                logger.info(f"Processed {processed} players...")
                
        except Exception as e:
            logger.error(f"Error processing player {player['player_id']}: {e}")
    
    # Execute remaining batch
    if len(batch) > 0:
        dao.session.execute(batch)
    
    logger.info(f"Successfully ingested {processed} players into search tables")

def verify_ingestion():
    """
    Verify that the ingestion was successful
    """
    logger.info("Verifying ingestion...")
    
    # Count records in each table
    tables = [
        'players_by_position',
        'players_by_nationality', 
        'players_search_index'
    ]
    
    for table in tables:
        try:
            if table == 'players_search_index':
                query = f"SELECT COUNT(*) FROM {table} WHERE search_partition = ?"
                result = dao.session.execute(dao.session.prepare(query), ('all',))
            else:
                # Note: COUNT(*) without WHERE is not recommended in Cassandra for large tables
                # This is just for verification with small datasets
                query = f"SELECT COUNT(*) FROM {table}"
                result = dao.session.execute(query)
            
            count = list(result)[0].count
            logger.info(f"{table}: {count} records")
            
        except Exception as e:
            logger.error(f"Error counting {table}: {e}")

def main():
    """
    Main ingestion function
    """
    try:
        logger.info("Starting advanced search ingestion...")
        
        # Connect to database
        dao.connect()
        
        # Create tables
        create_search_tables()
        
        # Get enhanced player data
        players_data = get_enhanced_player_data()
        
        if not players_data:
            logger.warning("No player data found. Make sure basic ingestion scripts have been run first.")
            return
        
        # Ingest into search tables
        ingest_search_tables(players_data)
        
        # Verify ingestion
        verify_ingestion()
        
        logger.info("Advanced search ingestion completed successfully!")
        
    except Exception as e:
        logger.error(f"Fatal error during ingestion: {e}")
        raise
    finally:
        dao.close()

if __name__ == "__main__":
    main()