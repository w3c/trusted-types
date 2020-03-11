/* eslint-disable require-jsdoc */
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
import {TrustedTypesEnforcer} from '../src/enforcer.js';
import {trustedTypes as TrustedTypes} from '../src/trustedtypes.js';

describe('TrustedTypesEnforcer', function() {
  const TEST_HTML = '<b>html</b>';

  const TEST_URL = 'http://example.com/script';

  const EVIL_URL = 'http://evil.example.com/script';

  const noopPolicy = {
    createHTML: (s) => s,
    createScriptURL: (s) => s,
    createScript: (s) => s,
  };

  const ENFORCING_CONFIG = new TrustedTypeConfig(
      /* isLoggingEnabled */ false,
      /* isEnforcementEnabled */ true,
      /* allowedPolicyNames */ ['default', 'named'],
      /* allowDuplicates */ false,
      /* cspString */ 'script-src https:; trusted-types *'
  );

  const NOOP_CONFIG = new TrustedTypeConfig(
      /* isLoggingEnabled */ false,
      /* isEnforcementEnabled */ false,
      /* allowedPolicyNames */ ['default', 'named'],
      /* allowDuplicates */ false
  );

  const LOGGING_CONFIG = new TrustedTypeConfig(
      /* isLoggingEnabled */ true,
      /* isEnforcementEnabled */ false,
      /* allowedPolicyNames */ ['default', 'named'],
      /* allowDuplicates */ false,
      /* cspString */ 'script-src https:'
  );

  function createSPVEvent(params) {
    if (!window.SecurityPolicyViolationEvent) {
      return false;
    }

    return new SecurityPolicyViolationEvent(
        'securitypolicyviolation',
        {
          'disposition': 'report',
          'documentURI': 'http://a.example',
          'effectiveDirective': 'x',
          'originalPolicy': 'y',
          'statusCode': 'x',
          'violatedDirective': 'x',
        }, params);
  }

  describe('install', function() {
    let enforcer;

    afterEach(function() {
      if (enforcer) {
        let testCleanedUp = false;
        try {
          enforcer.uninstall();
        } catch (ex) {
          // Test cleaned up after itself.
          testCleanedUp = true;
        }
        enforcer = undefined;
        if (!testCleanedUp) {
          throw new Error('Test did not clean up enforcer');
        }
      }
    });

    it('starts enforcing only after being called', function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      const el = document.createElement('div');

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).not.toThrow();

      enforcer.install();

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).toThrowError(TypeError);

      // TODO(msamuel): move to after test action.
      enforcer.uninstall();
    });

    it('does not enforce if no logging and no enforcement is required', () => {
      const enforcer = new TrustedTypesEnforcer(NOOP_CONFIG);
      const el = document.createElement('div');

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).not.toThrow();

      enforcer.install();

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).not.toThrow();

      expect(el.innerHTML).toEqual(TEST_HTML);

      // TODO(msamuel): move to after test action.
      enforcer.uninstall();
    });

    it('cannot be called twice', function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();

      expect(function() {
        enforcer.install();
      }).toThrow();

      enforcer.uninstall();

      // Attempted double installation does not leave us in a state
      // where two uninstalls are necessary/allowed.
      expect(function() {
        enforcer.uninstall();
      }).toThrow();
    });
  });

  describe('uninstall', function() {
    let enforcer;

    it('allows for uninstalling policies', function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      const el = document.createElement('div');
      enforcer.install();

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).toThrow();

      expect(el.innerHTML).toEqual(''); // Side effect did not happen.
      // TODO: should template elements allow innerHTML assignment?

      expect(function() {
        el.insertAdjacentHTML('afterbegin', TEST_HTML);
      }).toThrow();

      expect(el.innerHTML).toEqual('');

      enforcer.uninstall();

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).not.toThrowError(TypeError);
      // TODO(msamuel): why check error type but not when expecting error above?
      expect(el.innerHTML).toEqual(TEST_HTML); // Roughly

      expect(function() {
        el.insertAdjacentHTML('afterbegin', TEST_HTML);
      }).not.toThrowError(TypeError);

      expect(el.innerHTML).toEqual(`${TEST_HTML}${TEST_HTML}`); // Roughly
    });

    it('restores the script getters & setters', function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      const el = document.createElement('script');
      el.textContent = 'foo';

      enforcer.install();
      enforcer.uninstall();

      // Make sure the original setters are called.
      expect(el.textContent).toEqual('foo');
      el.innerText = 'bar';

      expect(el.textContent).toEqual('bar');
      el.text = 'baz';

      expect(el.innerText).toEqual('baz');
    });

    it('cannot be called twice', function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
      enforcer.uninstall();

      expect(function() {
        enforcer.uninstall();
      }).toThrow();
    });
  });

  describe('log-only config', function() {
    let enforcer;
    let el;
    let policy;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(LOGGING_CONFIG);
      policy = TrustedTypes.createPolicy('named', noopPolicy);
      enforcer.install();
      el = document.createElement('div');
      spyOn(console, 'warn');
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('allows for string assignments', function() {
      expect(function() {
        el.innerHTML = TEST_HTML;
      }).not.toThrow();

      expect(el.innerHTML).toEqual(TEST_HTML);
    });

    it('allows for typed assignments', function() {
      expect(function() {
        el.innerHTML = policy.createHTML(TEST_HTML);
      }).not.toThrow();

      expect(el.innerHTML).toEqual(TEST_HTML);
    });

    it('runs a default policy', function() {
      TrustedTypes.createPolicy('default', {
        'createHTML': (s) => 'default: ' + s,
      });

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).not.toThrow();

      expect(el.innerHTML).toEqual('default: ' + TEST_HTML);
    });

    it('runs an incomplete default policy', function() {
      TrustedTypes.createPolicy('default', {
        // Missing createHTML function.
      });

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).not.toThrow();

      expect(el.innerHTML).toEqual(TEST_HTML);
    });

    [null, undefined].forEach((v) =>
      it('uses original input if default policy returns ' + v, function() {
        TrustedTypes.createPolicy('default', {
          createHTML: (_) => v,
        });

        expect(function() {
          el.innerHTML = TEST_HTML;
        }).not.toThrow();

        expect(el.innerHTML).toEqual(TEST_HTML);
      }));

    it('logs for string assignments', function() {
      expect(function() {
        el.innerHTML = TEST_HTML;
      }).not.toThrow();
      // eslint-disable-next-line no-console
      expect(console.warn).toHaveBeenCalledWith(
          'Failed to set innerHTML on HTMLDivElement: This ' +
        'property requires TrustedHTML.', 'innerHTML',
          jasmine.any(HTMLDivElement), TrustedTypes.TrustedHTML, TEST_HTML);
    });

    describe('securitypolicyviolation event', () => {
      let caughtEvent;
      let el;

      // eslint-disable-next-line require-jsdoc
      function policyViolationCheck(e) {
        caughtEvent = e;
      }

      beforeEach(() => {
        el = document.createElement('div');
        document.body.appendChild(el);
        caughtEvent = null;
        if (!window.SecurityPolicyViolationEvent) {
          // skip tests if event is not supported.
          pending();
        }

        caughtEvent = null;
        document.addEventListener('securitypolicyviolation',
            policyViolationCheck, true);
      });

      afterEach(() => {
        document.removeEventListener('securitypolicyviolation',
            policyViolationCheck);
      });

      it('is dispatched on string assignments', () => {
        expect(function() {
          el.innerHTML = TEST_HTML;
        }).not.toThrow();

        expect(caughtEvent).not.toBe(null);
      });

      [null, undefined].forEach((v) =>
        it('is dispatched when default policy returns ' + v, () => {
          TrustedTypes.createPolicy('default', {
            'createHTML': (_) => v,
          });

          expect(function() {
            el.innerHTML = TEST_HTML;
          }).not.toThrow();

          expect(el.innerHTML).toEqual(TEST_HTML);

          expect(caughtEvent).not.toBe(null);
        }));

      it('is not dispatched when default policy returns a string', () => {
        TrustedTypes.createPolicy('default', {
          'createHTML': (_) => 'default',
        });

        expect(function() {
          el.innerHTML = TEST_HTML;
        }).not.toThrow();

        expect(el.innerHTML).toEqual('default');

        expect(caughtEvent).toBe(null);
      });

      it('is not dispatched when default policy throws', () => {
        TrustedTypes.createPolicy('default', {
          'createHTML': (_) => {
            throw new RangeError();
          },
        });

        expect(function() {
          el.innerHTML = TEST_HTML;
        }).toThrowError(RangeError);

        expect(el.innerHTML).toEqual('');

        expect(caughtEvent).toBe(null);
      });


      it('dispatches if element is not in any document', () => {
        const standaloneEl = document.createElement('div');

        expect(function() {
          standaloneEl.innerHTML = TEST_HTML;
        }).not.toThrow();

        expect(caughtEvent).not.toBe(null);
      });

      it('contains essential properties', () => {
        expect(function() {
          el.innerHTML = TEST_HTML;
        }).not.toThrow();

        expect(caughtEvent.originalPolicy).toEqual('script-src https:');
        expect(caughtEvent.type).toEqual('securitypolicyviolation');
        expect(caughtEvent.effectiveDirective).toEqual(
            'require-trusted-types-for');

        expect(caughtEvent.violatedDirective).toEqual(
            'require-trusted-types-for');

        expect(caughtEvent.documentURI).toEqual(document.location.href);
        expect(caughtEvent.blockedURI).toEqual('');
      });

      it('contains disposition', () => {
        expect(function() {
          el.innerHTML = TEST_HTML;
        }).not.toThrow();

        // Edge doesn't support sample
        let sampleEvent;
        if (!(sampleEvent = createSPVEvent({'disposition': 'report'}))
            || sampleEvent.disposition !== 'report') {
          pending();
        }

        expect(caughtEvent.disposition).toEqual('report');
      });

      it('contains sample', () => {
        expect(function() {
          el.innerHTML = TEST_HTML;
        }).not.toThrow();

        // Edge doesn't support sample
        let sampleEvent;
        if (!(sampleEvent = createSPVEvent({'sample': 'foo'}))
            || sampleEvent.sample !== 'foo') {
          pending();
        }

        expect(caughtEvent.sample).toEqual(
            'HTMLDivElement.innerHTML <b>html</b>');
      });

      it('trims sample', () => {
        // Edge doesn't support sample
        let sampleEvent;
        if (!(sampleEvent = createSPVEvent({'sample': 'foo'}))
            || sampleEvent.sample !== 'foo') {
          pending();
        }

        expect(function() {
          el.innerHTML = '<b>super long text maybe even user data:12345</b>';
        }).not.toThrow();

        expect(caughtEvent.sample).toEqual(
            // eslint-disable-next-line max-len
            'HTMLDivElement.innerHTML <b>super long text maybe even user data:');
      });

      it('contains blocked URI when known', () => {
        const el = document.createElement('script');
        document.body.appendChild(el);

        expect(function() {
          el.src = 'foo';
        }).not.toThrow();

        expect(caughtEvent.blockedURI).toEqual(location.origin + '/foo');
        expect(function() {
          el.src = 'http://example.com/bar';
        }).not.toThrow();

        expect(caughtEvent.blockedURI).toEqual('http://example.com/bar');
        expect(function() {
          el.src = 'javascript:alert(1)';
        }).not.toThrow();

        expect(caughtEvent.blockedURI).toEqual('javascript:alert(1)');
      });

      it('is not dispatched on typed assignments', () => {
        expect(function() {
          el.innerHTML = policy.createHTML(TEST_HTML);
        }).not.toThrow();

        expect(caughtEvent).toBe(null);
      });
    });

    it('does not log for typed assignments', function() {
      expect(function() {
        el.innerHTML = policy.createHTML(TEST_HTML);
      }).not.toThrow();
      // eslint-disable-next-line no-console
      expect(console.warn).not.toHaveBeenCalled();
    });
  });

  describe('enforcing config', function() {
    let enforcer;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('allows for assigning function to event handler properties', () => {
      const el = document.createElement('div');
      const spy = spyOn(window, 'alert');
      el.onclick = window.alert;
      el.onclick();

      expect(spy).toHaveBeenCalledWith();
    });

    it('allows for assigning null to event handler properties', () => {
      const el = document.createElement('div');
      el.onclick = null;
    });

    it('allows for Element.prototype.setAttributeNS for unknown namespaces',
        function() {
          const el = document.createElement('iframe');

          expect(function() {
            el.setAttributeNS('http://foo.bar', 'src', TEST_URL);
          }).not.toThrow();

          expect(el.getAttributeNS('http://foo.bar', 'src')).toEqual(TEST_URL);
          expect(el.getAttribute('src')).toEqual(TEST_URL);
          // It's not actually an XHTML src
          expect(el.getAttributeNode('src').namespaceURI).toEqual('http://foo.bar');
        });

    describe('securitypolicyviolation event', () => {
      let caughtEvent;
      let el;

      // eslint-disable-next-line require-jsdoc
      function policyViolationCheck(e) {
        caughtEvent = e;
      }

      beforeEach(() => {
        if (!window.SecurityPolicyViolationEvent) {
          // skip tests if event is not supported.
          pending();
        }
        el = document.createElement('div');
        document.body.appendChild(el);
        caughtEvent = null;
        document.addEventListener('securitypolicyviolation',
            policyViolationCheck, true);
      });

      afterEach(() => {
        document.removeEventListener('securitypolicyviolation',
            policyViolationCheck);
      });

      it('is dispatched on string assignments', () => {
        expect(function() {
          el.innerHTML = TEST_HTML;
        }).toThrow();

        expect(caughtEvent).not.toBe(null);
      });

      it('contains essential properties', () => {
        expect(function() {
          el.innerHTML = TEST_HTML;
        }).toThrow();

        expect(caughtEvent.originalPolicy).toEqual(
            'script-src https:; trusted-types *');

        expect(caughtEvent.type).toEqual('securitypolicyviolation');
        expect(caughtEvent.effectiveDirective).toEqual(
            'require-trusted-types-for');

        expect(caughtEvent.violatedDirective).toEqual(
            'require-trusted-types-for');

        expect(caughtEvent.documentURI).toEqual(document.location.href);
        expect(caughtEvent.blockedURI).toEqual('');
      });

      it('contains disposition', () => {
        expect(function() {
          el.innerHTML = TEST_HTML;
        }).toThrow();

        // Edge doesn't support disposition control
        let sampleEvent;
        if (!(sampleEvent = createSPVEvent({'disposition': 'report'}))
            || sampleEvent.disposition !== 'report') {
          pending();
        }

        expect(caughtEvent.disposition).toEqual('enforce');
      });

      it('contains blocked URI when known', () => {
        const el = document.createElement('script');
        document.body.appendChild(el);

        expect(function() {
          el.src = 'foo';
        }).toThrow();

        expect(caughtEvent.blockedURI).toEqual(location.origin + '/foo');
        expect(function() {
          el.src = 'http://example.com/bar';
        }).toThrow();

        expect(caughtEvent.blockedURI).toEqual('http://example.com/bar');
        expect(function() {
          el.src = 'javascript:alert(1)';
        }).toThrow();

        expect(caughtEvent.blockedURI).toEqual('javascript:alert(1)');
      });

      it('is not dispatched on typed assignments', () => {
        const policy = TrustedTypes.createPolicy('named', noopPolicy);

        expect(function() {
          el.innerHTML = policy.createHTML(TEST_HTML);
        }).not.toThrow();

        expect(caughtEvent).toBe(null);
      });
    });
  });

  describe('enforcement disables null assignments', function() {
    let enforcer;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('on setTimeout', function() {
      expect(function() {
        setTimeout(null, 100);
      }).toThrow();
    });
  });

  describe('enforcement uses default policy for script node modification',
      () => {
        let enforcer;

        beforeEach(function() {
          enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
          enforcer.install();
          TrustedTypes.createPolicy('default', {
            createScript: (s) => `/*${s}*/`,
          });
        });

        afterEach(function() {
          enforcer.uninstall();
        });

        it('via insertAdjacentText on script children', () => {
          // Setup: Create a <script> element with a <p> child.
          const s = document.createElement('script');
          const p = document.createElement('p');
          p.textContent = 'not in text';
          s.appendChild(p);

          // Sanity check: The <p> content doesn't count as source text.
          expect(s.text).toEqual('');

          // Try to insertAdjacentText into the <script>, starting from the <p>
          expect(() => {
            p.insertAdjacentText('beforebegin', 'before;');
          }).not.toThrow();

          expect(() => {
            p.insertAdjacentText('afterend', 'after;');
          }).not.toThrow();

          expect(s.text).toEqual('/*before;*//*after;*/');
          expect(s.childNodes[0].textContent).toEqual('/*before;*/');
          expect(s.childNodes[1]).toBe(p);
          expect(s.childNodes[2].textContent).toEqual('/*after;*/');
        });

        it('via text node insertion to non-attached script node', () => {
          // Variant: Create a <script> element and create & insert a text node.
          // Then insert it into the document container to make it live.
          const s = document.createElement('script');
          const text = document.createTextNode('alert("hello");');

          let addedNode;

          expect(() => {
            addedNode = s.appendChild(text);
          }).not.toThrow();

          expect(addedNode).not.toBe(text);
          expect(addedNode.textContent).toEqual('/*alert("hello");*/');
          expect(s.textContent).toEqual('/*alert("hello");*/');
        });

        it('via insertBefore on script child node', () => {
          // Variant: Create a <script> element and create & insert a text node.
          // Then insert it into the document container to make it live.
          const s = document.createElement('script');
          const p = document.createElement('p');
          s.appendChild(p);
          const text = document.createTextNode('alert("hello");');
          document.body.appendChild(s);

          expect(() => {
            s.insertBefore(text, p);
          }).not.toThrow();

          expect(s.text).toEqual('/*alert("hello");*/');
        });

        it('via Node.after', () => {
          if (!('after' in Element.prototype)) {
            pending();
          }
          const s = document.createElement('script');
          const p = document.createElement('p');
          s.appendChild(p);
          const text = document.createTextNode('textnode');
          const span = document.createElement('span');

          expect(() => {
            p.after(text, span, 'literaltext');
          }).not.toThrow();

          expect(s.childNodes.length).toEqual(4);

          expect(s.childNodes[0]).toBe(p);

          expect(s.childNodes[1].textContent).toEqual('/*textnode*/');

          expect(s.childNodes[2]).toBe(span); // untouched by the wrapper

          expect(s.childNodes[3].textContent).toEqual('/*literaltext*/');
        });

        it('and is passed script.text as a sink name', () => {
          enforcer.uninstall();
          TrustedTypes.createPolicy('default', {
            createScript: (_, sink) => `/*${sink}*/`,
          });
          enforcer.install();

          const s = document.createElement('script');
          const text = document.createTextNode('alert("hello");');

          let addedNode;

          expect(() => {
            addedNode = s.appendChild(text);
          }).not.toThrow();

          expect(addedNode).not.toBe(text);
          expect(addedNode.textContent).toEqual('/*script.text*/');
          expect(s.textContent).toEqual('/*script.text*/');
        });
      });

  describe('enforcement disables script node modification', () => {
    let enforcer;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('via insertAdjacentText on script children', () => {
      // Setup: Create a <script> element with a <p> child.
      const s = document.createElement('script');
      const p = document.createElement('p');
      p.textContent = 'fail()';
      s.appendChild(p);

      // Sanity check: The <p> content doesn't count as source text.
      expect(s.text).toEqual('');

      // Try to insertAdjacentText into the <script>, starting from the <p>
      expect(() => {
        p.insertAdjacentText('beforebegin', 'hello("before");');
      }).toThrow();

      expect(s.text).toEqual('');
      expect(() => {
        p.insertAdjacentText('afterend', 'hello("after");');
      }).toThrow();

      expect(s.text).toEqual('');
    });

    it('via text node insertion to non-attached script node', () => {
      // Variant: Create a <script> element and create & insert a text node.
      // Then insert it into the document container to make it live.
      const s = document.createElement('script');
      const text = document.createTextNode('alert("hello");');

      expect(() => {
        s.appendChild(text);
      }).toThrow();
    });

    it('via text node insertion to an attached script node', () => {
      // Variant: Create a <script> element and create & insert a text node.
      // Then insert it into the document container to make it live.
      const s = document.createElement('script');
      const text = document.createTextNode('alert("hello");');
      document.body.appendChild(s);

      expect(() => {
        s.appendChild(text);
      }).toThrow();
    });

    it('via insertBefore on script child node', () => {
      // Variant: Create a <script> element and create & insert a text node.
      // Then insert it into the document container to make it live.
      const s = document.createElement('script');
      const p = document.createElement('p');
      s.appendChild(p);
      const text = document.createTextNode('alert("hello");');
      document.body.appendChild(s);

      expect(() => {
        s.insertBefore(text, p);
      }).toThrow();
    });

    it('via replaceChild on script node', () => {
      // Variant: Create a <script> element and create & insert a text node.
      // Then insert it into the document container to make it live.
      const s = document.createElement('script');
      const p = document.createElement('p');
      s.appendChild(p);
      const text = document.createTextNode('alert("hello");');
      document.body.appendChild(s);

      expect(() => {
        s.replaceChild(text, p);
      }).toThrow();
    });

    describe('via new multi-param methods', () => {
      const s = document.createElement('script');
      const p = document.createElement('p');
      const text = document.createTextNode('alert(/textnode/)');

      // Methods documented in
      // https://developer.mozilla.org/en-US/docs/Web/API/ChildNode
      // https://developer.mozilla.org/en-US/docs/Web/API/ParentNode

      [
        [p, 'replaceWith'],
        [p, 'after'],
        [p, 'before'],
        [s, 'append'],
        [s, 'prepend'],
      ].forEach(([o, functionName]) => {
        it(functionName, () => {
          if (!o[functionName]) {
            pending();
          }
          s.appendChild(p);
          const fn = o[functionName].bind(o);

          expect(() => {
            fn('alert(1)');
          }).toThrow();

          expect(() => {
            fn(text);
          }).toThrow();

          expect(() => {
            fn('alert(1)', '');
          }).toThrow();

          expect(() => {
            fn(text, 'alert(1)');
          }).toThrow();

          expect(s.childNodes.length).toEqual(1);
          expect(s.text).toEqual('');
        });
      });
    });
  });

  describe('enforcement disables string assignments', function() {
    let enforcer;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('on innerHTML', function() {
      const el = document.createElement('div');

      expect(function() {
        el.innerHTML = TEST_HTML;
      }).toThrow();

      expect(el.innerHTML).toEqual('');
    });

    it('on outerHTML', function() {
      const wrap = document.createElement('div');
      const el = document.createElement('div');
      wrap.appendChild(el);

      expect(function() {
        el.outerHTML = TEST_HTML;
      }).toThrow();

      expect(el.outerHTML).toEqual('<div></div>');
    });

    it('on Shadow DOM ShadowRoot.innerHTML', function() {
      const wrap = document.createElement('div');
      if (!('attachShadow' in wrap)) {
        pending();
      }
      const shadow = wrap.attachShadow({mode: 'open'});

      expect(function() {
        shadow.innerHTML = TEST_HTML;
      }).toThrow();

      expect(wrap.shadowRoot.innerHTML).toEqual('');
    });

    it('on iframe srcdoc', function() {
      const el = document.createElement('iframe');
      if (!('srcdoc' in el)) {
        // No srcdoc support at all, skip test
        pending();
      }

      expect(function() {
        el.srcdoc = TEST_HTML;
      }).toThrow();

      expect(!el.srcdoc).toEqual(true);
    });

    it('on object codebase', function() {
      const el = document.createElement('object');

      expect(function() {
        el.setAttribute('codebase', TEST_URL);
      }).toThrow();

      expect(el.codeBase).toBe('');
    });

    it('on Range.createContextualFragment', function() {
      const range = document.createRange();

      expect(function() {
        range.createContextualFragment(TEST_HTML);
      }).toThrow();
    });

    it('on Element.insertAdjacentHTML', function() {
      const el = document.createElement('div');

      expect(function() {
        el.insertAdjacentHTML('afterbegin', TEST_HTML);
      }).toThrow();

      expect(el.innerHTML).toEqual('');
    });

    it('on HTMLScriptElement.src', function() {
      const el = document.createElement('script');

      expect(function() {
        el.src = TEST_URL;
      }).toThrow();

      expect(el.src).toEqual('');
    });

    it('on iframe.srcdoc via setAttribute', function() {
      const el = document.createElement('iframe');

      expect(function() {
        el.setAttribute('srcdoc', TEST_HTML);
      }).toThrow();

      expect(el.srcdoc).not.toContain(TEST_HTML);
    });

    it('on inline event handlers via setAttribute', function() {
      const el = document.createElement('a');

      expect(function() {
        el.setAttribute('onclick', 'console.log(1)');
      }).toThrow();

      expect(el.onclick).toBe(null);
    });

    it('on inert element inline event handlers via setAttribute', function() {
      const el = document.createElement('section');

      expect(function() {
        el.setAttribute('onclick', 'console.log(1)');
      }).toThrow();

      expect(el.onclick).toBe(null);
    });

    it('on HTMLScriptElement.innerText', function() {
      const el = document.createElement('script');

      expect(function() {
        el.innerText = 'console.log(1)';
      }).toThrow();

      expect(el.innerText).toEqual('');
    });

    it('on HTMLScriptElement.text', function() {
      const el = document.createElement('script');

      expect(function() {
        el.text = 'console.log(1)';
      }).toThrow();

      expect(el.text).toEqual('');
    });

    it('on HTMLScriptElement.textContent', function() {
      const el = document.createElement('script');

      expect(function() {
        el.textContent = 'console.log(1)';
      }).toThrow();

      expect(el.textContent).toEqual('');
    });

    it('on Element.prototype.setAttribute', function() {
      const el = document.createElement('iframe');

      expect(function() {
        el.setAttribute('srcdoc', TEST_HTML);
      }).toThrow();

      expect(el.src).toEqual('');
    });

    it('on Element.prototype.setAttributeNS', function() {
      const el = document.createElement('iframe');

      expect(function() {
        el.setAttributeNS('http://www.w3.org/1999/xhtml', 'srcdoc', TEST_HTML);
      }).toThrow();

      // Null on some browsers, but empty string on Edge.
      expect(el.getAttributeNS('http://www.w3.org/1999/xhtml', 'srcdoc')).toBeFalsy();
    });

    it('on Element.prototype.setAttributeNS (empty ns)', function() {
      const el = document.createElement('iframe');

      expect(function() {
        el.setAttributeNS('', 'srcdoc', TEST_HTML);
      }).toThrow();

      // Null on some browsers, but empty string on Edge.
      expect(el.getAttributeNS('http://www.w3.org/1999/xhtml', 'srcdoc')).toBeFalsy();
    });

    it('on svg:a innerHTML', function() {
      // This works in FF & Chrome. xlink is deprecated.
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const a = document.createElementNS('http://www.w3.org/2000/svg', 'a');

      svg.appendChild(a);

      // Not checking for throwing, as on IE it does not throw, but innerHTML
      // is ignored. Adding a proper throwing would increase the size of the
      // polyfill, but should not be needed for security.
      expect(a.childNodes.length).toEqual(0);
    });

    it('on document.write', function() {
      expect(function() {
        document.write('<foo>');
      }).toThrow();

      expect(document.body.innerHTML).not.toContain('<foo>');
    });

    it('on setTimeout', function(done) {
      setTimeout(function() {
        done();
      }, 150);

      expect(function() {
        setTimeout('fail(\'should not execute\')', 100);
      }).toThrow();
    });

    it('on DOMParser.parseFromString', function() {
      expect(function() {
        new DOMParser().parseFromString('<foo>', 'text/html');
      }).toThrow();
    });

    // TODO: fix #47
    // eslint-disable-next-line jasmine/no-disabled-tests
    xit('on copy attribute crossing types', function() {
      const div = document.createElement('div');
      const input = document.createElement('input');

      div.setAttribute('formaction', TEST_URL);
      const attr = div.getAttributeNode('formaction');
      div.removeAttributeNode(attr);

      expect(function() {
        input.setAttributeNode(attr);
      }).toThrow();

      expect(input.formAction).toEqual('');
    });

    it('on copy innocuous attribute', function() {
      const div = document.createElement('div');
      const span = document.createElement('span');

      div.setAttribute('src', TEST_URL);
      const attr = div.getAttributeNode('src');
      div.removeAttributeNode(attr);
      span.setAttributeNode(attr);

      expect(span.getAttribute('src')).toEqual(TEST_URL);
    });

    it('on non-lowercase Element.prototype.setAttribute', function() {
      const el = document.createElement('iframe');

      expect(function() {
        el.setAttribute('SrCdoc', TEST_HTML);
      }).toThrow();

      expect(el.srcdoc).toEqual('');
    });
  });

  describe('setAttributeWrapper', function() {
    let enforcer;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('passes through inert attributes', function() {
      const el = document.createElement('link');
      el.setAttribute('rel', 'stylesheet');

      expect(el.getAttribute('rel')).toEqual('stylesheet');
      expect(el.rel).toEqual('stylesheet');
    });

    it('passes through inert elements', function() {
      const el = document.createElement('section');
      el.setAttribute('id', 'foo');

      expect(el.getAttribute('id')).toEqual('foo');
      expect(el.id).toEqual('foo');
    });

    it('passes through on attributes if the event is unknown', function() {
      const el = document.createElement('section');
      el.setAttribute('ontotallyfakeevent', 'foo');

      expect(el.getAttribute('ontotallyfakeevent')).toEqual('foo');
    });
  });

  describe('enforcement allows type-based assignments', function() {
    let enforcer;
    let policy;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
      policy = TrustedTypes.createPolicy('named', noopPolicy);
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('on innerHTML', function() {
      const el = document.createElement('div');
      el.innerHTML = policy.createHTML(TEST_HTML);

      expect(el.innerHTML).toEqual(TEST_HTML);
    });

    it('on outerHTML', function() {
      const wrap = document.createElement('div');
      const el = document.createElement('div');
      wrap.appendChild(el);

      expect(function() {
        el.outerHTML = policy.createHTML(TEST_HTML);
      }).not.toThrow();
    });

    it('on Shadow DOM ShadowRoot.innerHTML', function() {
      const wrap = document.createElement('div');
      if (!('attachShadow' in wrap)) {
        return pending();
      }
      const shadow = wrap.attachShadow({mode: 'open'});

      expect(function() {
        shadow.innerHTML = policy.createHTML(TEST_HTML);
      }).not.toThrow();

      expect(wrap.shadowRoot.innerHTML).toEqual(TEST_HTML);
    });

    it('on iframe srcdoc', function() {
      const el = document.createElement('iframe');
      if (!('srcdoc' in el)) {
        // No srcdoc support at all, skip test
        pending();
      }

      expect(function() {
        el.srcdoc = policy.createHTML(TEST_HTML);
      }).not.toThrow();

      expect(el.srcdoc).toEqual(TEST_HTML);
    });

    it('on Range.createContextualFragment', function() {
      const range = document.createRange();

      const fragment = range.createContextualFragment(
          policy.createHTML(TEST_HTML));

      expect(fragment.childNodes[0].outerHTML).toEqual(TEST_HTML);
    });


    it('on Element.insertAdjacentHTML', function() {
      const el = document.createElement('div');

      el.insertAdjacentHTML('afterbegin', policy.createHTML('bar'));
      el.insertAdjacentHTML('afterbegin', policy.createHTML('foo'));

      expect(el.innerHTML).toEqual('foo' + 'bar');
    });

    it('on HTMLScriptElement.src', function() {
      const el = document.createElement('script');

      el.src = policy.createScriptURL(TEST_URL);

      expect(el.src).toEqual(TEST_URL);
    });

    it('on inline event handlers via setAttribute', function() {
      const el = document.createElement('a');
      const alert = spyOn(window, 'alert');

      expect(function() {
        el.setAttribute('onclick', policy.createScript('window.alert()'));
      }).not.toThrow();

      el.onclick();

      // null is ok
      expect(alert).toHaveBeenCalledWith();
      expect(function() {
        el.setAttribute('onmouseover', null);
      }).not.toThrow();
    });

    it('on HTMLScriptElement.innerText', function() {
      const el = document.createElement('script');

      expect(function() {
        el.innerText = policy.createScript('console.log(1)');
      }).not.toThrow();

      expect(el.innerText).toEqual('console.log(1)');
    });

    it('on document.write', function() {
      enforcer.uninstall();
      const mockWrite = spyOn(document, 'write');
      enforcer.install();
      const html = policy.createHTML('<foo>');
      document.write(html);

      expect(mockWrite).toHaveBeenCalledWith(html);
    });

    it('on setTimeout', function(done) {
      /* eslint-disable no-invalid-this */
      this.foo = '';
      const script = policy.createScript('this.foo = \'hello\'');
      setTimeout(function() {
        expect(this.foo).toEqual('hello');
        delete this.foo;
        done();
      }, 150);
      /* eslint-enable no-invalid-this */
      expect(function() {
        setTimeout(script, 100);
      }).not.toThrow();
    });

    it('on DOMParser.parseFromString', function() {
      const dom = new DOMParser().parseFromString(
          policy.createHTML('<foo>'), 'text/html');

      expect(dom.body.innerHTML).toContain('<foo>');
    });

    it('independent of String(...)', function() {
      const el = document.createElement('script');

      // String(...) is a common, confusable idiom for converting to a
      // string.
      const originalString = String;
      try {
        try {
          // eslint-disable-next-line no-global-assign
          String = () => EVIL_URL;
        } catch (ex) {
          // Ok if assignment to String fails.
        }
        el.src = policy.createScriptURL(TEST_URL);
      } finally {
        if (String !== originalString) {
          // eslint-disable-next-line no-global-assign
          String = originalString;
        }
      }

      expect(el.src).toEqual(TEST_URL);
    });

    it('independent of valueOf()', function() {
      const el = document.createElement('script');

      // The idiom ('' + obj) actually invokes valueOf first, not toString.
      const originalValueOf = Object.prototype.valueOf;
      try {
        try {
          // eslint-disable-next-line no-extend-native
          Object.prototype.valueOf = () => EVIL_URL;
        } catch (ex) {
          // Ok if assignment to Object.prototype fails.
        }
        el.src = policy.createScriptURL(TEST_URL);
      } finally {
        if (Object.prototype.valueOf !== originalValueOf) {
          // eslint-disable-next-line no-extend-native
          Object.prototype.valueOf = originalValueOf;
        }
      }

      expect(el.src).toEqual(TEST_URL);
    });

    it('on Element.prototype.setAttribute', function() {
      const el = document.createElement('iframe');

      el.setAttribute('srcdoc', policy.createHTML(TEST_HTML));

      expect(el.srcdoc).toEqual(TEST_HTML);
    });

    it('on object codebase', function() {
      const el = document.createElement('object');

      el.setAttribute('codebase', policy.createScriptURL(TEST_URL));

      expect(el.codeBase).toBe(TEST_URL);
      expect(el.codebase).toBe(undefined);
    });
  });

  describe('enforcement allowed policy names', function() {
    let enforcer;

    afterEach(function() {
      enforcer.uninstall();
    });

    it('is respected on createPolicy', function() {
      enforcer = new TrustedTypesEnforcer(new TrustedTypeConfig(
          /* isLoggingEnabled */ false,
          /* isEnforcementEnabled */ true,
          /* allowedPolicyNames*/ ['foo'],
          /* allowDuplicates */ false
      ));
      enforcer.install();

      expect(() => TrustedTypes.createPolicy('foo', {
        'createHTML': (s) => s,
      })).not.toThrow();

      expect(() => TrustedTypes.createPolicy('bar', {
        'createHTML': (s) => s,
      })).toThrow();
    });
  });

  describe('enforcement default policy', function() {
    let enforcer;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(new TrustedTypeConfig(
          /* isLoggingEnabled */ false,
          /* isEnforcementEnabled */ true,
          /* allowedPolicyNames */ ['default', 'named'],
          /* allowDuplicates */ true
      ));
      enforcer.install();
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('is used on strings', function() {
      TrustedTypes.createPolicy('default', {
        'createHTML': (s) => {
          return 'fallback:' + s;
        },
      });
      const el = document.createElement('div');
      el.innerHTML = TEST_HTML;

      expect(el.innerHTML).toEqual('fallback:' + TEST_HTML);
    });

    it('is passed the sink name', function() {
      enforcer.uninstall();
      const mockSetTimeout = spyOn(window, 'setTimeout');
      enforcer.install();

      TrustedTypes.createPolicy('default', {
        'createHTML': (s, sink) => {
          return `fallback:${sink}:${s}`;
        },
        'createScript': (s, sink) => {
          return `//${sink}`;
        },

      });
      const el = document.createElement('div');
      el.innerHTML = TEST_HTML;

      expect(el.innerHTML).toEqual('fallback:div.innerHTML:' + TEST_HTML);

      expect(function() {
        window.setTimeout('/**/', 1);
      }).not.toThrow();

      expect(mockSetTimeout).toHaveBeenCalledWith(
          jasmine.stringMatching('//Window.setTimeout'), 1);
    });

    it('is not used on typed values', function() {
      TrustedTypes.createPolicy('default', {
        'createHTML': (s) => {
          return 'fallback:' + s;
        },
      });
      const policy = TrustedTypes.createPolicy('named', noopPolicy);
      const el = document.createElement('div');
      el.innerHTML = policy.createHTML(TEST_HTML);

      expect(el.innerHTML).toEqual(TEST_HTML);
    });

    it('fails when fallback is not installed', function() {
      const el = document.createElement('div');

      expect(() => el.innerHTML = TEST_HTML).toThrowError(TypeError);
      expect(el.innerHTML).toEqual('');
    });

    it('propagates the error thrown from the policy', function() {
      TrustedTypes.createPolicy('default', {
        'createHTML': (s) => {
          throw new EvalError();
        },
      });
      const el = document.createElement('div');

      expect(() => el.innerHTML = 'throw,please')
          .toThrowError(EvalError);

      expect(el.innerHTML).toEqual('');
    });

    it('prevents value change if error is thrown from the policy', function() {
      TrustedTypes.createPolicy('default', {
        'createHTML': (s) => {
          if (s == 'foo') {
            return 'foo';
          }
          throw new EvalError();
        },
      });
      const el = document.createElement('div');
      el.innerHTML = 'foo';

      expect(() => el.innerHTML = 'throw,please')
          .toThrowError(EvalError);

      expect(el.innerHTML).toEqual('foo');
    });

    [null, undefined].forEach((v) => it('throws TypeError on ' + v, function() {
      TrustedTypes.createPolicy('default', {
        'createHTML': (s) => {
          return v;
        },
      });
      const el = document.createElement('div');

      expect(() => el.innerHTML = 'throw,please')
          .toThrowError(TypeError);

      expect(el.innerHTML).toEqual('');
    }));
  });

  describe('enforcement does not mix the types', function() {
    let enforcer;
    let policy;

    beforeEach(function() {
      enforcer = new TrustedTypesEnforcer(ENFORCING_CONFIG);
      enforcer.install();
      policy = TrustedTypes.createPolicy('named', noopPolicy);
    });

    afterEach(function() {
      enforcer.uninstall();
    });

    it('on innerHTML', function() {
      const el = document.createElement('div');

      expect(() => {
        el.innerHTML = policy.createScript('foo');
      }).toThrow();

      expect(() => {
        el.innerHTML = policy.createScriptURL(TEST_URL);
      }).toThrow();

      expect(el.innerHTML).toEqual('');
    });

    it('on Element.insertAdjacentHTML', function() {
      const el = document.createElement('div');

      expect(() => {
        el.insertAdjacentHTML('afterbegin', policy.createScript('bar'));
      }).toThrow();

      expect(() => {
        el.insertAdjacentHTML('afterbegin', policy.createScriptURL('foo'));
      }).toThrow();

      expect(el.innerHTML).toEqual('');
    });

    it('on HTMLScriptElement.src', function() {
      const el = document.createElement('script');

      expect(() => {
        el.src = policy.createHTML(TEST_URL);
      }).toThrow();

      expect(() => {
        el.src = policy.createScript(TEST_URL);
      }).toThrow();

      expect(el.src).toEqual('');
    });

    it('on Element.prototype.setAttribute', function() {
      const el = document.createElement('iframe');

      expect(() => {
        el.srcdoc = policy.createScript(TEST_URL);
      }).toThrow();

      expect(() => {
        el.srcdoc = policy.createScriptURL(TEST_URL);
      }).toThrow();

      expect(el.srcdoc).toEqual('');
    });

    it('on HTMLElement innocuous attribute', function() {
      const el = document.createElement('div');

      el.title = policy.createHTML(TEST_URL);

      expect(el.title).toEqual(TEST_URL);

      el.title = policy.createScript(TEST_HTML);

      expect(el.title).toEqual(TEST_HTML);
    });
  });
});
