import { ParsedNode } from '../../src/nodes/parsed.node.js';
import { type ArrayNode, isArrayNode } from '../../src/nodes/array.js';

describe('isArrayNode', () => {
  // Test setup: Prepare mock data for testing
  const valid: ArrayNode = { type: 'array', definition: <ParsedNode>{} };
  const invalid = { type: 'otherType', id: '456' };
  const nonObjectValue = 42;
  const emptyObject = {};

  // Test to check if it correctly identifies a valid array
  test('should return true for a valid array', () => {
    expect(isArrayNode(valid)).toBe(true);
  });

  // Test to check if it correctly identifies an invalid array due to type mismatch
  test('should return false for an object with incorrect type', () => {
    expect(isArrayNode(invalid)).toBe(false);
  });

  // Test to check if it handles non-object values correctly
  test('should return false for a non-object value', () => {
    expect(isArrayNode(nonObjectValue as any)).toBe(false);
  });

  // Test to check if it correctly identifies an empty object
  test('should return false for an empty object', () => {
    expect(isArrayNode(emptyObject as ParsedNode)).toBe(false);
  });
});
