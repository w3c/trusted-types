# Explainer: Trusted Types for DOM Manipulation

See the [specification draft](https://wicg.github.io/trusted-types/dist/spec/) for a more comprehensive description of the API.

[![Build Status](https://travis-ci.org/WICG/trusted-types.svg)](https://travis-ci.org/WICG/trusted-types)

## The Problem

As described in Christoph Kern's "[Securing the Tangled Web](https://research.google.com/pubs/pub42934.html)",
Google has been fairly successful at combating DOM-based XSS attacks by relying on a set of
[typed objects](https://github.com/google/safe-html-types/blob/master/doc/index.md) instead of
strings to represent HTML snippets, URLs, etc. Compilation-time analysis done for JavaScript code
ensures that only these types can be used with various DOM APIs that can be used as DOM-based XSS
sinks (`el.innerHTML`, `location.href`, `ScriptElement.src` and so on). These types do not obliterate
DOM XSS in themselves, as authors may still create an instance of a type with an untrusted value.
Instead, it simplifies the security analysis of the application - security reviewers don't need to
deeply understand and review each and every usage of a given *sink*, but can instead focus their
efforts on the code that *generates* the typed objects. As long as these "trusted" types are always
generated from a small, reviewable subset of overall application code - safe templating libraries,
sanitizers, and so on, developers can have a high degree of confidence that the risk of DOM-based
XSS remains low.

Google's internal implementation has a number of bells and whistles (and makes a number of
assumptions about requirements) that probably aren't suitable for the world at large. It would be
interesting to explore how we might extract some more generic version of this concept from those
internal tools in order to bring this kind of functionality to the web in a generic fashion.
For example, different applications might have different opinions about what makes a particular
HTML snippet "safe", but regardless of the definition, it seems clear that the browser is
well-positioned to enforce type constraints dynamically at runtime. That would be a substantial
improvement over the tight link between the type system and the compiler.

## A Possible Approach

While we could jam all sorts of sanitization functionality into such a system, it seems reasonable
to start small until we know how existing templating systems and sanitizers will layer any
primitives we introduce into their existing systems. The following approach seems compelling as a
first step:

1.  Introduce a number of types that correspond to the XSS sinks we wish to protect. For example,
    we could define a `TrustedHTML` object that marks it as suitable for using via `innerHTML`
    (instead of a string). Or a `TrustedScriptURL` object that's suitable to be assigned to a
    `ScriptElement.src` attribute.

    These types should be pretty minimal in nature, making them polyfillable in browsers that don't
    support them natively.

2.  Enumerate all the XSS sinks we wish to protect, and overload each of them with a variant that
    accepts the matching type. For example, `Element.innerHTML`'s setter could accept `(DOMString or TrustedHTML)`,
    and we could overload `document.write(DOMString)` with `document.write(TrustedHTML)`.

    As above, this mechanism should be polyfillable; the polyfilled types define stringifiers which
    would enable them to be automatically cast into strings when called on existing setters.

3.  Introduce a mechanism for disabling the raw string version of each of the sinks identified
    above. For example, `Content-Security-Policy: trusted-types`
    header could cause the `innerHTML` setter to throw a `TypeError` if a raw string was passed in.

    This is possible to polyfill for many setters and
    methods, apart from the ones that aren't marked as [`[Unforgeable]`](https://heycam.github.io/webidl/#Unforgeable).

### Trusted Types

*   **TrustedHTML**: This type would be used to represent a trusted snippet that could be passed
    into an HTML context.

    ```
    interface TrustedHTML {
      stringifier;
    }
    ```

*   **TrustedURL**: This type would be used to represent a trusted URL that could be used to load
    non-scripting resources or navigate a frame.

    ```
    interface TrustedURL {
      stringifier;
    }
    ```

*   **TrustedScriptURL**: This type would be used to represent a URL that could be used to load
    resources that may result in script execution in the current document.

    ```
    interface TrustedScriptURL {
      stringifier;
    }
    ```

*   **TrustedScript**: This type would be used to represent a trusted JavaScript code block i.e.
    something that is trusted by the author to be executed by adding it to a `<script>` element
    content, inline event handler or passing to an `eval` function family.

    ```
    interface TrustedScript {
      stringifier;
    }
    ```

### Policies

Introducing and requiring typed objects is, sadly, not sufficient: Exposing raw Trusted Types constructors to the web authors presents a significant problem, in that
it only marginally improves the situation: while it allows certain libraries to produce and use typed
values in place of strings, it also allows constructing the types at will (see https://github.com/WICG/trusted-types/issues/31), and every
typed value construction in the application is a potential DOM XSS. Consider the following code
snippet from the previous version of the API:

```javascript
// DEPRECATED.
node.innerHTML = TrustedHTML.unsafelyCreate(variable)
```

Reasoning about DOM XSS susceptibility of an application riddled with the statements like above
is just as hard, as it was in the original DOM API. Therefore we propose the concept of *policies*
(not to be confused with CSP).

Raw typed object constructors from a string are forbidden. Instead, we introduce a programmatic
JavaScript API, allowing web authors to specify how the aforementioned objects can be created.
An application can create multiple named policies for a document. Typed objects can be constructed from a
string only by invoking one of those policies.

For example, an application may define a policy, in which `TrustedScriptURL` is a same-origin URL or the domain is from a whitelisted domain list. A
separate policy may pass a string through a custom HTML sanitization function before producing a
`TrustedHTML` object. As authors may create multiple policies with different rules, application may
hand over certain policies to separate submodules of its codebase, guarding how those submodules can
interact with DOM.

For example: the application author trusts the Foo library not to cause DOM XSS (it's known
to have a very robust HTML sanitizer, was already security reviewed and is well-maintained), so it
may initialize Foo with a no-op policy. At the same time, a 3rd party chat widget, or an Analytics
script should only be trusted to create `<div>` and `<img>` elements, so it's initialized with a
policy that only allows for that, and escapes (or removes) any other content.

Such API allows the authors to specify a set of policies that guard the typed objects creation.
As valid trusted type objects must originate from a policy, those policies alone form the **trusted codebase in regards to DOM XSS**, reducing the attack and security review surface considerably.

#### Policies API

```
interface TrustedTypePolicyFactory {
    TrustedTypePolicy createPolicy(DOMString policyName, TrustedTypeInnerPolicy policy, optional boolean expose = false);
    TrustedTypePolicy getExposedPolicy(DOMString policyName);
    Array<DOMString> getPolicyNames();
}
```
We propose to provide a `TrustedTypePolicyFactory` implementation under `window.TrustedTypes`. The most important function available in a `TrustedTypePolicyFactory` is `createPolicy`.

The policy rules for creating individual types are configured via the properties of `TrustedTypeInnerPolicy` object. Note that the functions operate on strings. The actual type construction is provided by the private API, not exposed to the authors.

```
interface TrustedTypeInnerPolicy {
    string createHTML(string);
    string createURL(string);
    string createScriptURL(string);
    string createScript(string);
}
```

Policy (with a unique name) can be created like this:

```javascript
const myPolicy = TrustedTypes.createPolicy('https://example.com#mypolicy', {
    createHTML: (s) => { return customSanitize(s) },
    createURL: (s) => { /* parse and validate the url. throw if non-conformant */ },
})
```

The policy object is returned, and can be used as a capability to create typed objects i.e. code parts without a reference to the policy object cannot use it.

Optionally, the policy may be exposed globally by calling `createPolicy` with `expose` argument set to `true`. Exposed policies can be retrieved via `TrustedTypes.getExposedPolicy`. This mode is recommended only for the strict, sanitizing, "last resort" type of policies.

The policy object can be used directly to create typed values that conform to its rules:

```javascript
 const trustedHtml = myPolicy.createHTML('<p>ok<script>not ok</script></p>')
 document.body.innerHTML = trustedHtml // does not throw.
 trustedHtml.toString() // <p>ok</p>, as the customSanitize removed the script.
```

This forms the core of the API, but there are additional features in development, it's best to see
the polyfill code.

#### Limiting policies

We propose to allow for whitelisting policy names in a CSP, e.g. in a following fashion:
```
Content-Security-Policy: trusted-types foo bar
```

That will assure that no additional policies are created at runtime. Creating a policy with a name
that was already created, or was not specified in the CSP throws, so introduction of non-reviewed
policies breaks the application functionally.

#### Default policy

There is an experimental support for a default policy that allows applications
to use strings with the injection sinks. These strings would be passed to a single
user-defined policy that sanitizes the value or rejects it. The intention is to
allow for a gradual migration of the code from strings towards Trusted Types.
Please check the [specification draft](https://wicg.github.io/trusted-types/dist/spec/#default-policy-hdr) for details.

### DOM Sinks

*   **HTML Contexts**: Given something like `typedef (DOMString or TrustedHTML) HTMLString`, we'd
    poke at a number of methods and attribute setters to accept the new type:

    ```
    partial interface Element {
        attribute HTMLString innerHTML;
        attribute HTMLString outerHTML;
        void insertAdjacentHTML(DOMString position, HTMLString text);
    };
    ```

    ```
    partial interface Document {
        void write(HTMLString text);
        void writeln(HTMLString text);
    };
    ```

    ```
    partial interface DOMParser {
        Document parseFromString(HTMLString str, SupportedType type);
    };
    ```

    ```
    partial interface Range {
        DocumentFragment createContextualFragment(HTMLString fragment);
    };
    ```

    ```
    partial interface HTMLIFrameElement {
         DOMString srcdoc;
    };
    ```

*   **URL Contexts**: Given something like `typedef (USVString or TrustedURL) URLString`, we'd poke
    at a number of methods and attribute setters to accept the new type:

    ```
    partial interface Location {
        stringifier attribute URLString href;
        void assign(URLString url);
        void replace(URLString url);

        // (These aren't `URLString`, but they should be something)
        DOMString pathname;
        DOMString search;
    };
    ```

    ```
    // A few element types go here. `HTMLBaseElement`, `HTMLLinkElement`
    // `HTMLHyperlinkElementUtils` from a quick skim through HTML.
    partial interface HTMLXXXElement : HTMLElement {
        attribute URLString href;
    };
    ```

    ```
    // A few element types go here. `HTMLSourceElement`, `HTMLImageElement`,
    // `HTMLIFrameElement`, `HTMLTrackElement`, `HTMLMediaElement`,
    // `HTMLInputElement`,  `HTMLFrameElement`
    // from a quick skim through HTML.
    //
    // The same applies to their SVG variants.
    partial interface HTMLXXXElement : HTMLElement {
        attribute URLString src;
        attribute URLString srcset; // Only `HTMLSourceElement` and `HTMLImageElement`
    };
    ```

    ```
    partial interface HTMLObjectElement : HTMLElement {
        attribute URLString data;
        attribute URLString codebase;
    };
    ```
    ```
    partial interface Document {
        attribute URLString location;
    };
    ```

    ```
    partial interface Window {
        attribute URLString location;
        void open(URLString location);
    };
    ```

* **Script URL Context**: Given something like `typedef (USVString or TrustedScriptURL) ScriptURLString`,
    we'd poke at a number of methods and attribute setters to accept the new type:

    ```
    partial interface WorkerGlobalScope {
        void importScripts(ScriptURLString... urls);
    };
    ```

    ```
    // A few element types go here. `HTMLEmbedElement`, `HTMLScriptElement`
    // from a quick skim through HTML.
    //
    // The same applies to their SVG variants.
    partial interface HTMLXXXElement : HTMLElement {
        attribute ScriptURLString src;
    };
    ```

*   **JavaScript Contexts**: Replace `DOMString` in the following with something
    reasonable.

    ```
    partial interface Window {
        void eval(DOMString code);
        void setTimeout(DOMString code, int timeout);
        void setInterval(DOMString code, int timeout);
    };
    ```

    ```
    partial interface HTMLScriptElement : HTMLElement {
        attribute DOMString innerText;
        attribute DOMString text;
        attribute DOMString textContent;
    };
    ```

## Open Questions

Some details have still not been sketched out - see [issues](https://github.com/WICG/trusted-types/issues).

## Polyfill

This repository contains a polyfill implementation. The compiled versions are stored in [`dist` directory](dist/)

### Browsers
The es5/es6 builds can be loaded directly in the browsers. There are two variants of the browser polyfill - **api_only** (light) and **full**. The *api_only* variant defines the API, so you can create policies and types. *Full* version also enables the type enforcement in the DOM, based on the CSP policy it infers from the current document (see [src/polyfill/full.js](src/polyfill/full.js)).

```html
<!-- API only -->
<script src="https://wicg.github.io/trusted-types/dist/es5/trustedtypes.api_only.build.js"></script>
<script>
     const p = TrustedTypes.createPolicy('foo', ...)
     document.body.innerHTML = p.createHTML('foo'); // works
     document.body.innerHTML = 'foo'; // but this one works too (no enforcement).
</script>
```

```html
<!-- Full -->
<script src="https://wicg.github.io/trusted-types/dist/es5/trustedtypes.build.js" data-csp="trusted-types foo bar"></script>
<script>
    TrustedTypes.createPolicy('foo', ...);
    TrustedTypes.createPolicy('unknown', ...); // throws
    document.body.innerHTML = 'foo'; // throws
</script>

```

### NodeJS
CommonJS polyfill is published as an npm package [trusted-types](https://www.npmjs.com/package/trusted-types):

```
$ npm install trusted-types
```

```javascript
const tt = require('trusted-types');
tt.createPolicy(...);
```
### Tinyfill

Due to the way the API is designed, it's possible to polyfill the most important
API surface (`TrustedTypes.createPolicy` function) with the following snippet:

```
if(typeof TrustedTypes == “undefined”)TrustedTypes={createPolicy:(n, rules) => rules};
```
It does not enable the enforcement, but allows the creation of policies that
return string values instead of Trusted Types in non-supporting browsers. Since
the injection sinks in those browsers accept strings, the values will be accepted
unless the policy throws an error. This tinyfill code allows most applications
to work in both Trusted-Type-enforcing and a legacy environment.

## Building

To build the polyfill yourself (Java required):

```
$ git clone https://github.com/mikewest/trusted-types/
$ cd trusted-types
$ npm install
$ npm run build
```

## Demo
To see the polyfill in action, visit the [demo page](https://wicg.github.io/trusted-types/demo/).

## Testing
It can be tested by running:
```
$ npm test
```
The polyfill can also be run against the [web platform test suite](https://github.com/w3c/web-platform-tests), but that requires small patches to the suite - see [tests/platform-tests/platform-tests-runner.sh](tests/platform-tests/platform-tests-runner.sh).

# Contributing

See [CONTRIBUTING](CONTRIBUTING.md).

# Questions?

Our [wiki](https://github.com/WICG/trusted-types/wiki) or the [specification](https://wicg.github.io/trusted-types/dist/spec/) may already contain an answer
to your question. If not, please [contact us](https://github.com/WICG/trusted-types/wiki/Contact)!
