import { expect, test } from 'vitest';
import { noopLogger } from '@flexbase/logger';
import { parseSpec } from '../src/parse.js';
import { OpenApiOptimizer } from '../src/optimizer/openapi.optimizer.js';
import { Organizer } from '../src/parser/organizer.js';

test('petstore schemas', async () => {
  const organizer = new Organizer(noopLogger);
  const compiler = new OpenApiOptimizer(noopLogger);

  const parsedDocument = await parseSpec('./tests/data/petstore.yaml', noopLogger);

  expect(parsedDocument.paths).toHaveLength(16);

  const documents = organizer.organizeByTags(parsedDocument);

  const optimizedDocs = documents.map((doc: any) => compiler.optimize(doc));

  expect(optimizedDocs).toHaveLength(3);
});

test('discriminator parsing', async () => {
  const parsedDocument = await parseSpec('./tests/data/petstore.yaml', noopLogger);
  
  // Find the path with discriminator
  const discriminatorPath = parsedDocument.paths.find((path: any) => 
    path.name === '/multiple-bodies-with-discriminator'
  );
  
  expect(discriminatorPath).toBeDefined();
  
  if (discriminatorPath && discriminatorPath.definition && 'operations' in discriminatorPath.definition) {
    const postOperation = discriminatorPath.definition.operations.find((op: any) => op.method === 'post');
    expect(postOperation).toBeDefined();
    
    if (postOperation && postOperation.request && 'definition' in postOperation.request) {
      const requestBody = postOperation.request.definition;
      expect(requestBody).toBeDefined();
      
      // Check if the request body has content with discriminator
      if ('content' in requestBody && requestBody.content) {
        const jsonContent = requestBody.content.find((c: any) => c.name === 'application/json');
        expect(jsonContent).toBeDefined();
        
        if (jsonContent && 'definition' in jsonContent.definition) {
          const schema = jsonContent.definition.definition;
          expect(schema).toBeDefined();
          
          // Check if it's a xor (oneOf) with discriminator
          if (schema && schema.type === 'xor') {
            expect(schema.discriminatorPropertyName).toBeDefined();
            expect(schema.discriminatorPropertyName).toBe('type');
            expect(schema.discriminatorMapping).toBeDefined();
            expect(Object.keys(schema.discriminatorMapping)).toHaveLength(2);
            
            // Check the mapping keys
            const mappingKeys = Object.keys(schema.discriminatorMapping);
            expect(mappingKeys).toContain('base');
            expect(mappingKeys).toContain('inherited');
            
            // Check that the mapping values are references
            for (const value of Object.values(schema.discriminatorMapping)) {
              expect((value as any).type).toBe('reference');
            }
          }
        }
      }
    }
  }
});
