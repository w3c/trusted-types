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
 * A type to represent trusted HTML.
 */
export class TrustedHTML {
  /**
   * @param {string} inner A piece of trusted html.
   */
  constructor(inner) {
    /**
     * A piece of trusted HTML.
     * @private {string}
     */
    this.inner_ = inner;
  }

  /**
   * Returns the HTML as a string.
   * @return {string}
   */
  toString() {
    return '' + this.inner_;
  }

  /**
   * Creates a TrustedHTML instance by HTML-escaping a given string.
   * @param {string} html
   * @return {!TrustedHTML}
   */
  static escape(html) {
    let escaped = html.replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/\x00/g, '&#0;'); // eslint-disable-line no-control-regex
    return new TrustedHTML(escaped);
  }

  /**
   * Returns a trusted HTML type that contains an unsafe HTML string.
   * @param {string} html The unsafe string.
   * @return {!TrustedHTML}
   */
  static unsafelyCreate(html) {
    return new TrustedHTML(html);
  }

  /**
   * Name property getter.
   * Required by the enforcer to work with both the polyfilled and native type.
   */
  static get name() {
    return 'TrustedHTML';
  }
}

// Make sure Closure compiler exposes the names.
if (typeof window['TrustedHTML'] === 'undefined') {
  window['TrustedHTML'] = TrustedHTML;
  window['TrustedHTML']['escape'] = TrustedHTML.escape;
  window['TrustedHTML']['unsafelyCreate'] = TrustedHTML.unsafelyCreate;
}
