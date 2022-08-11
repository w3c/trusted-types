(function(){/*

 Copyright 2017 Google Inc. All Rights Reserved.

 Licensed under the W3C SOFTWARE AND DOCUMENT NOTICE AND LICENSE.

  https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
*/
function da(a){var b=0;return function(){return b<a.length?{done:!1,value:a[b++]}:{done:!0}}}function l(a){var b="undefined"!=typeof Symbol&&Symbol.iterator&&a[Symbol.iterator];return b?b.call(a):{next:da(a)}}var ea="function"==typeof Object.create?Object.create:function(a){function b(){}b.prototype=a;return new b},v="function"==typeof Object.defineProperties?Object.defineProperty:function(a,b,c){if(a==Array.prototype||a==Object.prototype)return a;a[b]=c.value;return a};
function fa(a){a=["object"==typeof globalThis&&globalThis,a,"object"==typeof window&&window,"object"==typeof self&&self,"object"==typeof global&&global];for(var b=0;b<a.length;++b){var c=a[b];if(c&&c.Math==Math)return c}throw Error("Cannot find global object");}var ha=fa(this);function x(a,b){if(b)a:{var c=ha;a=a.split(".");for(var d=0;d<a.length-1;d++){var e=a[d];if(!(e in c))break a;c=c[e]}a=a[a.length-1];d=c[a];b=b(d);b!=d&&null!=b&&v(c,a,{configurable:!0,writable:!0,value:b})}}var ja;
if("function"==typeof Object.setPrototypeOf)ja=Object.setPrototypeOf;else{var ma;a:{var na={a:!0},oa={};try{oa.__proto__=na;ma=oa.a;break a}catch(a){}ma=!1}ja=ma?function(a,b){a.__proto__=b;if(a.__proto__!==b)throw new TypeError(a+" is not extensible");return a}:null}var pa=ja;
function qa(a,b){a.prototype=ea(b.prototype);a.prototype.constructor=a;if(pa)pa(a,b);else for(var c in b)if("prototype"!=c)if(Object.defineProperties){var d=Object.getOwnPropertyDescriptor(b,c);d&&Object.defineProperty(a,c,d)}else a[c]=b[c];a.H=b.prototype}function y(){for(var a=Number(this),b=[],c=a;c<arguments.length;c++)b[c-a]=arguments[c];return b}x("Reflect",function(a){return a?a:{}});
x("Symbol",function(a){function b(g){if(this instanceof b)throw new TypeError("Symbol is not a constructor");return new c(d+(g||"")+"_"+e++,g)}function c(g,m){this.g=g;v(this,"description",{configurable:!0,writable:!0,value:m})}if(a)return a;c.prototype.toString=function(){return this.g};var d="jscomp_symbol_"+(1E9*Math.random()>>>0)+"_",e=0;return b});
x("Symbol.iterator",function(a){if(a)return a;a=Symbol("Symbol.iterator");for(var b="Array Int8Array Uint8Array Uint8ClampedArray Int16Array Uint16Array Int32Array Uint32Array Float32Array Float64Array".split(" "),c=0;c<b.length;c++){var d=ha[b[c]];"function"===typeof d&&"function"!=typeof d.prototype[a]&&v(d.prototype,a,{configurable:!0,writable:!0,value:function(){return ra(da(this))}})}return a});function ra(a){a={next:a};a[Symbol.iterator]=function(){return this};return a}
function C(a,b){return Object.prototype.hasOwnProperty.call(a,b)}
x("WeakMap",function(a){function b(h){this.g=(r+=Math.random()+1).toString();if(h){h=l(h);for(var n;!(n=h.next()).done;)n=n.value,this.set(n[0],n[1])}}function c(){}function d(h){var n=typeof h;return"object"===n&&null!==h||"function"===n}function e(h){if(!C(h,m)){var n=new c;v(h,m,{value:n})}}function g(h){var n=Object[h];n&&(Object[h]=function(t){if(t instanceof c)return t;Object.isExtensible(t)&&e(t);return n(t)})}if(function(){if(!a||!Object.seal)return!1;try{var h=Object.seal({}),n=Object.seal({}),
t=new a([[h,2],[n,3]]);if(2!=t.get(h)||3!=t.get(n))return!1;t.delete(h);t.set(n,4);return!t.has(h)&&4==t.get(n)}catch(ia){return!1}}())return a;var m="$jscomp_hidden_"+Math.random();g("freeze");g("preventExtensions");g("seal");var r=0;b.prototype.set=function(h,n){if(!d(h))throw Error("Invalid WeakMap key");e(h);if(!C(h,m))throw Error("WeakMap key fail: "+h);h[m][this.g]=n;return this};b.prototype.get=function(h){return d(h)&&C(h,m)?h[m][this.g]:void 0};b.prototype.has=function(h){return d(h)&&C(h,
m)&&C(h[m],this.g)};b.prototype.delete=function(h){return d(h)&&C(h,m)&&C(h[m],this.g)?delete h[m][this.g]:!1};return b});function sa(a,b){a instanceof String&&(a+="");var c=0,d=!1,e={next:function(){if(!d&&c<a.length){var g=c++;return{value:b(g,a[g]),done:!1}}d=!0;return{done:!0,value:void 0}}};e[Symbol.iterator]=function(){return e};return e}x("Array.prototype.keys",function(a){return a?a:function(){return sa(this,function(b){return b})}});
var ta="function"==typeof Object.assign?Object.assign:function(a,b){for(var c=1;c<arguments.length;c++){var d=arguments[c];if(d)for(var e in d)C(d,e)&&(a[e]=d[e])}return a};x("Object.assign",function(a){return a||ta});x("Object.is",function(a){return a?a:function(b,c){return b===c?0!==b||1/b===1/c:b!==b&&c!==c}});
x("Array.prototype.includes",function(a){return a?a:function(b,c){var d=this;d instanceof String&&(d=String(d));var e=d.length;c=c||0;for(0>c&&(c=Math.max(c+e,0));c<e;c++){var g=d[c];if(g===b||Object.is(g,b))return!0}return!1}});
x("String.prototype.includes",function(a){return a?a:function(b,c){if(null==this)throw new TypeError("The 'this' value for String.prototype.includes must not be null or undefined");if(b instanceof RegExp)throw new TypeError("First argument to String.prototype.includes must not be a regular expression");return-1!==this.indexOf(b,c||0)}});x("Object.entries",function(a){return a?a:function(b){var c=[],d;for(d in b)C(b,d)&&c.push([d,b[d]]);return c}});var ua="onabort onactivate onactivateinvisible onafterprint onafterupdate onanimationcancel onanimationend onanimationiteration onanimationstart onariarequest onauxclick onbeforeactivate onbeforecopy onbeforecut onbeforedeactivate onbeforeeditfocus onbeforepaste onbeforeprint onbeforeunload onbegin onblur onbounce oncancel oncanplay oncanplaythrough oncellchange onchange onclick onclose oncommand oncontextmenu oncontrolselect oncopy oncuechange oncut ondataavailable ondatasetchanged ondatasetcomplete ondblclick ondeactivate ondrag ondragdrop ondragend ondragenter ondragexit ondragleave ondragover ondragstart ondrop ondurationchange onemptied onend onended onerror onerrorupdate onexit onfilterchange onfinish onfocus onfocusin onfocusout onformdata onfullscreenchange onfullscreenerror ongotpointercapture onhelp oninput oninvalid onkeydown onkeypress onkeyup onlayoutcomplete onload onloadeddata onloadedmetadata onloadend onloadstart onlosecapture onlostpointercapture onmediacomplete onmediaerror onmessage onmousedown onmouseenter onmouseleave onmousemove onmouseout onmouseover onmouseup onmousewheel onmove onmoveend onmovestart onmozfullscreenchange onmozfullscreenerror onmscontentzoom onmsgesturechange onmsgesturedoubletap onmsgestureend onmsgesturehold onmsgesturestart onmsgesturetap onmsgotpointercapture onmsinertiastart onmslostpointercapture onmsmanipulationstatechanged onmspointercancel onmspointerdown onmspointerenter onmspointerleave onmspointermove onmspointerout onmspointerover onmspointerup onoffline ononline onoutofsync onoverscroll onpaste onpause onplay onplaying onpointercancel onpointerdown onpointerenter onpointerleave onpointermove onpointerout onpointerover onpointerrawupdate onpointerup onprogress onpropertychange onratechange onreadystatechange onrepeat onreset onresize onresizeend onresizestart onresume onreverse onrowdelete onrowenter onrowexit onrowinserted onscroll onscrollend onsearch onseek onseeked onseeking onselect onselectionchange onselectstart onshow onstalled onstart onstop onstorage onsubmit onsuspend onsynchrestored ontimeerror ontimeupdate ontoggle ontrackchange ontransitioncancel ontransitionend ontransitionrun ontransitionstart onunload onurlflip onvolumechange onwaiting onwebkitanimationend onwebkitanimationiteration onwebkitanimationstart onwebkitfullscreenchange onwebkitfullscreenerror onwebkittransitionend onwheel".split(" ");
function va(){if("undefined"!==typeof window){var a=[],b;for(b in HTMLElement.prototype)"on"===b.slice(0,2)&&a.push(b);return a}return ua};var wa="undefined"!==typeof window;function xa(){throw new TypeError("undefined conversion");}function ya(){return null}var za=String.prototype,Aa=za.toLowerCase,Ba=za.toUpperCase;function Ca(){throw new TypeError("Illegal constructor");}function Da(){throw new TypeError("Illegal constructor");}
var Na=function(){function a(){return d.apply(this,arguments)||this}function b(){return d.apply(this,arguments)||this}function c(){return d.apply(this,arguments)||this}function d(f,k){if(f!==Q)throw Error("cannot call the constructor");N(this,"policyName",{value:k,enumerable:!0})}function e(f){var k=ka.get(f);void 0===k&&(k=J(null),ka.set(f,k));return k}function g(f){var k=Ea(f);if(null==k||Ea(k)!==Fa)throw Error();k=l(la(k));for(var p=k.next();!p.done;p=k.next())p=p.value,N(f,p,{value:f[p]});return f}
function m(f){if(!Ga(f)||!Ga(f.raw)||1!==f.length)throw new TypeError("Invalid input");f=nb(f);if(this===b){var k=ob.call(null,"template");k.innerHTML=f;f=k.innerHTML}k=B(new this(Q,"fromLiteral"));e(k).v=f;return k}function r(f,k){B(f.prototype);delete f.name;N(f,"fromLiteral",{value:m.bind(f)});N(f,"name",{value:k})}function h(f){return function(k){return k instanceof f&&ka.has(k)}}function n(f,k){function p(Z,R){var Ha=k[R]||("default"==f?ya:xa),pb=B(new Z(Q,f));Z={};R=(Z[R]=function(qb){var E=
Ha.apply,S=[""+qb],rb=S.concat,O=y.apply(1,arguments);if(!(O instanceof Array)){O=l(O);for(var Ia,Ja=[];!(Ia=O.next()).done;)Ja.push(Ia.value);O=Ja}E=E.call(Ha,null,rb.call(S,O));if(void 0===E||null===E){if("default"==f)return E;E=""}E=""+E;S=B(J(pb));e(S).v=E;return S},Z)[R];return B(R)}for(var q=J(Ca.prototype),u=l(la(aa)),K=u.next();!K.done;K=u.next())K=K.value,q[K]=p(aa[K],K);N(q,"name",{value:f,writable:!1,configurable:!1,enumerable:!0});return B(q)}function t(f,k,p,q,u){u=void 0===u?"":u;f=
Ba.apply(String(f));(q=u?u:void 0===q?"":q)||(q="http://www.w3.org/1999/xhtml");if(q=T.apply(A,[q])?A[q]:null){if(T.apply(q,[f])&&q[f]&&T.apply(q[f][k],[p])&&q[f][k][p])return q[f][k][p];if(T.apply(q,["*"])&&T.apply(q["*"][k],[p])&&q["*"][k][p])return q["*"][k][p]}}function ia(){return U}var w=Object,sb=w.assign,J=w.create,N=w.defineProperty,B=w.freeze,la=w.getOwnPropertyNames,Ea=w.getPrototypeOf,Fa=w.prototype,Ga=w.isFrozen,nb=String.raw,T=Fa.hasOwnProperty,ob=document?document.createElement.bind(document):
null;w=Array.prototype;var tb=w.forEach,ub=w.push,Q=Symbol(),ka=g(new WeakMap),V=g([]),ba=g([]),Ka=!0,U=null,ca=!1;d.prototype.toString=function(){return e(this).v};d.prototype.toJSON=function(){return e(this).v};d.prototype.valueOf=function(){return e(this).v};qa(c,d);r(c,"TrustedScriptURL");qa(b,d);r(b,"TrustedHTML");qa(a,d);r(a,"TrustedScript");B(d.prototype);w=B(J(new b(Q,"")));e(w).v="";var La=B(J(new a(Q,"")));e(La).v="";var z={},A=(z["http://www.w3.org/1999/xhtml"]={EMBED:{attributes:{src:c.name}},
IFRAME:{attributes:{srcdoc:b.name}},OBJECT:{attributes:{data:c.name,codebase:c.name}},SCRIPT:{attributes:{src:c.name,text:a.name},properties:{innerText:a.name,textContent:a.name,text:a.name}},"*":{attributes:{},properties:{innerHTML:b.name,outerHTML:b.name}}},z["http://www.w3.org/2000/svg"]={"*":{attributes:{},properties:{}}},z);z={codebase:"codeBase",formaction:"formAction"};!wa||"srcdoc"in HTMLIFrameElement.prototype||delete A["http://www.w3.org/1999/xhtml"].IFRAME.attributes.srcdoc;for(var F=l(Object.keys(A["http://www.w3.org/1999/xhtml"])),
G=F.next();!G.done;G=F.next()){G=G.value;A["http://www.w3.org/1999/xhtml"][G].properties||(A["http://www.w3.org/1999/xhtml"][G].properties={});for(var Ma=l(Object.keys(A["http://www.w3.org/1999/xhtml"][G].attributes)),H=Ma.next();!H.done;H=Ma.next())H=H.value,A["http://www.w3.org/1999/xhtml"][G].properties[z[H]?z[H]:H]=A["http://www.w3.org/1999/xhtml"][G].attributes[H]}z=l(va());for(F=z.next();!F.done;F=z.next())F=F.value,A["http://www.w3.org/1999/xhtml"]["*"].attributes[F]="TrustedScript",A["http://www.w3.org/2000/svg"]["*"].attributes[F]=
"TrustedScript";var aa={createHTML:b,createScriptURL:c,createScript:a},vb=aa.hasOwnProperty;z=J(Da.prototype);sb(z,{createPolicy:function(f,k){if(!f.match(/^[-#a-zA-Z0-9=_/@.%]+$/g))throw new TypeError("Policy "+f+" contains invalid characters.");if(ca&&-1===ba.indexOf(f)&&-1===ba.indexOf("*"))throw new TypeError("Policy "+f+" disallowed.");if("default"===f&&U)throw new TypeError("Policy "+f+" already exists.");if(ca&&!Ka&&-1!==V.indexOf(f))throw new TypeError("Policy "+f+" exists.");V.push(f);var p=
J(null);if(k&&"object"===typeof k)for(var q=l(la(k)),u=q.next();!u.done;u=q.next())u=u.value,vb.call(aa,u)&&(p[u]=k[u]);else console.warn("trustedTypes.createPolicy "+f+" was given an empty policy");B(p);k=n(f,p);"default"===f&&(U=k);return k},isHTML:h(b),isScriptURL:h(c),isScript:h(a),getAttributeType:function(f,k,p,q){return t(f,"attributes",Aa.apply(String(k)),void 0===p?"":p,void 0===q?"":q)||null},getPropertyType:function(f,k,p){return t(f,"properties",String(k),void 0===p?"":p)||null},s:function(f){f=
void 0===f?"":f;if(!f)try{f=document.documentElement.namespaceURI}catch(k){f="http://www.w3.org/1999/xhtml"}return(f=A[f])?JSON.parse(JSON.stringify(f)):{}},emptyHTML:w,emptyScript:La,defaultPolicy:U,TrustedHTML:b,TrustedScriptURL:c,TrustedScript:a});N(z,"defaultPolicy",{get:ia,set:function(){}});return{trustedTypes:B(z),B:function(f,k){ca=!0;ba.length=0;tb.call(f,function(p){ub.call(ba,""+p)});Ka=k;V.length=0},D:function(){ca=!1},F:ia,G:function(){U=null;V.splice(V.indexOf("default"),1)}}}(),D=Na.trustedTypes,
Oa=Na.B;if("undefined"!==typeof window&&(window.TrustedTypes&&"undefined"===typeof window.trustedTypes&&(window.trustedTypes=Object.freeze(window.TrustedTypes)),"undefined"===typeof window.trustedTypes)){var Pa=Object.create(Da.prototype);Object.assign(Pa,{isHTML:D.isHTML,isScriptURL:D.isScriptURL,isScript:D.isScript,createPolicy:D.createPolicy,getAttributeType:D.getAttributeType,getPropertyType:D.getPropertyType,getTypeMapping:D.s,emptyHTML:D.emptyHTML,emptyScript:D.emptyScript,_isPolyfill_:!0});Object.defineProperty(Pa,
"defaultPolicy",Object.getOwnPropertyDescriptor(D,"defaultPolicy")||{});window.trustedTypes=Object.freeze(Pa);window.TrustedHTML=D.TrustedHTML;window.TrustedScriptURL=D.TrustedScriptURL;window.TrustedScript=D.TrustedScript;window.TrustedTypePolicy=Ca;window.TrustedTypePolicyFactory=Da};function Qa(a,b,c,d,e){this.h=a;this.g=b;this.j=c;this.i=d;this.l=void 0===e?null:e}function Ra(a){var b=/\s+/;return a.trim().split(/\s*;\s*/).map(function(c){return c.split(b)}).reduce(function(c,d){d[0]&&(c[d[0]]=d.slice(1).map(function(e){return e}).sort());return c},{})}
function Sa(){var a=Ta,b=Ra(a),c="require-trusted-types-for"in b&&b["require-trusted-types-for"].includes("'script'"),d=["*"],e=!0;"trusted-types"in b&&(d=b["trusted-types"].filter(function(g){return"'"!==g.charAt(0)}),e=b["trusted-types"].includes("'allow-duplicates'"),1==b["trusted-types"].length&&"'none'"==b["trusted-types"][0]&&(d=[]));return new Qa(!0,c,d,e,a)};var Ua=Object.defineProperty;function Va(a,b,c){Ua(a,b,{value:c})};for(var I=Reflect.apply,Wa=Object,Xa=Wa.getOwnPropertyNames,Ya=Wa.getOwnPropertyDescriptor,Za=Wa.getPrototypeOf,$a=Object.prototype.hasOwnProperty,ab=String.prototype.slice,bb,L=D.s("http://www.w3.org/1999/xhtml"),M={TrustedHTML:D.TrustedHTML,TrustedScript:D.TrustedScript,TrustedScriptURL:D.TrustedScriptURL},cb=l(Object.keys(L)),db=cb.next();!db.done;db=cb.next())for(var eb=L[db.value].properties,fb=l(Object.entries(eb)),gb=fb.next();!gb.done;gb=fb.next()){var hb=l(gb.value),ib=hb.next().value,jb=
hb.next().value;eb[ib]=M[jb]}var kb={TrustedHTML:D.isHTML,TrustedScriptURL:D.isScriptURL,TrustedScript:D.isScript},lb={TrustedHTML:"createHTML",TrustedScriptURL:"createScriptURL",TrustedScript:"createScript"};
function P(){this.h=mb;this.i={};this.g="undefined"!==typeof window?window:null;if(!wb(this))throw Error("The polyfill expects a global `window` object or emulated `window-like` object passed to the enforcer as second argument");this.l=function(a){return I($a,a.Element.prototype,["insertAdjacentHTML"])?a.Element.prototype:a.HTMLElement.prototype}(this.g);this.o=this.g.document.createElement("div").constructor.name?function(a){return a.name}:function(a){return(""+a).match(/^\[object (\S+)\]$/)[1]}}
function wb(a){var b=a.g;a=["Element","HTMLElement","Document","Node","document"];return!!b&&"object"===typeof b&&a.every(function(c){return c in b})}function W(a,b,c){a=a.g[c];return!!a&&b instanceof a}
function xb(){var a=new P;Oa(a.h.j,a.h.i);if(a.h.g||a.h.h)"ShadowRoot"in a.g&&yb(a,a.g.ShadowRoot.prototype,"innerHTML",D.TrustedHTML),bb=function(b){return b.createRange?0==b.createRange().createContextualFragment({toString:function(){return"<div></div>"}}).childNodes.length:!1}(a.g.document),a.g.Range&&X(a,a.g.Range.prototype,"createContextualFragment",D.TrustedHTML,0),a.l&&X(a,a.l,"insertAdjacentHTML",D.TrustedHTML,1),Ya(a.g.Document.prototype,"write")?X(a,a.g.Document.prototype,"write",D.TrustedHTML,
0):a.g.HTMLDocument&&Ya(a.g.HTMLDocument.prototype,"write")&&X(a,a.g.HTMLDocument.prototype,"write",D.TrustedHTML,0),"DOMParser"in a.g&&X(a,a.g.DOMParser.prototype,"parseFromString",D.TrustedHTML,0),a.g.hasOwnProperty("setInterval")&&X(a,a.g,"setInterval",D.TrustedScript,0),a.g.hasOwnProperty("setTimeout")&&X(a,a.g,"setTimeout",D.TrustedScript,0),zb(a),Ab(a),Bb(a)}
function Ab(a){["appendChild","insertBefore","replaceChild"].forEach(function(b){Y(a,a.g.Node.prototype,b,function(c){return a.m.bind(a,this,!1,c).apply(a,y.apply(1,arguments))})});a.l&&Y(a,a.l,"insertAdjacentText",function(b){return a.A.bind(a,this,b).apply(a,y.apply(1,arguments))});["after","before","replaceWith"].forEach(function(b){b in a.g.Element.prototype&&Y(a,a.g.Element.prototype,b,function(c){return a.m.bind(a,this,!0,c).apply(a,y.apply(1,arguments))})});["append","prepend"].forEach(function(b){b in
a.g.Element.prototype&&Y(a,a.g.Element.prototype,b,function(c){return a.m.bind(a,this,!1,c).apply(a,y.apply(1,arguments))})})}function Bb(a){for(var b=l(Xa(L)),c=b.next();!c.done;c=b.next()){c=c.value;for(var d=l(Xa(L[c].properties)),e=d.next();!e.done;e=d.next()){e=e.value;var g="*"==c?"HTMLElement":a.o(a.g.document.createElement(c).constructor);null!=g&&a.g[g]&&yb(a,a.g[g].prototype,e,L[c].properties[e])}}}
function zb(a){Y(a,a.g.Element.prototype,"setAttribute",function(b){return a.u.bind(a,this,b).apply(a,y.apply(1,arguments))});Y(a,a.g.Element.prototype,"setAttributeNS",function(b){return a.C.bind(a,this,b).apply(a,y.apply(1,arguments))})}
P.prototype.u=function(a,b){var c=y.apply(2,arguments);if(null!==a.constructor&&W(this,a,"Element")){var d=(c[0]=String(c[0])).toLowerCase();if((d=D.getAttributeType(a.tagName,d,a.namespaceURI))&&I($a,M,[d]))return this.j(a,"setAttribute",M[d],b,1,c)}return I(b,a,c)};
P.prototype.C=function(a,b){var c=y.apply(2,arguments);if(null!==a.constructor&&W(this,a,"Element")){var d=c[0]?String(c[0]):null;c[0]=d;var e=(c[1]=String(c[1])).toLowerCase();if((d=D.getAttributeType(a.tagName,e,a.namespaceURI,d))&&I($a,M,[d]))return this.j(a,"setAttributeNS",M[d],b,2,c)}return I(b,a,c)};
P.prototype.m=function(a,b,c){var d=y.apply(3,arguments);if(W(this,b?a.parentNode:a,"HTMLScriptElement")&&0<d.length)for(var e=0;e<d.length;e++){var g=d[e];if(!W(this,g,"Node")||g.nodeType===this.g.Node.TEXT_NODE){if(W(this,g,"Node")&&g.nodeType==this.g.Node.TEXT_NODE)g=g.textContent;else if(D.isScript(g)){d[e]=this.g.document.createTextNode(""+g);continue}var m=Cb("TrustedScript",""+g,"HTMLScriptElement text");null===m||void 0===m?Db(this,a,c.name,D.TrustedScript,g):g=m;d[e]=this.g.document.createTextNode(""+
g)}}return I(c,a,d)};
P.prototype.A=function(a,b){var c=y.apply(2,arguments),d=["beforebegin","afterend"];if(W(this,a,"Element")&&W(this,a.parentElement,"HTMLScriptElement")&&1<c.length&&d.includes(c[0])&&!D.isScript(c[1])){c[1]=""+c[1];var e=Cb("TrustedScript",c[1],"HTMLScriptElement text");null===e||void 0===e?Db(this,a,"insertAdjacentText",D.TrustedScript,c[1]):c[1]=e;e=this.g.document.createTextNode(""+c[1]);var g=this.i[Eb(this.g.Node.prototype,"insertBefore")];switch(c[0]){case d[0]:I(g,a.parentElement,[e,a]);break;
case d[1]:I(g,a.parentElement,[e,a.nextSibling])}}else I(b,a,c)};function X(a,b,c,d,e){Y(a,b,c,function(g){return a.j.call(a,this,c,d,g,e,y.apply(1,arguments))})}function Y(a,b,c,d){var e=Ya(b,c),g=e?e.value:null;if(!(g instanceof Function))throw new TypeError("Property "+c+" on object"+b+" is not a function");e=Eb(b,c);if(a.i[e])throw Error("TrustedTypesEnforcer: Double installation detected: "+e+" "+c);Va(b,c,function(){return d.bind(this,g).apply(this,y.apply(0,arguments))});a.i[e]=g}
function yb(a,b,c,d){var e=b,g,m,r=Za(a.g.Node.prototype);do(m=(g=Ya(e,c))?g.set:null)||(e=Za(e)||r);while(!m&&e!==r&&e);if(m instanceof Function){r=Eb(b,c);if(a.i[r])throw Error("TrustedTypesEnforcer: Double installation detected: "+r+" "+c);var h=function(n){a.j.call(a,this,c,d,m,0,[n])};e===b?Ua(b,c,{set:h}):Ua(b,c,{set:h,get:g.get,configurable:!0});a.i[r]=m}else a.h.h&&console.warn("No setter for property "+c+" on object"+b)}
function Eb(a,b){return""+(a.constructor.name?a.constructor.name:a.constructor)+"-"+b}function Cb(a,b,c){c=void 0===c?"":c;var d=D.defaultPolicy;return d&&kb.hasOwnProperty(a)?d[lb[a]](b,a,c):null}
P.prototype.j=function(a,b,c,d,e,g){var m=g[e],r=c.name;if(kb.hasOwnProperty(r)&&kb[r](m))return bb&&"createContextualFragment"==b&&(g[e]=g[e].toString()),I(d,a,g);if(c===D.TrustedScript){var h="setAttribute"==b||"setAttributeNS"===b||"on"===I(ab,b,[0,2]);if(("setInterval"===b||"setTimeout"===b||h)&&"function"===typeof m||h&&null===m)return I(d,a,g)}g[e]=""+m;h=this.o(a?a.constructor:window.constructor);["innerHTML","setAttribute","setAttributeNS"].includes(b)&&(h="Element");r=Cb(r,m,h+" "+b);null===
r||void 0===r?Db(this,a,b,c,m):g[e]=r;return I(d,a,g)};
function Db(a,b,c,d,e){var g=a.o(b.constructor)||""+b,m="Failed to set "+c+" on "+g+": This property requires "+(d.name+".");a.h.h&&console.warn(m,c,b,d,e);var r=a.g.SecurityPolicyViolationEvent||null;if("function"===typeof r){var h="";if(d===D.TrustedScriptURL){h=a.g;d="function"==typeof h.URL?h.URL.prototype.constructor:null;try{var n=new d(e,h.document.baseURI||void 0)}catch(t){n=null}if(h=n||"")h=h.href}e=I(ab,e,[0,40]);c=new r("securitypolicyviolation",{bubbles:!0,blockedURI:h,disposition:a.h.g?
"enforce":"report",documentURI:a.g.document.location.href,effectiveDirective:"require-trusted-types-for",originalPolicy:a.h.l,statusCode:0,violatedDirective:"require-trusted-types-for",sample:g+"."+c+" "+e});W(a,b,"Node")&&b.isConnected?b.dispatchEvent(c):a.g.document.dispatchEvent(c)}if(a.h.g)throw new TypeError(m);};function Fb(){try{var a;if(!(a=document.currentScript)){var b=document.getElementsByTagName("script");a=b[b.length-1]}if(a&&"Content-Security-Policy:"==a.textContent.trim().substr(0,24))return a.textContent.trim().slice(24);if(a.dataset.csp)return a.dataset.csp;var c=document.head.querySelector('meta[http-equiv^="Content-Security-Policy"]');if(c)return c.content.trim()}catch(d){}return null}var Gb;
a:{for(var Hb=l(["trustedTypes","TrustedTypes"]),Ib=Hb.next();!Ib.done;Ib=Hb.next()){var Jb=Ib.value;if(window[Jb]&&!window[Jb]._isPolyfill_){Gb=!1;break a}}Gb=!0}if(Gb){var Ta=Fb(),mb=Ta?Sa():new Qa(!1,!1,[],!0);xb()};}).call(this);

//# sourceMappingURL=trustedtypes.build.js.map
