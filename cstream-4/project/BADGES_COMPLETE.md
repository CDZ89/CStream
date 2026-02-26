# 🏅 Badges CStream - Liste Complète avec Exemples

## 📋 Tous les Badges

### 1️⃣ Badges Utilisateur Premium
| Badge | Description | Exemple | Couleur |
|-------|-------------|---------|--------|
| **Premium** | Abonné au plan Premium | "Julien R. - Premium" | Purple-600 |
| **VIP** | Utilisateur VIP exclusif | "Marie D. - VIP" | Gold-600 |
| **Plus** | Abonnement Premium+ | "Thomas L. - Plus" | Purple-700 |
| **Max** | Abonnement Premium Max | "Sophie M. - Max" | Pink-600 |

### 2️⃣ Badges de Rôle & Contribution
| Badge | Description | Exemple | Couleur |
|-------|-------------|---------|--------|
| **Creator** | Créateur de contenu | "Avatar Creator - Creator" | Blue-600 |
| **Fondateur** | Fondateur de la plateforme | "CDZ - Fondateur" | Red-600 |
| **Admin** | Administrateur système | "Admin CDZ - Admin" | Red-700 |
| **Modérateur** | Modérateur de communauté | "John Mod - Modérateur" | Orange-600 |
| **Support** | Équipe support officielle | "Support Team - Support" | Green-600 |

### 3️⃣ Badges de Statut & Vérification
| Badge | Description | Exemple | Couleur |
|-------|-------------|---------|--------|
| **Vérifiée** | Compte vérifié ✓ | "Compte Officiel - Vérifiée" | Blue-500 |
| **Officiel** | Compte officiel marque | "CStream Officiel - Officiel" | Cyan-600 |
| **Certificat** | Compte certificat authentique | "Expert - Certificat" | Green-600 |

### 4️⃣ Badges Spécialisation
| Badge | Description | Exemple | Couleur |
|-------|-------------|---------|--------|
| **Critique** | Critique film professionnel | "Alex Expert - Critique" | Purple-600 |
| **Fan d'Anime** | Spécialiste anime | "Akira Lover - Fan d'Anime" | Pink-600 |
| **Cinéphile** | Amateur de cinéma passionné | "Scorsese Fan - Cinéphile" | Red-600 |
| **Binger** | Grand consommateur séries | "Netflix Addict - Binger" | Orange-600 |
| **Collectionneur** | Collectionneur de films | "Movie Hoarder - Collectionneur" | Yellow-600 |

### 5️⃣ Badges Communauté & Engagement
| Badge | Description | Exemple | Couleur |
|-------|-------------|---------|--------|
| **Membre Fidèle** | Utilisateur depuis longtemps | "Depuis 2020 - Membre Fidèle" | Green-600 |
| **Ambassadeur** | Ambassadeur CStream | "Community Lead - Ambassadeur" | Purple-500 |
| **Influenceur** | Influenceur reconnu | "YouTuber 100K - Influenceur" | Pink-500 |
| **Contributeur** | Contributeur actif | "Avis Réguliers - Contributeur" | Blue-600 |
| **Testeur Beta** | Testeur des nouvelles features | "Early Adopter - Testeur Beta" | Cyan-600 |

### 6️⃣ Badges Récompenses & Achievements
| Badge | Description | Exemple | Couleur |
|-------|-------------|---------|--------|
| **Étoile d'Or** | Top avis du mois | "Best Reviewer - Étoile d'Or" | Yellow-600 |
| **Champion** | Gagnant de compétition | "Quiz Winner - Champion" | Red-600 |
| **Légende** | Status légendaire utilisateur | "All-Time Great - Légende" | Purple-800 |
| **Elite** | Utilisateur elite | "Top 100 - Elite" | Gold-700 |

### 7️⃣ Badges Genre Spécialiste
| Badge | Description | Exemple | Couleur |
|-------|-------------|---------|--------|
| **Master Horror** | Expert films d'horreur | "Scary Movie Pro - Master Horror" | Red-700 |
| **Sci-Fi Guru** | Expert science-fiction | "Future Watcher - Sci-Fi Guru" | Cyan-700 |
| **Drama Expert** | Expert drames | "Emotional Stories - Drama Expert" | Purple-700 |
| **Comedy King** | Expert comédie | "Laugh Master - Comedy King" | Yellow-600 |
| **Action Hero** | Expert films d'action | "Explosions Lover - Action Hero" | Orange-700 |

### 8️⃣ Badges Langue
| Badge | Description | Exemple | Couleur |
|-------|-------------|---------|--------|
| **Polyglotte** | Regarde en plusieurs langues | "4 Languages - Polyglotte" | Blue-600 |
| **VOSTFR Fan** | Fan des VOSTFR | "Original Audio - VOSTFR Fan" | Purple-600 |
| **Doubleur** | Fan du doublage français | "French Dub - Doubleur" | Blue-500 |

### 9️⃣ Badges Temporels
| Badge | Description | Exemple | Couleur |
|-------|-------------|---------|--------|
| **Night Owl** | Regarde la nuit | "Midnight Watcher - Night Owl" | Purple-900 |
| **Weekend Warrior** | Marathoner de weekend | "All Day Marathon - Weekend Warrior" | Orange-600 |
| **Binge Master** | Record binge session | "48h Marathon - Binge Master" | Red-600 |

### 🔟 Badges Qualité Vidéo
| Badge | Description | Exemple | Couleur |
|-------|-------------|---------|--------|
| **4K Lover** | Pref vidéos 4K | "Ultra HD Fan - 4K Lover" | Cyan-600 |
| **HDR Certified** | Connaisseur HDR | "Perfect Colors - HDR Certified" | Green-600 |
| **Audiophile** | Expert audio qualité | "Surround Sound - Audiophile" | Purple-600 |

## 💾 Comment Utiliser dans le Code

### Stocker un Badge
```typescript
// Insert dans la base de données
const { data, error } = await supabase
  .from('reviews')
  .insert({
    username: 'Julien R.',
    comment: 'Excellent film!',
    rating: 10,
    badge: 'Premium', // Exemple
    media_id: 'movie_755898',
  });
```

### Afficher un Badge
```tsx
{review.badge && (
  <Badge className={getBadgeColor(review.badge)}>
    {review.badge}
  </Badge>
)}
```

### Fonction Helper pour Couleurs
```typescript
const getBadgeColor = (badge: string): string => {
  const badgeColors: Record<string, string> = {
    'Premium': 'bg-gradient-to-r from-purple-600 to-purple-500',
    'VIP': 'bg-gradient-to-r from-gold-600 to-yellow-500',
    'Fondateur': 'bg-gradient-to-r from-red-600 to-red-500',
    'Admin': 'bg-gradient-to-r from-red-700 to-red-600',
    'Creator': 'bg-gradient-to-r from-blue-600 to-blue-500',
    'Critique': 'bg-gradient-to-r from-purple-600 to-pink-600',
    'Fan d\'Anime': 'bg-gradient-to-r from-pink-600 to-pink-500',
    'Vérifiée': 'bg-gradient-to-r from-blue-500 to-cyan-500',
    'Ambassadeur': 'bg-gradient-to-r from-purple-500 to-pink-500',
    'Influenceur': 'bg-gradient-to-r from-pink-500 to-rose-500',
  };
  return badgeColors[badge] || 'bg-white/10';
};
```

## 📊 Statistiques

- **Total de Badges:** 45+
- **Catégories:** 10
- **Badges Premium:** 4
- **Badges Admin:** 3
- **Badges Spécialisation:** 5

## ✨ Badges Spéciaux

### Combo Badges (Possibilité d'avoir plusieurs)
- Un utilisateur peut avoir: "Premium + Critique + Ambassadeur"
- Affichage: Afficher 1-3 badges max pour lisibilité

### Badges Animés (Suggestion)
- **Trending:** Badge qui pulse/brille
- **Nouveau:** Badge avec animation d'apparition
- **Étoile d'Or:** Badge scintillant

## 🎨 Palette Couleurs Badge
```
- Purple: Premium, Critique, Creator Premium
- Red: Admin, Fondateur, Master Horror
- Gold: VIP, Étoile d'Or, Elite
- Blue: Creator, Vérifiée, Officiel
- Cyan: 4K Lover, HDR Certified
- Green: Support, Certificat, Binge Master
- Pink: VIP, Fan d'Anime, Influenceur
- Orange: Modérateur, Weekend Warrior
```

---

**Créé:** 2025-12-26
**Version:** 1.0
**Statut:** ✅ Complete et Documentée
