import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SEED } from '../data/seed';
import { CATEGORIES } from '../constants/categories';
import { computeStats } from '../utils/format';

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [data, setData] = useState(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [presetCategory, setPresetCategory] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('yagaste-v1');
        if (stored) {
          try { setData(JSON.parse(stored)); return; } catch (_) {}
        }
        setData(SEED);
      } catch {
        setData(SEED);
      }
    })();
  }, []);

  useEffect(() => {
    if (data) AsyncStorage.setItem('yagaste-v1', JSON.stringify(data)).catch(() => {});
  }, [data]);

  const stats = useMemo(() => (data ? computeStats(data, CATEGORIES) : null), [data]);

  const addExpense = (g) => setData(d => ({
    ...d,
    gastos: [{ id: 'g' + Date.now(), fecha: new Date().toISOString(), ...g }, ...d.gastos],
  }));

  const addIncome = (i) => setData(d => ({
    ...d,
    ingresos: [{ id: 'i' + Date.now(), fecha: new Date().toISOString(), ...i }, ...d.ingresos],
  }));

  const deleteExpense = (id) => setData(d => ({ ...d, gastos: d.gastos.filter(g => g.id !== id) }));
  const deleteIncome = (id) => setData(d => ({ ...d, ingresos: d.ingresos.filter(i => i.id !== id) }));

  const reset = () => setData(SEED);

  const openAddExpense = (catId = null) => {
    setPresetCategory(catId);
    setShowAddExpense(true);
  };

  if (!data) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FBF6EE', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#C5B8E3" />
      </View>
    );
  }

  return (
    <DataContext.Provider value={{
      data, stats,
      addExpense, addIncome, deleteExpense, deleteIncome, reset,
      showAddExpense, setShowAddExpense, openAddExpense,
      showAddIncome, setShowAddIncome,
      showNewCat, setShowNewCat,
      presetCategory,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export const useData = () => useContext(DataContext);
