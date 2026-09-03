# Atelier Maths — app mobile

Application compagnon (Android pour l'instant) de [atelier-maths](https://github.com/mhpn-TKPY/atelier-maths) :
un élève photographie sa copie, l'app affiche la lecture par l'IA pour relecture,
puis envoie la correction au professeur via la même API que le site web.

Aucune logique de correction ici — l'app n'est qu'un client. Le moteur IA, le
référentiel et les données restent dans `atelier-maths` (Vercel + Supabase).

## Stack

- Expo SDK 57 / Expo Router / React Native 0.86
- TypeScript strict
- `expo-image-picker` pour la capture photo
- `expo-notifications` pour le jeton push (enregistré côté serveur, envoi à
  faire côté `atelier-maths` — voir "Notifications" plus bas)
- `@react-native-async-storage/async-storage` pour mémoriser prénom/email

## Démarrer en local

```bash
npm install
npm run android   # ou: npm run start, puis scanner le QR avec Expo Go
```

Par défaut l'app pointe vers le déploiement de prod d'atelier-maths
(`https://formations-beta-inky.vercel.app`). Pour pointer ailleurs (preview,
local), copier `.env.example` en `.env` et changer `EXPO_PUBLIC_API_BASE_URL`.

## API consommée

Toutes les routes vivent dans le dépôt `atelier-maths` :

| Route | Statut |
|---|---|
| `POST /api/lecture` | existante |
| `POST /api/correction` | existante |
| `GET /api/chapitres` | **à créer** côté atelier-maths |
| `POST /api/push-tokens` | **à créer** côté atelier-maths (+ migration `push_tokens`) |

Tant que les deux routes manquantes n'existent pas, l'écran d'accueil ne peut
pas charger la liste des chapitres et l'enregistrement du jeton push échoue
silencieusement (best-effort, ne bloque jamais l'envoi d'une correction).

## Notifications

Le jeton Expo Push est demandé et envoyé au backend au moment où l'élève
valide sa correction (si un email a été renseigné). L'envoi effectif de la
notification (« ta correction est prête ») reste à brancher côté serveur,
dans `atelier-maths`, quand le professeur valide une relecture.

## Build & publication (EAS)

Nécessite un compte Expo (gratuit) et un compte Google Play Console (payant,
à créer par vous — voir la documentation Play Console). Rien de tout ça n'est
fait automatiquement.

```bash
npx eas login
npx eas build:configure     # crée le projectId EAS, à reporter dans app.json > extra.eas
npx eas build -p android --profile preview     # APK de test interne
npx eas build -p android --profile production  # AAB pour Play Console
npx eas submit -p android                       # une fois le compte Play Console prêt
```

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint         # expo lint
```
