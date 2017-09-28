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
goog.provide('trustedtypes.types.TrustedScriptURL');

/**
 * A type to represent a trusted URL.
 * @param {string} url The trusted URL.
 * @constructor
 */
trustedtypes.types.TrustedScriptURL = function TrustedScriptURL(url) {
  /**
   * The trusted URL.
   * @private {string}
   */
  this.url_ = url;
};

// Workaround for Closure Compiler clearing the function name.
Object.defineProperty(trustedtypes.types.TrustedScriptURL, 'name', {
  get: function() {
    return 'TrustedScriptURL';
  },
});

/**
 * Returns a TrustedScriptURL type that contains an unsafe URL string.
 * @param {string} url The unsafe string.
 * @return {!trustedtypes.types.TrustedScriptURL}
 */
trustedtypes.types.TrustedScriptURL.unsafelyCreate = function(url) {
  let parsedUrl = trustedtypes.types.TrustedScriptURL.parse_(url);
  return new trustedtypes.types.TrustedScriptURL(parsedUrl.href);
};

/**
 * Returns a TrustedScriptURL type. The TrustedScriptURL prepends "unsafe_"
 * to all non HTTP(s) schemes.
 * @param {string} url The an absolute url.
 * @return {!trustedtypes.types.TrustedScriptURL}
 */
trustedtypes.types.TrustedScriptURL.createHttpUrl = function(url) {
  let parsedUrl = trustedtypes.types.TrustedScriptURL.parse_(url);
  if (parsedUrl.protocol != 'http' && parsedUrl.protocol != 'https:') {
    parsedUrl.protocol = 'unsafe_' + parsedUrl.protocol;
  }

  return new trustedtypes.types.TrustedScriptURL(parsedUrl.href);
};

/**
 * Returns a parsed URL.
 * @param {string} url The url to parse.
 * @return {!HTMLAnchorElement} An anchor element containing the url.
 */
trustedtypes.types.TrustedScriptURL.parse_ = function(url) {
  let aTag = /** @type !HTMLAnchorElement */ (document.createElement('a'));
  aTag.href = url;
  return aTag;
};

trustedtypes.types.TrustedScriptURL.prototype.toString = function() {
  return this.url_;
};

if (typeof window.TrustedScriptURL === 'undefined') {
  window.TrustedScriptURL = trustedtypes.types.TrustedScriptURL;
}
