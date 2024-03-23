import { Modifiers } from '../../parser/parsed_nodes/modifiers';

export interface OptimizedNode extends Modifiers {
  type: string;
}
