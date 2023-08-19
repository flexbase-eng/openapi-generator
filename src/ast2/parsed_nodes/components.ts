import { ParsedNode } from './parsed.node';

export interface Components {
  models?: Component[];
  requestBodies?: Component[];
  responses?: Component[];
  parameters?: Component[];
  headers?: Component[];
  securitySchemes?: Component[];
  callbacks?: Component[];
  pathItems?: Component[];
}

export interface Component {
  name: string;
  referenceName: string;
  definition: ParsedNode;
}
