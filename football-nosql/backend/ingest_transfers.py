"""
Transfers ingestion script
Ingests transfer history and creates pre-aggregated top transfers by season
Demonstrates time-series and pre-aggregation patterns
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


def ingest_transfers():
    """
    Ingest transfer history and create pre-aggregated top transfers by season
    """
    logger.info("Starting transfers ingestion...")
    
    if not os.path.exists(settings.CSV['transfers']):
        logger.error(f"Transfer history CSV not found: {settings.CSV['transfers']}")
        return
    
    try:
        df = pd.read_csv(settings.CSV['transfers'])
        logger.info(f"Loaded {len(df)} transfer records")
        
        column_map = settings.MAP['transfers']
        processed = 0
        batch_statements = []
        
        # Track transfers by season for pre-aggregation
        transfers_by_season = defaultdict(list)
        
        for idx, row in df.iterrows():
            # Validate required fields
            if not validate_required_fields(row, column_map, ['player_id', 'transfer_date']):
                continue
            
            player_id = clean_id(safe_get_mapped_column(row, column_map, 'player_id'))
            if not player_id:
                continue
            
            transfer_date = parse_date(safe_get_mapped_column(row, column_map, 'transfer_date'))
            if not transfer_date:
                continue
            
            from_team_id = clean_id(safe_get_mapped_column(row, column_map, 'from_team_id'))
            to_team_id = clean_id(safe_get_mapped_column(row, column_map, 'to_team_id'))
            fee_eur = to_bigint(safe_get_mapped_column(row, column_map, 'fee_eur'))
            contract_years = to_int(safe_get_mapped_column(row, column_map, 'contract_years'))
            
            # Get season from CSV or extract from date
            season = nz(safe_get_mapped_column(row, column_map, 'season'))
            if not season:
                season = extract_season_from_date(transfer_date)
            
            # Insert into transfers_by_player
            batch_statements.append((
                'insert_transfer',
                (player_id, transfer_date, from_team_id, to_team_id, fee_eur, contract_years)
            ))
            
            # Track for pre-aggregation if we have season and fee
            if season and fee_eur > 0:
                transfers_by_season[season].append({
                    'player_id': player_id,
                    'transfer_date': transfer_date,
                    'from_team_id': from_team_id,
                    'to_team_id': to_team_id,
                    'fee_eur': fee_eur
                })
            
            processed += 1
            
            # Execute batch when reaching batch size
            if len(batch_statements) >= settings.BATCH_SIZE:
                dao.execute_batch(batch_statements)
                batch_statements = []
        
        # Execute remaining statements
        if batch_statements:
            dao.execute_batch(batch_statements)
        
        logger.info(f"Successfully ingested {processed} transfer records")
        
        # Create pre-aggregated top transfers by season
        logger.info("Creating pre-aggregated top transfers by season...")
        batch_statements = []
        total_top_transfers = 0
        
        for season, transfers in transfers_by_season.items():
            # Sort transfers by fee (descending) and take top transfers
            sorted_transfers = sorted(transfers, key=lambda x: (-x['fee_eur'], x['player_id']))
            
            # Insert top transfers for this season (limit to reasonable number)
            for transfer in sorted_transfers[:100]:  # Top 100 per season
                batch_statements.append((
                    'insert_top_transfer',
                    (season, transfer['fee_eur'], transfer['player_id'], 
                     transfer['to_team_id'], transfer['from_team_id'], transfer['transfer_date'])
                ))
                
                total_top_transfers += 1
                
                # Execute batch when reaching batch size
                if len(batch_statements) >= settings.BATCH_SIZE:
                    dao.execute_batch(batch_statements)
                    batch_statements = []
        
        # Execute remaining statements
        if batch_statements:
            dao.execute_batch(batch_statements)
        
        logger.info(f"Successfully created {total_top_transfers} pre-aggregated top transfer records across {len(transfers_by_season)} seasons")
        
    except Exception as e:
        logger.error(f"Error ingesting transfers: {e}")
        raise


def main():
    """
    Main ingestion function
    """
    try:
        # Connect to database
        dao.connect()
        
        # Ingest transfers
        ingest_transfers()
        
        logger.info("Transfers ingestion completed successfully!")
        
    except Exception as e:
        logger.error(f"Transfers ingestion failed: {e}")
        sys.exit(1)
    finally:
        dao.close()


if __name__ == "__main__":
    main()