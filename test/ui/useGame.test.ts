// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGame } from '../../src/ui/hooks/useGame.ts';
import { CHESS_GOLD_CONFIG } from '../../src/engine/config.ts';
import type { Square } from '../../src/engine/types.ts';

function sq(name: string): Square {
  const col = name.charCodeAt(0) - 'a'.charCodeAt(0);
  const row = parseInt(name[1]) - 1;
  return (row * 8 + col) as Square;
}

describe('useGame hook', () => {
  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useGame());

    expect(result.current.state.turn).toBe('white');
    expect(result.current.state.gold.white).toBe(CHESS_GOLD_CONFIG.startingGold);
    expect(result.current.state.gold.black).toBe(CHESS_GOLD_CONFIG.startingGold);
    expect(result.current.state.status).toBe('active');
    expect(result.current.error).toBeNull();
  });

  it('dispatches a move action and updates state', () => {
    const { result } = renderHook(() => useGame());

    act(() => {
      result.current.dispatch({
        type: 'move',
        from: sq('e1'),
        to: sq('d1'),
      });
    });

    expect(result.current.state.turn).toBe('black');
    // White got +1 income, move is free
    expect(result.current.state.gold.white).toBe(
      CHESS_GOLD_CONFIG.startingGold + CHESS_GOLD_CONFIG.goldPerTurn,
    );
    expect(result.current.error).toBeNull();
  });

  it('returns an error for illegal moves', () => {
    const { result } = renderHook(() => useGame());

    act(() => {
      // King can't jump 2 squares
      result.current.dispatch({
        type: 'move',
        from: sq('e1'),
        to: sq('e3'),
      });
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error!.type).toBe('error');
    // State should remain unchanged
    expect(result.current.state.turn).toBe('white');
  });

  it('clears error on next successful action', () => {
    const { result } = renderHook(() => useGame());

    // First: illegal move → error set
    act(() => {
      result.current.dispatch({
        type: 'move',
        from: sq('e1'),
        to: sq('e3'),
      });
    });
    expect(result.current.error).not.toBeNull();

    // Second: legal move → error cleared
    act(() => {
      result.current.dispatch({
        type: 'move',
        from: sq('e1'),
        to: sq('d1'),
      });
    });
    expect(result.current.error).toBeNull();
  });

  it('resets game to initial state', () => {
    const { result } = renderHook(() => useGame());

    // Make a move to change state
    act(() => {
      result.current.dispatch({
        type: 'move',
        from: sq('e1'),
        to: sq('d1'),
      });
    });
    expect(result.current.state.turn).toBe('black');

    // Reset
    act(() => {
      result.current.resetGame();
    });

    expect(result.current.state.turn).toBe('white');
    expect(result.current.state.gold.white).toBe(CHESS_GOLD_CONFIG.startingGold);
    expect(result.current.state.gold.black).toBe(CHESS_GOLD_CONFIG.startingGold);
    expect(result.current.state.status).toBe('active');
    expect(result.current.error).toBeNull();
  });
});
