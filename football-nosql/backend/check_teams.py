#!/usr/bin/env python3
"""
Script pour vérifier les team_id disponibles dans la base de données
"""
import sys
import os

# Add backend to path
backend_path = os.path.dirname(os.path.abspath(__file__))
sys.path.append(backend_path)
sys.path.append(os.path.join(backend_path, 'app'))

from app.dao import dao

def main():
    try:
        print("🔍 Connexion à Cassandra...")
        dao.connect()
        
        print("\n=== 🏆 ÉQUIPES DISPONIBLES (10 premières) ===")
        result = dao.session.execute("SELECT team_id, team_name FROM team_details_by_id LIMIT 10")
        teams = list(result)
        
        if not teams:
            print("❌ Aucune équipe trouvée dans team_details_by_id")
        else:
            for row in teams:
                print(f"Team ID: {row.team_id} - Name: {row.team_name}")
        
        print(f"\n📊 Total équipes dans team_details_by_id: {len(teams)}")
        
        print("\n=== 👥 JOUEURS PAR ÉQUIPE (10 premiers) ===")
        result = dao.session.execute("SELECT team_id, player_id, player_name FROM players_by_team LIMIT 10")
        players = list(result)
        
        if not players:
            print("❌ Aucun joueur trouvé dans players_by_team")
            print("🔧 Problème : Les joueurs n'ont pas été associés aux équipes lors de l'ingestion")
        else:
            for row in players:
                print(f"Team: {row.team_id} - Player: {row.player_name} ({row.player_id})")
        
        print(f"\n📊 Total joueurs dans players_by_team: {len(players)}")
        
        # Test avec une équipe spécifique si on en trouve une
        if teams:
            test_team_id = teams[0].team_id
            print(f"\n🧪 Test avec équipe: {test_team_id}")
            query = dao.session.prepare("SELECT * FROM players_by_team WHERE team_id = ?")
            result = dao.session.execute(query, (test_team_id,))
            team_players = list(result)
            print(f"Joueurs pour {test_team_id}: {len(team_players)}")
            
            if team_players:
                print("✅ Équipe avec joueurs trouvée!")
                for player in team_players[:3]:  # Affiche les 3 premiers
                    print(f"  - {player.player_name}")
            else:
                print("⚠️ Cette équipe n'a pas de joueurs associés")
        
        # Chercher des équipes populaires
        print("\n🔍 Recherche d'équipes connues...")
        popular_teams = ['barcelona', 'madrid', 'manchester', 'liverpool', 'bayern', 'psg', 'juventus']
        
        for team_name in popular_teams:
            query = dao.session.prepare(
                "SELECT team_id, team_name FROM team_details_by_id WHERE team_name LIKE ? LIMIT 5 ALLOW FILTERING"
            )
            result = dao.session.execute(query, (f'%{team_name}%',))
            found_teams = list(result)
            if found_teams:
                print(f"\n🏆 Équipes contenant '{team_name}':")
                for team in found_teams:
                    print(f"  ID: {team.team_id} - Name: {team.team_name}")
                    
                    # Vérifier si cette équipe a des joueurs
                    player_result = dao.session.execute(
                        "SELECT COUNT(*) FROM players_by_team WHERE team_id = ?", 
                        (team.team_id,)
                    )
                    count = player_result.one()
                    if hasattr(count, 'count'):
                        player_count = count.count
                    else:
                        player_count = count[0] if count else 0
                    print(f"    👥 Joueurs: {player_count}")
        
    except Exception as e:
        print(f"❌ Erreur: {e}")
        import traceback
        traceback.print_exc()
    finally:
        dao.close()

if __name__ == "__main__":
    main()