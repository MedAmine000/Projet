"""
Player profiles ingestion script
Ingests player basic information and creates player-team relationships
"""
import pandas as pd
import sys
import os
import logging

# Add backend and app to path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_path)
sys.path.append(os.path.join(backend_path, 'app'))

import settings
from app.dao import dao
from app.utils import *

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def ingest_player_profiles():
    """
    Ingest player profiles from CSV
    Creates both player_profiles_by_id and players_by_team entries
    """
    logger.info("Starting player profiles ingestion...")
    
    if not os.path.exists(settings.CSV['profiles']):
        logger.error(f"Player profiles CSV not found: {settings.CSV['profiles']}")
        return
    
    try:
        df = pd.read_csv(settings.CSV['profiles'], encoding='utf-8')
        logger.info(f"Loaded {len(df)} player profile records")
        
        column_map = settings.MAP['profiles']
        processed = 0
        batch_statements = []
        
        for idx, row in df.iterrows():
            # Validate required fields (player_id is minimum requirement)
            if not validate_required_fields(row, column_map, ['player_id']):
                continue
            
            player_id = clean_id(safe_get_mapped_column(row, column_map, 'player_id'))
            if not player_id:
                continue
            
            # Extract player data
            player_name = nz(safe_get_mapped_column(row, column_map, 'player_name'))
            nationality = nz(safe_get_mapped_column(row, column_map, 'nationality'), 
                           settings.DEFAULTS.get('nationality', 'Unknown'))
            birth_date = parse_date(safe_get_mapped_column(row, column_map, 'birth_date'))
            height_cm = to_int(safe_get_mapped_column(row, column_map, 'height_cm'))
            preferred_foot = nz(safe_get_mapped_column(row, column_map, 'preferred_foot'))
            main_position = nz(safe_get_mapped_column(row, column_map, 'main_position'),
                              settings.DEFAULTS.get('position', 'N/A'))
            current_team_id = clean_id(safe_get_mapped_column(row, column_map, 'current_team_id'))
            
            # Insert into player_profiles_by_id
            batch_statements.append((
                'insert_player_profile',
                (player_id, player_name, nationality, birth_date, height_cm, 
                 preferred_foot, main_position, current_team_id)
            ))
            
            # If player has a current team, also insert into players_by_team
            if current_team_id:
                batch_statements.append((
                    'insert_player_by_team',
                    (current_team_id, player_id, player_name, main_position, nationality)
                ))
            
            processed += 1
            
            # Execute batch when reaching batch size
            if len(batch_statements) >= settings.BATCH_SIZE:
                dao.execute_batch(batch_statements)
                batch_statements = []
        
        # Execute remaining statements
        if batch_statements:
            dao.execute_batch(batch_statements)
        
        logger.info(f"Successfully ingested {processed} player profiles")
        
    except Exception as e:
        logger.error(f"Error ingesting player profiles: {e}")
        raise


def main():
    """
    Main ingestion function
    """
    try:
        # Connect to database
        dao.connect()
        
        # Ingest player profiles
        ingest_player_profiles()
        
        logger.info("Player profiles ingestion completed successfully!")
        
    except Exception as e:
        logger.error(f"Player profiles ingestion failed: {e}")
        sys.exit(1)
    finally:
        dao.close()


if __name__ == "__main__":
    main()