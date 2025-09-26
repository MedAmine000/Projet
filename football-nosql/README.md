# ⚽ Projet Football NoSQL - Démo Cassandra Avancée

Application complète de démonstration des **meilleures pratiques NoSQL** avec Cassandra et des données de football réelles. Illus# 🔍 Tables de recherche avancée (NOUVEAU - à exécuter après les autres)
python backend/ingest_advanced_search.py
# Crée 3 tables optimisées : players_by_position, players_by_nationality, players_search_index
# Traite ~92k+ joueurs avec nettoyage automatique des donnéese la modélisation time-series, pagination, TTL, tombstones, pré-agrégation, recherche avancée multi-critères et autres concepts clés.

## 🆕 **Nouveautés 2025**
- ✨ **Barre de Recherche Avancée** : Interface moderne avec 8 critères de recherche
- 🎯 **Stratégies Adaptatives** : Choix automatique de la meilleure table selon les filtres  
- 🧹 **Données Nettoyées** : Positions normalisées, nationalités filtrées automatiquement
- 🎨 **Design Moderne** : Interface horizontale remplaçant l'ancien bloc concepts
- ⚡ **Performance Optimisée** : 3 tables spécialisées pour différents patterns de recherche

> **📂 Note Importante :** Les fichiers CSV (>100MB) ne sont pas inclus dans Git. Téléchargez les datasets football et placez-les dans `data/` pour utiliser l'application.

## Structure du Projet

```
football-nosql/
├── data/                               # Fichiers CSV de données (non inclus - voir note ci-dessus)
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

## 🎯 Concepts NoSQL Démontrés

### 1. **🔑 Modélisation Orientée Requête**
- **Clés de Partition** : `player_id`, `team_id`, `position`, `nationality` pour des recherches rapides
- **Colonnes de Clustering** : `as_of_date DESC`, `player_name_lower ASC` pour l'ordonnancement optimisé
- **Dénormalisation** : Données dupliquées dans 3+ tables pour éviter les JOINs coûteux

### 2. **📈 Modèles de Données Time-Series**
- **Valeurs Marchandes** : Historique avec clustering récent-en-premier (`as_of_date DESC`)
- **Transferts** : Chronologie complète avec pré-agrégation saisonnière
- **Blessures** : Dossiers médicaux ordonnés par date de début
- **Performances** : Statistiques agrégées par saison et compétition

### 3. **📄 Pagination avec paging_state**
- **Navigation Efficace** : Tokens Cassandra pour parcourir de gros datasets sans OFFSET coûteux
- **Encodage Base64** : Transport sécurisé des tokens d'état
- **Sans État Serveur** : Aucun curseur à maintenir côté backend

### 4. **⚡ Stratégies de Recherche Avancée**
- **Par Position** : Partition key `players_by_position` (très rapide)
- **Par Nationalité** : Partition key `players_by_nationality` (très rapide)
- **Par Nom** : Index de recherche avec clustering alphabétique
- **Multi-Critères** : Combinaison intelligente de stratégies selon les filtres actifs

### 5. **🗂️ Pré-Agrégation et Vues Matérialisées**
- **Top Transferts** : Classements pré-calculés par saison (table `top_transfers_by_season`)
- **Dernières Valeurs** : Table `latest_market_value_by_player` maintenue automatiquement
- **Résumés Performance** : Statistiques précalculées pour affichage rapide

### 6. **⏰ TTL (Time To Live)**
- **Données Temporaires** : Expiration automatique pour conformité RGPD
- **Cas d'Usage Réels** : Dossiers médicaux, données de cache, sessions utilisateur
- **Interface Démo** : Ajout de valeurs avec TTL personnalisable

### 7. **⚠️ Tombstones et Opérations DELETE**
- **Démo Pratique** : Suppression de blessures pour illustrer les tombstones
- **Impact Performance** : Visualisation des effets sur les temps de lecture
- **Bonnes Pratiques** : Préférer TTL à DELETE quand possible

### 8. **🔍 Recherche Intelligente et UX**
- **Autocomplétion** : Suggestions temps réel pour équipes et joueurs
- **Interface Adaptative** : Barre de recherche qui s'adapte selon le contexte
- **Filtrage Côté App** : Alternative performante aux index secondaires
- **Multi-Modal** : Recherche par ID, nom, ou critères avancés

## 🚀 Démarrage Rapide (5 minutes)

```powershell
# 1. Cloner et naviguer
git clone <repo-url>
cd football-nosql

# 2. Démarrer Cassandra (WSL)
wsl sudo service cassandra start

# 3. Installer dépendances Python
python -m pip install --user -r backend/requirements.txt

# 4. Démarrer l'API (auto-crée le schéma)
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000

# 5. Frontend (nouveau terminal)
cd frontend
npm install && npm run dev

# 🎉 Ouverture : http://127.0.0.1:5173
```

**Note :** Sans données CSV, seules les fonctions de base marchent. Voir section complète ci-dessous pour l'ingestion.

## 📋 Prérequis

- **Windows 10/11** avec PowerShell
- **Python 3.8+** installé et accessible depuis la ligne de commande
- **Cassandra 4.1+** fonctionnant sur `127.0.0.1:9042` (via WSL ou natif)
- **Node.js 16+** pour le développement frontend
- **Git** pour le clonage (si nécessaire)
- **Datasets CSV** : Fichiers de données de football (non inclus dans ce repo)

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

### 0. Obtenir les Données
```powershell
# Les fichiers CSV requis (non inclus dans Git) :
# - player_injuries.csv
# - player_latest_market_value.csv  
# - player_market_value.csv
# - player_national_performances.csv
# - player_performances.csv (150MB)
# - player_profiles.csv
# - player_teammates_played_with.csv
# - team_children.csv
# - team_competitions_seasons.csv
# - team_details.csv
# - transfer_history.csv (77MB)

# Placer ces fichiers dans : football-nosql/data/
```

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

# Tables de recherche avancée (à exécuter après les autres ingestions)
python backend/ingest_advanced_search.py
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

### 1. **🔍 Recherche Avancée de Joueurs** (Nouveauté !)
- **Barre de recherche horizontale** remplace l'ancien bloc "Concepts NoSQL"
- **Interface moderne** : Design pliable/dépliable avec dégradé violet-bleu
- **8 critères de recherche** :
  - 📝 **Nom** : Recherche textuelle (index `players_search_index`)
  - ⚽ **Position** : Dropdown optimisé (partition `players_by_position`)  
  - 🌍 **Nationalité** : Filtre pays (partition `players_by_nationality`)
  - 🏟️ **Équipe** : Recherche par nom d'équipe
  - 👶 **Âge** : Plage min/max (calculé depuis `birth_date`)
  - 💰 **Valeur** : Plage de valeur marchande en euros

- **🎯 Stratégies NoSQL Adaptatives** :
  ```
  Position seule     → Scan players_by_position (rapide)
  Nationalité seule  → Scan players_by_nationality (rapide)  
  Nom seul          → Scan players_search_index (moyennement rapide)
  Multi-critères    → Meilleure stratégie + filtrage côté app
  ```

- **✨ Fonctionnalités UX** :
  - Interface compacte qui se déploie au clic
  - Résultats temps réel avec les 5 premiers joueurs
  - Sélection directe depuis les résultats
  - Nettoyage automatique des données (positions normalisées, nationalités filtrées)

### 2. **🏟️ Sélection d'Équipe** (Sidebar)
- **Double mode** de recherche avec toggle élégant :
  - 🆔 **Par ID** : Saisie directe de l'identifiant équipe
  - 🔤 **Par Nom** : Autocomplétion temps réel avec dropdown
- **Recherche intelligente** :
  ```sql
  -- Mode nom utilise ALLOW FILTERING (démo uniquement)
  SELECT * FROM team_details WHERE team_name LIKE ?
  ```
- **UX optimisée** : Suggestions cliquables avec infos (ville, pays, ID)
- **Partition strategy** : Charge `players_by_team` avec `team_id` en clé de partition

### 3. **Navigation des Joueurs**
- Cliquer sur n'importe quel joueur pour le sélectionner
- Les données du joueur sont chargées depuis plusieurs tables simultanément
- Démontre les recherches de partition unique et les requêtes parallèles

### 4. **Onglet Valeurs Marchandes**
- **Historique** : Liste paginée avec fonctionnalité "Charger Plus"
- **Ajouter Valeur** : Formulaire avec démonstration TTL optionnelle
- **Pagination** : Utilise les tokens paging_state de Cassandra
- **Démo TTL** : Ajouter des enregistrements temporaires qui expirent automatiquement

### 5. **Onglet Transferts**
- **Historique du Joueur** : Enregistrements de transferts time-series
- **Top Transferts** : Classements saisonniers pré-agrégés
- **Ajouter Transfert** : Créer de nouveaux transferts avec saison optionnelle pour pré-agrégation
- **Filtre de Saison** : Basculer entre les top transferts de différentes saisons

### 6. **Onglet Blessures**
- **Time-Series** : Dossiers médicaux ordonnés par date
- **Ajouter Blessure** : Formulaire avec option TTL pour données médicales temporaires
- **Démo DELETE** : Montre la création de tombstones (à utiliser avec précaution)
- **Suivi du Statut** : Statut de blessure active vs récupérée

### 7. **Onglet Performances**
- **Club vs National** : Onglets séparés pour différents types de performances
- **Filtrage par Saison** : Voir des saisons spécifiques ou toutes les statistiques
- **Statistiques Agrégées** : Totaux et moyennes pré-calculés
- **Métriques Multiples** : Buts, passes décisives, minutes, ratios d'efficacité

### 8. **Onglet Coéquipiers**
- **Données de Relation** : Joueurs qui ont joué ensemble
- **Options de Tri** : Par matchs joués ensemble ou alphabétique
- **Analyse de Partenariat** : Top partenariats avec indicateurs visuels
- **Statistiques** : Total des matchs et pourcentages de partenariat

## Points de Terminaison API

### Santé et Informations de Base
- `GET /health` - Contrôle de santé
- `GET /players/by-team/{team_id}` - Effectif d'équipe

### Recherche d'Équipes
- `GET /teams/search?q={query}&limit={limit}` - Recherche d'équipes par nom avec autocomplétion

### Recherche Avancée de Joueurs 🔍
- `POST /players/search` - Recherche multi-critères intelligente avec 8 filtres :
  ```json
  {
    "name": "Messi",           // Recherche textuelle
    "position": "Forward",     // Partition key optimisée  
    "nationality": "Argentina", // Partition key optimisée
    "team_name": "PSG",        // Filtre équipe
    "min_age": 30, "max_age": 40,  // Plage d'âge
    "min_market_value": 50000000   // Valeur marchande minimum
  }
  ```
- `GET /players/search/suggestions` - Listes pour dropdowns (positions nettoyées, nationalités filtrées)

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

## Points Forts du Schéma de Base de Données

### Tables Principales
```sql
-- Recherche de joueur (partition par player_id)
player_profiles_by_id (player_id, player_name, nationality, ...)

-- Effectif d'équipe (partition par team_id) 
players_by_team (team_id, player_id, player_name, position, nationality)

-- Recherche avancée par position (partition par position)
players_by_position (position, player_id, player_name, nationality, team_id, team_name, birth_date, market_value_eur)

-- Recherche avancée par nationalité (partition par nationality)  
players_by_nationality (nationality, player_id, player_name, position, team_id, team_name, birth_date, market_value_eur)

-- Index de recherche globale (partition fixe 'all', clustering alphabétique)
players_search_index (search_partition, player_name_lower DESC, player_id, ...)

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

## 🎓 Objectifs Pédagogiques Atteints

### ✅ **Concepts NoSQL Fondamentaux**
- **Modélisation Orientée Requête** : 3 tables pour la recherche de joueurs selon différents access patterns
- **Dénormalisation Stratégique** : Duplication contrôlée des données pour éviter les JOINs
- **Clés de Partition Intelligentes** : `position`, `nationality`, `search_partition` pour distribution optimale

### ✅ **Time-Series et Données Temporelles** 
- **Clustering Time-Series** : `as_of_date DESC` pour valeurs marchandes, transferts, blessures
- **TTL (Time To Live)** : Expiration automatique avec démo interactive
- **Tombstones Awareness** : Impact des DELETE sur les performances + alternatives

### ✅ **Performance et Scalabilité**
- **Pagination Token-Based** : `paging_state` pour navigation efficace de gros datasets  
- **Pré-Agrégation** : Top transferts par saison calculés à l'écriture
- **Vues Matérialisées** : Dernières valeurs marchandes maintenues séparément
- **Stratégies de Recherche Adaptatives** : Choix automatique de la meilleure table selon les filtres

### ✅ **Opérations et Patterns Avancés**
- **Batch Processing** : Ingestion par lots de 50-100 instructions
- **Prepared Statements** : Toutes les requêtes utilisent des statements préparés
- **CRUD Complet** : Create, Read, Update, Delete avec gestion d'erreurs élégante
- **Recherche Multi-Critères** : Combinaison intelligente de stratégies NoSQL

### ✅ **UX et Interface Moderne**
- **Recherche Temps Réel** : Autocomplétion et suggestions instantanées
- **Interface Responsive** : Design adaptatif avec barre de recherche horizontale
- **Feedback Utilisateur** : Explications des stratégies NoSQL dans l'interface
- **Architecture Full-Stack** : FastAPI + React + Vite pour une démo complète  

## 📊 Résumé Technique

### Architecture
```
🎨 Frontend: React + Vite (port 5173)
⚡ Backend: FastAPI + uvicorn (port 8000)  
🗄️ Database: Cassandra 4.1+ (port 9042)
📁 Data: 11 fichiers CSV (~300MB total)
```

### Métriques du Projet
- **📊 Tables Cassandra** : 15+ tables optimisées pour différents access patterns
- **👥 Joueurs** : ~92k+ profils avec recherche multi-critères
- **🏟️ Équipes** : Milliers d'équipes avec autocomplétion
- **📈 Time-Series** : Millions de points de données (valeurs, transferts, blessures)
- **🔍 Strategies** : 3 tables de recherche avec stratégies adaptatives

### Points Forts Démonstrés
1. **🎯 Query-Oriented Design** - Tables conçues pour chaque type de requête
2. **⚡ Partition Key Strategy** - Distribution optimale des données  
3. **📄 Token-Based Pagination** - Navigation efficace de gros datasets
4. **🔄 Adaptive Search** - Choix automatique de la meilleure stratégie
5. **🧹 Data Cleaning** - Normalisation automatique des données ingérées

---

## � Gestion de Projet & Collaboration

### 🔗 Tableau Trello
**Suivi du projet** : [https://trello.com/b/JI0Irqma/footbal-nosql](https://trello.com/b/JI0Irqma/footbal-nosql)

### 👥 Répartition des Tâches

#### **🎯 Amine** - Architecture & Backend
- ✅ Configuration environnement Cassandra + WSL
- ✅ Conception schéma NoSQL (15+ tables optimisées)
- ✅ Scripts d'ingestion avec batch processing (8 fichiers)
- ✅ API FastAPI avec 20+ endpoints
- 🔄 Optimisation performances et monitoring
- 📋 Documentation architecture système

#### **🎨 Salah** - Frontend & UX/UI  
- ✅ Interface React moderne avec Vite
- ✅ Composants réutilisables (9 composants)
- ✅ Barre de recherche avancée horizontale
- ✅ Design responsive avec CSS moderne
- 🔄 Tests d'intégration frontend
- 📋 Guide utilisateur interface

#### **🔍 Walid** - Recherche & Data Processing
- ✅ Stratégies de recherche adaptatives (3 tables)
- ✅ Nettoyage et normalisation données CSV
- ✅ Index de recherche multi-critères
- ✅ Pagination avec paging_state tokens
- 🔄 Optimisation requêtes complexes
- 📋 Documentation patterns NoSQL

#### **🧪 Abdo** - Testing & DevOps
- ✅ Tests unitaires API (pytest)
- ✅ Configuration CI/CD avec Git
- ✅ Validation données et gestion erreurs
- ✅ Scripts de déploiement et maintenance
- 🔄 Tests performance et charge
- 📋 Guide déploiement production

### 📊 Status Sprint Actuel
- **🟢 Backend API** : 100% - 20+ endpoints fonctionnels
- **🟢 Frontend React** : 100% - Interface complète avec recherche avancée  
- **🟢 Base Cassandra** : 100% - Schema optimisé avec 15+ tables
- **🟡 Documentation** : 90% - Finalisation guides utilisateur
- **🔄 Tests & Monitoring** : En cours - Couverture 80%+

### 📈 Métriques Projet
```
📊 Lignes de Code : ~3,500+ (Backend: 60%, Frontend: 40%)
🗄️ Tables Cassandra : 15+ tables avec patterns optimisés
📁 Composants React : 9 composants modulaires
⚡ API Endpoints : 20+ routes avec validation complète
📋 Scripts Ingestion : 8 fichiers pour ~300MB de données
🎯 Tests Coverage : 80%+ avec pytest et Jest
```

---

## �👨‍💻 Équipe

**Développé pour le Cours NoSQL M1 IPSSI 2025**  
Démonstration complète des patterns Cassandra avec cas d'usage réels de football

> 🎓 **Projet pédagogique professionnel** - Illustre les meilleures pratiques NoSQL pour applications réelles à grande échelle