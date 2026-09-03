// EXPO_PUBLIC_* est inliné au build, comme NEXT_PUBLIC_* côté web.
// Défaut : le déploiement atelier-maths actuel, pour pouvoir lancer l'app sans
// rien configurer. À fixer explicitement dans .env avant un build EAS de prod.
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'https://formations-beta-inky.vercel.app'
