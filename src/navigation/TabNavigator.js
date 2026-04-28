import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import DashboardScreen from '../screens/DashboardScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import IncomeScreen from '../screens/IncomeScreen';
import ReportsScreen from '../screens/ReportsScreen';

function NavIcon({ name, active }) {
  const color = active ? PALETTE.ink : PALETTE.muted;
  const s = { stroke: color, strokeWidth: 1.8, fill: 'none' };

  if (name === 'home') return (
    <View style={{ width: 22, height: 22 }}>
      <Text style={{ fontSize: 20, color }}>⌂</Text>
    </View>
  );
  if (name === 'list') return <Text style={{ fontSize: 18, color }}>☰</Text>;
  if (name === 'wallet') return <Text style={{ fontSize: 18, color }}>💰</Text>;
  if (name === 'chart') return <Text style={{ fontSize: 18, color }}>📊</Text>;
  return null;
}

function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { openAddExpense } = useData();

  const tabs = [
    { name: 'Inicio',   icon: 'home'   },
    { name: 'Gastos',   icon: 'list'   },
    null,
    { name: 'Ingresos', icon: 'wallet' },
    { name: 'Reportes', icon: 'chart'  },
  ];

  const routeNames = state.routes.map(r => r.name);

  return (
    <View style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: insets.bottom + 8,
      paddingHorizontal: 0,
    }}>
      <View style={{
        marginHorizontal: 16, height: 64, borderRadius: 22,
        backgroundColor: PALETTE.card, flexDirection: 'row', alignItems: 'center',
        shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
      }}>
        {tabs.map((item, idx) => {
          if (!item) {
            return (
              <View key="add" style={{ flex: 1, alignItems: 'center' }}>
                <Pressable
                  onPress={() => openAddExpense()}
                  style={({ pressed }) => ({
                    width: 52, height: 52, borderRadius: 18,
                    backgroundColor: pressed ? '#1a1020' : PALETTE.ink,
                    alignItems: 'center', justifyContent: 'center',
                    marginTop: -16,
                    shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
                  })}
                >
                  <Text style={{ color: '#fff', fontSize: 26, lineHeight: 30, marginTop: -2 }}>+</Text>
                </Pressable>
              </View>
            );
          }

          const routeIndex = routeNames.indexOf(item.name);
          const active = state.index === routeIndex;

          return (
            <Pressable
              key={item.name}
              onPress={() => navigation.navigate(item.name)}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}
            >
              <NavIcon name={item.icon} active={active} />
              <Text style={{
                fontSize: 10, ...FONTS.bodySemiBold, letterSpacing: -0.1,
                color: active ? PALETTE.ink : PALETTE.muted,
                opacity: active ? 1 : 0.7,
              }}>
                {item.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Inicio" component={DashboardScreen} />
      <Tab.Screen name="Gastos" component={ExpensesScreen} />
      <Tab.Screen name="Ingresos" component={IncomeScreen} />
      <Tab.Screen name="Reportes" component={ReportsScreen} />
    </Tab.Navigator>
  );
}
