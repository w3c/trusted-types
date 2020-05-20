/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */
import '@babel/polyfill';
import {TrustedTypeConfig} from '../src/data/trustedtypeconfig.js';

describe('TrustedTypeConfig', () => {
  describe('parseCSP', () => {
    it('parses policy with a single directive', () => {
      const policy = `default-src 'self'`;

      expect(TrustedTypeConfig.parseCSP(policy)).toEqual(
          {'default-src': ['\'self\'']});
    });

    it('parses policy with a multiple directives', () => {
      const policy = `default-src 'self'; connect-src http://foo.bar`;

      expect(TrustedTypeConfig.parseCSP(policy)).toEqual({
        'default-src': ['\'self\''],
        'connect-src': ['http://foo.bar'],
      });
    });

    it('ignores empty directives', () => {
      const policy = `default-src 'self';; connect-src http://foo.bar`;

      expect(TrustedTypeConfig.parseCSP(policy)).toEqual({
        'default-src': [`'self'`],
        'connect-src': ['http://foo.bar'],
      });
    });

    it('ignores whitespace', () => {
      const policy = `\ndefault-src    'self';    \t connect-src\n\thttp://foo.bar  `;

      expect(TrustedTypeConfig.parseCSP(policy)).toEqual({
        'default-src': [`'self'`],
        'connect-src': ['http://foo.bar'],
      });
    });

    it('supports multiple directive values', () => {
      const policy = `default-src 'self' https://a *; connect-src http://foo.bar`;

      expect(TrustedTypeConfig.parseCSP(policy)).toEqual({
        'default-src': [`'self'`, '*', 'https://a'],
        'connect-src': ['http://foo.bar'],
      });
    });
  });

  describe('fromCSP', () => {
    it('always enabled logging', () => {
      expect(TrustedTypeConfig.fromCSP('').isLoggingEnabled).toBe(true);
      expect(TrustedTypeConfig.fromCSP('trusted-types').isLoggingEnabled)
          .toBe(true);
    });

    [
      'require-trusted-types-for \'script\'',
      'require-trusted-types-for \'foo\' \'script\'',
    ].forEach((csp) => it('enforces for valid CSP string', () => {
      expect(TrustedTypeConfig.fromCSP(csp).isEnforcementEnabled).toBe(true);
    }));

    [
      '',
      'require-trusted-types-for',
      'require-trusted-types-for \'foo\'',
      'require-trusted-types-for \'SCRIPT\'',
    ].forEach((csp) => it('does not enforce for invalid CSP string', () => {
      expect(TrustedTypeConfig.fromCSP(csp).isEnforcementEnabled).toBe(false);
    }));

    it('uses whitelisted directive names from the directive', () => {
      expect(TrustedTypeConfig.fromCSP('trusted-types foo bar *')
          .allowedPolicyNames).toEqual(['*', 'bar', 'foo']);
    });

    it('defaults to disallowing duplicates', () => {
      expect(TrustedTypeConfig.fromCSP('trusted-types *')
          .allowDuplicates).toEqual(false);
    });

    it('supports \'allow-duplicates\' keyword with a whitelist', () => {
      const config = TrustedTypeConfig.fromCSP(
          'trusted-types a b \'allow-duplicates\' c');

      expect(config.allowDuplicates).toEqual(true);
      expect(config.allowedPolicyNames).toEqual(['a', 'b', 'c']);
    });

    it('supports \'allow-duplicates\' keyword with wildcard', () => {
      const config = TrustedTypeConfig.fromCSP(
          'trusted-types \'allow-duplicates\' *');

      expect(config.allowDuplicates).toEqual(true);
      expect(config.allowedPolicyNames).toEqual(['*']);
    });

    it('ignores quoted keywords when extracting policy names', () => {
      expect(TrustedTypeConfig.fromCSP('trusted-types foo bar \'keyword\'')
          .allowedPolicyNames).toEqual(['bar', 'foo']);
    });

    it('defaults to an empty set of allowed directives', () => {
      expect(TrustedTypeConfig.fromCSP('trusted-types')
          .allowedPolicyNames).toEqual([]);
    });

    it('supports \'none\' keyword', () => {
      expect(TrustedTypeConfig.fromCSP('trusted-types \'none\' a b c')
          .allowedPolicyNames).toEqual([]);
    });

    it('passes the CSP string to config object', () => {
      const csp = 'trusted-types a b c; script-src foo';

      expect(TrustedTypeConfig.fromCSP(csp)
          .cspString).toEqual(csp);
    });
  });
});
