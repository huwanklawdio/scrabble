// ================================
// Scrabble Dictionary System
// ================================


// ================================
// Dictionary Types
// ================================

export type DictionaryType = 'TWL' | 'SOWPODS' | 'ENABLE' | 'CUSTOM' | 'DEMO';

export interface DictionaryMetadata {
  name: string;
  type: DictionaryType;
  description: string;
  wordCount: number;
  sourceUrl?: string;
  version?: string;
  lastUpdated?: Date;
  language: string;
  region?: string;
  isOfficial: boolean;
  maxWordLength: number;
  minWordLength: number;
}

export interface DictionaryStats {
  totalWords: number;
  wordsByLength: Record<number, number>;
  commonLetters: Record<string, number>;
  averageWordLength: number;
  longestWord: string;
  shortestWord: string;
}

export interface Dictionary {
  metadata: DictionaryMetadata;
  words: Set<string>;
  stats: DictionaryStats;
  isLoaded: boolean;
  loadTime?: number;
}

export type DictionaryLoadSource = 
  | { type: 'inline'; words: string[] }
  | { type: 'url'; url: string }
  | { type: 'file'; file: File }
  | { type: 'preset'; preset: DictionaryType };

// ================================
// Dictionary Configuration
// ================================

// Demo dictionary with common Scrabble words for testing
const DEMO_WORDS = [
  // 2-letter words
  'AA', 'AB', 'AD', 'AE', 'AG', 'AH', 'AI', 'AL', 'AM', 'AN', 'AR', 'AS', 'AT', 'AW', 'AX', 'AY',
  'BA', 'BE', 'BI', 'BO', 'BY', 'DA', 'DE', 'DO', 'ED', 'EF', 'EH', 'EL', 'EM', 'EN', 'ER', 'ES',
  'ET', 'EX', 'FA', 'FE', 'GO', 'HA', 'HE', 'HI', 'HM', 'HO', 'ID', 'IF', 'IN', 'IS', 'IT', 'JO',
  'KA', 'KI', 'LA', 'LI', 'LO', 'MA', 'ME', 'MI', 'MM', 'MO', 'MU', 'MY', 'NA', 'NE', 'NO', 'NU',
  'OD', 'OE', 'OF', 'OH', 'OI', 'OK', 'OM', 'ON', 'OP', 'OR', 'OS', 'OW', 'OX', 'OY', 'PA', 'PE',
  'PI', 'QI', 'RE', 'SH', 'SI', 'SO', 'TA', 'TI', 'TO', 'UH', 'UM', 'UN', 'UP', 'US', 'UT', 'WE',
  'WO', 'XI', 'XU', 'YA', 'YE', 'YO', 'ZA',
  
  // 3-letter words  
  'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'HAD',
  'DAY', 'GET', 'USE', 'MAN', 'NEW', 'NOW', 'WAY', 'MAY', 'SAY', 'SEE', 'HIM', 'TWO', 'HOW', 'ITS',
  'WHO', 'DID', 'YES', 'HIS', 'HAS', 'HAD', 'LET', 'PUT', 'TOO', 'OLD', 'ANY', 'SUN', 'SET', 'RUN',
  'HOT', 'CUT', 'LET', 'EAT', 'FAR', 'OFF', 'BAD', 'ARM', 'EYE', 'EAR', 'RED', 'TOP', 'BIG', 'BOX',
  'BAG', 'PEN', 'DOG', 'CAT', 'CAR', 'SIT', 'WIN', 'BUY', 'TRY', 'DIE', 'LIE', 'FLY', 'SKY', 'JOB',
  
  // 4-letter words
  'WORD', 'TIME', 'GAME', 'PLAY', 'WORK', 'LIFE', 'HAND', 'PART', 'TEAM', 'YEAR', 'WEEK', 'HOME',
  'BOOK', 'ROOM', 'IDEA', 'FACE', 'FACT', 'PLACE', 'RIGHT', 'WATER', 'THING', 'HOUSE', 'POINT',
  'MOVE', 'TURN', 'HELP', 'SHOW', 'COME', 'GIVE', 'TAKE', 'MAKE', 'FIND', 'KNOW', 'TELL', 'FEEL',
  'SEEM', 'KEEP', 'CALL', 'NEED', 'WANT', 'LOOK', 'BACK', 'OVER', 'LAST', 'LONG', 'BEST', 'GOOD',
  'NICE', 'COOL', 'WARM', 'COLD', 'HARD', 'EASY', 'FAST', 'SLOW', 'HIGH', 'LOVE', 'HATE', 'LIKE',
  
  // 5+ letter words  
  'ABOUT', 'AFTER', 'AGAIN', 'COULD', 'FIRST', 'NEVER', 'OTHER', 'RIGHT', 'SHALL', 'THEIR', 'THESE',
  'THINK', 'WHERE', 'WHICH', 'WORLD', 'WOULD', 'WRITE', 'SCRABBLE', 'LETTER', 'BOARD', 'SCORE',
  'TILES', 'WORDS', 'POINTS', 'PLAYER', 'DICTIONARY', 'PREMIUM', 'DOUBLE', 'TRIPLE', 'BLANK'
];

// Predefined dictionary configurations
export const DICTIONARY_PRESETS: Record<DictionaryType, DictionaryMetadata> = {
  TWL: {
    name: 'Tournament Word List (TWL)',
    type: 'TWL',
    description: 'Official tournament dictionary for US, Canada, and Thailand',
    wordCount: 178000, // Approximate
    sourceUrl: 'https://scrabble123.com/scrabble-word',
    language: 'English',
    region: 'North America',
    isOfficial: true,
    maxWordLength: 15,
    minWordLength: 2
  },
  SOWPODS: {
    name: 'SOWPODS (International)',
    type: 'SOWPODS', 
    description: 'International Scrabble dictionary combining TWL and Collins',
    wordCount: 267000, // Approximate
    sourceUrl: 'https://sowpods-scrabble-dictionary.apps112.com/',
    language: 'English',
    region: 'International',
    isOfficial: true,
    maxWordLength: 15,
    minWordLength: 2
  },
  ENABLE: {
    name: 'Enhanced North American Benchmark Lexicon (ENABLE)',
    type: 'ENABLE',
    description: 'Public domain tournament-level word list',
    wordCount: 173000, // Approximate
    sourceUrl: 'http://web.archive.org/web/20090122025747/http://personal.riverusers.com/~thegrendel/software.html',
    language: 'English',
    region: 'North America',
    isOfficial: false,
    maxWordLength: 21,
    minWordLength: 2
  },
  DEMO: {
    name: 'Demo Dictionary',
    type: 'DEMO',
    description: 'Small subset of common words for testing and demos',
    wordCount: DEMO_WORDS.length,
    language: 'English',
    isOfficial: false,
    maxWordLength: 10,
    minWordLength: 2
  },
  CUSTOM: {
    name: 'Custom Dictionary',
    type: 'CUSTOM',
    description: 'User-provided custom word list',
    wordCount: 0,
    language: 'English',
    isOfficial: false,
    maxWordLength: 15,
    minWordLength: 2
  }
};

// ================================
// Dictionary Class
// ================================

export class ScrabbleDictionary implements Dictionary {
  public metadata: DictionaryMetadata;
  public words: Set<string>;
  public stats: DictionaryStats;
  public isLoaded: boolean = false;
  public loadTime?: number;

  constructor(metadata: DictionaryMetadata) {
    this.metadata = { ...metadata };
    this.words = new Set();
    this.stats = this.createEmptyStats();
  }

  private createEmptyStats(): DictionaryStats {
    return {
      totalWords: 0,
      wordsByLength: {},
      commonLetters: {},
      averageWordLength: 0,
      longestWord: '',
      shortestWord: ''
    };
  }

  /**
   * Load words from various sources
   */
  async loadFromSource(source: DictionaryLoadSource): Promise<void> {
    const startTime = performance.now();
    
    try {
      let words: string[];
      
      switch (source.type) {
        case 'inline':
          words = source.words;
          break;
          
        case 'preset':
          words = await this.loadPresetAsync(source.preset);
          break;
          
        case 'url':
          words = await this.loadFromUrl(source.url);
          break;
          
        case 'file':
          words = await this.loadFromFile(source.file);
          break;
          
        default:
          throw new Error(`Unsupported source type: ${(source as any).type}`);
      }
      
      this.loadWords(words);
      this.loadTime = performance.now() - startTime;
      this.isLoaded = true;
      
    } catch (error) {
      this.isLoaded = false;
      throw new Error(`Failed to load dictionary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load words from text content
   */
  loadFromText(text: string): void {
    const words = this.parseWordList(text);
    this.loadWords(words);
  }

  /**
   * Load words from a preset dictionary type
   */
  loadPreset(type: DictionaryType): void {
    const startTime = performance.now();
    
    try {
      let words: string[];
      
      switch (type) {
        case 'DEMO':
          words = DEMO_WORDS;
          break;
          
        case 'TWL':
        case 'SOWPODS': 
        case 'ENABLE':
          // In a real implementation, these would load from actual dictionary files
          console.warn(`${type} dictionary not yet implemented, using demo words`);
          words = DEMO_WORDS;
          break;
          
        default:
          throw new Error(`Unknown preset dictionary type: ${type}`);
      }
      
      this.loadWords(words);
      this.loadTime = performance.now() - startTime;
      this.isLoaded = true;
      
    } catch (error) {
      this.isLoaded = false;
      throw new Error(`Failed to load dictionary: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load words from a preset dictionary type (async version for loadFromSource)
   */
  private async loadPresetAsync(type: DictionaryType): Promise<string[]> {
    switch (type) {
      case 'DEMO':
        return DEMO_WORDS;
        
      case 'TWL':
      case 'SOWPODS': 
      case 'ENABLE':
        // In a real implementation, these would load from actual dictionary files
        // For now, return demo words with a note
        console.warn(`${type} dictionary not yet implemented, using demo words`);
        return DEMO_WORDS;
        
      default:
        throw new Error(`Unknown preset dictionary type: ${type}`);
    }
  }

  /**
   * Load words from a remote URL
   */
  private async loadFromUrl(url: string): Promise<string[]> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const text = await response.text();
    return this.parseWordList(text);
  }

  /**
   * Load words from a file
   */
  private async loadFromFile(file: File): Promise<string[]> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const text = event.target?.result as string;
          const words = this.parseWordList(text);
          resolve(words);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  /**
   * Parse word list from text content
   */
  private parseWordList(text: string): string[] {
    return text
      .split(/[\r\n]+/)
      .map(line => line.trim().toUpperCase())
      .filter(word => word.length > 0 && /^[A-Z]+$/.test(word));
  }

  /**
   * Load and process word array
   */
  loadWords(words: string[]): void {
    const startTime = performance.now();
    
    // Clear existing data
    this.words.clear();
    
    // Normalize and add words
    const normalizedWords = words
      .map(word => word.trim().toUpperCase())
      .filter(word => word.length > 0 && /^[A-Z]+$/.test(word));
    
    normalizedWords.forEach(word => this.words.add(word));
    
    // Update metadata and stats
    this.metadata.wordCount = this.words.size;
    this.updateStatistics();
    
    // Mark as loaded
    this.loadTime = performance.now() - startTime;
    this.isLoaded = true;
  }

  /**
   * Calculate dictionary statistics
   */
  private updateStatistics(): void {
    const words = Array.from(this.words);
    
    if (words.length === 0) {
      this.stats = this.createEmptyStats();
      return;
    }

    // Basic stats
    this.stats.totalWords = words.length;
    this.stats.wordsByLength = {};
    this.stats.commonLetters = {};
    
    let totalLength = 0;
    let shortest = words[0];
    let longest = words[0];
    
    // Process each word
    words.forEach(word => {
      const length = word.length;
      totalLength += length;
      
      // Track word lengths
      this.stats.wordsByLength[length] = (this.stats.wordsByLength[length] || 0) + 1;
      
      // Track shortest/longest
      if (word.length < shortest.length) shortest = word;
      if (word.length > longest.length) longest = word;
      
      // Count letters
      [...word].forEach(letter => {
        this.stats.commonLetters[letter] = (this.stats.commonLetters[letter] || 0) + 1;
      });
    });
    
    this.stats.averageWordLength = totalLength / words.length;
    this.stats.shortestWord = shortest;
    this.stats.longestWord = longest;
    
    // Update metadata bounds
    this.metadata.minWordLength = shortest.length;
    this.metadata.maxWordLength = longest.length;
  }

  /**
   * Check if a word exists in the dictionary
   */
  isValidWord(word: string): boolean {
    if (!this.isLoaded) {
      throw new Error('Dictionary not loaded');
    }
    
    const normalizedWord = word.trim().toUpperCase();
    return this.words.has(normalizedWord);
  }

  /**
   * Check multiple words at once
   */
  areValidWords(words: string[]): boolean[] {
    return words.map(word => this.isValidWord(word));
  }

  /**
   * Find words that match a pattern
   */
  findWordsMatching(pattern: RegExp): string[] {
    if (!this.isLoaded) {
      throw new Error('Dictionary not loaded');
    }
    
    return Array.from(this.words).filter(word => pattern.test(word));
  }

  /**
   * Find anagrams of given letters
   */
  findAnagrams(letters: string, minLength: number = 2): string[] {
    if (!this.isLoaded) {
      throw new Error('Dictionary not loaded');
    }
    
    const availableLetters = letters.toUpperCase();
    const letterCounts = this.countLetters(availableLetters);
    
    return Array.from(this.words).filter(word => {
      if (word.length < minLength) return false;
      
      const wordLetterCounts = this.countLetters(word);
      
      // Check if word can be formed from available letters
      for (const [letter, count] of Object.entries(wordLetterCounts)) {
        if ((letterCounts[letter] || 0) < count) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Count occurrences of each letter in a string
   */
  private countLetters(text: string): Record<string, number> {
    const counts: Record<string, number> = {};
    [...text].forEach(letter => {
      counts[letter] = (counts[letter] || 0) + 1;
    });
    return counts;
  }

  /**
   * Get words by length
   */
  getWordsByLength(length: number): string[] {
    if (!this.isLoaded) {
      throw new Error('Dictionary not loaded');
    }
    
    return Array.from(this.words).filter(word => word.length === length);
  }

  /**
   * Get words starting with prefix
   */
  getWordsStartingWith(prefix: string): string[] {
    if (!this.isLoaded) {
      throw new Error('Dictionary not loaded');
    }
    
    const upperPrefix = prefix.toUpperCase();
    return Array.from(this.words).filter(word => word.startsWith(upperPrefix));
  }

  /**
   * Get words ending with suffix
   */
  getWordsEndingWith(suffix: string): string[] {
    if (!this.isLoaded) {
      throw new Error('Dictionary not loaded');
    }
    
    const upperSuffix = suffix.toUpperCase();
    return Array.from(this.words).filter(word => word.endsWith(upperSuffix));
  }

  /**
   * Get words containing substring
   */
  getWordsContaining(substring: string): string[] {
    if (!this.isLoaded) {
      throw new Error('Dictionary not loaded');
    }
    
    const upperSubstring = substring.toUpperCase();
    return Array.from(this.words).filter(word => word.includes(upperSubstring));
  }

  /**
   * Export dictionary data
   */
  exportData(): { metadata: DictionaryMetadata; words: string[]; stats: DictionaryStats } {
    return {
      metadata: { ...this.metadata },
      words: Array.from(this.words).sort(),
      stats: { ...this.stats }
    };
  }

  /**
   * Import dictionary data
   */
  importData(data: { metadata: DictionaryMetadata; words: string[]; stats?: DictionaryStats }): void {
    this.metadata = { ...data.metadata };
    this.words = new Set(data.words);
    
    if (data.stats) {
      this.stats = { ...data.stats };
    } else {
      this.updateStatistics();
    }
    
    this.isLoaded = true;
  }
}

// ================================
// Dictionary Manager
// ================================

export class DictionaryManager {
  private dictionaries: Map<string, ScrabbleDictionary> = new Map();
  private activeDictionary: ScrabbleDictionary | null = null;

  /**
   * Create a new dictionary instance
   */
  createDictionary(id: string, metadata: DictionaryMetadata): ScrabbleDictionary {
    const dictionary = new ScrabbleDictionary(metadata);
    this.dictionaries.set(id, dictionary);
    return dictionary;
  }

  /**
   * Load a preset dictionary
   */
  loadPresetDictionary(id: string, type: DictionaryType): ScrabbleDictionary {
    const metadata = { ...DICTIONARY_PRESETS[type] };
    const dictionary = this.createDictionary(id, metadata);
    
    dictionary.loadPreset(type);
    return dictionary;
  }

  /**
   * Get dictionary by ID
   */
  getDictionary(id: string): ScrabbleDictionary | undefined {
    return this.dictionaries.get(id);
  }

  /**
   * Set active dictionary
   */
  setActiveDictionary(id: string): boolean {
    const dictionary = this.dictionaries.get(id);
    if (dictionary && dictionary.isLoaded) {
      this.activeDictionary = dictionary;
      return true;
    }
    return false;
  }

  /**
   * Get active dictionary
   */
  getActiveDictionary(): ScrabbleDictionary | null {
    return this.activeDictionary;
  }

  /**
   * Validate word using active dictionary
   */
  isValidWord(word: string): boolean {
    if (!this.activeDictionary) {
      throw new Error('No active dictionary set');
    }
    return this.activeDictionary.isValidWord(word);
  }

  /**
   * Validate multiple words
   */
  areValidWords(words: string[]): boolean[] {
    if (!this.activeDictionary) {
      throw new Error('No active dictionary set');
    }
    return this.activeDictionary.areValidWords(words);
  }

  /**
   * Get all available dictionaries
   */
  getAvailableDictionaries(): Array<{ id: string; dictionary: ScrabbleDictionary }> {
    return Array.from(this.dictionaries.entries()).map(([id, dictionary]) => ({
      id,
      dictionary
    }));
  }

  /**
   * Remove dictionary
   */
  removeDictionary(id: string): boolean {
    if (this.activeDictionary === this.dictionaries.get(id)) {
      this.activeDictionary = null;
    }
    return this.dictionaries.delete(id);
  }

  /**
   * Clear all dictionaries
   */
  clearAll(): void {
    this.dictionaries.clear();
    this.activeDictionary = null;
  }
}

// ================================
// Default Export & Instances
// ================================

// Global dictionary manager instance
export const dictionaryManager = new DictionaryManager();

// Create and load demo dictionary by default
export function initializeDefaultDictionary(): ScrabbleDictionary {
  const demoDictionary = dictionaryManager.loadPresetDictionary('demo', 'DEMO');
  dictionaryManager.setActiveDictionary('demo');
  return demoDictionary;
}

// Utility functions for common operations
export const validateWord = (word: string): boolean => dictionaryManager.isValidWord(word);
export const validateWords = (words: string[]): boolean[] => dictionaryManager.areValidWords(words);
export const getActiveDictionary = (): ScrabbleDictionary | null => dictionaryManager.getActiveDictionary(); 