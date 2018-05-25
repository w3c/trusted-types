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
import {TrustedTypes} from './trustedtypes.js';

// Make sure Closure compiler exposes the names.
if (typeof window['TrustedTypes'] === 'undefined') {
  window['TrustedTypes'] = {};
  window['TrustedTypes']['TrustedHTML'] = TrustedTypes.TrustedHTML;
  window['TrustedTypes']['TrustedURL'] = TrustedTypes.TrustedURL;
  window['TrustedTypes']['TrustedScriptURL'] = TrustedTypes.TrustedScriptURL;
  window['TrustedTypes']['isHTML'] = TrustedTypes.isHTML;
  window['TrustedTypes']['isURL'] = TrustedTypes.isURL;
  window['TrustedTypes']['isScriptURL'] = TrustedTypes.isScriptURL;
  window['TrustedTypes']['createHTML'] = TrustedTypes.createHTML;
  window['TrustedTypes']['createURL'] = TrustedTypes.createURL;
  window['TrustedTypes']['createScriptURL'] = TrustedTypes.createScriptURL;
  window['TrustedTypes']['createPolicy'] = TrustedTypes.createPolicy;
  window['TrustedTypes']['getExposedPolicy'] = TrustedTypes.getExposedPolicy;
  window['TrustedTypes']['getPolicyNames'] = TrustedTypes.getPolicyNames;
}
