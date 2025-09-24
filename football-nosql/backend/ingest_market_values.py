"""
Market values ingestion script
Ingests market value history and maintains latest market values
Demonstrates time-series data and materialized view patterns
"""
import pandas as pd
import sys
import os
import logging
from collections import defaultdict

# Add backend and app to path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_path)
sys.path.append(os.path.join(backend_path, 'app'))

import settings
from app.dao import dao
from app.utils import *

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def ingest_market_values():
    """
    Ingest market value history and determine latest values per player
    """
    logger.info("Starting market values ingestion...")
    
    # Try to load both market value files
    files_to_process = []
    
    # Historical market values
    if os.path.exists(settings.CSV['market_history']):
        files_to_process.append(('history', settings.CSV['market_history']))
    
    # Latest market values
    if os.path.exists(settings.CSV['market_latest']):
        files_to_process.append(('latest', settings.CSV['market_latest']))
    
    if not files_to_process:
        logger.error("No market value CSV files found")
        return
    
    try:
        all_market_data = []
        column_map = settings.MAP['market']
        
        # Load and combine data from all files
        for file_type, file_path in files_to_process:
            logger.info(f"Loading {file_type} market values from {file_path}")
            df = pd.read_csv(file_path)
            logger.info(f"Loaded {len(df)} {file_type} market value records")
            
            for idx, row in df.iterrows():
                # Validate required fields
                if not validate_required_fields(row, column_map, ['player_id', 'date']):
                    continue
                
                player_id = clean_id(safe_get_mapped_column(row, column_map, 'player_id'))
                if not player_id:
                    continue
                
                date_val = parse_date(safe_get_mapped_column(row, column_map, 'date'))
                if not date_val:
                    continue
                
                market_value = to_bigint(safe_get_mapped_column(row, column_map, 'market_value_eur'))
                source = nz(safe_get_mapped_column(row, column_map, 'source'), file_type)
                
                all_market_data.append({
                    'player_id': player_id,
                    'date': date_val,
                    'market_value': market_value,
                    'source': source
                })
        
        logger.info(f"Total market value records to process: {len(all_market_data)}")
        
        # Sort by date for processing
        all_market_data.sort(key=lambda x: x['date'])
        
        # Track latest value per player for materialized view
        latest_values = {}
        
        # Process in batches
        processed = 0
        batch_statements = []
        
        for record in all_market_data:
            # Insert into time-series table
            batch_statements.append((
                'insert_market_value',
                (record['player_id'], record['date'], record['market_value'], record['source'])
            ))
            
            # Track latest value per player
            player_id = record['player_id']
            if player_id not in latest_values or record['date'] > latest_values[player_id]['date']:
                latest_values[player_id] = record
            
            processed += 1
            
            # Execute batch when reaching batch size
            if len(batch_statements) >= settings.BATCH_SIZE:
                dao.execute_batch(batch_statements)
                batch_statements = []
        
        # Execute remaining statements
        if batch_statements:
            dao.execute_batch(batch_statements)
        
        logger.info(f"Successfully ingested {processed} market value records")
        
        # Now insert latest values into materialized view
        logger.info("Updating latest market values...")
        batch_statements = []
        
        for player_id, latest_record in latest_values.items():
            batch_statements.append((
                'upsert_latest_market_value',
                (player_id, latest_record['date'], latest_record['market_value'], latest_record['source'])
            ))
            
            # Execute batch when reaching batch size
            if len(batch_statements) >= settings.BATCH_SIZE:
                dao.execute_batch(batch_statements)
                batch_statements = []
        
        # Execute remaining statements
        if batch_statements:
            dao.execute_batch(batch_statements)
        
        logger.info(f"Successfully updated latest market values for {len(latest_values)} players")
        
    except Exception as e:
        logger.error(f"Error ingesting market values: {e}")
        raise


def main():
    """
    Main ingestion function
    """
    try:
        # Connect to database
        dao.connect()
        
        # Ingest market values
        ingest_market_values()
        
        logger.info("Market values ingestion completed successfully!")
        
    except Exception as e:
        logger.error(f"Market values ingestion failed: {e}")
        sys.exit(1)
    finally:
        dao.close()


if __name__ == "__main__":
    main()