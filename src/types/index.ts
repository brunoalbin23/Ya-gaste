export interface Familia {
  id: string;
  codigo: string;
  nombre: string;
  created_at: string;
}

export interface Profile {
  id: string;
  user_id: string;
  nombre: string;
  familia_id: string;
  created_at: string;
}

export interface Gasto {
  id: string;
  user_id: string;
  familia_id: string;
  categoria: string;
  monto: number;
  descripcion: string;
  fecha: string;
  created_at: string;
  profiles?: { nombre: string } | null;
}

export interface Ingreso {
  id: string;
  user_id: string;
  familia_id: string;
  tipo: string;
  monto: number;
  descripcion: string;
  fecha: string;
  created_at: string;
  profiles?: { nombre: string } | null;
}

export interface CategoryStats {
  total: number;
  count: number;
}

export interface Stats {
  totalGastos: number;
  totalIngresos: number;
  balance: number;
  byCat: Record<string, CategoryStats>;
  gastosMes: Gasto[];
  ingresosMes: Ingreso[];
}
