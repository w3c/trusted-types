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
 * A configuration object for trusted type enforcement.
 */
export class TrustedTypeConfig {
  /**
   * @param {boolean} isLoggingEnabled If true enforcement wrappers will log
   *   warnings to the console.
   * @param {boolean} isEnforcementEnabled If true enforcement is enabled at
   *   runtime.
   * @param {?string} fallbackPolicyName If present, direct DOM sink usage
   *   will be passed throught this policy (has to be exposed).
   * @param {Array<string>} allowedPolicyNames Whitelisted policy names.
   */
  constructor(isLoggingEnabled,
      isEnforcementEnabled,
      fallbackPolicyName,
      allowedPolicyNames) {
    /**
      * True if logging is enabled.
      * @type {boolean}
      */
    this.isLoggingEnabled = isLoggingEnabled;

    /**
      * True if enforcement is enabled.
      * @type {boolean}
      */
    this.isEnforcementEnabled = isEnforcementEnabled;

    /**
     * Fallback policy name
     * @type {?string}
     */
    this.fallbackPolicyName = fallbackPolicyName;

    /**
     * Allowed policy names.
     * @type {Array<string>}
     */
    this.allowedPolicyNames = allowedPolicyNames;
  }

  /**
   * Parses a CSP policy.
   * @link https://www.w3.org/TR/CSP3/#parse-serialized-policy
   * @param  {string} cspString String with a CSP definition.
   * @return {Object<string,Array<string>>} Parsed CSP, keyed by directive
   *   names.
   */
  static parseCSP(cspString) {
    const SEMICOLON = /\s*;\s*/;
    const WHITESPACE = /\s+/;
    return cspString.trim().split(SEMICOLON)
        .map((serializedDirective) => serializedDirective.split(WHITESPACE))
        .reduce(function(parsed, directive) {
          if (directive[0]) {
            parsed[directive[0].toLowerCase()] = directive.slice(1).map(
                (s) => s.toLowerCase())
              .sort();
          }
          return parsed;
        }, {});
  }

  /**
   * Creates a TrustedTypeConfig object from a CSP string.
   * @param  {string} cspString
   * @return {!TrustedTypeConfig}
   */
  static fromCSP(cspString) {
    const isLoggingEnabled = true;
    const policy = TrustedTypeConfig.parseCSP(cspString);
    const enforce = 'trusted-types' in policy;
    return new TrustedTypeConfig(
      isLoggingEnabled,
      enforce, /* isEnforcementEnabled */
      null, /* fallbackPolicyName */
      enforce ? policy['trusted-types'] : ['*'] /* allowedPolicyNames */
    );
  }
}
