'use strict';

/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

const rejectInputFn = (s) => {
  throw new TypeError('undefined conversion');
};

/**
 * @constructor
 * @property {!function(string):TrustedHTML} createHTML
 * @property {!function(string):TrustedURL} createURL
 * @property {!function(string):TrustedScriptURL} createScriptURL
 * @property {!function(string):TrustedScript} createScript
 * @property {!string} name
 */
const TrustedTypePolicy = function() {
  throw new TypeError('Illegal constructor');
};

/**
 * @constructor
 */
const TrustedTypePolicyFactory = function() {
  throw new TypeError('Illegal constructor');
};
/* eslint-enable no-unused-vars */


const trustedTypesBuilderTestOnly = function() {
  // Capture common names early.
  const {
    assign, create, defineProperty, freeze, getOwnPropertyNames,
    getPrototypeOf, prototype: ObjectPrototype,
  } = Object;

  const {
    forEach, push,
  } = Array.prototype;

  const creatorSymbol = Symbol();

  /**
   * Getter for the privateMap.
   * @param  {Object} obj Key of the privateMap
   * @return {Object<string, string>} Private storage.
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
   * @type {Map<string,!TrustedTypePolicy>}
   */
  const exposedPolicies = selfContained(new Map());

  /**
   * Allowed policy namess for policy names.
   * @type {Array<string>}
   */
  const allowedNames = selfContained([]);

  /**
   * Whether to enforce allowedNames in createPolicy().
   * @type {boolean}
   */
  let enforceNameWhitelist = false;


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
     * @override
     */
    toString() {
      return privates(this)['v'];
    }

    /**
     * Returns the wrapped string value of the object.
     * @return {string}
     * @override
     */
    valueOf() {
      return privates(this)['v'];
    }
  }

  /**
   * @param {function(new:TrustedType, symbol, string)} SubClass
   * @param {string} canonName The class name which should be independent of
   *     any renaming pass and which is relied upon by the enforcer and for
   *     native type interop.
   */
  function lockdownTrustedType(SubClass, canonName) {
    freeze(SubClass.prototype);
    delete SubClass.name;
    defineProperty(SubClass, 'name', {value: canonName});
  }

  /**
   * Trusted URL object wrapping a string that can only be created from a
   * TT policy.
   */
  class TrustedURL extends TrustedType {
  }
  lockdownTrustedType(TrustedURL, 'TrustedURL');

  /**
   * Trusted Script URL object wrapping a string that can only be created from a
   * TT policy.
   */
  class TrustedScriptURL extends TrustedType {
  }
  lockdownTrustedType(TrustedScriptURL, 'TrustedScriptURL');

  /**
   * Trusted HTML object wrapping a string that can only be created from a
   * TT policy.
   */
  class TrustedHTML extends TrustedType {
  }
  lockdownTrustedType(TrustedHTML, 'TrustedHTML');

  /**
   * Trusted Script object wrapping a string that can only be created from a
   * TT policy.
   */
  class TrustedScript extends TrustedType {
  }
  lockdownTrustedType(TrustedScript, 'TrustedScript');

  lockdownTrustedType(TrustedType, 'TrustedType');

  /**
   * @type {!Object<string,!Function>}
   */
  const createTypeMapping = {
    'createHTML': TrustedHTML,
    'createScriptURL': TrustedScriptURL,
    'createURL': TrustedURL,
    'createScript': TrustedScript,
  };

  const createFunctionAllowed = createTypeMapping.hasOwnProperty;

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
   * Wraps a user-defined policy rules with TT constructor
   * @param  {string} policyName The policy name
   * @param  {TrustedTypesInnerPolicy} innerPolicy InnerPolicy
   * @return {!TrustedTypePolicy} Frozen policy object
   */
  function wrapPolicy(policyName, innerPolicy) {
    /**
     * @template T
     * @param {function(new:T, symbol, string)} Ctor a trusted type constructor
     * @param {string} methodName the policy factory method name
     * @return {function(string):!T} a factory that produces instances of Ctor.
     */
    function creator(Ctor, methodName) {
      // This causes thisValue to be null when called below.
      const method = innerPolicy[methodName] || rejectInputFn;
      const policySpecificType = freeze(new Ctor(creatorSymbol, policyName));
      const factory = {
        [methodName](s) { // Trick to get methodName to show in stacktrace.
          let result = method(s);
          if (result === undefined || result === null) {
            result = '';
          }
          const allowedValue = '' + result;
          const o = freeze(create(policySpecificType));
          privates(o)['v'] = allowedValue;
          return o;
        },
      }[methodName];
      return freeze(factory);
    }

    let policy = create(TrustedTypePolicy.prototype);

    for (const name of getOwnPropertyNames(createTypeMapping)) {
      policy[name] = creator(createTypeMapping[name], name);
    }
    defineProperty(policy, 'name', {
        value: policyName,
        writable: false,
        configurable: false,
        enumerable: true,
    });

    return /** @type {!TrustedTypePolicy} */ (freeze(policy));
  }

  /**
   * Returns a policy object, if given policy was exposed.
   * @param  {string} name
   * @return {?TrustedTypePolicy}
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
   * in the policy object.
   *
   * @param  {string} name A unique name of the policy.
   * @param  {TrustedTypesInnerPolicy} policy Policy rules object.
   * @param  {boolean=} expose Iff true, the policy will be exposed (available
   *   globally).
   * @return {TrustedTypePolicy} The policy that may create TT objects
   *   according to the policy rules.
   * @todo Figure out if the return value (and the policy) can be typed.
   */
  function createPolicy(name, policy, expose = false) {
    const pName = '' + name; // Assert it's a string

    if (enforceNameWhitelist && allowedNames.indexOf(pName) === -1) {
      throw new TypeError('Policy ' + pName + ' disallowed.');
    }

    if (policyNames.indexOf(pName) !== -1) {
      throw new TypeError('Policy ' + pName + ' exists.');
    }
    // Register the name early so that if policy getters unwisely calls
    // across protection domains to code that reenters this function,
    // policy author still has rights to the name.
    policyNames.push(pName);

    // Only copy own properties of names present in createTypeMapping.
    const innerPolicy = create(null);
    if (policy && typeof policy === 'object') {
      // Treat non-objects as empty policies.
      for (const key of getOwnPropertyNames(policy)) {
        if (createFunctionAllowed.call(createTypeMapping, key)) {
          innerPolicy[key] = policy[key];
        }
      }
    } else {
      // eslint-disable-next-line no-console
      console.warn('TrustedTypes.createPolicy ' + pName +
          ' was given an empty policy');
    }
    freeze(innerPolicy);

    const wrappedPolicy = wrapPolicy(pName, innerPolicy);

    if (expose) {
      exposedPolicies.set(pName, wrappedPolicy);
    }

    return wrappedPolicy;
  }

  /**
   * Applies the policy name whitelist.
   * @param {!Array<string>} allowedPolicyNames
   */
  function setAllowedPolicyNames(allowedPolicyNames) {
    if (allowedPolicyNames.indexOf('*') !== -1) { // Any policy name is allowed.
      enforceNameWhitelist = false;
    } else {
      enforceNameWhitelist = true;
      allowedNames.length = 0;
      forEach.call(allowedPolicyNames, (el) => {
        push.call(allowedNames, '' + el);
      });
    }
  }


  const api = create(TrustedTypePolicyFactory.prototype);
  assign(api, {
    // The main function to create policies.
    createPolicy,

    // Policy getter
    getExposedPolicy,

    getPolicyNames,

    // Type checkers, also validating the object was initialized through a
    // policy.
    isHTML: isTrustedTypeChecker(TrustedHTML),
    isURL: isTrustedTypeChecker(TrustedURL),
    isScriptURL: isTrustedTypeChecker(TrustedScriptURL),
    isScript: isTrustedTypeChecker(TrustedScript),

    TrustedHTML: TrustedHTML,
    TrustedURL: TrustedURL,
    TrustedScriptURL: TrustedScriptURL,
    TrustedScript: TrustedScript,
  });

  return {
    TrustedTypes: freeze(api),
    setAllowedPolicyNames,
  };
};


const {
  TrustedTypes,
  setAllowedPolicyNames,
} = trustedTypesBuilderTestOnly();

/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

const tt = TrustedTypes;

/**
 * Sets up the public Trusted Types API in the global object.
 */
function setupPolyfill() {
  // Make sure Closure compiler exposes the names.
  if (typeof window === 'undefined' ||
      typeof window['TrustedTypes'] !== 'undefined') {
    return;
  }

  const publicApi = Object.create(TrustedTypePolicyFactory.prototype);
  Object.assign(publicApi, {
    'isHTML': tt.isHTML,
    'isURL': tt.isURL,
    'isScriptURL': tt.isScriptURL,
    'isScript': tt.isScript,
    'createPolicy': tt.createPolicy,
    'getExposedPolicy': tt.getExposedPolicy,
    'getPolicyNames': tt.getPolicyNames,
    '_isPolyfill_': true,
  });
  window['TrustedTypes'] = Object.freeze(publicApi);

  window['TrustedHTML'] = tt.TrustedHTML;
  window['TrustedURL'] = tt.TrustedURL;
  window['TrustedScriptURL'] = tt.TrustedScriptURL;
  window['TrustedScript'] = tt.TrustedScript;
  window['TrustedTypePolicy'] = TrustedTypePolicy;
  window['TrustedTypePolicyFactory'] = TrustedTypePolicyFactory;
}

setupPolyfill();

module.exports = tt;
