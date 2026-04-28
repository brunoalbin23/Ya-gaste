import 'react-native-gesture-handler';
import React from 'react';
import { View, Text } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import { DataProvider } from './src/context/DataContext';
import TabNavigator from './src/navigation/TabNavigator';
import CategoryDetailScreen from './src/screens/CategoryDetailScreen';
import AddExpenseSheet from './src/sheets/AddExpenseSheet';
import AddIncomeSheet from './src/sheets/AddIncomeSheet';
import NewCategorySheet from './src/sheets/NewCategorySheet';
import { PALETTE } from './src/constants/theme';

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(e) { return { error: e }; }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#FBF6EE' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#2E2438', marginBottom: 8 }}>Error de renderizado</Text>
          <Text style={{ fontSize: 12, color: '#666', textAlign: 'center' }}>{String(this.state.error)}</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const Stack = createStackNavigator();

function RootNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
        <Stack.Screen name="CategoryDetail" component={CategoryDetailScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <DataProvider>
            <View style={{ flex: 1, backgroundColor: PALETTE.bg }}>
              <RootNavigator />
              <AddExpenseSheet />
              <AddIncomeSheet />
              <NewCategorySheet />
            </View>
          </DataProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
