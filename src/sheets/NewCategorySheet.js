import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { FONTS, PALETTE } from '../constants/theme';
import { useData } from '../context/DataContext';
import Sheet from '../components/Sheet';

export default function NewCategorySheet() {
  const { showNewCat, setShowNewCat } = useData();

  return (
    <Sheet visible={showNewCat} onClose={() => setShowNewCat(false)} title="Nueva categoría">
      <View style={{ paddingVertical: 20, paddingHorizontal: 4, alignItems: 'center' }}>
        <Text style={{ fontSize: 13, color: PALETTE.muted, textAlign: 'center' }}>
          ✨ Próximamente — vas a poder crear categorías personalizadas como Gym, Viajes o Regalos, con su propio color y emoji animado.
        </Text>
      </View>
      <Pressable
        onPress={() => setShowNewCat(false)}
        style={{
          marginTop: 8, height: 48, borderRadius: 14,
          backgroundColor: PALETTE.ink, alignItems: 'center', justifyContent: 'center', marginBottom: 8,
        }}
      >
        <Text style={{ ...FONTS.display, fontWeight: '600', fontSize: 14, color: '#fff' }}>
          Entendido
        </Text>
      </Pressable>
    </Sheet>
  );
}
