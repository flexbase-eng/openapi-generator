import prettier, { BuiltInParserName } from 'prettier';

export const runPrettier = (str: string, ext: BuiltInParserName): string => {
  return prettier.format(str, {
    semi: true,
    singleQuote: true,
    arrowParens: 'avoid',
    tabWidth: 2,
    useTabs: false,
    printWidth: 150,
    parser: ext,
  });
};
