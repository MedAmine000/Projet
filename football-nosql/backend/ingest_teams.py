"""
Team data ingestion script
Ingests team details, team hierarchies, and competition participations
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


def ingest_team_details():
    """
    Ingest team details from CSV
    """
    logger.info("Starting team details ingestion...")
    
    if not os.path.exists(settings.CSV['team_details']):
        logger.warning(f"Team details CSV not found: {settings.CSV['team_details']}")
        return
    
    try:
        df = pd.read_csv(settings.CSV['team_details'], encoding='utf-8')
        logger.info(f"Loaded {len(df)} team detail records")
        
        column_map = settings.MAP['team_details']
        processed = 0
        batch_statements = []
        
        for idx, row in df.iterrows():
            # Validate required fields
            if not validate_required_fields(row, column_map, ['team_id']):
                continue
            
            team_id = clean_id(safe_get_mapped_column(row, column_map, 'team_id'))
            if not team_id:
                continue
            
            team_name = nz(safe_get_mapped_column(row, column_map, 'team_name'))
            country = nz(safe_get_mapped_column(row, column_map, 'country'))
            city = nz(safe_get_mapped_column(row, column_map, 'city'))
            founded = to_int(safe_get_mapped_column(row, column_map, 'founded'))
            
            # Add to batch
            batch_statements.append((
                'insert_team_details',
                (team_id, team_name, country, city, founded)
            ))
            
            processed += 1
            
            # Execute batch when reaching batch size
            if len(batch_statements) >= settings.BATCH_SIZE:
                dao.execute_batch(batch_statements)
                batch_statements = []
        
        # Execute remaining statements
        if batch_statements:
            dao.execute_batch(batch_statements)
        
        logger.info(f"Successfully ingested {processed} team details")
        
    except Exception as e:
        logger.error(f"Error ingesting team details: {e}")
        raise


def ingest_team_children():
    """
    Ingest team hierarchy (parent-child relationships)
    """
    logger.info("Starting team children ingestion...")
    
    if not os.path.exists(settings.CSV['team_children']):
        logger.warning(f"Team children CSV not found: {settings.CSV['team_children']}")
        return
    
    try:
        df = pd.read_csv(settings.CSV['team_children'])
        logger.info(f"Loaded {len(df)} team children records")
        
        column_map = settings.MAP['team_children']
        processed = 0
        batch_statements = []
        
        for idx, row in df.iterrows():
            # Validate required fields
            if not validate_required_fields(row, column_map, ['parent_team_id', 'child_team_id']):
                continue
            
            parent_team_id = clean_id(safe_get_mapped_column(row, column_map, 'parent_team_id'))
            child_team_id = clean_id(safe_get_mapped_column(row, column_map, 'child_team_id'))
            
            if not parent_team_id or not child_team_id:
                continue
            
            child_team_name = nz(safe_get_mapped_column(row, column_map, 'child_team_name'))
            relation = nz(safe_get_mapped_column(row, column_map, 'relation'), 
                         settings.DEFAULTS.get('relation', 'Related'))
            
            # Add to batch
            batch_statements.append((
                'insert_team_child',
                (parent_team_id, child_team_id, child_team_name, relation)
            ))
            
            processed += 1
            
            # Execute batch when reaching batch size
            if len(batch_statements) >= settings.BATCH_SIZE:
                dao.execute_batch(batch_statements)
                batch_statements = []
        
        # Execute remaining statements
        if batch_statements:
            dao.execute_batch(batch_statements)
        
        logger.info(f"Successfully ingested {processed} team children relationships")
        
    except Exception as e:
        logger.error(f"Error ingesting team children: {e}")
        raise


def ingest_team_competitions():
    """
    Ingest team competition participations by season
    """
    logger.info("Starting team competitions ingestion...")
    
    if not os.path.exists(settings.CSV['team_comp_seasons']):
        logger.warning(f"Team competitions CSV not found: {settings.CSV['team_comp_seasons']}")
        return
    
    try:
        df = pd.read_csv(settings.CSV['team_comp_seasons'])
        logger.info(f"Loaded {len(df)} team competition records")
        
        column_map = settings.MAP['team_comp_seasons']
        processed = 0
        batch_statements = []
        
        for idx, row in df.iterrows():
            # Validate required fields
            if not validate_required_fields(row, column_map, ['team_id', 'season', 'competition']):
                continue
            
            team_id = clean_id(safe_get_mapped_column(row, column_map, 'team_id'))
            season = nz(safe_get_mapped_column(row, column_map, 'season'))
            competition = nz(safe_get_mapped_column(row, column_map, 'competition'))
            
            if not team_id or not season or not competition:
                continue
            
            # Add to batch
            batch_statements.append((
                'insert_team_competition',
                (team_id, season, competition)
            ))
            
            processed += 1
            
            # Execute batch when reaching batch size
            if len(batch_statements) >= settings.BATCH_SIZE:
                dao.execute_batch(batch_statements)
                batch_statements = []
        
        # Execute remaining statements
        if batch_statements:
            dao.execute_batch(batch_statements)
        
        logger.info(f"Successfully ingested {processed} team competition participations")
        
    except Exception as e:
        logger.error(f"Error ingesting team competitions: {e}")
        raise


def main():
    """
    Main ingestion function - run all team-related ingestions
    """
    try:
        # Connect to database
        dao.connect()
        
        # Ingest team data in order
        ingest_team_details()
        ingest_team_children() 
        ingest_team_competitions()
        
        logger.info("Team data ingestion completed successfully!")
        
    except Exception as e:
        logger.error(f"Team ingestion failed: {e}")
        sys.exit(1)
    finally:
        dao.close()


if __name__ == "__main__":
    main()