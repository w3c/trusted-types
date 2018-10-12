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
import {TrustedTypes, TrustedHTML, TrustedURL, TrustedScriptURL, TrustedScript}
    from '../trustedtypes.js';

const tt = TrustedTypes;

// Make sure Closure compiler exposes the names.
if (typeof window !== 'undefined' &&
    typeof window['TrustedTypes'] === 'undefined') {
  window['TrustedTypes'] = {
    'isHTML': tt.isHTML,
    'isURL': tt.isURL,
    'isScriptURL': tt.isScriptURL,
    'isScript': tt.isScript,
    'createPolicy': tt.createPolicy,
    'getExposedPolicy': tt.getExposedPolicy,
    'getPolicyNames': tt.getPolicyNames,
  };

  window['TrustedHTML'] = TrustedHTML;
  window['TrustedURL'] = TrustedURL;
  window['TrustedScriptURL'] = TrustedScriptURL;
  window['TrustedScript'] = TrustedScript;
}

export default tt;
