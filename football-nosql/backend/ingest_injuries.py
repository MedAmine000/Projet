"""
Injuries ingestion script
Ingests player injury history as time-series data
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


def ingest_injuries():
    """
    Ingest player injury history
    """
    logger.info("Starting injuries ingestion...")
    
    if not os.path.exists(settings.CSV['injuries']):
        logger.error(f"Player injuries CSV not found: {settings.CSV['injuries']}")
        return
    
    try:
        df = pd.read_csv(settings.CSV['injuries'])
        logger.info(f"Loaded {len(df)} injury records")
        
        column_map = settings.MAP['injuries']
        processed = 0
        batch_statements = []
        
        for idx, row in df.iterrows():
            # Validate required fields
            if not validate_required_fields(row, column_map, ['player_id', 'start_date']):
                continue
            
            player_id = clean_id(safe_get_mapped_column(row, column_map, 'player_id'))
            if not player_id:
                continue
            
            start_date = parse_date(safe_get_mapped_column(row, column_map, 'start_date'))
            if not start_date:
                continue
            
            injury_type = nz(safe_get_mapped_column(row, column_map, 'injury_type'),
                            settings.DEFAULTS.get('injury_type', 'Unknown'))
            end_date = parse_date(safe_get_mapped_column(row, column_map, 'end_date'))
            games_missed = to_int(safe_get_mapped_column(row, column_map, 'games_missed'))
            
            # Insert injury record
            batch_statements.append((
                'insert_injury',
                (player_id, start_date, injury_type, end_date, games_missed)
            ))
            
            processed += 1
            
            # Execute batch when reaching batch size
            if len(batch_statements) >= settings.BATCH_SIZE:
                dao.execute_batch(batch_statements)
                batch_statements = []
        
        # Execute remaining statements
        if batch_statements:
            dao.execute_batch(batch_statements)
        
        logger.info(f"Successfully ingested {processed} injury records")
        
    except Exception as e:
        logger.error(f"Error ingesting injuries: {e}")
        raise


def main():
    """
    Main ingestion function
    """
    try:
        # Connect to database
        dao.connect()
        
        # Ingest injuries
        ingest_injuries()
        
        logger.info("Injuries ingestion completed successfully!")
        
    except Exception as e:
        logger.error(f"Injuries ingestion failed: {e}")
        sys.exit(1)
    finally:
        dao.close()


if __name__ == "__main__":
    main()