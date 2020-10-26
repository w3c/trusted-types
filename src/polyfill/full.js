/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

/**
 * @fileoverview Entry point for a polyfill that enforces the types.
 */
import {
  trustedTypes,
  TrustedTypesEnforcer,
  TrustedTypeConfig,
} from './api_only.js';
import {TrustedTypePolicy, TrustedTypePolicyFactory} from '../trustedtypes.js';

/**
 * Sets up the public Trusted Types API in the global object.
 */
function setupPolyfill() {
  // We use array accessors to make sure Closure compiler will not alter the
  // names of the properties..

  // we setup the polyfill only in browser environment.
  if (typeof window === 'undefined') {
    return;
  }
  const rootProperty = 'trustedTypes';

  // Convert old window.TrustedTypes to window.trustedTypes.
  if (window['TrustedTypes'] && typeof window[rootProperty] === 'undefined') {
    window[rootProperty] = Object.freeze(window['TrustedTypes']);
  }

  if (typeof window[rootProperty] !== 'undefined') {
    return;
  }

  const publicApi = Object.create(TrustedTypePolicyFactory.prototype);
  Object.assign(publicApi, {
    isHTML: trustedTypes.isHTML,
    isScriptURL: trustedTypes.isScriptURL,
    isScript: trustedTypes.isScript,
    createPolicy: trustedTypes.createPolicy,
    getAttributeType: trustedTypes.getAttributeType,
    getPropertyType: trustedTypes.getPropertyType,
    getTypeMapping: trustedTypes.getTypeMapping,
    emptyHTML: trustedTypes.emptyHTML,
    emptyScript: trustedTypes.emptyScript,
    _isPolyfill_: true,
  });
  Object.defineProperty(
      publicApi,
      'defaultPolicy',
      Object.getOwnPropertyDescriptor(trustedTypes, 'defaultPolicy') || {}
  );

  window[rootProperty] = Object.freeze(publicApi);

  window['TrustedHTML'] = trustedTypes.TrustedHTML;
  window['TrustedScriptURL'] = trustedTypes.TrustedScriptURL;
  window['TrustedScript'] = trustedTypes.TrustedScript;
  window['TrustedTypePolicy'] = TrustedTypePolicy;
  window['TrustedTypePolicyFactory'] = TrustedTypePolicyFactory;
}

/* eslint-enable no-unused-vars */

/**
 * Tries to guess a CSP policy from:
 *  - the current polyfill script element text content (if prefixed with
 *    "Content-Security-Policy:")
 *  - the data-csp attribute value of the current script element.
 *  - meta header
 * @return {?string} Guessed CSP value, or null.
 */
function detectPolicy() {
  try {
    const currentScript = document.currentScript || (function() {
      const scripts = document.getElementsByTagName('script');
      return scripts[scripts.length - 1];
    })();

    const bodyPrefix = 'Content-Security-Policy:';
    if (currentScript &&
            currentScript.textContent.trim().substr(0, bodyPrefix.length) ==
                bodyPrefix) {
      return currentScript.textContent.trim().slice(bodyPrefix.length);
    }
    if (currentScript.dataset['csp']) {
      return currentScript.dataset['csp'];
    }
    const cspInMeta = document.head.querySelector(
        'meta[http-equiv^="Content-Security-Policy"]');
    if (cspInMeta) {
      return cspInMeta['content'].trim();
    }
  } catch (e) {
    return null;
  }
  return null;
}

/**
 * Bootstraps all trusted types polyfill and their enforcement.
 */
export function bootstrap() {
  const csp = detectPolicy();
  const config = csp ? TrustedTypeConfig.fromCSP(csp) : new TrustedTypeConfig(
      /* isLoggingEnabled */ false,
      /* isEnforcementEnabled */ false,
      /* allowedPolicyNames */ [],
      /* allowDuplicates */ true);

  const trustedTypesEnforcer = new TrustedTypesEnforcer(config);

  trustedTypesEnforcer.install();
}

/**
 * Determines if the enforcement should be enabled.
 * @return {boolean}
 */
function shouldBootstrap() {
  for (const rootProperty of ['trustedTypes', 'TrustedTypes']) {
    if (window[rootProperty] && !window[rootProperty]['_isPolyfill_']) {
      // Native implementation exists
      return false;
    }
  }
  return true;
}

// Bootstrap only if native implementation is missing.
if (shouldBootstrap()) {
  setupPolyfill();
  bootstrap();
}
