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
import {TrustedTypes, setAllowedPolicyNames} from './trustedtypes.js';

/* eslint-enable no-unused-vars */
import {installFunction, installSetter, installSetterAndGetter}
  from './utils/wrapper.js';

const {apply} = Reflect;
const {
  getOwnPropertyNames,
  getOwnPropertyDescriptor,
  hasOwnProperty,
  getPrototypeOf,
  isPrototypeOf,
} = Object;

const {slice} = String.prototype;

const UrlConstructor = URL.prototype.constructor;

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

/**
 * Checks if the URL is a HTTP(s) URL.
 * @param  {string}  url The URL to check.
 * @return {boolean} True iff the value is a http(s) URL.
 */
function isHttpUrl_(url) {
  const parsedUrl = parseUrl_(url);
  if (!parsedUrl) {
    return false;
  }
  return parsedUrl.protocol == 'http:' || parsedUrl.protocol == 'https:';
}

/**
 * A map of attribute names to allowed types.
 * @type {!Object<string, !Object<string, !Function>>}
 */
let SET_ATTRIBUTE_TYPE_MAP = {
  // TODO(slekies): Add SVG Elements here
  // TODO(koto): Figure out what to to with <link>
  'HTMLAnchorElement': {
    'href': TrustedTypes.TrustedURL,
  },
  'HTMLAreaElement': {
    'href': TrustedTypes.TrustedURL,
  },
  'HTMLBaseElement': {
    'href': TrustedTypes.TrustedURL,
  },
  'HTMLButtonElement': {
    'formaction': TrustedTypes.TrustedURL,
  },
  'HTMLSourceElement': {
    'src': TrustedTypes.TrustedURL,
  },
  'HTMLImageElement': {
    'src': TrustedTypes.TrustedURL,
    // TODO(slekies): add special handling for srcset
  },
  'HTMLTrackElement': {
    'src': TrustedTypes.TrustedURL,
  },
  'HTMLMediaElement': {
    'src': TrustedTypes.TrustedURL,
  },
  'HTMLInputElement': {
    'src': TrustedTypes.TrustedURL,
    'formaction': TrustedTypes.TrustedURL,
  },
  'HTMLFormElement': {
    'action': TrustedTypes.TrustedURL,
  },
  'HTMLFrameElement': {
    'src': TrustedTypes.TrustedURL,
  },
  'HTMLIFrameElement': {
    'src': TrustedTypes.TrustedURL,
    'srcdoc': TrustedTypes.TrustedHTML,
  },
  'HTMLLinkElement': {
    'href': TrustedTypes.TrustedURL,
  },
  'HTMLObjectElement': {
    'data': TrustedTypes.TrustedScriptURL,
    'codebase': TrustedTypes.TrustedScriptURL,
  },
  'HTMLEmbedElement': {
    'src': TrustedTypes.TrustedScriptURL,
  },
  'HTMLScriptElement': {
    'src': TrustedTypes.TrustedScriptURL,
    'text': TrustedTypes.TrustedScript,
  },
  'HTMLElement': {
  },
};

// Edge doesn't support srcdoc.
if (!('srcdoc' in HTMLIFrameElement.prototype)) {
  delete SET_ATTRIBUTE_TYPE_MAP['HTMLIFrameElement']['srcdoc'];
}

// Add inline event handlers property names.
for (let name of getOwnPropertyNames(HTMLElement.prototype)) {
  if (name.slice(0, 2) === 'on') {
    SET_ATTRIBUTE_TYPE_MAP['HTMLElement'][name] = TrustedTypes.TrustedScript;
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

/**
 * @type {function(string):?TrustedTypePolicy}
 */
const getExposedPolicy = TrustedTypes.getExposedPolicy;

/* eslint-disable no-unused-vars */
/**
 * @typedef {TrustedTypePolicy}
 * @property {function(string):TrustedHTML} createHTML
 * @property {function(string):TrustedURL} createURL
 * @property {function(string):TrustedScriptURL} createScriptURL
 * @property {function(string):TrustedScript} createScript
 */
let TrustedTypePolicy = {};
/* eslint-enable no-unused-vars */

/**
 * A map of HTML attribute to element property names.
 * @type {!Object<string, string>}
 */
const ATTR_PROPERTY_MAP = {
  'codebase': 'codeBase',
  'formaction': 'formAction',
};

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

    this.wrapSetter_(Element.prototype, 'innerHTML', TrustedTypes.TrustedHTML);
    this.wrapSetter_(Element.prototype, 'outerHTML', TrustedTypes.TrustedHTML);
    if ('ShadowRoot' in window) {
      this.wrapSetter_(ShadowRoot.prototype, 'innerHTML',
         TrustedTypes.TrustedHTML);
    }
    this.wrapWithEnforceFunction_(Range.prototype, 'createContextualFragment',
        TrustedTypes.TrustedHTML, 0);
    this.wrapWithEnforceFunction_(Element.prototype, 'insertAdjacentHTML',
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

    this.wrapWithEnforceFunction_(window, 'open', TrustedTypes.TrustedURL, 0);
    if ('DOMParser' in window) {
      this.wrapWithEnforceFunction_(DOMParser.prototype, 'parseFromString',
          TrustedTypes.TrustedHTML, 0);
    }
    this.wrapWithEnforceFunction_(window, 'setInterval',
        TrustedTypes.TrustedScript, 0);
    this.wrapWithEnforceFunction_(window, 'setTimeout',
        TrustedTypes.TrustedScript, 0);
    this.wrapSetAttribute_();
    this.installScriptWrappers_();
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

    this.restoreSetter_(Element.prototype, 'innerHTML');
    this.restoreSetter_(Element.prototype, 'outerHTML');
    if ('ShadowRoot' in window) {
      this.restoreSetter_(ShadowRoot.prototype, 'innerHTML');
    }
    this.restoreFunction_(Range.prototype, 'createContextualFragment');
    this.restoreFunction_(Element.prototype, 'insertAdjacentHTML');
    this.restoreFunction_(Element.prototype, 'setAttribute');
    this.restoreFunction_(Element.prototype, 'setAttributeNS');

    if (getOwnPropertyDescriptor(Document.prototype, 'write')) {
      this.restoreFunction_(Document.prototype, 'write');
      this.restoreFunction_(Document.prototype, 'open');
    } else {
      this.restoreFunction_(HTMLDocument.prototype, 'write');
      this.restoreFunction_(HTMLDocument.prototype, 'open');
    }
    this.restoreFunction_(window, 'open');
    if ('DOMParser' in window) {
      this.restoreFunction_(DOMParser.prototype, 'parseFromString');
    }
    this.restoreFunction_(window, 'setTimeout');
    this.restoreFunction_(window, 'setInterval');
    this.uninstallPropertySetWrappers_();
    this.uninstallScriptWrappers_();
  }

  /**
   * Installs wrappers for setting properties of script elements.
   */
  installScriptWrappers_() {
    // HTMLScript element has no own setters for crucial properties, we have to
    // reuse ones from HTMLElement.
    this.wrapSetter_(HTMLScriptElement.prototype, 'innerText',
        TrustedTypes.TrustedScript, HTMLElement.prototype);
    this.wrapSetter_(HTMLScriptElement.prototype, 'textContent',
        TrustedTypes.TrustedScript, Node.prototype);
  }

  /**
   * Uninstalls wrappers for setting properties of script elements.
   */
  uninstallScriptWrappers_() {
    this.restoreSetter_(HTMLScriptElement.prototype, 'innerText',
        HTMLElement.prototype);
    this.restoreSetter_(HTMLScriptElement.prototype, 'textContent',
        Node.prototype);
  }

  /**
   * Installs wrappers for directly setting properties
   * based on SET_ATTRIBUTE_TYPE_MAP.
   * @private
   */
  installPropertySetWrappers_() {
    /* eslint-disable guard-for-in */
    for (let type of getOwnPropertyNames(SET_ATTRIBUTE_TYPE_MAP)) {
      for (let attribute of getOwnPropertyNames(SET_ATTRIBUTE_TYPE_MAP[type])) {
        const property = apply(hasOwnProperty, ATTR_PROPERTY_MAP, [attribute]) ?
              ATTR_PROPERTY_MAP[attribute] : attribute;
        this.wrapSetter_(window[type].prototype, property,
                         SET_ATTRIBUTE_TYPE_MAP[type][attribute]);
      }
    }
  }

  /**
   * Uninstalls wrappers for directly setting properties
   * based on SET_ATTRIBUTE_TYPE_MAP.
   * @private
   */
  uninstallPropertySetWrappers_() {
    /* eslint-disable guard-for-in */
    for (let type of getOwnPropertyNames(SET_ATTRIBUTE_TYPE_MAP)) {
      for (let attribute of getOwnPropertyNames(SET_ATTRIBUTE_TYPE_MAP[type])) {
        const property = attribute in ATTR_PROPERTY_MAP ?
              ATTR_PROPERTY_MAP[attribute] : attribute;
        this.restoreSetter_(window[type].prototype, property);
      }
    }
  }

  /** Wraps set attribute with an enforcement function. */
  wrapSetAttribute_() {
    let that = this;
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
   * Returns the required type for the setAtrtibute call.
   * @param  {!Object} context The object to infer the type of attribute of.
   * @param  {string} attrName The attribute name.
   * @return {Function} The type to enforce, or null if no contract is found.
   */
  getRequiredTypeForAttribute_(context, attrName) {
      let ctor = context.constructor;
      do {
        let type = ctor && ctor.name &&
            SET_ATTRIBUTE_TYPE_MAP[ctor.name] &&
            SET_ATTRIBUTE_TYPE_MAP[ctor.name][attrName];

        if (type || ctor == HTMLElement) {
          // Stop at HTMLElement.
          return /** @type {Function} */ (type);
        }
        // Explore the prototype chain.
      } while (ctor && (ctor = getPrototypeOf(ctor.prototype).constructor));

      return null;
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
    if (context.constructor !== null) {
      let attrName = (args[0] = String(args[0])).toLowerCase();
      let type = this.getRequiredTypeForAttribute_(context, attrName);

      if (type instanceof Function) {
        return this.enforce_(
          context, 'setAttribute', type, originalFn, 1, args);
      }
    }

    return originalFn.apply(context, args);
  }

  /**
   * Enforces type checking for Element.prototype.setAttributeNS.
   * @param {!Object} context The context for the call to the original function.
   * @param {!Function} originalFn The original setAttributeNS function.
   * @return {*}
   */
  setAttributeNSWrapper_(context, originalFn, ...args) {
    /**
     * @param {string} ns the namespace URL.
     * @return {boolean} true iff the given argument is an HTML namespace.
     */
    function isHtmlNamespace(ns) {
      return true; // TODO(msamuel): implement me
    }
    // See the note from setAttributeWrapper_ above.
    if (context.constructor !== null) {
      let ns = (args[0] = String(args[0])).toLowerCase();
      let attrName = (args[1] = String(args[1])).toLowerCase();
      if (isHtmlNamespace(ns)) {
        let type = context.constructor && context.constructor.name &&
            SET_ATTRIBUTE_TYPE_MAP[context.constructor.name] &&
            SET_ATTRIBUTE_TYPE_MAP[context.constructor.name][attrName];

        if (type instanceof Function) {
          return this.enforce_(
            context, 'setAttributeNS', type, originalFn, 2, args);
        }
      }
      // TODO(msamuel): handle SVG namespace.  See TODO(slekies) above.
    }

    return originalFn.apply(context, args);
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
    let that = this;
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
    let descriptor = getOwnPropertyDescriptor(object, name);
    let originalFn = /** @type function(*):* */ (
        descriptor ? descriptor.value : null);

    if (!(originalFn instanceof Function)) {
      throw new TypeError(
          'Property ' + name + ' on object' + object + ' is not a function');
    }

    let key = this.getKey_(object, name);
    if (this.originalSetters_[key]) {
      throw new Error('TrustedTypesEnforcer: Double installation detected');
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

    let descriptor = getOwnPropertyDescriptor(useObject, name);

    let originalSetter = /** @type {function(*):*} */ (descriptor ?
        descriptor.set : null);

    if (!(originalSetter instanceof Function)) {
      throw new TypeError(
          'No setter for property ' + name + ' on object' + object);
    }

    let key = this.getKey_(object, name);
    if (this.originalSetters_[key]) {
      throw new Error('TrustedTypesEnforcer: Double installation detected');
    }
    let that = this;
    /**
     * @this {TrustedTypesEnforcer}
     * @param {*} value
     */
    let enforcingSetter = function(value) {
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
    let key = this.getKey_(object, name);
    if (descriptorObject && !isPrototypeOf.call(descriptorObject, object)) {
      throw new Error('Invalid prototype chain');
    }
    if (!this.originalSetters_[key]) {
      throw new Error(
          'TrustedTypesEnforcer: Cannot restore (double uninstallation?)');
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
    let key = this.getKey_(object, name);
    if (!this.originalSetters_[key]) {
      throw new Error(
          'TrustedTypesEnforcer: Cannot restore (double uninstallation?)');
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
    return '' + object.constructor.name + '-' + name;
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
    let value = args[argNumber];
    const typeName = '' + typeToEnforce.name;
    // If typed value is given, pass through.
    if (TYPE_CHECKER_MAP.hasOwnProperty(typeName) &&
        TYPE_CHECKER_MAP[typeName](value)) {
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


    // Apply url-allow-http
    if (typeToEnforce === TrustedTypes.TrustedURL &&
        this.config_.allowHttpUrls) {
      const url = '' + value;
      if (isHttpUrl_(url)) {
        args[argNumber] = url;
        return apply(originalSetter, context, args);
      }
    }

    // Apply a fallback policy, if it exists.
    const fallback = this.config_.fallbackPolicyName;
    if (fallback) {
      const fallbackPolicy = getExposedPolicy.call(TrustedTypes, fallback);
      if (fallbackPolicy && TYPE_CHECKER_MAP.hasOwnProperty(typeName)) {
        let fallbackValue;
        let exceptionThrown;
        try {
          fallbackValue = fallbackPolicy[TYPE_PRODUCER_MAP[typeName]](value);
        } catch (e) {
          exceptionThrown = true;
        }
        if (!exceptionThrown) {
          args[argNumber] = fallbackValue;
          return apply(originalSetter, context, args);
        }
      }
    }

    let contextName = context.constructor.name || '' + context;
    let message = `Failed to set ${propertyName} on ${contextName}: `
        + `This property requires ${typeName}.`;

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
      if (context.isConnected) {
        context.dispatchEvent(event);
      } else { // Fallback - dispatch an event on base document.
        document.dispatchEvent(event);
      }
    }

    if (this.config_.isEnforcementEnabled) {
      throw new TypeError(message);
    } else { // pass-through
      return apply(originalSetter, context, args);
    }
  }
}
