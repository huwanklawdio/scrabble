import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from './App';

describe('App Component', () => {
  it('renders the Scrabble game title', () => {
    render(<App />);
    expect(screen.getByText('🎯 Scrabble Game')).toBeInTheDocument();
  });

  it('renders the setup complete message', () => {
    render(<App />);
    expect(
      screen.getByText('React + TypeScript + Vite setup complete!')
    ).toBeInTheDocument();
  });

  it('renders the start building button', () => {
    render(<App />);
    expect(screen.getByText('Start Building')).toBeInTheDocument();
  });
});
