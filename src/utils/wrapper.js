/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

const {
  defineProperty,
} = Object;

/**
 * Installs the setter of a given property.
 * @param {!Object} object An object for which to wrap the property.
 * @param {string} name The name of the property to wrap.
 * @param {function(*): *|undefined} setter A setter function}
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
 * @param {function(*): *|undefined} setter A setter function}
 * @param {function(*): *|undefined} getter A getter function}
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
