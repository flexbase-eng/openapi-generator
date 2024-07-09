import { Modifiers } from '../../parser/parsed_nodes/modifiers.js';

export interface OptimizedNode extends Modifiers {
  type: string;
}
