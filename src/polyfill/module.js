/**
 * @license
 * Copyright 2020 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

/**
 * @fileoverview Entry point for a polyfill that only exports the API
 * (i.e. doesn't perform any side effects and no enforcement logic).
 */
export {
  trustedTypes,
  TrustedTypePolicy,
  TrustedTypePolicyFactory,
} from '../trustedtypes.js';
export {TrustedTypesEnforcer} from '../enforcer.js';
export {TrustedTypeConfig} from '../data/trustedtypeconfig.js';
