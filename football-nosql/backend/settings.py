"""
Football NoSQL Project Configuration
Handles CSV file mappings, database connection, and tolerant column mapping
"""
import os

# Cassandra connection settings
CASSANDRA_HOSTS = ["127.0.0.1"]
CASSANDRA_PORT = 9042
KEYSPACE = "football"

# Base path for CSV files (relative to project root)
BASE_PATH = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(BASE_PATH, "..", "data")

# CSV file paths (présents dans data/)
CSV = {
    "profiles": os.path.join(DATA_PATH, "player_profiles.csv"),
    "market_latest": os.path.join(DATA_PATH, "player_latest_market_value.csv"),
    "market_history": os.path.join(DATA_PATH, "player_market_value.csv"),
    "injuries": os.path.join(DATA_PATH, "player_injuries.csv"),
    "transfers": os.path.join(DATA_PATH, "transfer_history.csv"),
    "club_perf": os.path.join(DATA_PATH, "player_performances.csv"),
    "nat_perf": os.path.join(DATA_PATH, "player_national_performances.csv"),
    "teammates": os.path.join(DATA_PATH, "player_teammates_played_with.csv"),
    "team_children": os.path.join(DATA_PATH, "team_children.csv"),
    "team_details": os.path.join(DATA_PATH, "team_details.csv"),
    "team_comp_seasons": os.path.join(DATA_PATH, "team_competitions_seasons.csv"),
}

# Frontend CORS origins
FRONTEND_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]

# Column mappings for CSV tolerance (maps expected column -> actual CSV column)
# This allows the code to handle variations in CSV column names
MAP = {
    "profiles": {
        "player_id": "player_id",
        "player_name": "player_name", 
        "nationality": "citizenship",
        "birth_date": "date_of_birth",
        "height_cm": "height",
        "preferred_foot": "foot",
        "main_position": "main_position",
        "current_team_id": "current_club_id"
    },
    "market": {
        "player_id": "player_id",
        "date": "date_unix",
        "market_value_eur": "value",
        "source": "source"
    },
    "injuries": {
        "player_id": "player_id",
        "start_date": "from_date",
        "injury_type": "injury_reason",
        "end_date": "end_date",
        "games_missed": "games_missed"
    },
    "transfers": {
        "player_id": "player_id",
        "transfer_date": "transfer_date",
        "from_team_id": "from_team_id",
        "to_team_id": "to_team_id",
        "fee_eur": "transfer_fee",
        "contract_years": "contract_years",
        "season": "season_name"
    },
    "club_perf": {
        "player_id": "player_id",
        "season": "season_name",
        "team_id": "team_id",
        "matches": "nb_on_pitch",
        "goals": "goals",
        "assists": "assists",
        "minutes": "minutes_played"
    },
    "nat_perf": {
        "player_id": "player_id",
        "season": "career_state", 
        "national_team": "team_id",
        "matches": "matches",
        "goals": "goals",
        "assists": "goals",
        "minutes": "matches"
    },
    "teammates": {
        "player_id": "player_id",
        "teammate_id": "teammate_player_id",
        "teammate_name": "teammate_player_name",
        "matches_together": "ppg_played_with"
    },
    "team_details": {
        "team_id": "club_id",
        "team_name": "club_name",
        "country": "country_name",
        "city": "city",
        "founded": "founded"
    },
    "team_children": {
        "parent_team_id": "parent_team_id",
        "child_team_id": "child_team_id",
        "child_team_name": "child_team_name",
        "relation": "relation"
    },
    "team_comp_seasons": {
        "team_id": "team_id",
        "season": "season",
        "competition": "competition"
    }
}

# Default values for missing or invalid data
DEFAULTS = {
    "position": "N/A",
    "nationality": "Unknown",
    "injury_type": "Unknown",
    "relation": "Related"
}

# Batch sizes for ingestion (NoSQL best practice)
BATCH_SIZE = 50

# Pagination settings
DEFAULT_PAGE_SIZE = 50
MAX_PAGE_SIZE = 100