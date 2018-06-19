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
import {TrustedTypes as tt} from '../trustedtypes.js';

// Make sure Closure compiler exposes the names.
if (typeof window !== 'undefined' &&
    typeof window['TrustedTypes'] === 'undefined') {
  window['TrustedTypes'] = {
    'TrustedHTML': tt.TrustedHTML,
    'TrustedURL': tt.TrustedURL,
    'TrustedScriptURL': tt.TrustedScriptURL,
    'TrustedScript': tt.TrustedScript,
    'createHTML': tt.createHTML,
    'createURL': tt.createURL,
    'createScriptURL': tt.createScriptURL,
    'createScript': tt.createScript,
    'createPolicy': tt.createPolicy,
    'getExposedPolicy': tt.getExposedPolicy,
    'getPolicyNames': tt.getPolicyNames,
  };
}

export default tt;
