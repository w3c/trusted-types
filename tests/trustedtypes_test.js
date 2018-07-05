/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */
import {trustedTypesBuilderTestOnly} from '../src/trustedtypes.js';

describe('v2 TrustedTypes', () => {
  let TrustedTypes;

  beforeEach(() => {
    // We need separate instances.
     TrustedTypes = trustedTypesBuilderTestOnly();
  });

  const noopPolicy = {
    'createHTML': (s) => s,
    'createScriptURL': (s) => s,
    'createURL': (s) => s,
    'createScript': (s) => s,
  };

  it('is frozen', () => {
    expect(Object.isFrozen(TrustedTypes)).toBe(true);
  });

  describe('createPolicy', () => {
    it('returns a working policy object', () => {
      const p = TrustedTypes.createPolicy('policy', {});

      expect(p.createHTML instanceof Function).toBe(true);
      expect(p.createURL instanceof Function).toBe(true);
      expect(p.createScriptURL instanceof Function).toBe(true);
    });

    it('ignores methods from policy prototype chain', () => {
      const parent = {
        'createHTML': (s) => s,
      };
      const child = Object.create(parent);
      child['createScriptURL'] = (s) => s;

      const policy = TrustedTypes.createPolicy('policy', child);

      expect('' + policy.createScriptURL('https://foo')).toEqual('https://foo');
      expect(() => policy.createHTML('<foo>')).toThrow();
    });

    it('defaults to a non-exposed policy', () => {
      TrustedTypes.createPolicy('policy', {});

      expect(TrustedTypes.getExposedPolicy(name)).toBe(null);
    });

    it('supports exposing policy', () => {
      const p = TrustedTypes.createPolicy('policy', {}, true);

      expect(TrustedTypes.getExposedPolicy('policy')).toBe(p);
    });

    it('does not allow for policy name collisions', () => {
      TrustedTypes.createPolicy('conflicting', {});

      expect(() => TrustedTypes.createPolicy('conflicting', {}))
        .toThrow();
    });

    it('returns a frozen policy object', () => {
      let p = TrustedTypes.createPolicy('frozencheck', {});

      expect(Object.isFrozen(p)).toBe(true);
      expect(() => {
        p.a = 'foo';
      }).toThrow();

      expect(() => {
        p.createHTML = (s) => s;
      }).toThrow();

      expect(() => {
        delete p.createHTML;
      }).toThrow();
    });
  });

  describe('getPolicyNames', () => {
    it('returns all policy names', () => {
      TrustedTypes.createPolicy('hidden', {});
      TrustedTypes.createPolicy('exposed', {}, true);

      expect(TrustedTypes.getPolicyNames()).toEqual(['hidden', 'exposed']);
    });
  });

  describe('trusted type constructors', () => {
    it('cannot be used directly', () => {
      const name = 'known';
      TrustedTypes.createPolicy(name, noopPolicy);

      expect(() => new TrustedTypes.TrustedHTML()).toThrow();
      expect(() => new TrustedTypes.TrustedHTML(null, name)).toThrow();
    });
  });

  describe('is* methods', () => {
    it('require the object to be created via policy', () => {
      const p = TrustedTypes.createPolicy('foo', noopPolicy);
      let html = p.createHTML('test');

      expect(TrustedTypes.isHTML(html)).toEqual(true);
      let html2 = Object.create(html);

      // instanceof can pass, but we rely on isHTML
      expect(html2 instanceof TrustedTypes.TrustedHTML).toEqual(true);
      expect(TrustedTypes.isHTML(html2)).toEqual(false);

      let html3 = Object.assign({}, html, {toString: () => 'fake'});

      expect(TrustedTypes.isHTML(html3)).toEqual(false);
    });

    it('cannot be redefined', () => {
      expect(() => TrustedTypes.isHTML = () => true).toThrow();
      expect(TrustedTypes.isHTML({})).toBe(false);
    });
  });

  describe('proto attacks', () => {
    it('WeakMap.prototype.has', () => {
      const originalHas = WeakMap.prototype.has;
      let poisonedProto = false;
      try {
        try {
          // eslint-disable-next-line no-extend-native
          WeakMap.prototype.has = () => true;
        } catch (ex) {
          // Ok if poisoning doesn't work.
        }
        poisonedProto = WeakMap.prototype.has !== originalHas;

        // Assumes .has is used in isHTML.
        expect(TrustedTypes.isHTML({})).toBe(false);
      } finally {
        if (poisonedProto) {
          // eslint-disable-next-line no-extend-native
          WeakMap.prototype.has = originalHas;
        }
      }
    });
  });

  describe('policy', () => {
    describe('create* methods', () => {
      it('reject by default', () => {
        const p = TrustedTypes.createPolicy('policy', {});

        expect(() => p.createHTML('foo')).toThrow();
        expect(() => p.createURL('foo')).toThrow();
        expect(() => p.createScriptURL('foo')).toThrow();
      });

      it('can be used selectively', () => {
        const p = TrustedTypes.createPolicy('policy', {
          'createHTML': (s) => s,
        });

        expect(() => p.createHTML('foo')).not.toThrow();
        expect(() => p.createURL('foo')).toThrow();
        expect(() => p.createScriptURL('foo')).toThrow();
      });

      it('return working values', () => {
        const name = 'policy';
        const p = TrustedTypes.createPolicy(name, noopPolicy);

        const html = p.createHTML('<foo>');
        const url = p.createURL('http://a');
        const scriptURL = p.createScriptURL('http://b');
        const script = p.createScript('alert(1)');

        expect(TrustedTypes.isHTML(html)).toBe(true);
        expect(TrustedTypes.isURL(url)).toBe(true);
        expect(TrustedTypes.isScriptURL(scriptURL)).toBe(true);
        expect(TrustedTypes.isScript(script)).toBe(true);

        // Do not rely on instanceof checks though...
        expect(html instanceof TrustedTypes.TrustedHTML).toBe(true);
        expect(url instanceof TrustedTypes.TrustedURL).toBe(true);
        expect(scriptURL instanceof TrustedTypes.TrustedScriptURL).toBe(true);
        expect(script instanceof TrustedTypes.TrustedScript).toBe(true);

        expect('' + html).toEqual('<foo>');
        expect('' + url).toEqual('http://a');
        expect('' + scriptURL).toEqual('http://b');
        expect('' + script).toEqual('alert(1)');

        expect(html.policyName).toEqual(name);
        expect(url.policyName).toEqual(name);
        expect(scriptURL.policyName).toEqual(name);
        expect(script.policyName).toEqual(name);
      });

      it('respect defined transformations', () => {
        const policyRules = {
          createHTML: (s) => 'createHTML:' + s,
          createURL: (s) => 'createURL:' + s,
          createScriptURL: (s) => 'createScriptURL:' + s,
        };
        const p = TrustedTypes.createPolicy('transform', policyRules);

        expect('' + p.createURL('http://b')).toEqual('createURL:http://b');
        expect('' + p.createScriptURL('http://a')).toEqual('createScriptURL:http://a');
        expect('' + p.createHTML('<foo>')).toEqual('createHTML:<foo>');
      });

      it('return frozen values', () => {
        const p = TrustedTypes.createPolicy('policy', noopPolicy);

        let html = p.createHTML('foo');

        expect(Object.isFrozen(html)).toBe(true);
        expect(() => html.toString = () => 'fake').toThrow();
        expect(() => html.__proto__ = {toString: () => 'fake'}).toThrow();
        expect(() => html.__proto__.toString = () => 'fake').toThrow();

        // Prevent sanitizer that passes javascript:... from masquerading.
        expect(
          () => Object.setPrototypeOf(html, TrustedTypes.TrustedURL.prototype))
          .toThrow();

        // Proxy that traps get of toString.
        let proxyHtml = new Proxy(html, {
          get: (target, key, receiver) => {
            if (key === 'toString') {
              return () => 'fake';
            }
          },
        });

        expect(proxyHtml.toString() !== 'foo' && TrustedTypes.isHTML(proxyHtml))
          .toBe(false);

        // Check that the attacks above don't succeed and throw.
        expect(TrustedTypes.isHTML(html)).toBe(true);
        expect(TrustedTypes.isURL(html)).toBe(false);
        expect(String(html)).toEqual('foo');
      });
    });
  });

  describe('setAllowedPolicyNames', () => {
    it('is not applied by default', () => {
      expect(() => TrustedTypes.createPolicy('foo', {})).not.toThrow();
    });

    it('is applied by createPolicy', () => {
      TrustedTypes.setAllowedPolicyNames(['bar']);

      expect(() => TrustedTypes.createPolicy('foo', {})).toThrow();
      expect(() => TrustedTypes.createPolicy('bar', {})).not.toThrow();
    });

    it('supports wildcard', () => {
      TrustedTypes.setAllowedPolicyNames(['*']);

      expect(() => TrustedTypes.createPolicy('foo', {})).not.toThrow();
      expect(() => TrustedTypes.createPolicy('bar', {})).not.toThrow();
    });
  });
});
