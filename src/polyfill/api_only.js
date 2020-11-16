/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

/**
 * @fileoverview Entry point for a polyfill that only defines the trusted types
 * API and makes it available in the global scope. This version of polyfill
 * doesn't contain the enforcement API. If you want to protect DOM sinks, use
 * the full polyfill instead.
 */
import {trustedTypes, TrustedTypePolicy, TrustedTypePolicyFactory} from
  '../trustedtypes.js';

/**
 * Sets up the public Trusted Types API in the global object.
 */
function setupPolyfill() {
  // We use array accessors to make sure Closure compiler will not alter the
  // names of the properties..

  // we setup the polyfill only in browser environment.
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
    isHTML: trustedTypes.isHTML,
    isScriptURL: trustedTypes.isScriptURL,
    isScript: trustedTypes.isScript,
    createPolicy: trustedTypes.createPolicy,
    getAttributeType: trustedTypes.getAttributeType,
    getPropertyType: trustedTypes.getPropertyType,
    getTypeMapping: trustedTypes.getTypeMapping,
    emptyHTML: trustedTypes.emptyHTML,
    emptyScript: trustedTypes.emptyScript,
    _isPolyfill_: true,
  });
  Object.defineProperty(
      publicApi,
      'defaultPolicy',
      Object.getOwnPropertyDescriptor(trustedTypes, 'defaultPolicy') || {}
  );

  window[rootProperty] = Object.freeze(publicApi);

  window['TrustedHTML'] = trustedTypes.TrustedHTML;
  window['TrustedScriptURL'] = trustedTypes.TrustedScriptURL;
  window['TrustedScript'] = trustedTypes.TrustedScript;
  window['TrustedTypePolicy'] = TrustedTypePolicy;
  window['TrustedTypePolicyFactory'] = TrustedTypePolicyFactory;
}


setupPolyfill();
