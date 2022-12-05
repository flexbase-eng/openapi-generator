import { NoopLogger } from '@flexbase/logger';
import Handlebars from 'handlebars';
import {
  array,
  code,
  collection,
  comparison,
  date,
  html,
  i18n,
  inflection,
  markdown,
  math,
  misc,
  number,
  object,
  path,
  regex,
  string,
  url,
} from 'useful-handlebars-helpers';
import { IsModelDeclaration } from './ast/nodes/ast.model';
import { IsReferenceExpression } from './ast/nodes/ast.reference';

[array, code, collection, comparison, date, html, i18n, inflection, markdown, math, misc, number, object, path, regex, string, url].forEach(
  helper => {
    Handlebars.registerHelper(helper);
  }
);

const referenceRegistrations = new Map<string, string>();

Handlebars.registerHelper('registerReference', function (context, options: Handlebars.HelperOptions) {
  if (!IsModelDeclaration(context) || context.referenceName === undefined) {
    throw Error('Expected a model declaration with a reference name');
  }

  const name = options.fn(context);

  if (referenceRegistrations.has(context.referenceName)) {
    Handlebars.log(2, `Multiple references ${context.referenceName} registered, last one wins!`);
  }

  referenceRegistrations.set(context.referenceName, name);

  return name;
});

Handlebars.registerHelper('resolveReference', function (context) {
  if (!IsReferenceExpression(context) || context.key === undefined) {
    throw Error('Expected a reference expression with a reference key');
  }

  const ref = referenceRegistrations.get(context.key);
  if (!ref) {
    Handlebars.log(2, `Reference ${context.key} not registered`);
  }
  return ref;
});

Handlebars.registerHelper('toRegex', function (str, a) {
  return new RegExp(str, a);
});

Handlebars.registerHelper('replace', function (str, a, b) {
  const _isString = (val: unknown): val is string => {
    return typeof val === 'string' && val !== '';
  };
  const _isRegex = (val: unknown) => {
    const toString = Object.prototype.toString;
    return toString.call(a) === '[object RegExp]';
  };

  if (!_isString(str)) return '';
  if (!_isString(a) && !_isRegex(a)) return str;
  if (!_isString(b)) b = '';

  return str.replace(a, b);
});

(Handlebars.logger as any)['actualLogger'] = new NoopLogger();

Handlebars.log = (level, ...messages) => {
  const levels = ['debug', 'info', 'warn', 'error'];
  const actualLevel = typeof level === 'string' ? (levels.includes(level) ? level : 'info') : levels.at(level) ?? 'info';
  (Handlebars.logger as any)['actualLogger'][actualLevel](...messages);
};

export default Handlebars;