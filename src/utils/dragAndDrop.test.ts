import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { dragAndDropUtils } from './dragAndDrop';
import type { Tile } from '../types/game';

const {
  DragDataManager,
  DragPreviewManager,
  DropZoneValidator,
  DragStateManager,
  TouchSupportDetector,
  DragAccessibility,
} = dragAndDropUtils;

// Mock DataTransfer
class MockDataTransfer {
  public types: string[] = [];
  private data: Map<string, string> = new Map();
  public effectAllowed: string = 'none';
  public dropEffect: string = 'none';

  setData(type: string, data: string): void {
    this.data.set(type, data);
    if (!this.types.includes(type)) {
      this.types.push(type);
    }
  }

  getData(type: string): string {
    return this.data.get(type) || '';
  }

  setDragImage(): void {
    // Mock implementation
  }
}

// Mock tile
const mockTile: Tile = {
  id: 'test-tile-1',
  letter: 'A',
  points: 1,
  isBlank: false,
  status: 'rack',
};

describe('DragDataManager', () => {
  let mockDataTransfer: MockDataTransfer;

  beforeEach(() => {
    mockDataTransfer = new MockDataTransfer();
  });

  describe('setTileData', () => {
    it('sets structured drag data', () => {
      const dragData = {
        type: 'tile' as const,
        tile: mockTile,
        sourceRack: true,
      };

      DragDataManager.setTileData(mockDataTransfer as any, dragData);

      expect(mockDataTransfer.types).toContain('application/x-scrabble-tile');
      expect(mockDataTransfer.types).toContain('application/json');
      expect(mockDataTransfer.types).toContain('text/plain');
      expect(mockDataTransfer.effectAllowed).toBe('move');
    });

    it('handles errors gracefully', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const badDataTransfer = {
        setData: vi.fn().mockImplementation(() => {
          throw new Error('Test error');
        }),
      };

      DragDataManager.setTileData(badDataTransfer as any, {
        type: 'tile',
        tile: mockTile,
      });

      expect(consoleSpy).toHaveBeenCalledWith('Failed to set drag data:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('getTileData', () => {
    it('retrieves primary format data', () => {
      const dragData = {
        type: 'tile' as const,
        tile: mockTile,
        sourceRack: true,
      };

      mockDataTransfer.setData('application/x-scrabble-tile', JSON.stringify(dragData));

      const result = DragDataManager.getTileData(mockDataTransfer as any);
      expect(result).toEqual(dragData);
    });

    it('falls back to legacy format', () => {
      mockDataTransfer.setData('application/json', JSON.stringify(mockTile));

      const result = DragDataManager.getTileData(mockDataTransfer as any);
      expect(result).toEqual({
        type: 'tile',
        tile: mockTile,
      });
    });

    it('returns null for invalid data', () => {
      mockDataTransfer.setData('application/json', 'invalid json');

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = DragDataManager.getTileData(mockDataTransfer as any);
      
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Failed to parse drag data:', expect.any(Error));
      consoleSpy.mockRestore();
    });
  });

  describe('canAcceptDrop', () => {
    it('returns true for supported formats', () => {
      mockDataTransfer.types.push('application/x-scrabble-tile');
      expect(DragDataManager.canAcceptDrop(mockDataTransfer as any)).toBe(true);

      mockDataTransfer.types = ['application/json'];
      expect(DragDataManager.canAcceptDrop(mockDataTransfer as any)).toBe(true);
    });

    it('returns false for unsupported formats', () => {
      mockDataTransfer.types = ['text/plain'];
      expect(DragDataManager.canAcceptDrop(mockDataTransfer as any)).toBe(false);
    });
  });
});

describe('DragPreviewManager', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement('div');
    mockElement.id = 'test-element';
    mockElement.setAttribute('data-testid', 'test-tile');
    
    // Mock document.body methods
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockElement);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockElement);
    vi.spyOn(document.body, 'contains').mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    DragPreviewManager.cleanupAll();
  });

  describe('createCustomPreview', () => {
    it('creates styled preview element', () => {
      const preview = DragPreviewManager.createCustomPreview(mockElement, {
        rotation: -10,
        scale: 1.2,
        opacity: 0.8,
        shadow: true,
        glow: true,
      });

      expect(preview.style.transform).toBe('rotate(-10deg) scale(1.2)');
      expect(preview.style.opacity).toBe('0.8');
      expect(preview.style.filter).toContain('drop-shadow');
      expect(preview.id).toBe(''); // Should remove ID
      expect(preview.getAttribute('data-testid')).toBeNull(); // Should remove test ID
    });

    it('uses default options', () => {
      const preview = DragPreviewManager.createCustomPreview(mockElement);

      expect(preview.style.transform).toBe('rotate(-5deg) scale(1.1)');
      expect(preview.style.opacity).toBe('0.9');
    });
  });

  describe('setDragImage', () => {
    it('skips in test environment', () => {
      const mockDataTransfer = {
        setDragImage: vi.fn(),
      };

      DragPreviewManager.setDragImage(mockDataTransfer as any, mockElement);

      expect(mockDataTransfer.setDragImage).not.toHaveBeenCalled();
    });
  });
});

describe('DropZoneValidator', () => {
  const mockDragData = {
    type: 'tile' as const,
    tile: mockTile,
    sourceRack: true,
  };

  describe('validateDropTarget', () => {
    it('rejects disabled targets', () => {
      const result = DropZoneValidator.validateDropTarget(
        mockDragData,
        0,
        0,
        false,
        true // disabled
      );

      expect(result.isValidTarget).toBe(false);
      expect(result.isActive).toBe(false);
    });

    it('rejects occupied targets', () => {
      const result = DropZoneValidator.validateDropTarget(
        mockDragData,
        0,
        0,
        true, // occupied
        false
      );

      expect(result.isValidTarget).toBe(false);
      expect(result.hasOccupant).toBe(true);
    });

    it('accepts valid targets', () => {
      const result = DropZoneValidator.validateDropTarget(
        mockDragData,
        0,
        0,
        false, // not occupied
        false  // not disabled
      );

      expect(result.isValidTarget).toBe(true);
      expect(result.canAcceptTile).toBe(true);
    });

    it('handles null drag data', () => {
      const result = DropZoneValidator.validateDropTarget(null, 0, 0, false, false);

      expect(result.isValidTarget).toBe(false);
      expect(result.isActive).toBe(false);
    });
  });

  describe('getDropFeedback', () => {
    it('provides neutral feedback for inactive zones', () => {
      const feedback = DropZoneValidator.getDropFeedback({
        isValidTarget: false,
        isActive: false,
        canAcceptTile: false,
        hasOccupant: false,
      });

      expect(feedback.visual).toBe('neutral');
      expect(feedback.cursor).toBe('not-allowed');
    });

    it('provides error feedback for occupied zones', () => {
      const feedback = DropZoneValidator.getDropFeedback({
        isValidTarget: false,
        isActive: true,
        canAcceptTile: false,
        hasOccupant: true,
      });

      expect(feedback.visual).toBe('invalid');
      expect(feedback.highlight).toBe('error');
    });

    it('provides success feedback for valid zones', () => {
      const feedback = DropZoneValidator.getDropFeedback({
        isValidTarget: true,
        isActive: true,
        canAcceptTile: true,
        hasOccupant: false,
      });

      expect(feedback.visual).toBe('valid');
      expect(feedback.cursor).toBe('move');
      expect(feedback.highlight).toBe('success');
    });
  });
});

describe('DragStateManager', () => {
  beforeEach(() => {
    DragStateManager.endDrag(); // Reset state
  });

  it('manages drag state correctly', () => {
    expect(DragStateManager.isDragging()).toBe(false);
    expect(DragStateManager.getCurrentDragData()).toBeNull();

    const dragData = { type: 'tile' as const, tile: mockTile };
    DragStateManager.startDrag(dragData);

    expect(DragStateManager.isDragging()).toBe(true);
    expect(DragStateManager.getCurrentDragData()).toEqual(dragData);

    DragStateManager.endDrag();

    expect(DragStateManager.isDragging()).toBe(false);
    expect(DragStateManager.getCurrentDragData()).toBeNull();
  });

  it('manages state change callbacks', () => {
    const callback = vi.fn();
    DragStateManager.onDragStateChange('test', callback);

    DragStateManager.startDrag({ type: 'tile', tile: mockTile });
    expect(callback).toHaveBeenCalledTimes(1);

    DragStateManager.endDrag();
    expect(callback).toHaveBeenCalledTimes(2);

    DragStateManager.removeDragStateListener('test');
    DragStateManager.startDrag({ type: 'tile', tile: mockTile });
    expect(callback).toHaveBeenCalledTimes(2); // Should not be called again
  });
});

describe('TouchSupportDetector', () => {
  beforeEach(() => {
    // Reset window properties
    delete (window as any).ontouchstart;
    Object.defineProperty(navigator, 'maxTouchPoints', {
      writable: true,
      value: 0,
    });
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      value: 1024,
    });
  });

  describe('isTouchDevice', () => {
    it('detects touch support via ontouchstart', () => {
      (window as any).ontouchstart = true;
      expect(TouchSupportDetector.isTouchDevice()).toBe(true);
    });

    it('detects touch support via maxTouchPoints', () => {
      Object.defineProperty(navigator, 'maxTouchPoints', { value: 1 });
      expect(TouchSupportDetector.isTouchDevice()).toBe(true);
    });

    it('returns false when no touch support', () => {
      expect(TouchSupportDetector.isTouchDevice()).toBe(false);
    });
  });

  describe('prefersTouchInteraction', () => {
    it('prefers touch on small touch devices', () => {
      (window as any).ontouchstart = true;
      Object.defineProperty(window, 'innerWidth', { value: 768 });
      
      expect(TouchSupportDetector.prefersTouchInteraction()).toBe(true);
    });

    it('does not prefer touch on large screens', () => {
      (window as any).ontouchstart = true;
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      
      expect(TouchSupportDetector.prefersTouchInteraction()).toBe(false);
    });
  });

  describe('getInteractionMode', () => {
    it('returns touch for preferred touch interaction', () => {
      (window as any).ontouchstart = true;
      Object.defineProperty(window, 'innerWidth', { value: 500 });
      
      expect(TouchSupportDetector.getInteractionMode()).toBe('touch');
    });

    it('returns hybrid for touch devices with large screens', () => {
      (window as any).ontouchstart = true;
      Object.defineProperty(window, 'innerWidth', { value: 1200 });
      
      expect(TouchSupportDetector.getInteractionMode()).toBe('hybrid');
    });

    it('returns mouse for non-touch devices', () => {
      expect(TouchSupportDetector.getInteractionMode()).toBe('mouse');
    });
  });
});

describe('DragAccessibility', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('announceDropAction', () => {
    it('creates announcement for successful drop', () => {
      DragAccessibility.announceDropAction(mockTile, 0, 0, true);

      const announcement = document.querySelector('[aria-live="polite"]');
      expect(announcement).toBeTruthy();
      expect(announcement?.textContent).toBe('A placed at row 1, column A');
    });

    it('creates announcement for failed drop', () => {
      DragAccessibility.announceDropAction(mockTile, 1, 2, false);

      const announcement = document.querySelector('[aria-live="polite"]');
      expect(announcement).toBeTruthy();
      expect(announcement?.textContent).toBe('Cannot place A at row 2, column C');
    });

    it('handles blank tiles', () => {
      const blankTile: Tile = { ...mockTile, letter: '', isBlank: true };
      DragAccessibility.announceDropAction(blankTile, 0, 0, true);

      const announcement = document.querySelector('[aria-live="polite"]');
      expect(announcement?.textContent).toBe('blank tile placed at row 1, column A');
    });
  });

  describe('setDragDescriptions', () => {
    it('sets appropriate aria attributes', () => {
      const element = document.createElement('div');
      DragAccessibility.setDragDescriptions(element, mockTile);

      expect(element.getAttribute('aria-label')).toBe('Draggable A tile worth 1 points');
      expect(element.getAttribute('aria-describedby')).toBe('drag-instructions');
    });

    it('handles blank tiles', () => {
      const element = document.createElement('div');
      const blankTile: Tile = { ...mockTile, letter: '', isBlank: true };
      DragAccessibility.setDragDescriptions(element, blankTile);

      expect(element.getAttribute('aria-label')).toBe('Draggable blank tile tile worth 1 points');
    });
  });

  describe('setDropZoneDescriptions', () => {
    it('sets drop zone aria label', () => {
      const element = document.createElement('div');
      DragAccessibility.setDropZoneDescriptions(element, 2, 3);

      expect(element.getAttribute('aria-label')).toBe('Drop zone at row 3, column D');
    });
  });
});