// ================================
// Touch Drag & Drop Implementation
// Enhanced touch support for mobile devices
// ================================

import React from 'react';
import type { Tile } from '../types/game';
import { dragAndDropUtils } from './dragAndDrop';

const { TouchSupportDetector, DragStateManager } = dragAndDropUtils;

// ================================
// Touch Event Interfaces
// ================================

export interface TouchPosition {
  x: number;
  y: number;
  clientX: number;
  clientY: number;
}

export interface TouchDragState {
  isDragging: boolean;
  startPosition: TouchPosition | null;
  currentPosition: TouchPosition | null;
  draggedTile: Tile | null;
  dragThreshold: number;
  previewElement: HTMLElement | null;
}

export interface TouchDropTarget {
  element: HTMLElement;
  row: number;
  col: number;
  isValid: boolean;
}

// ================================
// Touch Drag Manager
// ================================

export class TouchDragManager {
  private static instance: TouchDragManager | null = null;
  private dragState: TouchDragState = {
    isDragging: false,
    startPosition: null,
    currentPosition: null,
    draggedTile: null,
    dragThreshold: 10,
    previewElement: null,
  };

  private dropTargets: Map<string, TouchDropTarget> = new Map();
  private activeDropTarget: TouchDropTarget | null = null;
  private callbacks: Map<string, (state: TouchDragState) => void> = new Map();

  static getInstance(): TouchDragManager {
    if (!this.instance) {
      this.instance = new TouchDragManager();
    }
    return this.instance;
  }

  // ================================
  // Touch Event Handlers
  // ================================

  handleTouchStart(e: TouchEvent, tile: Tile, _: HTMLElement): void { // eslint-disable-line @typescript-eslint/no-unused-vars
    if (!TouchSupportDetector.isTouchDevice()) return;

    const touch = e.touches[0];
    if (!touch) return;

    this.dragState = {
      ...this.dragState,
      startPosition: {
        x: touch.pageX,
        y: touch.pageY,
        clientX: touch.clientX,
        clientY: touch.clientY,
      },
      draggedTile: tile,
    };

    // Prevent default to stop scrolling
    e.preventDefault();

    // Add haptic feedback if supported
    this.triggerHapticFeedback('start');
  }

  handleTouchMove(e: TouchEvent): void {
    if (!this.dragState.startPosition || !this.dragState.draggedTile) return;

    const touch = e.touches[0];
    if (!touch) return;

    const currentPosition: TouchPosition = {
      x: touch.pageX,
      y: touch.pageY,
      clientX: touch.clientX,
      clientY: touch.clientY,
    };

    this.dragState.currentPosition = currentPosition;

    // Check if we've moved enough to start dragging
    if (!this.dragState.isDragging) {
      const deltaX = Math.abs(currentPosition.x - this.dragState.startPosition.x);
      const deltaY = Math.abs(currentPosition.y - this.dragState.startPosition.y);
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      if (distance > this.dragState.dragThreshold) {
        this.startDrag();
      }
    }

    if (this.dragState.isDragging) {
      this.updateDragPreview(currentPosition);
      this.updateDropTarget(currentPosition);
    }

    e.preventDefault();
  }

  handleTouchEnd(_: TouchEvent): void { // eslint-disable-line @typescript-eslint/no-unused-vars
    if (this.dragState.isDragging && this.activeDropTarget?.isValid) {
      this.executeDrop();
      this.triggerHapticFeedback('success');
    } else if (this.dragState.isDragging) {
      this.triggerHapticFeedback('error');
    }

    this.endDrag();
  }

  // ================================
  // Drag State Management
  // ================================

  private startDrag(): void {
    this.dragState.isDragging = true;
    this.createDragPreview();
    DragStateManager.startDrag({
      type: 'tile',
      tile: this.dragState.draggedTile!,
      sourceRack: true,
    });
    // Defer callback notifications to avoid React setState during render
    setTimeout(() => this.notifyCallbacks(), 0);
  }

  private endDrag(): void {
    this.cleanupDragPreview();
    this.clearActiveDropTarget();
    
    this.dragState = {
      isDragging: false,
      startPosition: null,
      currentPosition: null,
      draggedTile: null,
      dragThreshold: 10,
      previewElement: null,
    };

    DragStateManager.endDrag();
    // Defer callback notifications to avoid React setState during render
    setTimeout(() => this.notifyCallbacks(), 0);
  }

  // ================================
  // Drag Preview Management
  // ================================

  private createDragPreview(): void {
    if (!this.dragState.draggedTile || !this.dragState.startPosition) return;

    // Create a preview element
    const preview = document.createElement('div');
    preview.style.position = 'fixed';
    preview.style.pointerEvents = 'none';
    preview.style.zIndex = '10000';
    preview.style.transform = 'translate(-50%, -50%) rotate(-5deg) scale(1.1)';
    preview.style.opacity = '0.9';
    preview.style.filter = 'drop-shadow(0 8px 16px rgba(0,0,0,0.3))';
    preview.style.transition = 'none';
    
    // Style as a tile
    preview.className = 'w-16 h-16 bg-amber-100 border-2 border-amber-200 rounded-lg shadow-lg font-bold flex flex-col items-center justify-center text-gray-800';
    
    // Add content
    const letter = document.createElement('span');
    letter.textContent = this.dragState.draggedTile.letter || '?';
    letter.className = 'text-base';
    preview.appendChild(letter);

    if (!this.dragState.draggedTile.isBlank) {
      const points = document.createElement('span');
      points.textContent = this.dragState.draggedTile.points.toString();
      points.className = 'text-xs absolute bottom-1 right-1';
      preview.appendChild(points);
    }

    // Position at touch point
    preview.style.left = `${this.dragState.startPosition.clientX}px`;
    preview.style.top = `${this.dragState.startPosition.clientY}px`;

    document.body.appendChild(preview);
    this.dragState.previewElement = preview;
  }

  private updateDragPreview(position: TouchPosition): void {
    if (!this.dragState.previewElement) return;

    this.dragState.previewElement.style.left = `${position.clientX}px`;
    this.dragState.previewElement.style.top = `${position.clientY}px`;
  }

  private cleanupDragPreview(): void {
    if (this.dragState.previewElement) {
      document.body.removeChild(this.dragState.previewElement);
      this.dragState.previewElement = null;
    }
  }

  // ================================
  // Drop Target Management
  // ================================

  registerDropTarget(id: string, element: HTMLElement, row: number, col: number): void {
    this.dropTargets.set(id, {
      element,
      row,
      col,
      isValid: true,
    });
  }

  unregisterDropTarget(id: string): void {
    this.dropTargets.delete(id);
  }

  private updateDropTarget(position: TouchPosition): void {
    const elementAtPoint = document.elementFromPoint(position.clientX, position.clientY);
    
    // Clear previous target
    if (this.activeDropTarget) {
      this.clearDropTargetHighlight(this.activeDropTarget);
      this.activeDropTarget = null;
    }

    // Find matching drop target
    for (const [, target] of this.dropTargets) {
      if (target.element.contains(elementAtPoint)) {
        this.activeDropTarget = target;
        this.highlightDropTarget(target);
        break;
      }
    }
  }

  private highlightDropTarget(target: TouchDropTarget): void {
    if (target.isValid) {
      target.element.style.backgroundColor = '#dcfce7'; // green-50
      target.element.style.borderColor = '#22c55e'; // green-500
      target.element.style.transform = 'scale(1.05)';
    } else {
      target.element.style.backgroundColor = '#fef2f2'; // red-50
      target.element.style.borderColor = '#ef4444'; // red-500
    }
  }

  private clearDropTargetHighlight(target: TouchDropTarget): void {
    target.element.style.backgroundColor = '';
    target.element.style.borderColor = '';
    target.element.style.transform = '';
  }

  private clearActiveDropTarget(): void {
    if (this.activeDropTarget) {
      this.clearDropTargetHighlight(this.activeDropTarget);
      this.activeDropTarget = null;
    }
  }

  // ================================
  // Drop Execution
  // ================================

  private executeDrop(): void {
    if (!this.activeDropTarget || !this.dragState.draggedTile) return;

    // Create a custom event to trigger the drop
    const dropEvent = new CustomEvent('touchdrop', {
      detail: {
        tile: this.dragState.draggedTile,
        row: this.activeDropTarget.row,
        col: this.activeDropTarget.col,
      },
    });

    this.activeDropTarget.element.dispatchEvent(dropEvent);
  }

  // ================================
  // Haptic Feedback
  // ================================

  private triggerHapticFeedback(type: 'start' | 'success' | 'error'): void {
    if (!('vibrate' in navigator)) return;

    const patterns = {
      start: [10],
      success: [10, 50, 10],
      error: [100],
    };

    try {
      navigator.vibrate(patterns[type]);
    } catch {
      // Haptic feedback not supported or failed
    }
  }

  // ================================
  // State Callbacks
  // ================================

  onStateChange(id: string, callback: (state: TouchDragState) => void): void {
    this.callbacks.set(id, callback);
  }

  removeStateListener(id: string): void {
    this.callbacks.delete(id);
  }

  private notifyCallbacks(): void {
    this.callbacks.forEach(callback => {
      try {
        callback({ ...this.dragState });
      } catch (error) {
        console.warn('Touch drag state callback error:', error);
      }
    });
  }

  // ================================
  // Public State Access
  // ================================

  isDragging(): boolean {
    return this.dragState.isDragging;
  }

  getDraggedTile(): Tile | null {
    return this.dragState.draggedTile;
  }

  getState(): TouchDragState {
    return { ...this.dragState };
  }
}

// ================================
// Touch Enhancement Hooks
// ================================

export const useTouchDrag = () => {
  const touchManager = TouchDragManager.getInstance();
  const [isDragging, setIsDragging] = React.useState(false);

  React.useEffect(() => {
    const handleStateChange = (state: TouchDragState) => {
      setIsDragging(state.isDragging);
    };

    const id = `touch-hook-${Math.random()}`;
    touchManager.onStateChange(id, handleStateChange);

    return () => {
      touchManager.removeStateListener(id);
    };
  }, [touchManager]);

  return {
    isDragging,
    startTouchDrag: touchManager.handleTouchStart.bind(touchManager),
    registerDropTarget: touchManager.registerDropTarget.bind(touchManager),
    unregisterDropTarget: touchManager.unregisterDropTarget.bind(touchManager),
  };
};

// ================================
// Export
// ================================

export const touchDragAndDropUtils = {
  TouchDragManager,
  useTouchDrag,
};

export default touchDragAndDropUtils;