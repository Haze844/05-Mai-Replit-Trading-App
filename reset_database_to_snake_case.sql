-- Skript zum Zurücksetzen der Datenbank auf konsistente snake_case-Spaltennamen
-- Löschen aller vorhandenen Tabellen für einen Neuanfang

-- Löschen aller existierenden Tabellen mit CASCADE, um Fremdschlüsselabhängigkeiten zu berücksichtigen
DROP TABLE IF EXISTS strategy_comments CASCADE;
DROP TABLE IF EXISTS trading_strategies CASCADE;
DROP TABLE IF EXISTS macro_economic_events CASCADE;
DROP TABLE IF EXISTS trading_streaks CASCADE;
DROP TABLE IF EXISTS coaching_feedback CASCADE;
DROP TABLE IF EXISTS coaching_goals CASCADE;
DROP TABLE IF EXISTS setup_win_rates CASCADE;
DROP TABLE IF EXISTS performance_data CASCADE;
DROP TABLE IF EXISTS weekly_summaries CASCADE;
DROP TABLE IF EXISTS trades CASCADE;
DROP TABLE IF EXISTS app_settings CASCADE;
DROP TABLE IF EXISTS settings CASCADE; -- Alte Tabellennamen berücksichtigen
DROP TABLE IF EXISTS weekly_summary CASCADE; -- Alte Tabellennamen berücksichtigen
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;

-- Erstellen der Tabellen mit konsistenten snake_case-Namen

-- Sessions-Tabelle für Passport-Authentifizierung
CREATE TABLE sessions (
  sid VARCHAR PRIMARY KEY,
  sess JSONB NOT NULL,
  expire TIMESTAMP(6) NOT NULL
);
CREATE INDEX IDX_sessions_expire ON sessions (expire);

-- Users-Tabelle
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  type VARCHAR(50) DEFAULT 'user',
  is_admin BOOLEAN DEFAULT false
);

-- Trades-Tabelle mit allen Feldern in snake_case
CREATE TABLE trades (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  symbol VARCHAR(50),
  date TIMESTAMP,
  setup VARCHAR(255),
  main_trend_m15 VARCHAR(50),
  internal_trend_m5 VARCHAR(50),
  entry_type VARCHAR(50),
  entry_level VARCHAR(50),
  position_size VARCHAR(50),
  take_profit VARCHAR(50),
  stop_loss VARCHAR(50),
  exit_level VARCHAR(50),
  potential_rrr NUMERIC(10, 2),
  actual_rrr NUMERIC(10, 2),
  trade_duration VARCHAR(50),
  trade_result VARCHAR(50),
  profit_loss NUMERIC(10, 2),
  is_win BOOLEAN,
  notes TEXT,
  chart_image_url VARCHAR(255),
  chart_image BYTEA,
  liquidity_level VARCHAR(50),
  deviation VARCHAR(50),
  session_nyc BOOLEAN,
  session_london BOOLEAN,
  session_asia BOOLEAN,
  session_time VARCHAR(50),
  trend_alignment VARCHAR(50),
  smart_money_concept VARCHAR(50),
  market_structure VARCHAR(50),
  advanced_pattern VARCHAR(50),
  chart_pattern VARCHAR(50),
  fundamental_news VARCHAR(50),
  wick_fill VARCHAR(50),
  spread_size VARCHAR(50),
  psychological_level VARCHAR(50),
  trade_management VARCHAR(50),
  exit_reason VARCHAR(50),
  advanced_exit VARCHAR(50),
  liquidation VARCHAR(50),
  liquidation_level VARCHAR(50),
  liquidation_entry VARCHAR(50),
  location VARCHAR(50),
  rr_achieved NUMERIC(10, 2),
  rr_potential NUMERIC(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weekly Summaries Tabelle
CREATE TABLE weekly_summaries (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  total_trades INTEGER,
  winning_trades INTEGER,
  losing_trades INTEGER,
  win_rate NUMERIC(5, 2),
  profit_loss NUMERIC(10, 2),
  avg_rr_ratio NUMERIC(5, 2),
  best_trade_id INTEGER REFERENCES trades(id),
  worst_trade_id INTEGER REFERENCES trades(id),
  lessons_learned TEXT,
  goals_next_week TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Performance Data Tabelle
CREATE TABLE performance_data (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  account_balance NUMERIC(10, 2),
  profit_loss NUMERIC(10, 2),
  drawdown NUMERIC(5, 2),
  win_rate NUMERIC(5, 2),
  average_win NUMERIC(10, 2),
  average_loss NUMERIC(10, 2),
  total_trades INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Setup Win Rates Tabelle
CREATE TABLE setup_win_rates (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  setup VARCHAR(255) NOT NULL,
  win_rate NUMERIC(5, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coaching Goals Tabelle
CREATE TABLE coaching_goals (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  goal_type VARCHAR(50), -- 'daily', 'weekly', 'monthly'
  description TEXT,
  target_value NUMERIC(10, 2),
  current_value NUMERIC(10, 2),
  completed BOOLEAN DEFAULT false,
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coaching Feedback Tabelle
CREATE TABLE coaching_feedback (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT,
  category VARCHAR(50), -- 'strategy', 'psychology', 'risk', 'discipline'
  importance INTEGER, -- 1-5
  acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trading Streaks Tabelle
CREATE TABLE trading_streaks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  experience_points INTEGER DEFAULT 0,
  badges TEXT[], -- Array mit Errungenschaften
  last_trade_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Makroökonomische Ereignisse
CREATE TABLE macro_economic_events (
  id SERIAL PRIMARY KEY,
  date TIMESTAMP NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  impact VARCHAR(50), -- 'high', 'medium', 'low'
  time VARCHAR(50),
  actual VARCHAR(50),
  forecast VARCHAR(50),
  previous VARCHAR(50),
  country VARCHAR(50),
  currency VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trading Strategies
CREATE TABLE trading_strategies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  setup_type VARCHAR(100),
  entry_rules TEXT,
  exit_rules TEXT,
  risk_management TEXT,
  timeframes VARCHAR(100),
  symbols TEXT[],
  public BOOLEAN DEFAULT false,
  rating INTEGER DEFAULT 0,
  rating_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Strategy Comments
CREATE TABLE strategy_comments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  strategy_id INTEGER NOT NULL REFERENCES trading_strategies(id),
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- App Settings
CREATE TABLE app_settings (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  theme VARCHAR(50) DEFAULT 'light',
  notifications BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  offline_mode_enabled BOOLEAN DEFAULT false,
  last_synced_at TIMESTAMP,
  device_id VARCHAR(255),
  language VARCHAR(10) DEFAULT 'de',
  currency VARCHAR(10) DEFAULT 'EUR',
  chart_timeframe VARCHAR(50) DEFAULT 'D1',
  auto_logout_minutes INTEGER DEFAULT 30,
  base_pa_balance NUMERIC(10, 2) DEFAULT 2500,
  base_eva_balance NUMERIC(10, 2) DEFAULT 1500,
  base_ek_balance NUMERIC(10, 2) DEFAULT 1000,
  pa_goal NUMERIC(10, 2) DEFAULT 7500,
  eva_goal NUMERIC(10, 2) DEFAULT 7500,
  ek_goal NUMERIC(10, 2) DEFAULT 5000,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indizes für bessere Performance
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_date ON trades(date);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_weekly_summaries_user_id ON weekly_summaries(user_id);
CREATE INDEX idx_weekly_summaries_week_start ON weekly_summaries(week_start);
CREATE INDEX idx_performance_data_user_id ON performance_data(user_id);
CREATE INDEX idx_performance_data_date ON performance_data(date);
CREATE INDEX idx_setup_win_rates_user_id ON setup_win_rates(user_id);
CREATE INDEX idx_coaching_goals_user_id ON coaching_goals(user_id);
CREATE INDEX idx_coaching_feedback_user_id ON coaching_feedback(user_id);
CREATE INDEX idx_trading_streaks_user_id ON trading_streaks(user_id);
CREATE INDEX idx_macro_economic_events_date ON macro_economic_events(date);
CREATE INDEX idx_trading_strategies_user_id ON trading_strategies(user_id);
CREATE INDEX idx_strategy_comments_strategy_id ON strategy_comments(strategy_id);
CREATE INDEX idx_app_settings_user_id ON app_settings(user_id);

-- Standard Admin-Benutzer erstellen
INSERT INTO users (username, password, email, type, is_admin, created_at, updated_at)
VALUES 
  ('admin', '$2b$10$1aFW1Y7FSkjQKRKp1JXoIu8kGC3OGNpLk9kPd6Qe9rX.VJ7XB2J1a', 'admin@example.com', 'admin', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
  ('mo', '$2b$10$RfTlFrOHRCN.HEpKgCGvL.RIq5Z7idAlzp/zlP3XEdW5jgvDLc2YO', 'mo@example.com', 'user', false, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Standard App-Einstellungen für Benutzer
INSERT INTO app_settings 
  (user_id, base_pa_balance, base_eva_balance, base_ek_balance, pa_goal, eva_goal, ek_goal)
VALUES 
  (1, 2500, 1500, 1000, 7500, 7500, 5000),
  (2, 2500, 1500, 1000, 7500, 7500, 5000);