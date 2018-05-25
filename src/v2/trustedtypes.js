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
  const creatorSymbol = Symbol();

  /**
   * Getter for the privateMap.
   * @param  {Object} obj Key of the privateMap
   * @return {Object} Private storage.
   */
  const privates = function(obj) {
    let v = privateMap.get(obj);
    if (v === undefined) {
      v = Object.create({}); // initialize the private storage.
      privateMap.set(obj, v);
    }
    return v;
  };

  /**
   * Map for private properties of Trusted Types object.
   * This is so that the access to the type constructor does not give
   * the ability to create typed values.
   * @type {WeakMap}
   */
  const privateMap = new WeakMap();

  /**
   * List of all configured policy names.
   * @type {Array<string>}
   */
  const policyNames = [];

  /**
   * Map of all exposed policies, keyed by policy name.
   * @type {Map<string,Object>}
   */
  const exposedPolicies = new Map();

  /**
   * Trusted Type object wrapping a string that can only be created from a
   * TT policy.
   * @param {symbol} s creatorSymbol
   * @param {string} policyName The name of the policy this object was
   *   created by.
   * @constructor
   */
  function TrustedURL(s, policyName) {
    // TODO: Figure out if symbol is needed, if the value is in privateMap.
    if (s != creatorSymbol) {
      throw new Error('cannot call the constructor');
    }
    this.policyName = '' + policyName;
  }

  /**
   * Returns the wrapped string value of the object.
   * @return {string}
   */
  TrustedURL.prototype.toString = function() {
    return privates(this).value;
  };

  /**
   * Trusted Type object wrapping a string that can only be created from a
   * TT policy.
   * @param {symbol} s creatorSymbol
   * @param {string} policyName The name of the policy this object was
   *   created by.
   * @constructor
   */
  function TrustedScriptURL(s, policyName) {
    // TODO: Figure out if symbol is needed, if the value is in privateMap.
    // If the symbol is not needed, we can externalize the types definition
    // outside of IIFE.
    if (s != creatorSymbol) {
      throw new Error('cannot call the constructor');
    }
    this.policyName = '' + policyName;
  }

  /**
   * Returns the wrapped string value of the object.
   * @return {string}
   */
  TrustedScriptURL.prototype.toString = function() {
    return privates(this).value;
  };

  /**
   * Trusted Type object wrapping a string that can only be created from a
   * TT policy.
   * @param {symbol} s creatorSymbol
   * @param {string} policyName The name of the policy this object was
   *   created by.
   * @constructor
   */
  function TrustedHTML(s, policyName) {
    if (s != creatorSymbol) {
      throw new Error('cannot call the constructor');
    }
    this.policyName = '' + policyName;
  }

  /**
   * Returns the wrapped string value of the object.
   * @return {string}
   */
  TrustedHTML.prototype.toString = function() {
    return privates(this).value;
  };

  /**
   * Function generating a type checker.
   * @param  {function}  type The type to check against.
   * @return {boolean}
   */
  function isTrustedTypeChecker(type) {
    return (obj) => obj instanceof type && privateMap.has(obj);
  }

  /**
   * Function building a type from exposed policy
   * @param  {function} type        The type to build
   * @param  {string} functionName Function name to call in a policy.
   * @return {?} The type
   */
  function buildTypeFromExposedPolicy(type, functionName) {
    return function(policyName, value) {
      const policy = getExposedPolicy(policyName);
      if (!policy) {
        throw new Error('Policy not found');
      }
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
    const newHTML = Object.freeze(new TrustedHTML(creatorSymbol, policyName));
    const newURL = Object.freeze(new TrustedURL(creatorSymbol, policyName));
    const newScriptURL = Object.freeze(
        new TrustedScriptURL(creatorSymbol, policyName));

    return Object.freeze({
      'createHTML': (s) => {
        const o = Object.create(newHTML);
        privates(o).value = '' + innerPolicy['createHTML'](s);
        return Object.freeze(o);
      },
      'createURL': (s) => {
        const o = Object.create(newURL);
        privates(o).value = '' + innerPolicy['createURL'](s);
        return Object.freeze(o);
      },
      'createScriptURL': (s) => {
        const o = Object.create(newScriptURL);
        privates(o).value = '' + innerPolicy['createScriptURL'](s);
        return Object.freeze(o);
      },
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
    const pName = '' + name; // Assert it's a string

    if (policyNames.includes(pName)) {
      throw new Error('Policy ' + pName + ' exists');
    }

    let innerPolicy = Object.assign({}, initialBuilder);
    builder(innerPolicy);

    policyNames.push(pName);

    const policy = wrapPolicy(pName, innerPolicy);

    if (innerPolicy.expose) {
      exposedPolicies.set(name, policy);
    }

    return policy;
  }

  // TODO: Figure out if it's safe to return an instance of a typed object
  // to make testing easier.
  return ({

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
