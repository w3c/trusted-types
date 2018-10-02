(function(){/*

 Copyright 2017 Google Inc. All Rights Reserved.

 Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.

  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*/
'use strict';const g=function(){function t(a){let b=u.get(a);void 0===b&&(b=h(null),u.set(a,b));return b}function k(a){const b=A(a);if(null==b||A(b)!==D)throw Error();for(let d of v(b))w(a,d,{value:a[d]});return a}function c(a,b){d(a.prototype);delete a.name;w(a,"name",{value:b})}function l(a){return(b)=>b instanceof a&&u.has(b)}function E(a,b){function c(F,c){const e=b[c]||G,f=d(new F(B,a));return d({[c](a){a=e(a);if(void 0===a||null===a)a="";a=""+a;const b=d(h(f));t(b).v=a;return b}}[c])}let e=
h(null);for(const a of v(m))e[a]=c(m[a],a);e.name=a;return d(e)}const {create:h,defineProperty:w,freeze:d,getOwnPropertyNames:v,getPrototypeOf:A,prototype:D}=Object,{forEach:H,push:I}=Array.prototype,B=Symbol(),u=k(new WeakMap),x=k([]),C=k(new Map),y=k([]);let z=!1;class n{constructor(a,b){if(a!==B)throw Error("cannot call the constructor");w(this,"policyName",{value:""+b,enumerable:!0})}toString(){return t(this).v}valueOf(){return t(this).v}}class f extends n{}c(f,"TrustedURL");class p extends f{}
c(p,"TrustedScriptURL");class q extends n{}c(q,"TrustedHTML");class r extends n{}c(r,"TrustedScript");c(n,"TrustedType");const m={createHTML:q,createScriptURL:p,createURL:f,createScript:r},J=m.hasOwnProperty,G=()=>{throw new TypeError("undefined conversion");};return d({a:q,f,c:p,b:r,g:function(a,b,c=!1){a=""+a;if(z&&-1===y.indexOf(a))throw new TypeError("Policy "+a+" disallowed.");if(-1!==x.indexOf(a))throw new TypeError("Policy "+a+" exists.");x.push(a);const e=h(null);if(b&&"object"===typeof b)for(const a of v(b))J.call(m,
a)&&(e[a]=b[a]);else console.warn("TrustedTypes.createPolicy "+a+" was given an empty policy");d(e);b=E(a,e);c&&C.set(a,b);return b},h:function(a){return C.get(""+a)||null},i:function(){return x.slice()},j:l(q),o:l(f),m:l(p),l:l(r),s:function(a){-1!==a.indexOf("*")?z=!1:(z=!0,y.length=0,H.call(a,(a)=>{I.call(y,""+a)}))}})}();"undefined"!==typeof window&&"undefined"===typeof window.TrustedTypes&&(window.TrustedTypes={TrustedHTML:g.a,TrustedURL:g.f,TrustedScriptURL:g.c,TrustedScript:g.b,createPolicy:g.g,getExposedPolicy:g.h,getPolicyNames:g.i});}).call(window);//# sourceMappingURL=trustedtypes.api_only.build.js.map
