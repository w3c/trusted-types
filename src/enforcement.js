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

goog.provide('trustedtypes.TrustedTypesEnforcer');

goog.require('trustedtypes.data.TrustedTypeConfig');
goog.require('trustedtypes.types.TrustedHTML');
goog.require('trustedtypes.types.TrustedURL');
goog.require('trustedtypes.types.TrustedScriptURL');
goog.require('trustedtypes.utils.wrapper');

/**
 * An object for enabling trusted type enforcement.
 * @param {!trustedtypes.data.TrustedTypeConfig} config The configuration for
 * trusted type enforcement.
 * @constructor
 */
trustedtypes.TrustedTypesEnforcer = function(config) {
  /**
   * A configuration for the trusted type enforcement.
   * @private {!trustedtypes.data.TrustedTypeConfig}
   */
  this.config_ = config;
  /**
   * @private {Object<string, !function(*): *|undefined>}
   */
  this.originalSetters_ = {};
};

/**
 * A map of attribute names to allowed types.
 * @type {Object<string, Object<string, !Function>>}
 */
trustedtypes.TrustedTypesEnforcer.SET_ATTRIBUTE_TYPE_MAP = {
    // TODO(slekies): Add event handlers
    // TODO(slekies): add SVG Elements here
    'HTMLAnchorElement': {
        'href': window['TrustedURL'],
    },
    'HTMLAreaElement': {
        'href': window['TrustedURL'],
    },
    'HTMLBaseElement': {
        'href': window['TrustedURL'],
    },
    'HTMLSourceElement': {
        'src': window['TrustedURL'],
    },
    'HTMLImageElement': {
        'src': window['TrustedURL'],
        // TODO(slekies): add special handling for srcset
    },
    'HTMLTrackElement': {
        'src': window['TrustedURL'],
    },
    'HTMLMediaElement': {
        'src': window['TrustedURL'],
    },
    'HTMLInputElement': {
        'src': window['TrustedURL'],
    },
    'HTMLFrameElement': {
        'src': window['TrustedURL'],
    },
    'HTMLIFrameElement': {
        'src': window['TrustedURL'],
        'srcdoc': window['TrustedHTML'],
    },
    'HTMLLinkElement': {
        'href': window['TrustedScriptURL'],
    },
    'HTMLObjectElement': {
        'data': window['TrustedScriptURL'],
        'codebase': window['TrustedScriptURL'],
    },
    'HTMLEmbedElement': {
        'src': window['TrustedScriptURL'],
    },
    'HTMLScriptElement': {
        'src': window['TrustedScriptURL'],
    },
};


/**
 * Wraps HTML sinks with an enforcement setter, which will enforce trusted types
 * and do logging, if enabled.
 */
trustedtypes.TrustedTypesEnforcer.prototype.install = function() {
  this.wrapSetter_(Element.prototype, 'innerHTML', window['TrustedHTML']);
  this.wrapSetter_(Element.prototype, 'outerHTML', window['TrustedHTML']);
  this.wrapSetter_(HTMLIFrameElement.prototype, 'srcdoc',
      window['TrustedHTML']);
  this.wrapSetter_(HTMLScriptElement.prototype, 'src',
      window['TrustedScriptURL']);
  this.wrapWithEnforceFunction_(Range.prototype, 'createContextualFragment',
      window['TrustedHTML'], 0);
  this.wrapWithEnforceFunction_(Element.prototype, 'insertAdjacentHTML',
      window['TrustedHTML'], 1);
  this.wrapSetAttribute_();
};

/**
 * Removes the original setters.
 */
trustedtypes.TrustedTypesEnforcer.prototype.uninstall = function() {
  this.restoreSetter_(Element.prototype, 'innerHTML');
  this.restoreSetter_(Element.prototype, 'outerHTML');
  this.restoreSetter_(HTMLIFrameElement.prototype, 'srcdoc');
  this.restoreSetter_(HTMLScriptElement.prototype, 'src');
  this.restoreFunction_(Range.prototype, 'createContextualFragment');
  this.restoreFunction_(Element.prototype, 'insertAdjacentHTML');
  this.restoreFunction_(Element.prototype, 'setAttribute');
};

/** Wraps set attribute with an enforcement function. */
trustedtypes.TrustedTypesEnforcer.prototype.wrapSetAttribute_ =
    function() {
  let that = this;
  this.wrapFunction_(
      Element.prototype,
      'setAttribute',
      function(originalFn, ...args) {
        that.setAttributeWrapper_
            .bind(that, this, originalFn)
            .apply(that, args);
      });
};

/**
 * Enforces type checking for Element.prototype.setAttribute.
 * @param {!Object} context The context for the call to the original function.
 * @param {!Function} originalFn The original setAttribute function.
 * @return {*}
 */
trustedtypes.TrustedTypesEnforcer.prototype.setAttributeWrapper_ =
    function(context, originalFn, ...args) {
  // Note(slekies): In a normal application constructor should never be null.
  // However, there are no guarantees. If the constructor is null, we cannot
  // determine whether a special type is required. In order to not break the
  // application, we will not do any further type checks and pass the call
  // to setAttribute.
  if (context.constructor === null) {
    return originalFn.apply(context, args);
  }

  let name = args[0];
  let type =
    trustedtypes.TrustedTypesEnforcer.SET_ATTRIBUTE_TYPE_MAP[
        context.constructor.name][name];

  return this.enforce_
      .call(this, context, 'setAttribute', type, originalFn, 1, args);
};


/**
 * Wraps a setter with the enforcement wrapper.
 * @param {!Object} object The object of the to-be-wrapped property.
 * @param {string} name The name of the property.
 * @param {!Function} type The type to enforce.
 * @param {number} argNumber Number of the argument to enforce the type of.
 * @private
 */
trustedtypes.TrustedTypesEnforcer.prototype.wrapWithEnforceFunction_ =
    function(object, name, type, argNumber) {
  let that = this;
  this.wrapFunction_(
      object,
      name,
      function(originalFn, ...args) {
        return that.enforce_.call(that, this, name, type, originalFn, argNumber,
            args);
      });
};


/**
 * Wraps an existing function with a given function body and stores the original
 * function.
 * @param {!Object} object The object of the to-be-wrapped property.
 * @param {string} name The name of the property.
 * @param {!Function<!Function, *>} functionBody The wrapper function.
 */
trustedtypes.TrustedTypesEnforcer.prototype.wrapFunction_ =
    function(object, name, functionBody) {
  let originalFn = /** @type function(*):* */ (
      Object.getOwnPropertyDescriptor(object, name).value);

  if (!(originalFn instanceof Function)) {
    throw new TypeError(
        'Property ' + name + ' on object' + object + ' is not a function');
  }

  let key = this.getKey_(object, name);
  if (this.originalSetters_[key]) {
    throw new Error('TrustedTypesEnforcer: Double installation detected');
  }
  trustedtypes.utils.wrapper.installFunction(
      object, name, function(...args) {
  return functionBody.bind(this, originalFn).apply(this, args);
});
  this.originalSetters_[key] = originalFn;
};

/**
 * Wraps a setter with the enforcement wrapper.
 * @param {!Object} object The object of the to-be-wrapped property.
 * @param {string} name The name of the property.
 * @param {!Function} type The type to enforce.
 * @private
 */
trustedtypes.TrustedTypesEnforcer.prototype.wrapSetter_ =
    function(object, name, type) {
  let originalSetter = Object.getOwnPropertyDescriptor(object, name).set;
  let key = this.getKey_(object, name);
  if (this.originalSetters_[key]) {
    throw new Error('TrustedTypesEnforcer: Double installation detected');
  }
  let that = this;
  trustedtypes.utils.wrapper.installSetter(
      object,
      name,
      function(value) {
        that.enforce_.call(that, this, name, type, originalSetter, 0, [value]);
      });
  this.originalSetters_[key] = originalSetter;
};

/**
 * Restores the original setter for the property, as encountered during
 * install().
 * @param {!Object} object The object of the to-be-wrapped property.
 * @param {string} name The name of the property.
 * @private
 */
trustedtypes.TrustedTypesEnforcer.prototype.restoreSetter_ =
    function(object, name) {
  let key = this.getKey_(object, name);
  if (!this.originalSetters_[key]) {
    throw new Error(
        'TrustedTypesEnforcer: Cannot restore (double uninstallation?)');
  }
  trustedtypes.utils.wrapper.installSetter(object, name,
      this.originalSetters_[key]);
  delete this.originalSetters_[key];
};

/**
 * Restores the original method of an object, as encountered during install().
 * @param {!Object} object The object of the to-be-wrapped property.
 * @param {string} name The name of the property.
 * @private
 */
trustedtypes.TrustedTypesEnforcer.prototype.restoreFunction_ =
    function(object, name) {
  let key = this.getKey_(object, name);
  if (!this.originalSetters_[key]) {
    throw new Error(
        'TrustedTypesEnforcer: Cannot restore (double uninstallation?)');
  }
  trustedtypes.utils.wrapper.installFunction(object, name,
      this.originalSetters_[key]);
  delete this.originalSetters_[key];
};

/**
 * Returns the key name for caching original setters.
 * @param {!Object} object The object of the to-be-wrapped property.
 * @param {string} name The name of the property.
 * @return {string} Key name.
 * @private
 */
trustedtypes.TrustedTypesEnforcer.prototype.getKey_ = function(object, name) {
  return '' + object.constructor.name + '-' + name;
};

/**
 * Logs and enforces TrustedTypes depending on the given configuration.
 * @param {!Object} context The object that the setter is called for.
 * @param {string} propertyName The name of the property.
 * @param {!Function} typeToEnforce The type to enforce.
 * @param {!function(*): *|undefined} originalSetter Original setter.
 * @param {number} argNumber Number of argument to enforce the type of.
 * @param {Array} args Arguments.
 * @return {*}
 * @private
 */
trustedtypes.TrustedTypesEnforcer.prototype.enforce_ =
    function(context, propertyName, typeToEnforce, originalSetter, argNumber,
             args) {
  let value = args[argNumber];
  if (!(value instanceof typeToEnforce)) {
    let message = 'Failed to set ' + propertyName + ' property on ' +
        ('' + context || context.constructor.name) +
        ': This document requires `' + (typeToEnforce.name) + '` assignment.';

    if (this.config_.isLoggingEnabled) {
      console.warn(message, propertyName, context, typeToEnforce, value);
    }

    if (this.config_.isEnforcementEnabled) {
      throw new TypeError(message);
    }
  }

  return originalSetter.apply(context, args);
};
