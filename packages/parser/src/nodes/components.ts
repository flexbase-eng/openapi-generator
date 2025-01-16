import { ParsedNode } from './parsed.node.js';

export interface Components {
  models?: Component[];
  requests?: Component[];
  responses?: Component[];
  parameters?: Component[];
  headers?: Component[];
  securitySchemes?: Component[];
  callbacks?: Component[];
  pathItems?: Component[];
}

export interface Component<T extends ParsedNode = ParsedNode> {
  name: string;
  referenceName: string;
  generated?: boolean;
  definition: T;
}
