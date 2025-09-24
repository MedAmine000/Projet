"""
Utility functions for data parsing and validation
Handles type conversion, date parsing, and data cleaning
"""
from datetime import datetime, date
from typing import Optional, Any
import pandas as pd


def parse_date(value: Any) -> Optional[date]:
    """
    Parse various date formats into a date object
    Returns None for invalid dates
    """
    if pd.isna(value) or value is None or str(value).strip() == "":
        return None
    
    try:
        # Handle string dates
        if isinstance(value, str):
            value = value.strip()
            # Common date formats
            for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%m/%d/%Y", "%Y", "%d-%m-%Y"]:
                try:
                    return datetime.strptime(value, fmt).date()
                except ValueError:
                    continue
        
        # Handle pandas Timestamp
        elif hasattr(value, 'date'):
            return value.date()
        
        # Handle datetime
        elif isinstance(value, datetime):
            return value.date()
        
        # Handle date
        elif isinstance(value, date):
            return value
            
    except Exception:
        pass
    
    return None


def to_int(value: Any, default: int = 0) -> int:
    """
    Convert value to int with fallback to default
    """
    if pd.isna(value) or value is None:
        return default
    
    try:
        # Handle string conversion
        if isinstance(value, str):
            value = value.strip()
            if not value:
                return default
            # Remove any non-numeric characters except minus sign
            cleaned = ''.join(c for c in value if c.isdigit() or c == '-')
            if not cleaned or cleaned == '-':
                return default
            return int(cleaned)
        
        return int(float(value))  # Handle float strings
    except (ValueError, TypeError):
        return default


def to_bigint(value: Any, default: int = 0) -> int:
    """
    Convert value to bigint (same as int in Python) with fallback to default
    """
    return to_int(value, default)


def nz(value: Any, default: str = "") -> str:
    """
    Null-to-zero equivalent for strings (null to empty string)
    """
    if pd.isna(value) or value is None:
        return default
    
    try:
        result = str(value).strip()
        return result if result else default
    except Exception:
        return default


def clean_id(value: Any) -> Optional[str]:
    """
    Clean and validate ID values
    """
    cleaned = nz(value)
    if not cleaned or cleaned.lower() in ['none', 'null', 'nan', '']:
        return None
    return cleaned


def extract_season_from_date(date_val: Optional[date]) -> Optional[str]:
    """
    Extract season string from date (e.g., 2023-01-15 -> "2022-2023")
    """
    if not date_val:
        return None
    
    year = date_val.year
    # If date is before July, it's likely the second half of the season
    if date_val.month < 7:
        return f"{year-1}-{year}"
    else:
        return f"{year}-{year+1}"


def safe_get_mapped_column(row: pd.Series, column_map: dict, key: str, default: Any = None) -> Any:
    """
    Safely get a mapped column value from a pandas row
    Handles cases where the mapped column doesn't exist
    """
    if key not in column_map:
        return default
    
    mapped_col = column_map[key]
    if mapped_col not in row.index:
        return default
    
    return row[mapped_col]


def validate_required_fields(row: pd.Series, column_map: dict, required_fields: list) -> bool:
    """
    Check if all required fields have non-empty values
    """
    for field in required_fields:
        value = safe_get_mapped_column(row, column_map, field)
        if not value or (isinstance(value, str) and not value.strip()) or pd.isna(value):
            return False
    return True