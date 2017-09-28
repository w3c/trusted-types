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
goog.provide('trustedtypes.types.TrustedHTML');

/**
 * A type to represent trusted HTML.
 * @param {string} inner A piece of trusted html.
 * @constructor
 */
trustedtypes.types.TrustedHTML = function TrustedHTML(inner) {
  /**
   * A piece of trusted HTML.
   * @private {string}
   */
  this.inner_ = inner;
};

// Workaround for Closure Compiler clearing the function name.
Object.defineProperty(trustedtypes.types.TrustedHTML, 'name', {
  get: function() {
    return 'TrustedHTML';
  },
});

/**
 * Returns a trusted HTML type that contains the HTML escaped string.
 * @param {string} html The string to escape.
 * @return {!trustedtypes.types.TrustedHTML}
 */
trustedtypes.types.TrustedHTML['escape'] = function(html) {
  let escaped = html.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\x00/g, '&#0;');
  return new trustedtypes.types.TrustedHTML(escaped);
};

/**
 * Returns a trusted HTML type that contains an unsafe HTML string.
 * @param {string} html The unsafe string.
 * @return {!trustedtypes.types.TrustedHTML}
 */
trustedtypes.types.TrustedHTML['unsafelyCreate'] = function(html) {
  return new trustedtypes.types.TrustedHTML(html);
};

/**
 * Returns the HTML as a string.
 * @return {string}
 */
trustedtypes.types.TrustedHTML.prototype['toString'] = function() {
  return '' + this.inner_;
};

if (typeof window['TrustedHTML'] === 'undefined') {
  window['TrustedHTML'] = trustedtypes.types.TrustedHTML;
}
