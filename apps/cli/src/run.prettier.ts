import prettier, { BuiltInParserName } from 'prettier';

export const runPrettier = async (str: string, ext: BuiltInParserName) => {
  return await prettier.format(str, {
    semi: true,
    singleQuote: true,
    arrowParens: 'avoid',
    tabWidth: 2,
    useTabs: false,
    printWidth: 150,
    parser: ext,
  });
};
