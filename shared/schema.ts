import { pgTable, text, serial, integer, boolean, timestamp, real, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Trade setup types
export const setupTypes = ["BREAKER", "OZEM", "BZEM", "A OZEM", "A BZEM", "MSS", "CISD"] as const;
export const trendTypes = [
  "Long", "Short", 
  "Trend Long", "Trend Short", 
  "Neutral", "Range"
] as const;
export const simpleTrendTypes = ["Long", "Short"] as const;
export const entryLevelTypes = ["50%", "67%"] as const;
export const timeframeTypes = ["M1", "M5", "M15", "H1", "ALL TF"] as const;
export const liquidationTypes = ["M1", "M5", "M15", "H1", "Low Resistance", "Equals"] as const;
export const locationTypes = [
  "FVG", 
  "FVG Sweep", 
  "ca. 50% HS", 
  "ca. 67% HS", 
  "Volumenzone", 
  "Rangekanten", 
  "Mitte der Range", 
  "HTF OB", 
  "Sweep"
] as const;
export const structureTypes = ["Hauptstruktur", "Internal", "Micro"] as const;
export const sessionTypes = ["London", "London Neverland", "NY AM", "NY AM Neverland", "NY PM"] as const;
export const unmitZoneTypes = ["Ja", "Nein", "Mehrere"] as const;
export const marketPhaseTypes = ["Long", "stark Long", "Short", "stark Short", "Range"] as const;
export const rrValues = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const slTypes = ["Sweep", "zerstört"] as const;
export const slPointsValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] as const;
export const accountTypeValues = ["PA", "EVA", "EK"] as const;;

// Trades schema basierend auf der tatsächlichen Datenbankstruktur
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  symbol: text("symbol"),
  date: timestamp("date"),
  setup: text("setup"),
  mainTrendM15: text("main_trend_m15"),
  internalTrendM5: text("internal_trend_m5"),
  entryType: text("entry_type"),
  entryLevel: text("entry_level"),
  positionSize: real("position_size"),
  takeProfit: real("take_profit"),
  stopLoss: real("stop_loss"),
  exitLevel: real("exit_level"),
  potentialRrr: real("potential_rrr"),
  actualRrr: real("actual_rrr"),
  tradeDuration: text("trade_duration"),
  tradeResult: text("trade_result"),
  notes: text("notes"),
  chartImageUrl: text("chart_image_url"),
  liquidityLevel: text("liquidity_level"),
  deviation: text("deviation"),
  sessionNyc: boolean("session_nyc"),
  sessionLondon: boolean("session_london"),
  sessionAsia: boolean("session_asia"),
  sessionTime: text("session_time"),
  trendAlignment: text("trend_alignment"),
  smartMoneyConcept: text("smart_money_concept"),
  marketStructure: text("market_structure"),
  advancedPattern: text("advanced_pattern"),
  chartPattern: text("chart_pattern"),
  fundamentalNews: text("fundamental_news"),
  wickFill: text("wick_fill"),
  spreadSize: text("spread_size"),
  psychologicalLevel: boolean("psychological_level"),
  tradeManagement: text("trade_management"),
  exitReason: text("exit_reason"),
  advancedExit: text("advanced_exit"),
  liquidationLevel: text("liquidation_level"),
  liquidationEntry: text("liquidation_entry"),
  userId: integer("user_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  userId: true,
});

export type InsertTrade = z.infer<typeof insertTradeSchema> & { 
  notes?: string;
  chartImageUrl?: string;
};
export type Trade = typeof trades.$inferSelect;

// Weekly summary schema
export const weeklySummaries = pgTable("weekly_summaries", {
  id: serial("id").primaryKey(),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  totalRR: real("total_rr").notNull(),
  tradeCount: integer("trade_count").notNull(),
  winRate: real("win_rate").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const insertWeeklySummarySchema = createInsertSchema(weeklySummaries).omit({
  id: true,
  userId: true,
});

export type InsertWeeklySummary = z.infer<typeof insertWeeklySummarySchema>;
export type WeeklySummary = typeof weeklySummaries.$inferSelect;

// Performance data schema for chart
export const performanceData = pgTable("performance_data", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  performance: real("performance").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const insertPerformanceDataSchema = createInsertSchema(performanceData).omit({
  id: true,
  userId: true,
});

export type InsertPerformanceData = z.infer<typeof insertPerformanceDataSchema>;
export type PerformanceData = typeof performanceData.$inferSelect;

// Setup win rate schema for chart
export const setupWinRates = pgTable("setup_win_rates", {
  id: serial("id").primaryKey(),
  setup: text("setup").notNull(),
  winRate: real("win_rate").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const insertSetupWinRateSchema = createInsertSchema(setupWinRates).omit({
  id: true,
  userId: true,
});

export type InsertSetupWinRate = z.infer<typeof insertSetupWinRateSchema>;
export type SetupWinRate = typeof setupWinRates.$inferSelect;

// Coach-Ziele und Feedback
export const coachingGoals = pgTable("coaching_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  goalType: text("goal_type", { enum: ["daily", "weekly", "monthly"] }),
  description: text("description"),
  targetValue: integer("target_value"),
  currentValue: integer("current_value").default(0),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  dueDate: timestamp("due_date"),
});

export const insertCoachingGoalSchema = createInsertSchema(coachingGoals).omit({
  id: true,
});

export type InsertCoachingGoal = z.infer<typeof insertCoachingGoalSchema>;
export type CoachingGoal = typeof coachingGoals.$inferSelect;

export const coachingFeedback = pgTable("coaching_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  category: text("category", { enum: ["strategy", "psychology", "risk", "discipline"] }),
  message: text("message"),
  importance: integer("importance").default(1),
  acknowledged: boolean("acknowledged").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCoachingFeedbackSchema = createInsertSchema(coachingFeedback).omit({
  id: true,
});

export type InsertCoachingFeedback = z.infer<typeof insertCoachingFeedbackSchema>;
export type CoachingFeedback = typeof coachingFeedback.$inferSelect;

// Makroökonomische Ereignisse
export const macroEconomicEvents = pgTable("macro_economic_events", {
  id: serial("id").primaryKey(),
  title: text("title"),
  description: text("description"),
  impact: text("impact", { enum: ["high", "medium", "low"] }),
  date: timestamp("date"),
  time: text("time"),
  actual: text("actual").default(""),
  forecast: text("forecast").default(""),
  previous: text("previous").default(""),
  country: text("country"),
  currency: text("currency"),
});

export const insertMacroEconomicEventSchema = createInsertSchema(macroEconomicEvents).omit({
  id: true,
});

export type InsertMacroEconomicEvent = z.infer<typeof insertMacroEconomicEventSchema>;
export type MacroEconomicEvent = typeof macroEconomicEvents.$inferSelect;

// Social Trading
export const tradingStrategies = pgTable("trading_strategies", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name"),
  description: text("description"),
  setupType: text("setup_type"),
  entryRules: text("entry_rules"),
  exitRules: text("exit_rules"),
  riskManagement: text("risk_management"),
  timeframes: text("timeframes"),
  markets: text("markets"),
  public: boolean("public").default(false),
  rating: integer("rating").default(0),
  ratingCount: integer("rating_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTradingStrategySchema = createInsertSchema(tradingStrategies).omit({
  id: true,
  rating: true,
  ratingCount: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertTradingStrategy = z.infer<typeof insertTradingStrategySchema>;
export type TradingStrategy = typeof tradingStrategies.$inferSelect;

export const strategyComments = pgTable("strategy_comments", {
  id: serial("id").primaryKey(),
  strategyId: integer("strategy_id").references(() => tradingStrategies.id, { onDelete: "cascade" }),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  content: text("content"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertStrategyCommentSchema = createInsertSchema(strategyComments).omit({
  id: true,
  createdAt: true,
});

export type InsertStrategyComment = z.infer<typeof insertStrategyCommentSchema>;
export type StrategyComment = typeof strategyComments.$inferSelect;

// Trading Streak Tabelle
export const tradingStreaks = pgTable("trading_streaks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  currentStreak: integer("current_streak").default(0),
  longestStreak: integer("longest_streak").default(0),
  currentLossStreak: integer("current_loss_streak").default(0),
  longestLossStreak: integer("longest_loss_streak").default(0),
  totalTrades: integer("total_trades").default(0),
  totalWins: integer("total_wins").default(0),
  lastTradeDate: date("last_trade_date"),
  lastUpdated: timestamp("last_updated").defaultNow(),
  // Gamification Elemente
  streakLevel: integer("streak_level").default(1),
  experiencePoints: integer("experience_points").default(0),
  badges: text("badges").array(),
});

export const insertTradingStreakSchema = createInsertSchema(tradingStreaks).omit({
  id: true,
  lastUpdated: true
});

export type InsertTradingStreak = z.infer<typeof insertTradingStreakSchema>;
export type TradingStreak = typeof tradingStreaks.$inferSelect;

// Badge Definitionen für Gamifizierung
export const badgeTypes = [
  "winning_streak_5", 
  "winning_streak_10", 
  "winning_streak_20",
  "perfect_week",
  "comeback_king",
  "first_trade",
  "trade_master_50",
  "trade_master_100"
] as const;

// App Settings für Multi-Device Sync
export const appSettings = pgTable("app_settings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").default("dark"),
  notifications: boolean("notifications").default(true),
  syncEnabled: boolean("sync_enabled").default(true),
  lastSyncedAt: timestamp("last_synced_at").defaultNow(),
  offlineModeEnabled: boolean("offline_mode_enabled").default(false),
  deviceId: text("device_id"),
  deviceName: text("device_name"),
  deviceType: text("device_type"),
  // Risikomanagement-Einstellungen
  accountBalance: real("account_balance").default(2500), // Standard-Kontostand 2500$
  evaAccountBalance: real("eva_account_balance").default(1500), // Standard EVA-Kontostand 1500$
  ekAccountBalance: real("ek_account_balance").default(1000), // Standard EK-Kontostand 1000$
  accountType: text("account_type").default("all"), // Standard: "all" für alle Kontotypen
  goalBalance: real("goal_balance").default(7500), // Standard-Zielkontostand 7500$
  evaGoalBalance: real("eva_goal_balance").default(7500), // Standard EVA-Zielkontostand 7500$
  ekGoalBalance: real("ek_goal_balance").default(5000), // Standard EK-Zielkontostand 5000$
})

export const insertAppSettingsSchema = createInsertSchema(appSettings).omit({
  id: true,
});

export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;
export type AppSettings = typeof appSettings.$inferSelect;

// Konstanten für Dropdown-Auswahlen
export const accountTypes = [
  "EVA",
  "PA",
  "EK"
];
