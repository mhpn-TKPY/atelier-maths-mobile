import * as Device from 'expo-device'
import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

/**
 * Demande la permission et renvoie le jeton push Expo, ou null si refusé /
 * indisponible (émulateur sans Google Play services, par ex.).
 * N'envoie rien au backend — voir enregistrerJetonPush dans lib/api.ts,
 * appelé une fois qu'on connaît l'email de l'élève (à l'envoi de la correction).
 */
export async function obtenirJetonPush(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('[push] pas de jeton sur émulateur/simulateur')
    return null
  }

  const existing = await Notifications.getPermissionsAsync()
  let status = existing.status
  if (status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync()
    status = requested.status
  }
  if (status !== 'granted') return null

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined
  try {
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )
    return token.data
  } catch (e) {
    console.warn('[push] jeton indisponible :', e)
    return null
  }
}
