# Déclarations de confidentialité — stores

Lot H4. Ce document dit ce que l'application collecte réellement,
data-type par data-type, pour remplir deux formulaires que ni Google ni
Apple ne laissent remplir par un dépôt de code :

- **Google Play — Data Safety** (Play Console → App content → Data safety) ;
- **Apple — App Privacy** (App Store Connect → App Privacy), dont
  `PrivacyInfo.xcprivacy` est la moitié technique.

Dérivé de `app.json` (permissions Android déclarées, plugins Expo) et de
`package.json` (dépendances qui touchent réellement à une donnée), le
08/09/2026 — jamais deviné.

## Ce que l'application collecte

| Donnée | D'où (code) | Transmise à | Finalité | Liée à l'identité ? |
|---|---|---|---|---|
| Photo de la copie | `expo-image-picker`, permission `CAMERA` (Android) | `atelier-ingest` (VPS OVH) puis Anthropic PBC (lecture OCR + correction) | Fonctionnalité de base de l'app — lire et corriger la copie | Oui, via le compte connecté |
| Texte extrait de la copie et correction | dérivé de la photo, côté serveur | Supabase `carmine-school` (Suisse) | Afficher le brouillon, la relecture du professeur, l'historique | Oui |
| Jeton de notification (push) | `expo-notifications` | Supabase `carmine-school` (table `push_tokens`) puis Expo (650 Industries, États-Unis) pour l'acheminement | Prévenir d'une correction relue ou d'un rendez-vous | Oui — un jeton par compte |
| E-mail, mot de passe (haché) | Supabase Auth, à la connexion | Supabase `carmine-school` | Authentification | Oui |
| Prénom, nom, niveau, établissement | `profiles` (Supabase) | Supabase `carmine-school` | Identifier l'élève auprès du professeur | Oui |

## Ce que l'application NE collecte PAS

- Localisation (aucune permission de géolocalisation demandée) ;
- Contacts, calendrier, micro ;
- Identifiants publicitaires — aucun SDK publicitaire ou d'analytics tiers
  n'est intégré ;
- Données de paiement — aucun mécanisme de paiement dans l'app.

`@react-native-async-storage/async-storage` et `expo-device` sont présents
comme dépendances mais **ne collectent ni ne transmettent rien de leur propre
chef** ici : le premier reste local à l'appareil (aucun usage trouvé dans
`app/`), le second n'est appelé par aucun code applicatif — seul
`expo-notifications` s'en sert en interne pour savoir si l'appareil peut
recevoir des notifications push.

## Google Play — Data Safety, mapping des réponses

| Question du formulaire | Réponse |
|---|---|
| L'app collecte-t-elle des données ? | Oui |
| Photos ou vidéos | Oui — Photos ; finalité : fonctionnalité de l'app ; partagée avec Anthropic PBC (traitement, pas de vente) |
| Informations personnelles (nom, e-mail) | Oui — finalité : fonctionnalité de l'app, gestion du compte |
| Les données sont-elles chiffrées en transit ? | Oui (HTTPS partout) |
| L'utilisateur peut-il demander la suppression ? | Oui — voir H3 (suppression de compte), à finaliser |
| Les données concernent-elles des enfants ? | Oui — collégiens, dont mineurs de moins de 15 ans ; voir H6 pour le consentement parental |

## Apple — App Privacy (App Store Connect)

Mêmes catégories que la table ci-dessus, dans le vocabulaire Apple :
**Photos ou vidéos** et **Contact Info** (nom, e-mail) liés à l'identité de
l'utilisateur, utilisés pour les fonctionnalités de l'app — pas pour le
suivi publicitaire (aucun tracking cross-app, donc pas d'invite ATT
nécessaire).

### `PrivacyInfo.xcprivacy` — pourquoi il n'est pas généré ici

Cette app est en workflow Expo **managé** (pas de dossier `ios/` dans ce
dépôt) : EAS Build agrège au moment de la compilation les manifestes de
confidentialité que chaque SDK natif (`expo-notifications`,
`expo-image-picker`…) embarque déjà depuis le SDK 57 — écrire un fichier
racine à la main ici risquerait de dupliquer ou contredire ce que le build
produit réellement, sans qu'aucun outil de ce dépôt ne puisse le vérifier
(pas d'environnement Xcode disponible). À vérifier au prochain build EAS :
`eas build --platform ios` puis inspecter l'archive produite, ou
`npx expo-doctor`.

## Ce qui reste à faire

- [ ] Remplir effectivement les deux formulaires (Play Console, App Store
      Connect) à partir de ce document — geste humain, dans les tableaux de
      bord des stores.
- [ ] Vérifier l'agrégation `PrivacyInfo.xcprivacy` au prochain build EAS iOS.
- [ ] Répercuter ce même mapping sur `apps/atelier-mobile` et
      `apps/teknopy-mobile` (teknopy-monorepo) le jour où ils sont
      effectivement soumis aux stores — pas fait aujourd'hui, aucun des deux
      n'y est encore publié (D1/D4).
