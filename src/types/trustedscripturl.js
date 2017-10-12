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

/**
 * A type to represent a trusted URL.
 */
export class TrustedScriptURL {
  /**
   * @param {string} url The trusted URL.
   */  
  constructor(url) {
    /**
     * The trusted URL.
     * @private {string}
     */
    this.url_ = url;
  }

  /**
   * Returns a trusted Script URL type that contains an unsafe URL.
   * @param {string} url The unsafe URL.
   * @return {!TrustedScriptURL}
   */
  static unsafelyCreate(url) {
    let parsedUrl = TrustedScriptURL.parse_(url);
    return new TrustedScriptURL(parsedUrl.href);
  }

  /**
   * Returns a parsed URL.
   * @param {string} url The url to parse.
   * @return {!HTMLAnchorElement} An anchor element containing the url.
   */
  static parse_(url) {
    let aTag = /** @type !HTMLAnchorElement */ (document.createElement('a'));
    aTag.href = url;
    return aTag;
  }

  /**
   * Returns the script URL as a string.
   * @return {string}
   */
  toString() {
    return this.url_;
  }

  /**
   * Name property getter.
   * Required by the enforcer to work with both the polyfilled and native type.
   */
  static get name() {
    return 'TrustedScriptURL';
  }
}

// Make sure Closure compiler exposes the names.
if (typeof window['TrustedScriptURL'] === 'undefined') {
  window['TrustedScriptURL'] = TrustedScriptURL;
  window['TrustedScriptURL']['unsafelyCreate'] =
      TrustedScriptURL.unsafelyCreate;
}
