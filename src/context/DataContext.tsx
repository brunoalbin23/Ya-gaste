import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthContext';
import { CATEGORIES } from '../constants/categories';
import { computeStats } from '../utils/format';
import type { Gasto, Ingreso, Profile, Familia, Stats } from '../types';

interface DataContextValue {
  gastos: Gasto[];
  ingresos: Ingreso[];
  stats: Stats;
  profile: Profile | null;
  familia: Familia | null;
  familiaMembers: Profile[];
  loading: boolean;
  error: string | null;

  addExpense(g: Pick<Gasto, 'categoria' | 'monto' | 'descripcion'>): Promise<void>;
  addIncome(i: Pick<Ingreso, 'tipo' | 'monto' | 'descripcion'>): Promise<void>;
  deleteExpense(id: string): Promise<void>;
  deleteIncome(id: string): Promise<void>;

  updateNombre(nombre: string): Promise<void>;
  joinFamilia(codigo: string): Promise<void>;
  leaveFamilia(): Promise<void>;
  refreshData(): Promise<void>;

  showAddExpense: boolean;
  setShowAddExpense(v: boolean): void;
  showAddIncome: boolean;
  setShowAddIncome(v: boolean): void;
  showNewCat: boolean;
  setShowNewCat(v: boolean): void;
  presetCategory: string | null;
  openAddExpense(catId?: string | null): void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [familia, setFamilia] = useState<Familia | null>(null);
  const [familiaMembers, setFamiliaMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [presetCategory, setPresetCategory] = useState<string | null>(null);

  const stats: Stats = useMemo(
    () => computeStats({ gastos, ingresos }, CATEGORIES),
    [gastos, ingresos],
  );

  useEffect(() => {
    if (session?.user?.id) loadData();
  }, [session?.user?.id]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const userId = session!.user.id;

      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      if (profErr) throw profErr;
      setProfile(prof);

      const { data: fam, error: famErr } = await supabase
        .from('familias')
        .select('*')
        .eq('id', prof.familia_id)
        .single();
      if (famErr) throw famErr;
      setFamilia(fam);

      const { data: members } = await supabase
        .from('profiles')
        .select('*')
        .eq('familia_id', prof.familia_id);
      setFamiliaMembers(members ?? []);

      const { data: g, error: gErr } = await supabase
        .from('gastos')
        .select('*, profiles(nombre)')
        .eq('familia_id', prof.familia_id)
        .order('fecha', { ascending: false });
      if (gErr) throw gErr;
      setGastos(g ?? []);

      const { data: i, error: iErr } = await supabase
        .from('ingresos')
        .select('*, profiles(nombre)')
        .eq('familia_id', prof.familia_id)
        .order('fecha', { ascending: false });
      if (iErr) throw iErr;
      setIngresos(i ?? []);
    } catch (e: any) {
      setError(e.message ?? 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }

  async function addExpense(g: Pick<Gasto, 'categoria' | 'monto' | 'descripcion'>) {
    if (!profile) return;
    const { data, error } = await supabase
      .from('gastos')
      .insert({
        user_id: session!.user.id,
        familia_id: profile.familia_id,
        categoria: g.categoria,
        monto: g.monto,
        descripcion: g.descripcion,
        fecha: new Date().toISOString(),
      })
      .select('*, profiles(nombre)')
      .single();
    if (error) throw error;
    setGastos(prev => [data, ...prev]);
  }

  async function addIncome(i: Pick<Ingreso, 'tipo' | 'monto' | 'descripcion'>) {
    if (!profile) return;
    const { data, error } = await supabase
      .from('ingresos')
      .insert({
        user_id: session!.user.id,
        familia_id: profile.familia_id,
        tipo: i.tipo,
        monto: i.monto,
        descripcion: i.descripcion,
        fecha: new Date().toISOString(),
      })
      .select('*, profiles(nombre)')
      .single();
    if (error) throw error;
    setIngresos(prev => [data, ...prev]);
  }

  async function deleteExpense(id: string) {
    const { error } = await supabase.from('gastos').delete().eq('id', id);
    if (error) throw error;
    setGastos(prev => prev.filter(g => g.id !== id));
  }

  async function deleteIncome(id: string) {
    const { error } = await supabase.from('ingresos').delete().eq('id', id);
    if (error) throw error;
    setIngresos(prev => prev.filter(i => i.id !== id));
  }

  async function updateNombre(nombre: string) {
    if (nombre.length < 2 || nombre.length > 30) {
      throw new Error('El nombre debe tener entre 2 y 30 caracteres');
    }
    const { data, error } = await supabase
      .from('profiles')
      .update({ nombre })
      .eq('user_id', session!.user.id)
      .select()
      .single();
    if (error) throw error;
    setProfile(data);
  }

  async function joinFamilia(codigo: string) {
    const { error } = await supabase.rpc('join_familia', { p_codigo: codigo.toUpperCase().trim() });
    if (error) throw error;
    await loadData();
  }

  async function leaveFamilia() {
    const { error } = await supabase.rpc('leave_familia');
    if (error) throw error;
    await loadData();
  }

  function openAddExpense(catId: string | null = null) {
    setPresetCategory(catId);
    setShowAddExpense(true);
  }

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#FBF6EE', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color="#C5B8E3" size="large" />
      </View>
    );
  }

  return (
    <DataContext.Provider value={{
      gastos, ingresos, stats, profile, familia, familiaMembers,
      loading, error,
      addExpense, addIncome, deleteExpense, deleteIncome,
      updateNombre, joinFamilia, leaveFamilia, refreshData: loadData,
      showAddExpense, setShowAddExpense,
      showAddIncome, setShowAddIncome,
      showNewCat, setShowNewCat,
      presetCategory, openAddExpense,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData fuera de DataProvider');
  return ctx;
}
