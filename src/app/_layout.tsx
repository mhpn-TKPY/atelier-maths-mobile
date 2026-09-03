import { Stack } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#1a5f2a' },
          headerTintColor: '#fff',
          headerTitle: 'Atelier Maths',
        }}
      />
      <StatusBar style="light" />
    </SafeAreaProvider>
  )
}
