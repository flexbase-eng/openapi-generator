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

export const referenceRegistrations = new Map<string, string>();

export const createHandlebars = (): typeof Handlebars => {
  const handlebars = Handlebars.create();

  [array, code, collection, comparison, date, html, i18n, inflection, markdown, math, misc, number, object, path, regex, string, url].forEach(
    helper => {
      handlebars.registerHelper(helper);
    }
  );

  handlebars.registerHelper('registerReference', function (context, options: Handlebars.HelperOptions) {
    if (!IsModelDeclaration(context) || context.referenceName === undefined) {
      throw Error('Expected a model declaration with a reference name');
    }

    const name = options.fn(context);

    if (referenceRegistrations.has(context.referenceName)) {
      handlebars.log(2, `Multiple references ${context.referenceName} registered, last one wins!`);
    }

    referenceRegistrations.set(context.referenceName, name);

    return;
  });

  handlebars.registerHelper('registerValidator', function (context, options: Handlebars.HelperOptions) {
    if (!IsModelDeclaration(context) || context.referenceName === undefined) {
      throw Error('Expected a model declaration with a reference name for validator');
    }

    const referenceName = context.referenceName + '/validator';

    const name = options.fn(context);

    if (referenceRegistrations.has(referenceName)) {
      handlebars.log(2, `Multiple references ${referenceName} registered, last one wins!`);
    }

    referenceRegistrations.set(referenceName, name);

    return;
  });

  handlebars.registerHelper('resolveReference', function (context) {
    if (!IsReferenceExpression(context) || context.key === undefined) {
      throw Error('Expected a reference expression with a reference key');
    }

    const ref = referenceRegistrations.get(context.key);
    if (!ref) {
      handlebars.log(2, `Reference ${context.key} not registered`);
    }
    return ref;
  });

  handlebars.registerHelper('resolveValidator', function (context) {
    if (!IsReferenceExpression(context) || context.key === undefined) {
      throw Error('Expected a reference expression with a reference key for validator', { cause: context });
    }

    const referenceKey = context.key + '/validator';

    const ref = referenceRegistrations.get(referenceKey);
    if (!ref) {
      handlebars.log(2, `Reference ${referenceKey} not registered`);
    }
    return ref;
  });

  handlebars.registerHelper('wrap', function (context, prefix, suffix, options: Handlebars.HelperOptions) {
    const rendered = options.fn(context);

    if (!rendered) {
      return rendered;
    }

    const trimmed = rendered.trim();

    if (trimmed.length > 0) {
      return `${prefix}${rendered}${suffix}`;
    }

    return trimmed;
  });

  handlebars.registerHelper('newline', function () {
    return '\n';
  });

  handlebars.registerHelper('toRegex', function (str, a) {
    return new RegExp(str, a);
  });

  handlebars.registerHelper('replace', function (str, a, b, options: Handlebars.HelperOptions) {
    const _isString = (val: unknown): val is string => {
      return typeof val === 'string' && val !== '';
    };
    const _isRegex = (val: unknown) => {
      const toString = Object.prototype.toString;
      return toString.call(val) === '[object RegExp]';
    };

    const rendered = typeof str === 'object' && options ? options.fn(str) : str;

    if (!_isString(rendered)) return '';
    if (!_isString(a) && !_isRegex(a)) return rendered;
    if (!_isString(b)) b = '';

    return rendered.replace(a, b);
  });

  handlebars.registerHelper('extendProperty', function (context, name, options: Handlebars.HelperOptions) {
    const rendered = options.fn(context);

    context[name] = rendered;
  });

  (handlebars.logger as any)['actualLogger'] = new NoopLogger();

  handlebars.log = (level, ...messages) => {
    const levels = ['debug', 'info', 'warn', 'error'];
    const actualLevel = typeof level === 'string' ? (levels.includes(level) ? level : 'info') : levels.at(level) ?? 'info';
    (handlebars.logger as any)['actualLogger'][actualLevel](...messages);
  };

  return handlebars;
};
