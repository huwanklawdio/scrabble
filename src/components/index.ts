// ================================
// UI Components Export Index
// ================================

// This file will export all UI components once they are implemented
// Currently empty - components will be added in subsequent tasks

// Export component types that are already defined
export type {
  BoardCellProps,
  TileProps,
  TileRackProps,
  ScoreBoardProps,
  PlayerCardProps,
  GameControlsProps,
  GameStatsProps,
  ModalProps,
  GameSetupModalProps,
  GameEndModalProps,
} from '../types';

// Board Components
export { Board } from './Board';
export type { BoardProps } from './Board';
export { BoardCell } from './BoardCell';
export type { BoardCellProps } from './BoardCell';

// TODO: Add component exports as they are implemented:
// export { default as Tile } from './Board/Tile';
// export { default as TileRack } from './Player/TileRack';
// export { default as ScoreBoard } from './Player/ScoreBoard';
// export { default as GameControls } from './Controls/GameControls';
// export { default as GameLayout } from './Layout/GameLayout';
// export { default as Modal } from './Modal/Modal'; 