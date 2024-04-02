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
import { ChalkLogger } from './chalk.logger';
import { $Refs } from '@stoplight/json-schema-ref-parser';

export const referenceRegistrations = new Map<string, string>();

export const references = new Map<string, Map<string, string>>();

export const createHandlebars = (jsonSchema: $Refs): typeof Handlebars => {
  const handlebars = Handlebars.create();

  [array, code, collection, comparison, date, html, i18n, inflection, markdown, math, misc, number, object, path, regex, string, url].forEach(
    helper => {
      handlebars.registerHelper(helper);
    },
  );

  handlebars.registerHelper('registerReference', function (context, referenceType, referenceKey, options: Handlebars.HelperOptions) {
    if (!references.has(referenceType)) {
      references.set(referenceType, new Map<string, string>());
    }

    const referenceMap = references.get(referenceType)!;

    if (referenceMap.has(referenceKey)) {
      handlebars.log(2, `Multiple references ${referenceKey} registered in ${referenceType}, last one wins!`);
    }

    const referenceValue = typeof context === 'object' && options ? options.fn(context) : context;

    referenceMap.set(referenceKey, referenceValue);

    //console.log('register', referenceKey, referenceValue);
  });

  handlebars.registerHelper('resolveReference', function (context, referenceType, options: Handlebars.HelperOptions) {
    const referenceMap = references.get(referenceType)!;
    if (!referenceMap) {
      handlebars.log(1, `${referenceType} references not found`);
    }

    const referenceKey = typeof context === 'object' && options ? options.fn(context) : context;

    const referenceValue = referenceMap.get(referenceKey);
    if (!referenceValue) {
      handlebars.log(1, `Reference ${referenceKey} not registered with ${referenceType}`);
    }

    //console.log('resolve', referenceKey, referenceValue);

    return referenceValue;
  });

  handlebars.registerHelper('clearReferences', function (context, options: Handlebars.HelperOptions) {
    const referenceType = typeof context === 'object' && options ? options.fn(context) : context;

    if (typeof referenceType === 'string') {
      const referenceMap = references.get(referenceType)!;
      if (referenceMap) {
        referenceMap.clear();
      }
    } else {
      references.clear();
    }
  });

  handlebars.registerHelper('jsonRef', function (context, options: Handlebars.HelperOptions) {
    if (typeof context === 'function') {
      context = context.call(handlebars);
    }

    if (!Handlebars.Utils.isEmpty(context)) {
      const ref = jsonSchema.get(context);
      const data = options.data ? Handlebars.createFrame(options.data) : undefined;

      return options.fn(ref, { data, blockParams: [context] });
    }
  });

  handlebars.registerHelper('hasLength', function (context, length, options: Handlebars.HelperOptions) {
    const value = context; //typeof context === 'object' && options ? options.fn(context) : context;

    let len = 0;
    if (typeof value === 'string' || Array.isArray(value)) {
      len = value.length;
    } else if (typeof value === 'object') {
      len = Object.keys(value).length;
    }

    return len === length;
  });

  // handlebars.registerHelper('registerValidator', function (context, options: Handlebars.HelperOptions) {
  //   if (!IsModelDeclaration(context) || context.referenceName === undefined) {
  //     throw Error('Expected a model declaration with a reference name for validator');
  //   }

  //   const referenceName = context.referenceName + '/validator';

  //   const name = options.fn(context);

  //   if (referenceRegistrations.has(referenceName)) {
  //     handlebars.log(2, `Multiple references ${referenceName} registered, last one wins!`);
  //   }

  //   referenceRegistrations.set(referenceName, name);

  //   return;
  // });

  // handlebars.registerHelper('registerReference2', function (context, location, options: Handlebars.HelperOptions) {
  //   const name = options.fn(context);

  //   const referenceName = location + context.name;

  //   if (referenceRegistrations.has(referenceName)) {
  //     handlebars.log(2, `Multiple references ${referenceName} registered, last one wins!`);
  //   }

  //   referenceRegistrations.set(referenceName, name);

  //   return;
  // });

  // handlebars.registerHelper('registerValidator2', function (context, location, options: Handlebars.HelperOptions) {
  //   const name = options.fn(context);

  //   const referenceName = location + context.name + '/validator';

  //   if (referenceRegistrations.has(referenceName)) {
  //     handlebars.log(2, `Multiple references ${referenceName} registered, last one wins!`);
  //   }

  //   referenceRegistrations.set(referenceName, name);

  //   return;
  // });

  // handlebars.registerHelper('resolveReference2', function (context) {
  //   const ref = referenceRegistrations.get(context.$ref);
  //   if (!ref) {
  //     handlebars.log(2, `Reference ${context.$ref} not registered`);
  //   }
  //   return ref;
  // });

  // handlebars.registerHelper('resolveValidator', function (context) {
  //   if (!IsReferenceExpression(context) || context.key === undefined) {
  //     throw Error('Expected a reference expression with a reference key for validator', { cause: context });
  //   }

  //   const referenceKey = context.key + '/validator';

  //   const ref = referenceRegistrations.get(referenceKey);
  //   if (!ref) {
  //     handlebars.log(2, `Reference ${referenceKey} not registered`);
  //   }
  //   return ref;
  // });

  // handlebars.registerHelper('resolveValidator2', function (context) {
  //   const referenceKey = context.$ref + '/validator';

  //   const ref = referenceRegistrations.get(referenceKey);
  //   if (!ref) {
  //     handlebars.log(2, `Reference ${referenceKey} not registered`);
  //   }
  //   return ref;
  // });

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
    if (!_isString(b) && !_isRegex(b) && typeof b !== 'function') b = '';

    return rendered.replace(a, b);
  });

  handlebars.registerHelper('function', function (str, options: Handlebars.HelperOptions) {
    const _isString = (val: unknown): val is string => {
      return typeof val === 'string' && val !== '';
    };

    const rendered = typeof str === 'object' && options ? options.fn(str) : str;

    if (!_isString(rendered)) return '';

    return eval(rendered);
  });

  handlebars.registerHelper('extendProperty', function (context, name, options: Handlebars.HelperOptions) {
    const rendered = options.fn(context);

    context[name] = rendered;
  });

  handlebars.registerHelper('isDefined', function (context, options: Handlebars.HelperOptions) {
    const rendered = typeof context === 'object' && options ? options.fn(context) : context;
    return rendered !== undefined;
  });

  (handlebars.logger as any)['actualLogger'] = new ChalkLogger();

  handlebars.log = (level, ...messages) => {
    const levels = ['debug', 'info', 'warn', 'error'];
    const actualLevel = typeof level === 'string' ? (levels.includes(level) ? level : 'info') : levels.at(level) ?? 'info';
    (handlebars.logger as any)['actualLogger'][actualLevel](...messages);
  };

  return handlebars;
};
