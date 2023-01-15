import { OasNodeModifiers } from './oas.node.modifiers';
import { OasNodeTypeSecurity } from './oas.node.type.security';

export class OasNodeTypeSecurityHttp extends OasNodeTypeSecurity {
  constructor(private readonly _scheme: string, private readonly _bearerFormat: string | undefined, modifiers: OasNodeModifiers) {
    super('http', modifiers);
  }

  get scheme(): string {
    return this._scheme;
  }

  get bearerFormat(): string | undefined {
    return this._bearerFormat;
  }
}
