import { useState, useCallback, useRef, useEffect } from 'react';
import type { BoardPosition } from '../types/game';

// ================================
// Drag & Drop Types
// ================================

export interface DragItem {
  id: string;
  type: 'tile' | 'piece';
  data: any;
  sourceElement?: HTMLElement;
  sourcePosition?: BoardPosition;
}

export interface DropZone {
  id: string;
  type: string;
  accepts: string[];
  position?: BoardPosition;
  element?: HTMLElement;
}

export interface DragState {
  isDragging: boolean;
  dragItem: DragItem | null;
  dragPosition: { x: number; y: number } | null;
  dragOffset: { x: number; y: number } | null;
  hoveredDropZone: DropZone | null;
  canDrop: boolean;
}

export interface TouchState {
  isTouching: boolean;
  touchStart: { x: number; y: number } | null;
  touchCurrent: { x: number; y: number } | null;
  isDragThresholdMet: boolean;
}

// ================================
// Hook Interface
// ================================

export interface DragAndDropHook {
  // Drag State
  dragState: DragState;
  touchState: TouchState;
  
  // Drag Actions
  startDrag: (item: DragItem, event: React.MouseEvent | React.DragEvent) => void;
  updateDragPosition: (x: number, y: number) => void;
  endDrag: (dropZone?: DropZone) => void;
  cancelDrag: () => void;
  
  // Drop Zone Management
  registerDropZone: (dropZone: DropZone) => void;
  unregisterDropZone: (dropZoneId: string) => void;
  setHoveredDropZone: (dropZone: DropZone | null) => void;
  
  // Touch Support
  handleTouchStart: (item: DragItem, event: React.TouchEvent) => void;
  handleTouchMove: (event: React.TouchEvent) => void;
  handleTouchEnd: (event: React.TouchEvent) => void;
  
  // Utilities
  getDragPreviewStyle: () => React.CSSProperties;
  getDropZoneStyle: (dropZoneId: string) => React.CSSProperties;
  isValidDrop: (item: DragItem, dropZone: DropZone) => boolean;
}

// ================================
// Configuration
// ================================

export interface DragDropConfig {
  dragThreshold: number;
  touchDragThreshold: number;
  snapToGrid: boolean;
  gridSize: number;
  enableTouch: boolean;
  enableMouse: boolean;
  dragPreviewOffset: { x: number; y: number };
}

export const DEFAULT_DRAG_DROP_CONFIG: DragDropConfig = {
  dragThreshold: 5,
  touchDragThreshold: 10,
  snapToGrid: false,
  gridSize: 40,
  enableTouch: true,
  enableMouse: true,
  dragPreviewOffset: { x: 10, y: 10 }
};

// ================================
// Drag & Drop Hook
// ================================

export function useDragAndDrop(
  config: Partial<DragDropConfig> = {},
  onDrop?: (item: DragItem, dropZone: DropZone | null) => void
): DragAndDropHook {
  
  const fullConfig = { ...DEFAULT_DRAG_DROP_CONFIG, ...config };
  
  // ================================
  // State Management
  // ================================
  
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    dragItem: null,
    dragPosition: null,
    dragOffset: null,
    hoveredDropZone: null,
    canDrop: false
  });
  
  const [touchState, setTouchState] = useState<TouchState>({
    isTouching: false,
    touchStart: null,
    touchCurrent: null,
    isDragThresholdMet: false
  });
  
  // Store drop zones
  const dropZones = useRef<Map<string, DropZone>>(new Map());
  
  // ================================
  // Drag Actions
  // ================================
  
  const startDrag = useCallback((item: DragItem, _event: React.MouseEvent | React.DragEvent) => {
    if (!fullConfig.enableMouse) return;
    
    const rect = (_event.target as HTMLElement).getBoundingClientRect();
    const offset = {
      x: _event.clientX - rect.left,
      y: _event.clientY - rect.top
    };
    
    setDragState({
      isDragging: true,
      dragItem: item,
      dragPosition: { x: _event.clientX, y: _event.clientY },
      dragOffset: offset,
      hoveredDropZone: null,
      canDrop: false
    });
    
    // Prevent default drag behavior
    if ('dataTransfer' in _event) {
      _event.dataTransfer.effectAllowed = 'move';
      _event.dataTransfer.setData('text/plain', item.id);
    }
  }, [fullConfig.enableMouse]);
  
  const updateDragPosition = useCallback((x: number, y: number) => {
    setDragState(prev => ({
      ...prev,
      dragPosition: { x, y }
    }));
    
    // Check for hovered drop zones
    const elementUnder = document.elementFromPoint(x, y);
    let hoveredDropZone: DropZone | null = null;
    
    if (elementUnder) {
      for (const [, dropZone] of dropZones.current) {
        if (dropZone.element && dropZone.element.contains(elementUnder)) {
          hoveredDropZone = dropZone;
          break;
        }
      }
    }
    
    setDragState(prev => ({
      ...prev,
      hoveredDropZone,
      canDrop: hoveredDropZone ? isValidDrop(prev.dragItem!, hoveredDropZone) : false
    }));
  }, []);
  
  const endDrag = useCallback((dropZone?: DropZone) => {
    const finalDropZone = dropZone || dragState.hoveredDropZone;
    
    if (dragState.dragItem && onDrop) {
      onDrop(dragState.dragItem, finalDropZone);
    }
    
    setDragState({
      isDragging: false,
      dragItem: null,
      dragPosition: null,
      dragOffset: null,
      hoveredDropZone: null,
      canDrop: false
    });
    
    setTouchState({
      isTouching: false,
      touchStart: null,
      touchCurrent: null,
      isDragThresholdMet: false
    });
  }, [dragState.dragItem, dragState.hoveredDropZone, onDrop]);
  
  const cancelDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      dragItem: null,
      dragPosition: null,
      dragOffset: null,
      hoveredDropZone: null,
      canDrop: false
    });
    
    setTouchState({
      isTouching: false,
      touchStart: null,
      touchCurrent: null,
      isDragThresholdMet: false
    });
  }, []);
  
  // ================================
  // Drop Zone Management
  // ================================
  
  const registerDropZone = useCallback((dropZone: DropZone) => {
    dropZones.current.set(dropZone.id, dropZone);
  }, []);
  
  const unregisterDropZone = useCallback((dropZoneId: string) => {
    dropZones.current.delete(dropZoneId);
  }, []);
  
  const setHoveredDropZone = useCallback((dropZone: DropZone | null) => {
    setDragState(prev => ({
      ...prev,
      hoveredDropZone: dropZone,
      canDrop: dropZone && prev.dragItem ? isValidDrop(prev.dragItem, dropZone) : false
    }));
  }, []);
  
  // ================================
  // Touch Support
  // ================================
  
  const handleTouchStart = useCallback((item: DragItem, event: React.TouchEvent) => {
    if (!fullConfig.enableTouch) return;
    
    const touch = event.touches[0];
    const touchStart = { x: touch.clientX, y: touch.clientY };
    
    setTouchState({
      isTouching: true,
      touchStart,
      touchCurrent: touchStart,
      isDragThresholdMet: false
    });
    
    // Store the potential drag item
    setDragState(prev => ({
      ...prev,
      dragItem: item
    }));
  }, [fullConfig.enableTouch]);
  
  const handleTouchMove = useCallback((event: React.TouchEvent) => {
    if (!touchState.isTouching || !touchState.touchStart) return;
    
    const touch = event.touches[0];
    const touchCurrent = { x: touch.clientX, y: touch.clientY };
    
    const distance = Math.sqrt(
      Math.pow(touchCurrent.x - touchState.touchStart.x, 2) +
      Math.pow(touchCurrent.y - touchState.touchStart.y, 2)
    );
    
    const isDragThresholdMet = distance > fullConfig.touchDragThreshold;
    
    setTouchState(prev => ({
      ...prev,
      touchCurrent,
      isDragThresholdMet
    }));
    
    if (isDragThresholdMet && !dragState.isDragging) {
      // Start dragging
      setDragState(prev => ({
        ...prev,
        isDragging: true,
        dragPosition: touchCurrent,
        dragOffset: { x: 0, y: 0 }
      }));
    } else if (dragState.isDragging) {
      updateDragPosition(touchCurrent.x, touchCurrent.y);
    }
    
    // Prevent scrolling during drag
    if (isDragThresholdMet) {
      event.preventDefault();
    }
  }, [touchState, dragState.isDragging, fullConfig.touchDragThreshold, updateDragPosition]);
  
  const handleTouchEnd = useCallback(() => {
    if (dragState.isDragging) {
      endDrag();
    } else {
      cancelDrag();
    }
  }, [dragState.isDragging, endDrag, cancelDrag]);
  
  // ================================
  // Utilities
  // ================================
  
  const getDragPreviewStyle = useCallback((): React.CSSProperties => {
    if (!dragState.isDragging || !dragState.dragPosition) {
      return { display: 'none' };
    }
    
    return {
      position: 'fixed',
      left: dragState.dragPosition.x + fullConfig.dragPreviewOffset.x,
      top: dragState.dragPosition.y + fullConfig.dragPreviewOffset.y,
      pointerEvents: 'none',
      zIndex: 1000,
      transform: 'translate(-50%, -50%)',
    };
  }, [dragState.isDragging, dragState.dragPosition, fullConfig.dragPreviewOffset]);
  
  const getDropZoneStyle = useCallback((dropZoneId: string): React.CSSProperties => {
    const isHovered = dragState.hoveredDropZone?.id === dropZoneId;
    const canDrop = isHovered && dragState.canDrop;
    
    return {
      backgroundColor: isHovered ? (canDrop ? 'rgba(0, 255, 0, 0.2)' : 'rgba(255, 0, 0, 0.2)') : 'transparent',
      border: isHovered ? (canDrop ? '2px solid green' : '2px solid red') : 'none',
      transition: 'all 0.2s ease-in-out'
    };
  }, [dragState.hoveredDropZone, dragState.canDrop]);
  
  const isValidDrop = useCallback((item: DragItem, dropZone: DropZone): boolean => {
    return dropZone.accepts.includes(item.type);
  }, []);
  
  // ================================
  // Event Cleanup
  // ================================
  
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (dragState.isDragging) {
        updateDragPosition(event.clientX, event.clientY);
      }
    };
    
    const handleMouseUp = () => {
      if (dragState.isDragging) {
        endDrag();
      }
    };
    
    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState.isDragging, updateDragPosition, endDrag]);
  
  // ================================
  // Return Hook Interface
  // ================================
  
  return {
    dragState,
    touchState,
    startDrag,
    updateDragPosition,
    endDrag,
    cancelDrag,
    registerDropZone,
    unregisterDropZone,
    setHoveredDropZone,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    getDragPreviewStyle,
    getDropZoneStyle,
    isValidDrop,
  };
}

export default useDragAndDrop; 