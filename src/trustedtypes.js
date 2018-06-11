/*
Copyright 2018 Google Inc.

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

/* eslint-disable no-unused-vars */
/**
 * @typedef Policy
 * @property {function(string):TrustedHTML} createHTML
 * @property {function(string):TrustedURL} createURL
 * @property {function(string):TrustedScriptURL} createScriptURL
 */
let Policy = {};

/**
 * @typedef InnerPolicy
 * @property {function(string):string} createHTML
 * @property {function(string):string} createURL
 * @property {function(string):string} createScriptURL
 * @property {boolean} expose
 */
let InnerPolicy = {};
/* eslint-enable no-unused-vars */

export const TrustedTypes = (function() {
  // Capture common names early.
  const {
    assign, create, defineProperty, freeze, getOwnPropertyDescriptor,
    getOwnPropertyNames, getPrototypeOf, prototype: ObjectPrototype,
  } = Object;

  const creatorSymbol = Symbol();

  /**
   * Getter for the privateMap.
   * @param  {Object} obj Key of the privateMap
   * @return {Object} Private storage.
   */
  const privates = function(obj) {
    let v = privateMap.get(obj);
    if (v === undefined) {
      v = create(null); // initialize the private storage.
      privateMap.set(obj, v);
    }
    return v;
  };

  /**
   * Called before attacker-controlled code on an internal collections,
   * copies prototype members onto the instance directly, so that later
   * changes to prototypes cannot expose collection internals.
   * @param {!T} collection
   * @return {!T} collection
   * @template T
   */
  function selfContained(collection) {
    const proto = getPrototypeOf(collection);
    if (proto == null || getPrototypeOf(proto) !== ObjectPrototype) {
      throw new Error(); // Loop below is insufficient.
    }
    for (let key of getOwnPropertyNames(proto)) {
      defineProperty(collection, key, {value: collection[key]});
    }
    return collection;
  }

  /**
   * Map for private properties of Trusted Types object.
   * This is so that the access to the type constructor does not give
   * the ability to create typed values.
   * @type {WeakMap}
   */
  const privateMap = selfContained(new WeakMap());

  /**
   * List of all configured policy names.
   * @type {Array<string>}
   */
  const policyNames = selfContained([]);

  /**
   * Map of all exposed policies, keyed by policy name.
   * @type {Map<string,Object>}
   */
  const exposedPolicies = selfContained(new Map());

  /**
   * A value that is trusted to have certain security-relevant properties
   * because the sources of such values are controlled.
   */
  class TrustedType {
    /**
     * Constructor for TrustedType. Only allowed to be called from within a
     * policy.
     * @param {symbol} s creatorSymbol
     * @param {string} policyName The name of the policy this object was
     *   created by.
     */
    constructor(s, policyName) {
      // TODO: Figure out if symbol is needed, if the value is in privateMap.
      if (s !== creatorSymbol) {
        throw new Error('cannot call the constructor');
      }
      defineProperty(this, 'policyName',
                     {value: '' + policyName, enumerable: true});
    }

    /**
     * Returns the wrapped string value of the object.
     * @return {string}
     */
    toString() {
      return privates(this).value;
    }

    /**
     * Returns the wrapped string value of the object.
     * @return {string}
     */
    valueOf() {
      return privates(this).value;
    }
  }

  /**
   * @param {!function(new:TrustedType, symbol, string)} SubClass
   */
  function lockdownTrustedType(SubClass) {
    freeze(SubClass.prototype);
    // The name property is relied upon by the enforcer to work with both the
    // polyfilled and native type.
    const namePropDesc = getOwnPropertyDescriptor(SubClass, 'name');
    namePropDesc.configurable = namePropDesc.writable = false;
    delete SubClass.name;
    defineProperty(SubClass, 'name', namePropDesc);
  }

  /**
   * Trusted URL object wrapping a string that can only be created from a
   * TT policy.
   */
  class TrustedURL extends TrustedType {
  }
  lockdownTrustedType(TrustedURL);

  /**
   * Trusted Script URL object wrapping a string that can only be created from a
   * TT policy.
   */
  class TrustedScriptURL extends TrustedType {
  }
  lockdownTrustedType(TrustedScriptURL);

  /**
   * Trusted HTML object wrapping a string that can only be created from a
   * TT policy.
   */
  class TrustedHTML extends TrustedType {
  }
  lockdownTrustedType(TrustedHTML);

  lockdownTrustedType(TrustedType);

  /**
   * Function generating a type checker.
   * @template T
   * @param  {T} type The type to check against.
   * @return {function(*):boolean}
   */
  function isTrustedTypeChecker(type) {
    return (obj) => (obj instanceof type) && privateMap.has(obj);
  }

  /**
   * Function building a type from exposed policy
   * @template T
   * @param  {T} type        The type to build
   * @param  {string} functionName Function name to call in a policy.
   * @return {function(string,string):T} The type
   */
  function buildTypeFromExposedPolicy(type, functionName) {
    return function(policyName, value) {
      const policy = getExposedPolicy(policyName);
      if (!policy) {
        throw new Error('Policy not found');
      }
      // TODO(msamuel): can we require that functionName
      // is an own property name in policy?
      // TODO(msamuel): can we avoid doing this as a method call,
      // a la (0, policy)[functionName](value)?  I don't think
      // it matters if policy[functionName] is an attacker-controlled
      // function that gets policy as the this-value.
      return policy[functionName](value);
    };
  }

  /**
   * Initial builder object for the policy.
   * Its clone is passed to createPolicy builder function, with the expectation
   * to modify its properties.
   * @type {InnerPolicy}
   */
  const initialBuilder = {
    'createHTML': (s) => s, // or a null function to encourage explicit config
    'createURL': (s) => s,
    'createScriptURL': (s) => s,
    'expose': false, // Don't expose the policy by default.
  };

  /**
   * Wraps a user-defined policy rules with TT constructor
   * @param  {string} policyName The policy name
   * @param  {InnerPolicy} innerPolicy InnerPolicy
   * @return {Policy} Frozen policy object
   */
  function wrapPolicy(policyName, innerPolicy) {
    /**
     * @template T
     * @param {!function(new:T, symbol, string)} Ctor a trusted type constructor
     * @param {string} methodName the policy factory method name
     * @return {!function(string):!T} a factory that produces instances of Ctor.
     */
    function creator(Ctor, methodName) {
      // This causes thisValue to be null when called below.
      const method = innerPolicy[methodName];
      const policySpecificType = freeze(new Ctor(creatorSymbol, policyName));
      const factory = {
        [methodName](s) { // Trick to get methodName to show in stacktrace.
          const o = freeze(create(policySpecificType));
          privates(o).value = '' + method(s);
          return o;
        },
      }[methodName];
      return freeze(factory);
    }

    return freeze({
      'createHTML': creator(TrustedHTML, 'createHTML'),
      'createScriptURL': creator(TrustedScriptURL, 'createScriptURL'),
      'createURL': creator(TrustedURL, 'createURL'),
    });
  }

  /**
   * Returns a policy object, if given policy was exposed.
   * @param  {string} name
   * @return {?Policy}
   */
  function getExposedPolicy(name) {
    const pName = '' + name;
    return exposedPolicies.get(pName) || null;
  }

  /**
   * Returns all configured policy names (even for non-exposed policies).
   * @return {!Array<string>}
   */
  function getPolicyNames() {
    // TODO(msamuel): Should we sort policyNames to avoid leaking or
    // encouraging dependency on the order in which policy names are
    // registered?  I think JavaScript builtin sorts are efficient for
    // almost-sorted lists so the amortized cost is close to O(n).
    return policyNames.slice();
  }

  /**
   * Creates a TT policy.
   *
   * Returns a frozen object representing a policy - a collection of functions
   * that may create TT objects based on the user-provided rules specified
   * in the builder function.
   *
   * @param  {string} name A unique name of the policy.
   * @param  {function(InnerPolicy)} builder Function that defines
   *   policy rules by modifying the initial policy object passed.
   * @return {Policy} The policy that may create TT objects according to the
   *   rules in the builder.
   * @todo Figure out if the return value (and the builder) can be typed.
   */
  function createPolicy(name, builder) {
    // TODO(msamuel): could we also allow symbol names for non-exposed policies?
    // That would simplify a lot of collision avoidance stuff in client code.
    // For example,
    // function toPolicyName(name) {
    //   if ('symbol' === typeof name) {
    //     if (getPrototypeOf(name) !== Symbol.prototype) {
    //       throw new Error('Symbols from other Realms cannot be policy names')
    //     }
    //     return name;
    //   }
    //   return '' + name;  // Require a string.
    // }
    const pName = '' + name; // Assert it's a string

    if (policyNames.includes(pName)) {
      throw new Error('Policy ' + pName + ' exists');
    }
    // Register the name early so that if builder unwisely calls
    // across protection domains to code that reenters this function,
    // builder's author still has rights to the name.
    policyNames.push(pName);

    // TODO(msamuel): can the innerPolicy make do with a null prototype?
    // That might make leaks via thisValue less likely.
    const innerPolicy = assign({}, initialBuilder);
    builder(innerPolicy);
    // TODO(msamuel): can we freeze the inner policy post build, so that
    // it doesn't matter as much if it leaks via thisValue?
    // TODO(msamuel): if so, should we await in case builder is async?

    const policy = wrapPolicy(pName, innerPolicy);

    if (innerPolicy['expose']) {
      exposedPolicies.set(pName, policy);
    }

    return policy;
  }

  // TODO: Figure out if it's safe to return an instance of a typed object
  // to make testing easier.
  return freeze({

    // Types definition, for convenience of instanceof checks
    TrustedHTML,
    TrustedURL,
    TrustedScriptURL,

    // Type checkers, also validating the object was initialized through a
    // policy.
    isHTML: isTrustedTypeChecker(TrustedHTML),
    isURL: isTrustedTypeChecker(TrustedURL),
    isScriptURL: isTrustedTypeChecker(TrustedScriptURL),

    // Type builders from exposed policies, for convenience. Consider removing?
    createHTML: buildTypeFromExposedPolicy(TrustedHTML, 'createHTML'),
    createURL: buildTypeFromExposedPolicy(TrustedURL, 'createURL'),
    createScriptURL: buildTypeFromExposedPolicy(TrustedScriptURL,
        'createScriptURL'),

    // The main function to create policies.
    createPolicy,

    // Policy getter
    getExposedPolicy,

    getPolicyNames,
  });
})();
