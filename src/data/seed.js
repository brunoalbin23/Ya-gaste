function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

export const SEED = {
  gastos: [
    { id: 'g1',  fecha: daysAgo(0),  categoria: 'comida',    monto: 4800,  descripcion: 'Pedido de empanadas' },
    { id: 'g2',  fecha: daysAgo(0),  categoria: 'auto',      monto: 12500, descripcion: 'Nafta YPF' },
    { id: 'g3',  fecha: daysAgo(1),  categoria: 'hogar',     monto: 14200, descripcion: 'Luz Edenor' },
    { id: 'g4',  fecha: daysAgo(2),  categoria: 'comida',    monto: 18650, descripcion: 'Súper Coto' },
    { id: 'g5',  fecha: daysAgo(3),  categoria: 'salud',     monto: 7300,  descripcion: 'Farmacia — antibiótico' },
    { id: 'g6',  fecha: daysAgo(4),  categoria: 'hogar',     monto: 45000, descripcion: 'Alquiler depto' },
    { id: 'g7',  fecha: daysAgo(5),  categoria: 'ocio',      monto: 6200,  descripcion: 'Cine — entrada' },
    { id: 'g8',  fecha: daysAgo(6),  categoria: 'auto',      monto: 4500,  descripcion: 'Lavadero' },
    { id: 'g9',  fecha: daysAgo(7),  categoria: 'impuestos', monto: 22800, descripcion: 'ABL bimestral' },
    { id: 'g10', fecha: daysAgo(8),  categoria: 'comida',    monto: 9400,  descripcion: 'Verdulería del barrio' },
    { id: 'g11', fecha: daysAgo(10), categoria: 'salud',     monto: 32000, descripcion: 'Obra social mensual' },
    { id: 'g12', fecha: daysAgo(12), categoria: 'comida',    monto: 5600,  descripcion: 'Café con Sofi' },
    { id: 'g13', fecha: daysAgo(14), categoria: 'ocio',      monto: 14000, descripcion: 'Spotify + Netflix' },
    { id: 'g14', fecha: daysAgo(16), categoria: 'hogar',     monto: 8900,  descripcion: 'Internet Fibertel' },
    { id: 'g15', fecha: daysAgo(20), categoria: 'impuestos', monto: 18500, descripcion: 'Monotributo' },
  ],
  ingresos: [
    { id: 'i1', fecha: daysAgo(2),  fuente: 'Sueldo',    monto: 850000, nota: 'Empresa SA — abril' },
    { id: 'i2', fecha: daysAgo(8),  fuente: 'Freelance', monto: 145000, nota: 'Diseño logo cliente' },
    { id: 'i3', fecha: daysAgo(15), fuente: 'Otros',     monto: 32000,  nota: 'Venta marketplace' },
  ],
};
