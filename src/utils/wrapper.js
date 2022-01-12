/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

const {
  defineProperty,
} = Object;

/**
 * Installs the setter of a given property.
 * @param {!Object} object An object for which to wrap the property.
 * @param {string} name The name of the property to wrap.
 * @param {function(*): void|undefined} setter A setter function}
 */
export function installSetter(object, name, setter) {
  const descriptor = {
    set: setter,
  };
  defineProperty(object, name, descriptor);
}

/**
 * Installs a setter and getter of a given property.
 * @param {!Object} object An object for which to wrap the property.
 * @param {string} name The name of the property to wrap.
 * @param {function(*): void|undefined} setter A setter function}
 * @param {function(): *|undefined} getter A getter function}
 */
export function installSetterAndGetter(object, name, setter, getter) {
  const descriptor = {
    set: setter,
    get: getter,
    configurable: true, // This can get uninstalled, we need configurable: true
  };
  defineProperty(object, name, descriptor);
}

/**
 * Installs the setter of a given property.
 * @param {!Object} object An object for which to wrap the property.
 * @param {string} name The name of the property to wrap.
 * @param {function(*): *|undefined} fn A function}
 */
export function installFunction(object, name, fn) {
  defineProperty(object, name, {
    value: fn,
  });
}
