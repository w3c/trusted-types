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
 * Regular expression for matching template expression placeholders.
 * @private {!RegExp}
 */
const INTERPOLATION_REGEXP_TEXT_ = /\$\$\$(\d+)\$\$\$/g;

/**
 * Regular expression for matching template expression placeholders in
 * attributes.
 * @private {!RegExp}
 */
const INTERPOLATION_REGEXP_ATTR_ = /\$\$\$(\d+)\$\$\$/;

/**
 * A type to represent trusted HTML.
 */
export class TrustedHTML {
  /**
   * @param {string} inner A piece of trusted html.
   * @param {Array<string>=} optStrings List of strings when initialized as a
   *   template literal.
   * @param {Array<*>=} optExpressionResults List of expression results when
   *   initialized as a template literal.
   */
  constructor(inner, optStrings, optExpressionResults) {
    /**
     * A piece of trusted HTML.
     * @private {string}
     */
    this.inner_ = inner;
    if (optStrings) {
      this.templateParts_ = optStrings;
      this.templateExpressionResults_ = optExpressionResults;
      this.interpolate_();
    }
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

  /**
   * Interpolates the expressions coming from the template literal.
   * @private
   */
  interpolate_() {
    let replaced = '';
    for (let i = 0; i < this.templateParts_.length; i++) {
      replaced += this.templateParts_[i];
      if (this.templateExpressionResults_.hasOwnProperty(i)) {
        replaced += '$$$' + i + '$$$';
      }
    }
    const parser = new DOMParser();
    const doc = parser.parseFromString('<body>'+ replaced + '</body>',
        'text/html');
    const iterator = document.createNodeIterator(doc.documentElement, -1);
    let node;

    while (node = iterator.nextNode()) {
      this.processNode_(node);
    }
    this.inner_ = doc.body.innerHTML;
  }

  /**
   * @param {*} _
   * @param {!string} partId
   * @private
   * @return {*}
   */
  replaceWithExpressionResult_(_, partId) {
    return this.templateExpressionResults_[Number(partId)];
  }

  /**
   * Checks if a node is a leaf element node.
   * @param {!Node} node
   * @return {boolean}
   * @private
   */
  isLeafElementNode_(node) {
    return node.nodeType == Node.ELEMENT_NODE &&
        node.childNodes.length == 1 &&
        node.childNodes[0].nodeType == Node.TEXT_NODE;
  }

  /**
   * Processes the node, replacing the placeholders with their
   * typed equivalents.
   * @param {!Node} node
   */
  processNode_(node) {
    if (node instanceof Element) {
      [].slice.call(node.attributes).forEach((attr) => {
        let match = attr.value.match(INTERPOLATION_REGEXP_ATTR_);
        if (match) {
          // TODO(koto): Consider relaxing for inert attributes.
          node.setAttribute(attr.name,
              this.templateExpressionResults_[Number(match[1])]);
        }
      });
    }

    if (this.isLeafElementNode_(node)) {
      let match = node.innerHTML.match(INTERPOLATION_REGEXP_TEXT_);
      if (match) {
        node.innerHTML = new TrustedHTML(
          node.innerHTML.replace(INTERPOLATION_REGEXP_TEXT_,
            (_, partId) => {
              let value = this.templateExpressionResults_[Number(partId)];
              if (!(value instanceof window['TrustedHTML'])) {
                throw new TypeError(
                    'TrustedHTML required when interpolating into innerHTML.');
              }
              return value;
            }
        ));
      }
    }

    if (node.nodeType == Node.TEXT_NODE) {
      if (node.nodeValue.match(INTERPOLATION_REGEXP_TEXT_)) {
        node.nodeValue = node.nodeValue.replace(
          INTERPOLATION_REGEXP_TEXT_,
          this.replaceWithExpressionResult_.bind(this)
          );
      }
    }
  }

  /**
   * Creates a TrustedHTML object from a template literal.
   * Usage:
   * TrustedHTML.fromTemplateLiteral `<div id="${id}">${interpolated} foo</div>`
   * @param {!Array<string>} strings
   * @param {...*} expressions
   * @return {!TrustedHTML}
   */
  static fromTemplateLiteral(strings, ...expressions) {
    return new TrustedHTML('', strings, expressions);
  }
}

// Make sure Closure compiler exposes the names.
if (typeof window['TrustedHTML'] === 'undefined') {
  window['TrustedHTML'] = TrustedHTML;
  window['TrustedHTML']['escape'] = TrustedHTML.escape;
  window['TrustedHTML']['unsafelyCreate'] = TrustedHTML.unsafelyCreate;
  window['TrustedHTML']['fromTemplateLiteral'] =
      TrustedHTML.fromTemplateLiteral;
}
