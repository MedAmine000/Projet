"""
Test script for Football NoSQL API
Tests the main endpoints and NoSQL patterns
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_endpoint(endpoint, description):
    """Test a single endpoint"""
    print(f"\n🔍 Testing: {description}")
    print(f"   URL: {BASE_URL}{endpoint}")
    
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", timeout=10)
        if response.status_code == 200:
            data = response.json()
            print(f"   ✅ Success: {response.status_code}")
            
            if isinstance(data, dict) and 'items' in data:
                print(f"   📊 Items count: {len(data['items'])}")
                if data.get('pagination_state'):
                    print(f"   📄 Has pagination: Yes")
                else:
                    print(f"   📄 Has pagination: No")
            elif isinstance(data, list):
                print(f"   📊 Items count: {len(data)}")
            else:
                print(f"   📊 Response type: {type(data)}")
                
            return True
        else:
            print(f"   ❌ Failed: {response.status_code} - {response.text}")
            return False
    except Exception as e:
        print(f"   💥 Error: {e}")
        return False

def main():
    """Test all main endpoints"""
    print("🏈 Football NoSQL API Test Suite")
    print("=" * 50)
    
    # Health check
    test_endpoint("/health", "Health Check")
    
    # Player endpoints  
    test_endpoint("/players/profiles?limit=5", "Player Profiles (First 5)")
    test_endpoint("/players/search?q=messi&limit=3", "Player Search (Messi)")
    
    # Team endpoints
    test_endpoint("/teams?limit=5", "Team List (First 5)")
    
    # Market value endpoints
    test_endpoint("/market-values/trends?limit=5", "Market Value Trends")
    
    # Transfer endpoints
    test_endpoint("/transfers/recent?limit=5", "Recent Transfers")
    test_endpoint("/transfers/top/2023?limit=5", "Top Transfers 2023")
    
    # Injury endpoints
    test_endpoint("/injuries/recent?limit=5", "Recent Injuries")
    
    # Performance endpoints  
    test_endpoint("/performances/club/recent?limit=5", "Recent Club Performances")
    
    # NoSQL patterns
    test_endpoint("/demo/pagination", "Pagination Demo")
    test_endpoint("/demo/ttl", "TTL Demo")
    test_endpoint("/demo/tombstones", "Tombstones Demo")
    
    print("\n" + "=" * 50)
    print("🎯 Test Suite Completed!")
    print(f"📋 API Documentation: {BASE_URL}/docs")
    print(f"🌐 Frontend: http://localhost:5173")

if __name__ == "__main__":
    main()