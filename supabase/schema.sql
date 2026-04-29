-- ================================================================
-- CHAUCHA — Esquema completo para Supabase
-- Pegar en: Dashboard → SQL Editor → New query → Run
-- ================================================================


-- ── 1. Tablas ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS familias (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo     TEXT        NOT NULL UNIQUE,
  nombre     TEXT        NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS profiles (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre     TEXT        NOT NULL DEFAULT '',
  familia_id UUID        NOT NULL REFERENCES familias(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS gastos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  familia_id  UUID        NOT NULL REFERENCES familias(id),
  categoria   TEXT        NOT NULL,
  monto       INTEGER     NOT NULL CHECK (monto > 0),
  descripcion TEXT        NOT NULL DEFAULT '',
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ingresos (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  familia_id  UUID        NOT NULL REFERENCES familias(id),
  tipo        TEXT        NOT NULL,
  monto       INTEGER     NOT NULL CHECK (monto > 0),
  descripcion TEXT        NOT NULL DEFAULT '',
  fecha       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ── 2. Índices ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_gastos_familia_fecha   ON gastos   (familia_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_ingresos_familia_fecha ON ingresos (familia_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_familia       ON profiles (familia_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user          ON profiles (user_id);


-- ── 3. Row Level Security ────────────────────────────────────────

ALTER TABLE familias ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE gastos   ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingresos ENABLE ROW LEVEL SECURITY;

-- Helper SECURITY DEFINER: evita recursión infinita al consultar
-- familia_id del usuario actual desde dentro de una política de profiles.
CREATE OR REPLACE FUNCTION get_my_familia_id()
RETURNS UUID
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public AS $$
  SELECT familia_id FROM profiles WHERE user_id = auth.uid() LIMIT 1;
$$;

-- familias --------------------------------------------------------
-- INSERT: no hay política → solo funciones SECURITY DEFINER pueden insertar.
CREATE POLICY "familias_select" ON familias
  FOR SELECT USING (id = get_my_familia_id());

CREATE POLICY "familias_update" ON familias
  FOR UPDATE USING (id = get_my_familia_id());

-- profiles --------------------------------------------------------
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (
    user_id = auth.uid()
    OR familia_id = get_my_familia_id()
  );

CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (user_id = auth.uid());

-- gastos ----------------------------------------------------------
CREATE POLICY "gastos_select" ON gastos
  FOR SELECT USING (familia_id = get_my_familia_id());

CREATE POLICY "gastos_insert" ON gastos
  FOR INSERT WITH CHECK (
    user_id    = auth.uid()
    AND familia_id = get_my_familia_id()
  );

CREATE POLICY "gastos_delete" ON gastos
  FOR DELETE USING (user_id = auth.uid());

-- ingresos --------------------------------------------------------
CREATE POLICY "ingresos_select" ON ingresos
  FOR SELECT USING (familia_id = get_my_familia_id());

CREATE POLICY "ingresos_insert" ON ingresos
  FOR INSERT WITH CHECK (
    user_id    = auth.uid()
    AND familia_id = get_my_familia_id()
  );

CREATE POLICY "ingresos_delete" ON ingresos
  FOR DELETE USING (user_id = auth.uid());


-- ── 4. Trigger: crear perfil automáticamente al registrarse ──────
-- Se dispara después de cada INSERT en auth.users.
-- Lee el nombre desde los metadatos que la app envía en signUp:
--   supabase.auth.signUp({ email, password, options: { data: { nombre } } })
-- Si no hay nombre en metadata usa la parte local del email como fallback.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_nombre     TEXT;
  v_familia_id UUID;
  v_codigo     TEXT;
BEGIN
  v_nombre := COALESCE(
    NULLIF(TRIM(NEW.raw_user_meta_data->>'nombre'), ''),
    SPLIT_PART(NEW.email, '@', 1)
  );

  -- Generar código único de 6 caracteres alfanuméricos en mayúscula
  LOOP
    v_codigo := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM familias WHERE codigo = v_codigo);
  END LOOP;

  INSERT INTO familias (codigo, nombre)
  VALUES (v_codigo, 'Familia de ' || v_nombre)
  RETURNING id INTO v_familia_id;

  INSERT INTO profiles (user_id, nombre, familia_id)
  VALUES (NEW.id, v_nombre, v_familia_id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();


-- ── 5. RPCs (SECURITY DEFINER) ───────────────────────────────────

-- Unirse a una familia por código.
-- Migra todos los datos del usuario a la nueva familia.
CREATE OR REPLACE FUNCTION join_familia(p_codigo TEXT)
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_familia_id UUID;
  v_result     JSON;
BEGIN
  SELECT id INTO v_familia_id
  FROM familias
  WHERE codigo = UPPER(TRIM(p_codigo));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Código inválido';
  END IF;

  UPDATE profiles SET familia_id = v_familia_id WHERE user_id = auth.uid();
  UPDATE gastos   SET familia_id = v_familia_id WHERE user_id = auth.uid();
  UPDATE ingresos SET familia_id = v_familia_id WHERE user_id = auth.uid();

  SELECT row_to_json(f) INTO v_result
  FROM (SELECT id, codigo, nombre FROM familias WHERE id = v_familia_id) f;

  RETURN v_result;
END;
$$;

-- Salir de una familia. Crea una familia personal nueva para el usuario.
CREATE OR REPLACE FUNCTION leave_familia()
RETURNS JSON
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public AS $$
DECLARE
  v_nombre     TEXT;
  v_familia_id UUID;
  v_codigo     TEXT;
  v_result     JSON;
BEGIN
  SELECT nombre INTO v_nombre FROM profiles WHERE user_id = auth.uid();

  LOOP
    v_codigo := UPPER(SUBSTRING(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT) FROM 1 FOR 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM familias WHERE codigo = v_codigo);
  END LOOP;

  INSERT INTO familias (codigo, nombre)
  VALUES (v_codigo, 'Familia de ' || v_nombre)
  RETURNING id INTO v_familia_id;

  UPDATE profiles SET familia_id = v_familia_id WHERE user_id = auth.uid();

  SELECT row_to_json(f) INTO v_result
  FROM (SELECT id, codigo, nombre FROM familias WHERE id = v_familia_id) f;

  RETURN v_result;
END;
$$;
