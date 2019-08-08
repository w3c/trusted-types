/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

/** @fileoverview @externs */

/**
 * Policy defining rules for creating Trusted Types.
 * @typedef {TrustedTypesInnerPolicy}
 */
var TrustedTypesInnerPolicy = {
  /**
   * Function defining rules for creating a TrustedHTML object.
   * @param  {string} s The input string.
   * @return {string} String that will be wrapped in a TrustedHTML object.
   */
  createHTML(s){},

  /**
   * Function defining rules for creating a TrustedURL object.
   * @param  {string} s The input string.
   * @return {string} String that will be wrapped in a TrustedURL object.
   */
  createURL(s){},

  /**
   * Function defining rules for creating a TrustedScriptURL object.
   * @param  {string} s The input string.
   * @return {string} String that will be wrapped in a TrustedScriptURL object.
   */
  createScriptURL(s){},

  /**
   * Function defining rules for creating a TrustedScript object.
   * @param  {string} s The input string.
   * @return {string} String that will be wrapped in a TrustedScript object.
   */
  createScript(s){},
};

/**
 * @constructor
 */
var TrustedTypePolicyFactory = function() {};

/**
 * Creates a TT policy.
 *
 * Returns a frozen object representing a policy - a collection of functions
 * that may create TT objects based on the user-provided rules specified
 * in the builder function.
 *
 * @param  {string} name A unique name of the policy.
 * @param  {!TrustedTypesInnerPolicy} policy The policy rules.
 * @return {!TrustedTypePolicy} The policy that may create TT objects
 *   according to the rules in the builder.
 */
TrustedTypePolicyFactory.prototype.createPolicy = function(name, policy){};

/**
 * Returns all defined policy names.
 * @return {!Array<string>}
 */
TrustedTypePolicyFactory.prototype.getPolicyNames = function(){};

/**
 * A reference to a default policy, if it was created, null otherwise.
 * @type {?TrustedTypePolicy}
 */
TrustedTypePolicyFactory.prototype.defaultPolicy;

/**
 * Returns the name of the Trusted Type required for a given element
 *   attribute.
 * @param {string} tagName The name of the tag of the element.
 * @param {string} attribute The name of the attribute.
 * @param {string=} elementNs Element namespace URI.
 * @param {string=} attributeNs The attribute namespace URI.
 * @return {string|undefined} Required type name or undefined, if a
 *   Trusted Type is not required.
 */
TrustedTypePolicyFactory.prototype.getAttributeType = function(tagName,
  attribute, elementNs = '', attributeNs = ''){};

/**
 * Returns the name of the Trusted Type required for a given element property.
 * @param {string} tagName The name of the tag of the element.
 * @param {string} property The property.
 * @param {string=} elementNs Element namespace URI.
 * @param {string=} attributeNs The attribute namespace URI.
 * @return {string|undefined} Required type name or undefined, if a
 *   Trusted Type is not required.
 */
TrustedTypePolicyFactory.prototype.getPropertyType = function(tagName,
    property, elementNs = ''){};

/**
 * Returns the type map-like object, that resolves a name of a type for a given
 * tag + attribute / property in a given namespace.
 * The keys of the map are uppercase tag names. Map entry has mappings between
 * a lowercase attribute name / case-sensitive property name and a name of the
 * type that is required for that attribute / property.
 *
 * Example entry for 'IMG': {"attributes": {"src": "TrustedHTML"}}
 *
 * The "*" entry contains the type mapping for every other element in a namespace
 * not listed separately.
 * @param {string=} namespaceUri The namespace URI (will use the current
 *   document namespace URI if omitted).
 * @return {!Object<string, {
 *   attributes: !Object<string, string>,
 *   properties: !Object<string, string>}>}
 */
TrustedTypePolicyFactory.prototype.getTypeMapping = function(namespaceUri = ''){};
/**
 * Object that represents a Trusted HTML code, safe to be inserted into DOM into
 * HTML context.
 * @constructor
 */
var TrustedHTML = function() {};

/**
 * Object that represents a Trusted URL, safe to be inserted into DOM in
 * URL context.
 * @constructor
 */
var TrustedURL = function() {};

/**
 * Object that represents a Trusted Script URL, safe to be inserted into DOM as
 * a script URL.
 * @constructor
 */
var TrustedScriptURL = function() {};

/**
 * Object that represents a Trusted JavaScript code string, safe to be executed.
 * @constructor
 */
var TrustedScript = function() {};

/**
 * Policy allowing to create Trusted Types.
 * @constructor
 * @property {!string} name
 */
var TrustedTypePolicy = function() {};

/**
 * Creates a TrustedHTML object from a string.
 * @param  {string} s Input string
 * @return {!TrustedHTML}
 */
TrustedTypePolicy.prototype.createHTML = function(s) {};

/**
 * Creates a TrustedURL object from a string.
 * @param  {string} s Input string
 * @return {!TrustedURL}
 */
TrustedTypePolicy.prototype.createURL = function(s) {};

/**
 * Creates a TrustedScriptURL object from a string.
 * @param  {string} s Input string
 * @return {!TrustedScriptURL}
 */
TrustedTypePolicy.prototype.createScriptURL = function(s) {};

/**
 * Creates a TrustedScript object from a string.
 * @param  {string} s Input string
 * @return {!TrustedScript}
 */
TrustedTypePolicy.prototype.createScript = function(s) {};

/**
 * @const {!TrustedTypePolicyFactory}
 */
var trustedTypes;