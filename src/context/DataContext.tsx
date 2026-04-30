import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuth } from './AuthContext';
import { CATEGORIES } from '../constants/categories';
import { computeStats } from '../utils/format';
import type { Gasto, Ingreso, Profile, Familia, Stats, CustomCategory, AllCategory, AllTipoIngreso } from '../types';

const BASE_TIPOS_INGRESO: AllTipoIngreso[] = [
  { id: 'Trabajo', nombre: 'Trabajo', emoji: '💼', color: '#9DD6EE', tint: '#E0F1F8', isCustom: false },
  { id: 'Otros',   nombre: 'Otros',   emoji: '✨', color: '#C5B8E3', tint: '#ECE6F6', isCustom: false },
];

interface DataContextValue {
  gastos: Gasto[];
  ingresos: Ingreso[];
  stats: Stats;
  profile: Profile | null;
  familia: Familia | null;
  familiaMembers: Profile[];
  loading: boolean;
  error: string | null;

  customCategories: CustomCategory[];
  allCategories: AllCategory[];
  customIncomeTipos: CustomCategory[];
  allIncomeTipos: AllTipoIngreso[];

  addExpense(g: Pick<Gasto, 'categoria' | 'monto' | 'descripcion'>): Promise<void>;
  addExpenses(items: Pick<Gasto, 'categoria' | 'monto' | 'descripcion'>[]): Promise<void>;
  addIncome(i: Pick<Ingreso, 'tipo' | 'monto' | 'descripcion'>): Promise<void>;
  updateExpense(id: string, data: Pick<Gasto, 'categoria' | 'monto' | 'descripcion'>): Promise<void>;
  updateIncome(id: string, data: Pick<Ingreso, 'tipo' | 'monto' | 'descripcion'>): Promise<void>;
  deleteExpense(id: string): Promise<void>;
  deleteIncome(id: string): Promise<void>;
  addCustomCategory(cat: Pick<CustomCategory, 'nombre' | 'emoji' | 'color'>): Promise<void>;
  addCustomIncomeTipo(cat: Pick<CustomCategory, 'nombre' | 'emoji' | 'color'>): Promise<void>;
  deleteCustomCategory(id: string): Promise<void>;
  createFamilia(): Promise<void>;

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
  showAISheet: boolean;
  setShowAISheet(v: boolean): void;
  showNewIncomeTipo: boolean;
  setShowNewIncomeTipo(v: boolean): void;
  presetCategory: string | null;
  openAddExpense(catId?: string | null): void;

  editingExpense: Gasto | null;
  setEditingExpense(g: Gasto | null): void;
  editingIncome: Ingreso | null;
  setEditingIncome(i: Ingreso | null): void;
  openEditExpense(g: Gasto): void;
  openEditIncome(i: Ingreso): void;
}

const DataContext = createContext<DataContextValue | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [ingresos, setIngresos] = useState<Ingreso[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [familia, setFamilia] = useState<Familia | null>(null);
  const [familiaMembers, setFamiliaMembers] = useState<Profile[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [customIncomeTipos, setCustomIncomeTipos] = useState<CustomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [showNewCat, setShowNewCat] = useState(false);
  const [showAISheet, setShowAISheet] = useState(false);
  const [showNewIncomeTipo, setShowNewIncomeTipo] = useState(false);
  const [presetCategory, setPresetCategory] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<Gasto | null>(null);
  const [editingIncome, setEditingIncome] = useState<Ingreso | null>(null);

  const allCategories: AllCategory[] = useMemo(() => {
    const base: AllCategory[] = CATEGORIES.map((c: any) => ({
      id: c.id, nombre: c.nombre, emoji: c.emoji,
      color: c.color, tint: c.tint, anim: c.anim, isCustom: false,
    }));
    const custom: AllCategory[] = customCategories.map(c => ({
      id: c.id, nombre: c.nombre, emoji: c.emoji,
      color: c.color, tint: c.color + '33', anim: 'pulsar', isCustom: true,
    }));
    return [...base, ...custom];
  }, [customCategories]);

  const allIncomeTipos: AllTipoIngreso[] = useMemo(() => [
    ...BASE_TIPOS_INGRESO,
    ...customIncomeTipos.map(c => ({
      id: c.id, nombre: c.nombre, emoji: c.emoji,
      color: c.color, tint: c.color + '33', isCustom: true,
    })),
  ], [customIncomeTipos]);

  const stats: Stats = useMemo(
    () => computeStats({ gastos, ingresos }, allCategories),
    [gastos, ingresos, allCategories],
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
        .from('profiles').select('*').eq('user_id', userId).single();
      if (profErr) throw profErr;
      setProfile(prof);

      // User hasn't set up a family yet
      if (!prof.familia_id) {
        setFamilia(null);
        setFamiliaMembers([]);
        setGastos([]);
        setIngresos([]);
        setCustomCategories([]);
        setCustomIncomeTipos([]);
        return;
      }

      const { data: fam, error: famErr } = await supabase
        .from('familias').select('*').eq('id', prof.familia_id).single();
      if (famErr) throw famErr;
      setFamilia(fam);

      const { data: members } = await supabase
        .from('profiles').select('*').eq('familia_id', prof.familia_id);
      setFamiliaMembers(members ?? []);

      const memberMap = new Map((members ?? []).map((m: any) => [m.user_id, m.nombre]));

      const { data: g, error: gErr } = await supabase
        .from('gastos').select('*').eq('familia_id', prof.familia_id).order('fecha', { ascending: false });
      if (gErr) throw gErr;
      setGastos((g ?? []).map((row: any) => ({ ...row, profiles: { nombre: memberMap.get(row.user_id) ?? '' } })));

      const { data: i, error: iErr } = await supabase
        .from('ingresos').select('*').eq('familia_id', prof.familia_id).order('fecha', { ascending: false });
      if (iErr) throw iErr;
      setIngresos((i ?? []).map((row: any) => ({ ...row, profiles: { nombre: memberMap.get(row.user_id) ?? '' } })));

      const { data: cats } = await supabase
        .from('categorias').select('*').eq('familia_id', prof.familia_id);
      const allCats = cats ?? [];
      setCustomCategories(allCats.filter((c: any) => !c.tipo || c.tipo === 'gasto'));
      setCustomIncomeTipos(allCats.filter((c: any) => c.tipo === 'ingreso'));
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
      .insert({ user_id: session!.user.id, familia_id: profile.familia_id, categoria: g.categoria, monto: g.monto, descripcion: g.descripcion, fecha: new Date().toISOString() })
      .select('*').single();
    if (error) throw error;
    setGastos(prev => [{ ...data, profiles: { nombre: profile.nombre } }, ...prev]);
  }

  async function addExpenses(items: Pick<Gasto, 'categoria' | 'monto' | 'descripcion'>[]) {
    if (!profile || items.length === 0) return;
    const rows = items.map(g => ({
      user_id: session!.user.id,
      familia_id: profile.familia_id,
      categoria: g.categoria,
      monto: g.monto,
      descripcion: g.descripcion,
      fecha: new Date().toISOString(),
    }));
    const { data, error } = await supabase.from('gastos').insert(rows).select('*');
    if (error) throw error;
    const newGastos = (data ?? []).map((row: any) => ({ ...row, profiles: { nombre: profile.nombre } }));
    setGastos(prev => [...newGastos, ...prev]);
  }

  async function addIncome(i: Pick<Ingreso, 'tipo' | 'monto' | 'descripcion'>) {
    if (!profile) return;
    const { data, error } = await supabase
      .from('ingresos')
      .insert({ user_id: session!.user.id, familia_id: profile.familia_id, tipo: i.tipo, monto: i.monto, descripcion: i.descripcion, fecha: new Date().toISOString() })
      .select('*').single();
    if (error) throw error;
    setIngresos(prev => [{ ...data, profiles: { nombre: profile.nombre } }, ...prev]);
  }

  async function updateExpense(id: string, data: Pick<Gasto, 'categoria' | 'monto' | 'descripcion'>) {
    const { error } = await supabase.from('gastos')
      .update({ categoria: data.categoria, monto: data.monto, descripcion: data.descripcion }).eq('id', id);
    if (error) throw error;
    setGastos(prev => prev.map(g => g.id === id ? { ...g, ...data } : g));
  }

  async function updateIncome(id: string, data: Pick<Ingreso, 'tipo' | 'monto' | 'descripcion'>) {
    const { error } = await supabase.from('ingresos')
      .update({ tipo: data.tipo, monto: data.monto, descripcion: data.descripcion }).eq('id', id);
    if (error) throw error;
    setIngresos(prev => prev.map(i => i.id === id ? { ...i, ...data } : i));
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

  async function addCustomCategory(cat: Pick<CustomCategory, 'nombre' | 'emoji' | 'color'>) {
    if (!profile) return;
    const { data, error } = await supabase
      .from('categorias')
      .insert({ familia_id: profile.familia_id, nombre: cat.nombre, emoji: cat.emoji, color: cat.color, tipo: 'gasto' })
      .select('*').single();
    if (error) throw error;
    setCustomCategories(prev => [...prev, data]);
  }

  async function addCustomIncomeTipo(cat: Pick<CustomCategory, 'nombre' | 'emoji' | 'color'>) {
    if (!profile) return;
    const { data, error } = await supabase
      .from('categorias')
      .insert({ familia_id: profile.familia_id, nombre: cat.nombre, emoji: cat.emoji, color: cat.color, tipo: 'ingreso' })
      .select('*').single();
    if (error) throw error;
    setCustomIncomeTipos(prev => [...prev, data]);
  }

  async function createFamilia() {
    const { error } = await supabase.rpc('create_familia');
    if (error) throw error;
    await loadData();
  }

  async function deleteCustomCategory(id: string) {
    const { error } = await supabase.from('categorias').delete().eq('id', id);
    if (error) throw error;
    setCustomCategories(prev => prev.filter(c => c.id !== id));
    setCustomIncomeTipos(prev => prev.filter(c => c.id !== id));
  }

  async function updateNombre(nombre: string) {
    if (nombre.length < 2 || nombre.length > 30) throw new Error('El nombre debe tener entre 2 y 30 caracteres');
    const { data, error } = await supabase
      .from('profiles').update({ nombre }).eq('user_id', session!.user.id).select().single();
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
    setEditingExpense(null);
    setPresetCategory(catId);
    setShowAddExpense(true);
  }

  function openEditExpense(g: Gasto) {
    setPresetCategory(null);
    setEditingExpense(g);
    setShowAddExpense(true);
  }

  function openEditIncome(i: Ingreso) {
    setEditingIncome(i);
    setShowAddIncome(true);
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
      gastos, ingresos, stats, profile, familia, familiaMembers, loading, error,
      customCategories, allCategories, customIncomeTipos, allIncomeTipos,
      addExpense, addExpenses, addIncome, updateExpense, updateIncome,
      deleteExpense, deleteIncome, addCustomCategory, addCustomIncomeTipo, deleteCustomCategory, createFamilia,
      updateNombre, joinFamilia, leaveFamilia, refreshData: loadData,
      showAddExpense, setShowAddExpense,
      showAddIncome, setShowAddIncome,
      showNewCat, setShowNewCat,
      showAISheet, setShowAISheet,
      showNewIncomeTipo, setShowNewIncomeTipo,
      presetCategory, openAddExpense,
      editingExpense, setEditingExpense,
      editingIncome, setEditingIncome,
      openEditExpense, openEditIncome,
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
