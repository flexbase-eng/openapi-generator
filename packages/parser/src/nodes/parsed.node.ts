import type { Modifiers } from './modifiers.js';

export interface ParsedNode extends Modifiers {
  type: string;
}

export type CompareParsedNodes = (nodeA?: ParsedNode, nodeB?: ParsedNode) => boolean;
