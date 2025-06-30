import { useState, useCallback, useRef, useEffect } from 'react';

// ================================
// UI Interaction Types
// ================================

export interface InteractionState {
  hoveredElements: Set<string>;
  selectedElements: Set<string>;
  focusedElement: string | null;
  activeElement: string | null;
  pressedElements: Set<string>;
}

export interface InteractionCallbacks {
  onHover?: (elementId: string, isHovered: boolean) => void;
  onSelect?: (elementId: string, isSelected: boolean) => void;
  onFocus?: (elementId: string | null) => void;
  onActivate?: (elementId: string | null) => void;
  onPress?: (elementId: string, isPressed: boolean) => void;
}

export interface MultiSelectOptions {
  enabled: boolean;
  clearOnEscape: boolean;
  maxSelections?: number;
}

export interface HoverOptions {
  hoverDelay: number;
  unhoverDelay: number;
  disabled: boolean;
}

export interface SelectionMode {
  type: 'single' | 'multiple' | 'none';
  toggleOnReselect: boolean;
  clearOnClickOutside: boolean;
}

// ================================
// Hook Configuration
// ================================

export interface UIInteractionConfig {
  multiSelect: MultiSelectOptions;
  hover: HoverOptions;
  selection: SelectionMode;
  enableKeyboardNavigation: boolean;
  enableFocusManagement: boolean;
  enableTouchInteractions: boolean;
}

export const DEFAULT_UI_INTERACTION_CONFIG: UIInteractionConfig = {
  multiSelect: {
    enabled: true,
    clearOnEscape: true,
    maxSelections: undefined
  },
  hover: {
    hoverDelay: 100,
    unhoverDelay: 200,
    disabled: false
  },
  selection: {
    type: 'multiple',
    toggleOnReselect: true,
    clearOnClickOutside: true
  },
  enableKeyboardNavigation: true,
  enableFocusManagement: true,
  enableTouchInteractions: true
};

// ================================
// Hook Interface
// ================================

export interface UIInteractionHook {
  // State
  state: InteractionState;
  
  // Hover Management
  setHovered: (elementId: string, isHovered: boolean) => void;
  isHovered: (elementId: string) => boolean;
  clearAllHovered: () => void;
  
  // Selection Management
  setSelected: (elementId: string, isSelected: boolean) => void;
  toggleSelected: (elementId: string) => void;
  isSelected: (elementId: string) => boolean;
  selectAll: (elementIds: string[]) => void;
  clearSelection: () => void;
  getSelectedElements: () => string[];
  
  // Focus Management
  setFocused: (elementId: string | null) => void;
  isFocused: (elementId: string) => boolean;
  
  // Active State Management
  setActive: (elementId: string | null) => void;
  isActive: (elementId: string) => boolean;
  
  // Press State Management
  setPressed: (elementId: string, isPressed: boolean) => void;
  isPressed: (elementId: string) => boolean;
  
  // Keyboard Navigation
  handleKeyDown: (event: React.KeyboardEvent) => void;
  navigateNext: () => void;
  navigatePrevious: () => void;
  
  // Utility Functions
  getInteractionProps: (elementId: string) => React.HTMLAttributes<HTMLElement> & Record<string, any>;
  resetAllStates: () => void;
}

// ================================
// UI Interaction Hook
// ================================

export function useUIInteraction(
  elementIds: string[] = [],
  config: Partial<UIInteractionConfig> = {},
  callbacks: InteractionCallbacks = {}
): UIInteractionHook {
  
  const fullConfig = { ...DEFAULT_UI_INTERACTION_CONFIG, ...config };
  
  // ================================
  // State Management
  // ================================
  
  const [state, setState] = useState<InteractionState>({
    hoveredElements: new Set(),
    selectedElements: new Set(),
    focusedElement: null,
    activeElement: null,
    pressedElements: new Set()
  });
  
  // Store hover timers
  const hoverTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const navigableElements = useRef<string[]>(elementIds);
  
  // Update navigable elements when elementIds change
  useEffect(() => {
    navigableElements.current = elementIds;
  }, [elementIds]);
  
  // ================================
  // Hover Management
  // ================================
  
  const setHovered = useCallback((elementId: string, isHovered: boolean) => {
    if (fullConfig.hover.disabled) return;
    
    // Clear existing timer
    const existingTimer = hoverTimers.current.get(elementId);
    if (existingTimer) {
      clearTimeout(existingTimer);
      hoverTimers.current.delete(elementId);
    }
    
    const delay = isHovered ? fullConfig.hover.hoverDelay : fullConfig.hover.unhoverDelay;
    
    const timer = setTimeout(() => {
      setState(prev => {
        const newHovered = new Set(prev.hoveredElements);
        if (isHovered) {
          newHovered.add(elementId);
        } else {
          newHovered.delete(elementId);
        }
        
        return {
          ...prev,
          hoveredElements: newHovered
        };
      });
      
      // Call callback
      callbacks.onHover?.(elementId, isHovered);
      
      hoverTimers.current.delete(elementId);
    }, delay);
    
    hoverTimers.current.set(elementId, timer);
  }, [fullConfig.hover, callbacks.onHover]);
  
  const isHovered = useCallback((elementId: string): boolean => {
    return state.hoveredElements.has(elementId);
  }, [state.hoveredElements]);
  
  const clearAllHovered = useCallback(() => {
    // Clear all timers
    hoverTimers.current.forEach(timer => clearTimeout(timer));
    hoverTimers.current.clear();
    
    setState(prev => ({
      ...prev,
      hoveredElements: new Set()
    }));
  }, []);
  
  // ================================
  // Selection Management
  // ================================
  
  const setSelected = useCallback((elementId: string, isSelected: boolean) => {
    setState(prev => {
      const newSelected = new Set(prev.selectedElements);
      
      if (fullConfig.selection.type === 'none') {
        return prev;
      }
      
      if (fullConfig.selection.type === 'single') {
        if (isSelected) {
          newSelected.clear();
          newSelected.add(elementId);
        } else {
          newSelected.delete(elementId);
        }
      } else {
        // Multiple selection
        if (isSelected) {
          // Check max selections
          if (fullConfig.multiSelect.maxSelections && 
              newSelected.size >= fullConfig.multiSelect.maxSelections) {
            return prev;
          }
          newSelected.add(elementId);
        } else {
          newSelected.delete(elementId);
        }
      }
      
      // Call callback
      callbacks.onSelect?.(elementId, isSelected);
      
      return {
        ...prev,
        selectedElements: newSelected
      };
    });
  }, [fullConfig.selection, fullConfig.multiSelect, callbacks.onSelect]);
  
  const toggleSelected = useCallback((elementId: string) => {
    const currentlySelected = state.selectedElements.has(elementId);
    
    if (currentlySelected && !fullConfig.selection.toggleOnReselect) {
      return;
    }
    
    setSelected(elementId, !currentlySelected);
  }, [state.selectedElements, fullConfig.selection.toggleOnReselect, setSelected]);
  
  const isSelected = useCallback((elementId: string): boolean => {
    return state.selectedElements.has(elementId);
  }, [state.selectedElements]);
  
  const selectAll = useCallback((elementIds: string[]) => {
    if (fullConfig.selection.type !== 'multiple') return;
    
    setState(prev => {
      let newSelected = new Set(prev.selectedElements);
      
      elementIds.forEach(id => {
        if (!fullConfig.multiSelect.maxSelections || 
            newSelected.size < fullConfig.multiSelect.maxSelections) {
          newSelected.add(id);
        }
      });
      
      return {
        ...prev,
        selectedElements: newSelected
      };
    });
  }, [fullConfig.selection.type, fullConfig.multiSelect.maxSelections]);
  
  const clearSelection = useCallback(() => {
    setState(prev => ({
      ...prev,
      selectedElements: new Set()
    }));
  }, []);
  
  const getSelectedElements = useCallback((): string[] => {
    return Array.from(state.selectedElements);
  }, [state.selectedElements]);
  
  // ================================
  // Focus Management
  // ================================
  
  const setFocused = useCallback((elementId: string | null) => {
    setState(prev => ({
      ...prev,
      focusedElement: elementId
    }));
    
    callbacks.onFocus?.(elementId);
  }, [callbacks.onFocus]);
  
  const isFocused = useCallback((elementId: string): boolean => {
    return state.focusedElement === elementId;
  }, [state.focusedElement]);
  
  // ================================
  // Active State Management
  // ================================
  
  const setActive = useCallback((elementId: string | null) => {
    setState(prev => ({
      ...prev,
      activeElement: elementId
    }));
    
    callbacks.onActivate?.(elementId);
  }, [callbacks.onActivate]);
  
  const isActive = useCallback((elementId: string): boolean => {
    return state.activeElement === elementId;
  }, [state.activeElement]);
  
  // ================================
  // Press State Management
  // ================================
  
  const setPressed = useCallback((elementId: string, isPressed: boolean) => {
    setState(prev => {
      const newPressed = new Set(prev.pressedElements);
      if (isPressed) {
        newPressed.add(elementId);
      } else {
        newPressed.delete(elementId);
      }
      
      return {
        ...prev,
        pressedElements: newPressed
      };
    });
    
    callbacks.onPress?.(elementId, isPressed);
  }, [callbacks.onPress]);
  
  const isPressed = useCallback((elementId: string): boolean => {
    return state.pressedElements.has(elementId);
  }, [state.pressedElements]);
  
  // ================================
  // Keyboard Navigation
  // ================================
  
  const navigateNext = useCallback(() => {
    const elements = navigableElements.current;
    if (elements.length === 0) return;
    
    const currentIndex = state.focusedElement ? 
      elements.indexOf(state.focusedElement) : -1;
    const nextIndex = (currentIndex + 1) % elements.length;
    
    setFocused(elements[nextIndex]);
  }, [state.focusedElement, setFocused]);
  
  const navigatePrevious = useCallback(() => {
    const elements = navigableElements.current;
    if (elements.length === 0) return;
    
    const currentIndex = state.focusedElement ? 
      elements.indexOf(state.focusedElement) : -1;
    const previousIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1;
    
    setFocused(elements[previousIndex]);
  }, [state.focusedElement, setFocused]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (!fullConfig.enableKeyboardNavigation) return;
    
    switch (event.key) {
      case 'Escape':
        if (fullConfig.multiSelect.clearOnEscape) {
          clearSelection();
        }
        break;
      
      case 'ArrowDown':
      case 'ArrowRight':
        event.preventDefault();
        navigateNext();
        break;
      
      case 'ArrowUp':
      case 'ArrowLeft':
        event.preventDefault();
        navigatePrevious();
        break;
      
      case ' ':
      case 'Enter':
        event.preventDefault();
        if (state.focusedElement) {
          toggleSelected(state.focusedElement);
        }
        break;
      
      case 'a':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          selectAll(navigableElements.current);
        }
        break;
    }
  }, [fullConfig.enableKeyboardNavigation, fullConfig.multiSelect.clearOnEscape, 
      clearSelection, navigateNext, navigatePrevious, state.focusedElement, 
      toggleSelected, selectAll]);
  
  // ================================
  // Utility Functions
  // ================================
  
  const getInteractionProps = useCallback((elementId: string): React.HTMLAttributes<HTMLElement> & Record<string, any> => {
    return {
      onMouseEnter: () => setHovered(elementId, true),
      onMouseLeave: () => setHovered(elementId, false),
      onClick: () => toggleSelected(elementId),
      onFocus: () => setFocused(elementId),
      onBlur: () => state.focusedElement === elementId && setFocused(null),
      onMouseDown: () => setPressed(elementId, true),
      onMouseUp: () => setPressed(elementId, false),
      onTouchStart: fullConfig.enableTouchInteractions ? 
        () => setPressed(elementId, true) : undefined,
      onTouchEnd: fullConfig.enableTouchInteractions ? 
        () => setPressed(elementId, false) : undefined,
      tabIndex: fullConfig.enableKeyboardNavigation ? 0 : undefined,
      'data-selected': isSelected(elementId),
      'data-hovered': isHovered(elementId),
      'data-focused': isFocused(elementId),
      'data-active': isActive(elementId),
      'data-pressed': isPressed(elementId),
    };
  }, [setHovered, toggleSelected, setFocused, setPressed, state.focusedElement, 
      fullConfig.enableTouchInteractions, fullConfig.enableKeyboardNavigation,
      isSelected, isHovered, isFocused, isActive, isPressed]);
  
  const resetAllStates = useCallback(() => {
    // Clear all timers
    clearAllHovered();
    
    setState({
      hoveredElements: new Set(),
      selectedElements: new Set(),
      focusedElement: null,
      activeElement: null,
      pressedElements: new Set()
    });
  }, [clearAllHovered]);
  
  // ================================
  // Click Outside Handler
  // ================================
  
  useEffect(() => {
    if (!fullConfig.selection.clearOnClickOutside) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Check if click is on any of our managed elements
      const isOnManagedElement = navigableElements.current.some(elementId => {
        const element = document.querySelector(`[data-element-id="${elementId}"]`);
        return element && element.contains(target);
      });
      
      if (!isOnManagedElement) {
        clearSelection();
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [fullConfig.selection.clearOnClickOutside, clearSelection]);
  
  // ================================
  // Cleanup
  // ================================
  
  useEffect(() => {
    return () => {
      hoverTimers.current.forEach(timer => clearTimeout(timer));
      hoverTimers.current.clear();
    };
  }, []);
  
  // ================================
  // Return Hook Interface
  // ================================
  
  return {
    state,
    setHovered,
    isHovered,
    clearAllHovered,
    setSelected,
    toggleSelected,
    isSelected,
    selectAll,
    clearSelection,
    getSelectedElements,
    setFocused,
    isFocused,
    setActive,
    isActive,
    setPressed,
    isPressed,
    handleKeyDown,
    navigateNext,
    navigatePrevious,
    getInteractionProps,
    resetAllStates,
  };
}

export default useUIInteraction; 