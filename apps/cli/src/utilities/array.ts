declare global {
  interface Array<T> {
    unique<K extends keyof T>(selector: K | ((t: T) => T[K])): Array<T>;
    cast<U extends T>(): Array<U>;
    deleteProperties<K extends keyof T>(...properties: K[]): Array<Omit<T, K>>;
  }
}

if (!Array.prototype.unique) {
  Array.prototype.unique = function <T, K extends keyof T>(this: T[], selector: K | ((t: T) => T[K])): Array<T> {
    const map = new Map<T[K], T>();

    const _selector = typeof selector !== 'function' ? (t: T) => t[selector] : selector;

    this.forEach(a => map.set(_selector(a), a));

    return Array.from(map.values());
  };
}

if (!Array.prototype.cast) {
  Array.prototype.cast = function <T, U extends T>(this: T[]): Array<U> {
    return this as Array<U>;
  };
}

if (!Array.prototype.deleteProperties) {
  Array.prototype.deleteProperties = function <T, K extends keyof T>(this: T[], ...properties: K[]): Array<Omit<T, K>> {
    this.forEach(x => {
      properties.forEach(prop => delete x[prop]);
    });

    return this as Array<Omit<T, K>>;
  };
}

export const joinNonEmpty = (separator: string | undefined, ...values: string[]): string => {
  return values.filter(Boolean).join(separator);
};
