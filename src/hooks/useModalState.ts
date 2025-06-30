import { useState, useCallback, useRef, useEffect } from 'react';

// ================================
// Modal Types
// ================================

export interface ModalConfig {
  id: string;
  type: 'modal' | 'dialog' | 'overlay' | 'popup' | 'tooltip';
  content?: React.ReactNode;
  title?: string;
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  closable?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  persistent?: boolean;
  zIndex?: number;
  animation?: 'fade' | 'slide' | 'scale' | 'none';
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  data?: any;
}

export interface ModalState {
  isOpen: boolean;
  config: ModalConfig;
  openTime: number | null;
  data?: any;
}

export interface ModalStackItem {
  id: string;
  state: ModalState;
  onClose?: (result?: any) => void;
  onConfirm?: (result?: any) => void;
}

// ================================
// Hook Configuration
// ================================

export interface ModalManagerConfig {
  maxStackSize: number;
  defaultCloseOnOverlayClick: boolean;
  defaultCloseOnEscape: boolean;
  defaultAnimation: 'fade' | 'slide' | 'scale' | 'none';
  defaultZIndex: number;
  enableKeyboardNavigation: boolean;
  autoFocus: boolean;
  restoreFocus: boolean;
}

export const DEFAULT_MODAL_CONFIG: ModalManagerConfig = {
  maxStackSize: 5,
  defaultCloseOnOverlayClick: true,
  defaultCloseOnEscape: true,
  defaultAnimation: 'fade',
  defaultZIndex: 1000,
  enableKeyboardNavigation: true,
  autoFocus: true,
  restoreFocus: true
};

// ================================
// Hook Interface
// ================================

export interface ModalStateHook {
  // Modal Stack State
  modalStack: ModalStackItem[];
  activeModal: ModalStackItem | null;
  isAnyModalOpen: boolean;
  
  // Modal Management
  openModal: (config: Partial<ModalConfig> & { id: string }) => Promise<any>;
  closeModal: (modalId?: string, result?: any) => void;
  closeAllModals: () => void;
  updateModal: (modalId: string, updates: Partial<ModalConfig>) => void;
  
  // Modal State Queries
  isModalOpen: (modalId: string) => boolean;
  getModal: (modalId: string) => ModalStackItem | undefined;
  getModalData: (modalId: string) => any;
  
  // Predefined Modal Types
  showAlert: (message: string, title?: string) => Promise<void>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
  showPrompt: (message: string, defaultValue?: string, title?: string) => Promise<string | null>;
  showCustom: (content: React.ReactNode, config?: Partial<ModalConfig>) => Promise<any>;
  
  // Focus Management
  trapFocus: (modalId: string) => void;
  restoreFocus: () => void;
  
  // Utility Functions
  getModalProps: (modalId: string) => {
    isOpen: boolean;
    onClose: () => void;
    config: ModalConfig;
    data?: any;
  };
}

// ================================
// Modal State Hook
// ================================

export function useModalState(
  config: Partial<ModalManagerConfig> = {}
): ModalStateHook {
  
  const fullConfig = { ...DEFAULT_MODAL_CONFIG, ...config };
  
  // ================================
  // State Management
  // ================================
  
  const [modalStack, setModalStack] = useState<ModalStackItem[]>([]);
  
  // Focus management
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const resolvers = useRef<Map<string, { resolve: (value: any) => void; reject: (error: any) => void }>>(new Map());
  
  // ================================
  // Computed Values
  // ================================
  
  const activeModal = modalStack.length > 0 ? modalStack[modalStack.length - 1] : null;
  const isAnyModalOpen = modalStack.length > 0;
  
  // ================================
  // Modal Management
  // ================================
  
  const openModal = useCallback((modalConfig: Partial<ModalConfig> & { id: string }): Promise<any> => {
    return new Promise((resolve, reject) => {
      const config: ModalConfig = {
        type: 'modal',
        size: 'medium',
        closable: true,
        closeOnOverlayClick: fullConfig.defaultCloseOnOverlayClick,
        closeOnEscape: fullConfig.defaultCloseOnEscape,
        persistent: false,
        zIndex: fullConfig.defaultZIndex + modalStack.length,
        animation: fullConfig.defaultAnimation,
        position: 'center',
        ...modalConfig
      };
      
      const modalState: ModalState = {
        isOpen: true,
        config,
        openTime: Date.now(),
        data: modalConfig.data
      };
      
      const stackItem: ModalStackItem = {
        id: config.id,
        state: modalState,
        onClose: (result) => {
          closeModal(config.id, result);
          resolve(result);
        },
        onConfirm: (result) => {
          closeModal(config.id, result);
          resolve(result);
        }
      };
      
      // Store resolver for manual close handling
      resolvers.current.set(config.id, { resolve, reject });
      
      setModalStack(prev => {
        // Check if modal already exists
        const existingIndex = prev.findIndex(item => item.id === config.id);
        if (existingIndex !== -1) {
          // Update existing modal
          const newStack = [...prev];
          newStack[existingIndex] = stackItem;
          return newStack;
        }
        
        // Add new modal
        const newStack = [...prev, stackItem];
        
        // Enforce max stack size
        if (newStack.length > fullConfig.maxStackSize) {
          // Close oldest modal
          const oldestModal = newStack.shift();
          if (oldestModal) {
            const resolver = resolvers.current.get(oldestModal.id);
            if (resolver) {
              resolver.resolve(null);
              resolvers.current.delete(oldestModal.id);
            }
          }
        }
        
        return newStack;
      });
      
      // Store previous focus for restoration
      if (fullConfig.restoreFocus && modalStack.length === 0) {
        previousActiveElement.current = document.activeElement as HTMLElement;
      }
    });
  }, [fullConfig, modalStack.length]);
  
  const closeModal = useCallback((modalId?: string, result?: any) => {
    const targetId = modalId || activeModal?.id;
    if (!targetId) return;
    
    setModalStack(prev => {
      const filteredStack = prev.filter(item => item.id !== targetId);
      
      // Restore focus if this was the last modal
      if (filteredStack.length === 0 && fullConfig.restoreFocus && previousActiveElement.current) {
        setTimeout(() => {
          previousActiveElement.current?.focus();
          previousActiveElement.current = null;
        }, 100);
      }
      
      return filteredStack;
    });
    
    // Resolve promise
    const resolver = resolvers.current.get(targetId);
    if (resolver) {
      resolver.resolve(result);
      resolvers.current.delete(targetId);
    }
  }, [activeModal, fullConfig.restoreFocus]);
  
  const closeAllModals = useCallback(() => {
    modalStack.forEach(item => {
      const resolver = resolvers.current.get(item.id);
      if (resolver) {
        resolver.resolve(null);
        resolvers.current.delete(item.id);
      }
    });
    
    setModalStack([]);
    
    // Restore focus
    if (fullConfig.restoreFocus && previousActiveElement.current) {
      setTimeout(() => {
        previousActiveElement.current?.focus();
        previousActiveElement.current = null;
      }, 100);
    }
  }, [modalStack, fullConfig.restoreFocus]);
  
  const updateModal = useCallback((modalId: string, updates: Partial<ModalConfig>) => {
    setModalStack(prev => 
      prev.map(item => 
        item.id === modalId 
          ? {
              ...item,
              state: {
                ...item.state,
                config: { ...item.state.config, ...updates }
              }
            }
          : item
      )
    );
  }, []);
  
  // ================================
  // Modal State Queries
  // ================================
  
  const isModalOpen = useCallback((modalId: string): boolean => {
    return modalStack.some(item => item.id === modalId);
  }, [modalStack]);
  
  const getModal = useCallback((modalId: string): ModalStackItem | undefined => {
    return modalStack.find(item => item.id === modalId);
  }, [modalStack]);
  
  const getModalData = useCallback((modalId: string): any => {
    const modal = getModal(modalId);
    return modal?.state.data;
  }, [getModal]);
  
  // ================================
  // Predefined Modal Types
  // ================================
  
  const showAlert = useCallback(async (message: string, title = 'Alert'): Promise<void> => {
    return await openModal({
      id: `alert-${Date.now()}`,
      type: 'dialog',
      title,
      content: message,
      size: 'small',
      data: { type: 'alert', message, title }
    });
  }, [openModal]);
  
  const showConfirm = useCallback(async (message: string, title = 'Confirm'): Promise<boolean> => {
    const result = await openModal({
      id: `confirm-${Date.now()}`,
      type: 'dialog',
      title,
      content: message,
      size: 'small',
      data: { type: 'confirm', message, title }
    });
    return Boolean(result);
  }, [openModal]);
  
  const showPrompt = useCallback(async (
    message: string, 
    defaultValue = '', 
    title = 'Input'
  ): Promise<string | null> => {
    const result = await openModal({
      id: `prompt-${Date.now()}`,
      type: 'dialog',
      title,
      content: message,
      size: 'small',
      data: { type: 'prompt', message, defaultValue, title }
    });
    return result || null;
  }, [openModal]);
  
  const showCustom = useCallback(async (
    content: React.ReactNode, 
    modalConfig: Partial<ModalConfig> = {}
  ): Promise<any> => {
    return await openModal({
      id: `custom-${Date.now()}`,
      content,
      ...modalConfig
    });
  }, [openModal]);
  
  // ================================
  // Focus Management
  // ================================
  
  const trapFocus = useCallback((modalId: string) => {
    const modal = getModal(modalId);
    if (!modal || !fullConfig.autoFocus) return;
    
    // Find modal element and focus first focusable element
    setTimeout(() => {
      const modalElement = document.querySelector(`[data-modal-id="${modalId}"]`);
      if (modalElement) {
        const focusableElements = modalElement.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstFocusable = focusableElements[0] as HTMLElement;
        if (firstFocusable) {
          firstFocusable.focus();
        }
      }
    }, 50);
  }, [getModal, fullConfig.autoFocus]);
  
  const restoreFocus = useCallback(() => {
    if (fullConfig.restoreFocus && previousActiveElement.current) {
      previousActiveElement.current.focus();
      previousActiveElement.current = null;
    }
  }, [fullConfig.restoreFocus]);
  
  // ================================
  // Utility Functions
  // ================================
  
  const getModalProps = useCallback((modalId: string) => {
    const modal = getModal(modalId);
    
    return {
      isOpen: Boolean(modal?.state.isOpen),
      onClose: () => closeModal(modalId),
      config: modal?.state.config || {} as ModalConfig,
      data: modal?.state.data
    };
  }, [getModal, closeModal]);
  
  // ================================
  // Keyboard Event Handling
  // ================================
  
  useEffect(() => {
    if (!fullConfig.enableKeyboardNavigation) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!activeModal) return;
      
      const config = activeModal.state.config;
      
      // Handle Escape key
      if (event.key === 'Escape' && config.closeOnEscape) {
        event.preventDefault();
        closeModal(activeModal.id);
      }
      
      // Handle Tab key for focus trapping
      if (event.key === 'Tab') {
        const modalElement = document.querySelector(`[data-modal-id="${activeModal.id}"]`);
        if (modalElement) {
          const focusableElements = Array.from(modalElement.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )) as HTMLElement[];
          
          if (focusableElements.length === 0) return;
          
          const firstFocusable = focusableElements[0];
          const lastFocusable = focusableElements[focusableElements.length - 1];
          
          if (event.shiftKey) {
            // Shift+Tab: move to previous element
            if (document.activeElement === firstFocusable) {
              event.preventDefault();
              lastFocusable.focus();
            }
          } else {
            // Tab: move to next element
            if (document.activeElement === lastFocusable) {
              event.preventDefault();
              firstFocusable.focus();
            }
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [activeModal, fullConfig.enableKeyboardNavigation, closeModal]);
  
  // ================================
  // Focus on Active Modal Change
  // ================================
  
  useEffect(() => {
    if (activeModal && fullConfig.autoFocus) {
      trapFocus(activeModal.id);
    }
  }, [activeModal, trapFocus, fullConfig.autoFocus]);
  
  // ================================
  // Cleanup
  // ================================
  
  useEffect(() => {
    return () => {
      // Resolve any pending promises
      resolvers.current.forEach(({ resolve }) => resolve(null));
      resolvers.current.clear();
    };
  }, []);
  
  // ================================
  // Return Hook Interface
  // ================================
  
  return {
    modalStack,
    activeModal,
    isAnyModalOpen,
    openModal,
    closeModal,
    closeAllModals,
    updateModal,
    isModalOpen,
    getModal,
    getModalData,
    showAlert,
    showConfirm,
    showPrompt,
    showCustom,
    trapFocus,
    restoreFocus,
    getModalProps,
  };
}

export default useModalState; 