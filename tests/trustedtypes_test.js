/*
Copyright 2018 Google Inc.

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
import {trustedTypesBuilderTestOnly} from '../src/trustedtypes.js';

describe('v2 TrustedTypes', () => {
  let TrustedTypes;

  beforeEach(() => {
    // We need separate instances.
     TrustedTypes = trustedTypesBuilderTestOnly();
  });

  const noopPolicy = (p) => {
    p.createHTML = (s) => s;
    p.createScriptURL = (s) => s;
    p.createURL = (s) => s;
  };

  it('is frozen', () => {
    expect(Object.isFrozen(TrustedTypes)).toBe(true);
  });

  describe('addPolicy', () => {
    it('returns a working policy object', () => {
      const p = TrustedTypes.createPolicy('policy', () => {});

      expect(p.createHTML instanceof Function).toBe(true);
      expect(p.createURL instanceof Function).toBe(true);
      expect(p.createScriptURL instanceof Function).toBe(true);
    });

    it('defaults to a non-exposed policy', () => {
      TrustedTypes.createPolicy('policy', () => {});
      expect(TrustedTypes.getExposedPolicy(name)).toBe(null);
    });

    it('supports exposing policy', () => {
      const p = TrustedTypes.createPolicy('policy', (p) => {
        p.expose = true;
      });
      expect(TrustedTypes.getExposedPolicy('policy')).toBe(p);
    });

    it('does not allow for policy name collisions', () => {
      TrustedTypes.createPolicy('conflicting', () => {});
      expect(() => TrustedTypes.createPolicy('conflicting', () => {}))
        .toThrow();
    });

    it('returns a frozen policy object', () => {
      let p = TrustedTypes.createPolicy('frozencheck', () => {});
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
      TrustedTypes.createPolicy('hidden', () => {});
      TrustedTypes.createPolicy('exposed', (p) => {
        p.expose = true;
      });

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
        const p = TrustedTypes.createPolicy('policy', () => {});
        expect(() => p.createHTML('foo')).toThrow();
        expect(() => p.createURL('foo')).toThrow();
        expect(() => p.createScriptURL('foo')).toThrow();
      });

      it('return working values', () => {
        const name = 'policy';
        const p = TrustedTypes.createPolicy(name, noopPolicy);

        const html = p.createHTML('<foo>');
        const url = p.createURL('http://a');
        const scriptURL = p.createScriptURL('http://b');

        expect(TrustedTypes.isHTML(html)).toBe(true);
        expect(TrustedTypes.isURL(url)).toBe(true);
        expect(TrustedTypes.isScriptURL(scriptURL)).toBe(true);

        // Do not rely on instanceof checks though...
        expect(html instanceof TrustedTypes.TrustedHTML).toBe(true);
        expect(url instanceof TrustedTypes.TrustedURL).toBe(true);
        expect(scriptURL instanceof TrustedTypes.TrustedScriptURL).toBe(true);

        expect('' + html).toEqual('<foo>');
        expect('' + url).toEqual('http://a');
        expect('' + scriptURL).toEqual('http://b');

        expect(html.policyName).toEqual(name);
        expect(url.policyName).toEqual(name);
        expect(scriptURL.policyName).toEqual(name);
      });

      it('respect defined transformations', () => {
        const policyRules = (p) => {
          p.createHTML = (s) => 'createHTML:' + s;
          p.createURL = (s) => 'createURL:' + s;
          p.createScriptURL = (s) => 'createScriptURL:' + s;
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

  describe('create* methods', () => {
    it('support creating from exposed policies', () => {
      const name = 'bar';
      const exposed = TrustedTypes.createPolicy(name, (p) => {
        noopPolicy(p);
        p.expose = true;
      });
      const html = exposed.createHTML('foo');
      const html2 = TrustedTypes.createHTML(name, 'foo');
      expect(html.policyName).toEqual(html2.policyName);
      expect('' + html).toEqual('' + html2);
    });

    it('do not allow creating from non-exposed policies', () => {
      const name = 'p';
      TrustedTypes.createPolicy(name, (p) => {});
      expect(() => TrustedTypes.createHTML(name, 'foo')).toThrow();
    });
  });

  describe('setAllowedPolicyNames', () => {
    it('is not applied by default', () => {
      expect(() => TrustedTypes.createPolicy('foo', (p) => {})).not.toThrow();
    });

    it('is applied by createPolicy', () => {
      TrustedTypes.setAllowedPolicyNames(['bar']);
      expect(() => TrustedTypes.createPolicy('foo', (p) => {})).toThrow();
      expect(() => TrustedTypes.createPolicy('bar', (p) => {})).not.toThrow();
    });

    it('supports wildcard', () => {
      TrustedTypes.setAllowedPolicyNames(['*']);
      expect(() => TrustedTypes.createPolicy('foo', (p) => {})).not.toThrow();
      expect(() => TrustedTypes.createPolicy('bar', (p) => {})).not.toThrow();
    });
  });
});
