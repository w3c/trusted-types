# Trusted Types @ TPAC 2019

https://github.com/w3c/webappsec-trusted-types

* A browser API to address DOM XSS
* Produce safe values for the DOM XSS injection sinks via policies
* Guard creation of policies via HTTP Response headers

```javascript
document.body.innerHTML = myPolicy.createHTML(location.hash);
// Running mySanitizer…
```

```javascript
document.body.innerHTML = location.hash
// TypeError: HTMLBodyElement.innerHTML requires TrustedHTML assignment.
// Dispatches a securitypolicyviolation event.
```

## Piloting in Google applications

Integration based on [Closure](https://github.com/google/closure-library) Safe Types. Adding Compile-time flag for Google Closure code [(impl.)](https://github.com/google/closure-library/blob/15537d4a561bd0e9efb007de87d77359f0dbe94b/closure/goog/base.js#L4185).

```javascript
if (BUILD_FLAG_TT_POLICY_NAME && window.trustedTypes) {
   policy =  trustedTypes.createPolicy(BUILD_FLAG_TT_POLICY_NAME, ...)
}
```
Instrumenting Closure Safe Types to wrap over Trusted Types. This rolled out for JS code used in applications under pilot. We also added `Content-Security-Policy-Report-Only` header to an application.

### Outcomes

* "We use (TT-compliant) Safe Types, and have safeguards for that"
* A lot of violations for TrustedURLs (img.src, a.href, iframe.src)
* Uncovered badness and anti-patterns
  * Custom script loaders we didn't know about
  * Legacy allowlists for unmaintained code
  * Not all code is compiled at build time (!)
* Driving wider refactorings to eradicate the badness

## Library integrations
We prepared integrations with popular JS libraries. Namely: **React, Angular, Vue, lit-html (Polymer), Karma, Jasmine, DOMPurify**. Details at https://github.com/w3c/webappsec-trusted-types/wiki/Integrations. We  see emerging *patterns* in the integrations.

## API changes
<!--
* Simplifying adoption
  * CSP integration, better violation reports
  * Robust report-only mode
  * TrustedURL deprecation, javascript: URIs handling
* New features
  * eval(TrustedScript)
  * Metadata API - what type should I use for a given sink?
-->

### Integration with CSP

```javascript
// Content-Security-Policy: trusted-types a b c;

trustedTypes.createPolicy('a', {...rules}) // OK, returns a policy
trustedTypes.createPolicy('d', {...rules}) // CSP violation, throws
```
This gives us **report-only**, defined **multiple headers behavior**, **propagation to other documents**. There's a new `'trusted-script'` keyword in `script-src` (for `eval` and `javascript:` exemptions.

#### Actionable violation reports
Enough data to debug an issue when migrating to Trusted Types.
```json
{
    "document-uri": "https://foo.example/",
    "violated-directive": "trusted-types",
    // ...
    "blocked-uri": "trusted-types-sink",
    "line-number": 25,
    "column-number": 40,
    "source-file": "http://foo.example/script/",
    "script-sample": "Element.innerHTML <img src=x>"  // Payload trimmed to 40 chars.
}
```
More data is available in your JS program (debug from within a policy).

#### Robust report-only mode

We introduced a way for a default policy to reject a value without throwing errors in report-only mode.

```javascript
trustedTypes.createPolicy('default', {
   createHTML: (s) => s.includes('<') ? null : s
 });
el.innerHTML = 'harmless'; // no violation report.
el.innerHTML = '<bad>';  // send violation report.
// In report-only, allow <bad>. Otherwise, throw a TypeError.
```

Collisions on policy names possible (same with `trusted-types *`)

###  TrustedURL deprecation
We only want to guard navigation to URLs because of `javascript:` scheme (it's not a `navigate-to` equivalent. What if instead of requiring types for `a.href`, we provided a safe by default, programmatic javascript: URL control on *navigation*?

Example: Under `Content-Security-Policy: trusted-types default;` javascript: stops working:

```javascript
a.href = 'javascript:alert(1)';
a.click(); // violation
```

... But there's also a way to re-enable some payloads:

```javascript
trustedTypes.createPolicy('default', {
    createScript: s => s === 'void(0)' ? s : null
});

a.href = 'javascript:void(0)';
a.click(); // allowed
```

For CSP `script-src`, this also requires `'trusted-script'` keyword. *Should it also require 'unsafe-inline'?*

### Granular control over eval()

This solves `'unsafe-eval'` dilemma - you don't have to migrate everything off eval. It requires ECMAScript proposal - https://github.com/tc39/proposal-dynamic-code-brand-checks.

Example: under `Content-Security-Policy: trusted-types foo`:

```javascript
trustedScript = fooPolicy.createScript('2');
eval(trustedScript) // 2
eval('2')           // Route through default policy
```

For CSP `script-src`, this also requires `'trusted-script'` keyword. *Should it also require 'unsafe-eval'?*

### Metadata API
Helps existing libraries produce the right type. Might also be a building block for sanitizers.

```javascript
trustedTypes.getPropertyType('div', 'innerHTML') // 'TrustedHTML'
trustedTypes.getAttributeType('script', 'src')   // 'TrustedScriptURL'
trustedTypes.getPropertyType('img', 'onload')    // 'TrustedScript'
trustedTypes.getAttributeType('img', 'alt')      // null
```

### Potential future developments
* String literals as trusted values - https://github.com/tc39/proposal-array-is-template-object
    ```javascript
    trustedScriptURL`https://this.literal.is.not.an.injection`
    trustedScriptURL`https://but.this.might.be.${dangerous}.and.will.fail`
    ```
* Built-in policies (HTML sanitizer? script-src allowlist?)
* Per script capabilities
    ```html
    <script src=jquery.js trusted-type-policy=my-policy-for-jquery>
    ```

### Summary
* The API has matured
* Working reference implementation, polyfill
* Existing integrations demonstrate feasibility
* Pilots demonstrate value to site operators
* Intent to migrate: github.com/w3c/webappsec-trusted-types/issues/215
* WICG ⇒ W3C ?
