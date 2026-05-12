import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { PALETTE, FONTS } from '../../constants/theme';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { useSidebar, SIDEBAR_EXPANDED_WIDTH } from '../../context/SidebarContext';

export const SIDEBAR_WIDTH = SIDEBAR_EXPANDED_WIDTH;

// Perfil removed from nav — accessible via user footer button
const NAV_ITEMS = [
  { route: 'Inicio',   label: 'Inicio',   emoji: '🏠' },
  { route: 'Gastos',   label: 'Gastos',   emoji: '🧾' },
  { route: 'Nuevo',    label: 'Nuevo',    emoji: '✨' },
  { route: 'Ingresos', label: 'Ingresos', emoji: '💰' },
  { route: 'Reportes', label: 'Reportes', emoji: '📊' },
] as const;

interface SidebarProps {
  navigate: (route: string) => void;
  activeRoute: string;
}

export default function Sidebar({ navigate, activeRoute }: SidebarProps) {
  const { profile, setShowAISheet } = useData();
  const { signOut } = useAuth();
  const { collapsed, toggle, sidebarWidth } = useSidebar();

  return (
    <View style={{
      width: sidebarWidth,
      backgroundColor: PALETTE.card,
      borderRightWidth: 1,
      borderRightColor: 'rgba(46,36,56,0.07)',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Header: logo + toggle */}
      <View style={{
        paddingTop: 20, paddingBottom: 14, paddingHorizontal: 12,
        flexDirection: 'row', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
      }}>
        {!collapsed && (
          <View>
            <Text style={{ fontSize: 17, fontWeight: '800', color: PALETTE.ink, letterSpacing: -0.5 }}>
              💸 Ya gasté
            </Text>
            <Text style={{ fontSize: 10, color: PALETTE.muted, marginTop: 2 }}>
              Finanzas familiares
            </Text>
          </View>
        )}
        <Pressable
          onPress={toggle}
          style={({ pressed }) => ({
            width: 30, height: 30, borderRadius: 8,
            backgroundColor: pressed ? 'rgba(46,36,56,0.10)' : 'rgba(46,36,56,0.05)',
            alignItems: 'center', justifyContent: 'center',
          })}
        >
          <Text style={{ fontSize: 12, color: PALETTE.muted }}>
            {collapsed ? '▶' : '◀'}
          </Text>
        </Pressable>
      </View>

      {/* CTA — nuevo gasto */}
      <View style={{ paddingHorizontal: collapsed ? 8 : 12, marginBottom: 10 }}>
        <Pressable
          onPress={() => setShowAISheet(true)}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
            backgroundColor: pressed ? '#1a1226' : PALETTE.ink,
            borderRadius: 14, paddingVertical: 11,
          })}
        >
          <Text style={{ fontSize: 18, color: '#fff', lineHeight: 20 }}>+</Text>
          {!collapsed && (
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: -0.2 }}>
              Nuevo gasto
            </Text>
          )}
        </Pressable>
      </View>

      {/* Divider */}
      <View style={{
        height: 1, backgroundColor: 'rgba(46,36,56,0.06)',
        marginHorizontal: collapsed ? 8 : 16, marginBottom: 8,
      }} />

      {/* Nav items */}
      <View style={{ flex: 1, paddingHorizontal: collapsed ? 6 : 8, paddingTop: 4, gap: 2 }}>
        {NAV_ITEMS.map(item => {
          const active = activeRoute === item.route;
          return (
            <Pressable
              key={item.route}
              onPress={() => navigate(item.route)}
              style={({ pressed }) => ({
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: collapsed ? 'center' : 'flex-start',
                gap: 10,
                paddingHorizontal: collapsed ? 6 : 12,
                paddingVertical: 9,
                borderRadius: 12,
                backgroundColor: active
                  ? PALETTE.accent + '66'
                  : pressed ? 'rgba(46,36,56,0.05)' : 'transparent',
              })}
            >
              <Text style={{ fontSize: 17 }}>{item.emoji}</Text>
              {!collapsed && (
                <Text style={{
                  fontSize: 14,
                  ...FONTS.bodySemiBold,
                  fontWeight: active ? '700' : '500',
                  color: active ? PALETTE.ink : PALETTE.muted,
                  letterSpacing: -0.1,
                }}>
                  {item.label}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* User footer — tap avatar/name to open Perfil */}
      <View style={{
        paddingHorizontal: collapsed ? 6 : 12,
        paddingBottom: 20, paddingTop: 14,
        borderTopWidth: 1, borderTopColor: 'rgba(46,36,56,0.07)',
        alignItems: collapsed ? 'center' : 'stretch',
      }}>
        <Pressable
          onPress={() => navigate('Perfil')}
          style={({ pressed }) => ({
            flexDirection: 'row', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10, marginBottom: collapsed ? 0 : 10,
            paddingVertical: 4, paddingHorizontal: 4,
            borderRadius: 10,
            backgroundColor: activeRoute === 'Perfil'
              ? PALETTE.accent + '33'
              : pressed ? 'rgba(46,36,56,0.05)' : 'transparent',
          })}
        >
          <View style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: PALETTE.accent,
            alignItems: 'center', justifyContent: 'center',
          }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: PALETTE.ink }}>
              {profile?.nombre?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          {!collapsed && (
            <Text numberOfLines={1} style={{ flex: 1, fontSize: 13, fontWeight: '600', color: PALETTE.ink }}>
              {profile?.nombre ?? ''}
            </Text>
          )}
        </Pressable>

        {!collapsed && (
          <Pressable
            onPress={signOut}
            style={({ pressed }) => ({
              paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
              backgroundColor: pressed ? 'rgba(192,57,43,0.14)' : 'rgba(192,57,43,0.07)',
            })}
          >
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#C0392B' }}>
              Cerrar sesión
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}
