import React from 'react';
import type { ReactNode } from 'react';

// ================================
// GameLayout Component Props
// ================================

export interface GameLayoutProps {
  header?: ReactNode;
  board: ReactNode;
  scoreBoard: ReactNode;
  tileRack: ReactNode;
  gameControls: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  variant?: 'desktop' | 'tablet' | 'mobile' | 'auto';
  theme?: 'light' | 'dark';
  compactMode?: boolean;
  showSidebar?: boolean;
  className?: string;
}

// ================================
// Layout Variants
// ================================

interface LayoutConfig {
  containerClass: string;
  mainGridClass: string;
  boardAreaClass: string;
  sideAreaClass: string;
  bottomAreaClass: string;
}

const layoutConfigs: Record<string, LayoutConfig> = {
  desktop: {
    containerClass: 'min-h-screen flex flex-col',
    mainGridClass: 'flex-1 grid grid-cols-12 gap-4 p-4',
    boardAreaClass: 'col-span-8 flex flex-col items-center gap-4',
    sideAreaClass: 'col-span-4 flex flex-col gap-4',
    bottomAreaClass: 'col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-4',
  },
  tablet: {
    containerClass: 'min-h-screen flex flex-col',
    mainGridClass: 'flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-3',
    boardAreaClass: 'lg:col-span-2 flex flex-col items-center gap-3',
    sideAreaClass: 'lg:col-span-1 flex flex-col gap-3 order-first lg:order-last',
    bottomAreaClass: 'col-span-full grid grid-cols-1 md:grid-cols-2 gap-3',
  },
  mobile: {
    containerClass: 'min-h-screen flex flex-col',
    mainGridClass: 'flex-1 flex flex-col gap-2 p-2',
    boardAreaClass: 'flex flex-col items-center gap-2 order-2',
    sideAreaClass: 'flex flex-col gap-2 order-1',
    bottomAreaClass: 'flex flex-col gap-2 order-3',
  },
  auto: {
    containerClass: 'min-h-screen flex flex-col',
    mainGridClass: 'flex-1 grid grid-cols-1 lg:grid-cols-12 gap-2 lg:gap-4 p-2 lg:p-4',
    boardAreaClass: 'lg:col-span-8 flex flex-col items-center gap-2 lg:gap-4 order-2 lg:order-1',
    sideAreaClass: 'lg:col-span-4 flex flex-col gap-2 lg:gap-4 order-1 lg:order-2',
    bottomAreaClass: 'lg:col-span-12 grid grid-cols-1 md:grid-cols-2 gap-2 lg:gap-4 order-3',
  },
};

// ================================
// Responsive Hook
// ================================

const useResponsiveLayout = (variant: string) => {
  const [screenSize, setScreenSize] = React.useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  React.useEffect(() => {
    if (variant !== 'auto') return;

    const checkScreenSize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [variant]);

  return variant === 'auto' ? screenSize : variant;
};

// ================================
// Main GameLayout Component
// ================================

export const GameLayout: React.FC<GameLayoutProps> = ({
  header,
  board,
  scoreBoard,
  tileRack,
  gameControls,
  sidebar,
  footer,
  variant = 'auto',
  theme = 'light',
  compactMode = false,
  showSidebar = true,
  className = '',
}) => {
  const activeLayout = useResponsiveLayout(variant);
  const config = layoutConfigs[activeLayout] || layoutConfigs.auto;

  // ================================
  // Theme Classes
  // ================================

  const themeClasses = {
    light: 'bg-gradient-to-br from-green-50 to-blue-50 text-gray-900',
    dark: 'bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100',
  };

  // ================================
  // Container Classes
  // ================================

  const containerClasses = `
    ${config.containerClass}
    ${themeClasses[theme]}
    ${compactMode ? 'text-sm' : ''}
    ${className}
  `;

  // ================================
  // Mobile Layout
  // ================================

  if (activeLayout === 'mobile') {
    return (
      <div className={containerClasses}>
        {/* Header */}
        {header && (
          <header className="flex-shrink-0">
            {header}
          </header>
        )}

        {/* Main Content */}
        <main className={config.mainGridClass}>
          {/* Score Board */}
          <div className={config.sideAreaClass}>
            <div className="w-full">
              {React.cloneElement(scoreBoard as React.ReactElement<any>, { 
                compact: compactMode 
              })}
            </div>
          </div>

          {/* Game Board */}
          <div className={config.boardAreaClass}>
            <div className="w-full max-w-sm mx-auto">
              {board}
            </div>
          </div>

          {/* Bottom Controls */}
          <div className={config.bottomAreaClass}>
            {/* Tile Rack */}
            <div className="w-full">
              {React.cloneElement(tileRack as React.ReactElement<any>, { 
                orientation: 'horizontal',
                compact: compactMode,
                size: compactMode ? 'small' : 'medium'
              })}
            </div>

            {/* Game Controls */}
            <div className="w-full">
              {React.cloneElement(gameControls as React.ReactElement<any>, { 
                compact: compactMode,
                orientation: 'horizontal'
              })}
            </div>
          </div>
        </main>

        {/* Footer */}
        {footer && (
          <footer className="flex-shrink-0">
            {footer}
          </footer>
        )}
      </div>
    );
  }

  // ================================
  // Desktop/Tablet Layout
  // ================================

  return (
    <div className={containerClasses}>
      {/* Header */}
      {header && (
        <header className="flex-shrink-0 z-10">
          {header}
        </header>
      )}

      {/* Main Content */}
      <main className={config.mainGridClass}>
        {/* Board Area */}
        <div className={config.boardAreaClass}>
          {/* Game Board */}
          <div className="flex-1 flex items-center justify-center">
            {board}
          </div>

          {/* Tile Rack */}
          <div className="w-full max-w-2xl">
            {React.cloneElement(tileRack as React.ReactElement<any>, { 
              orientation: 'horizontal',
              compact: compactMode,
              size: compactMode ? 'medium' : 'large'
            })}
          </div>
        </div>

        {/* Side Area */}
        <div className={config.sideAreaClass}>
          {/* Score Board */}
          <div className="flex-1">
            {React.cloneElement(scoreBoard as React.ReactElement<any>, { 
              compact: compactMode 
            })}
          </div>

          {/* Game Controls */}
          <div className="flex-shrink-0">
            {React.cloneElement(gameControls as React.ReactElement<any>, { 
              compact: compactMode,
              orientation: 'vertical'
            })}
          </div>

          {/* Sidebar */}
          {showSidebar && sidebar && (
            <div className="flex-shrink-0">
              {sidebar}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      {footer && (
        <footer className="flex-shrink-0">
          {footer}
        </footer>
      )}
    </div>
  );
};

// ================================
// Layout Context for Child Components
// ================================

export interface LayoutContextValue {
  layout: string;
  theme: string;
  compactMode: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

const DEFAULT_CONTEXT_SYMBOL = Symbol('default-context');

export const LayoutContext = React.createContext<LayoutContextValue & { _isDefault?: symbol }>({
  layout: 'auto',
  theme: 'light',
  compactMode: false,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  _isDefault: DEFAULT_CONTEXT_SYMBOL,
});

export const useLayoutContext = () => {
  const context = React.useContext(LayoutContext);
  if ('_isDefault' in context && context._isDefault === DEFAULT_CONTEXT_SYMBOL) {
    throw new Error('useLayoutContext must be used within a GameLayout');
  }
  return context;
};

// ================================
// Layout Provider Component
// ================================

export interface LayoutProviderProps {
  children: ReactNode;
  variant?: 'desktop' | 'tablet' | 'mobile' | 'auto';
  theme?: 'light' | 'dark';
  compactMode?: boolean;
}

export const LayoutProvider: React.FC<LayoutProviderProps> = ({
  children,
  variant = 'auto',
  theme = 'light',
  compactMode = false,
}) => {
  const activeLayout = useResponsiveLayout(variant);

  const contextValue: LayoutContextValue = {
    layout: activeLayout,
    theme,
    compactMode,
    isMobile: activeLayout === 'mobile',
    isTablet: activeLayout === 'tablet',
    isDesktop: activeLayout === 'desktop',
  };

  return (
    <LayoutContext.Provider value={contextValue}>
      {children}
    </LayoutContext.Provider>
  );
};

export default GameLayout;