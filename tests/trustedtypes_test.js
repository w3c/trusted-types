/**
 * @license
 * Copyright 2017 Google Inc. All Rights Reserved.
 *
 * Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.
 *
 *  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */
import '@babel/polyfill';
import {trustedTypesBuilderTestOnly} from '../src/trustedtypes.js';

describe('v2 TrustedTypes', () => {
  let TrustedTypes;
  let setAllowedPolicyNames;
  let getDefaultPolicy;
  let resetDefaultPolicy;

  beforeEach(() => {
    // We need separate instances.
    ({
      TrustedTypes,
      setAllowedPolicyNames,
      getDefaultPolicy,
      resetDefaultPolicy} = trustedTypesBuilderTestOnly());
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

    [null, undefined, () => {}].forEach((i) =>
      it('creates empty policies if ' + i + ' is passed', () => {
        const warn = spyOn(console, 'warn');
        const p = TrustedTypes.createPolicy('policy', i);

        expect(warn).toHaveBeenCalledWith(jasmine.anything());
        expect(p.createHTML instanceof Function).toBe(true);
        expect(() => p.createHTML('foo')).toThrow();
      }));

    it('returns a policy object with a name', () => {
      const p = TrustedTypes.createPolicy('policy_has_name', {});

      expect(p.name).toEqual('policy_has_name');
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

    it('does not allow for policy name collisions', () => {
      TrustedTypes.createPolicy('conflicting', {});

      expect(() => TrustedTypes.createPolicy('conflicting', {}))
          .toThrow();
    });

    it('returns a frozen policy object', () => {
      const p = TrustedTypes.createPolicy('frozencheck', {});

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
      TrustedTypes.createPolicy('first', {});
      TrustedTypes.createPolicy('second', {});

      expect(TrustedTypes.getPolicyNames()).toEqual(['first', 'second']);
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
      const html = p.createHTML('test');

      expect(TrustedTypes.isHTML(html)).toEqual(true);
      const html2 = Object.create(html);

      // instanceof can pass, but we rely on isHTML
      expect(html2 instanceof TrustedTypes.TrustedHTML).toEqual(true);
      expect(TrustedTypes.isHTML(html2)).toEqual(false);

      const html3 = Object.assign({}, html, {toString: () => 'fake'});

      expect(TrustedTypes.isHTML(html3)).toEqual(false);
    });

    it('cannot be redefined', () => {
      expect(() => TrustedTypes.isHTML = () => true).toThrow();
      expect(TrustedTypes.isHTML({})).toBe(false);
    });
  });

  describe('getAttributeType', () => {
    it('returns the proper type', () => {
      expect(TrustedTypes.getAttributeType('script', 'src')).toEqual(
          'TrustedScriptURL');

      expect(TrustedTypes.getAttributeType('input', 'formaction')).toEqual(
          'TrustedURL');
    });

    it('supports xlink attributes', () => {
      expect(TrustedTypes.getAttributeType(
          'foo', 'href', '', 'http://www.w3.org/1999/xlink')).toEqual(
          'TrustedURL');
    });

    it('ignores attributes from unknown namespaces', () => {
      expect(TrustedTypes.getAttributeType(
          'a', 'href', '', 'http://foo.bar')).toBe(undefined);
    });

    it('is case insensitive for element names', () => {
      expect(TrustedTypes.getAttributeType('SCRIPT', 'src')).toEqual(
          'TrustedScriptURL');

      expect(TrustedTypes.getAttributeType('inPut', 'formaction')).toEqual(
          'TrustedURL');
    });

    it('is case insensitive for the attribute names', () => {
      expect(TrustedTypes.getAttributeType('script', 'SRC')).toEqual(
          'TrustedScriptURL');

      expect(TrustedTypes.getAttributeType('input', 'formActioN')).toEqual(
          'TrustedURL');
    });

    it('supports the inline event handlers', () => {
      expect(TrustedTypes.getAttributeType('img', 'onerror')).toEqual(
          'TrustedScript');

      expect(TrustedTypes.getAttributeType('unknown', 'onerror')).toEqual(
          'TrustedScript');
    });

    it('defaults to undefined', () => {
      expect(TrustedTypes.getAttributeType('unknown', 'src')).toBe(undefined);

      expect(TrustedTypes.getAttributeType('input', 'bar')).toBe(undefined);
    });
  });

  describe('getPropertyType', () => {
    it('returns the proper type for attribute-related properties', () => {
      expect(TrustedTypes.getPropertyType('script', 'src')).toEqual(
          'TrustedScriptURL');

      expect(TrustedTypes.getPropertyType('input', 'formAction')).toEqual(
          'TrustedURL');
    });

    it('is case insensitive for tag names', () => {
      expect(TrustedTypes.getPropertyType('SCRIPT', 'src')).toEqual(
          'TrustedScriptURL');

      expect(TrustedTypes.getPropertyType('INPut', 'formAction')).toEqual(
          'TrustedURL');
    });

    it('is case sensitive for property names', () => {
      expect(TrustedTypes.getPropertyType('script', 'sRc')).toBe(
          undefined);

      expect(TrustedTypes.getPropertyType('div', 'innerhtml')).toBe(
          undefined);
    });

    it('returns the proper type for innerHTML', () => {
      expect(TrustedTypes.getPropertyType('div', 'innerHTML')).toEqual(
          'TrustedHTML');
    });

    it('returns the proper type for outerHTML', () => {
      expect(TrustedTypes.getPropertyType('div', 'outerHTML')).toEqual(
          'TrustedHTML');
    });

    ['text', 'innerText', 'textContent'].forEach(
        (prop) => it('returns the proper type for script.' + prop, () => {
          expect(TrustedTypes.getPropertyType('script', prop)).toEqual(
              'TrustedScript');
        }));
  });

  describe('getTypeMapping', () => {
    it('returns a map', () => {
      const map = TrustedTypes.getTypeMapping();

      expect(map['SCRIPT'].attributes.src).toEqual('TrustedScriptURL');

      expect(map['INPUT'].attributes.formaction).toEqual('TrustedURL');
    });

    it('returns a map that has a wildcard entry', () => {
      const map = TrustedTypes.getTypeMapping();

      expect(map['*'].properties.innerHTML).toEqual('TrustedHTML');
    });

    it('returns a map that is aware of inline event handlers', () => {
      const map = TrustedTypes.getTypeMapping();

      expect(map['*'].attributes.onclick).toEqual('TrustedScript');
    });

    it('returns a fresh map', () => {
      const map1 = TrustedTypes.getTypeMapping();
      map1['*'].attributes['onfoo'] = 'bar';
      const map2 = TrustedTypes.getTypeMapping();

      expect(map2['*'].onfoo).toBe(undefined);
    });

    it('defaults to current document namespace', () => {
      const HTML_NS = 'http://www.w3.org/1999/xhtml';
      const mockNsGetter = spyOnProperty(document.documentElement,
          'namespaceURI', 'get').and.returnValues(HTML_NS, 'http://foo.bar');
      // Called once...
      const mapInferredHtml = TrustedTypes.getTypeMapping();
      // And the second time...
      const mapInferredFoo = TrustedTypes.getTypeMapping();
      // Call skipped.
      const mapExplicitHtml = TrustedTypes.getTypeMapping(HTML_NS);

      expect(mapInferredHtml).toEqual(mapExplicitHtml);
      expect(mapInferredFoo).not.toEqual(mapExplicitHtml);
      expect(mockNsGetter.calls.count()).toEqual(2);
    });

    it('returns empty object to unknown namespaces', () => {
      const map = TrustedTypes.getTypeMapping('http://foo/bar');

      expect(map).toEqual({});
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

    it('Object.prototype for property lookup', () => {
      // eslint-disable-next-line no-extend-native
      Object.prototype['FOO'] = {
        attributes: {
          'bar': 'TrustedHTML',
        },
        properties: {
          'baz': 'TrustedHTML',
        },
      };
      // eslint-disable-next-line no-extend-native
      Object.prototype['newattr'] = 'TrustedHTML';
      try {
        expect(TrustedTypes.getPropertyType('foo', 'baz')).toBeUndefined();
        expect(TrustedTypes.getAttributeType('foo', 'bar')).toBeUndefined();
        expect(TrustedTypes.getAttributeType('SCRIPT', 'newattr'))
            .toBeUndefined();
      } finally {
        delete Object.prototype.FOO;
        delete Object.prototype.newattr;
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

      it('get their first argument casted to a string', () => {
        const p = TrustedTypes.createPolicy('policy', {
          createHTML(s) {
            return typeof s;
          },
        });

        expect('' + p.createHTML({})).toEqual('string');
      });

      it('support multiple arguments', () => {
        const p = TrustedTypes.createPolicy('policy', {
          createHTML(...args) {
            return [].slice.call(args).join(' ');
          },
        });

        expect('' + p.createHTML('a', 'b', {toString: () => 'c'}))
            .toEqual('a b c');
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

      it('cast to string', () => {
        const policyRules = {
          createHTML: (s) => [1, 2],
        };
        const p = TrustedTypes.createPolicy('transform', policyRules);

        expect('' + p.createHTML('<foo>')).toBe('1,2');
      });

      [null, undefined].forEach((i) =>
        it('cast ' + i + ' to an empty string', () => {
          const policyRules = {
            createHTML: (s) => i,
          };
          const p = TrustedTypes.createPolicy('transform', policyRules);

          expect('' + p.createHTML('<foo>')).toBe('');
        }));

      it('return frozen values', () => {
        if (!window.Proxy) {
          pending();
        }

        const p = TrustedTypes.createPolicy('policy', noopPolicy);

        const html = p.createHTML('foo');

        expect(Object.isFrozen(html)).toBe(true);
        expect(() => html.toString = () => 'fake').toThrow();
        expect(() => html.__proto__ = {toString: () => 'fake'}).toThrow();
        expect(() => html.__proto__.toString = () => 'fake').toThrow();

        // Prevent sanitizer that passes javascript:... from masquerading.
        expect(
            () => Object.setPrototypeOf(html,
                TrustedTypes.TrustedURL.prototype))
            .toThrow();

        // Proxy that traps get of toString.
        const proxyHtml = new Proxy(html, {
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
      setAllowedPolicyNames(['bar']);

      expect(() => TrustedTypes.createPolicy('foo', {})).toThrow();
      expect(() => TrustedTypes.createPolicy('bar', {})).not.toThrow();
    });

    it('supports wildcard', () => {
      setAllowedPolicyNames(['*']);

      expect(() => TrustedTypes.createPolicy('foo', {})).not.toThrow();
      expect(() => TrustedTypes.createPolicy('bar', {})).not.toThrow();
    });
  });

  describe('getDefaultPolicy', () => {
    it('returns null initially', () => {
      expect(getDefaultPolicy()).toBe(null);
    });

    it('returns the default policy if created', () => {
      TrustedTypes.createPolicy('foo', {});
      const policy = TrustedTypes.createPolicy('default', {});
      TrustedTypes.createPolicy('bar', {});

      expect(getDefaultPolicy()).toBe(policy);
    });
  });

  describe('resetDefaultPolicy', () => {
    beforeEach(() => {
      TrustedTypes.createPolicy('default', {});
    });

    it('makes getDefaultPolicy return null', () => {
      expect(getDefaultPolicy()).not.toBe(null);
      resetDefaultPolicy();

      expect(getDefaultPolicy()).toBe(null);
    });

    it('allows creating a new default policy', () => {
      expect(() => {
        TrustedTypes.createPolicy('default', {});
      }).toThrow();
      resetDefaultPolicy();

      expect(() => {
        TrustedTypes.createPolicy('default', {});
      }).not.toThrow();
    });

    it('removes the default policy from policy names', () => {
      TrustedTypes.createPolicy('a', {});

      expect(TrustedTypes.getPolicyNames()).toContain('default');
      expect(TrustedTypes.getPolicyNames()).toContain('a');
      resetDefaultPolicy();

      expect(TrustedTypes.getPolicyNames()).not.toContain('default');
      expect(TrustedTypes.getPolicyNames()).toContain('a');
    });
  });

  describe('emptyHTML', () => {
    it('returns an empty-string wrapping object', () => {
      const html = TrustedTypes.emptyHTML;

      expect(TrustedTypes.isHTML(html)).toBe(true);
      expect(html.toString()).toEqual('');
    });

    it('returns the same object instance', () => {
      const [html, html2] = [TrustedTypes.emptyHTML, TrustedTypes.emptyHTML];

      expect(html).toBe(html2);
    });
  });
});
