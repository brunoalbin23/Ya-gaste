export const CATEGORIES = [
  { id: 'hogar',     nombre: 'Hogar',     emoji: '🏠', color: '#FFB8B8', tint: '#FFE5E0', anim: 'flotar'  },
  { id: 'auto',      nombre: 'Auto',      emoji: '🚗', color: '#9DD6EE', tint: '#E0F1F8', anim: 'andar'   },
  { id: 'comida',    nombre: 'Comida',    emoji: '🍕', color: '#FFD58A', tint: '#FFEFD4', anim: 'pulsar'  },
  { id: 'impuestos', nombre: 'Impuestos', emoji: '📋', color: '#C5B8E3', tint: '#ECE6F6', anim: 'tilt'    },
  { id: 'salud',     nombre: 'Salud',     emoji: '💊', color: '#9FDCB8', tint: '#DEF1E5', anim: 'jiggle'  },
  { id: 'ocio',      nombre: 'Ocio',      emoji: '🎬', color: '#F5A8C7', tint: '#FBDDE8', anim: 'wiggle'  },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map(c => [c.id, c]));
