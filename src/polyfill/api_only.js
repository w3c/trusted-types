/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

/**
 * @fileoverview Entry point for a polyfill that only defines the types
 * (i.e. no enforcement logic).
 */
import {trustedTypes, TrustedTypePolicy, TrustedTypePolicyFactory} from
  '../trustedtypes.js';

const tt = trustedTypes;

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
    'emptyScript': tt.emptyScript,
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

export default tt;
