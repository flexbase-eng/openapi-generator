export interface OpenApiGeneratorConfiguationGenerate {
  target: string;
  template: string;
  additionalTemplates?: string[];
  tags?: boolean;
  flatten?: boolean;
  references?: boolean;
}

export interface OpenApiGeneratorConfiguation {
  include: string[];
  sharedTemplates?: string[];
  generate?: Record<string, OpenApiGeneratorConfiguationGenerate>;
  prettier: boolean;
  tags: boolean;
  flatten: boolean;
  references: boolean;
  debug: boolean;
  debugPath: string;
}
