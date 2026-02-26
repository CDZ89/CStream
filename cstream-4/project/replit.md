# CineBolt ⚡ - Plateforme de Streaming Premium v3.9

## Overview
CineBolt est une plateforme de streaming premium s'inspirant de **CineBolt.net** et **KaitoVault.com**, avec design minimaliste noir/rouge, hero section avec backdrop image, sections de tendances numérotées, et contenu riche TMDB (films/séries/animes). Version 3.9 = interface polie avec bouton de mise à jour redessiné minimaliste.

**Version actuelle : 3.9 - 27 Décembre 2025**

## ✨ Changements v3.9 (27 Décembre 2025) - POLISH FINAL & PERMISSIONS ADMIN/CREATOR

### 🎨 UI/UX Améliorations:
- ✅ **SVG Bouton Refresh Redessiné** - Nouvelle icône étoile compas 8 directions (plus propre)
- ✅ **Sélecteur de Langue Premium "Liquid Glass"** - Remplace le theme toggle
  - ✅ Taille réduite: 55px (50% plus petit)
  - ✅ Drapeaux 14px (flags minimalistes)
  - ✅ Synchronisation automatique useI18n + useSettingsStore
  - ✅ Change vraiment la langue en temps réel
  - ✅ Mémorise la sélection dans les settings

### 👑 Permissions & Badges:
- ✅ **CREATOR Badge** - chemsdine.kachid@gmail.com
  - Badge "CREATOR" dans le dropdown
  - Accès complet aux Outils Créateur
  - Permissions MEGA ULTRA complètes
- ✅ **ADMIN Badge** - laylamayacoub@gmail.com
  - Badge "ADMIN" dans le dropdown
  - Accès complet au panel Admin
  - Permissions système complètes
**🎬 REFONTE COMPLÈTE HOME PAGE - DESIGN PREMIUM MAX**
- ✅ **ZéRO Partage sur Home**: Suppression de tous les share widgets (uniquement sur detail pages)
- ✅ **Hero Section Épique Premium**: Backdrop full-width avec overlays dégradés, titre 7xl, year badge, 4K badge premium
- ✅ **Trending Rankings Section (1-20)**: Badges rouges gradient, cartes 1.08x zoom hover, info overlay au hover
- ✅ **5 Content Sections Premium**: Films | Séries | Meilleurs | À Venir - grilles responsive avec lazy-load images
- ✅ **Design Premium Minimaliste**: 
  - Fond noir pur (#0b0f14)
  - Texte blanc pur (#ffffff) + gris clair (#e5e7eb)
  - Accents rouge mat (#B00020) + vert sapin (#0F5132) + doré (#d4af37)
  - Cartes sobres avec hover subtil (scale 1.08, ombre douce)

**🎄 Thème Noël Élégant & Subtil**
- Flocons de neige animés discrets (25 flocons, opacity 40%, chute 15-25s)
- Gradient overlays red/green subtils (5-10% opacity)
- Badges festifs: 🎄 Saison Festive | 🌲 Atmosphère Hivernale | ✨ Expérience Premium
- Animations fluides mais discrètes (Framer Motion)
- Ambiance hivernale scandinavique (MINIMALISTE, pas criard)

**🎨 Composants & Micro-Interactions**
- CTA Buttons: Hover scale 1.05, shadow glow, transitions fluides
- Card Hover: Scale 1.08, shadow-2xl, play icon + overlay
- Fade-in animations au scroll (whileInView)
- Rating badges: Amber-600/90 backdrop-blur
- Line separators: Gradient rouge/vert/or subtle

**✨ ShareWidgetChristmas**
- ✅ Sur MovieDetail & TVDetail UNIQUEMENT (pas sur Home)
- Gradient rouge-vert festif mais professionnel
- Animations gift-box fluides
- Share + Copy Link + Like buttons

**🐛 QA & Fixes**
- ✅ 0 LSP errors (TypeScript strict mode)
- ✅ 0 React console errors  
- ✅ Clean imports, no unused code
- ✅ Responsive 100% (mobile→tablet→desktop)
- ✅ Performance: lazy-load images, animation non-bloquantes
- ✅ Accessibility: proper contrast WCAG AA, semantic HTML

## Changements précédents (v3.6 - v3.8)
- **Lecteurs Vidzee/Vidking optimisés**: Vidzee est maintenant le lecteur par défaut (#1), avec instructions de changement de langue intégrées
- **Instructions langue Vidzee**: Description mise à jour "Cliquez 'Paramètre' puis 'Langue ou Sous-titre'" dans UniversalPlayer et PlayerSwitcher
- **Préférence lecteur persistante**: Le lecteur choisi par l'utilisateur est maintenant sauvegardé dans localStorage (cstream_preferred_player)
- **Performance MediaGrid optimisée**: Composant memoizé avec useMemo pour processedItems, remplacement de Framer Motion par CSS animate-in
- **TypeScript corrigé**: Corrections des erreurs de type dans Movies.tsx et TV.tsx (assertions pour genres API)
- **Système de rôles vérifié**: Endpoints /api/admin/users/:id/role, /api/admin/logs, /api/admin/cookie-consents fonctionnels avec verifyAdminAccess

## Changements v3.5 - 17 Décembre 2025
- **Sandbox complètement supprimé**: Plus aucun attribut sandbox sur les lecteurs vidéo - élimine les erreurs "Sandbox Not Allowed"
- **VideoPlayerSection refait**: Nouveau composant avec gestion des intervalles via refs, barre de progression animée, meilleure gestion d'erreurs
- **Domaines VidRock étendus**: Ajout de vidrock.to, vidrock.cc, vidrock.me, vidrock.stream, player.vidrock.net aux domaines de confiance
- **Performance de chargement**: Animations de chargement plus fluides avec nettoyage propre des timers
- **Animations visuelles**: Ajout d'effets de particules flottantes et d'orbes lumineuses avec support d'accessibilité (prefers-reduced-motion)
- **Animations CSS sparkle**: Nouvelles animations keyframes pour effets scintillants, twinkle et glow
- **Permissions iframe nettoyées**: Suppression des accès sensibles (microphone, caméra) de la liste allow
- **Admin Role Management**: Endpoints de gestion des rôles/statuts vérifiés avec hiérarchie de rôles

## Changements v3.4 - 16 Décembre 2025
- **WatchHistoryWidget fixé**: Suppression de l'auto-masquage - l'historique reste maintenant visible en permanence
- **Gestion des rôles améliorée**: Correction du RoleManagementPanel pour utiliser l'API serveur (contournement RLS)
- **Sources séparées**: Les lecteurs universels (VidKing, VidFast) sont séparés des sources dédiées dans les modales
- **Admin Cookie Consent**: API et interface prêts pour gérer les consentements cookies

## Changements v3.3
- **Frembed Video Source**: Ajout de la source française Frembed (VF/VOSTFR) avec support films et séries
- **Favoris sans connexion**: Les visiteurs peuvent maintenant ajouter des favoris sans créer de compte (localStorage)
- **Watchlist invités**: Système de watchlist fonctionnel pour les utilisateurs non connectés
- **Clés localStorage standardisées**: Utilisation de `cstream_favorites_v1` et `cstream_watchlist_v1` pour cohérence
- **Métadonnées enrichies**: Les favoris locaux stockent titre, poster, date d'ajout pour meilleur affichage
- **Domaines proxy étendus**: Ajout de frembed.pro, autoembed.cc et variantes dans le proxy vidéo

## Changements v3.2
- Removed dead frembed.lol player, added VidLink, 2Embed, and MoviesAPI as new reliable sources
- Optimized image loading with w342 size for posters, fetchPriority attributes
- Improved HeroCarousel with faster transitions (700ms) and better image sizing

## Changements v3.1
- **Panel Analytics Admin**: Nouvel onglet Analytics avec stats en temps réel (utilisateurs, médias, favoris, etc.)
- **Amélioration Home**: Animations fluides, effets blur, chargement progressif avec skeletons
- **MediaCard amélioré**: React.memo, animations framer-motion, effets hover optimisés
- **Système de statut**: Mise à jour automatique du statut (online/offline) toutes les 30 secondes
- **Attribution des rôles**: Correction et synchronisation des rôles à la connexion

## Architecture

### Frontend (React + Vite)
- **Port**: 5000
- **Technologies**: React 18, TypeScript, Tailwind CSS, Shadcn/ui, Framer Motion
- **État**: Zustand pour l'état global

### Backend (Node.js + Express)
- **Port**: 3001
- **API IA**: Groq API (llama-3.3-70b-versatile)
- **Base de données**: Supabase (PostgreSQL)

## Composants Clés

### Pages
- `/` - Page d'accueil avec contenu TMDB
- `/auth` - Authentification (email/Discord)
- `/profile` - Profil utilisateur avec bannière personnalisable
- `/chat` - Chat avec amis et assistant IA (CAi)
- `/movies`, `/series`, `/anime` - Catalogue média

### Fonctionnalités Récentes
1. **Bannière de profil** - Upload d'image avec fallback data URL si bucket Supabase indisponible
2. **Badges de rôles** - Affichage automatique pour admin/mod/creator (persistance améliorée)
3. **Enregistrement vocal** - Intégré dans le chat pour messages vocaux
4. **Système d'amis** - Codes à 5 chiffres, demandes, acceptation/refus
5. **Système d'économie CCoins** - Économie virtuelle inspirée d'UltraJoins avec farm, daily, pay, leaderboard
6. **Status utilisateur persistant** - Le status online/offline se met à jour automatiquement quand l'utilisateur quitte le site

## Configuration Requise

### Secrets (dans Replit Secrets)
- `GROQ_API_KEY` - Clé API Groq pour l'assistant IA
- `SESSION_SECRET` - Secret de session
- `DISCORD_BOT_TOKEN` - Token du bot Discord pour notifications admin
- Supabase: `DATABASE_URL`, `PGHOST`, `PGPORT`, etc.

### Bot Discord (CStream#4031)
- **Fonctionnalité**: Envoi de notifications admin vers les serveurs Discord + Assistant IA CAi
- **Sécurité**: Tous les endpoints protégés par JWT Supabase + vérification des rôles admin
- **Commandes Slash Discord**:
  - `/ping` - Vérifie le statut du bot
  - `/stats` - Affiche les statistiques
  - `/status` - Statut des services (Bot, CAi, BDD)
  - `/help` - Liste des commandes disponibles
  - `/latest` - Dernières mises à jour
  - `/ask [question]` - Poser une question à CAi
  - `/search [query] [type]` - Recherche TMDB avec statut des lecteurs
  - `/pages` - Affiche toutes les pages du site avec liens
  - `/aichat` - Active/désactive le chat IA dans un canal (Admin)
  - `/userinfo [username]` - Recherche un utilisateur (Admin)
  - `/announce [message]` - Envoie une annonce (Admin)
  - `/farm` - Gagner des CCoins en regardant du contenu (10 min cooldown)
  - `/balance [user]` - Voir son profil économique et ses CCoins
  - `/leaderboard` - Classement des meilleurs utilisateurs par CCoins
  - `/daily` - Récupérer sa récompense quotidienne (0.50 CCoins/jour)
  - `/pay [user] [amount]` - Envoyer des CCoins à un autre utilisateur
  - `/addcoins [user] [amount]` - Ajouter des CCoins (Admin CDZ)
  - `/delcoins [user] [amount]` - Retirer des CCoins (Admin CDZ)
  - `/watchstats [user]` - Statistiques de visionnage
  - `/rewards` - Voir les récompenses disponibles
  - `/streak` - Voir sa série de jours consécutifs
- **Chat IA temps réel**: Dans les canaux activés, le bot répond sans @mention
- **Endpoints API**:
  - `GET /api/discord/status` - Statut de connexion du bot
  - `GET /api/discord/channels` - Liste des salons (authentifié)
  - `POST /api/discord/set-channel` - Définir le salon par défaut (authentifié)
  - `POST /api/discord/send` - Envoyer un message (authentifié)

### Base de données (Supabase)
Tables principales:
- `profiles` - Profils utilisateurs (username, avatar_url, friend_code, role, badge_style, status)
- `users` - Utilisateurs (email, is_online, last_seen, status)
- `friends` - Relations d'amitié
- `friend_requests` - Demandes d'amis
- `messages` - Messages de chat
- `favorites` - Favoris média
- `discord_economy` - Économie Discord (user_id, coins, total_earned, total_spent, watch_time_minutes)
- `discord_economy_logs` - Historique des transactions (user_id, amount, type, description)
- `discord_cooldowns` - Cooldowns pour farm/daily (user_id, type, expires_at)

### Système d'Économie CCoins
- **Farm**: Gagne 0.10-0.25 CCoins toutes les 10 minutes (10% chance de bonus)
- **Daily**: Récompense quotidienne de 0.50 CCoins
- **Pay**: Transfert de CCoins entre utilisateurs
- **Leaderboard**: Classement des 10 meilleurs utilisateurs
- **Admin Commands**: addcoins/delcoins pour les Admin CDZ

## Notes Techniques

### Type Assertions
Le champ `banner_url` n'existe pas encore dans le schéma Supabase `profiles`. Les mises à jour utilisent `as any` pour contourner le typage TypeScript en attendant une migration.

### Stockage
- Avatars: bucket `avatars` (fallback data URL)
- Bannières: bucket `banners` (fallback data URL)

## Dernières Modifications (10 Décembre 2025)

### Version 2.04
- **Bot Discord v1.5 - Fonctionnalités avancées**:
  - Messages de bienvenue/départ automatiques avec embeds stylisés
  - Salons vocaux privés (`/voice create/add/remove/close`)
  - Nettoyage automatique des salons inactifs (30 min)
  - Gestion des rôles (`/role add/remove`)
  - Suppression de messages (`/clear`)
  - Configuration avancée (`/config show/test-welcome/set-welcome/set-leave`)
  - Validation des types de canaux pour éviter les erreurs API
  - Gestion d'erreurs robuste avec fallbacks

- **Admin Panel amélioré**:
  - Fonction `getUserRole` corrigée pour tous les rôles (creator, super_admin, admin, moderator, editor, member)
  - Affichage correct du statut en ligne avec présence

### Version 2.03
- **Bot Discord amélioré avec IA CAi**:
  - Nouvelles commandes slash: `/search`, `/pages`, `/aichat`
  - Chat IA temps réel dans les canaux activés (sans @mention requis)
  - Recherche TMDB intégrée avec affichage du statut des lecteurs
  - Connaissance complète des pages du site avec liens directs
  - Embeds stylisés avec couleurs par type de message
  - Gestion des canaux IA par commande admin
- **Intégration TMDB dans Discord**:
  - Recherche multi (films, séries, anime)
  - Affichage de la note, année, type
  - Vérification automatique des lecteurs disponibles
  - Liens directs vers les pages CStream
- **CAi Discord amélioré**:
  - Contexte personnalisé avec username
  - Connaissance des pages du site
  - Réponses concises (max 800 caractères)
  - Suggestions de contenu basées sur TMDB

### Version 2.02
- **Système de rôles et badges amélioré**:
  - 6 rôles distincts: Créateur, Super Admin, Admin, Modérateur, Éditeur, Membre
  - Badges visuels améliorés avec gradients, effets glow et animations
  - Badge Créateur premium avec animation shimmer et ring
  - Badge Modérateur ajouté (icône marteau, couleur teal/cyan)
  - Badge Super Admin doré avec couronne
  - Tous les badges ont un effet shadow et ring subtil
  - Priorité des rôles définie pour la hiérarchie
- **Gestion des rôles dans le panel admin**:
  - Sélecteur de rôles avec icônes et prévisualisation du badge
  - 5 rôles assignables: Membre, Éditeur, Modérateur, Admin, Super Admin
  - Descriptions claires pour chaque niveau de permission
  - Mise à jour en temps réel avec fallback robuste
- **Authentification améliorée**:
  - Nouveau flag `isModerator` dans le contexte d'auth
  - Hiérarchie de permissions: Creator > Super Admin > Admin > Moderator > Editor > Member
  - Les modérateurs héritent automatiquement des droits d'éditeur
  - Persistance correcte des rôles en base de données

### Version 2.01
- **Correction des lecteurs vidéo bloqués**:
  - Mode popup forcé pour sources problématiques (sendvid, oneupload, vidmoly, voe, doodstream, streamtape)
  - Contournement des restrictions X-Frame-Options
  - Indicateur de fiabilité des sources (haute/moyenne/basse)
- **Suivi de progression des épisodes**:
  - Badge "Arrêté ici" sur l'épisode en cours avec barre de progression
  - Section "Reprendre le visionnage" avec accès rapide au dernier épisode
  - Calcul précis par épisode spécifique (saison + épisode)
- **IA CAi améliorée**:
  - Nouveau prompt système immersif avec formatage riche
  - Liens stylés avec favicon, blocs de code modernisés

### Version 2.00 (BETA FINISHED) - 9 Décembre 2025
- **Fin de la phase BETA** : CStream est maintenant stable et prêt pour la production
- **Lecteur vidéo amélioré** : Interface de lecture repensée avec contrôles optimisés
  - Boutons de navigation épisodes redesignés
  - Messages d'erreur plus clairs et informatifs
  - Meilleure expérience utilisateur sur la page lecteur
- **Design professionnel** : Révision complète des textes et de la cohérence visuelle
- **Corrections orthographiques** : Vérification et correction de tous les textes du site
  - Messages d'erreur plus explicites
  - Libellés de boutons harmonisés
  - Textes de chargement optimisés

### Améliorations précédentes v2.3
- **Notifications repositionnées**: Les toasts apparaissent maintenant en bas de l'écran au lieu du haut
- **Système d'amis renforcé**: Meilleure gestion des erreurs RLS avec messages clairs
- **Task Scheduler API**: Nouveau système de planification de tâches avec endpoints:
  - `POST /api/agent/tasks/schedule` - Créer une tâche planifiée
  - `GET /api/agent/tasks` - Lister les tâches
  - `DELETE /api/agent/tasks/:id` - Supprimer une tâche
  - `PUT /api/agent/tasks/:id/toggle` - Activer/désactiver
  - `POST /api/agent/tasks/:id/run` - Exécution manuelle
- **Proxy Vidéo Optimisé**: TTL cache augmenté à 15min, prefetch batch, tracking hit/miss
- **Discord Webhooks Améliorés**: Embeds colorés (success/info/warning/error), endpoint status report

### Amélioration API Keys & Services v2.2
- **Service Status Endpoint**: Nouvel endpoint `/api/service-status` pour vérifier la configuration des services API
- **ServiceStatusCard Admin**: Nouveau composant dans le panneau Admin affichant l'état de TMDB, Groq, GitHub, Discord
- **Agent Settings Tab**: Amélioration de l'onglet Paramètres avec affichage complet du statut des services
- **Friend System**: Meilleure gestion des erreurs RLS et clés étrangères avec messages explicites
- **Creator Badge**: Nouvelle prop `showSparkles` et correction de l'accent sur "Créateur"

### Optimisations de Performance v2.1
- **Server Agent Keepalive**: Système keepalive automatique toutes les 60s avec vérifications de santé toutes les 5 minutes
- **Admin Panel Parallèle**: Chargement concurrent des readers/profiles avec Promise.all
- **Subscriptions Realtime**: Abonnements temps réel pour readers, profiles et contact_messages avec cleanup automatique
- **TMDB Cache Amélioré**: Cache LRU avec éviction automatique, prefetch multi-requêtes, limite 500 entrées mémoire / 100 localStorage
- **Agent Auto-Wake**: Endpoints `/api/agent/ping`, `/api/agent/wake` et `/api/agent/config` pour maintenir l'agent actif

## Modifications (7 Décembre 2025)

### Gestion des langues
- **Admin-only**: Création/modification/suppression des langues maintenant uniquement dans le panneau Admin
- Page Paramètres affiche les langues en lecture seule pour les utilisateurs

### Personnalisation - Instant Apply
- **Polices d'écriture**: Application instantanée avec guards SSR pour éviter les crashes
  - Font appliquée immédiatement pour feedback visuel
  - Force reflow après chargement Google Fonts
  - Protection `typeof document === 'undefined'` pour environnements non-browser
- **Styles de badges**: Suppression de la memoization pour permettre les re-renders instantanés
  - RoleBadge sans memo() pour application immédiate des changements

### Import Multi-langues
- Support jusqu'à 3 langues simultanées dans l'import
- Détection automatique des lecteurs (Sibnet recommandé)
- Interface améliorée avec bouton ajout/retrait 3ème langue

## Modifications (5 Décembre 2025)

### Sécurité
- **XSS Fix**: Correction vulnérabilité XSS dans le rendu des blocs de code IA - les labels de langage sont maintenant échappés via `escapeHtml()`
- Remplacement des handlers inline `onclick` par délégation d'événements pour les boutons de copie

### Chat et CAi
- **Historique CAi**: Nouveau dialogue pour voir l'historique des conversations avec titres
- **Bouton de défilement**: Bouton flottant "Nouveaux messages" quand on scroll vers le haut
- **Blocs de code améliorés**: Affichage du langage, bouton copier avec feedback
- Auto-scroll intelligent lors des réponses IA en streaming

### Paramètres
- **Informations de session**: Nouvelle section affichant IP, ville, pays, appareil, navigateur et heure de connexion
- Utilisation de l'API ipapi.co pour la géolocalisation

### Administration
- **Promotion de rôles**: Dialogue de sélection de rôle (admin/modérateur/créateur/membre)
- Correction de la recherche utilisateur par ID/nom
- Correction du double envoi de notifications

### Optimisations
- Système d'amis optimisé avec jointures SQL (suppression des requêtes N+1)
- Ajout de la fonctionnalité bannière personnalisable sur le profil
- Intégration du composant VoiceRecorder dans le chat
- Affichage du badge de rôle sous le nom d'utilisateur

### Chat - Layout CSS (Session récente)
- **Hauteur fixe**: Chat utilise `h-screen` avec `overflow-hidden` pour isoler le scroll interne
- **Flex layout**: Structure `flex flex-col` avec `min-h-0` et `flex-shrink-0` pour empêcher la croissance de page
- **ScrollArea**: Zone de messages avec scroll interne, la page ne grandit plus

### Système d'amis amélioré
- **Page AddFriend**: Support des liens directs (`/add-friend/:profileId`) ET recherche par code (`/add-friend?code=12345`)
- **Flux de demandes**: Création de demande d'ami au lieu d'amitié directe
- **Lien de partage**: Bouton pour copier le lien d'ajout d'ami avec code
- **Gestion des erreurs FK**: Acceptation d'amis avec meilleure gestion des contraintes de clés étrangères

### Voice Recorder
- **receiver_id corrigé**: Utilise `selectedFriend.friend_profile.id` au lieu de `friend_id`
- **Type de message**: Envoi avec `message_type: 'voice'` et métadonnées de durée

## Modifications (7 Décembre 2025) - v2.0

### Suppression en masse améliorée (1200+ éléments)
- **Traitement par lots**: Suppression par chunks de 100 éléments à la fois
- **Parallélisme contrôlé**: Maximum 3 lots en parallèle pour performance optimale
- **Dialogue de progression**: Pourcentage en temps réel avec barre de progression
- **Gestion des échecs partiels**: Continue même si certains lots échouent
- **Confirmation obligatoire**: Message adapté selon le nombre d'éléments
- **Mise à jour optimiste**: L'UI se met à jour avec les éléments supprimés avec succès

### Restriction de l'Agent IA
- **Accès limité**: Seuls les Super Admins et le Créateur peuvent accéder à l'Agent
- **Contrôle renforcé**: Les admins normaux n'ont plus accès à l'Agent
- **Message explicite**: Message d'accès refusé clair pour les utilisateurs non autorisés

### Optimisations de performance
- **ChatMessageItem mémorisé**: Composant React.memo pour réduire les re-renders
- **Stabilité des hooks**: Dépendances correctes pour useEffect et useCallback
- **Fluidité améliorée**: Réduction globale des re-renders inutiles

### Améliorations UX Admin
- **Dialogue de progression**: Feedback visuel pendant les suppressions en masse
- **Indicateurs visuels**: Pourcentage et compteur d'éléments traités
- **Feedback d'échecs**: Alerte claire pour les échecs partiels

## Modifications (7 Décembre 2025) - v1.8

### Correction critique - Sélection d'épisodes
- **Bug corrigé**: La sélection d'un épisode spécifique (ex: 1150, 1152) revenait toujours à l'épisode 1
- **buildFinalUrl amélioré**: Les paramètres explicites (seasonNum, episodeNum) ont maintenant TOUJOURS la priorité
  - Avant: `episodeNum ?? reader?.episode_number` (bug si episodeNum=undefined mais reader.episode_number=null)
  - Après: Vérification explicite avec `episodeNum !== undefined && episodeNum !== null`
- **handleEpisodeClick amélioré**: Support des sources "tous épisodes" (episode_number=null)
  - Nouvelle fonction helper `matchesEpisode()` qui accepte les readers avec episode_number exact OU null
- **Sélecteur d'épisodes corrigé**: Requête Supabase avec `.or('episode_number.eq.${epNum},episode_number.is.null')`
  - Trouve maintenant les sources spécifiques ET les sources génériques pour tous les épisodes

## Modifications (7 Décembre 2025) - v1.7

### Corrections de bugs critiques
- **Navigation des épisodes**: Correction du bug où cliquer sur un épisode différent continuait à jouer l'épisode précédent
  - Ajout de `iframeKey` pour forcer le re-rendu de l'iframe lors du changement d'épisode
  - La clé combine season/episode pour une identification unique
- **Proxy vidéo sécurisé**: Nouvel endpoint `/api/proxy` pour contourner les restrictions X-Frame-Options
  - Liste blanche de domaines vidéo autorisés (Sibnet, VK, OK.ru, etc.)
  - Protection contre les attaques SSRF
  - Timeout de 30 secondes pour éviter les blocages

### Thème gris complet
- **dark-slate**: Refonte complète du thème gris avec saturation 0%
  - Toutes les variables CSS incluses (background, foreground, card, popover, etc.)
  - Variables sidebar incluses pour cohérence
  - Couleurs destructive et muted définies

### Persistance du logo
- **useSiteLogo**: Refactorisation avec `zustand persist` middleware
  - Le logo est sauvegardé en local storage comme data URL
  - Fallback automatique si Supabase Storage n'est pas disponible
  - Le logo persiste même après rafraîchissement de page

### Améliorations visuelles
- **Badge Créateur**: Effet shimmer animé avec gradient amélioré (violet-fuchsia-pink)
- **Système d'amis**: Service complet vérifié et fonctionnel
  - Recherche par nom d'utilisateur
  - Demandes d'ami avec statuts
  - Gestion des relations existantes

## Modifications (8 Décembre 2025) - v2.0.0 CAgent Complet

### CAgent - Agent DevOps Automatisé
L'agent CStream est maintenant complet avec un backend fonctionnel et des intégrations réelles.

#### Nouvelles API Backend (`server.js`)
- **`GET /api/agent/status`** - État du système, services configurés, uptime
- **`GET /api/agent/update`** - Lecture du changelog (update.json)
- **`GET /api/agent/logs`** - Logs de l'agent en temps réel
- **`POST /api/agent/command`** - Exécution de commandes (health-check, clear-logs)
- **`POST /api/agent/deploy`** - Déclenchement du workflow GitHub Actions
- **`GET /api/agent/github/workflows`** - Liste des derniers workflows GitHub
- **`POST /api/agent/notify`** - Envoi de notifications Discord
- **`POST /api/agent/update-changelog`** - Mise à jour du changelog avec notification Discord

#### Fichiers Créés
- **`project/update.json`** - Changelog automatique avec version, date, et changements
- **`project/.github/workflows/cstream.yml`** - Workflow GitHub Actions CI/CD
  - Build automatique sur push vers main
  - Exécution hebdomadaire (cron)
  - Déclenchement manuel via API
  - Génération automatique du changelog
  - Notifications Discord

#### Interface Agent (`/agent`)
- **Onglet Deploy** - Nouveau : Déploiement GitHub et notifications Discord
  - Bouton "Déclencher le déploiement" pour lancer le workflow
  - Liste des derniers workflows avec statut (succès/échec/en cours)
  - Liens externes vers GitHub
  - Notifications Discord prédéfinies (Maintenance, Mise à jour, Résolu)
  - Message personnalisé Discord

- **Onglet Statut amélioré**
  - Affichage des services configurés : Groq AI, GitHub, Discord, Google Search
  - Indicateurs de santé en temps réel

#### Secrets Requis
- `GITHUB_TOKEN` - Personal Access Token GitHub avec permissions `repo`
- `DISCORD_WEBHOOK` - URL du webhook Discord pour notifications
- `SUPABASE_ANON_KEY` - Clé publique Supabase (anon key)

#### Sécurité
- **Authentification obligatoire**: Tous les endpoints /api/agent/* requièrent un token Bearer valide
- **Vérification des rôles**: Seuls les `super_admin` et `creator` peuvent accéder aux endpoints
- Les secrets sont stockés de manière sécurisée via Replit Secrets (jamais en dur dans le code)
- Le token GitHub n'est jamais exposé côté client
- Validation et sanitization de tous les inputs (version, changelog, messages)
- Le frontend transmet automatiquement le token d'authentification via les headers

## Modifications (7 Décembre 2025) - v1.9

### Agent CStream (Prototype)
- **Nouvelle page `/agent`**: Tableau de bord de surveillance avec interface de monitoring
  - Interface utilisateur pour visualiser la santé du système (base de données, API TMDB, cache, stockage)
  - Affichage des vérifications avec données simulées (prototype - backend réel à implémenter)
  - Journal d'activité avec exemples de logs
  - Historique des mises à jour via changelog intégré
  - Interface de configuration de l'agent
- **Lien depuis Admin**: Bouton "Agent CStream" dans l'en-tête de la page Admin
- **Note**: Cette page est un prototype UI - les métriques réelles nécessitent une intégration backend
- **Widget de changelog**: Mis à jour en v1.9 avec toutes les nouvelles fonctionnalités

### Corrections Admin
- **Suppression améliorée**: Meilleure gestion des erreurs de suppression (RLS policies)
  - Messages d'erreur clairs indiquant les permissions manquantes
  - L'état local reste synchronisé avec la base de données (pas de suppression locale si erreur serveur)
  - Gestion des sessions expirées avec message de reconnexion
- **Suppression en masse**: Même traitement d'erreurs avec notifications appropriées

### Personnalisation des badges
- **5 styles de badges**: Par défaut, Brillant (shimmer), Lumineux (glow), Néon, Minimal
- **Sauvegarde persistante**: Style sauvegardé dans Zustand avec sync Supabase
- **Application globale**: Tous les badges utilisent automatiquement le style sélectionné
- **Prévisualisation en direct**: Les changements sont visibles immédiatement

### Nouveaux variants de boutons
- **8 variants animés**: animated, cyber, rainbow, ice, fire, nature, royal, sunset
- **Effets visuels avancés**: Gradients animés, effets hover améliorés
- **Cohérence visuelle**: Styles harmonisés sur toutes les pages

### Optimisations du composant RoleBadge
- **React.memo**: Évite les re-renders inutiles
- **useMemo**: Configuration optimisée des rôles
- **Intégration Zustand**: Lecture automatique du style depuis le store

## Modifications (6 Décembre 2025)

### Correction du build Swiper
- **Problème**: Le package `swiper` était installé dans le répertoire racine au lieu du répertoire `project/`, causant une erreur "Could not resolve react" lors du build
- **Solution**: Installation de `swiper` dans le bon répertoire (`project/`) pour que le package trouve React comme peer dependency
- **Résultat**: Application fonctionne correctement, plus d'erreur de build

### Structure des dépendances
- Les dépendances frontend React doivent être installées dans `project/` (pas à la racine)
- Le répertoire racine contient uniquement les dépendances partagées (concurrently, dotenv, etc.)
- Cette séparation évite les conflits de peer dependencies
