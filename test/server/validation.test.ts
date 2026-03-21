import { describe, it, expect } from 'vitest';
import {
  validateAction,
  validateDisplayName,
  validatePlayerToken,
  validateCreateRoomOpts,
  validateRoomId,
  validatePlayerId,
} from '../../src/server/validation.ts';

describe('validateDisplayName', () => {
  it('accepts valid name (2-20 alphanumeric + spaces)', () => {
    expect(validateDisplayName('Alice')).toBe('Alice');
  });

  it('accepts name with spaces', () => {
    expect(validateDisplayName('The King')).toBe('The King');
  });

  it('accepts name at minimum length (2 chars)', () => {
    expect(validateDisplayName('AB')).toBe('AB');
  });

  it('accepts name at maximum length (20 chars)', () => {
    const name = 'A'.repeat(20);
    expect(validateDisplayName(name)).toBe(name);
  });

  it('rejects name shorter than 2 chars', () => {
    expect(validateDisplayName('A')).toBeNull();
  });

  it('rejects empty string', () => {
    expect(validateDisplayName('')).toBeNull();
  });

  it('rejects name longer than 20 chars', () => {
    expect(validateDisplayName('A'.repeat(21))).toBeNull();
  });

  it('rejects special characters', () => {
    expect(validateDisplayName('Alice!')).toBeNull();
    expect(validateDisplayName('Bob@123')).toBeNull();
    expect(validateDisplayName('Carol#')).toBeNull();
    expect(validateDisplayName('<script>')).toBeNull();
  });

  it('rejects unicode/emoji characters', () => {
    expect(validateDisplayName('🎮 Gamer')).toBeNull();
    expect(validateDisplayName('Ñoño')).toBeNull();
  });

  it('trims whitespace before validation', () => {
    expect(validateDisplayName('  Alice  ')).toBe('Alice');
  });

  it('rejects whitespace-only string after trimming', () => {
    expect(validateDisplayName('   ')).toBeNull();
  });

  it('rejects non-string types', () => {
    expect(validateDisplayName(123)).toBeNull();
    expect(validateDisplayName(null)).toBeNull();
    expect(validateDisplayName(undefined)).toBeNull();
    expect(validateDisplayName({})).toBeNull();
  });
});

describe('validatePlayerToken', () => {
  it('accepts valid 64-char hex token', () => {
    const token = 'a'.repeat(64);
    expect(validatePlayerToken(token)).toBe(token);
  });

  it('accepts mixed hex characters', () => {
    const token = 'abcdef0123456789'.repeat(4);
    expect(validatePlayerToken(token)).toBe(token);
  });

  it('rejects token shorter than 64 chars', () => {
    expect(validatePlayerToken('a'.repeat(63))).toBeNull();
  });

  it('rejects token longer than 64 chars', () => {
    expect(validatePlayerToken('a'.repeat(65))).toBeNull();
  });

  it('rejects non-hex characters', () => {
    const token = 'g'.repeat(64); // 'g' is not hex
    expect(validatePlayerToken(token)).toBeNull();
  });

  it('rejects uppercase hex characters', () => {
    const token = 'A'.repeat(64);
    expect(validatePlayerToken(token)).toBeNull();
  });

  it('rejects non-string types', () => {
    expect(validatePlayerToken(123)).toBeNull();
    expect(validatePlayerToken(null)).toBeNull();
  });
});

describe('validateAction — resign', () => {
  it('accepts valid resign action', () => {
    const action = validateAction({ type: 'resign' });
    expect(action).toEqual({ type: 'resign' });
  });

  it('ignores extra fields on resign action', () => {
    const action = validateAction({ type: 'resign', extra: 'data' });
    expect(action).toEqual({ type: 'resign' });
  });

  it('rejects unknown action types', () => {
    expect(validateAction({ type: 'hack' })).toBeNull();
  });

  it('rejects empty object', () => {
    expect(validateAction({})).toBeNull();
  });

  it('rejects non-object types', () => {
    expect(validateAction('resign')).toBeNull();
    expect(validateAction(null)).toBeNull();
  });
});

describe('validateCreateRoomOpts — rated field', () => {
  it('accepts opts with rated: true', () => {
    const opts = validateCreateRoomOpts({ rated: true });
    expect(opts).toHaveProperty('rated', true);
  });

  it('accepts opts with rated: false', () => {
    const opts = validateCreateRoomOpts({ rated: false });
    expect(opts).toHaveProperty('rated', false);
  });

  it('accepts opts without rated field (optional)', () => {
    const opts = validateCreateRoomOpts({ startingGold: 5 });
    expect(opts).toBeDefined();
    expect(opts).not.toHaveProperty('rated');
  });

  it('accepts undefined opts (entire object is optional)', () => {
    const opts = validateCreateRoomOpts(undefined);
    // When undefined, the function returns the parsed result (undefined is valid)
    // The function signature returns null on failure, so non-null means valid
    expect(opts).not.toBeNull();
  });

  it('rejects rated with non-boolean value', () => {
    expect(validateCreateRoomOpts({ rated: 'yes' })).toBeNull();
    expect(validateCreateRoomOpts({ rated: 1 })).toBeNull();
  });

  it('rejects startingGold outside range', () => {
    expect(validateCreateRoomOpts({ startingGold: 0 })).toBeNull();
    expect(validateCreateRoomOpts({ startingGold: 1001 })).toBeNull();
  });
});

describe('validateRoomId', () => {
  it('accepts valid room ID', () => {
    expect(validateRoomId('abc123')).toBe('abc123');
  });

  it('rejects empty string', () => {
    expect(validateRoomId('')).toBeNull();
  });

  it('rejects string exceeding max length', () => {
    expect(validateRoomId('a'.repeat(21))).toBeNull();
  });

  it('rejects non-string types', () => {
    expect(validateRoomId(123)).toBeNull();
    expect(validateRoomId(null)).toBeNull();
  });
});

describe('validatePlayerId', () => {
  it('accepts valid player ID', () => {
    expect(validatePlayerId('player-abc')).toBe('player-abc');
  });

  it('rejects empty string', () => {
    expect(validatePlayerId('')).toBeNull();
  });

  it('rejects string exceeding max length', () => {
    expect(validatePlayerId('a'.repeat(129))).toBeNull();
  });
});
