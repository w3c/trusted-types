(function(){/*

 Copyright 2017 Google Inc. All Rights Reserved.

 Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.

  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*/
'use strict';const d=function(){function t(a){let b=u.get(a);void 0===b&&(b=h(null),u.set(a,b));return b}function k(a){const b=A(a);if(null==b||A(b)!==D)throw Error();for(let e of v(b))w(a,e,{value:a[e]});return a}function c(a,b){e(a.prototype);delete a.name;w(a,"name",{value:b})}function l(a){return(b)=>b instanceof a&&u.has(b)}function E(a,b){function c(F,c){const f=b[c]||G,g=e(new F(B,a));return e({[c](a){a=""+f(a);const b=e(h(g));t(b).v=a;return b}}[c])}let f=h(null);for(const a of v(m))f[a]=
c(m[a],a);return e(f)}const {create:h,defineProperty:w,freeze:e,getOwnPropertyNames:v,getPrototypeOf:A,prototype:D}=Object,{forEach:H,push:I}=Array.prototype,B=Symbol(),u=k(new WeakMap),x=k([]),C=k(new Map),y=k([]);let z=!1;class n{constructor(a,b){if(a!==B)throw Error("cannot call the constructor");w(this,"policyName",{value:""+b,enumerable:!0})}toString(){return t(this).v}valueOf(){return t(this).v}}class g extends n{}c(g,"TrustedURL");class p extends g{}c(p,"TrustedScriptURL");class q extends n{}
c(q,"TrustedHTML");class r extends n{}c(r,"TrustedScript");c(n,"TrustedType");const m={createHTML:q,createScriptURL:p,createURL:g,createScript:r},J=m.hasOwnProperty,G=()=>{throw Error("undefined conversion");};return e({a:q,f:g,c:p,b:r,g:function(a,b,c=!1){a=""+a;if(z&&-1===y.indexOf(a))throw Error("Policy "+a+" disallowed.");if(-1!==x.indexOf(a))throw Error("Policy "+a+" exists.");x.push(a);const f=h(null);for(const a of v(b))J.call(m,a)&&(f[a]=b[a]);e(f);b=E(a,f);c&&C.set(a,b);return b},h:function(a){return C.get(""+
a)||null},i:function(){return x.slice()},s:l(q),A:l(g),w:l(p),u:l(r),B:function(a){-1!==a.indexOf("*")?z=!1:(z=!0,y.length=0,H.call(a,(a)=>{I.call(y,""+a)}))}})}();"undefined"!==typeof window&&"undefined"===typeof window.TrustedTypes&&(window.TrustedTypes={TrustedHTML:d.a,TrustedURL:d.f,TrustedScriptURL:d.c,TrustedScript:d.b,createHTML:d.j,createURL:d.o,createScriptURL:d.m,createScript:d.l,createPolicy:d.g,getExposedPolicy:d.h,getPolicyNames:d.i});}).call(window);//# sourceMappingURL=trustedtypes.api_only.build.js.map
