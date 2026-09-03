import AsyncStorage from '@react-native-async-storage/async-storage'

const KEY = 'atelier-maths:profil'

export interface Profil {
  prenom: string
  email: string
}

export async function chargerProfil(): Promise<Profil | null> {
  try {
    const raw = await AsyncStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as Profil) : null
  } catch {
    return null
  }
}

export async function sauverProfil(profil: Profil): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(profil))
  } catch {
    // pas bloquant : juste un confort d'UX
  }
}
