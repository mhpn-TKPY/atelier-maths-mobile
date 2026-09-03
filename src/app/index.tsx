import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { SafeAreaView } from 'react-native-safe-area-context'

import { enregistrerJetonPush, envoyerCorrection, lireCopie, listerChapitresOuverts } from '@/lib/api'
import { obtenirJetonPush } from '@/lib/notifications'
import { chargerProfil, sauverProfil } from '@/lib/storage'
import type { ChapitreMeta, Lecture } from '@/types'

type Etape = 'saisie' | 'lecture' | 'lecture_ko' | 'envoye'

const VERT = '#1a5f2a'

export default function EcranCorriger() {
  const [chapitres, setChapitres] = useState<ChapitreMeta[]>([])
  const [chargementChapitres, setChargementChapitres] = useState(true)
  const [chapitreId, setChapitreId] = useState('')

  const [prenom, setPrenom] = useState('')
  const [email, setEmail] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState('image/jpeg')

  const [etape, setEtape] = useState<Etape>('saisie')
  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [enonce, setEnonce] = useState('')
  const [travail, setTravail] = useState('')

  const [busy, setBusy] = useState(false)
  const [erreur, setErreur] = useState<string | null>(null)

  useEffect(() => {
    chargerProfil().then((p) => {
      if (p) {
        setPrenom(p.prenom)
        setEmail(p.email)
      }
    })
    listerChapitresOuverts()
      .then((liste) => {
        setChapitres(liste)
        setChapitreId(liste[0]?.id ?? '')
      })
      .catch((e) => setErreur(e instanceof Error ? e.message : 'Chapitres indisponibles'))
      .finally(() => setChargementChapitres(false))
  }, [])

  const chapitre = chapitres.find((c) => c.id === chapitreId)

  async function prendrePhoto() {
    setErreur(null)
    const permission = await ImagePicker.requestCameraPermissionsAsync()
    if (!permission.granted) {
      setErreur('Autorise l’appareil photo dans les réglages pour continuer.')
      return
    }
    const resultat = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
    })
    if (resultat.canceled || !resultat.assets?.[0]) return
    const asset = resultat.assets[0]
    if (!asset.base64) {
      setErreur('Photo illisible, réessaie.')
      return
    }
    setImageUri(asset.uri)
    setImageBase64(asset.base64)
    setMediaType(asset.mimeType ?? 'image/jpeg')
  }

  async function lancerLecture() {
    if (!chapitre || !imageBase64) return
    setBusy(true)
    setErreur(null)
    try {
      const data = await lireCopie({
        niveau: chapitre.niveau,
        chapitreId: chapitre.id,
        imageBase64,
        mediaType,
      })
      setLecture(data)
      setEnonce(data.enonce_reconstruit)
      setTravail(data.travail_eleve_reconstruit)
      setEtape(data.confiance_lecture === 'faible' ? 'lecture_ko' : 'lecture')
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setBusy(false)
    }
  }

  async function confirmer() {
    if (!chapitre || !lecture) return
    setBusy(true)
    setErreur(null)
    try {
      await envoyerCorrection({
        niveau: chapitre.niveau,
        chapitreId: chapitre.id,
        enonce,
        travail,
        confiance: lecture.confiance_lecture,
        pointsIncertains: lecture.points_incertains,
        prenom: prenom || undefined,
        email: email || undefined,
      })
      if (prenom || email) await sauverProfil({ prenom, email })
      if (email) {
        const jeton = await obtenirJetonPush()
        if (jeton) await enregistrerJetonPush({ email, expoPushToken: jeton, platform: Platform.OS })
      }
      setEtape('envoye')
    } catch (e) {
      setErreur(e instanceof Error ? e.message : 'Erreur inconnue')
    } finally {
      setBusy(false)
    }
  }

  function recommencer() {
    setEtape('saisie')
    setImageUri(null)
    setImageBase64(null)
    setLecture(null)
    setEnonce('')
    setTravail('')
    setErreur(null)
  }

  if (chargementChapitres) {
    return (
      <SafeAreaView style={styles.centre}>
        <ActivityIndicator color={VERT} size="large" />
      </SafeAreaView>
    )
  }

  if (chapitres.length === 0) {
    return (
      <SafeAreaView style={styles.centre}>
        <Text style={styles.texte}>Aucun chapitre ouvert pour le moment.</Text>
      </SafeAreaView>
    )
  }

  if (etape === 'envoye') {
    return (
      <SafeAreaView style={styles.centre}>
        <View style={styles.badgeSucces}>
          <Text style={styles.badgeSuccesTexte}>✓</Text>
        </View>
        <Text style={styles.titre}>C&apos;est parti chez le professeur</Text>
        <Text style={[styles.texte, styles.texteCentre]}>
          Il relit la correction avant de te l&apos;envoyer{email ? ` à ${email}` : ''}.
        </Text>
        <Pressable style={styles.boutonSecondaire} onPress={recommencer}>
          <Text style={styles.boutonSecondaireTexte}>Corriger un autre exercice</Text>
        </Pressable>
      </SafeAreaView>
    )
  }

  if (etape === 'lecture' || etape === 'lecture_ko') {
    return (
      <SafeAreaView style={styles.zone} edges={['bottom', 'left', 'right']}>
        <ScrollView contentContainerStyle={styles.contenu}>
          <View style={styles.enTeteLigne}>
            <Text style={styles.section}>Voici ce que j&apos;ai lu</Text>
            {lecture && <Text style={styles.confiance}>confiance {lecture.confiance_lecture}</Text>}
          </View>

          {etape === 'lecture_ko' ? (
            <Text style={styles.alerte}>
              La photo est difficile à lire. Reprends-la : feuille à plat, bien éclairée, cadre
              juste l&apos;exercice.
            </Text>
          ) : (
            <>
              {lecture && lecture.points_incertains.length > 0 && (
                <View style={styles.alerteZone}>
                  {lecture.points_incertains.map((p, i) => (
                    <Text key={i} style={styles.alerte}>
                      • {p}
                    </Text>
                  ))}
                </View>
              )}
              <Text style={styles.label}>Énoncé</Text>
              <TextInput
                style={styles.zoneTexte}
                value={enonce}
                onChangeText={setEnonce}
                multiline
              />
              <Text style={styles.label}>Ton travail</Text>
              <TextInput
                style={styles.zoneTexte}
                value={travail}
                onChangeText={setTravail}
                multiline
              />
              <Text style={styles.aide}>
                Corrige ce texte s&apos;il ne correspond pas exactement à ta copie.
              </Text>
            </>
          )}

          {erreur && <Text style={styles.erreur}>{erreur}</Text>}

          <View style={styles.ligneBoutons}>
            <Pressable style={styles.boutonSecondaire} onPress={recommencer} disabled={busy}>
              <Text style={styles.boutonSecondaireTexte}>Reprendre la photo</Text>
            </Pressable>
            {etape === 'lecture' && (
              <Pressable
                style={[styles.bouton, (busy || !enonce.trim() || !travail.trim()) && styles.boutonDesactive]}
                onPress={confirmer}
                disabled={busy || !enonce.trim() || !travail.trim()}
              >
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.boutonTexte}>C&apos;est bien ça</Text>}
              </Pressable>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.zone} edges={['bottom', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.contenu}>
        <Text style={styles.section}>Ta copie</Text>

        <Text style={styles.label}>Chapitre</Text>
        <View style={styles.chapitreListe}>
          {chapitres.map((c) => (
            <Pressable
              key={c.id}
              style={[styles.chapitrePuce, c.id === chapitreId && styles.chapitrePuceActive]}
              onPress={() => setChapitreId(c.id)}
            >
              <Text
                style={[styles.chapitrePuceTexte, c.id === chapitreId && styles.chapitrePuceTexteActive]}
              >
                {c.niveau} — {c.titre}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Prénom</Text>
        <TextInput style={styles.champ} value={prenom} onChangeText={setPrenom} autoCapitalize="words" />

        <Text style={styles.label}>Email (pour recevoir la correction)</Text>
        <TextInput
          style={styles.champ}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.label}>Photo de l&apos;exercice</Text>
        <Pressable style={styles.zonePhoto} onPress={prendrePhoto}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.apercu} resizeMode="contain" />
          ) : (
            <Text style={styles.zonePhotoTexte}>📷 Prendre une photo</Text>
          )}
        </Pressable>

        {erreur && <Text style={styles.erreur}>{erreur}</Text>}

        <Pressable
          style={[styles.bouton, (busy || !imageBase64) && styles.boutonDesactive]}
          onPress={lancerLecture}
          disabled={busy || !imageBase64}
        >
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.boutonTexte}>Envoyer pour lecture</Text>}
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  zone: { flex: 1, backgroundColor: '#fff' },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#fff' },
  contenu: { padding: 16, gap: 8 },
  section: { fontSize: 18, fontWeight: '700', color: '#111' },
  enTeteLigne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  confiance: {
    fontSize: 12,
    fontWeight: '600',
    color: VERT,
    backgroundColor: '#e6f2e9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  label: { fontSize: 13, fontWeight: '600', color: '#444', marginTop: 12 },
  champ: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  zoneTexte: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    minHeight: 90,
    textAlignVertical: 'top',
  },
  chapitreListe: { gap: 8 },
  chapitrePuce: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  chapitrePuceActive: { borderColor: VERT, backgroundColor: '#e6f2e9' },
  chapitrePuceTexte: { fontSize: 14, color: '#333' },
  chapitrePuceTexteActive: { color: VERT, fontWeight: '600' },
  zonePhoto: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#bbb',
    borderRadius: 10,
    minHeight: 180,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  zonePhotoTexte: { fontSize: 15, color: '#666' },
  apercu: { width: '100%', height: 220 },
  aide: { fontSize: 12, color: '#777', marginTop: 4 },
  alerteZone: { backgroundColor: '#fff7e6', borderRadius: 8, padding: 10, gap: 4 },
  alerte: { fontSize: 13, color: '#8a5a00', backgroundColor: '#fff7e6', padding: 10, borderRadius: 8 },
  erreur: { fontSize: 13, color: '#b00020', marginTop: 8 },
  ligneBoutons: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  bouton: {
    backgroundColor: VERT,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginTop: 16,
  },
  boutonDesactive: { opacity: 0.5 },
  boutonTexte: { color: '#fff', fontSize: 15, fontWeight: '600' },
  boutonSecondaire: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  boutonSecondaireTexte: { color: '#333', fontSize: 15, fontWeight: '600' },
  titre: { fontSize: 18, fontWeight: '700', textAlign: 'center', color: '#111' },
  texte: { fontSize: 14, color: '#444' },
  texteCentre: { textAlign: 'center', maxWidth: 320 },
  badgeSucces: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#e6f2e9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSuccesTexte: { fontSize: 26, color: VERT },
})
