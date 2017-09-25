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
goog.provide('trustedtypes.types.TrustedURL');


/**
 * A type to represent a trusted URL.
 * @param {string} url The trusted URL.
 * @constructor
 */
trustedtypes.types.TrustedURL = function TrustedURL(url) {
  /**
   * The trusted URL.
   * @param {string}
   */
  this.url = url;
};

// Workaround for Closure Compiler clearing the function name.
Object.defineProperty(trustedtypes.types.TrustedURL, 'name', {
  get: function() {
    return 'TrustedURL';
  },
});

/**
 * Returns a TrustedURL type that contains an unsafe URL string.
 * @param {string} url The unsafe string.
 * @return {!trustedtypes.types.TrustedURL}
 */
trustedtypes.types.TrustedURL.unsafelyCreate = function(url) {
  let parsedUrl = trustedtypes.types.TrustedURL.parse_(url);
  return new trustedtypes.types.TrustedURL(parsedUrl.href);
};

/**
 * Returns a TrustedURL type. The TrustedURL prepends "unsafe_" to all non
 * HTTP(s) schemes.
 * @param {string} url The an absolute url.
 * @return {!trustedtypes.types.TrustedURL}
 */
trustedtypes.types.TrustedURL.createHttpUrl = function(url) {
  let parsedUrl = trustedtypes.types.TrustedURL.parse_(url);
  if (parsedUrl.protocol != 'http' && parsedUrl.protocol != 'https:') {
    parsedUrl.protocol = 'unsafe_' + parsedUrl.protocol;
  }

  return new trustedtypes.types.TrustedURL(parsedUrl.href);
};

/**
 * Returns a parsed URL.
 * @param {string} url The url to parse.
 * @return {!HTMLAnchorElement} An anchor element containing the url.
 */
trustedtypes.types.TrustedURL.parse_ = function(url) {
  let aTag = document.createElement('a');
  aTag.href = url;
  return aTag;
};

trustedtypes.types.TrustedURL.prototype.toString = function() {
  return this.url;
};

if (typeof window.TrustedURL === 'undefined') {
  window.TrustedURL = trustedtypes.types.TrustedURL;
}
