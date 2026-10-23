import { describe, expect, it } from 'vitest';
import { W, H, ZOOM } from '../src/core/constants';

describe('resolución lógica', () => {
  it('es 360x640 con proporción 9:16', () => {
    expect([W, H]).toEqual([360, 640]);
    expect(W / H).toBeCloseTo(9 / 16);
    expect(ZOOM).toBe(2);
  });
});
