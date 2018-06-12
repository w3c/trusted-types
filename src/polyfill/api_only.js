/*
Copyright 2018 Google Inc.

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

/**
 * @fileoverview Entry point for a polyfill that only uses the types
 * (i.e. no enforcement logic).
 */
import {TrustedTypes as tt} from '../trustedtypes.js';

// Make sure Closure compiler exposes the names.
if (typeof window['TrustedTypes'] === 'undefined') {
  window['TrustedTypes'] = {
    'TrustedHTML': tt.TrustedHTML,
    'TrustedURL': tt.TrustedURL,
    'TrustedScriptURL': tt.TrustedScriptURL,
    'isHTML': tt.isHTML,
    'isURL': tt.isURL,
    'isScriptURL': tt.isScriptURL,
    'createHTML': tt.createHTML,
    'createURL': tt.createURL,
    'createScriptURL': tt.createScriptURL,
    'createPolicy': tt.createPolicy,
    'getExposedPolicy': tt.getExposedPolicy,
    'getPolicyNames': tt.getPolicyNames,
  };
}

export const TrustedTypes = tt;
