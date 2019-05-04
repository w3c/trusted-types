(function(){/*

 Copyright 2017 Google Inc. All Rights Reserved.

 Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.

  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*/
'use strict';const c=()=>{throw new TypeError("undefined conversion");};function x(){throw new TypeError("Illegal constructor");}function F(){throw new TypeError("Illegal constructor");}
const {TrustedTypes:L}=function(){function y(a){let b=z.get(a);void 0===b&&(b=k(null),z.set(a,b));return b}function n(a){const b=G(a);if(null==b||G(b)!==N)throw Error();for(let f of A(b))p(a,f,{value:a[f]});return a}function l(a,b){g(a.prototype);delete a.name;p(a,"name",{value:b})}function q(a){return b=>b instanceof a&&z.has(b)}function O(a,b){function f(d,B){const P=b[B]||c,Q=g(new d(H,a));return g({[B](e){e=P(""+e);if(void 0===e||null===e)e="";e=""+e;const I=g(k(Q));y(I).v=e;return I}}[B])}let h=
k(x.prototype);for(const d of A(r))h[d]=f(r[d],d);p(h,"name",{value:a,writable:!1,configurable:!1,enumerable:!0});return g(h)}const {assign:R,create:k,defineProperty:p,freeze:g,getOwnPropertyNames:A,getPrototypeOf:G,prototype:N}=Object,{forEach:S,push:T}=Array.prototype,H=Symbol(),z=n(new WeakMap),C=n([]),J=n(new Map),D=n([]);let E=!1;class m{constructor(a,b){if(a!==H)throw Error("cannot call the constructor");p(this,"policyName",{value:b,enumerable:!0})}toString(){return y(this).v}valueOf(){return y(this).v}}
class t extends m{}l(t,"TrustedURL");class u extends m{}l(u,"TrustedScriptURL");class v extends m{}l(v,"TrustedHTML");class w extends m{}l(w,"TrustedScript");l(m,"TrustedType");const r={createHTML:v,createScriptURL:u,createURL:t,createScript:w},U=r.hasOwnProperty,K=k(F.prototype);R(K,{createPolicy:function(a,b,f=!1){if("default"==a&&!f){if(DOMException)throw new window.DOMException("The default policy must be exposed","InvalidStateError");throw new TypeError("The default policy must be exposed");
}if(E&&-1===D.indexOf(a))throw new TypeError("Policy "+a+" disallowed.");if(-1!==C.indexOf(a))throw new TypeError("Policy "+a+" exists.");C.push(a);const h=k(null);if(b&&"object"===typeof b)for(const d of A(b))U.call(r,d)&&(h[d]=b[d]);else console.warn("TrustedTypes.createPolicy "+a+" was given an empty policy");g(h);b=O(a,h);f&&J.set(a,b);return b},getExposedPolicy:function(a){return J.get(a)||null},getPolicyNames:function(){return C.slice()},a:q(v),f:q(t),c:q(u),b:q(w),TrustedHTML:v,TrustedURL:t,
TrustedScriptURL:u,TrustedScript:w});return{TrustedTypes:g(K),g:function(a){-1!==a.indexOf("*")?E=!1:(E=!0,D.length=0,S.call(a,b=>{T.call(D,""+b)}))}}}();if("undefined"!==typeof window&&"undefined"===typeof window.TrustedTypes){var M=Object.create(F.prototype);Object.assign(M,{isHTML:L.a,isURL:L.f,isScriptURL:L.c,isScript:L.b,createPolicy:L.createPolicy,getExposedPolicy:L.getExposedPolicy,getPolicyNames:L.getPolicyNames,_isPolyfill_:!0});window.TrustedTypes=Object.freeze(M);window.TrustedHTML=L.TrustedHTML;window.TrustedURL=L.TrustedURL;window.TrustedScriptURL=L.TrustedScriptURL;window.TrustedScript=L.TrustedScript;window.TrustedTypePolicy=x;window.TrustedTypePolicyFactory=
F};}).call(this);

//# sourceMappingURL=trustedtypes.api_only.build.js.map
