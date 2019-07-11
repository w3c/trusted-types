/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

/* eslint-disable no-unused-vars */
import {DIRECTIVE_NAME, TrustedTypeConfig} from './data/trustedtypeconfig.js';
import {
  TrustedTypes,
  setAllowedPolicyNames,
  getDefaultPolicy,
  resetDefaultPolicy,
  HTML_NS,
} from
  './trustedtypes.js';

/* eslint-enable no-unused-vars */
import {installFunction, installSetter, installSetterAndGetter}
  from './utils/wrapper.js';

const {apply} = Reflect;
const {
  getOwnPropertyNames,
  getOwnPropertyDescriptor,
  getPrototypeOf,
} = Object;

const {
  hasOwnProperty,
  isPrototypeOf,
} = Object.prototype;

const {slice} = String.prototype;

// No URL in IE 11.
const UrlConstructor = typeof window.URL == 'function' ?
    URL.prototype.constructor :
    null;

let stringifyForRangeHack;

/**
 * Return object constructor name
 * (their function.name is not available in IE 11).
 * @param {*} fn
 * @return {string}
 * @private
 */
const getConstructorName_ = document.createElement('div').constructor.name ?
    (fn) => fn.name :
    (fn) => ('' + fn).match(/^\[object (\S+)\]$/)[1];

// window.open on IE 11 is set on WindowPrototype
const windowOpenObject = getOwnPropertyDescriptor(window, 'open') ?
  window :
  window.constructor.prototype;

// In IE 11, insertAdjacent(HTML|Text) is on HTMLElement prototype
const insertAdjacentObject = apply(hasOwnProperty, Element.prototype,
    ['insertAdjacentHTML']) ? Element.prototype : HTMLElement.prototype;

// This is not available in release Firefox :(
// https://developer.mozilla.org/en-US/docs/Web/API/SecurityPolicyViolationEvent
// https://bugzilla.mozilla.org/show_bug.cgi?id=1432523
const SecurityPolicyViolationEvent = window['SecurityPolicyViolationEvent'] ||
  null;

/**
 * Parses URL, catching all the errors.
 * @param  {string} url URL string to parse.
 * @return {URL|null}
 */
function parseUrl_(url) {
  try {
    return new UrlConstructor(url, document.baseURI || undefined);
  } catch (e) {
    return null;
  }
}

// We don't actually need other namespaces.
// setAttribute is hooked on Element.prototype, which all elements inherit from,
// and all sensitive property wrappers are hooked directly on Element as well.
const typeMap = TrustedTypes.getTypeMapping(HTML_NS);

const STRING_TO_TYPE = {
  'TrustedHTML': TrustedTypes.TrustedHTML,
  'TrustedScript': TrustedTypes.TrustedScript,
  'TrustedScriptURL': TrustedTypes.TrustedScriptURL,
  'TrustedURL': TrustedTypes.TrustedURL,
};

/**
 * Converts an uppercase tag name to an element constructor function name.
 * Used for property setter hijacking only.
 * @param {string} tagName
 * @return {string}
 */
function convertTagToConstructor(tagName) {
  if (tagName == '*') {
    return 'HTMLElement';
  }
  return getConstructorName_(document.createElement(tagName).constructor);
}

for (const tagName of Object.keys(typeMap)) {
  const attrs = typeMap[tagName]['properties'];
  for (const [k, v] of Object.entries(attrs)) {
    attrs[k] = STRING_TO_TYPE[v];
  }
}

/**
 * Map of type names to type checking function.
 * @type {!Object<string,!Function>}
 */
const TYPE_CHECKER_MAP = {
  'TrustedHTML': TrustedTypes.isHTML,
  'TrustedURL': TrustedTypes.isURL,
  'TrustedScriptURL': TrustedTypes.isScriptURL,
  'TrustedScript': TrustedTypes.isScript,
};

/**
 * Map of type names to type producing function.
 * @type {Object<string,string>}
 */
const TYPE_PRODUCER_MAP = {
  'TrustedHTML': 'createHTML',
  'TrustedURL': 'createURL',
  'TrustedScriptURL': 'createScriptURL',
  'TrustedScript': 'createScript',
};

/* eslint-disable no-unused-vars */
/**
 * @typedef {TrustedTypePolicy}
 * @property {function(string):TrustedHTML} createHTML
 * @property {function(string):TrustedURL} createURL
 * @property {function(string):TrustedScriptURL} createScriptURL
 * @property {function(string):TrustedScript} createScript
 */
const TrustedTypePolicy = {};
/* eslint-enable no-unused-vars */


/**
 * An object for enabling trusted type enforcement.
 */
export class TrustedTypesEnforcer {
  /**
   * @param {!TrustedTypeConfig} config The configuration for
   * trusted type enforcement.
   */
  constructor(config) {
    /**
     * A configuration for the trusted type enforcement.
     * @private {!TrustedTypeConfig}
     */
    this.config_ = config;
    /**
     * @private {Object<string, function(*): *|undefined>}
     */
    this.originalSetters_ = {};
  }

  /**
   * Wraps HTML sinks with an enforcement setter, which will enforce
   * trusted types and do logging, if enabled.
   *
   */
  install() {
    setAllowedPolicyNames(this.config_.allowedPolicyNames);

    if (!this.config_.isEnforcementEnabled && !this.config_.isLoggingEnabled) {
      return;
    }

    if ('ShadowRoot' in window) {
      this.wrapSetter_(ShadowRoot.prototype, 'innerHTML',
          TrustedTypes.TrustedHTML);
    }
    stringifyForRangeHack = (function(doc) {
      const r = doc.createRange();
      // In IE 11 Range.createContextualFragment doesn't stringify its argument.
      const f = r.createContextualFragment(/** @type {string} */ (
        {toString: () => '<div></div>'}));
      return f.childNodes.length == 0;
    })(document);

    this.wrapWithEnforceFunction_(Range.prototype, 'createContextualFragment',
        TrustedTypes.TrustedHTML, 0);

    this.wrapWithEnforceFunction_(insertAdjacentObject,
        'insertAdjacentHTML',
        TrustedTypes.TrustedHTML, 1);

    if (getOwnPropertyDescriptor(Document.prototype, 'write')) {
      // Chrome
      this.wrapWithEnforceFunction_(Document.prototype, 'write',
          TrustedTypes.TrustedHTML, 0);
      this.wrapWithEnforceFunction_(Document.prototype, 'open',
          TrustedTypes.TrustedURL, 0);
    } else {
      // Firefox
      this.wrapWithEnforceFunction_(HTMLDocument.prototype, 'write',
          TrustedTypes.TrustedHTML, 0);
      this.wrapWithEnforceFunction_(HTMLDocument.prototype, 'open',
          TrustedTypes.TrustedURL, 0);
    }

    this.wrapWithEnforceFunction_(windowOpenObject, 'open',
        TrustedTypes.TrustedURL, 0);

    if ('DOMParser' in window) {
      this.wrapWithEnforceFunction_(DOMParser.prototype, 'parseFromString',
          TrustedTypes.TrustedHTML, 0);
    }
    this.wrapWithEnforceFunction_(window, 'setInterval',
        TrustedTypes.TrustedScript, 0);
    this.wrapWithEnforceFunction_(window, 'setTimeout',
        TrustedTypes.TrustedScript, 0);
    this.wrapSetAttribute_();
    this.installScriptMutatorGuards_();
    this.installPropertySetWrappers_();
  }

  /**
   * Removes the original setters.
   */
  uninstall() {
    setAllowedPolicyNames(['*']);

    if (!this.config_.isEnforcementEnabled && !this.config_.isLoggingEnabled) {
      return;
    }

    if ('ShadowRoot' in window) {
      this.restoreSetter_(ShadowRoot.prototype, 'innerHTML');
    }
    this.restoreFunction_(Range.prototype, 'createContextualFragment');
    this.restoreFunction_(insertAdjacentObject, 'insertAdjacentHTML');
    this.restoreFunction_(Element.prototype, 'setAttribute');
    this.restoreFunction_(Element.prototype, 'setAttributeNS');

    if (getOwnPropertyDescriptor(Document.prototype, 'write')) {
      this.restoreFunction_(Document.prototype, 'write');
      this.restoreFunction_(Document.prototype, 'open');
    } else {
      this.restoreFunction_(HTMLDocument.prototype, 'write');
      this.restoreFunction_(HTMLDocument.prototype, 'open');
    }
    this.restoreFunction_(windowOpenObject, 'open');

    if ('DOMParser' in window) {
      this.restoreFunction_(DOMParser.prototype, 'parseFromString');
    }
    this.restoreFunction_(window, 'setTimeout');
    this.restoreFunction_(window, 'setInterval');
    this.uninstallPropertySetWrappers_();
    this.uninstallScriptMutatorGuards_();
    resetDefaultPolicy();
  }

  /**
   * Installs type-enforcing wrappers for APIs that allow to modify
   * script element texts.
   * @private
   */
  installScriptMutatorGuards_() {
    const that = this;

    ['appendChild', 'insertBefore', 'replaceChild'].forEach((fnName) => {
      this.wrapFunction_(
          Node.prototype,
          fnName,
          /**
         * @this {TrustedTypesEnforcer}
         * @param {function(!Function, ...*)} originalFn
         * @return {*}
         */
          function(originalFn, ...args) {
            return that.enforceTypeInScriptNodes_
                .bind(that, this, /* checkParent */ false, originalFn)
                .apply(that, args);
          });
    });
    this.wrapFunction_(
        insertAdjacentObject,
        'insertAdjacentText',
        /**
         * @this {TrustedTypesEnforcer}
         * @param {function(!Function, ...*)} originalFn
         * @return {*}
         */
        function(originalFn, ...args) {
          return that.insertAdjacentTextWrapper_
              .bind(that, this, originalFn)
              .apply(that, args);
        });

    if ('after' in Element.prototype) {
      ['after', 'before', 'replaceWith'].forEach((fnName) => {
        this.wrapFunction_(
            Element.prototype,
            fnName,
            /**
           * @this {TrustedTypesEnforcer}
           * @param {function(!Function, ...*)} originalFn
           * @return {*}
           */
            function(originalFn, ...args) {
              return that.enforceTypeInScriptNodes_
                  .bind(that, this, /* checkParent */ true, originalFn)
                  .apply(that, args);
            });
      });
      ['append', 'prepend'].forEach((fnName) => {
        this.wrapFunction_(
            Element.prototype,
            fnName,
            /**
           * @this {TrustedTypesEnforcer}
           * @param {function(!Function, ...*)} originalFn
           * @return {*}
           */
            function(originalFn, ...args) {
              return that.enforceTypeInScriptNodes_
                  .bind(that, this, /* checkParent */ false, originalFn)
                  .apply(that, args);
            });
      });
    }
  }

  /**
   * Uninstalls type-enforcing wrappers for APIs that allow to modify
   * script element texts.
   * @private
   */
  uninstallScriptMutatorGuards_() {
    this.restoreFunction_(Node.prototype, 'appendChild');
    this.restoreFunction_(Node.prototype, 'insertBefore');
    this.restoreFunction_(Node.prototype, 'replaceChild');
    this.restoreFunction_(insertAdjacentObject, 'insertAdjacentText');
    if ('after' in Element.prototype) {
      ['after', 'before', 'replaceWith', 'append', 'prepend'].forEach(
          (fnName) => this.restoreFunction_(Element.prototype, fnName));
    }
  }

  /**
   * Installs wrappers for directly setting properties
   * based on the type map.
   * @private
   */
  installPropertySetWrappers_() {
    /* eslint-disable guard-for-in */
    for (const tag of getOwnPropertyNames(typeMap)) {
      for (const property of getOwnPropertyNames(typeMap[tag]['properties'])) {
        this.wrapSetter_(
            window[convertTagToConstructor(tag)].prototype,
            property,
            typeMap[tag]['properties'][property]);
      }
    }
  }

  /**
   * Uninstalls wrappers for directly setting properties
   * based on the type map.
   * @private
   */
  uninstallPropertySetWrappers_() {
    /* eslint-disable guard-for-in */
    for (const tag of getOwnPropertyNames(typeMap)) {
      for (const property of getOwnPropertyNames(typeMap[tag]['properties'])) {
        this.restoreSetter_(
            window[convertTagToConstructor(tag)].prototype,
            property);
      }
    }
  }

  /** Wraps set attribute with an enforcement function. */
  wrapSetAttribute_() {
    const that = this;
    this.wrapFunction_(
        Element.prototype,
        'setAttribute',
        /**
         * @this {TrustedTypesEnforcer}
         * @param {function(!Function, ...*)} originalFn
         * @return {*}
         */
        function(originalFn, ...args) {
          return that.setAttributeWrapper_
              .bind(that, this, originalFn)
              .apply(that, args);
        });
    this.wrapFunction_(
        Element.prototype,
        'setAttributeNS',
        /**
         * @this {TrustedTypesEnforcer}
         * @param {function(!Function, ...*)} originalFn
         * @return {*}
         */
        function(originalFn, ...args) {
          return that.setAttributeNSWrapper_
              .bind(that, this, originalFn)
              .apply(that, args);
        });
  }

  /**
   * Enforces type checking for Element.prototype.setAttribute.
   * @param {!Object} context The context for the call to the original function.
   * @param {!Function} originalFn The original setAttribute function.
   * @return {*}
   */
  setAttributeWrapper_(context, originalFn, ...args) {
    // Note(slekies): In a normal application constructor should never be null.
    // However, there are no guarantees. If the constructor is null, we cannot
    // determine whether a special type is required. In order to not break the
    // application, we will not do any further type checks and pass the call
    // to setAttribute.
    if (context.constructor !== null && context instanceof Element) {
      const attrName = (args[0] = String(args[0])).toLowerCase();
      const requiredType = TrustedTypes.getAttributeType(context.tagName,
          attrName, context.namespaceURI);
      if (requiredType && apply(hasOwnProperty, STRING_TO_TYPE,
          [requiredType])) {
        return this.enforce_(
            context, 'setAttribute', STRING_TO_TYPE[requiredType],
            originalFn, 1, args);
      }
    }
    return apply(originalFn, context, args);
  }

  /**
   * Enforces type checking for Element.prototype.setAttributeNS.
   * @param {!Object} context The context for the call to the original function.
   * @param {!Function} originalFn The original setAttributeNS function.
   * @return {*}
   */
  setAttributeNSWrapper_(context, originalFn, ...args) {
    // See the note from setAttributeWrapper_ above.
    if (context.constructor !== null && context instanceof Element) {
      const ns = args[0] ? String(args[0]) : null;
      args[0] = ns;
      const attrName = (args[1] = String(args[1])).toLowerCase();
      const requiredType = TrustedTypes.getAttributeType(context.tagName,
          attrName, context.namespaceURI, ns);
      if (requiredType && apply(hasOwnProperty, STRING_TO_TYPE,
          [requiredType])) {
        return this.enforce_(context, 'setAttributeNS',
            STRING_TO_TYPE[requiredType],
            originalFn, 2, args);
      }
    }
    return apply(originalFn, context, args);
  }

  /**
   * Wrapper for DOM mutator functions that enforces type checks if the context
   * (or, optionally, its parent node) is a script node.
   * For each argument, it will make sure that text nodes pass through a
   * default policy, or generate a violation. To skip that check, pass
   * TrustedScript objects instead.
   * @param {!Object} context The context for the call to the original function.
   * @param {boolean} checkParent Check parent of context instead.
   * @param {!Function} originalFn The original mutator function.
   * @return {*}
   */
  enforceTypeInScriptNodes_(context, checkParent, originalFn, ...args) {
    const objToCheck = checkParent ? context.parentNode : context;
    if (objToCheck instanceof HTMLScriptElement && args.length > 0) {
      for (let argNumber = 0; argNumber < args.length; argNumber++) {
        let arg = args[argNumber];
        if (arg instanceof Node && arg.nodeType !== Node.TEXT_NODE) {
          continue; // Type is not interesting
        }
        if (arg instanceof Node && arg.nodeType == Node.TEXT_NODE) {
          arg = arg.textContent;
        } else if (TrustedTypes.isScript(arg)) {
          // TODO(koto): Consider removing this branch, as it's hard to spec.
          // Convert to text node and go on.
          args[argNumber] = document.createTextNode(arg);
          continue;
        }

        // Try to run a default policy on argsthe argument
        let fallbackValue;
        let exceptionThrown;
        try {
          fallbackValue = this.maybeCallDefaultPolicy_('TrustedScript', arg);
        } catch (e) {
          exceptionThrown = true;
        }
        if (exceptionThrown) {
          this.processViolation_(context, originalFn.name,
              TrustedTypes.TrustedScript, arg);
        }
        args[argNumber] = document.createTextNode('' + fallbackValue);
      }
    }
    return apply(originalFn, context, args);
  }

  /**
   * Wrapper for Element.insertAdjacentText that enforces type checks for
   * inserting text into a script node.
   * @param {!Object} context The context for the call to the original function.
   * @param {!Function} originalFn The original insertAdjacentText function.
   */
  insertAdjacentTextWrapper_(context, originalFn, ...args) {
    const riskyPositions = ['beforebegin', 'afterend'];
    if (context instanceof Element &&
        context.parentElement instanceof HTMLScriptElement &&
        args.length > 1 &&
        riskyPositions.includes(args[0]) &&
        !(TrustedTypes.isScript(args[1]))) {
      // Run a default policy on args[1]
      let fallbackValue;
      let exceptionThrown;
      try {
        fallbackValue = this.maybeCallDefaultPolicy_('TrustedScript',
            args[1]);
      } catch (e) {
        exceptionThrown = true;
      }
      if (exceptionThrown) {
        this.processViolation_(context, 'insertAdjacentText',
            TrustedTypes.TrustedScript, args[1]);
      }

      const textNode = document.createTextNode('' + fallbackValue);


      const insertBefore = /** @type function(this: Node) */(
        this.originalSetters_[this.getKey_(Node.prototype, 'insertBefore')]);

      switch (args[0]) {
        case riskyPositions[0]: // 'beforebegin'
          apply(insertBefore, context.parentElement,
              [textNode, context]);
          break;
        case riskyPositions[1]: // 'afterend'
          apply(insertBefore, context.parentElement,
              [textNode, context.nextSibling]);
          break;
      }
      return;
    }
    apply(originalFn, context, args);
  }

  /**
   * Wraps a setter with the enforcement wrapper.
   * @param {!Object} object The object of the to-be-wrapped property.
   * @param {string} name The name of the property.
   * @param {!Function} type The type to enforce.
   * @param {number} argNumber Number of the argument to enforce the type of.
   * @private
   */
  wrapWithEnforceFunction_(object, name, type, argNumber) {
    const that = this;
    this.wrapFunction_(
        object,
        name,
        /**
         * @this {TrustedTypesEnforcer}
         * @param {function(!Function, ...*)} originalFn
         * @return {*}
         */
        function(originalFn, ...args) {
          return that.enforce_.call(that, this, name, type, originalFn,
              argNumber, args);
        });
  }


  /**
   * Wraps an existing function with a given function body and stores the
   * original function.
   * @param {!Object} object The object of the to-be-wrapped property.
   * @param {string} name The name of the property.
   * @param {function(!Function, ...*)} functionBody The wrapper function.
   */
  wrapFunction_(object, name, functionBody) {
    const descriptor = getOwnPropertyDescriptor(object, name);
    const originalFn = /** @type function(*):* */ (
        descriptor ? descriptor.value : null);

    if (!(originalFn instanceof Function)) {
      throw new TypeError(
          'Property ' + name + ' on object' + object + ' is not a function');
    }

    const key = this.getKey_(object, name);
    if (this.originalSetters_[key]) {
      throw new Error(
          `TrustedTypesEnforcer: Double installation detected: ${key} ${name}`);
    }
    installFunction(
        object,
        name,
        /**
         * @this {TrustedTypesEnforcer}
         * @return {*}
         */
        function(...args) {
          return functionBody.bind(this, originalFn).apply(this, args);
        });
    this.originalSetters_[key] = originalFn;
  }

  /**
   * Wraps a setter with the enforcement wrapper.
   * @param {!Object} object The object of the to-be-wrapped property.
   * @param {string} name The name of the property.
   * @param {!Function} type The type to enforce.
   * @param {!Object=} descriptorObject If present, will reuse the
   *   setter/getter from this one, instead of object. Used for redefining
   *   setters in subclasses.
   * @private
   */
  wrapSetter_(object, name, type, descriptorObject = undefined) {
    if (descriptorObject && !isPrototypeOf.call(descriptorObject, object)) {
      throw new Error('Invalid prototype chain');
    }

    let useObject = descriptorObject || object;
    let descriptor;
    let originalSetter;
    const stopAt = getPrototypeOf(Node.prototype);

    // Find the descriptor on the object or its prototypes, stopping at Node.
    do {
      descriptor = getOwnPropertyDescriptor(useObject, name);
      originalSetter = /** @type {function(*):*} */ (descriptor ?
          descriptor.set : null);
      if (!originalSetter) {
        useObject = getPrototypeOf(useObject) || stopAt;
      }
    } while (!(originalSetter || useObject === stopAt || !useObject));

    if (!(originalSetter instanceof Function)) {
      throw new TypeError(
          'No setter for property ' + name + ' on object' + object);
    }

    const key = this.getKey_(object, name);
    if (this.originalSetters_[key]) {
      throw new Error(
          `TrustedTypesEnforcer: Double installation detected: ${key} ${name}`);
    }
    const that = this;
    /**
     * @this {TrustedTypesEnforcer}
     * @param {*} value
     */
    const enforcingSetter = function(value) {
      that.enforce_.call(that, this, name, type, originalSetter, 0,
          [value]);
    };

    if (useObject === object) {
      installSetter(
          object,
          name,
          enforcingSetter);
    } else {
      // Since we're creating a new setter in subclass, we also need to
      // overwrite the getter.
      installSetterAndGetter(
          object,
          name,
          enforcingSetter,
          descriptor.get
      );
    }
    this.originalSetters_[key] = originalSetter;
  }

  /**
   * Restores the original setter for the property, as encountered during
   * install().
   * @param {!Object} object The object of the to-be-wrapped property.
   * @param {string} name The name of the property.
   * @param {!Object=} descriptorObject If present, will restore the original
   *   setter/getter from this one, instead of object.
   * @private
   */
  restoreSetter_(object, name, descriptorObject = undefined) {
    const key = this.getKey_(object, name);
    if (descriptorObject && !isPrototypeOf.call(descriptorObject, object)) {
      throw new Error('Invalid prototype chain');
    }
    if (!this.originalSetters_[key]) {
      throw new Error(
          // eslint-disable-next-line max-len
          `TrustedTypesEnforcer: Cannot restore (double uninstallation?): ${key} ${name}`);
    }
    if (descriptorObject) {
      // We have to also overwrite a getter.
      installSetterAndGetter(object, name, this.originalSetters_[key],
          getOwnPropertyDescriptor(descriptorObject, name).get);
    } else {
      installSetter(object, name, this.originalSetters_[key]);
    }
    delete this.originalSetters_[key];
  }

  /**
   * Restores the original method of an object, as encountered during install().
   * @param {!Object} object The object of the to-be-wrapped property.
   * @param {string} name The name of the property.
   * @private
   */
  restoreFunction_(object, name) {
    const key = this.getKey_(object, name);
    if (!this.originalSetters_[key]) {
      throw new Error(
          // eslint-disable-next-line max-len
          `TrustedTypesEnforcer: Cannot restore (double uninstallation?): ${key} ${name}`);
    }
    installFunction(object, name, this.originalSetters_[key]);
    delete this.originalSetters_[key];
  }

  /**
   * Returns the key name for caching original setters.
   * @param {!Object} object The object of the to-be-wrapped property.
   * @param {string} name The name of the property.
   * @return {string} Key name.
   * @private
   */
  getKey_(object, name) {
    // TODO(msamuel): Can we use Object.prototype.toString.call(object)
    // to get an unspoofable string here?
    // TODO(msamuel): fail on '-' in object.constructor.name?
    // No Function.name in IE 11
    const ctrName = '' + (
      object.constructor.name ?
      object.constructor.name :
      object.constructor);
    return ctrName + '-' + name;
  }


  /**
   * Calls a default policy.
   * @param {string} typeName Type name to attempt to produce from a value.
   * @param {*} value The value to pass to a default policy
   * @throws {Error} If the default policy throws, or not exist.
   * @return {Function} The trusted value.
   */
  maybeCallDefaultPolicy_(typeName, value) {
    // Apply a fallback policy, if it exists.
    const fallbackPolicy = getDefaultPolicy.call(TrustedTypes);
    if (!fallbackPolicy) {
      throw new Error('Default policy does not exist');
    }
    if (!TYPE_CHECKER_MAP.hasOwnProperty(typeName)) {
      throw new Error();
    }
    return fallbackPolicy[TYPE_PRODUCER_MAP[typeName]](value);
  }

  /**
   * Logs and enforces TrustedTypes depending on the given configuration.
   * @template T
   * @param {!Object} context The object that the setter is called for.
   * @param {string} propertyName The name of the property.
   * @param {!Function} typeToEnforce The type to enforce.
   * @param {function(?):T} originalSetter Original setter.
   * @param {number} argNumber Number of argument to enforce the type of.
   * @param {Array} args Arguments.
   * @return {T}
   * @private
   */
  enforce_(context, propertyName, typeToEnforce, originalSetter, argNumber,
      args) {
    const value = args[argNumber];
    const typeName = '' + typeToEnforce.name;
    // If typed value is given, pass through.
    if (TYPE_CHECKER_MAP.hasOwnProperty(typeName) &&
        TYPE_CHECKER_MAP[typeName](value)) {
      if (stringifyForRangeHack &&
            propertyName == 'createContextualFragment') {
        // IE 11 hack, somehow the value is not stringified implicitly.
        args[argNumber] = args[argNumber].toString();
      }
      return apply(originalSetter, context, args);
    }

    if (typeToEnforce === TrustedTypes.TrustedScript) {
      const isInlineEventHandler =
          propertyName == 'setAttribute' ||
          propertyName === 'setAttributeNS' ||
          apply(slice, propertyName, [0, 2]) === 'on';
      // If a function (instead of string) is passed to inline event attribute,
      // or set(Timeout|Interval), pass through.
      const propertyAcceptsFunctions =
          propertyName === 'setInterval' ||
          propertyName === 'setTimeout' ||
          isInlineEventHandler;
      if ((propertyAcceptsFunctions && typeof value === 'function') ||
          (isInlineEventHandler && value === null)) {
        return apply(originalSetter, context, args);
      }
    }

    // Apply a fallback policy, if it exists.
    let fallbackValue;
    let exceptionThrown;
    try {
      fallbackValue = this.maybeCallDefaultPolicy_(typeName, value);
    } catch (e) {
      exceptionThrown = true;
    }
    if (!exceptionThrown) {
      args[argNumber] = fallbackValue;
      return apply(originalSetter, context, args);
    }

    // This will throw a TypeError if enforcement is enabled.
    this.processViolation_(context, propertyName, typeToEnforce, value);

    return apply(originalSetter, context, args);
  }

  /**
   * Report a TT violation.
   * @param {!Object} context The object that the setter is called for.
   * @param {string} propertyName The name of the property.
   * @param {!Function} typeToEnforce The type to enforce.
   * @param {string} value The value that was violated the restrictions.
   * @throws {TypeError} if the enforcement is enabled.
   */
  processViolation_(context, propertyName, typeToEnforce, value) {
    const contextName = getConstructorName_(context.constructor) ||
        '' + context;
    const message = `Failed to set ${propertyName} on ${contextName}: `
        + `This property requires ${typeToEnforce.name}.`;

    if (this.config_.isLoggingEnabled) {
      // eslint-disable-next-line no-console
      console.warn(message, propertyName, context, typeToEnforce, value);
    }

    // Unconditionally dispatch an event.
    if (typeof SecurityPolicyViolationEvent == 'function') {
      let blockedURI = '';
      if (typeToEnforce === TrustedTypes.TrustedURL ||
          typeToEnforce === TrustedTypes.TrustedScriptURL) {
        blockedURI = parseUrl_(value) || '';
        if (blockedURI) {
          blockedURI = blockedURI.href;
        }
      }
      const valueSlice = apply(slice, '' + value, [0, 40]);
      const event = new SecurityPolicyViolationEvent(
          'securitypolicyviolation',
          {
            'bubbles': true,
            'blockedURI': blockedURI,
            'disposition': this.config_.isEnforcementEnabled ?
              'enforce' : 'report',
            'documentURI': document.location.href,
            'effectiveDirective': DIRECTIVE_NAME,
            'originalPolicy': this.config_.cspString,
            'statusCode': 0,
            'violatedDirective': DIRECTIVE_NAME,
            'sample': `${contextName}.${propertyName} ${valueSlice}`,
          });
      if (context instanceof Node && context.isConnected) {
        context.dispatchEvent(event);
      } else { // Fallback - dispatch an event on base document.
        document.dispatchEvent(event);
      }
    }

    if (this.config_.isEnforcementEnabled) {
      throw new TypeError(message);
    }
  }
}
