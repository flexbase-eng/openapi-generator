export interface OpenApiGeneratorConfiguation {
  include: string[];
  sharedTemplates?: string[];
  target?: string;
  template?: string;
  operations?: {
    target: string;
    template: string;
    additionalTemplates?: string[];
  };
  models?: {
    target: string;
    template: string;
    additionalTemplates?: string[];
  };
  validations?: {
    target: string;
    template: string;
    additionalTemplates?: string[];
  };
  prettier: boolean;
  tags: boolean;
  flatten: boolean;
  references: boolean;
  debug: boolean;
}
