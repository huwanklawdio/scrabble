import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GameLayout, LayoutProvider, useLayoutContext } from './GameLayout';

// Mock components for testing
const MockBoard = () => <div data-testid="mock-board">Board</div>;
const MockScoreBoard = ({ compact }: { compact?: boolean }) => (
  <div data-testid="mock-scoreboard" data-compact={compact}>
    ScoreBoard {compact && '(Compact)'}
  </div>
);
const MockTileRack = ({ orientation, compact, size }: any) => (
  <div 
    data-testid="mock-tilerack" 
    data-orientation={orientation}
    data-compact={compact}
    data-size={size}
  >
    TileRack
  </div>
);
const MockGameControls = ({ orientation, compact }: any) => (
  <div 
    data-testid="mock-gamecontrols" 
    data-orientation={orientation}
    data-compact={compact}
  >
    GameControls
  </div>
);
const MockHeader = () => <div data-testid="mock-header">Header</div>;
const MockFooter = () => <div data-testid="mock-footer">Footer</div>;
const MockSidebar = () => <div data-testid="mock-sidebar">Sidebar</div>;

describe('GameLayout Component', () => {
  const defaultProps = {
    board: <MockBoard />,
    scoreBoard: <MockScoreBoard />,
    tileRack: <MockTileRack />,
    gameControls: <MockGameControls />,
  };

  // Mock window.innerWidth for responsive tests
  const mockInnerWidth = (width: number) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
  };

  beforeEach(() => {
    mockInnerWidth(1024); // Default to desktop
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up event listeners
    vi.restoreAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders all required components', () => {
      render(<GameLayout {...defaultProps} />);
      
      expect(screen.getByTestId('mock-board')).toBeInTheDocument();
      expect(screen.getByTestId('mock-scoreboard')).toBeInTheDocument();
      expect(screen.getByTestId('mock-tilerack')).toBeInTheDocument();
      expect(screen.getByTestId('mock-gamecontrols')).toBeInTheDocument();
    });

    it('renders optional components when provided', () => {
      render(
        <GameLayout 
          {...defaultProps}
          header={<MockHeader />}
          footer={<MockFooter />}
          sidebar={<MockSidebar />}
        />
      );
      
      expect(screen.getByTestId('mock-header')).toBeInTheDocument();
      expect(screen.getByTestId('mock-footer')).toBeInTheDocument();
      expect(screen.getByTestId('mock-sidebar')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(
        <GameLayout {...defaultProps} className="custom-layout" />
      );
      
      expect(container.firstChild).toHaveClass('custom-layout');
    });

    it('hides sidebar when showSidebar is false', () => {
      render(
        <GameLayout 
          {...defaultProps}
          sidebar={<MockSidebar />}
          showSidebar={false}
        />
      );
      
      expect(screen.queryByTestId('mock-sidebar')).not.toBeInTheDocument();
    });
  });

  describe('Theme Support', () => {
    it('applies light theme by default', () => {
      const { container } = render(<GameLayout {...defaultProps} />);
      
      expect(container.firstChild).toHaveClass('from-green-50', 'to-blue-50');
    });

    it('applies dark theme when specified', () => {
      const { container } = render(<GameLayout {...defaultProps} theme="dark" />);
      
      expect(container.firstChild).toHaveClass('from-gray-900', 'to-gray-800');
    });
  });

  describe('Compact Mode', () => {
    it('applies compact mode to child components', () => {
      render(<GameLayout {...defaultProps} compactMode />);
      
      expect(screen.getByTestId('mock-scoreboard')).toHaveAttribute('data-compact', 'true');
      expect(screen.getByTestId('mock-tilerack')).toHaveAttribute('data-compact', 'true');
      expect(screen.getByTestId('mock-gamecontrols')).toHaveAttribute('data-compact', 'true');
    });

    it('applies text-sm class in compact mode', () => {
      const { container } = render(<GameLayout {...defaultProps} compactMode />);
      
      expect(container.firstChild).toHaveClass('text-sm');
    });
  });

  describe('Layout Variants', () => {
    it('uses desktop layout by default', () => {
      render(<GameLayout {...defaultProps} variant="desktop" />);
      
      // Check that components are arranged in desktop layout
      expect(screen.getByTestId('mock-tilerack')).toHaveAttribute('data-orientation', 'horizontal');
      expect(screen.getByTestId('mock-gamecontrols')).toHaveAttribute('data-orientation', 'vertical');
    });

    it('applies tablet layout', () => {
      render(<GameLayout {...defaultProps} variant="tablet" />);
      
      expect(screen.getByTestId('mock-tilerack')).toHaveAttribute('data-orientation', 'horizontal');
      expect(screen.getByTestId('mock-gamecontrols')).toHaveAttribute('data-orientation', 'vertical');
    });

    it('applies mobile layout with different orientations', () => {
      render(<GameLayout {...defaultProps} variant="mobile" />);
      
      expect(screen.getByTestId('mock-tilerack')).toHaveAttribute('data-orientation', 'horizontal');
      expect(screen.getByTestId('mock-gamecontrols')).toHaveAttribute('data-orientation', 'horizontal');
    });
  });

  describe('Responsive Behavior', () => {
    it('detects mobile screen size', async () => {
      mockInnerWidth(500);
      
      render(<GameLayout {...defaultProps} variant="auto" />);
      
      // Trigger resize event
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-gamecontrols')).toHaveAttribute('data-orientation', 'horizontal');
      });
    });

    it('detects tablet screen size', async () => {
      mockInnerWidth(800);
      
      render(<GameLayout {...defaultProps} variant="auto" />);
      
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-gamecontrols')).toHaveAttribute('data-orientation', 'vertical');
      });
    });

    it('detects desktop screen size', async () => {
      mockInnerWidth(1200);
      
      render(<GameLayout {...defaultProps} variant="auto" />);
      
      fireEvent(window, new Event('resize'));
      
      await waitFor(() => {
        expect(screen.getByTestId('mock-gamecontrols')).toHaveAttribute('data-orientation', 'vertical');
      });
    });

    it('cleans up resize listener on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');
      
      const { unmount } = render(<GameLayout {...defaultProps} variant="auto" />);
      unmount();
      
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });

  describe('Component Props Injection', () => {
    it('passes correct props to child components in desktop layout', () => {
      render(<GameLayout {...defaultProps} variant="desktop" compactMode />);
      
      const tileRack = screen.getByTestId('mock-tilerack');
      expect(tileRack).toHaveAttribute('data-orientation', 'horizontal');
      expect(tileRack).toHaveAttribute('data-compact', 'true');
      expect(tileRack).toHaveAttribute('data-size', 'medium');
      
      const gameControls = screen.getByTestId('mock-gamecontrols');
      expect(gameControls).toHaveAttribute('data-orientation', 'vertical');
      expect(gameControls).toHaveAttribute('data-compact', 'true');
    });

    it('passes correct props to child components in mobile layout', () => {
      render(<GameLayout {...defaultProps} variant="mobile" compactMode />);
      
      const tileRack = screen.getByTestId('mock-tilerack');
      expect(tileRack).toHaveAttribute('data-orientation', 'horizontal');
      expect(tileRack).toHaveAttribute('data-size', 'small');
      
      const gameControls = screen.getByTestId('mock-gamecontrols');
      expect(gameControls).toHaveAttribute('data-orientation', 'horizontal');
    });
  });
});

describe('LayoutProvider and Context', () => {
  const TestComponent = () => {
    const context = useLayoutContext();
    return (
      <div data-testid="context-test">
        <span data-testid="layout">{context.layout}</span>
        <span data-testid="theme">{context.theme}</span>
        <span data-testid="compact">{context.compactMode.toString()}</span>
        <span data-testid="mobile">{context.isMobile.toString()}</span>
        <span data-testid="tablet">{context.isTablet.toString()}</span>
        <span data-testid="desktop">{context.isDesktop.toString()}</span>
      </div>
    );
  };

  beforeEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('provides correct context values', () => {
    render(
      <LayoutProvider variant="desktop" theme="dark" compactMode>
        <TestComponent />
      </LayoutProvider>
    );
    
    expect(screen.getByTestId('layout')).toHaveTextContent('desktop');
    expect(screen.getByTestId('theme')).toHaveTextContent('dark');
    expect(screen.getByTestId('compact')).toHaveTextContent('true');
    expect(screen.getByTestId('mobile')).toHaveTextContent('false');
    expect(screen.getByTestId('tablet')).toHaveTextContent('false');
    expect(screen.getByTestId('desktop')).toHaveTextContent('true');
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Wrap in a function that captures the error during rendering
    const TestWrapper = () => {
      try {
        return <TestComponent />;
      } catch (error) {
        throw error;
      }
    };
    
    expect(() => {
      render(<TestWrapper />);
    }).toThrow('useLayoutContext must be used within a GameLayout');
    
    consoleSpy.mockRestore();
  });

  it('responds to screen size changes', async () => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    render(
      <LayoutProvider variant="auto">
        <TestComponent />
      </LayoutProvider>
    );
    
    fireEvent(window, new Event('resize'));
    
    await waitFor(() => {
      expect(screen.getByTestId('mobile')).toHaveTextContent('true');
      expect(screen.getByTestId('desktop')).toHaveTextContent('false');
    });
  });
});

describe('Edge Cases', () => {
  const defaultProps = {
    board: <MockBoard />,
    scoreBoard: <MockScoreBoard />,
    tileRack: <MockTileRack />,
    gameControls: <MockGameControls />,
  };

  it('handles missing optional props gracefully', () => {
    render(<GameLayout {...defaultProps} />);
    
    expect(screen.getByTestId('mock-board')).toBeInTheDocument();
    expect(screen.queryByTestId('mock-header')).not.toBeInTheDocument();
    expect(screen.queryByTestId('mock-footer')).not.toBeInTheDocument();
  });

  it('handles invalid variant gracefully', () => {
    // @ts-ignore - Testing invalid variant
    render(<GameLayout {...defaultProps} variant="invalid" />);
    
    // Should fallback to auto behavior
    expect(screen.getByTestId('mock-board')).toBeInTheDocument();
  });

  it('handles resize events when variant is not auto', () => {
    const { rerender } = render(<GameLayout {...defaultProps} variant="desktop" />);
    
    // Change screen size
    Object.defineProperty(window, 'innerWidth', {
      value: 500,
      writable: true,
    });
    
    fireEvent(window, new Event('resize'));
    
    // Should not change layout since variant is fixed
    rerender(<GameLayout {...defaultProps} variant="desktop" />);
    expect(screen.getByTestId('mock-gamecontrols')).toHaveAttribute('data-orientation', 'vertical');
  });
});