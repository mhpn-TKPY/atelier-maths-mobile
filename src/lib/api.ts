import { API_BASE_URL } from './config'
import type { ChapitreMeta, Lecture } from '../types'

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const message = (data as { error?: string } | null)?.error ?? `Erreur ${res.status}`
    throw new Error(message)
  }
  return data as T
}

export async function listerChapitresOuverts(): Promise<ChapitreMeta[]> {
  const res = await fetch(`${API_BASE_URL}/api/chapitres`)
  if (!res.ok) throw new Error('Impossible de charger les chapitres')
  const data = (await res.json()) as { chapitres: ChapitreMeta[] }
  return data.chapitres
}

export async function lireCopie(params: {
  niveau: string
  chapitreId: string
  imageBase64: string
  mediaType: string
}): Promise<Lecture> {
  return postJson<Lecture>('/api/lecture', params)
}

export async function envoyerCorrection(params: {
  niveau: string
  chapitreId: string
  enonce: string
  travail: string
  confiance: 'haute' | 'moyenne' | 'faible'
  pointsIncertains?: string[]
  prenom?: string
  email?: string
}): Promise<{ id: string }> {
  return postJson('/api/correction', params)
}

/** Best-effort : une erreur ici ne doit jamais bloquer l'envoi de la correction. */
export async function enregistrerJetonPush(params: {
  email: string
  expoPushToken: string
  platform: string
}): Promise<void> {
  try {
    await postJson('/api/push-tokens', params)
  } catch (e) {
    console.warn('[push-tokens] enregistrement ignoré :', e)
  }
}
