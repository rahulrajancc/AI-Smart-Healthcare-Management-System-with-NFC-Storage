import React, { useState, useEffect } from 'react'
import { StatusBar } from 'expo-status-bar'
import { StyleSheet, Text } from 'react-native'
import { NavigationContainer } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Login from './components/pages/Login'
import Signup from './components/pages/Signup'
import Home from './components/pages/Home'
import Settings from './components/pages/Settings'
import Card from './components/pages/Card'
import MedAi from './components/pages/MedAi'
import Search from './components/pages/Search'
import Recript from './components/pages/recript'

const Tabs = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

// context to share logged-in user info (phone, cardId, etc.)
export const UserContext = React.createContext({ user: null, setUser: () => {} })

// Tab Navigator (shown after auth)
function TabNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0a84ff',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: { backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#eee' },
      }}
    >
      <Tabs.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />
      <Tabs.Screen
        name="Search"
        component={Search}
        options={{
          tabBarLabel: 'Search',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🔍</Text>,
        }}
      />
      <Tabs.Screen
        name="MedAI"
        component={MedAi}
        options={{
          tabBarLabel: 'MedAi',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>🤖</Text>,
        }}
      />
      <Tabs.Screen
        name="Recript"
        component={Recript}
        options={{
          tabBarLabel: 'Rx',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>📝</Text>,
        }}
      />
      <Tabs.Screen
        name="Settings"
        component={Settings}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: () => <Text style={{ fontSize: 20 }}>⚙️</Text>,
        }}
      />
    </Tabs.Navigator>
  )
}

// Auth Stack (Login/Signup)
function AuthStack({ setCurrentPage, setUser }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen
        name="LoginScreen"
        options={{ headerShown: false }}
      >
        {() => (
          <Login
            onLoginSuccess={(user) => {
              // when login succeeds we receive at least { phone }
              // fetch full profile so cardId is available
              fetch(`http://10.249.2.231:2000/api/user/${user.phone}`)
                .then((r) => r.ok ? r.json() : null)
                .then((profile) => {
                  setUser(profile || { phone: user.phone })
                  setCurrentPage('home')
                })
                .catch(() => {
                  setUser({ phone: user.phone })
                  setCurrentPage('home')
                })
            }}
            onNavigateSignup={() => setCurrentPage('signup')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen
        name="SignupScreen"
        options={{ headerShown: false }}
      >
        {() => (
          <Signup
            onSignupSuccess={() => setCurrentPage('login')}
            onNavigateLogin={() => setCurrentPage('login')}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  )
}

export default function App() {
  const [currentPage, setCurrentPage] = useState('login')
  const [user, setUser] = useState(null)

  useEffect(() => {
    // Optionally check stored auth token on app load
    // For now, default to login
  }, [])

  return (
    <UserContext.Provider value={{ user, setUser }}>
      <NavigationContainer>
        {currentPage === 'login' || currentPage === 'signup' ? (
          <AuthStack setCurrentPage={setCurrentPage} setUser={setUser} />
        ) : (
          <TabNavigator />
        )}
      </NavigationContainer>
    </UserContext.Provider>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
})
