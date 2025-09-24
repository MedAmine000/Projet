# Projet Football NoSQL

Application complète de démonstration des meilleure### 8. **Clés de Partition Composites**
- **Accès Multi-Dimensionnel** : Top transferts basés sur les saisons
- **Filtrage Efficace** : Compétitions d'équipe par équipe et saison
- **Flexibilité des Requêtes** : Support pour différents modèles d'accès

### 9. **Recherche Textuelle et Filtrage**
- **Recherche par Nom** : Fonctionnalité d'autocomplétion pour la recherche d'équipes
- **Filtrage Côté Application** : Alternative aux index secondaires pour des datasets de taille moyenne
- **Optimisation des Performances** : Balance entre flexibilité de recherche et performance Cassandra
- **Interface Utilisateur** : Amélioration de l'expérience utilisateur avec des suggestions en temps réelatiques NoSQL utilisant Cassandra avec des données de football. Ce projet illustre la modélisation de données time-series, la pagination, les TTL, les tombstones, la pré-agrégation et d'autres concepts clés du NoSQL.

## Structure du Projet

```
football-nosql/
├── data/                               # Fichiers CSV de données (lien vers ../data/)
├── backend/
│   ├── requirements.txt                # Dépendances Python
│   ├── settings.py                     # Configuration et mappages CSV
│   ├── schema.cql                      # Schéma de base de données Cassandra
│   ├── ingest_teams.py                 # Ingestion des données d'équipes
│   ├── ingest_player_profiles.py       # Ingestion des profils de joueurs
│   ├── ingest_market_values.py         # Ingestion des valeurs marchandes
│   ├── ingest_transfers.py             # Ingestion de l'historique des transferts
│   ├── ingest_injuries.py              # Ingestion des données de blessures
│   ├── ingest_performances.py          # Ingestion des données de performance
│   ├── ingest_teammates.py             # Ingestion des relations entre coéquipiers
│   └── app/
│       ├── __init__.py
│       ├── dao.py                      # Objet d'Accès aux Données
│       ├── main.py                     # Application FastAPI
│       └── utils.py                    # Fonctions utilitaires
└── frontend/
    ├── index.html                      # Point d'entrée HTML
    ├── package.json                    # Dépendances NPM
    ├── vite.config.js                  # Configuration Vite
    └── src/
        ├── main.jsx                    # Point d'entrée React
        ├── App.jsx                     # Composant React principal
        ├── api.js                      # Client API
        ├── styles.css                  # Styles de l'application
        └── components/
            ├── TeamPicker.jsx          # Composant de sélection d'équipe avec recherche intelligente
            ├── PlayersList.jsx         # Affichage de l'effectif d'équipe
            ├── PlayerProfile.jsx       # Informations de base du joueur
            ├── PlayerMarketValues.jsx  # Historique des valeurs marchandes avec pagination
            ├── PlayerTransfers.jsx     # Historique des transferts et top transferts
            ├── PlayerInjuries.jsx      # Historique des blessures avec démos TTL/DELETE
            ├── PlayerPerformances.jsx  # Statistiques de performance club et nationale
            └── Teammates.jsx           # Relations entre joueurs
```

## Concepts NoSQL Démontrés

### 1. **Modélisation Orientée Requête**
- **Clés de Partition** : `player_id`, `team_id` pour des recherches rapides par joueur/équipe
- **Colonnes de Clustering** : `as_of_date DESC`, `transfer_date DESC` pour l'ordonnancement time-series
- **Dénormalisation** : Noms des joueurs dupliqués dans plusieurs tables pour éviter les JOINs

### 2. **Modèles de Données Time-Series**
- **Valeurs Marchandes** : Données historiques avec ordonnancement récent-en-premier
- **Transferts** : Historique des transferts des joueurs avec clustering par date descendante
- **Blessures** : Dossiers médicaux avec clustering par date de début
- **Performances** : Agrégations de performances basées sur les saisons

### 3. **Pagination avec paging_state**
- **Navigation Efficace** : Gestion des grands datasets avec la pagination basée sur tokens de Cassandra
- **Encodage Base64** : Tokens d'état de pagination encodés pour un transport URL sécurisé
- **Sans État** : Aucun suivi de curseur côté serveur requis

### 4. **Pré-Agrégation**
- **Top Transferts par Saison** : Classements pré-calculés triés par montant
- **Vues Matérialisées** : Dernières valeurs marchandes maintenues séparément
- **Résumés de Performance** : Statistiques saisonnières pré-agrégées pour un affichage rapide

### 5. **TTL (Time To Live)**
- **Données Temporaires** : Enregistrements qui expirent automatiquement pour la conformité de confidentialité
- **Fonctionnalités de Démo** : Les valeurs marchandes et blessures peuvent être ajoutées avec TTL
- **Cas d'Usage** : Dossiers médicaux temporaires, données en cache, informations de session

### 6. **Tombstones et Opérations DELETE**
- **Démo DELETE** : Les enregistrements de blessures peuvent être supprimés pour montrer la création de tombstones
- **Impact sur les Performances** : Avertissements sur l'accumulation de tombstones
- **Meilleures Pratiques** : Préférer TTL à DELETE pour les données temporaires

### 7. **Clés de Partition Composites**
- **Accès Multi-Dimensionnel** : Top transferts basés sur les saisons
- **Filtrage Efficace** : Compétitions d'équipe par équipe et saison
- **Flexibilité des Requêtes** : Support pour différents modèles d'accès

## Prérequis

- **Windows 10/11** avec PowerShell
- **Python 3.8+** installé et accessible depuis la ligne de commande
- **Cassandra 4.1+** fonctionnant sur `127.0.0.1:9042` (via WSL ou natif)
- **Node.js 16+** pour le développement frontend
- **Git** pour le clonage (si nécessaire)

### Configuration Cassandra (WSL)
```bash
# Dans WSL Ubuntu
sudo apt update
sudo apt install openjdk-11-jdk
wget https://downloads.apache.org/cassandra/4.1.3/apache-cassandra-4.1.3-bin.tar.gz
tar -xzf apache-cassandra-4.1.3-bin.tar.gz
cd apache-cassandra-4.1.3
sudo ./bin/cassandra -f
```

## Installation et Configuration

### 1. Installer les Dépendances Python
```powershell
# Naviguer vers le répertoire du projet
cd "C:\M1_IPSSI_Korniti\DB_NOSql\Projet\football-nosql"

# Installer les packages Python (installation utilisateur globale)
python -m pip install --user --upgrade pip
python -m pip install --user -r backend/requirements.txt
```

### 2. Créer le Schéma de Base de Données
```powershell
# Option 1 : Utiliser cqlsh (si disponible)
cqlsh -f backend/schema.cql

# Option 2 : Laisser le backend créer automatiquement le schéma (recommandé)
# Le DAO créera le keyspace et les tables à la première connexion
```

### 3. Ingérer les Données
Exécuter les scripts d'ingestion dans l'ordre recommandé :

```powershell
# Données d'équipes en premier (requis pour les relations joueur-équipe)
python backend/ingest_teams.py

# Profils des joueurs (crée à la fois les entrées de profil et d'effectif d'équipe)
python backend/ingest_player_profiles.py

# Valeurs marchandes (crée l'historique et les dernières tables de valeurs)
python backend/ingest_market_values.py

# Transferts (crée l'historique et les top transferts pré-agrégés)
python backend/ingest_transfers.py

# Blessures (données médicales time-series)
python backend/ingest_injuries.py

# Données de performance (statistiques de club et d'équipe nationale)
python backend/ingest_performances.py

# Relations entre coéquipiers
python backend/ingest_teammates.py
```

### 4. Démarrer l'API Backend
```powershell
# Démarrer le serveur FastAPI avec rechargement automatique
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000

# Tester le point de contrôle de santé
# Naviguer vers http://127.0.0.1:8000/health
```

### 5. Installer et Démarrer le Frontend
```powershell
# Naviguer vers le répertoire frontend
cd frontend

# Installer les dépendances
npm install

# Démarrer le serveur de développement
npm run dev

# Le frontend sera disponible sur http://127.0.0.1:5173
```

## Utilisation de l'Application

### 1. **Sélection d'Équipe**
- **Deux modes de recherche** disponibles dans la barre latérale :
  - **Par ID** : Entrer directement l'ID d'une équipe (mode classique)
  - **Par nom** : Taper le nom d'une équipe avec autocomplétion intelligente
- **Autocomplétion** : Recherche en temps réel avec suggestions cliquables
- **Interface intuitive** : Basculer entre les modes de recherche selon vos préférences
- L'application chargera tous les joueurs de l'équipe sélectionnée
- Utilise la table `players_by_team` avec team_id comme clé de partition

### 2. **Navigation des Joueurs**
- Cliquer sur n'importe quel joueur pour le sélectionner
- Les données du joueur sont chargées depuis plusieurs tables simultanément
- Démontre les recherches de partition unique et les requêtes parallèles

### 3. **Onglet Valeurs Marchandes**
- **Historique** : Liste paginée avec fonctionnalité "Charger Plus"
- **Ajouter Valeur** : Formulaire avec démonstration TTL optionnelle
- **Pagination** : Utilise les tokens paging_state de Cassandra
- **Démo TTL** : Ajouter des enregistrements temporaires qui expirent automatiquement

### 4. **Onglet Transferts**
- **Historique du Joueur** : Enregistrements de transferts time-series
- **Top Transferts** : Classements saisonniers pré-agrégés
- **Ajouter Transfert** : Créer de nouveaux transferts avec saison optionnelle pour pré-agrégation
- **Filtre de Saison** : Basculer entre les top transferts de différentes saisons

### 5. **Onglet Blessures**
- **Time-Series** : Dossiers médicaux ordonnés par date
- **Ajouter Blessure** : Formulaire avec option TTL pour données médicales temporaires
- **Démo DELETE** : Montre la création de tombstones (à utiliser avec précaution)
- **Suivi du Statut** : Statut de blessure active vs récupérée

### 6. **Onglet Performances**
- **Club vs National** : Onglets séparés pour différents types de performances
- **Filtrage par Saison** : Voir des saisons spécifiques ou toutes les statistiques
- **Statistiques Agrégées** : Totaux et moyennes pré-calculés
- **Métriques Multiples** : Buts, passes décisives, minutes, ratios d'efficacité

### 7. **Onglet Coéquipiers**
- **Données de Relation** : Joueurs qui ont joué ensemble
- **Options de Tri** : Par matchs joués ensemble ou alphabétique
- **Analyse de Partenariat** : Top partenariats avec indicateurs visuels
- **Statistiques** : Total des matchs et pourcentages de partenariat

## Points de Terminaison API

### Santé et Informations de Base
- `GET /health` - Contrôle de santé
- `GET /players/by-team/{team_id}` - Effectif d'équipe

### Données des Joueurs
- `GET /player/{player_id}/profile` - Profil du joueur
- `GET /player/{player_id}/market/latest` - Dernière valeur marchande
- `GET /player/{player_id}/market/history` - Historique paginé des valeurs marchandes
- `POST /player/{player_id}/market/add` - Ajouter valeur marchande (avec TTL)

### Transferts
- `GET /player/{player_id}/transfers` - Historique des transferts du joueur
- `GET /transfers/top/{season}` - Top transferts par saison
- `POST /player/{player_id}/transfer/add` - Ajouter transfert

### Blessures
- `GET /player/{player_id}/injuries` - Historique des blessures
- `POST /player/{player_id}/injuries/add` - Ajouter blessure (avec TTL)
- `DELETE /player/{player_id}/injuries?start_date=YYYY-MM-DD` - Supprimer blessure (tombstone)

### Données de Performance
- `GET /player/{player_id}/club-perf?season=YYYY-YYYY` - Performances de club
- `GET /player/{player_id}/nat-perf?season=YYYY-YYYY` - Performances d'équipe nationale

### Relations et Équipes
- `GET /player/{player_id}/teammates` - Relations entre coéquipiers
- `GET /team/{team_id}/details` - Informations sur l'équipe
- `GET /team/{team_id}/children` - Hiérarchie d'équipe
- `GET /team/{team_id}/competitions?season=YYYY-YYYY` - Compétitions d'équipe

### Recherche d'Équipes
- `GET /teams/search?q={query}&limit={limit}` - Recherche d'équipes par nom avec autocomplétion

## Points Forts du Schéma de Base de Données

### Tables Principales
```sql
-- Recherche de joueur (partition par player_id)
player_profiles_by_id (player_id, player_name, nationality, ...)

-- Effectif d'équipe (partition par team_id) 
players_by_team (team_id, player_id, player_name, position, nationality)

-- Valeurs marchandes time-series (clustered DESC par date)
market_value_by_player (player_id, as_of_date DESC, market_value_eur, source)

-- Modèle de vue matérialisée pour les dernières valeurs
latest_market_value_by_player (player_id, as_of_date, market_value_eur, source)

-- Top transferts pré-agrégés (partition par saison, clustered par fee DESC)
top_transfers_by_season (season, fee_eur DESC, player_id, ...)
```

### Principes de Conception Clés
1. **Clés de Partition** : Choisir basé sur les modèles de requête les plus courants
2. **Colonnes de Clustering** : Ordonner les données pour des requêtes de plage efficaces
3. **Dénormalisation** : Dupliquer les données entre tables pour l'optimisation des requêtes
4. **Pré-Agrégation** : Calculer les opérations coûteuses au moment de l'écriture
5. **Support TTL** : Permettre l'expiration automatique des données
6. **Pas de JOINs** : Chaque table répond indépendamment à des questions spécifiques

## Notes Importantes

### Avertissement Tombstones
- **Les opérations DELETE créent des tombstones** - des marqueurs qui peuvent impacter les performances de lecture
- **Utiliser TTL à la place** pour les données temporaires qui doivent disparaître
- **Surveiller les ratios de tombstones** dans les environnements de production
- **La compaction gère le nettoyage** mais les tombstones persistent jusqu'à gc_grace_seconds

### Considérations de Production
1. **Facteur de Réplication** : Utiliser RF=3 pour la production (actuellement RF=1 pour le développement)
2. **Niveaux de Cohérence** : Considérer LOCAL_QUORUM pour les écritures, LOCAL_ONE pour les lectures
3. **Surveillance** : Suivre les tailles de partitions, ratios de tombstones, latences lecture/écriture
4. **Stratégie de Sauvegarde** : Snapshots réguliers et sauvegardes incrémentielles
5. **Compaction** : Surveiller et ajuster les stratégies de compaction
6. **Recherche Textuelle** : Pour de gros datasets, considérer des solutions spécialisées (Elasticsearch, Solr) plutôt que le filtrage côté application

### Meilleures Pratiques d'Ingestion de Données
1. **Taille de Lot** : 50-100 instructions par lot (configuré dans settings.py)
2. **Instructions Préparées** : Toute l'ingestion utilise des instructions préparées pour les performances
3. **Gestion d'Erreurs** : Gestion élégante des données malformées avec journalisation
4. **Idempotence** : Ré-exécuter les scripts d'ingestion est sûr (upserts)

## Dépannage

### Problèmes Courants

1. **Échec de Connexion Cassandra**
   ```
   Erreur : NoHostAvailable
   Solution : S'assurer que Cassandra fonctionne sur 127.0.0.1:9042
   ```

2. **Module d'Import Non Trouvé**
   ```
   Erreur : ModuleNotFoundError: No module named 'cassandra'
   Solution : Exécuter pip install --user -r backend/requirements.txt
   ```

3. **Fichier CSV Non Trouvé**
   ```
   Erreur : FileNotFoundError
   Solution : S'assurer que le dossier data/ contient tous les fichiers CSV requis
   ```

4. **Erreurs API Frontend**
   ```
   Erreur : CORS ou connexion refusée
   Solution : S'assurer que le backend fonctionne sur le port 8000
   ```

### Conseils de Performance

1. **Grands Datasets** : Utiliser la pagination pour l'historique des valeurs marchandes
2. **Efficacité des Requêtes** : Éviter les scans complets de table, utiliser les clés de partition
3. **Utilisation Mémoire** : Surveiller la taille du heap JVM pour Cassandra
4. **Réseau** : Garder le client et Cassandra sur le même réseau pour de meilleures performances

## Ressources d'Apprentissage

### NoSQL & Cassandra
- [Documentation Cassandra](https://cassandra.apache.org/doc/)
- [DataStax Academy](https://academy.datastax.com/)
- [Modèles NoSQL](https://highlyscalable.wordpress.com/2012/03/01/nosql-data-modeling-techniques/)

### Technologies du Projet
- [Documentation FastAPI](https://fastapi.tiangolo.com/)
- [Documentation React](https://react.dev/)
- [Documentation Vite](https://vitejs.dev/)

## Objectifs Pédagogiques Atteints

 **Modélisation Time-Series** : Valeurs marchandes, transferts, blessures avec clustering approprié  
 **Pagination** : Pagination basée sur tokens avec paging_state  
 **Pré-Agrégation** : Classements des top transferts par saison  
 **Démonstration TTL** : Données temporaires avec expiration automatique  
 **Sensibilisation aux Tombstones** : Opérations DELETE et leurs implications  
 **Conception Orientée Requête** : Tables conçues pour des modèles d'accès spécifiques  
 **Dénormalisation** : Duplication de données pour les performances  
 **Opérations par Lot** : Chargement efficace de données en vrac  
 **Opérations CRUD** : Exemples complets Create, Read, Update, Delete  
 **Schéma Réel** : Conceptions de tables prêtes pour la production  

## Équipe

Développé pour le Cours de Base de Données NoSQL M1 IPSSI  
Démontre les meilleures pratiques Cassandra complètes avec des données de football

---

**Projet professionnel de démonstration des concepts NoSQL avancés**