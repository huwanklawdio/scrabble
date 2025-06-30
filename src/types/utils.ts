// ================================
// Generic Utility Types
// ================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = 
  Pick<T, Exclude<keyof T, Keys>> & {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

export type NonEmptyArray<T> = [T, ...T[]];
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ================================
// API and Network Types
// ================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export type RequestStatus = 'idle' | 'pending' | 'success' | 'error';

export interface AsyncOperation<T = any> {
  status: RequestStatus;
  data?: T;
  error?: string;
  lastUpdated?: Date;
}

// ================================
// Validation Types
// ================================

export interface ValidationRule<T = any> {
  validate: (value: T) => boolean;
  message: string;
  type: 'required' | 'format' | 'length' | 'range' | 'custom';
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface FormField<T = any> {
  value: T;
  isValid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  errors: string[];
  rules: ValidationRule<T>[];
}

// ================================
// Event Types
// ================================

export interface CustomEvent<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
  source?: string;
}

export type EventHandler<T = any> = (event: CustomEvent<T>) => void;
export type EventUnsubscribe = () => void;

// ================================
// Storage Types
// ================================

export interface StorageConfig {
  key: string;
  version: number;
  migrate?: (oldData: any, oldVersion: number) => any;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: Date;
  expiry?: Date;
  tags?: string[];
}

// ================================
// Time and Date Utilities
// ================================

export interface TimeRemaining {
  hours: number;
  minutes: number;
  seconds: number;
  total: number; // in seconds
  isExpired: boolean;
}

export interface Duration {
  start: Date;
  end?: Date;
  elapsed: number; // in milliseconds
}

// ================================
// Performance and Metrics
// ================================

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 'count' | 'bytes' | 'percent';
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface LoadingState {
  isLoading: boolean;
  progress?: number; // 0-100
  message?: string;
  stage?: string;
}

// ================================
// Configuration Types
// ================================

export interface AppConfig {
  apiUrl: string;
  wsUrl: string;
  version: string;
  environment: 'development' | 'staging' | 'production';
  features: Record<string, boolean>;
  limits: {
    maxPlayers: number;
    maxRooms: number;
    turnTimeLimit: number;
    gameTimeLimit: number;
  };
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  soundEnabled: boolean;
  animationsEnabled: boolean;
  autoSave: boolean;
  notifications: {
    gameEvents: boolean;
    playerJoins: boolean;
    moveReminders: boolean;
  };
}

// ================================
// Search and Filter Types
// ================================

export interface SearchOptions {
  query: string;
  filters: Record<string, any>;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'range' | 'boolean' | 'date';
  options?: { value: any; label: string }[];
  defaultValue?: any;
}

// ================================
// Color and Theme Types
// ================================

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
}

export interface ThemeConfig {
  name: string;
  colors: ColorPalette;
  fonts: {
    primary: string;
    secondary: string;
    monospace: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
    full: string;
  };
}

// ================================
// Coordinate and Position Types
// ================================

export interface Point2D {
  x: number;
  y: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Bounds {
  min: Point2D;
  max: Point2D;
}

// ================================
// File and Media Types
// ================================

export interface FileInfo {
  name: string;
  size: number;
  type: string;
  lastModified: Date;
  data?: string | ArrayBuffer;
}

export interface MediaQuery {
  query: string;
  matches: boolean;
}

// ================================
// Debug and Development Types
// ================================

export interface DebugInfo {
  timestamp: Date;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: any;
  source?: string;
}

export interface DevTools {
  enabled: boolean;
  showLogs: boolean;
  showPerformance: boolean;
  showState: boolean;
}

// ================================
// Type Guards and Utilities
// ================================

export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

export type NonNullable<T> = T extends null | undefined ? never : T;

export type Flatten<T> = T extends ReadonlyArray<infer U> ? U : T;

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
}; 