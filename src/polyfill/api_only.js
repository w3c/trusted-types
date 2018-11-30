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
import {TrustedTypes, TrustedTypePolicy, TrustedTypePolicyFactory} from
    '../trustedtypes.js';

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

export default tt;
