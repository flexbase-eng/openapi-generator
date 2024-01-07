import { Modifiers } from './modifiers';

export interface ParsedNode extends Modifiers {
  type: string;
}

export type CompareParsedNodes = (nodeA?: ParsedNode, nodeB?: ParsedNode) => boolean;
