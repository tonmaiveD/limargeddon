-- Datos anónimos de partidas (ADR 0051). Un registro por pelea, abandono o compra. Sin IP ni identificador del equipo.
CREATE TABLE IF NOT EXISTS events (
  id TEXT PRIMARY KEY,          -- número al azar que pone el juego; repetido se ignora
  v INTEGER NOT NULL,           -- versión del contrato de datos
  kind TEXT NOT NULL,           -- pelea, abandono o compra
  build TEXT NOT NULL,          -- versión del juego
  day TEXT NOT NULL,            -- día de la partida, sin hora
  device TEXT NOT NULL,         -- tipo de equipo, por ejemplo "Android · Chrome · mediana · táctil"
  tester TEXT,                  -- etiqueta del equipo de pruebas, si la hay
  stage TEXT,                   -- etapa (pelea y abandono)
  payload TEXT NOT NULL,        -- el registro completo, en JSON
  received TEXT NOT NULL        -- día en que llegó, para borrar a los 12 meses
);
CREATE INDEX IF NOT EXISTS events_day ON events(day);
CREATE INDEX IF NOT EXISTS events_kind_stage ON events(kind, stage);
