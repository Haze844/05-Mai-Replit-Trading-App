-- SQL-Skript zum Umbenennen aller Spalten von snake_case zu camelCase
-- Tabelle: trades

-- Spaltenumbenennung in der Trades-Tabelle
ALTER TABLE trades RENAME COLUMN main_trend_m15 TO mainTrendM15;
ALTER TABLE trades RENAME COLUMN internal_trend_m5 TO internalTrendM5;
ALTER TABLE trades RENAME COLUMN entry_type TO entryType;
ALTER TABLE trades RENAME COLUMN entry_level TO entryLevel;
ALTER TABLE trades RENAME COLUMN position_size TO positionSize;
ALTER TABLE trades RENAME COLUMN take_profit TO takeProfit;
ALTER TABLE trades RENAME COLUMN stop_loss TO stopLoss;
ALTER TABLE trades RENAME COLUMN exit_level TO exitLevel;
ALTER TABLE trades RENAME COLUMN potential_rrr TO potentialRrr;
ALTER TABLE trades RENAME COLUMN actual_rrr TO actualRrr;
ALTER TABLE trades RENAME COLUMN trade_duration TO tradeDuration;
ALTER TABLE trades RENAME COLUMN trade_result TO tradeResult;
ALTER TABLE trades RENAME COLUMN chart_image_url TO chartImageUrl;
ALTER TABLE trades RENAME COLUMN liquidity_level TO liquidityLevel;
ALTER TABLE trades RENAME COLUMN session_nyc TO sessionNyc;
ALTER TABLE trades RENAME COLUMN session_london TO sessionLondon;
ALTER TABLE trades RENAME COLUMN session_asia TO sessionAsia;
ALTER TABLE trades RENAME COLUMN session_time TO sessionTime;
ALTER TABLE trades RENAME COLUMN trend_alignment TO trendAlignment;
ALTER TABLE trades RENAME COLUMN smart_money_concept TO smartMoneyConcept;
ALTER TABLE trades RENAME COLUMN market_structure TO marketStructure;
ALTER TABLE trades RENAME COLUMN advanced_pattern TO advancedPattern;
ALTER TABLE trades RENAME COLUMN chart_pattern TO chartPattern;
ALTER TABLE trades RENAME COLUMN fundamental_news TO fundamentalNews;
ALTER TABLE trades RENAME COLUMN wick_fill TO wickFill;
ALTER TABLE trades RENAME COLUMN spread_size TO spreadSize;
ALTER TABLE trades RENAME COLUMN psychological_level TO psychologicalLevel;
ALTER TABLE trades RENAME COLUMN trade_management TO tradeManagement;
ALTER TABLE trades RENAME COLUMN exit_reason TO exitReason;
ALTER TABLE trades RENAME COLUMN advanced_exit TO advancedExit;
ALTER TABLE trades RENAME COLUMN liquidation_level TO liquidationLevel;
ALTER TABLE trades RENAME COLUMN liquidation_entry TO liquidationEntry;
ALTER TABLE trades RENAME COLUMN profit_loss TO profitLoss;
ALTER TABLE trades RENAME COLUMN is_win TO isWin;
ALTER TABLE trades RENAME COLUMN created_at TO createdAt;
ALTER TABLE trades RENAME COLUMN updated_at TO updatedAt;
ALTER TABLE trades RENAME COLUMN user_id TO userId;

-- Zusätzlich spezielle Felder für Frontend-Mapping
ALTER TABLE trades RENAME COLUMN rr_achieved TO rrAchieved;
ALTER TABLE trades RENAME COLUMN rr_potential TO rrPotential;

-- Commit der Änderungen
COMMIT;