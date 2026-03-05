import { expect } from 'vitest';
import type { GameState, GameError } from '../../src/engine/types.ts';

/**
 * Asserts that the result of an action is a valid GameState (not an error).
 * Returns the state for further assertions.
 */
export function expectValidAction(result: GameState | GameError): GameState {
  expect(result).not.toHaveProperty('type', 'error');
  return result as GameState;
}

/**
 * Asserts that the result of an action is a GameError.
 * Optionally checks that the error message contains the given substring.
 * Returns the error for further assertions.
 */
export function expectIllegalAction(
  result: GameState | GameError,
  errorContains?: string,
): GameError {
  expect(result).toHaveProperty('type', 'error');
  const error = result as GameError;
  if (errorContains) {
    expect(error.message.toLowerCase()).toContain(errorContains.toLowerCase());
  }
  return error;
}
