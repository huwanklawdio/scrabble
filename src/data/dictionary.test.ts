// ================================
// Dictionary System Tests
// ================================

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  ScrabbleDictionary,
  DictionaryManager,
  dictionaryManager,
  initializeDefaultDictionary,
  validateWord,
  validateWords,
  getActiveDictionary,
  DICTIONARY_PRESETS,
  type DictionaryType,
} from './dictionary';

describe('Dictionary System', () => {
  let dictionary: ScrabbleDictionary;
  let manager: DictionaryManager;

  beforeEach(() => {
    // Create fresh instances for each test
    dictionary = new ScrabbleDictionary(DICTIONARY_PRESETS.DEMO);
    manager = new DictionaryManager();
  });

  afterEach(() => {
    // Clean up global manager
    dictionaryManager.clearAll();
  });

  describe('ScrabbleDictionary Class', () => {
    describe('Construction and Initialization', () => {
      it('should create dictionary with metadata', () => {
        expect(dictionary.metadata.name).toBe('Demo Dictionary');
        expect(dictionary.metadata.type).toBe('DEMO');
        expect(dictionary.isLoaded).toBe(false);
        expect(dictionary.words.size).toBe(0);
      });

      it('should have empty stats initially', () => {
        expect(dictionary.stats.totalWords).toBe(0);
        expect(dictionary.stats.averageWordLength).toBe(0);
        expect(dictionary.stats.longestWord).toBe('');
        expect(dictionary.stats.shortestWord).toBe('');
      });
    });

    describe('Word Loading', () => {
      it('should load words from array', () => {
        const testWords = ['CAT', 'DOG', 'BIRD', 'FISH'];
        dictionary.loadWords(testWords);
        
        expect(dictionary.isLoaded).toBe(true);
        expect(dictionary.words.size).toBe(4);
        expect(dictionary.metadata.wordCount).toBe(4);
        expect(dictionary.loadTime).toBeGreaterThan(0);
      });

      it('should normalize words to uppercase', () => {
        dictionary.loadWords(['cat', 'Dog', 'BIRD']);
        
        expect(dictionary.words.has('CAT')).toBe(true);
        expect(dictionary.words.has('DOG')).toBe(true);
        expect(dictionary.words.has('BIRD')).toBe(true);
        expect(dictionary.words.has('cat')).toBe(false);
      });

      it('should filter out invalid words', () => {
        dictionary.loadWords(['CAT', '', '  ', 'DOG123', 'BIRD-FLY', 'VALID']);
        
        expect(dictionary.words.size).toBe(2);
        expect(dictionary.words.has('CAT')).toBe(true);
        expect(dictionary.words.has('VALID')).toBe(true);
      });

      it('should load from text content', () => {
        const text = 'CAT\nDOG\r\nBIRD\n\nFISH\r\n';
        dictionary.loadFromText(text);
        
        expect(dictionary.words.size).toBe(4);
        expect(dictionary.isLoaded).toBe(true);
      });

      it('should load demo preset', () => {
        dictionary.loadPreset('DEMO');
        
        expect(dictionary.isLoaded).toBe(true);
        expect(dictionary.words.size).toBeGreaterThan(0);
        expect(dictionary.words.has('SCRABBLE')).toBe(true);
        expect(dictionary.words.has('AA')).toBe(true);
      });

      it('should handle other presets with warning', () => {
        const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
        
        dictionary.loadPreset('TWL');
        
        expect(dictionary.isLoaded).toBe(true);
        expect(consoleSpy).toHaveBeenCalledWith('TWL dictionary not yet implemented, using demo words');
        
        consoleSpy.mockRestore();
      });
    });

    describe('Statistics Calculation', () => {
      beforeEach(() => {
        dictionary.loadWords(['A', 'AT', 'CAT', 'CATS', 'HELLO']);
      });

      it('should calculate basic statistics', () => {
        expect(dictionary.stats.totalWords).toBe(5);
        expect(dictionary.stats.shortestWord).toBe('A');
        expect(dictionary.stats.longestWord).toBe('HELLO');
        expect(dictionary.stats.averageWordLength).toBe(3); // (1+2+3+4+5)/5 = 15/5 = 3
      });

      it('should count words by length', () => {
        expect(dictionary.stats.wordsByLength[1]).toBe(1); // A
        expect(dictionary.stats.wordsByLength[2]).toBe(1); // AT
        expect(dictionary.stats.wordsByLength[3]).toBe(1); // CAT
        expect(dictionary.stats.wordsByLength[4]).toBe(1); // CATS
        expect(dictionary.stats.wordsByLength[5]).toBe(1); // HELLO
      });

      it('should count letter frequencies', () => {
        expect(dictionary.stats.commonLetters['A']).toBe(4); // A, AT, CAT, CATS
        expect(dictionary.stats.commonLetters['T']).toBe(3); // AT, CAT, CATS
        expect(dictionary.stats.commonLetters['C']).toBe(2); // CAT, CATS
      });

      it('should update metadata bounds', () => {
        expect(dictionary.metadata.minWordLength).toBe(1);
        expect(dictionary.metadata.maxWordLength).toBe(5);
      });
    });

    describe('Word Validation', () => {
      beforeEach(() => {
        dictionary.loadWords(['CAT', 'DOG', 'BIRD', 'SCRABBLE']);
      });

      it('should validate existing words', () => {
        expect(dictionary.isValidWord('CAT')).toBe(true);
        expect(dictionary.isValidWord('cat')).toBe(true); // Case insensitive
        expect(dictionary.isValidWord('SCRABBLE')).toBe(true);
      });

      it('should reject non-existing words', () => {
        expect(dictionary.isValidWord('NOTAWORD')).toBe(false);
        expect(dictionary.isValidWord('INVALID')).toBe(false);
      });

      it('should validate multiple words', () => {
        const results = dictionary.areValidWords(['CAT', 'DOG', 'INVALID', 'BIRD']);
        expect(results).toEqual([true, true, false, true]);
      });

      it('should throw error when not loaded', () => {
        const emptyDict = new ScrabbleDictionary(DICTIONARY_PRESETS.DEMO);
        expect(() => emptyDict.isValidWord('CAT')).toThrow('Dictionary not loaded');
      });
    });

    describe('Word Search Functions', () => {
      beforeEach(() => {
        dictionary.loadWords([
          'CAT', 'CAR', 'CARD', 'CARE', 'CART', 
          'DOG', 'BAT', 'HAT', 'RAT', 'RATE',
          'SCRABBLE', 'LETTER', 'TILES'
        ]);
      });

      it('should find words by length', () => {
        const threeLetterWords = dictionary.getWordsByLength(3);
        expect(threeLetterWords).toContain('CAT');
        expect(threeLetterWords).toContain('DOG');
        expect(threeLetterWords).toContain('BAT');
        expect(threeLetterWords).not.toContain('CARD');
      });

      it('should find words starting with prefix', () => {
        const carWords = dictionary.getWordsStartingWith('CAR');
        expect(carWords).toContain('CAR');
        expect(carWords).toContain('CARD');
        expect(carWords).toContain('CARE');
        expect(carWords).toContain('CART');
        expect(carWords).not.toContain('CAT');
      });

      it('should find words ending with suffix', () => {
        const atWords = dictionary.getWordsEndingWith('AT');
        expect(atWords).toContain('CAT');
        expect(atWords).toContain('BAT');
        expect(atWords).toContain('HAT');
        expect(atWords).toContain('RAT');
        expect(atWords).not.toContain('RATE');
      });

      it('should find words containing substring', () => {
        const arWords = dictionary.getWordsContaining('AR');
        expect(arWords).toContain('CAR');
        expect(arWords).toContain('CARD');
        expect(arWords).toContain('CARE');
        expect(arWords).toContain('CART');
        expect(arWords).not.toContain('CAT');
      });

      it('should find words matching pattern', () => {
        const pattern = /^C.T$/; // C_T pattern
        const matches = dictionary.findWordsMatching(pattern);
        expect(matches).toContain('CAT');
        expect(matches).not.toContain('CART');
      });
    });

    describe('Anagram Finding', () => {
      beforeEach(() => {
        dictionary.loadWords([
          'CAT', 'ACT', 'TAC', 'DOG', 'GOD', 'LISTEN', 'SILENT', 'RATS', 'STAR', 'ARTS'
        ]);
      });

      it('should find anagrams for given letters', () => {
        const anagrams = dictionary.findAnagrams('CAT');
        expect(anagrams).toContain('CAT');
        expect(anagrams).toContain('ACT');
        expect(anagrams).toContain('TAC');
        expect(anagrams).not.toContain('DOG');
      });

      it('should respect minimum length', () => {
        dictionary.loadWords(['A', 'AT', 'CAT']);
        const anagrams = dictionary.findAnagrams('CAT', 3);
        expect(anagrams).toContain('CAT');
        expect(anagrams).not.toContain('A');
        expect(anagrams).not.toContain('AT');
      });

      it('should handle repeated letters', () => {
        dictionary.loadWords(['RATS', 'STAR', 'ARTS', 'TARS']);
        const anagrams = dictionary.findAnagrams('RATS');
        expect(anagrams).toContain('RATS');
        expect(anagrams).toContain('STAR');
        expect(anagrams).toContain('ARTS');
        expect(anagrams).toContain('TARS');
      });

      it('should not allow more letters than available', () => {
        dictionary.loadWords(['CAT', 'CATTLE']);
        const anagrams = dictionary.findAnagrams('CAT');
        expect(anagrams).toContain('CAT');
        expect(anagrams).not.toContain('CATTLE'); // Requires 2 T's
      });
    });
  });

  describe('DictionaryManager Class', () => {
    describe('Dictionary Management', () => {
      it('should create new dictionary', () => {
        const metadata = DICTIONARY_PRESETS.DEMO;
        const dict = manager.createDictionary('test', metadata);
        
        expect(dict).toBeInstanceOf(ScrabbleDictionary);
        expect(manager.getDictionary('test')).toBe(dict);
      });

      it('should load preset dictionary', () => {
        const dict = manager.loadPresetDictionary('demo', 'DEMO');
        
        expect(dict.isLoaded).toBe(true);
        expect(dict.metadata.type).toBe('DEMO');
        expect(manager.getDictionary('demo')).toBe(dict);
      });

      it('should set and get active dictionary', () => {
        const dict = manager.loadPresetDictionary('demo', 'DEMO');
        const success = manager.setActiveDictionary('demo');
        
        expect(success).toBe(true);
        expect(manager.getActiveDictionary()).toBe(dict);
      });

      it('should not set unloaded dictionary as active', () => {
        const metadata = DICTIONARY_PRESETS.DEMO;
        manager.createDictionary('test', metadata); // Not loaded
        const success = manager.setActiveDictionary('test');
        
        expect(success).toBe(false);
        expect(manager.getActiveDictionary()).toBeNull();
      });

      it('should validate words with active dictionary', () => {
        manager.loadPresetDictionary('demo', 'DEMO');
        manager.setActiveDictionary('demo');
        
        expect(manager.isValidWord('SCRABBLE')).toBe(true);
        expect(manager.isValidWord('NOTAWORD')).toBe(false);
      });

      it('should throw error when no active dictionary', () => {
        expect(() => manager.isValidWord('TEST')).toThrow('No active dictionary set');
      });

      it('should list available dictionaries', () => {
        manager.loadPresetDictionary('demo1', 'DEMO');
        manager.loadPresetDictionary('demo2', 'DEMO');
        
        const available = manager.getAvailableDictionaries();
        expect(available).toHaveLength(2);
        expect(available.some(d => d.id === 'demo1')).toBe(true);
        expect(available.some(d => d.id === 'demo2')).toBe(true);
      });

      it('should remove dictionary', () => {
        manager.loadPresetDictionary('demo', 'DEMO');
        manager.setActiveDictionary('demo');
        
        const removed = manager.removeDictionary('demo');
        expect(removed).toBe(true);
        expect(manager.getDictionary('demo')).toBeUndefined();
        expect(manager.getActiveDictionary()).toBeNull();
      });

      it('should clear all dictionaries', () => {
        manager.loadPresetDictionary('demo1', 'DEMO');
        manager.loadPresetDictionary('demo2', 'DEMO');
        manager.setActiveDictionary('demo1');
        
        manager.clearAll();
        expect(manager.getAvailableDictionaries()).toHaveLength(0);
        expect(manager.getActiveDictionary()).toBeNull();
      });
    });
  });

  describe('Global Dictionary Functions', () => {
    describe('Default Dictionary Initialization', () => {
      it('should initialize default dictionary', () => {
        const dict = initializeDefaultDictionary();
        
        expect(dict.isLoaded).toBe(true);
        expect(dict.metadata.type).toBe('DEMO');
        expect(getActiveDictionary()).toBe(dict);
      });

      it('should provide global validation functions', () => {
        initializeDefaultDictionary();
        
        expect(validateWord('SCRABBLE')).toBe(true);
        expect(validateWord('NOTAWORD')).toBe(false);
        
        const results = validateWords(['SCRABBLE', 'TILES', 'INVALID']);
        expect(results).toEqual([true, true, false]);
      });
    });
  });

  describe('Dictionary Presets', () => {
    it('should have all required presets', () => {
      const requiredTypes: DictionaryType[] = ['TWL', 'SOWPODS', 'ENABLE', 'DEMO', 'CUSTOM'];
      
      requiredTypes.forEach(type => {
        expect(DICTIONARY_PRESETS[type]).toBeDefined();
        expect(DICTIONARY_PRESETS[type].type).toBe(type);
      });
    });

    it('should have valid metadata for each preset', () => {
      Object.values(DICTIONARY_PRESETS).forEach(metadata => {
        expect(metadata.name).toBeTruthy();
        expect(metadata.description).toBeTruthy();
        expect(metadata.language).toBeTruthy();
        expect(metadata.minWordLength).toBeGreaterThan(0);
        expect(metadata.maxWordLength).toBeGreaterThan(metadata.minWordLength);
        expect(typeof metadata.isOfficial).toBe('boolean');
      });
    });

    it('should have correct word counts for demo', () => {
      const demoMetadata = DICTIONARY_PRESETS.DEMO;
      expect(demoMetadata.wordCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid dictionary type', () => {
      expect(() => {
        dictionary.loadPreset('INVALID' as DictionaryType);
      }).toThrow('Unknown preset dictionary type: INVALID');
    });

    it('should handle empty word arrays', () => {
      dictionary.loadWords([]);
      expect(dictionary.isLoaded).toBe(true);
      expect(dictionary.words.size).toBe(0);
      expect(dictionary.stats.totalWords).toBe(0);
    });

    it('should handle operations on unloaded dictionary', () => {
      const emptyDict = new ScrabbleDictionary(DICTIONARY_PRESETS.DEMO);
      
      expect(() => emptyDict.isValidWord('TEST')).toThrow('Dictionary not loaded');
      expect(() => emptyDict.findAnagrams('TEST')).toThrow('Dictionary not loaded');
      expect(() => emptyDict.getWordsByLength(3)).toThrow('Dictionary not loaded');
    });
  });

  describe('Performance and Memory', () => {
    it('should measure load time', () => {
      dictionary.loadWords(['CAT', 'DOG', 'BIRD']);
      expect(dictionary.loadTime).toBeGreaterThan(0);
      expect(dictionary.loadTime).toBeLessThan(100); // Should be fast for small datasets
    });

    it('should handle duplicate words efficiently', () => {
      dictionary.loadWords(['CAT', 'CAT', 'DOG', 'DOG', 'BIRD']);
      expect(dictionary.words.size).toBe(3); // Set deduplicates
      expect(dictionary.stats.totalWords).toBe(3);
    });

    it('should use Set for O(1) lookups', () => {
      // Load a larger dataset to test performance
      const largeWordList = Array.from({ length: 1000 }, (_, i) => `WORD${i}`);
      dictionary.loadWords(largeWordList);
      
      const startTime = performance.now();
      dictionary.isValidWord('WORD500');
      const endTime = performance.now();
      
      expect(endTime - startTime).toBeLessThan(1); // Should be very fast
    });
  });

  describe('Data Export/Import', () => {
    beforeEach(() => {
      dictionary.loadWords(['CAT', 'DOG', 'BIRD']);
    });

    it('should export dictionary data', () => {
      const exported = dictionary.exportData();
      
      expect(exported.metadata).toEqual(dictionary.metadata);
      expect(exported.words).toEqual(['BIRD', 'CAT', 'DOG']); // Sorted
      expect(exported.stats).toEqual(dictionary.stats);
    });

    it('should import dictionary data', () => {
      const exportedData = dictionary.exportData();
      const newDict = new ScrabbleDictionary(DICTIONARY_PRESETS.DEMO);
      
      newDict.importData(exportedData);
      
      expect(newDict.isLoaded).toBe(true);
      expect(newDict.words.size).toBe(3);
      expect(newDict.isValidWord('CAT')).toBe(true);
      expect(newDict.metadata.wordCount).toBe(3);
    });

    it('should recalculate stats if not provided in import', () => {
      const exportedData = dictionary.exportData();
      delete (exportedData as any).stats;
      
      const newDict = new ScrabbleDictionary(DICTIONARY_PRESETS.DEMO);
      newDict.importData(exportedData);
      
      expect(newDict.stats.totalWords).toBe(3);
      expect(newDict.stats.averageWordLength).toBeGreaterThan(0);
    });
  });
}); 