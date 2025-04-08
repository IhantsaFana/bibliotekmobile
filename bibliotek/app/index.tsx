import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';

// Services
import authService from './services/authService';

// Screens
import OnboardingScreen from './screens/OnboardingScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import MainNavigator from './navigation/MainNavigator';
import BookDetailScreen from './screens/BookDetailScreen';
import BorrowBookScreen from './screens/BorrowBookScreen';
import ScanBookScreen from './screens/ScanBookScreen';

// Types
export type RootStackParamList = {
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  Main: undefined;
  BookDetail: { book: any };
  BorrowBook: { book: any };
  ScanBook: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function Index() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const authenticated = await authService.isAuthenticated();
        setIsAuthenticated(authenticated);
        
        // Check if user has seen onboarding
        const onboardingSeen = await AsyncStorage.getItem('hasSeenOnboarding');
        setHasSeenOnboarding(!!onboardingSeen);
      } catch (error) {
        console.error('Auth check error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator 
          initialRouteName={
            isAuthenticated 
              ? 'Main' 
              : hasSeenOnboarding 
                ? 'Login' 
                : 'Onboarding'
          }
          screenOptions={{ 
            headerShown: false,
            animation: 'slide_from_right'
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Main" component={MainNavigator} />
          <Stack.Screen name="BookDetail" component={BookDetailScreen} />
          <Stack.Screen name="BorrowBook" component={BorrowBookScreen} />
          <Stack.Screen name="ScanBook" component={ScanBookScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}