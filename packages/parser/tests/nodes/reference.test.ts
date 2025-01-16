import { ParsedNode } from '../../src/nodes/parsed.node.js';
import { type Reference, isReference } from '../../src/nodes/reference.js';

describe('isReference', () => {
  // Test setup: Prepare mock data for testing
  const validReference: Reference = { type: 'reference', reference: '123' };
  const invalidReference = { type: 'otherType', id: '456' };
  const nonObjectValue = 42;
  const emptyObject = {};

  // Test to check if it correctly identifies a valid reference
  test('should return true for a valid reference', () => {
    expect(isReference(validReference)).toBe(true);
  });

  // Test to check if it correctly identifies an invalid reference due to type mismatch
  test('should return false for an object with incorrect type', () => {
    expect(isReference(invalidReference)).toBe(false);
  });

  // Test to check if it handles non-object values correctly
  test('should return false for a non-object value', () => {
    expect(isReference(nonObjectValue as any)).toBe(false);
  });

  // Test to check if it correctly identifies an empty object
  test('should return false for an empty object', () => {
    expect(isReference(emptyObject as ParsedNode)).toBe(false);
  });
});
