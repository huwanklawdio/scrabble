// ================================
// Drag & Drop Utility System
// Enhanced HTML5 Drag & Drop Implementation
// ================================

import type { Tile } from '../types/game';

// ================================
// Types & Interfaces
// ================================

export interface DragData {
  type: 'tile' | 'board-tile';
  tile: Tile;
  sourcePosition?: { row: number; col: number };
  sourceRack?: boolean;
}

export interface DropZoneState {
  isValidTarget: boolean;
  isActive: boolean;
  canAcceptTile: boolean;
  hasOccupant: boolean;
}

export interface DragPreviewOptions {
  rotation?: number;
  scale?: number;
  opacity?: number;
  shadow?: boolean;
  glow?: boolean;
}

export interface DragFeedback {
  visual: 'valid' | 'invalid' | 'neutral';
  cursor: 'move' | 'not-allowed' | 'copy' | 'alias';
  highlight: 'success' | 'error' | 'warning' | 'none';
}

// ================================
// Drag Data Management
// ================================

export class DragDataManager {
  private static readonly DATA_TYPE = 'application/x-scrabble-tile';
  private static readonly LEGACY_TYPE = 'application/json';

  static setTileData(dataTransfer: DataTransfer, dragData: DragData): void {
    try {
      // Primary format - structured data
      dataTransfer.setData(this.DATA_TYPE, JSON.stringify(dragData));
      
      // Fallback format for compatibility
      dataTransfer.setData(this.LEGACY_TYPE, JSON.stringify(dragData.tile));
      
      // Plain text fallback
      dataTransfer.setData('text/plain', dragData.tile.letter || 'BLANK');
      
      // Set allowed effects
      dataTransfer.effectAllowed = 'move';
    } catch (error) {
      console.warn('Failed to set drag data:', error);
    }
  }

  static getTileData(dataTransfer: DataTransfer): DragData | null {
    try {
      // Check if dataTransfer has the expected methods
      if (!dataTransfer || typeof dataTransfer.getData !== 'function') {
        return null;
      }

      // Try primary format first
      const primaryData = dataTransfer.getData(this.DATA_TYPE);
      if (primaryData) {
        return JSON.parse(primaryData) as DragData;
      }

      // Try legacy format
      const legacyData = dataTransfer.getData(this.LEGACY_TYPE);
      if (legacyData) {
        const tile = JSON.parse(legacyData) as Tile;
        return {
          type: 'tile',
          tile,
        };
      }

      return null;
    } catch (error) {
      console.warn('Failed to parse drag data:', error);
      return null;
    }
  }

  static canAcceptDrop(dataTransfer: DataTransfer): boolean {
    return dataTransfer.types.includes(this.DATA_TYPE) || 
           dataTransfer.types.includes(this.LEGACY_TYPE);
  }
}

// ================================
// Drag Preview Enhancement
// ================================

export class DragPreviewManager {
  private static cleanup: (() => void)[] = [];

  static createCustomPreview(
    element: HTMLElement, 
    options: DragPreviewOptions = {}
  ): HTMLElement {
    const {
      rotation = -5,
      scale = 1.1,
      opacity = 0.9,
      shadow = true,
      glow = false,
    } = options;

    // Clone the element
    const preview = element.cloneNode(true) as HTMLElement;
    
    // Apply styling
    preview.style.position = 'absolute';
    preview.style.top = '-1000px';
    preview.style.left = '-1000px';
    preview.style.transform = `rotate(${rotation}deg) scale(${scale})`;
    preview.style.opacity = opacity.toString();
    preview.style.pointerEvents = 'none';
    preview.style.zIndex = '10000';
    
    if (shadow) {
      preview.style.filter = 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))';
    }
    
    if (glow) {
      preview.style.filter += ' drop-shadow(0 0 8px rgba(59, 130, 246, 0.5))';
    }

    // Remove any IDs to avoid duplicates
    preview.removeAttribute('id');
    preview.removeAttribute('data-testid');
    
    // Remove nested IDs
    const nestedElements = preview.querySelectorAll('[id], [data-testid]');
    nestedElements.forEach(el => {
      el.removeAttribute('id');
      el.removeAttribute('data-testid');
    });

    return preview;
  }

  static setDragImage(
    dataTransfer: DataTransfer, 
    element: HTMLElement, 
    options: DragPreviewOptions = {}
  ): void {
    if (typeof window === 'undefined' || process.env.NODE_ENV === 'test') {
      return;
    }

    try {
      const preview = this.createCustomPreview(element, options);
      document.body.appendChild(preview);

      // Set drag image
      dataTransfer.setDragImage(preview, 32, 32);

      // Schedule cleanup
      const cleanup = () => {
        if (document.body.contains(preview)) {
          document.body.removeChild(preview);
        }
      };

      this.cleanup.push(cleanup);
      setTimeout(cleanup, 100);
    } catch (error) {
      console.warn('Failed to create drag preview:', error);
    }
  }

  static cleanupAll(): void {
    this.cleanup.forEach(fn => fn());
    this.cleanup = [];
  }
}

// ================================
// Drop Zone Validation
// ================================

export class DropZoneValidator {
  static validateDropTarget(
    dragData: DragData | null,
    _targetRow: number,
    _targetCol: number,
    isOccupied: boolean,
    isDisabled: boolean = false
  ): DropZoneState {
    // Basic validation
    if (!dragData || isDisabled) {
      return {
        isValidTarget: false,
        isActive: false,
        canAcceptTile: false,
        hasOccupant: isOccupied,
      };
    }

    // Check if target is occupied
    if (isOccupied) {
      return {
        isValidTarget: false,
        isActive: true,
        canAcceptTile: false,
        hasOccupant: true,
      };
    }

    // Valid drop target
    return {
      isValidTarget: true,
      isActive: true,
      canAcceptTile: true,
      hasOccupant: false,
    };
  }

  static getDropFeedback(state: DropZoneState): DragFeedback {
    if (!state.isActive) {
      return {
        visual: 'neutral',
        cursor: 'not-allowed',
        highlight: 'none',
      };
    }

    if (state.hasOccupant) {
      return {
        visual: 'invalid',
        cursor: 'not-allowed',
        highlight: 'error',
      };
    }

    if (state.isValidTarget) {
      return {
        visual: 'valid',
        cursor: 'move',
        highlight: 'success',
      };
    }

    return {
      visual: 'invalid',
      cursor: 'not-allowed',
      highlight: 'error',
    };
  }
}

// ================================
// Drag State Management
// ================================

export class DragStateManager {
  private static dragInProgress = false;
  private static dragData: DragData | null = null;
  private static callbacks: Map<string, () => void> = new Map();

  static startDrag(data: DragData): void {
    this.dragInProgress = true;
    this.dragData = data;
    // Defer callback notifications to avoid React setState during render
    // Use synchronous calls in test environment
    if (process.env.NODE_ENV === 'test') {
      this.notifyCallbacks('dragStart');
    } else {
      setTimeout(() => this.notifyCallbacks('dragStart'), 0);
    }
  }

  static endDrag(): void {
    this.dragInProgress = false;
    this.dragData = null;
    DragPreviewManager.cleanupAll();
    // Defer callback notifications to avoid React setState during render
    // Use synchronous calls in test environment
    if (process.env.NODE_ENV === 'test') {
      this.notifyCallbacks('dragEnd');
    } else {
      setTimeout(() => this.notifyCallbacks('dragEnd'), 0);
    }
  }

  static isDragging(): boolean {
    return this.dragInProgress;
  }

  static getCurrentDragData(): DragData | null {
    return this.dragData;
  }

  static onDragStateChange(id: string, callback: () => void): void {
    this.callbacks.set(id, callback);
  }

  static removeDragStateListener(id: string): void {
    this.callbacks.delete(id);
  }

  private static notifyCallbacks(event: string): void {
    this.callbacks.forEach(callback => {
      try {
        callback();
      } catch (error) {
        console.warn(`Drag state callback error (${event}):`, error);
      }
    });
  }
}

// ================================
// Touch Support Detection
// ================================

export class TouchSupportDetector {
  static isTouchDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      // @ts-ignore - Legacy property
      navigator.msMaxTouchPoints > 0
    );
  }

  static supportsPointerEvents(): boolean {
    return 'PointerEvent' in window;
  }

  static prefersTouchInteraction(): boolean {
    return this.isTouchDevice() && window.innerWidth < 1024;
  }

  static getInteractionMode(): 'touch' | 'mouse' | 'hybrid' {
    if (this.prefersTouchInteraction()) return 'touch';
    if (this.isTouchDevice()) return 'hybrid';
    return 'mouse';
  }
}

// ================================
// Accessibility Enhancements
// ================================

export class DragAccessibility {
  static announceDropAction(
    tile: Tile, 
    targetRow: number, 
    targetCol: number,
    success: boolean
  ): void {
    if (typeof window === 'undefined' || !tile) return;

    const letter = tile.letter || 'blank tile';
    const position = `row ${targetRow + 1}, column ${String.fromCharCode(65 + targetCol)}`;
    
    const message = success
      ? `${letter} placed at ${position}`
      : `Cannot place ${letter} at ${position}`;

    // Create temporary announcement element
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.style.position = 'absolute';
    announcement.style.left = '-10000px';
    announcement.style.width = '1px';
    announcement.style.height = '1px';
    announcement.style.overflow = 'hidden';
    
    document.body.appendChild(announcement);
    announcement.textContent = message;
    
    setTimeout(() => {
      if (document.body.contains(announcement)) {
        document.body.removeChild(announcement);
      }
    }, 1000);
  }

  static setDragDescriptions(element: HTMLElement, tile: Tile): void {
    const letter = tile.letter || 'blank tile';
    element.setAttribute('aria-label', `Draggable ${letter} tile worth ${tile.points} points`);
    element.setAttribute('aria-describedby', 'drag-instructions');
  }

  static setDropZoneDescriptions(element: HTMLElement, row: number, col: number): void {
    const position = `row ${row + 1}, column ${String.fromCharCode(65 + col)}`;
    element.setAttribute('aria-label', `Drop zone at ${position}`);
  }
}

// ================================
// Export All Utilities
// ================================

export const dragAndDropUtils = {
  DragDataManager,
  DragPreviewManager,
  DropZoneValidator,
  DragStateManager,
  TouchSupportDetector,
  DragAccessibility,
};

export default dragAndDropUtils;