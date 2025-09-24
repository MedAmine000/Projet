"""
Performance data ingestion script
Ingests club and national team performance data
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


def ingest_club_performances():
    """
    Ingest club performance data
    """
    logger.info("Starting club performances ingestion...")
    
    if not os.path.exists(settings.CSV['club_perf']):
        logger.warning(f"Club performances CSV not found: {settings.CSV['club_perf']}")
        return
    
    try:
        df = pd.read_csv(settings.CSV['club_perf'])
        logger.info(f"Loaded {len(df)} club performance records")
        
        column_map = settings.MAP['club_perf']
        processed = 0
        batch_statements = []
        
        for idx, row in df.iterrows():
            # Validate required fields
            if not validate_required_fields(row, column_map, ['player_id', 'season']):
                continue
            
            player_id = clean_id(safe_get_mapped_column(row, column_map, 'player_id'))
            season = nz(safe_get_mapped_column(row, column_map, 'season'))
            
            if not player_id or not season:
                continue
            
            team_id = clean_id(safe_get_mapped_column(row, column_map, 'team_id'))
            matches = to_int(safe_get_mapped_column(row, column_map, 'matches'))
            goals = to_int(safe_get_mapped_column(row, column_map, 'goals'))
            assists = to_int(safe_get_mapped_column(row, column_map, 'assists'))
            minutes = to_int(safe_get_mapped_column(row, column_map, 'minutes'))
            
            # Insert club performance record
            batch_statements.append((
                'insert_club_performance',
                (player_id, season, team_id, matches, goals, assists, minutes)
            ))
            
            processed += 1
            
            # Execute batch when reaching batch size
            if len(batch_statements) >= settings.BATCH_SIZE:
                dao.execute_batch(batch_statements)
                batch_statements = []
        
        # Execute remaining statements
        if batch_statements:
            dao.execute_batch(batch_statements)
        
        logger.info(f"Successfully ingested {processed} club performance records")
        
    except Exception as e:
        logger.error(f"Error ingesting club performances: {e}")
        raise


def ingest_national_performances():
    """
    Ingest national team performance data
    """
    logger.info("Starting national performances ingestion...")
    
    if not os.path.exists(settings.CSV['nat_perf']):
        logger.warning(f"National performances CSV not found: {settings.CSV['nat_perf']}")
        return
    
    try:
        df = pd.read_csv(settings.CSV['nat_perf'])
        logger.info(f"Loaded {len(df)} national performance records")
        
        column_map = settings.MAP['nat_perf']
        processed = 0
        batch_statements = []
        
        for idx, row in df.iterrows():
            # Validate required fields
            if not validate_required_fields(row, column_map, ['player_id', 'season']):
                continue
            
            player_id = clean_id(safe_get_mapped_column(row, column_map, 'player_id'))
            season = nz(safe_get_mapped_column(row, column_map, 'season'))
            
            if not player_id or not season:
                continue
            
            national_team = nz(safe_get_mapped_column(row, column_map, 'national_team'))
            matches = to_int(safe_get_mapped_column(row, column_map, 'matches'))
            goals = to_int(safe_get_mapped_column(row, column_map, 'goals'))
            assists = to_int(safe_get_mapped_column(row, column_map, 'assists'))
            minutes = to_int(safe_get_mapped_column(row, column_map, 'minutes'))
            
            # Insert national performance record
            batch_statements.append((
                'insert_national_performance',
                (player_id, season, national_team, matches, goals, assists, minutes)
            ))
            
            processed += 1
            
            # Execute batch when reaching batch size
            if len(batch_statements) >= settings.BATCH_SIZE:
                dao.execute_batch(batch_statements)
                batch_statements = []
        
        # Execute remaining statements
        if batch_statements:
            dao.execute_batch(batch_statements)
        
        logger.info(f"Successfully ingested {processed} national performance records")
        
    except Exception as e:
        logger.error(f"Error ingesting national performances: {e}")
        raise


def main():
    """
    Main ingestion function - run both club and national performance ingestion
    """
    try:
        # Connect to database
        dao.connect()
        
        # Ingest performance data
        ingest_club_performances()
        ingest_national_performances()
        
        logger.info("Performance data ingestion completed successfully!")
        
    except Exception as e:
        logger.error(f"Performance data ingestion failed: {e}")
        sys.exit(1)
    finally:
        dao.close()


if __name__ == "__main__":
    main()