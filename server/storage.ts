import { 
  users, type User, type InsertUser,
  trades, type Trade, type InsertTrade,
  weeklySummaries, type WeeklySummary, type InsertWeeklySummary,
  performanceData, type PerformanceData, type InsertPerformanceData,
  setupWinRates, type SetupWinRate, type InsertSetupWinRate,
  coachingGoals, type CoachingGoal, type InsertCoachingGoal,
  coachingFeedback, type CoachingFeedback, type InsertCoachingFeedback,
  macroEconomicEvents, type MacroEconomicEvent, type InsertMacroEconomicEvent,
  tradingStrategies, type TradingStrategy, type InsertTradingStrategy,
  strategyComments, type StrategyComment, type InsertStrategyComment,
  appSettings, type AppSettings, type InsertAppSettings,
  tradingStreaks, type TradingStreak, type InsertTradingStreak,
  badgeTypes
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage methods
export interface IStorage {
  // Session store
  sessionStore: session.Store;
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Trade operations
  getTrades(userId: number, filters?: Partial<Trade>): Promise<Trade[]>;
  getTradeById(id: number): Promise<Trade | undefined>;
  createTrade(trade: InsertTrade & { userId: number }): Promise<Trade>;
  updateTrade(id: number, trade: Partial<Trade>): Promise<Trade | undefined>;
  deleteTrade(id: number): Promise<boolean>;
  
  // Weekly summary operations
  getWeeklySummary(userId: number, weekStart: Date, weekEnd: Date): Promise<WeeklySummary | undefined>;
  createWeeklySummary(summary: InsertWeeklySummary & { userId: number }): Promise<WeeklySummary>;
  updateWeeklySummary(id: number, summary: Partial<WeeklySummary>): Promise<WeeklySummary | undefined>;
  
  // Performance data operations
  getPerformanceData(userId: number, startDate?: Date, endDate?: Date): Promise<PerformanceData[]>;
  createPerformanceData(data: InsertPerformanceData & { userId: number }): Promise<PerformanceData>;
  
  // Setup win rate operations
  getSetupWinRates(userId: number): Promise<SetupWinRate[]>;
  updateSetupWinRate(userId: number, setup: string, winRate: number): Promise<SetupWinRate>;
  
  // Statistics operations
  calculateWeeklySummary(userId: number, weekStart: Date, weekEnd: Date): Promise<InsertWeeklySummary & { userId: number }>;
  calculateSetupWinRates(userId: number): Promise<void>;
  
  // Coaching Goals operations
  getCoachingGoals(userId: number, completed?: boolean): Promise<CoachingGoal[]>;
  getCoachingGoalById(id: number): Promise<CoachingGoal | undefined>;
  createCoachingGoal(goal: InsertCoachingGoal): Promise<CoachingGoal>;
  updateCoachingGoal(id: number, goal: Partial<CoachingGoal>): Promise<CoachingGoal | undefined>;
  deleteCoachingGoal(id: number): Promise<boolean>;
  
  // Coaching Feedback operations
  getCoachingFeedback(userId: number, acknowledged?: boolean): Promise<CoachingFeedback[]>;
  createCoachingFeedback(feedback: InsertCoachingFeedback): Promise<CoachingFeedback>;
  acknowledgeCoachingFeedback(id: number): Promise<CoachingFeedback | undefined>;
  generateCoachingFeedback(userId: number): Promise<CoachingFeedback[]>;
  
  // Trading Streak operations
  getTradingStreak(userId: number): Promise<TradingStreak | undefined>;
  createTradingStreak(streak: InsertTradingStreak & { userId: number }): Promise<TradingStreak>;
  updateTradingStreak(userId: number, streak: Partial<TradingStreak>): Promise<TradingStreak | undefined>;
  updateStreakOnTradeResult(userId: number, isWin: boolean): Promise<TradingStreak>;
  getTopStreaks(): Promise<TradingStreak[]>;
  earnBadge(userId: number, badgeType: typeof badgeTypes[number]): Promise<TradingStreak | undefined>;

  // Macroeconomic Events operations
  getMacroEconomicEvents(startDate: Date, endDate: Date): Promise<MacroEconomicEvent[]>;
  getMacroEconomicEventById(id: number): Promise<MacroEconomicEvent | undefined>;
  createMacroEconomicEvent(event: InsertMacroEconomicEvent): Promise<MacroEconomicEvent>;
  updateMacroEconomicEvent(id: number, event: Partial<MacroEconomicEvent>): Promise<MacroEconomicEvent | undefined>;
  deleteMacroEconomicEvent(id: number): Promise<boolean>;
  
  // Trading Strategies operations
  getTradingStrategies(userId?: number, publicOnly?: boolean): Promise<TradingStrategy[]>;
  getTradingStrategyById(id: number): Promise<TradingStrategy | undefined>;
  createTradingStrategy(strategy: InsertTradingStrategy): Promise<TradingStrategy>;
  updateTradingStrategy(id: number, strategy: Partial<TradingStrategy>): Promise<TradingStrategy | undefined>;
  deleteTradingStrategy(id: number): Promise<boolean>;
  
  // Strategy Comments operations
  getStrategyComments(strategyId: number): Promise<StrategyComment[]>;
  createStrategyComment(comment: InsertStrategyComment): Promise<StrategyComment>;
  deleteStrategyComment(id: number): Promise<boolean>;
  
  // App Settings operations
  getAppSettings(userId: number, deviceId?: string): Promise<AppSettings | undefined>;
  createAppSettings(settings: InsertAppSettings): Promise<AppSettings>;
  updateAppSettings(id: number, settings: Partial<AppSettings>): Promise<AppSettings | undefined>;
  syncAppSettings(userId: number, deviceId: string): Promise<AppSettings | undefined>;
}

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: Map<number, User>;
  private trades: Map<number, Trade>;
  private weeklySummaries: Map<number, WeeklySummary>;
  private performanceData: Map<number, PerformanceData>;
  private setupWinRates: Map<number, SetupWinRate>;
  private coachingGoals: Map<number, CoachingGoal>;
  private coachingFeedback: Map<number, CoachingFeedback>;
  private macroEconomicEvents: Map<number, MacroEconomicEvent>;
  private tradingStrategies: Map<number, TradingStrategy>;
  private strategyComments: Map<number, StrategyComment>;
  private appSettings: Map<number, AppSettings>;
  private tradingStreaks: Map<number, TradingStreak>;
  
  private userIdCounter: number;
  private tradeIdCounter: number;
  private summaryIdCounter: number;
  private performanceIdCounter: number;
  private setupWinRateIdCounter: number;
  private coachingGoalIdCounter: number;
  private coachingFeedbackIdCounter: number;
  private macroEconomicEventIdCounter: number;
  private tradingStrategyIdCounter: number;
  private strategyCommentIdCounter: number;
  private appSettingsIdCounter: number;
  private tradingStreakIdCounter: number;
  
  // Coaching Goals operations
  async getCoachingGoals(userId: number, completed?: boolean): Promise<CoachingGoal[]> {
    let goals = Array.from(this.coachingGoals.values()).filter(
      (goal) => goal.userId === userId
    );
    
    if (completed !== undefined) {
      goals = goals.filter(goal => goal.completed === completed);
    }
    
    return goals;
  }
  
  async getCoachingGoalById(id: number): Promise<CoachingGoal | undefined> {
    return this.coachingGoals.get(id);
  }
  
  async createCoachingGoal(goal: InsertCoachingGoal): Promise<CoachingGoal> {
    const id = this.coachingGoalIdCounter++;
    const newGoal: CoachingGoal = { ...goal, id };
    this.coachingGoals.set(id, newGoal);
    return newGoal;
  }
  
  async updateCoachingGoal(id: number, goalUpdate: Partial<CoachingGoal>): Promise<CoachingGoal | undefined> {
    const existingGoal = this.coachingGoals.get(id);
    
    if (!existingGoal) {
      return undefined;
    }
    
    const updatedGoal = { ...existingGoal, ...goalUpdate };
    this.coachingGoals.set(id, updatedGoal);
    
    return updatedGoal;
  }
  
  async deleteCoachingGoal(id: number): Promise<boolean> {
    return this.coachingGoals.delete(id);
  }
  
  // Coaching Feedback operations
  async getCoachingFeedback(userId: number, acknowledged?: boolean): Promise<CoachingFeedback[]> {
    let feedback = Array.from(this.coachingFeedback.values()).filter(
      (fb) => fb.userId === userId
    );
    
    if (acknowledged !== undefined) {
      feedback = feedback.filter(fb => fb.acknowledged === acknowledged);
    }
    
    return feedback.sort((a, b) => 
      b.importance - a.importance || 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  async createCoachingFeedback(feedback: InsertCoachingFeedback): Promise<CoachingFeedback> {
    const id = this.coachingFeedbackIdCounter++;
    const newFeedback: CoachingFeedback = { ...feedback, id };
    this.coachingFeedback.set(id, newFeedback);
    return newFeedback;
  }
  
  async acknowledgeCoachingFeedback(id: number): Promise<CoachingFeedback | undefined> {
    const existingFeedback = this.coachingFeedback.get(id);
    
    if (!existingFeedback) {
      return undefined;
    }
    
    const updatedFeedback = { ...existingFeedback, acknowledged: true };
    this.coachingFeedback.set(id, updatedFeedback);
    
    return updatedFeedback;
  }
  
  async generateCoachingFeedback(userId: number): Promise<CoachingFeedback[]> {
    // Fetch user trades to analyze
    const userTrades = await this.getTrades(userId);
    
    if (userTrades.length === 0) {
      return [];
    }
    
    const feedback: CoachingFeedback[] = [];
    
    // Analyze trading patterns
    const setupCounts: Record<string, { total: number, wins: number }> = {};
    const trendCounts: Record<string, { total: number, wins: number }> = {};
    
    for (const trade of userTrades) {
      // Track setup statistics
      if (!setupCounts[trade.setup]) {
        setupCounts[trade.setup] = { total: 0, wins: 0 };
      }
      setupCounts[trade.setup].total++;
      if (trade.isWin) {
        setupCounts[trade.setup].wins++;
      }
      
      // Track trend statistics
      if (!trendCounts[trade.internalTrendM5]) {
        trendCounts[trade.internalTrendM5] = { total: 0, wins: 0 };
      }
      trendCounts[trade.internalTrendM5].total++;
      if (trade.isWin) {
        trendCounts[trade.internalTrendM5].wins++;
      }
    }
    
    // Find best and worst setups
    let bestSetup = '';
    let bestSetupWinRate = 0;
    let worstSetup = '';
    let worstSetupWinRate = 1;
    
    for (const [setup, stats] of Object.entries(setupCounts)) {
      if (stats.total >= 5) { // Only consider setups with enough data
        const winRate = stats.wins / stats.total;
        if (winRate > bestSetupWinRate) {
          bestSetupWinRate = winRate;
          bestSetup = setup;
        }
        if (winRate < worstSetupWinRate) {
          worstSetupWinRate = winRate;
          worstSetup = setup;
        }
      }
    }
    
    // Generate strategy feedback
    if (bestSetup && bestSetupWinRate > 0.6) {
      feedback.push({
        id: this.coachingFeedbackIdCounter++,
        userId,
        category: "strategy",
        message: `Dein Setup "${bestSetup}" zeigt eine starke Performance mit einer Win-Rate von ${Math.round(bestSetupWinRate * 100)}%. Fokussiere dich mehr auf dieses Setup.`,
        importance: 3,
        acknowledged: false,
        createdAt: new Date()
      });
    }
    
    if (worstSetup && worstSetupWinRate < 0.4) {
      feedback.push({
        id: this.coachingFeedbackIdCounter++,
        userId,
        category: "strategy",
        message: `Dein Setup "${worstSetup}" hat eine niedrige Win-Rate von ${Math.round(worstSetupWinRate * 100)}%. Überprüfe deine Einstiegskriterien oder vermeide dieses Setup.`,
        importance: 4,
        acknowledged: false,
        createdAt: new Date()
      });
    }
    
    // Analyze risk management
    const recentTrades = userTrades.slice(0, 20); // Consider last 20 trades
    const hasConsecutiveLosses = this.hasConsecutiveLosses(recentTrades, 3);
    const riskReward = this.calculateAverageRiskReward(recentTrades);
    
    if (hasConsecutiveLosses) {
      feedback.push({
        id: this.coachingFeedbackIdCounter++,
        userId,
        category: "psychology",
        message: "Du hast mehrere Verluste in Folge. Überdenke deine aktuelle Strategie und nimm dir Zeit, um dich zu erholen. Überhandle nicht.",
        importance: 5,
        acknowledged: false,
        createdAt: new Date()
      });
    }
    
    if (riskReward < 1.5) {
      feedback.push({
        id: this.coachingFeedbackIdCounter++,
        userId,
        category: "risk",
        message: `Dein durchschnittliches Risiko-Ertrags-Verhältnis von ${riskReward.toFixed(2)} ist zu niedrig. Strebe ein Verhältnis von mindestens 2:1 an.`,
        importance: 4,
        acknowledged: false,
        createdAt: new Date()
      });
    }
    
    // Save feedback
    for (const fb of feedback) {
      this.coachingFeedback.set(fb.id, fb);
    }
    
    return feedback;
  }
  
  // Helper methods for coaching feedback
  private hasConsecutiveLosses(trades: Trade[], count: number): boolean {
    let consecutiveLosses = 0;
    
    for (const trade of trades) {
      if (!trade.isWin) {
        consecutiveLosses++;
        if (consecutiveLosses >= count) {
          return true;
        }
      } else {
        consecutiveLosses = 0;
      }
    }
    
    return false;
  }
  
  private calculateAverageRiskReward(trades: Trade[]): number {
    if (trades.length === 0) {
      return 0;
    }
    
    const totalRR = trades.reduce((sum, trade) => sum + trade.rrAchieved, 0);
    return totalRR / trades.length;
  }
  
  // Macroeconomic Events operations
  async getMacroEconomicEvents(startDate: Date, endDate: Date): Promise<MacroEconomicEvent[]> {
    let events = Array.from(this.macroEconomicEvents.values());
    
    events = events.filter(
      (event) => event.date >= startDate && event.date <= endDate
    );
    
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async getMacroEconomicEventById(id: number): Promise<MacroEconomicEvent | undefined> {
    return this.macroEconomicEvents.get(id);
  }
  
  async createMacroEconomicEvent(event: InsertMacroEconomicEvent): Promise<MacroEconomicEvent> {
    const id = this.macroEconomicEventIdCounter++;
    const newEvent: MacroEconomicEvent = { ...event, id };
    this.macroEconomicEvents.set(id, newEvent);
    return newEvent;
  }
  
  async updateMacroEconomicEvent(id: number, eventUpdate: Partial<MacroEconomicEvent>): Promise<MacroEconomicEvent | undefined> {
    const existingEvent = this.macroEconomicEvents.get(id);
    
    if (!existingEvent) {
      return undefined;
    }
    
    const updatedEvent = { ...existingEvent, ...eventUpdate };
    this.macroEconomicEvents.set(id, updatedEvent);
    
    return updatedEvent;
  }
  
  async deleteMacroEconomicEvent(id: number): Promise<boolean> {
    return this.macroEconomicEvents.delete(id);
  }
  
  // Trading Strategies operations
  async getTradingStrategies(userId?: number, publicOnly?: boolean): Promise<TradingStrategy[]> {
    let strategies = Array.from(this.tradingStrategies.values());
    
    if (userId !== undefined) {
      strategies = strategies.filter(strategy => 
        strategy.userId === userId || (publicOnly && strategy.public)
      );
    } else if (publicOnly) {
      strategies = strategies.filter(strategy => strategy.public);
    }
    
    return strategies.sort((a, b) => b.rating - a.rating);
  }
  
  async getTradingStrategyById(id: number): Promise<TradingStrategy | undefined> {
    return this.tradingStrategies.get(id);
  }
  
  async createTradingStrategy(strategy: InsertTradingStrategy): Promise<TradingStrategy> {
    const id = this.tradingStrategyIdCounter++;
    const newStrategy: TradingStrategy = { 
      ...strategy, 
      id, 
      rating: 0, 
      ratingCount: 0, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.tradingStrategies.set(id, newStrategy);
    return newStrategy;
  }
  
  async updateTradingStrategy(id: number, strategyUpdate: Partial<TradingStrategy>): Promise<TradingStrategy | undefined> {
    const existingStrategy = this.tradingStrategies.get(id);
    
    if (!existingStrategy) {
      return undefined;
    }
    
    const updatedStrategy = { 
      ...existingStrategy, 
      ...strategyUpdate, 
      updatedAt: new Date() 
    };
    this.tradingStrategies.set(id, updatedStrategy);
    
    return updatedStrategy;
  }
  
  async deleteTradingStrategy(id: number): Promise<boolean> {
    // Also delete associated comments
    const commentsToDelete = Array.from(this.strategyComments.values())
      .filter(comment => comment.strategyId === id);
    
    for (const comment of commentsToDelete) {
      this.strategyComments.delete(comment.id);
    }
    
    return this.tradingStrategies.delete(id);
  }
  
  // Strategy Comments operations
  async getStrategyComments(strategyId: number): Promise<StrategyComment[]> {
    const comments = Array.from(this.strategyComments.values())
      .filter(comment => comment.strategyId === strategyId);
    
    return comments.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
  
  async createStrategyComment(comment: InsertStrategyComment): Promise<StrategyComment> {
    const id = this.strategyCommentIdCounter++;
    const newComment: StrategyComment = { 
      ...comment, 
      id, 
      createdAt: new Date()
    };
    this.strategyComments.set(id, newComment);
    return newComment;
  }
  
  async deleteStrategyComment(id: number): Promise<boolean> {
    return this.strategyComments.delete(id);
  }
  
  // App Settings operations
  async getAppSettings(userId: number, deviceId?: string): Promise<AppSettings | undefined> {
    console.log(`getAppSettings für userId ${userId} und deviceId ${deviceId || 'nicht angegeben'}`);
    
    const userSettings = Array.from(this.appSettings.values())
      .filter(settings => settings.userId === userId);
    
    console.log(`Gefundene Einstellungen für userId ${userId}: ${userSettings.length}`);
    
    if (userSettings.length === 0) {
      console.log(`Keine Einstellungen für userId ${userId} gefunden`);
      return undefined;
    }
    
    if (deviceId) {
      const deviceSettings = userSettings.find(settings => settings.deviceId === deviceId);
      console.log(`Geräte-spezifische Einstellungen ${deviceSettings ? 'gefunden' : 'nicht gefunden'}`);
      return deviceSettings;
    }
    
    // Return the most recently synced settings
    const sortedSettings = userSettings.sort((a, b) => 
      new Date(b.lastSyncedAt || new Date()).getTime() - new Date(a.lastSyncedAt || new Date()).getTime()
    );
    
    console.log(`Neueste Einstellungen für userId ${userId} zurückgegeben:`, sortedSettings[0]);
    return sortedSettings[0];
  }
  
  async createAppSettings(settings: InsertAppSettings): Promise<AppSettings> {
    const id = this.appSettingsIdCounter++;
    const newSettings: AppSettings = { 
      ...settings, 
      id,
      lastSyncedAt: new Date()
    };
    this.appSettings.set(id, newSettings);
    return newSettings;
  }
  
  async updateAppSettings(id: number, settingsUpdate: Partial<AppSettings>): Promise<AppSettings | undefined> {
    const existingSettings = this.appSettings.get(id);
    
    if (!existingSettings) {
      return undefined;
    }
    
    const updatedSettings = { 
      ...existingSettings, 
      ...settingsUpdate,
      lastSyncedAt: new Date()
    };
    this.appSettings.set(id, updatedSettings);
    
    return updatedSettings;
  }
  
  async syncAppSettings(userId: number, deviceId: string): Promise<AppSettings | undefined> {
    console.log(`syncAppSettings aufgerufen für userId ${userId} und deviceId ${deviceId}`);
    
    // Find settings for this device
    const deviceSettings = await this.getAppSettings(userId, deviceId);
    
    if (!deviceSettings) {
      console.log(`Keine Einstellungen für diese Geräte-ID gefunden, erstelle neue Einstellungen`);
      return this.createAppSettings({
        userId,
        deviceId,
        theme: 'dark',
        notifications: true,
        goalBalance: 7500,
        evaAccountBalance: 1500,
        accountBalance: 0,
      });
    }
    
    // Find most up-to-date settings across all devices
    const latestSettings = await this.getAppSettings(userId);
    
    if (!latestSettings || latestSettings.id === deviceSettings.id) {
      console.log(`Keine neueren Einstellungen gefunden, verwende aktuelle Geräteeinstellungen`);
      return deviceSettings;
    }
    
    // Sync settings from latest to this device
    const updatedSettings = await this.updateAppSettings(deviceSettings.id, {
      theme: latestSettings.theme,
      notifications: latestSettings.notifications
    });
    
    return updatedSettings;
  }

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    // Initialisiere alle Maps korrekt (ohne Duplikate)
    this.users = new Map();
    this.trades = new Map();
    this.weeklySummaries = new Map();
    this.performanceData = new Map();
    this.setupWinRates = new Map();
    this.coachingGoals = new Map();
    this.coachingFeedback = new Map();
    this.macroEconomicEvents = new Map();
    this.tradingStrategies = new Map();
    this.strategyComments = new Map();
    this.appSettings = new Map();
    this.tradingStreaks = new Map();
    
    // Initialisiere alle Zähler
    this.userIdCounter = 1;
    this.tradeIdCounter = 1;
    this.summaryIdCounter = 1;
    this.performanceIdCounter = 1;
    this.setupWinRateIdCounter = 1;
    this.coachingGoalIdCounter = 1;
    this.coachingFeedbackIdCounter = 1;
    this.macroEconomicEventIdCounter = 1;
    this.tradingStrategyIdCounter = 1;
    this.strategyCommentIdCounter = 1;
    this.appSettingsIdCounter = 1;
    this.tradingStreakIdCounter = 1;
    
    console.log("MemStorage initialisiert - Map-Instanzen erstellt und Zähler gesetzt");
  }
  
  // Trading Streak Methoden
  async getTradingStreak(userId: number): Promise<TradingStreak | undefined> {
    return Array.from(this.tradingStreaks.values()).find(
      (streak) => streak.userId === userId
    );
  }

  async createTradingStreak(streak: InsertTradingStreak & { userId: number }): Promise<TradingStreak> {
    const id = this.tradingStreakIdCounter++;
    
    // Standardwerte hinzufügen, falls nicht definiert
    const newStreak: TradingStreak = {
      id,
      userId: streak.userId,
      currentStreak: streak.currentStreak || 0,
      longestStreak: streak.longestStreak || 0,
      currentLossStreak: streak.currentLossStreak || 0,
      longestLossStreak: streak.longestLossStreak || 0,
      totalTrades: streak.totalTrades || 0,
      totalWins: streak.totalWins || 0,
      lastTradeDate: streak.lastTradeDate || new Date(),
      lastUpdated: new Date(),
      streakLevel: streak.streakLevel || 1,
      experiencePoints: streak.experiencePoints || 0,
      badges: streak.badges || []
    };
    
    this.tradingStreaks.set(id, newStreak);
    return newStreak;
  }

  async updateTradingStreak(userId: number, streakUpdate: Partial<TradingStreak>): Promise<TradingStreak | undefined> {
    const existingStreak = await this.getTradingStreak(userId);
    
    if (!existingStreak) {
      return undefined;
    }
    
    const updatedStreak = { 
      ...existingStreak, 
      ...streakUpdate,
      lastUpdated: new Date()
    };
    
    this.tradingStreaks.set(existingStreak.id, updatedStreak);
    return updatedStreak;
  }

  async updateStreakOnTradeResult(userId: number, isWin: boolean): Promise<TradingStreak> {
    let streak = await this.getTradingStreak(userId);
    
    // Erstelle einen neuen Streak-Eintrag, falls noch keiner existiert
    if (!streak) {
      streak = await this.createTradingStreak({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        currentLossStreak: 0,
        longestLossStreak: 0,
        totalTrades: 0,
        totalWins: 0,
        lastTradeDate: new Date(),
        streakLevel: 1,
        experiencePoints: 0,
        badges: []
      });
    }
    
    // Aktualisiere den Streak basierend auf dem Handelsergebnis
    const updatedStreak = { ...streak };
    updatedStreak.totalTrades += 1;
    updatedStreak.lastTradeDate = new Date();
    
    if (isWin) {
      // Gewinn-Fall
      updatedStreak.totalWins += 1;
      updatedStreak.currentStreak += 1;
      updatedStreak.currentLossStreak = 0;
      updatedStreak.experiencePoints += 10; // Basispunkte für einen Gewinn
      
      // Bonuspunkte für Streak-Fortsetzung
      if (updatedStreak.currentStreak > 1) {
        updatedStreak.experiencePoints += Math.min(updatedStreak.currentStreak * 2, 20); // Max 20 Bonuspunkte
      }
      
      // Aktualisiere längste Gewinnsträhne
      if (updatedStreak.currentStreak > updatedStreak.longestStreak) {
        updatedStreak.longestStreak = updatedStreak.currentStreak;
        
        // Prüfe Streak-Badges
        if (updatedStreak.longestStreak >= 5 && !updatedStreak.badges.includes("winning_streak_5")) {
          updatedStreak.badges.push("winning_streak_5");
          updatedStreak.experiencePoints += 50;
        }
        
        if (updatedStreak.longestStreak >= 10 && !updatedStreak.badges.includes("winning_streak_10")) {
          updatedStreak.badges.push("winning_streak_10");
          updatedStreak.experiencePoints += 100;
        }
        
        if (updatedStreak.longestStreak >= 20 && !updatedStreak.badges.includes("winning_streak_20")) {
          updatedStreak.badges.push("winning_streak_20");
          updatedStreak.experiencePoints += 200;
        }
      }
    } else {
      // Verlust-Fall
      updatedStreak.currentStreak = 0;
      updatedStreak.currentLossStreak += 1;
      
      // Aktualisiere längste Verluststrähne
      if (updatedStreak.currentLossStreak > updatedStreak.longestLossStreak) {
        updatedStreak.longestLossStreak = updatedStreak.currentLossStreak;
      }
      
      // Comeback King Badge - Nach einer Verluststrähne von 3 oder mehr folgt ein Gewinn
      if (updatedStreak.currentLossStreak >= 3 && isWin && !updatedStreak.badges.includes("comeback_king")) {
        updatedStreak.badges.push("comeback_king");
        updatedStreak.experiencePoints += 75;
      }
    }
    
    // Erster Trade Badge
    if (updatedStreak.totalTrades === 1 && !updatedStreak.badges.includes("first_trade")) {
      updatedStreak.badges.push("first_trade");
      updatedStreak.experiencePoints += 25;
    }
    
    // Trade Master Badges
    if (updatedStreak.totalTrades >= 50 && !updatedStreak.badges.includes("trade_master_50")) {
      updatedStreak.badges.push("trade_master_50");
      updatedStreak.experiencePoints += 100;
    }
    
    if (updatedStreak.totalTrades >= 100 && !updatedStreak.badges.includes("trade_master_100")) {
      updatedStreak.badges.push("trade_master_100");
      updatedStreak.experiencePoints += 200;
    }
    
    // Berechne das Streak-Level (steigt alle 100 XP)
    updatedStreak.streakLevel = Math.floor(updatedStreak.experiencePoints / 100) + 1;
    
    // Speichere den aktualisierten Streak
    return this.updateTradingStreak(userId, updatedStreak) as Promise<TradingStreak>;
  }

  async getTopStreaks(): Promise<TradingStreak[]> {
    // Sortiere nach höchstem Streak und längster Strähne
    return Array.from(this.tradingStreaks.values())
      .sort((a, b) => b.longestStreak - a.longestStreak || b.currentStreak - a.currentStreak || b.experiencePoints - a.experiencePoints);
  }

  async earnBadge(userId: number, badgeType: typeof badgeTypes[number]): Promise<TradingStreak | undefined> {
    const existingStreak = await this.getTradingStreak(userId);
    
    if (!existingStreak) {
      return undefined;
    }
    
    // Prüfe, ob das Badge bereits vorhanden ist
    if (existingStreak.badges.includes(badgeType)) {
      return existingStreak; // Keine Änderung, wenn das Badge bereits vorhanden ist
    }
    
    // Füge das neue Badge hinzu
    const updatedBadges = [...existingStreak.badges, badgeType];
    
    // Füge XP basierend auf Badge-Typ hinzu
    let additionalXP = 0;
    
    switch (badgeType) {
      case "winning_streak_5":
        additionalXP = 50;
        break;
      case "winning_streak_10":
        additionalXP = 100;
        break;
      case "winning_streak_20":
        additionalXP = 200;
        break;
      case "perfect_week":
        additionalXP = 150;
        break;
      case "comeback_king":
        additionalXP = 75;
        break;
      case "first_trade":
        additionalXP = 25;
        break;
      case "trade_master_50":
        additionalXP = 100;
        break;
      case "trade_master_100":
        additionalXP = 200;
        break;
      default:
        additionalXP = 10;
    }
    
    // Aktualisiere Streak mit neuem Badge und XP
    const updatedStreak = { 
      ...existingStreak,
      badges: updatedBadges,
      experiencePoints: existingStreak.experiencePoints + additionalXP,
      streakLevel: Math.floor((existingStreak.experiencePoints + additionalXP) / 100) + 1,
      lastUpdated: new Date()
    };
    
    this.tradingStreaks.set(existingStreak.id, updatedStreak);
    return updatedStreak;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }

  // Trade methods
  async getTrades(userId: number, filters?: Partial<Trade>): Promise<Trade[]> {
    let userTrades = Array.from(this.trades.values()).filter(
      (trade) => trade.userId === userId
    );
    
    console.log("MemStorage getTrades - Initial trade count for userId", userId, ":", userTrades.length);
    
    if (filters) {
      console.log("MemStorage getTrades - Filters applied:", JSON.stringify(filters));
      
      // Spezieller Umgang mit Datums-Filtern
      if (filters.startDate || filters.endDate) {
        const startDate = filters.startDate ? new Date(filters.startDate as any) : null;
        const endDate = filters.endDate ? new Date(filters.endDate as any) : null;
        
        console.log("Date filters:", { startDate, endDate });
        
        // Standardfilter fürs Datum (nicht anwenden, speziell behandeln)
        delete filters.startDate;
        delete filters.endDate;
      }
      
      // userId aus Filter entfernen, da wir bereits nach userId gefiltert haben
      const { userId: filterUserId, ...otherFilters } = filters;
      
      // Debug für userId Filter-Problem
      if (filterUserId) {
        console.log(`Filter enthält userId=${filterUserId}, entferne diesen Filter, da bereits nach userId=${userId} gefiltert wurde`);
      }
      
      // Standard-Filter-Ansatz
      userTrades = userTrades.filter(trade => {
        for (const [key, value] of Object.entries(otherFilters)) {
          // Wenn Wert nicht leer ist und nicht mit dem Trade-Wert übereinstimmt
          if (value !== undefined && value !== null && value !== '' && trade[key as keyof Trade] !== value) {
            // Spezielle Typbehandlung für numerische Werte
            if (typeof trade[key as keyof Trade] === 'number' && !isNaN(Number(value))) {
              if (Number(trade[key as keyof Trade]) !== Number(value)) {
                return false;
              }
            } else {
              return false;
            }
          }
        }
        return true;
      });
    }
    
    const sortedTrades = userTrades.sort((a, b) => {
      // Safer date parsing
      let dateA, dateB;
      try {
        dateA = new Date(b.date);
        dateB = new Date(a.date);
      } catch (e) {
        console.error("Date parsing error:", e);
        return 0;
      }
      return dateA.getTime() - dateB.getTime();
    });
    
    console.log("MemStorage getTrades - Final filtered trade count:", sortedTrades.length);
    
    return sortedTrades;
  }

  async getTradeById(id: number): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async createTrade(trade: InsertTrade & { userId: number }): Promise<Trade> {
    const id = this.tradeIdCounter++;
    // Standardwerte setzen, falls nicht vorhanden
    const newTrade: Trade = { 
      symbol: "",
      setup: "",
      mainTrendM15: "",
      internalTrendM5: "",
      entryType: "",
      entryLevel: "",
      liquidation: "",
      location: "",
      rrAchieved: 0,
      rrPotential: 0,
      isWin: false,
      profitLoss: 0,
      // Wichtig: Hier setzen wir keinen Standardwert für rangePoints, damit undefined-Werte nicht zu 0 werden
      id,
      date: trade.date ? new Date(trade.date) : new Date(),
      gptFeedback: trade.gptFeedback || ""
    };
    
    // Wir fügen die übergebenen Trade-Daten hinzu, aber nur wenn sie nicht undefined sind
    for (const key of Object.keys(trade)) {
      if (trade[key as keyof typeof trade] !== undefined) {
        (newTrade as any)[key] = trade[key as keyof typeof trade];
      }
    }
    
    this.trades.set(id, newTrade);
    
    // Update statistics after adding a trade
    const monday = new Date(newTrade.date);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    await this.calculateWeeklySummary(trade.userId, monday, sunday);
    await this.calculateSetupWinRates(trade.userId);
    
    // Aktualisiere auch den Trading Streak basierend auf dem Handelsergebnis
    if (newTrade.isWin !== undefined) {
      await this.updateStreakOnTradeResult(trade.userId, newTrade.isWin);
    }
    
    return newTrade;
  }

  async updateTrade(id: number, tradeUpdate: Partial<Trade>): Promise<Trade | undefined> {
    const existingTrade = this.trades.get(id);
    
    if (!existingTrade) {
      return undefined;
    }
    
    // Beim Aktualisieren müssen wir sicherstellen, dass undefined-Werte korrekt behandelt werden
    // Insbesondere bei rangePoints wollen wir vermeiden, dass es auf 0 zurückgesetzt wird
    const updatedTrade = { ...existingTrade };
    
    // Nur die Felder kopieren, die in tradeUpdate nicht undefined sind
    Object.keys(tradeUpdate).forEach(key => {
      if (tradeUpdate[key as keyof Partial<Trade>] !== undefined) {
        updatedTrade[key as keyof Trade] = tradeUpdate[key as keyof Partial<Trade>] as any;
      }
    });
    
    this.trades.set(id, updatedTrade);
    
    // Update statistics after updating a trade
    const monday = new Date(updatedTrade.date);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    await this.calculateWeeklySummary(updatedTrade.userId, monday, sunday);
    await this.calculateSetupWinRates(updatedTrade.userId);
    
    // Wenn sich der isWin-Status geändert hat, müssen wir den Trading Streak aktualisieren
    if (tradeUpdate.isWin !== undefined && tradeUpdate.isWin !== existingTrade.isWin) {
      await this.updateStreakOnTradeResult(updatedTrade.userId, tradeUpdate.isWin);
    }
    
    return updatedTrade;
  }

  async deleteTrade(id: number): Promise<boolean> {
    const trade = this.trades.get(id);
    
    if (!trade) {
      return false;
    }
    
    const userId = trade.userId;
    const success = this.trades.delete(id);
    
    if (success) {
      // Update statistics after deleting a trade
      const monday = new Date(trade.date);
      monday.setDate(monday.getDate() - monday.getDay() + 1);
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      
      await this.calculateWeeklySummary(userId, monday, sunday);
      await this.calculateSetupWinRates(userId);
      
      // Da ein Trade gelöscht wurde, sollten wir die Streak überprüfen und aktualisieren
      const streak = await this.getTradingStreak(userId);
      if (streak) {
        // Hier könnten wir potentiell die Streak neu berechnen, aber für jetzt
        // werden wir keine automatische Anpassung vornehmen und der Benutzer kann sie manuell anpassen
        // Es ist schwierig zu bestimmen, ob der gelöschte Trade Teil der aktuellen Streak war
      }
    }
    
    return success;
  }

  // Weekly summary methods
  async getWeeklySummary(userId: number, weekStart: Date, weekEnd: Date): Promise<WeeklySummary | undefined> {
    return Array.from(this.weeklySummaries.values()).find(
      (summary) => 
        summary.userId === userId && 
        summary.weekStart.getTime() === weekStart.getTime() &&
        summary.weekEnd.getTime() === weekEnd.getTime()
    );
  }

  async createWeeklySummary(summary: InsertWeeklySummary & { userId: number }): Promise<WeeklySummary> {
    const id = this.summaryIdCounter++;
    const newSummary: WeeklySummary = { ...summary, id };
    
    // Check if summary already exists and update instead
    const existingSummary = await this.getWeeklySummary(summary.userId, summary.weekStart, summary.weekEnd);
    
    if (existingSummary) {
      return this.updateWeeklySummary(existingSummary.id, summary) as Promise<WeeklySummary>;
    }
    
    this.weeklySummaries.set(id, newSummary);
    return newSummary;
  }

  async updateWeeklySummary(id: number, summaryUpdate: Partial<WeeklySummary>): Promise<WeeklySummary | undefined> {
    const existingSummary = this.weeklySummaries.get(id);
    
    if (!existingSummary) {
      return undefined;
    }
    
    const updatedSummary = { ...existingSummary, ...summaryUpdate };
    this.weeklySummaries.set(id, updatedSummary);
    
    return updatedSummary;
  }

  // Performance data methods
  async getPerformanceData(userId: number, startDate?: Date, endDate?: Date): Promise<PerformanceData[]> {
    let userPerformanceData = Array.from(this.performanceData.values()).filter(
      (data) => data.userId === userId
    );
    
    if (startDate) {
      userPerformanceData = userPerformanceData.filter(
        (data) => new Date(data.date) >= startDate
      );
    }
    
    if (endDate) {
      userPerformanceData = userPerformanceData.filter(
        (data) => new Date(data.date) <= endDate
      );
    }
    
    return userPerformanceData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async createPerformanceData(data: InsertPerformanceData & { userId: number }): Promise<PerformanceData> {
    const id = this.performanceIdCounter++;
    const newData: PerformanceData = { ...data, id };
    
    // Check if data for this date already exists
    const existingData = Array.from(this.performanceData.values()).find(
      (pd) => 
        pd.userId === data.userId && 
        new Date(pd.date).toDateString() === new Date(data.date).toDateString()
    );
    
    if (existingData) {
      // Update existing data
      this.performanceData.set(existingData.id, { ...existingData, performance: data.performance });
      return { ...existingData, performance: data.performance };
    }
    
    this.performanceData.set(id, newData);
    return newData;
  }

  // Setup win rate methods
  async getSetupWinRates(userId: number): Promise<SetupWinRate[]> {
    return Array.from(this.setupWinRates.values()).filter(
      (rate) => rate.userId === userId
    );
  }

  async updateSetupWinRate(userId: number, setup: string, winRate: number): Promise<SetupWinRate> {
    const existingRate = Array.from(this.setupWinRates.values()).find(
      (rate) => rate.userId === userId && rate.setup === setup
    );
    
    if (existingRate) {
      // Update existing rate
      const updatedRate = { ...existingRate, winRate };
      this.setupWinRates.set(existingRate.id, updatedRate);
      return updatedRate;
    }
    
    // Create new rate
    const id = this.setupWinRateIdCounter++;
    const newRate: SetupWinRate = { id, userId, setup, winRate };
    this.setupWinRates.set(id, newRate);
    return newRate;
  }

  // Statistics calculation methods
  async calculateWeeklySummary(userId: number, weekStart: Date, weekEnd: Date): Promise<InsertWeeklySummary & { userId: number }> {
    const weekTrades = await this.getTrades(userId);
    
    // Filter trades within the week
    const tradesInWeek = weekTrades.filter(
      (trade) => new Date(trade.date) >= weekStart && new Date(trade.date) <= weekEnd
    );
    
    const tradeCount = tradesInWeek.length;
    
    if (tradeCount === 0) {
      const emptySummary = {
        weekStart,
        weekEnd,
        totalRR: 0,
        tradeCount: 0,
        winRate: 0,
        userId
      };
      
      await this.createWeeklySummary(emptySummary);
      return emptySummary;
    }
    
    // Calculate total RR
    const totalRR = tradesInWeek.reduce((sum, trade) => sum + trade.rrAchieved, 0);
    
    // Calculate win rate
    const winCount = tradesInWeek.filter(trade => trade.isWin).length;
    const winRate = (winCount / tradeCount) * 100;
    
    const summary = {
      weekStart,
      weekEnd,
      totalRR,
      tradeCount,
      winRate,
      userId
    };
    
    await this.createWeeklySummary(summary);
    
    // Update performance data
    const days = [];
    let currentDay = new Date(weekStart);
    
    while (currentDay <= weekEnd) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    let cumulativeRR = 0;
    
    for (const day of days) {
      const endOfDay = new Date(day);
      endOfDay.setHours(23, 59, 59, 999);
      
      const tradesOnDay = tradesInWeek.filter(
        (trade) => new Date(trade.date) <= endOfDay
      );
      
      if (tradesOnDay.length > 0) {
        cumulativeRR = tradesOnDay.reduce((sum, trade) => sum + trade.rrAchieved, 0);
      }
      
      await this.createPerformanceData({
        date: day,
        performance: cumulativeRR,
        userId
      });
    }
    
    return summary;
  }

  async calculateSetupWinRates(userId: number): Promise<void> {
    const userTrades = await this.getTrades(userId);
    
    // Get unique setups
    const setups = [...new Set(userTrades.map(trade => trade.setup))];
    
    for (const setup of setups) {
      const setupTrades = userTrades.filter(trade => trade.setup === setup);
      const tradeCount = setupTrades.length;
      
      if (tradeCount > 0) {
        const winCount = setupTrades.filter(trade => trade.isWin).length;
        const winRate = (winCount / tradeCount) * 100;
        
        await this.updateSetupWinRate(userId, setup, winRate);
      }
    }
  }
}

// DatabaseStorage-Implementierung für persistente Datenspeicherung
import { db } from './db-selector';
import { eq, and, between, gte, lte, desc, sql } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // Bereinige abgelaufene Einträge nach einem Tag
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error(`Error fetching user with id ${id}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error(`Error fetching user with username ${username}:`, error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [createdUser] = await db.insert(users).values(user).returning();
      return createdUser;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(userData)
        .where(eq(users.id, id))
        .returning();
      return updatedUser;
    } catch (error) {
      console.error(`Error updating user with id ${id}:`, error);
      return undefined;
    }
  }

  // Trade operations
  async getTrades(userId: number, filters: Partial<Trade> = {}): Promise<Trade[]> {
    try {
      console.log(`DatabaseStorage getTrades - Filters für User ${userId}:`, filters);
      
      // Verwende eine direkte SQL-Abfrage mit den neuen camelCase-Spaltennamen
      // WICHTIG: Die Anführungszeichen um userId sind notwendig, da PostgreSQL Spaltennamen mit Großbuchstaben sonst nicht erkennt
      // Nach der Datenbankumstellung auf camelCase müssen wir "userId" mit Anführungszeichen verwenden
      let queryStr = `
        SELECT * FROM trades 
        WHERE "userId" = ${userId}
      `;
      
      // Debug-Ausgabe für die initiale Abfrage
      console.log("Initiale SQL-Abfrage mit camelCase-Spalten:", queryStr);
      
      // Datumsfilter hinzufügen, falls vorhanden
      if (filters.startDate && filters.endDate) {
        const startDate = new Date(filters.startDate).toISOString();
        const endDate = new Date(filters.endDate).toISOString();
        queryStr += ` AND date >= '${startDate}' AND date <= '${endDate}'`;
        console.log(`Datums-Filter angewendet: ${startDate} bis ${endDate}`);
      }
      
      // Symbol-Filter hinzufügen, falls vorhanden
      if (filters.symbol) {
        queryStr += ` AND symbol = '${filters.symbol}'`;
        console.log(`Symbol-Filter angewendet: ${filters.symbol}`);
      }
      
      // Setup-Filter hinzufügen, falls vorhanden
      if (filters.setup) {
        queryStr += ` AND setup = '${filters.setup}'`;
        console.log(`Setup-Filter angewendet: ${filters.setup}`);
      }
      
      // isWin-Filter hinzufügen, falls vorhanden
      if (filters.isWin !== undefined) {
        queryStr += ` AND "isWin" = ${filters.isWin}`;
        console.log(`isWin-Filter angewendet: ${filters.isWin}`);
      }
      
      // Sortierung nach Datum absteigend hinzufügen
      queryStr += ` ORDER BY date DESC`;
      
      console.log("Ausgeführte SQL-Abfrage:", queryStr);
      
      // Führe die Abfrage aus
      try {
        console.log("Führe SQL-Abfrage mit camelCase-Spaltennamen aus...");
        const result = await db.execute(queryStr);
        const dbResult = result.rows || [];
        
        console.log(`Datenbankabfrage ergab ${dbResult.length} Ergebnisse für Benutzer ${userId}`);
        
        if (dbResult.length > 0) {
          console.log("Beispiel für ersten Trade in der Datenbank:", 
            Object.keys(dbResult[0]).map(key => `${key}: ${typeof dbResult[0][key]}`).join(', '));
        }
        
        // Da die Datenbank jetzt in camelCase ist, brauchen wir weniger Mapping
        const trades = dbResult.map(trade => {
          // Debug-Ausgabe für jedes Trade-Objekt mit Nullcheck
          const tradeId = trade.id || 'unbekannt';
          const tradeSymbol = trade.symbol || 'k.A.';
          const tradeSetup = trade.setup || 'k.A.';
          console.log(`Verarbeite Trade ID ${tradeId}, Symbol: ${tradeSymbol}, Setup: ${tradeSetup}`);
          
          // Direkt die mapDbTradeToFrontend-Funktion verwenden, da die Namen bereits passen
          return this.mapDbTradeToFrontend(trade);
        });
        
        console.log(`DatabaseStorage getTrades - Retrieved ${trades.length} trades for userId ${userId}`);
        return trades;
      } catch (queryError) {
        console.error("Fehler bei der Ausführung der direkten SQL-Abfrage:", queryError);
        
        // Versuche eine einfachere Abfrage
        console.log("Versuche einfachere SQL-Abfrage...");
        try {
          const simpleResult = await db.execute(`SELECT COUNT(*) FROM trades`);
          const count = simpleResult.rows?.[0]?.count || 0;
          console.log(`Trades in der Datenbank insgesamt: ${count}`);
          
          // Wenn Trades vorhanden sind, versuche nur die für diesen Benutzer abzufragen
          if (parseInt(count) > 0) {
            const userResult = await db.execute(`SELECT * FROM trades WHERE "userId" = ${userId}`);
            const userTrades = userResult.rows || [];
            console.log(`Einfache Abfrage ergab ${userTrades.length} Trades für Benutzer ${userId}`);
            
            // Direkt zur Frontend-Format mappen, da camelCase bereits stimmt
            return userTrades.map(trade => this.mapDbTradeToFrontend(trade));
          }
        } catch (simpleError) {
          console.error("Auch einfache SQL-Abfrage fehlgeschlagen:", simpleError);
        }
        
        // Wenn alles fehlschlägt, leere Liste zurückgeben
        return [];
      }
    } catch (error) {
      console.error(`Error fetching trades for user ${userId}:`, error);
      return [];
    }
  }
  
  // Hilfsfunktion: Konvertiert PostgreSQL-Feldnamen zurück in Frontend-Format
  private convertPostgresFieldsToFrontend(pgTrade: any): any {
    if (!pgTrade) {
      console.error("ConvertPostgresFieldsToFrontend: Null oder undefined pgTrade übergeben");
      return {};
    }
    
    // Debug-Ausgabe für die wichtigsten Felder
    console.log("ConvertPostgresFieldsToFrontend Input:", {
      id: pgTrade.id, 
      date: pgTrade.date,
      symbol: pgTrade.symbol,
      profitloss: pgTrade.profitloss,
      iswin: pgTrade.iswin,
      setup: pgTrade.setup
    });
    
    // Erstelle ein neues Objekt statt das Original zu modifizieren
    const result: any = {};
    
    // Basis-Felder direkt übernehmen
    result.id = pgTrade.id;
    result.date = pgTrade.date;
    result.symbol = pgTrade.symbol;
    result.userId = pgTrade.userId;
    
    // Liste der Felder, basierend auf der tatsächlichen Datenbankstruktur
    // Die Namen stammen aus der Abfrage: SELECT column_name FROM information_schema.columns WHERE table_name = 'trades'
    const fieldMapping: Record<string, string> = {
      'id': 'id',
      'symbol': 'symbol',
      'date': 'date',
      'setup': 'setup',
      'main_trend_m15': 'mainTrendM15',
      'internaltrendm5': 'internalTrendM5',
      'entrytype': 'entryType',
      'entrylevel': 'entryLevel',
      'positionsize': 'positionSize',
      'takeprofit': 'takeProfit',
      'stoploss': 'stopLoss',
      'exitlevel': 'exitLevel',
      'potentialrrr': 'potentialRrr',
      'actualrrr': 'actualRrr',
      'tradeduration': 'tradeDuration',
      'traderesult': 'tradeResult',
      'notes': 'notes',
      'chartimageurl': 'chartImageUrl',
      'liquiditylevel': 'liquidityLevel',
      'deviation': 'deviation',
      'sessionnyc': 'sessionNYC',
      'sessionlondon': 'sessionLondon',
      'sessionasia': 'sessionAsia',
      'sessiontime': 'sessionTime',
      'trendalignment': 'trendAlignment',
      'smartmoneyconcept': 'smartMoneyConcept',
      'marketstructure': 'marketStructure',
      'advancedpattern': 'advancedPattern',
      'chartpattern': 'chartPattern',
      'fundamentalnews': 'fundamentalNews',
      'wickfill': 'wickFill',
      'spreadsize': 'spreadSize',
      'psychologicallevel': 'psychologicalLevel',
      'trademanagement': 'tradeManagement',
      'exitreason': 'exitReason',
      'advancedexit': 'advancedExit',
      'liquidationlevel': 'liquidationLevel',
      'liquidationentry': 'liquidationEntry',
      // 'userid': 'userId', // Alte Mapping - nicht mehr benötigt nach Umstellung auf camelCase
      'createdat': 'createdAt',
      'updatedat': 'updatedAt',
      'profitloss': 'profitLoss',
      'iswin': 'isWin',
      'rr_achieved': 'rrAchieved',
      'rrpotential': 'rrPotential'
    };
    
    // Erstelle zusätzliche Frontend-spezifische Felder (ohne Originaldaten zu ändern)
    if (pgTrade.liquidationlevel !== undefined) {
      result.liquidation = pgTrade.liquidationlevel;
    }
    
    if (pgTrade.liquiditylevel !== undefined) {
      result.location = pgTrade.liquiditylevel;
    }
    
    if (pgTrade.chartimageurl !== undefined) {
      result.chartImage = pgTrade.chartimageurl;
    }
    
    if (pgTrade.positionsize !== undefined) {
      result.riskSum = pgTrade.positionsize;
    }
    
    // Wandle alle anderen PostgreSQL-Feldnamen in Frontend-Namen um
    for (const [pgField, frontendField] of Object.entries(fieldMapping)) {
      // Nur wenn das PostgreSQL-Feld existiert und noch nicht verarbeitet wurde
      if (pgTrade.hasOwnProperty(pgField) && !result.hasOwnProperty(frontendField)) {
        result[frontendField] = pgTrade[pgField];
      }
    }
    
    // Stelle sicher, dass date-Feld korrekt als Date-Objekt vorliegt
    if (result.date && typeof result.date === 'string') {
      try {
        result.date = new Date(result.date);
      } catch (error) {
        console.error("Fehler beim Konvertieren des Datums:", error);
      }
    }
    
    // Stelle sicher, dass createdAt und updatedAt korrekt als Date-Objekte vorliegen
    if (result.createdAt && typeof result.createdAt === 'string') {
      try {
        result.createdAt = new Date(result.createdAt);
      } catch (error) {
        console.error("Fehler beim Konvertieren von createdAt:", error);
      }
    }
    
    if (result.updatedAt && typeof result.updatedAt === 'string') {
      try {
        result.updatedAt = new Date(result.updatedAt);
      } catch (error) {
        console.error("Fehler beim Konvertieren von updatedAt:", error);
      }
    }
    
    // Debug-Ausgabe für die wichtigsten konvertierten Felder
    console.log("ConvertPostgresFieldsToFrontend Output:", {
      id: result.id, 
      date: result.date,
      symbol: result.symbol,
      profitLoss: result.profitLoss,
      isWin: result.isWin,
      setup: result.setup
    });
    
    return result;
  }

  // Hilfsfunktion: Transformiere DB-Trade-Objekt in Frontend-Format
  private mapDbTradeToFrontend(dbTrade: any): Trade {
    // Da die Datenbank jetzt in camelCase ist, müssen wir nicht mehr mappen
    // Wir müssen nur noch einige Typenkonvertierungen durchführen
    
    // Datum-Konvertierung
    if (dbTrade.date && typeof dbTrade.date !== 'object') {
      dbTrade.date = new Date(dbTrade.date);
    }
    
    // Zeitstempel-Konvertierungen
    if (dbTrade.createdAt && typeof dbTrade.createdAt !== 'object') {
      dbTrade.createdAt = new Date(dbTrade.createdAt);
    }
    
    if (dbTrade.updatedAt && typeof dbTrade.updatedAt !== 'object') {
      dbTrade.updatedAt = new Date(dbTrade.updatedAt);
    }
    
    // Numerische Werte sicherstellen
    if (dbTrade.profitLoss !== undefined && typeof dbTrade.profitLoss === 'string') {
      dbTrade.profitLoss = parseFloat(dbTrade.profitLoss);
    }
    
    if (dbTrade.rrAchieved !== undefined && typeof dbTrade.rrAchieved === 'string') {
      dbTrade.rrAchieved = parseFloat(dbTrade.rrAchieved);
    }
    
    if (dbTrade.rrPotential !== undefined && typeof dbTrade.rrPotential === 'string') {
      dbTrade.rrPotential = parseFloat(dbTrade.rrPotential);
    }
    
    // Boolean-Werte sicherstellen
    if (dbTrade.isWin !== undefined) {
      dbTrade.isWin = Boolean(dbTrade.isWin);
    }

    // Stelle für Kompatibilität sicher, dass die besonderen Frontend-Felder existieren
    if (dbTrade.liquidation === undefined && dbTrade.liquidationLevel !== undefined) {
      dbTrade.liquidation = dbTrade.liquidationLevel || "";
    }
    
    if (dbTrade.location === undefined && dbTrade.liquidityLevel !== undefined) {
      dbTrade.location = dbTrade.liquidityLevel || "";
    }

    if (dbTrade.chartImage === undefined && dbTrade.chartImageUrl !== undefined) {
      dbTrade.chartImage = dbTrade.chartImageUrl || null;
    }
    
    // Debug-Ausgabe zum Überprüfen der Felder
    console.log("Datenbankfelder:", Object.keys(dbTrade).sort());
    
    return dbTrade as Trade;
  }
  
  // Hilfsfunktion: Übersetze Frontend-Filter in DB-Filter
  private mapFrontendFilterToDb(filters: Partial<Trade>): any {
    if (!filters) return {};
    
    const dbFilters: any = {};
    
    // Mapping basierend auf der neuen camelCase-Datenbankstruktur nach der Spaltenumbenennung
    // WICHTIG: Nach der Datenbankumstellung von snake_case zu camelCase müssen wir die korrekten Spaltennamen verwenden
    const fieldMapping: Record<string, string> = {
      // Frontend-spezifische Felder
      'liquidation': 'liquidationLevel',   // Aktualisiert auf camelCase
      'location': 'liquidityLevel',        // Aktualisiert auf camelCase
      'chartImage': 'chartImageUrl',       // Aktualisiert auf camelCase
      'riskSum': 'positionSize',           // Aktualisiert auf camelCase
      
      // Reguläre Felder
      'mainTrendM15': 'mainTrendM15',      // Aktualisiert auf camelCase
      'internalTrendM5': 'internalTrendM5',// Aktualisiert auf camelCase
      'entryType': 'entryType',            // Aktualisiert auf camelCase
      'entryLevel': 'entryLevel',          // Aktualisiert auf camelCase
      'positionSize': 'positionSize',      // Aktualisiert auf camelCase
      'takeProfit': 'takeProfit',          // Aktualisiert auf camelCase
      'stopLoss': 'stopLoss',              // Aktualisiert auf camelCase
      'exitLevel': 'exitLevel',            // Aktualisiert auf camelCase
      'potentialRrr': 'potentialRrr',      // Aktualisiert auf camelCase
      'actualRrr': 'actualRrr',            // Aktualisiert auf camelCase
      'tradeDuration': 'tradeDuration',    // Aktualisiert auf camelCase
      'tradeResult': 'tradeResult',        // Aktualisiert auf camelCase
      'chartImageUrl': 'chartImageUrl',    // Aktualisiert auf camelCase
      'liquidityLevel': 'liquidityLevel',  // Aktualisiert auf camelCase
      'sessionNyc': 'sessionNYC',          // Aktualisiert auf camelCase
      'sessionLondon': 'sessionLondon',    // Aktualisiert auf camelCase
      'sessionAsia': 'sessionAsia',        // Aktualisiert auf camelCase
      'sessionTime': 'sessionTime',        // Aktualisiert auf camelCase
      'trendAlignment': 'trendAlignment',  // Aktualisiert auf camelCase
      'smartMoneyConcept': 'smartMoneyConcept', // Aktualisiert auf camelCase
      'marketStructure': 'marketStructure', // Aktualisiert auf camelCase
      'advancedPattern': 'advancedPattern', // Aktualisiert auf camelCase
      'chartPattern': 'chartPattern',      // Aktualisiert auf camelCase
      'fundamentalNews': 'fundamentalNews', // Aktualisiert auf camelCase
      'wickFill': 'wickFill',              // Aktualisiert auf camelCase
      'spreadSize': 'spreadSize',          // Aktualisiert auf camelCase
      'psychologicalLevel': 'psychologicalLevel', // Aktualisiert auf camelCase
      'tradeManagement': 'tradeManagement',    // Aktualisiert auf camelCase
      'exitReason': 'exitReason',          // Aktualisiert auf camelCase
      'advancedExit': 'advancedExit',      // Aktualisiert auf camelCase
      'liquidationLevel': 'liquidationLevel', // Aktualisiert auf camelCase
      'liquidationEntry': 'liquidationEntry', // Aktualisiert auf camelCase
      'profitLoss': 'profitLoss',          // Aktualisiert auf camelCase
      'isWin': 'isWin',                    // Aktualisiert auf camelCase
      'createdAt': 'createdAt',            // Aktualisiert auf camelCase
      'updatedAt': 'updatedAt',            // Aktualisiert auf camelCase
      'userId': 'userId',                  // Aktualisiert auf camelCase
      'rrAchieved': 'rrAchieved',          // Aktualisiert auf camelCase (vorher 'rr_achieved')
      'rrPotential': 'rrPotential'         // Aktualisiert auf camelCase
    };
    
    // Kopiere alle Frontend-Felder und wandle sie in PostgreSQL-Format um
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      
      // Spezielle Behandlung für bekannte Felder mit Mapping
      if (key in fieldMapping) {
        const dbFieldName = fieldMapping[key];
        dbFilters[dbFieldName] = value;
        console.log(`Frontend-Feld "${key}" → DB-Feld "${dbFieldName}": ${value}`);
      } else {
        // Für unbekannte Felder: Umwandlung in Kleinbuchstaben
        const dbFieldName = key.toLowerCase();
        dbFilters[dbFieldName] = value;
        console.log(`Unbekanntes Frontend-Feld "${key}" → DB-Feld "${dbFieldName}": ${value}`);
      }
    });
    
    console.log("Übersetzte DB-Filter:", dbFilters);
    return dbFilters;
  }

  async getTradeById(id: number): Promise<Trade | undefined> {
    try {
      // Verwende Raw SQL anstelle von Drizzle ORM, mit Anführungszeichen um die Spaltennamen
      // Nach der Datenbankumstellung auf camelCase müssen wir die Anführungszeichen verwenden
      const queryStr = `
        SELECT * FROM trades 
        WHERE "id" = $1
      `;
      
      const result = await db.execute(queryStr, [id]);
      const trade = result.rows?.[0];
      
      if (!trade) return undefined;
      
      // Wandle die PostgreSQL-Namen in Frontend-Namen um
      const frontendTrade = this.convertPostgresFieldsToFrontend(trade);
      
      // Verwende die zentrale Mapping-Funktion
      return this.mapDbTradeToFrontend(frontendTrade);
    } catch (error) {
      console.error(`Error fetching trade with id ${id}:`, error);
      return undefined;
    }
  }

  // Hilfsfunktion: Übersetzt Frontend-Trade-Objekt in Datenbank-Format
  private mapFrontendTradeToDb(frontendTrade: Partial<InsertTrade>): any {
    // Erstelle ein neues Objekt für die Datenbank anstatt zu klonen
    const dbTrade: any = {};
    
    // Debug-Ausgabe für eingehende Frontend-Daten
    console.log("Eingehende Frontend-Daten:", 
                { id: frontendTrade.id, 
                 symbol: frontendTrade.symbol,
                 setup: frontendTrade.setup,
                 profitLoss: frontendTrade.profitLoss,
                 isWin: frontendTrade.isWin });
    
    // Mapping basierend auf der neuen camelCase-Datenbankstruktur
    const fieldMapping: Record<string, string> = {
      // Frontend-spezifische Felder
      'liquidation': 'liquidationLevel',   // Aktualisiert auf camelCase
      'location': 'liquidityLevel',        // Aktualisiert auf camelCase
      'chartImage': 'chartImageUrl',       // Aktualisiert auf camelCase
      'riskSum': 'positionSize',           // Aktualisiert auf camelCase
      
      // Reguläre Felder
      'mainTrendM15': 'mainTrendM15',      // Aktualisiert auf camelCase (vorher 'main_trend_m15')
      'internalTrendM5': 'internalTrendM5', // Aktualisiert auf camelCase
      'entryType': 'entryType',            // Aktualisiert auf camelCase
      'entryLevel': 'entryLevel',          // Aktualisiert auf camelCase
      'positionSize': 'positionSize',      // Aktualisiert auf camelCase
      'takeProfit': 'takeProfit',          // Aktualisiert auf camelCase
      'stopLoss': 'stopLoss',              // Aktualisiert auf camelCase
      'exitLevel': 'exitLevel',            // Aktualisiert auf camelCase
      'potentialRrr': 'potentialRrr',      // Aktualisiert auf camelCase
      'actualRrr': 'actualRrr',            // Aktualisiert auf camelCase
      'tradeDuration': 'tradeDuration',    // Aktualisiert auf camelCase
      'tradeResult': 'tradeResult',        // Aktualisiert auf camelCase
      'chartImageUrl': 'chartImageUrl',    // Aktualisiert auf camelCase
      'liquidityLevel': 'liquidityLevel',  // Aktualisiert auf camelCase
      'sessionNyc': 'sessionNYC',          // Aktualisiert auf camelCase
      'sessionLondon': 'sessionLondon',    // Aktualisiert auf camelCase
      'sessionAsia': 'sessionAsia',        // Aktualisiert auf camelCase
      'sessionTime': 'sessionTime',        // Aktualisiert auf camelCase
      'trendAlignment': 'trendAlignment',  // Aktualisiert auf camelCase
      'smartMoneyConcept': 'smartMoneyConcept', // Aktualisiert auf camelCase
      'marketStructure': 'marketStructure', // Aktualisiert auf camelCase
      'advancedPattern': 'advancedPattern', // Aktualisiert auf camelCase
      'chartPattern': 'chartPattern',      // Aktualisiert auf camelCase
      'fundamentalNews': 'fundamentalNews', // Aktualisiert auf camelCase
      'wickFill': 'wickFill',              // Aktualisiert auf camelCase
      'spreadSize': 'spreadSize',          // Aktualisiert auf camelCase
      'psychologicalLevel': 'psychologicalLevel', // Aktualisiert auf camelCase
      'tradeManagement': 'tradeManagement', // Aktualisiert auf camelCase
      'exitReason': 'exitReason',          // Aktualisiert auf camelCase
      'advancedExit': 'advancedExit',      // Aktualisiert auf camelCase
      'liquidationLevel': 'liquidationLevel', // Aktualisiert auf camelCase
      'liquidationEntry': 'liquidationEntry', // Aktualisiert auf camelCase
      'profitLoss': 'profitLoss',          // Aktualisiert auf camelCase
      'isWin': 'isWin',                    // Aktualisiert auf camelCase
      'createdAt': 'createdAt',            // Aktualisiert auf camelCase
      'updatedAt': 'updatedAt',            // Aktualisiert auf camelCase
      'userId': 'userId',                  // Aktualisiert auf camelCase
      'rrAchieved': 'rrAchieved',          // Aktualisiert auf camelCase (vorher 'rr_achieved')
      'rrPotential': 'rrPotential',        // Aktualisiert auf camelCase
      'id': 'id',
      'symbol': 'symbol',
      'date': 'date',
      'setup': 'setup',
      'notes': 'notes',
      'deviation': 'deviation'
    };
    
    // Kopiere alle Frontend-Felder und wandle sie in PostgreSQL-Format um
    Object.entries(frontendTrade).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      
      // Ignoriere leere Strings
      if (typeof value === 'string' && value.trim() === '') return;
      
      // Spezielle Behandlung für bekannte Felder mit Mapping
      if (key in fieldMapping) {
        const dbFieldName = fieldMapping[key];
        
        // Behandle profitLoss speziell - konvertiere zu Zahl wenn nötig
        if (key === 'profitLoss' && typeof value === 'string') {
          dbTrade[dbFieldName] = this.cleanAndParseValue(value);
          console.log(`${key} als Zahl konvertiert: ${dbTrade[dbFieldName]}`);
        } 
        // Behandle rrAchieved und rrPotential speziell - konvertiere zu Zahl wenn nötig
        else if ((key === 'rrAchieved' || key === 'rrPotential') && typeof value === 'string') {
          dbTrade[dbFieldName] = parseFloat(value);
          console.log(`${key} als Zahl konvertiert: ${dbTrade[dbFieldName]}`);
        }
        // Datum-Konvertierung
        else if (key === 'date' && typeof value === 'string') {
          dbTrade[dbFieldName] = new Date(value);
          console.log(`Datum konvertiert zu Date-Objekt: ${dbTrade[dbFieldName]}`);
        }
        else {
          dbTrade[dbFieldName] = value;
        }
        
        console.log(`Frontend-Feld "${key}" → DB-Feld "${dbFieldName}": ${value}`);
      } else {
        // Für unbekannte Felder: Umwandlung in Kleinbuchstaben
        const dbFieldName = key.toLowerCase();
        dbTrade[dbFieldName] = value;
        console.log(`Unbekanntes Frontend-Feld "${key}" → DB-Feld "${dbFieldName}": ${value}`);
      }
    });
    
    // Debug-Ausgabe der DB-Felder nach Verarbeitung
    console.log("DB-Felder nach Verarbeitung:", Object.keys(dbTrade).sort());
    
    return dbTrade;
  }
  
  // Hilfsfunktion: Bereinigt und konvertiert P/L-Werte in numerische Werte
  private cleanAndParseValue(value: any): number {
    if (value === undefined || value === null) return 0;
    
    // Wenn bereits eine Zahl, keine Konvertierung nötig
    if (typeof value === 'number') return value;
    
    if (typeof value === 'string') {
      // Entferne alle nicht-numerischen Zeichen außer Punkt und Minus
      let cleanValue = value.trim();
      
      // Spezialbehandlung für Werte in Klammern wie "(150.25)" die negative Zahlen repräsentieren
      if (cleanValue.startsWith('(') && cleanValue.endsWith(')')) {
        cleanValue = '-' + cleanValue.substring(1, cleanValue.length - 1);
      }
      
      // Spezialbehandlung für Werte mit $ oder € Symbolen
      if (cleanValue.includes('$') || cleanValue.includes('€')) {
        cleanValue = cleanValue.replace(/[$€]/g, '');
      }
      
      // Entferne alle Tausender-Trennzeichen (Kommas)
      cleanValue = cleanValue.replace(/,/g, '');
      
      // Versuche zu parsen
      const parsedValue = parseFloat(cleanValue);
      
      if (!isNaN(parsedValue)) {
        console.log(`P/L-Wert '${value}' erfolgreich konvertiert zu ${parsedValue}`);
        return parsedValue;
      }
      console.log(`P/L-Wert '${value}' konnte nicht konvertiert werden, verwende 0`);
    }
    
    return 0;
  }

  async createTrade(trade: InsertTrade & { userId: number }): Promise<Trade> {
    try {
      console.log("TradeData vor der Konvertierung:", {
        date: trade.date,
        dateType: trade.date ? typeof trade.date : 'undefined',
        profitLoss: trade.profitLoss,
        profitLossType: trade.profitLoss !== undefined ? typeof trade.profitLoss : 'undefined'
      });
      
      // Konvertiere Frontend-Felder in Datenbankfelder mit konsistenter Mapping-Logik
      const dbTrade = this.mapFrontendTradeToDb(trade);
      
      // Wichtig: korrigiere die Feldnamen für PostgreSQL
      // profitloss (alles Kleinbuchstaben) statt profit_loss
      if (trade.profitLoss !== undefined) {
        dbTrade.profitloss = this.cleanAndParseValue(trade.profitLoss);
        delete dbTrade.profit_loss; // Falls dieses Feld existiert, entfernen
        console.log(`P/L-Wert konvertiert zu: ${dbTrade.profitloss} (ursprünglicher Wert: ${trade.profitLoss})`);
      }
      
      // Korrekter Feldname für rrAchieved ist rr_achieved (mit Unterstrich)
      // Wird bereits im mapFrontendTradeToDb richtig gemappt
      
      // Korrekter Feldname für rrPotential ist rrpotential (kein Unterstrich)
      // Wird bereits im mapFrontendTradeToDb richtig gemappt
      
      // Füge aktuelle Timestamps hinzu mit korrekten Feldnamen in Kleinbuchstaben
      const now = new Date();
      dbTrade.createdat = now;
      dbTrade.updatedat = now;
      delete dbTrade.created_at; // Falls diese Felder existieren, entfernen
      delete dbTrade.updated_at;
      
      // Stelle sicher, dass die User-ID korrekt gesetzt ist (userid statt user_id)
      dbTrade.userid = trade.userId;
      delete dbTrade.user_id; // Falls dieses Feld existiert, entfernen
      
      console.log("TradeData nach Konvertierung für DB:", {
        date: dbTrade.date,
        dateType: dbTrade.date ? typeof dbTrade.date : 'undefined',
        profitloss: dbTrade.profitloss,
        profitlossType: dbTrade.profitloss !== undefined ? typeof dbTrade.profitloss : 'undefined'
      });
      
      // Verwende Raw SQL anstelle von Drizzle ORM, um das Problem mit den Spaltennamen zu umgehen
      const columns = Object.keys(dbTrade);
      const placeholders = columns.map((_, i) => `$${i+1}`);
      const values = Object.values(dbTrade);
      
      const queryStr = `
        INSERT INTO trades (${columns.join(', ')})
        VALUES (${placeholders.join(', ')})
        RETURNING *
      `;
      
      console.log("SQL-Abfrage zum Erstellen eines Trades:", queryStr);
      console.log("Inserting values:", values.slice(0, 5), "...");
      
      const result = await db.execute(queryStr, values);
      const createdDbTrade = result.rows?.[0];
      
      if (!createdDbTrade) {
        throw new Error("Fehler beim Erstellen des Trades: Kein Ergebnis zurückgegeben");
      }
      
      // Wandle die PostgreSQL-Namen in Frontend-Namen um
      const frontendTrade = this.convertPostgresFieldsToFrontend(createdDbTrade);
      
      // Wandle das gespeicherte DB-Trade-Objekt zurück ins Frontend-Format mit zentraler Mapping-Funktion
      return this.mapDbTradeToFrontend(frontendTrade);
    } catch (error) {
      console.error('Error creating trade:', error);
      throw error;
    }
  }

  async updateTrade(id: number, frontendTradeData: Partial<Trade>): Promise<Trade | undefined> {
    try {
      // Debug-Logging der Eingangsdaten
      console.log("updateTrade - Daten vor Konvertierung:", {
        id,
        date: frontendTradeData.date,
        dateType: frontendTradeData.date ? typeof frontendTradeData.date : 'undefined',
        profitLoss: frontendTradeData.profitLoss,
        rrAchieved: frontendTradeData.rrAchieved,
        rrPotential: frontendTradeData.rrPotential
      });
      
      // Konvertiere Frontend-Felder in Datenbankfelder mit zentraler Mapping-Funktion
      // Die mapFrontendTradeToDb-Funktion kümmert sich bereits um alle Typkonvertierungen
      const dbTradeData = this.mapFrontendTradeToDb(frontendTradeData);
      
      // Stelle sicher, dass die ID nicht geändert wird
      delete dbTradeData.id;
      
      // Stelle sicher, dass die User-ID nicht geändert wird (mit korrektem Spaltennamen)
      delete dbTradeData.userId;
      
      // Aktualisiere den Timestamp mit korrektem Spaltennamen
      dbTradeData.updatedAt = new Date();
      
      console.log("TradeData nach Konvertierung für DB-Update:", {
        id,
        liquidationlevel: dbTradeData.liquidationlevel,
        liquiditylevel: dbTradeData.liquiditylevel,
        positionsize: dbTradeData.positionsize,
        actualrrr: dbTradeData.actualrrr,
        potentialrrr: dbTradeData.potentialrrr,
        profitloss: dbTradeData.profitloss,
        iswin: dbTradeData.iswin
      });
      
      // Verwende Raw SQL anstelle von Drizzle ORM, um das Problem mit den Spaltennamen zu umgehen
      let updateParts = [];
      const values = [];
      let paramIndex = 1;
      
      // Erzeuge UPDATE-Anweisung mit korrekten Spaltennamen
      for (const [key, value] of Object.entries(dbTradeData)) {
        if (value !== undefined) {
          // Mit Anführungszeichen für camelCase-Spaltennamen
          updateParts.push(`"${key}" = $${paramIndex}`);
          values.push(value);
          paramIndex++;
        }
      }
      
      // Keine Änderungen, wenn keine Felder zum Aktualisieren vorhanden sind
      if (updateParts.length === 0) {
        console.log(`Keine Änderungen für Trade mit ID ${id}`);
        return await this.getTradeById(id);
      }
      
      // SQL für das Update erzeugen
      const queryStr = `
        UPDATE trades
        SET ${updateParts.join(', ')}
        WHERE "id" = $${paramIndex}
        RETURNING *
      `;
      
      // ID als letzten Parameter hinzufügen
      values.push(id);
      
      console.log("SQL-Abfrage zum Aktualisieren eines Trades:", queryStr);
      console.log("Parameter-Anzahl:", values.length);
      
      const result = await db.execute(queryStr, values);
      const updatedDbTrade = result.rows?.[0];
      
      if (!updatedDbTrade) {
        console.error(`Kein Trade mit ID ${id} gefunden oder Update fehlgeschlagen`);
        return undefined;
      }
      
      console.log(`Trade mit ID ${id} erfolgreich aktualisiert`);
      
      // Wandle die PostgreSQL-Namen in Frontend-Namen um
      const frontendTrade = this.convertPostgresFieldsToFrontend(updatedDbTrade);
      
      // Wandle das aktualisierte DB-Trade-Objekt zurück ins Frontend-Format mit zentraler Mapping-Funktion
      return this.mapDbTradeToFrontend(frontendTrade);
    } catch (error) {
      console.error(`Error updating trade with id ${id}:`, error);
      return undefined;
    }
  }

  async deleteTrade(id: number): Promise<boolean> {
    try {
      await db.delete(trades).where(eq(trades.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting trade with id ${id}:`, error);
      return false;
    }
  }
  
  // App Settings operations
  async getAppSettings(userId: number): Promise<AppSettings | undefined> {
    try {
      // Verwende Raw SQL, um das Problem mit camelCase vs. lowercase zu umgehen
      const result = await db.execute(
        `SELECT * FROM app_settings WHERE "userId" = $1`,
        [userId]
      );
      
      const settings = result.rows?.[0];
      
      if (!settings) {
        return undefined;
      }
      
      // Konvertiere Datenbank-Feldnamen zu Frontend-Feldnamen
      const mappedSettings: any = {};
      
      for (const [key, value] of Object.entries(settings)) {
        // Konvertiere lowercase zu camelCase für bestimmte Felder
        if (key === 'userid') {
          mappedSettings.userId = value;
        } else if (key === 'deviceid') {
          mappedSettings.deviceId = value;
        } else if (key === 'createdat') {
          mappedSettings.createdAt = value;
        } else if (key === 'updatedat') {
          mappedSettings.updatedAt = value;
        } else {
          // Für andere Felder, behalte den Originalnamen bei
          mappedSettings[key] = value;
        }
      }
      
      return mappedSettings as AppSettings;
    } catch (error) {
      console.error(`Error fetching app settings for user ${userId}:`, error);
      return undefined;
    }
  }

  async createOrUpdateAppSettings(settings: InsertAppSettings): Promise<AppSettings> {
    try {
      // Prüfe, ob bereits Einstellungen für diesen Benutzer existieren
      const existingSettings = await this.getAppSettings(settings.userId);
      
      // Konvertiere Frontend-Feldnamen zu Datenbank-Feldnamen
      const dbSettings: any = {
        userId: settings.userId
      };
      
      // Kopiere alle anderen Einstellungen
      for (const [key, value] of Object.entries(settings)) {
        if (key === 'userId') {
          // Bereits verarbeitet
          continue;
        } else if (key === 'deviceId') {
          dbSettings.deviceid = value;
        } else if (key === 'darkMode') {
          dbSettings.darkmode = value;
        } else if (key === 'createdAt') {
          dbSettings.createdat = value;
        } else if (key === 'updatedAt') {
          dbSettings.updatedat = value;
        } else {
          // Für andere Felder den Namen in Kleinbuchstaben umwandeln
          dbSettings[key.toLowerCase()] = value;
        }
      }
      
      // Aktualisiere den Timestamp
      dbSettings.updatedat = new Date();
      
      if (existingSettings) {
        // Verwende Raw SQL für das Update
        const updateFields = Object.entries(dbSettings)
          .filter(([key, _]) => key !== 'userid') // Entferne userId aus den zu aktualisierenden Feldern
          .map(([key, _], index) => `${key} = $${index + 2}`)
          .join(', ');
          
        const updateValues = [
          settings.userId,
          ...Object.entries(dbSettings)
            .filter(([key, _]) => key !== 'userid')
            .map(([_, value]) => value)
        ];
        
        const query = `
          UPDATE app_settings
          SET ${updateFields}
          WHERE "userId" = $1
          RETURNING *
        `;
        
        console.log("SQL-Abfrage zum Aktualisieren von App-Einstellungen:", query);
        console.log("Parameter:", updateValues);
        
        const result = await db.execute(query, updateValues);
        const updatedDbSettings = result.rows?.[0];
        
        if (!updatedDbSettings) {
          throw new Error(`Keine App-Einstellungen für Benutzer ${settings.userId} gefunden oder Update fehlgeschlagen`);
        }
        
        // Konvertiere die Datenbank-Feldnamen zurück zu Frontend-Feldnamen
        const mappedSettings: any = {};
        
        for (const [key, value] of Object.entries(updatedDbSettings)) {
          if (key === 'userid') {
            mappedSettings.userId = value;
          } else if (key === 'deviceid') {
            mappedSettings.deviceId = value;
          } else if (key === 'darkmode') {
            mappedSettings.darkMode = value;
          } else if (key === 'createdat') {
            mappedSettings.createdAt = value;
          } else if (key === 'updatedat') {
            mappedSettings.updatedAt = value;
          } else {
            // Für andere Felder, behalte den Originalnamen bei
            mappedSettings[key] = value;
          }
        }
        
        return mappedSettings as AppSettings;
      } else {
        // Verwende Raw SQL für das Insert
        const columns = Object.keys(dbSettings).join(', ');
        const placeholders = Object.keys(dbSettings).map((_, i) => `$${i + 1}`).join(', ');
        const values = Object.values(dbSettings);
        
        const query = `
          INSERT INTO app_settings (${columns})
          VALUES (${placeholders})
          RETURNING *
        `;
        
        console.log("SQL-Abfrage zum Erstellen von App-Einstellungen:", query);
        console.log("Parameter:", values);
        
        const result = await db.execute(query, values);
        const newDbSettings = result.rows?.[0];
        
        if (!newDbSettings) {
          throw new Error(`Fehler beim Erstellen von App-Einstellungen für Benutzer ${settings.userId}`);
        }
        
        // Konvertiere die Datenbank-Feldnamen zurück zu Frontend-Feldnamen
        const mappedSettings: any = {};
        
        for (const [key, value] of Object.entries(newDbSettings)) {
          if (key === 'userid') {
            mappedSettings.userId = value;
          } else if (key === 'deviceid') {
            mappedSettings.deviceId = value;
          } else if (key === 'darkmode') {
            mappedSettings.darkMode = value;
          } else if (key === 'createdat') {
            mappedSettings.createdAt = value;
          } else if (key === 'updatedat') {
            mappedSettings.updatedAt = value;
          } else {
            // Für andere Felder, behalte den Originalnamen bei
            mappedSettings[key] = value;
          }
        }
        
        return mappedSettings as AppSettings;
      }
    } catch (error) {
      console.error(`Error creating/updating app settings for user ${settings.userId}:`, error);
      throw error;
    }
  }

  // Andere Methoden werden bei Bedarf implementiert
  // Die restlichen Methoden der IStorage-Schnittstelle müssen implementiert werden
  // Hier nur Beispielimplementierungen für die wichtigsten Funktionen
  
  // Weekly summary operations
  async getWeeklySummary(userId: number, weekStart: Date, weekEnd: Date): Promise<WeeklySummary | undefined> {
    try {
      const [summary] = await db
        .select()
        .from(weeklySummaries)
        .where(
          and(
            eq(weeklySummaries.userId, userId),
            eq(weeklySummaries.weekStart, weekStart),
            eq(weeklySummaries.weekEnd, weekEnd)
          )
        );
      return summary;
    } catch (error) {
      console.error(`Error fetching weekly summary for user ${userId}:`, error);
      return undefined;
    }
  }

  async createWeeklySummary(summary: InsertWeeklySummary & { userId: number }): Promise<WeeklySummary> {
    try {
      const [createdSummary] = await db
        .insert(weeklySummaries)
        .values(summary)
        .returning();
      return createdSummary;
    } catch (error) {
      console.error(`Error creating weekly summary for user ${summary.userId}:`, error);
      throw error;
    }
  }

  async updateWeeklySummary(id: number, summary: Partial<WeeklySummary>): Promise<WeeklySummary | undefined> {
    try {
      const [updatedSummary] = await db
        .update(weeklySummaries)
        .set(summary)
        .where(eq(weeklySummaries.id, id))
        .returning();
      return updatedSummary;
    } catch (error) {
      console.error(`Error updating weekly summary with id ${id}:`, error);
      return undefined;
    }
  }

  // Die implementierten Methoden sollten vorerst ausreichen
  // Weitere Methoden werden bei Bedarf implementiert

  // Performance data operations
  async getPerformanceData(userId: number, startDate?: Date, endDate?: Date): Promise<PerformanceData[]> {
    return []; // Implementierung bei Bedarf
  }

  async createPerformanceData(data: InsertPerformanceData & { userId: number }): Promise<PerformanceData> {
    throw new Error("Method not implemented");
  }

  // Setup win rate operations
  async getSetupWinRates(userId: number): Promise<SetupWinRate[]> {
    return []; // Implementierung bei Bedarf
  }

  async updateSetupWinRate(userId: number, setup: string, winRate: number): Promise<SetupWinRate> {
    throw new Error("Method not implemented");
  }

  // Statistics operations
  async calculateWeeklySummary(userId: number, weekStart: Date, weekEnd: Date): Promise<InsertWeeklySummary & { userId: number }> {
    // Vereinfachte Implementierung
    const summary = {
      userId,
      weekStart,
      weekEnd,
      totalRR: 0,
      tradeCount: 0,
      winRate: 0
    };
    return summary;
  }

  async calculateSetupWinRates(userId: number): Promise<void> {
    // Implementierung bei Bedarf
  }

  // Coaching Goals operations
  async getCoachingGoals(userId: number, completed?: boolean): Promise<CoachingGoal[]> {
    return []; // Implementierung bei Bedarf
  }

  async getCoachingGoalById(id: number): Promise<CoachingGoal | undefined> {
    return undefined; // Implementierung bei Bedarf
  }

  async createCoachingGoal(goal: InsertCoachingGoal): Promise<CoachingGoal> {
    throw new Error("Method not implemented");
  }

  async updateCoachingGoal(id: number, goal: Partial<CoachingGoal>): Promise<CoachingGoal | undefined> {
    return undefined; // Implementierung bei Bedarf
  }

  async deleteCoachingGoal(id: number): Promise<boolean> {
    return false; // Implementierung bei Bedarf
  }

  // Coaching Feedback operations
  async getCoachingFeedback(userId: number, acknowledged?: boolean): Promise<CoachingFeedback[]> {
    return []; // Implementierung bei Bedarf
  }

  async createCoachingFeedback(feedback: InsertCoachingFeedback): Promise<CoachingFeedback> {
    throw new Error("Method not implemented");
  }

  async acknowledgeCoachingFeedback(id: number): Promise<CoachingFeedback | undefined> {
    return undefined; // Implementierung bei Bedarf
  }

  async generateCoachingFeedback(userId: number): Promise<CoachingFeedback[]> {
    return []; // Implementierung bei Bedarf
  }

  // Trading Streak operations
  async getTradingStreak(userId: number): Promise<TradingStreak | undefined> {
    return undefined; // Implementierung bei Bedarf
  }

  async createTradingStreak(streak: InsertTradingStreak & { userId: number }): Promise<TradingStreak> {
    throw new Error("Method not implemented");
  }

  async updateTradingStreak(userId: number, streak: Partial<TradingStreak>): Promise<TradingStreak | undefined> {
    return undefined; // Implementierung bei Bedarf
  }

  async updateStreakOnTradeResult(userId: number, isWin: boolean): Promise<TradingStreak> {
    throw new Error("Method not implemented");
  }

  async getTopStreaks(): Promise<TradingStreak[]> {
    return []; // Implementierung bei Bedarf
  }

  async earnBadge(userId: number, badgeType: typeof badgeTypes[number]): Promise<TradingStreak | undefined> {
    return undefined; // Implementierung bei Bedarf
  }

  // Macroeconomic Events operations
  async getMacroEconomicEvents(startDate: Date, endDate: Date): Promise<MacroEconomicEvent[]> {
    return []; // Implementierung bei Bedarf
  }

  async getMacroEconomicEventById(id: number): Promise<MacroEconomicEvent | undefined> {
    return undefined; // Implementierung bei Bedarf
  }

  async createMacroEconomicEvent(event: InsertMacroEconomicEvent): Promise<MacroEconomicEvent> {
    throw new Error("Method not implemented");
  }

  async updateMacroEconomicEvent(id: number, event: Partial<MacroEconomicEvent>): Promise<MacroEconomicEvent | undefined> {
    return undefined; // Implementierung bei Bedarf
  }
}

// Wähle Storage-Implementierung basierend auf Umgebungsvariable
const storageProvider = process.env.DATABASE_PROVIDER || 'memory';
console.log(`Verwende Storage-Provider: ${storageProvider}`);

let storage: IStorage;

if (storageProvider === 'neon' || storageProvider === 'postgres' || storageProvider === 'supabase') {
  console.log('Initialisiere DatabaseStorage mit persistenter Datenspeicherung');
  storage = new DatabaseStorage();
} else {
  console.log('Initialisiere MemStorage (In-Memory-Speicher, keine persistente Datenspeicherung)');
  storage = new MemStorage();
}

export { storage };
