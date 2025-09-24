"""
Teammates ingestion script
Ingests player-teammate relationships
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


def ingest_teammates():
    """
    Ingest player-teammate relationships
    """
    logger.info("Starting teammates ingestion...")
    
    if not os.path.exists(settings.CSV['teammates']):
        logger.warning(f"Teammates CSV not found: {settings.CSV['teammates']}")
        return
    
    try:
        df = pd.read_csv(settings.CSV['teammates'])
        logger.info(f"Loaded {len(df)} teammate records")
        
        column_map = settings.MAP['teammates']
        processed = 0
        batch_statements = []
        
        for idx, row in df.iterrows():
            # Validate required fields
            if not validate_required_fields(row, column_map, ['player_id', 'teammate_id']):
                continue
            
            player_id = clean_id(safe_get_mapped_column(row, column_map, 'player_id'))
            teammate_id = clean_id(safe_get_mapped_column(row, column_map, 'teammate_id'))
            
            if not player_id or not teammate_id or player_id == teammate_id:
                continue
            
            teammate_name = nz(safe_get_mapped_column(row, column_map, 'teammate_name'))
            matches_together = to_int(safe_get_mapped_column(row, column_map, 'matches_together'))
            
            # Insert teammate relationship
            batch_statements.append((
                'insert_teammate',
                (player_id, teammate_id, teammate_name, matches_together)
            ))
            
            processed += 1
            
            # Execute batch when reaching batch size
            if len(batch_statements) >= settings.BATCH_SIZE:
                dao.execute_batch(batch_statements)
                batch_statements = []
        
        # Execute remaining statements
        if batch_statements:
            dao.execute_batch(batch_statements)
        
        logger.info(f"Successfully ingested {processed} teammate relationships")
        
    except Exception as e:
        logger.error(f"Error ingesting teammates: {e}")
        raise


def main():
    """
    Main ingestion function
    """
    try:
        # Connect to database
        dao.connect()
        
        # Ingest teammates
        ingest_teammates()
        
        logger.info("Teammates ingestion completed successfully!")
        
    except Exception as e:
        logger.error(f"Teammates ingestion failed: {e}")
        sys.exit(1)
    finally:
        dao.close()


if __name__ == "__main__":
    main()