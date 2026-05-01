import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, PALETTE } from '../constants/theme';
import DashboardScreen from '../screens/DashboardScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import NuevoScreen from '../screens/NuevoScreen';
import IncomeScreen from '../screens/IncomeScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const ICON_SIZE = 20;
const LABEL_SIZE = 9;

function NavIcon({ name, active }) {
  const opacity = active ? 1 : 0.45;
  if (name === 'home')   return <Text style={{ fontSize: ICON_SIZE, opacity }}>🏠</Text>;
  if (name === 'list')   return <Text style={{ fontSize: ICON_SIZE, opacity }}>🧾</Text>;
  if (name === 'add')    return <Text style={{ fontSize: ICON_SIZE, opacity }}>✨</Text>;
  if (name === 'wallet') return <Text style={{ fontSize: ICON_SIZE, opacity }}>💰</Text>;
  if (name === 'chart')  return <Text style={{ fontSize: ICON_SIZE, opacity }}>📊</Text>;
  if (name === 'person') return <Text style={{ fontSize: ICON_SIZE, opacity }}>👤</Text>;
  return null;
}

const TABS = [
  { name: 'Inicio',   icon: 'home',   route: 'Inicio'   },
  { name: 'Gastos',   icon: 'list',   route: 'Gastos'   },
  { name: 'Nuevo',    icon: 'add',    route: 'Nuevo'    },
  { name: 'Ingresos', icon: 'wallet', route: 'Ingresos' },
  { name: 'Reportes', icon: 'chart',  route: 'Reportes' },
  { name: 'Perfil',   icon: 'person', route: 'Perfil'   },
];

function CustomTabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const routeNames = state.routes.map(r => r.name);

  return (
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, paddingBottom: insets.bottom + 8 }}>
      <View style={{
        marginHorizontal: 12, height: 64, borderRadius: 22,
        backgroundColor: PALETTE.card, flexDirection: 'row', alignItems: 'center',
        shadowColor: PALETTE.ink, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08, shadowRadius: 12, elevation: 8,
      }}>
        {TABS.map((item) => {
          const routeIndex = routeNames.indexOf(item.route);
          const active = state.index === routeIndex;

          return (
            <Pressable
              key={item.name}
              onPress={() => navigation.navigate(item.route)}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}
            >
              <NavIcon name={item.icon} active={active} />
              <Text style={{
                fontSize: LABEL_SIZE, ...FONTS.bodySemiBold,
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
      <Tab.Screen name="Inicio"    component={DashboardScreen} />
      <Tab.Screen name="Gastos"    component={ExpensesScreen}  />
      <Tab.Screen name="Nuevo"     component={NuevoScreen}     />
      <Tab.Screen name="Ingresos"  component={IncomeScreen}    />
      <Tab.Screen name="Reportes"  component={ReportsScreen}   />
      <Tab.Screen name="Perfil"    component={ProfileScreen}   />
    </Tab.Navigator>
  );
}
