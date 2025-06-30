# Components Directory

This directory contains all React UI components for the Scrabble game application.

## Directory Structure

```
components/
├── Board/          # Game board related components
├── Player/         # Player interface components  
├── Controls/       # Game control components
├── Layout/         # Layout and navigation components
├── Modal/          # Modal and dialog components
├── Forms/          # Form input components
├── Common/         # Reusable utility components
└── index.ts        # Export barrel for all components
```

## Component Categories

### Board Components
- **Board**: Main 15×15 game board grid
- **BoardCell**: Individual board cell with premium square handling
- **Tile**: Individual tile component with letter and point display

### Player Interface
- **TileRack**: Player's tile holder with drag-and-drop
- **ScoreBoard**: Current scores and player status
- **PlayerCard**: Individual player information display

### Game Controls
- **GameControls**: Submit, Pass, Exchange action buttons
- **GameStats**: Game statistics and move history

### Layout Components
- **GameLayout**: Main game layout wrapper
- **Header**: Game header with navigation

### Modals & Dialogs
- **Modal**: Base modal component
- **GameSetupModal**: Game configuration dialog
- **GameEndModal**: End game results modal

### Forms
- **PlayerNameInput**: Player name input with validation
- **GameSettings**: Game configuration form

### Common Utilities
- **LoadingSpinner**: Loading state indicator
- **ErrorBoundary**: Error handling component
- **Notification**: Toast notification system

## Usage

Import components from the barrel export:

```typescript
import { Board, TileRack, GameControls } from '@/components';
```

## Development Guidelines

- Use TypeScript for all components
- Follow the defined prop interfaces from `@/types`
- Implement proper accessibility (ARIA) attributes
- Support responsive design breakpoints
- Include loading and error states
- Add comprehensive PropTypes/TypeScript validation
- Follow the project's naming conventions
- Include Storybook stories for complex components

## Testing

Each component should have:
- Unit tests with React Testing Library
- Accessibility tests
- Visual regression tests (future)
- Interaction tests for complex components

## Styling

- Use Tailwind CSS for styling
- Follow the design system color palette
- Implement dark/light theme support
- Use CSS modules for component-specific styles when needed 