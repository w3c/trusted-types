/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

/**
 * CSP Directive name controlling Trusted Types behavior.
 * @type {string}
 */
export const DIRECTIVE_NAME = 'trusted-types';

/**
 * A configuration object for trusted type enforcement.
 */
export class TrustedTypeConfig {
  /**
   * @param {boolean} isLoggingEnabled If true enforcement wrappers will log
   *   violations to the console.
   * @param {boolean} isEnforcementEnabled If true enforcement is enabled at
   *   runtime.
   * @param {?string} fallbackPolicyName If present, direct DOM sink usage
   *   will be passed through this policy (has to be exposed).
   * @param {Array<string>} allowedPolicyNames Whitelisted policy names.
   * @param {?string} cspString String with the CSP policy.
   */
  constructor(isLoggingEnabled,
      isEnforcementEnabled,
      fallbackPolicyName,
      allowedPolicyNames,
      cspString = null) {
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

    /**
     * CSP string that defined the policy.
     * @type {?string}
     */
    this.cspString = cspString;
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
            parsed[directive[0]] = directive.slice(1).map((s) => s).sort();
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
    const enforce = DIRECTIVE_NAME in policy;
    let policies = ['*'];
    const fallbackPolicyName = 'default';
    if (enforce) {
      policies = policy[DIRECTIVE_NAME].filter((p) => p.charAt(0) !== '\'');
    }

    return new TrustedTypeConfig(
        isLoggingEnabled,
        enforce, /* isEnforcementEnabled */
        fallbackPolicyName, /* fallbackPolicyName */
        policies, /* allowedPolicyNames */
        cspString
    );
  }
}
