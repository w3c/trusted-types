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

const rejectInputDefaultPolicyFn = (s) => null;

const {toLowerCase, toUpperCase} = String.prototype;

const HTML_NS = 'http://www.w3.org/1999/xhtml';
const XLINK_NS = 'http://www.w3.org/1999/xlink';
const SVG_NS = 'http://www.w3.org/2000/svg';

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

const DEFAULT_POLICY_NAME = 'default';


const trustedTypesBuilderTestOnly = function() {
  // Capture common names early.
  const {
    assign, create, defineProperty, freeze, getOwnPropertyNames,
    getPrototypeOf, prototype: ObjectPrototype,
  } = Object;

  const {hasOwnProperty} = ObjectPrototype;

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
    for (const key of getOwnPropertyNames(proto)) {
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
   * Allowed policy namess for policy names.
   * @type {Array<string>}
   */
  const allowedNames = selfContained([]);

  /**
   * A reference to a default policy, if created.
   * @type {TrustedTypePolicy}
   */
  let defaultPolicy = null;

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

  // Common constants.
  const emptyHTML = freeze(create(new TrustedHTML(creatorSymbol, '')));
  privates(emptyHTML)['v'] = '';

  /**
   * A map of attribute / property names to allowed types
   * for known namespaces.
   * @type {!Object<string,!TrustedTypesTypeMap>}
   * @export
   */
  const TYPE_MAP = {
    [HTML_NS]: {
      // TODO(koto): Figure out what to to with <link>
      'A': {
        'attributes': {
          'href': TrustedURL.name,
        },
      },
      'AREA': {
        'attributes': {
          'href': TrustedURL.name,
        },
      },
      'BASE': {
        'attributes': {
          'href': TrustedURL.name,
        },
      },
      'BUTTON': {
        'attributes': {
          'formaction': TrustedURL.name,
        },
      },
      'EMBED': {
        'attributes': {
          'src': TrustedScriptURL.name,
        },
      },
      'FORM': {
        'attributes': {
          'action': TrustedURL.name,
        },
      },
      'FRAME': {
        'attributes': {
          'src': TrustedURL.name,
        },
      },
      'IFRAME': {
        'attributes': {
          'src': TrustedURL.name,
          'srcdoc': TrustedHTML.name,
        },
      },
      'INPUT': {
        'attributes': {
          'formaction': TrustedURL.name,
        },
      },
      'OBJECT': {
        'attributes': {
          'data': TrustedScriptURL.name,
          'codebase': TrustedScriptURL.name,
        },
      },
      // TODO(koto): Figure out what to do with portals.
      'SCRIPT': {
        'attributes': {
          'src': TrustedScriptURL.name,
          'text': TrustedScript.name,
        },
        'properties': {
          'innerText': TrustedScript.name,
          'textContent': TrustedScript.name,
          'text': TrustedScript.name,
        },
      },
      '*': {
        'attributes': {},
        'properties': {
          'innerHTML': TrustedHTML.name,
          'outerHTML': TrustedHTML.name,
        },
      },
    },
    [XLINK_NS]: {
      '*': {
        'attributes': {
          'href': TrustedURL.name,
        },
        'properties': {},
      },
    },
    [SVG_NS]: {
      '*': {
        'attributes': {
          'href': TrustedURL.name,
        },
        'properties': {},
      },
    },
  };

  /**
   * A map of element property to HTML attribute names.
   * @type {!Object<string, string>}
   */
  const ATTR_PROPERTY_MAP = {
    'codebase': 'codeBase',
    'formaction': 'formAction',
  };

  // Edge doesn't support srcdoc.
  if (!('srcdoc' in HTMLIFrameElement.prototype)) {
    delete TYPE_MAP[HTML_NS]['IFRAME']['attributes']['srcdoc'];
  }

  // in HTML, clone attributes into properties.
  for (const tag of Object.keys(TYPE_MAP[HTML_NS])) {
    if (!TYPE_MAP[HTML_NS][tag]['properties']) {
      TYPE_MAP[HTML_NS][tag]['properties'] = {};
    }
    for (const attr of Object.keys(TYPE_MAP[HTML_NS][tag]['attributes'])) {
      TYPE_MAP[HTML_NS][tag]['properties'][
          ATTR_PROPERTY_MAP[attr] ? ATTR_PROPERTY_MAP[attr] : attr
      ] = TYPE_MAP[HTML_NS][tag]['attributes'][attr];
    }
  }

  // Add inline event handlers attribute names.
  for (const name of getOwnPropertyNames(HTMLElement.prototype)) {
    if (name.slice(0, 2) === 'on') {
      TYPE_MAP[HTML_NS]['*']['attributes'][name] = 'TrustedScript';
    }
  }

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
      const method = innerPolicy[methodName] || (
        policyName == DEFAULT_POLICY_NAME ?
            rejectInputDefaultPolicyFn : rejectInputFn
      );
      const policySpecificType = freeze(new Ctor(creatorSymbol, policyName));
      const factory = {
        [methodName](s, ...args) {
          // Trick to get methodName to show in stacktrace.
          let result = method('' + s, ...args);
          if (result === undefined || result === null) {
            if (policyName == DEFAULT_POLICY_NAME) {
              // These values mean that the input was rejected. This will cause
              // a violation later, don't create types for them.
              return result;
            }
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

    const policy = create(TrustedTypePolicy.prototype);

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
   * Returns the name of the trusted type required for a given element
   *   attribute.
   * @param {string} tagName The name of the tag of the element.
   * @param {string} attribute The name of the attribute.
   * @param {string=} elementNs Element namespace.
   * @param {string=} attributeNs The attribute namespace.
   * @return {string?} Required type name or null, if a Trusted
   *   Type is not required.
   */
  function getAttributeType(tagName, attribute, elementNs = '',
      attributeNs = '') {
    const canonicalAttr = toLowerCase.apply(String(attribute));
    return getTypeInternal_(tagName, 'attributes', canonicalAttr,
        elementNs, attributeNs) || null;
  }

  /**
   * Returns a type name from a type map.
   * @param {string} tag A tag name.
   * @param {string} container 'attributes' or 'properties'
   * @param {string} name The attribute / property name.
   * @param {string=} elNs Element namespace.
   * @param {string=} attrNs Attribute namespace.
   * @return {string|undefined}
   * @private
   */
  function getTypeInternal_(tag, container, name, elNs = '', attrNs = '') {
    const canonicalTag = toUpperCase.apply(String(tag));

    let ns = attrNs ? attrNs : elNs;
    if (!ns) {
      ns = HTML_NS;
    }
    const map = hasOwnProperty.apply(TYPE_MAP, [ns]) ? TYPE_MAP[ns] : null;
    if (!map) {
      return;
    }
    if (hasOwnProperty.apply(map, [canonicalTag]) &&
        map[canonicalTag] &&
        hasOwnProperty.apply(map[canonicalTag][container], [name]) &&
        map[canonicalTag][container][name]) {
      return map[canonicalTag][container][name];
    }

    if (hasOwnProperty.apply(map, ['*']) &&
        hasOwnProperty.apply(map['*'][container], [name]) &&
        map['*'][container][name]) {
      return map['*'][container][name];
    }
  }

  /**
   * Returns the name of the trusted type required for a given element property.
   * @param {string} tagName The name of the tag of the element.
   * @param {string} property The property.
   * @param {string=} elementNs Element namespace.
   * @return {string?} Required type name or null, if a Trusted
   *   Type is not required.
   */
  function getPropertyType(tagName, property, elementNs = '') {
    // TODO: Support namespaces.
    return getTypeInternal_(
        tagName, 'properties', String(property), elementNs) || null;
  }

  /**
   * Returns the type map-like object, that resolves a name of a type for a
   * given tag + attribute / property in a given namespace.
   * The keys of the map are uppercase tag names. Map entry has mappings between
   * a lowercase attribute name / case-sensitive property name and a name of the
   * type that is required for that attribute / property.
   * Example entry for 'IMG': {"attributes": {"src": "TrustedHTML"}}
   * @param {string=} namespaceUri The namespace URI (will use the current
   *   document namespace URI if omitted).
   * @return {TrustedTypesTypeMap}
   */
  function getTypeMapping(namespaceUri = '') {
    if (!namespaceUri) {
      try {
        namespaceUri = document.documentElement.namespaceURI;
      } catch (e) {
        namespaceUri = HTML_NS;
      }
    }
    /**
     * @template T
     * @private
     * @param {T} o
     * @return {T}
     */
    function deepClone(o) {
      return JSON.parse(JSON.stringify(o));
    }
    const map = TYPE_MAP[namespaceUri];
    if (!map) {
      return {};
    }
    return deepClone(map);
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
   * @return {TrustedTypePolicy} The policy that may create TT objects
   *   according to the policy rules.
   */
  function createPolicy(name, policy) {
    const pName = '' + name; // Assert it's a string

    if (enforceNameWhitelist && allowedNames.indexOf(pName) === -1) {
      throw new TypeError('Policy ' + pName + ' disallowed.');
    }

    if (enforceNameWhitelist && policyNames.indexOf(pName) !== -1) {
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
      console.warn('trustedTypes.createPolicy ' + pName +
          ' was given an empty policy');
    }
    freeze(innerPolicy);

    const wrappedPolicy = wrapPolicy(pName, innerPolicy);

    if (pName === DEFAULT_POLICY_NAME) {
      defaultPolicy = wrappedPolicy;
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

  /**
   * Returns the default policy, or null if it was not created.
   * @return {TrustedTypePolicy}
   */
  function getDefaultPolicy() {
    return defaultPolicy;
  }

  /**
   * Resets the default policy.
   */
  function resetDefaultPolicy() {
    defaultPolicy = null;
    policyNames.splice(policyNames.indexOf(DEFAULT_POLICY_NAME), 1);
  }

  const api = create(TrustedTypePolicyFactory.prototype);
  assign(api, {
    // The main function to create policies.
    createPolicy,

    getPolicyNames,

    // Type checkers, also validating the object was initialized through a
    // policy.
    isHTML: isTrustedTypeChecker(TrustedHTML),
    isURL: isTrustedTypeChecker(TrustedURL),
    isScriptURL: isTrustedTypeChecker(TrustedScriptURL),
    isScript: isTrustedTypeChecker(TrustedScript),

    getAttributeType,
    getPropertyType,
    getTypeMapping,
    emptyHTML,
    defaultPolicy, // Just to make the compiler happy, this is overridden below.

    TrustedHTML: TrustedHTML,
    TrustedURL: TrustedURL,
    TrustedScriptURL: TrustedScriptURL,
    TrustedScript: TrustedScript,
  });

  defineProperty(api, 'defaultPolicy', {
    get: getDefaultPolicy,
    set: () => {},
  });

  return {
    trustedTypes: freeze(api),
    setAllowedPolicyNames,
    getDefaultPolicy,
    resetDefaultPolicy,
  };
};


const {
  trustedTypes,
  setAllowedPolicyNames,
  getDefaultPolicy,
  resetDefaultPolicy,
} = trustedTypesBuilderTestOnly();

/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

const tt = trustedTypes;

/**
 * Sets up the public Trusted Types API in the global object.
 */
function setupPolyfill() {
  // We use array accessors to make sure Closure compiler will not alter the
  // names of the properties..
  if (typeof window === 'undefined') {
    return;
  }
  const rootProperty = 'trustedTypes';

  // Convert old window.TrustedTypes to window.trustedTypes.
  if (window['TrustedTypes'] && typeof window[rootProperty] === 'undefined') {
    window[rootProperty] = Object.freeze(window['TrustedTypes']);
  }

  if (typeof window[rootProperty] !== 'undefined') {
    return;
  }

  const publicApi = Object.create(TrustedTypePolicyFactory.prototype);
  Object.assign(publicApi, {
    'isHTML': tt.isHTML,
    'isURL': tt.isURL,
    'isScriptURL': tt.isScriptURL,
    'isScript': tt.isScript,
    'createPolicy': tt.createPolicy,
    'getPolicyNames': tt.getPolicyNames,
    'getAttributeType': tt.getAttributeType,
    'getPropertyType': tt.getPropertyType,
    'getTypeMapping': tt.getTypeMapping,
    'emptyHTML': tt.emptyHTML,
    '_isPolyfill_': true,
  });
  Object.defineProperty(
      publicApi,
      'defaultPolicy',
      Object.getOwnPropertyDescriptor(tt, 'defaultPolicy') || {});

  window[rootProperty] = Object.freeze(publicApi);

  window['TrustedHTML'] = tt.TrustedHTML;
  window['TrustedURL'] = tt.TrustedURL;
  window['TrustedScriptURL'] = tt.TrustedScriptURL;
  window['TrustedScript'] = tt.TrustedScript;
  window['TrustedTypePolicy'] = TrustedTypePolicy;
  window['TrustedTypePolicyFactory'] = TrustedTypePolicyFactory;
}

setupPolyfill();

module.exports = tt;
