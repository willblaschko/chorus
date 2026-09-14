function t(t,e,r,o){var s,i=arguments.length,a=i<3?e:null===o?o=Object.getOwnPropertyDescriptor(e,r):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(t,e,r,o);else for(var n=t.length-1;n>=0;n--)(s=t[n])&&(a=(i<3?s(a):i>3?s(e,r,a):s(e,r))||a);return i>3&&a&&Object.defineProperty(e,r,a),a}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,r=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),s=new WeakMap;let i=class{constructor(t,e,r){if(this._$cssResult$=!0,r!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(r&&void 0===t){const r=void 0!==e&&1===e.length;r&&(t=s.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),r&&s.set(e,t))}return t}toString(){return this.cssText}};const a=(t,...e)=>{const r=1===t.length?t[0]:e.reduce((e,r,o)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+t[o+1],t[0]);return new i(r,t,o)},n=r?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const r of t.cssRules)e+=r.cssText;return(t=>new i("string"==typeof t?t:t+"",void 0,o))(e)})(t):t,{is:c,defineProperty:p,getOwnPropertyDescriptor:d,getOwnPropertyNames:l,getOwnPropertySymbols:h,getPrototypeOf:u}=Object,m=globalThis,g=m.trustedTypes,f=g?g.emptyScript:"",v=m.reactiveElementPolyfillSupport,b=(t,e)=>t,x={toAttribute(t,e){switch(e){case Boolean:t=t?f:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let r=t;switch(e){case Boolean:r=null!==t;break;case Number:r=null===t?null:Number(t);break;case Object:case Array:try{r=JSON.parse(t)}catch(t){r=null}}return r}},y=(t,e)=>!c(t,e),_={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=_){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const r=Symbol(),o=this.getPropertyDescriptor(t,r,e);void 0!==o&&p(this.prototype,t,o)}}static getPropertyDescriptor(t,e,r){const{get:o,set:s}=d(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:o,set(e){const i=o?.call(this);s?.call(this,e),this.requestUpdate(t,i,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??_}static _$Ei(){if(this.hasOwnProperty(b("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(b("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(b("properties"))){const t=this.properties,e=[...l(t),...h(t)];for(const r of e)this.createProperty(r,t[r])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,r]of e)this.elementProperties.set(t,r)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const r=this._$Eu(t,e);void 0!==r&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const r=new Set(t.flat(1/0).reverse());for(const t of r)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const r=e.attribute;return!1===r?void 0:"string"==typeof r?r:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const r of e.keys())this.hasOwnProperty(r)&&(t.set(r,this[r]),delete this[r]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,o)=>{if(r)t.adoptedStyleSheets=o.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const r of o){const o=document.createElement("style"),s=e.litNonce;void 0!==s&&o.setAttribute("nonce",s),o.textContent=r.cssText,t.appendChild(o)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,r){this._$AK(t,r)}_$ET(t,e){const r=this.constructor.elementProperties.get(t),o=this.constructor._$Eu(t,r);if(void 0!==o&&!0===r.reflect){const s=(void 0!==r.converter?.toAttribute?r.converter:x).toAttribute(e,r.type);this._$Em=t,null==s?this.removeAttribute(o):this.setAttribute(o,s),this._$Em=null}}_$AK(t,e){const r=this.constructor,o=r._$Eh.get(t);if(void 0!==o&&this._$Em!==o){const t=r.getPropertyOptions(o),s="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:x;this._$Em=o;const i=s.fromAttribute(e,t.type);this[o]=i??this._$Ej?.get(o)??i,this._$Em=null}}requestUpdate(t,e,r,o=!1,s){if(void 0!==t){const i=this.constructor;if(!1===o&&(s=this[t]),r??=i.getPropertyOptions(t),!((r.hasChanged??y)(s,e)||r.useDefault&&r.reflect&&s===this._$Ej?.get(t)&&!this.hasAttribute(i._$Eu(t,r))))return;this.C(t,e,r)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:r,reflect:o,wrapped:s},i){r&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,i??e??this[t]),!0!==s||void 0!==i)||(this._$AL.has(t)||(this.hasUpdated||r||(e=void 0),this._$AL.set(t,e)),!0===o&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,r]of t){const{wrapped:t}=r,o=this[e];!0!==t||this._$AL.has(e)||void 0===o||this.C(e,void 0,r,o)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[b("elementProperties")]=new Map,$[b("finalized")]=new Map,v?.({ReactiveElement:$}),(m.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,k=t=>t,z=w.trustedTypes,A=z?z.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",M=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+M,R=`<${C}>`,E=document,P=()=>E.createComment(""),L=t=>null===t||"object"!=typeof t&&"function"!=typeof t,O=Array.isArray,U="[ \t\n\f\r]",T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,H=/>/g,D=RegExp(`>|${U}(?:([^\\s"'>=/]+)(${U}*=${U}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,F=/"/g,B=/^(?:script|style|textarea|title)$/i,W=t=>(e,...r)=>({_$litType$:t,strings:e,values:r}),I=W(1),K=W(2),q=Symbol.for("lit-noChange"),V=Symbol.for("lit-nothing"),Q=new WeakMap,Z=E.createTreeWalker(E,129);function G(t,e){if(!O(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==A?A.createHTML(e):e}const Y=(t,e)=>{const r=t.length-1,o=[];let s,i=2===e?"<svg>":3===e?"<math>":"",a=T;for(let e=0;e<r;e++){const r=t[e];let n,c,p=-1,d=0;for(;d<r.length&&(a.lastIndex=d,c=a.exec(r),null!==c);)d=a.lastIndex,a===T?"!--"===c[1]?a=N:void 0!==c[1]?a=H:void 0!==c[2]?(B.test(c[2])&&(s=RegExp("</"+c[2],"g")),a=D):void 0!==c[3]&&(a=D):a===D?">"===c[0]?(a=s??T,p=-1):void 0===c[1]?p=-2:(p=a.lastIndex-c[2].length,n=c[1],a=void 0===c[3]?D:'"'===c[3]?F:j):a===F||a===j?a=D:a===N||a===H?a=T:(a=D,s=void 0);const l=a===D&&t[e+1].startsWith("/>")?" ":"";i+=a===T?r+R:p>=0?(o.push(n),r.slice(0,p)+S+r.slice(p)+M+l):r+M+(-2===p?e:l)}return[G(t,i+(t[r]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),o]};class J{constructor({strings:t,_$litType$:e},r){let o;this.parts=[];let s=0,i=0;const a=t.length-1,n=this.parts,[c,p]=Y(t,e);if(this.el=J.createElement(c,r),Z.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(o=Z.nextNode())&&n.length<a;){if(1===o.nodeType){if(o.hasAttributes())for(const t of o.getAttributeNames())if(t.endsWith(S)){const e=p[i++],r=o.getAttribute(t).split(M),a=/([.?@])?(.*)/.exec(e);n.push({type:1,index:s,name:a[2],strings:r,ctor:"."===a[1]?ot:"?"===a[1]?st:"@"===a[1]?it:rt}),o.removeAttribute(t)}else t.startsWith(M)&&(n.push({type:6,index:s}),o.removeAttribute(t));if(B.test(o.tagName)){const t=o.textContent.split(M),e=t.length-1;if(e>0){o.textContent=z?z.emptyScript:"";for(let r=0;r<e;r++)o.append(t[r],P()),Z.nextNode(),n.push({type:2,index:++s});o.append(t[e],P())}}}else if(8===o.nodeType)if(o.data===C)n.push({type:2,index:s});else{let t=-1;for(;-1!==(t=o.data.indexOf(M,t+1));)n.push({type:7,index:s}),t+=M.length-1}s++}}static createElement(t,e){const r=E.createElement("template");return r.innerHTML=t,r}}function X(t,e,r=t,o){if(e===q)return e;let s=void 0!==o?r._$Co?.[o]:r._$Cl;const i=L(e)?void 0:e._$litDirective$;return s?.constructor!==i&&(s?._$AO?.(!1),void 0===i?s=void 0:(s=new i(t),s._$AT(t,r,o)),void 0!==o?(r._$Co??=[])[o]=s:r._$Cl=s),void 0!==s&&(e=X(t,s._$AS(t,e.values),s,o)),e}class tt{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:r}=this._$AD,o=(t?.creationScope??E).importNode(e,!0);Z.currentNode=o;let s=Z.nextNode(),i=0,a=0,n=r[0];for(;void 0!==n;){if(i===n.index){let e;2===n.type?e=new et(s,s.nextSibling,this,t):1===n.type?e=new n.ctor(s,n.name,n.strings,this,t):6===n.type&&(e=new at(s,this,t)),this._$AV.push(e),n=r[++a]}i!==n?.index&&(s=Z.nextNode(),i++)}return Z.currentNode=E,o}p(t){let e=0;for(const r of this._$AV)void 0!==r&&(void 0!==r.strings?(r._$AI(t,r,e),e+=r.strings.length-2):r._$AI(t[e])),e++}}class et{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,r,o){this.type=2,this._$AH=V,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=r,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=X(this,t,e),L(t)?t===V||null==t||""===t?(this._$AH!==V&&this._$AR(),this._$AH=V):t!==this._$AH&&t!==q&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>O(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==V&&L(this._$AH)?this._$AA.nextSibling.data=t:this.T(E.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:r}=t,o="number"==typeof r?this._$AC(t):(void 0===r.el&&(r.el=J.createElement(G(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===o)this._$AH.p(e);else{const t=new tt(o,this),r=t.u(this.options);t.p(e),this.T(r),this._$AH=t}}_$AC(t){let e=Q.get(t.strings);return void 0===e&&Q.set(t.strings,e=new J(t)),e}k(t){O(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let r,o=0;for(const s of t)o===e.length?e.push(r=new et(this.O(P()),this.O(P()),this,this.options)):r=e[o],r._$AI(s),o++;o<e.length&&(this._$AR(r&&r._$AB.nextSibling,o),e.length=o)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=k(t).nextSibling;k(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class rt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,r,o,s){this.type=1,this._$AH=V,this._$AN=void 0,this.element=t,this.name=e,this._$AM=o,this.options=s,r.length>2||""!==r[0]||""!==r[1]?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=V}_$AI(t,e=this,r,o){const s=this.strings;let i=!1;if(void 0===s)t=X(this,t,e,0),i=!L(t)||t!==this._$AH&&t!==q,i&&(this._$AH=t);else{const o=t;let a,n;for(t=s[0],a=0;a<s.length-1;a++)n=X(this,o[r+a],e,a),n===q&&(n=this._$AH[a]),i||=!L(n)||n!==this._$AH[a],n===V?t=V:t!==V&&(t+=(n??"")+s[a+1]),this._$AH[a]=n}i&&!o&&this.j(t)}j(t){t===V?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class ot extends rt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===V?void 0:t}}class st extends rt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==V)}}class it extends rt{constructor(t,e,r,o,s){super(t,e,r,o,s),this.type=5}_$AI(t,e=this){if((t=X(this,t,e,0)??V)===q)return;const r=this._$AH,o=t===V&&r!==V||t.capture!==r.capture||t.once!==r.once||t.passive!==r.passive,s=t!==V&&(r===V||o);o&&this.element.removeEventListener(this.name,this,r),s&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class at{constructor(t,e,r){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(t){X(this,t)}}const nt=w.litHtmlPolyfillSupport;nt?.(J,et),(w.litHtmlVersions??=[]).push("3.3.3");const ct=globalThis;class pt extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,r)=>{const o=r?.renderBefore??e;let s=o._$litPart$;if(void 0===s){const t=r?.renderBefore??null;o._$litPart$=s=new et(e.insertBefore(P(),t),t,void 0,r??{})}return s._$AI(t),s})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return q}}pt._$litElement$=!0,pt.finalized=!0,ct.litElementHydrateSupport?.({LitElement:pt});const dt=ct.litElementPolyfillSupport;dt?.({LitElement:pt}),(ct.litElementVersions??=[]).push("4.2.2");const lt=t=>(e,r)=>{void 0!==r?r.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},ht={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:y},ut=(t=ht,e,r)=>{const{kind:o,metadata:s}=r;let i=globalThis.litPropertyMetadata.get(s);if(void 0===i&&globalThis.litPropertyMetadata.set(s,i=new Map),"setter"===o&&((t=Object.create(t)).wrapped=!0),i.set(r.name,t),"accessor"===o){const{name:o}=r;return{set(r){const s=e.get.call(this);e.set.call(this,r),this.requestUpdate(o,s,t,!0,r)},init(e){return void 0!==e&&this.C(o,void 0,t,e),e}}}if("setter"===o){const{name:o}=r;return function(r){const s=this[o];e.call(this,r),this.requestUpdate(o,s,t,!0,r)}}throw Error("Unsupported decorator location: "+o)};function mt(t){return(e,r)=>"object"==typeof r?ut(t,e,r):((t,e,r)=>{const o=e.hasOwnProperty(r);return e.constructor.createProperty(r,t),o?Object.getOwnPropertyDescriptor(e,r):void 0})(t,e,r)}function gt(t){return mt({...t,state:!0,attribute:!1})}const ft=["LF","RF","LR","RR","SW"],vt={LF:"Front L",RF:"Front R",LR:"Rear L",RR:"Rear R",SW:"Sub"},bt=[{re:/arc/,caps:{icon:"soundbar",primary:!0}},{re:/beam|ray|playbar|playbase/,caps:{icon:"soundbar",primary:!0}},{re:/sub/,caps:{icon:"sub",sub:!0}},{re:/era 300/,caps:{icon:"era",surround:!0,pair:!0,height:!0}},{re:/era/,caps:{icon:"era",surround:!0,pair:!0}},{re:/lamp/,caps:{icon:"lamp",surround:!0,pair:!0}},{re:/frame|picture/,caps:{icon:"frame",surround:!0,pair:!0}},{re:/bookshelf/,caps:{icon:"book",surround:!0,pair:!0}},{re:/connect|port|amp/,caps:{icon:"connect"}},{re:/move|roam/,caps:{icon:"driver"}}],xt={icon:"driver",surround:!0,pair:!0};function yt(t){const e=(t||"").toLowerCase();for(const t of bt)if(t.re.test(e))return t.caps;return xt}const _t=t=>!!yt(t).pair;function $t(t,e){return"SW"===t?(t=>!!yt(t).sub)(e):(t=>!!yt(t).surround)(e)}function wt(t){return{uid:t.uid,name:t.name||t.uid,model:t.model||"",ip:t.ip}}function kt(t){const e=t.members.find(t=>t.is_primary)??t.members[0];return e?.area??null}function zt(t){const e={LF:null,RF:null,LR:null,RR:null,SW:null};let r;for(const o of t.members)"CC"===o.channel?r=wt(o):o.channel&&ft.includes(o.channel)&&(e[o.channel]=wt(o));return{bar:r??wt(t.members[0]),slots:e}}function At(t){const e=t.members.find(t=>"LF"===t.channel)??t.members[0],r=t.members.find(t=>"RF"===t.channel)??t.members[1],o=t.members.find(t=>"SW"===t.channel)??null;return{L:e?wt(e):null,R:r?wt(r):null,sub:o?wt(o):null}}const St=(t,e)=>t.name.localeCompare(e.name,void 0,{numeric:!0});function Mt(t){const e=t?.units??[],r=new Map,o=[];for(const t of e){const e=kt(t),s=e??t.name;let i=r.get(s);if(i||(i={key:s,name:e??t.name,area:e,ht:null,pairs:[],tray:[]},r.set(s,i),o.push(s)),"home_theater"===t.kind)i.ht||(i.ht=zt(t));else if("stereo_pair"===t.kind)i.pairs.push(At(t));else for(const e of t.members)i.tray.push(wt(e))}const s=o.map(t=>r.get(t));for(const t of s)t.tray.sort(St);return s.sort(St)}const Ct=t=>K`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${t}</svg>`,Rt={soundbar:Ct(K`<rect x="2.8" y="9" width="18.4" height="6" rx="1.5"/><line x1="8" y1="10.7" x2="8" y2="13.3"/><line x1="12" y1="10.7" x2="12" y2="13.3"/><line x1="16" y1="10.7" x2="16" y2="13.3"/>`),sub:Ct(K`<rect x="5.5" y="4" width="13" height="16" rx="4"/><circle cx="12" cy="12" r="3.4"/>`),era:Ct(K`<path d="M4.4 9.4 Q4.4 7 6.8 7 L17.2 7 Q19.6 7 19.6 9.4 L19.6 14.6 Q19.6 17 17.2 17 L6.8 17 Q4.4 17 4.4 14.6 Z"/><circle cx="12" cy="12" r="2.3"/><circle cx="12" cy="4.7" r="1"/>`),book:Ct(K`<rect x="7" y="3.5" width="10" height="17" rx="2.5"/><circle cx="12" cy="14" r="2.6"/><circle cx="12" cy="7" r="1"/>`),lamp:Ct(K`<path d="M8 9 L16 9 L14.4 4.5 L9.6 4.5 Z"/><line x1="12" y1="9" x2="12" y2="18"/><line x1="8.5" y1="18" x2="15.5" y2="18"/>`),frame:Ct(K`<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><rect x="6.6" y="8.6" width="10.8" height="6.8" rx="1"/>`),connect:Ct(K`<rect x="3.5" y="8" width="17" height="8" rx="2.5"/><circle cx="17" cy="12" r="1.1" fill="currentColor" stroke="none"/>`),driver:Ct(K`<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.4"/>`)};function Et(t){return Rt[yt(t).icon]??Rt.driver}function Pt(t){return(t||"").replace("Sonos ","").replace("Symfonisk ","")}const Lt=K`<svg viewBox="0 0 17920 5760"><g class="ink"><path d="M933 5610 c-24 -14 -35 -31 -44 -65 l-11 -45 -47 0 c-58 0 -138 -37 -174 -79 -34 -40 -111 -201 -232 -481 -107 -250 -140 -340 -154 -430 -15 -90 -15 -4150 -1 -4202 14 -48 53 -94 101 -118 37 -20 69 -20 1436 -20 769 0 1403 -4 1409 -8 6 -4 13 -26 17 -49 3 -23 15 -58 27 -78 l22 -35 5458 0 5458 0 21 33 c11 18 23 52 27 75 4 26 14 47 25 53 12 6 609 9 1709 9 l1691 -1 42 23 c31 17 49 37 70 78 l27 54 -2 2091 -3 2090 -38 105 c-69 188 -315 689 -386 787 -46 63 -108 95 -196 101 l-73 4 -11 37 c-18 62 -51 85 -130 89 -103 6 -146 -23 -161 -108 l-5 -35 -7771 -3 -7770 -2 -49 56 c-68 80 -96 94 -180 94 -52 0 -78 -5 -102 -20z"></path><path d="M15095 4081 c-89 -26 -131 -46 -200 -96 -198 -141 -298 -391 -254 -630 6 -33 19 -76 30 -96 10 -20 23 -68 29 -105 16 -107 85 -238 167 -319 78 -77 190 -137 298 -160 144 -30 345 -12 447 41 29 15 26 9 -28 -49 -66 -70 -106 -142 -129 -228 -17 -63 -19 -234 -4 -299 18 -80 70 -172 134 -236 105 -106 206 -144 385 -144 180 0 282 38 385 144 90 93 145 222 145 340 0 44 4 53 34 81 21 19 39 48 46 75 9 34 26 58 76 103 122 112 178 280 155 465 -23 181 -107 303 -256 373 -173 82 -417 50 -548 -70 l-44 -41 -6 163 c-10 269 -60 401 -202 535 -133 126 -260 172 -470 171 -93 0 -147 -5 -190 -18z"></path></g><g class="paper"><path d="M0 2880 l0 -2880 1676 0 1677 0 -26 20 c-32 25 -67 97 -67 137 0 19 -6 33 -16 37 -9 3 -643 6 -1410 6 -1365 0 -1396 0 -1433 20 -48 24 -87 70 -101 118 -14 52 -14 4052 1 4142 14 90 47 180 154 430 121 280 198 441 232 481 36 42 116 79 174 79 l47 0 11 45 c14 55 55 85 116 85 51 0 90 -24 150 -94 l49 -56 7800 2 7801 3 5 35 c9 50 26 78 62 96 66 34 147 -2 169 -77 l11 -37 73 -4 c88 -6 150 -38 196 -101 71 -98 317 -599 386 -787 l38 -105 3 -2060 2 -2061 -27 -54 c-21 -41 -39 -61 -70 -78 l-41 -23 -1692 1 c-1092 0 -1697 -3 -1709 -10 -12 -6 -21 -26 -25 -55 -5 -28 -20 -62 -42 -90 l-34 -45 1890 0 1890 0 0 2880 0 2880 -8960 0 -8960 0 0 -2880z"></path><path d="M781 5314 c-19 -16 -51 -67 -81 -131 -73 -153 -230 -520 -230 -538 0 -13 11 -15 61 -13 l61 3 47 120 c45 112 123 288 220 498 l40 87 -44 0 c-32 0 -51 -7 -74 -26z"></path><path d="M17253 5099 c67 -134 142 -295 167 -356 l45 -113 63 0 c37 0 62 4 62 11 0 43 -296 622 -340 664 -20 19 -43 29 -74 32 l-46 6 123 -244z"></path><path d="M1008 5297 c-43 -64 -81 -157 -89 -215 -11 -73 -17 -85 -59 -102 -42 -18 -65 -90 -49 -155 l12 -47 21 43 c13 25 35 49 56 60 33 18 81 19 1070 19 802 0 1040 -3 1059 -13 65 -33 91 -137 53 -215 -11 -22 -17 -43 -14 -46 7 -8 66 -8 86 0 12 5 16 20 16 61 0 51 3 59 38 93 21 21 55 43 77 49 28 8 378 11 1178 11 l1137 0 0 30 0 30 -1140 0 -1140 0 -30 28 c-57 50 -50 163 12 199 24 15 78 95 78 118 0 3 -18 5 -40 5 -39 0 -42 -2 -85 -69 -24 -39 -58 -98 -75 -132 -17 -34 -42 -72 -55 -85 l-24 -24 -1041 0 c-1158 0 -1087 -4 -1117 67 -18 44 -11 88 24 158 33 67 68 103 128 131 l50 24 -61 0 c-53 0 -64 -3 -76 -23z"></path><path d="M16939 5294 c120 -60 193 -244 127 -321 l-24 -28 -1043 -3 c-743 -2 -1046 -5 -1056 -13 -27 -23 -258 -28 -1350 -28 l-1123 -1 0 -30 0 -30 1143 -2 c1099 -3 1143 -4 1173 -22 44 -27 67 -71 70 -135 l2 -56 63 -3 c60 -3 61 -3 54 20 -4 13 -9 51 -12 86 -6 73 7 112 49 147 l30 25 1044 0 c1127 0 1071 3 1120 -52 39 -43 57 -89 57 -155 l1 -63 38 0 c21 0 38 4 38 9 0 46 -242 546 -310 639 -29 41 -32 42 -87 42 l-57 0 53 -26z"></path><path d="M14666 5253 c-13 -13 -4 -91 18 -148 27 -71 52 -87 127 -83 l52 3 -74 109 c-66 98 -106 136 -123 119z"></path><path d="M1145 5231 c-48 -29 -68 -67 -69 -134 -1 -47 3 -61 18 -73 17 -12 166 -14 988 -14 933 0 969 1 984 19 9 10 41 64 71 120 l54 101 -1008 0 c-964 0 -1009 -1 -1038 -19z"></path><path d="M3470 5230 c0 -20 7 -20 1020 -20 1013 0 1020 0 1020 20 0 20 -7 20 -1020 20 -1013 0 -1020 0 -1020 -20z"></path><path d="M6010 5230 c0 -20 7 -20 2990 -20 2983 0 2990 0 2990 20 0 20 -7 20 -2990 20 -2983 0 -2990 0 -2990 -20z"></path><path d="M12382 5233 c3 -17 64 -18 1091 -21 1082 -2 1087 -2 1087 18 0 20 -6 20 -1091 20 -1033 0 -1090 -1 -1087 -17z"></path><path d="M14834 5233 c10 -24 106 -185 124 -205 14 -17 73 -18 971 -18 755 0 961 3 981 13 23 12 25 18 25 81 0 66 -1 68 -42 107 l-42 39 -1012 0 c-939 0 -1011 -1 -1005 -17z"></path><path d="M3435 5097 c-7 -18 -15 -51 -17 -73 l-3 -39 1125 0 1125 0 3 56 c5 98 121 89 -1124 89 l-1095 0 -14 -33z"></path><path d="M5993 5120 c-35 -14 -43 -42 -43 -144 0 -84 2 -97 19 -106 14 -7 977 -10 3039 -10 2976 0 3019 0 3036 19 15 17 17 35 15 110 -4 78 -7 94 -27 113 l-23 23 -2997 2 c-1715 1 -3006 -2 -3019 -7z"></path><path d="M12394 5118 c-9 -15 -8 -113 1 -128 4 -7 364 -10 1111 -10 1081 0 1104 0 1104 19 0 26 -38 114 -53 123 -7 4 -494 8 -1084 8 -837 0 -1073 -3 -1079 -12z"></path><path d="M994 4823 c-12 -2 -29 -12 -39 -23 -18 -20 -43 -145 -31 -157 4 -4 455 -10 1001 -11 l994 -4 24 24 c32 32 45 110 23 142 -8 13 -29 26 -47 30 -34 7 -1890 6 -1925 -1z"></path><path d="M15103 4820 c-12 -5 -25 -21 -29 -35 -8 -34 3 -104 22 -132 l14 -23 999 0 c881 0 1000 2 1011 15 20 24 7 133 -19 159 l-22 21 -977 2 c-562 1 -986 -2 -999 -7z"></path><path d="M5955 4760 c-12 -14 -20 -41 -23 -80 l-4 -60 3096 0 3096 0 0 54 c0 48 -3 57 -31 80 l-31 26 -3042 0 -3043 0 -18 -20z"></path><path d="M3485 4761 c-82 -3 -155 -10 -162 -14 -12 -7 -33 -68 -33 -94 0 -10 239 -13 1160 -13 l1160 0 0 59 0 58 -162 6 c-208 7 -1765 5 -1963 -2z"></path><path d="M12472 4698 l3 -63 475 -8 c261 -5 769 -5 1128 -2 l652 7 -6 37 c-8 41 -22 73 -38 83 -6 4 -507 8 -1114 8 l-1103 0 3 -62z"></path><path d="M737 4710 c-33 -78 -33 -80 13 -80 46 0 45 -4 15 80 l-13 35 -15 -35z"></path><path d="M8831 4502 c-7784 -2 -8386 -3 -8403 -19 -17 -15 -18 -93 -18 -2055 0 -2244 -5 -2084 61 -2107 23 -8 426 -11 1405 -11 l1372 0 7 31 c4 17 3 35 -2 40 -5 5 -593 10 -1353 11 -1292 3 -1346 4 -1372 22 -16 10 -32 34 -38 55 -8 25 -10 637 -8 1966 3 1825 4 1931 21 1956 9 14 29 31 43 37 36 17 16932 17 16968 0 14 -6 34 -23 43 -37 17 -25 18 -130 21 -1936 2 -1050 0 -1929 -3 -1953 -4 -27 -17 -55 -35 -75 l-28 -32 -1637 -3 -1636 -2 3 -38 3 -37 1655 -3 c1133 -2 1666 0 1691 8 75 21 69 -142 69 1832 0 975 0 1891 0 2035 0 260 0 262 -24 289 l-23 28 -199 0 c-109 1 -3972 0 -8583 -2z"></path><path d="M599 4333 c-12 -13 -14 -185 -17 -1007 -1 -545 0 -998 4 -1006 3 -10 20 13 47 65 56 107 100 165 194 256 383 370 963 407 1393 89 227 -169 372 -408 411 -679 15 -105 6 -338 -16 -441 -34 -153 -107 -348 -220 -588 -105 -221 -251 -368 -474 -479 l-106 -53 738 0 737 0 10 23 c5 12 50 266 100 565 50 299 98 565 106 592 18 61 56 107 109 131 38 18 100 19 1331 19 l1291 0 19 21 c17 19 19 43 24 273 3 170 9 258 17 272 18 31 80 83 106 89 12 3 1075 4 2363 3 l2341 -3 36 -28 c69 -53 72 -63 75 -342 3 -211 6 -253 19 -267 15 -17 87 -18 1285 -18 1122 0 1273 -2 1306 -15 46 -20 79 -50 102 -96 11 -21 62 -264 126 -605 59 -313 110 -579 115 -591 l9 -23 1639 0 c1611 0 1640 0 1651 19 7 13 10 625 10 1908 0 1693 -2 1891 -16 1911 l-15 22 -8418 0 c-7818 0 -8420 -1 -8432 -17z"></path><path d="M15174 3911 c-115 -19 -195 -61 -269 -143 -42 -46 -113 -173 -104 -183 3 -2 26 25 51 60 157 217 470 296 727 185 l46 -20 -25 20 c-28 23 -111 56 -173 69 -65 15 -197 20 -253 12z"></path><path d="M15189 3762 c-90 -30 -157 -72 -217 -137 -97 -103 -142 -214 -142 -345 0 -187 103 -351 271 -434 273 -133 586 -8 695 279 26 69 27 237 1 315 -43 130 -167 261 -294 311 -81 31 -235 37 -314 11z"></path><path d="M16218 3233 c-192 -72 -281 -290 -195 -477 27 -59 118 -158 170 -185 25 -13 29 -13 55 11 40 38 65 48 117 48 49 0 77 -10 111 -41 20 -19 21 -19 62 11 59 42 99 102 124 183 52 174 -23 355 -183 438 -60 31 -194 37 -261 12z"></path><path d="M15800 2652 c-110 -55 -196 -172 -219 -299 -32 -172 65 -356 227 -431 72 -34 193 -42 274 -18 70 20 153 79 200 141 41 54 78 155 78 214 0 35 -2 37 -43 48 -35 10 -71 41 -224 192 -204 203 -198 200 -293 153z"></path><path d="M16322 2498 c-21 -21 -14 -66 12 -83 19 -13 28 -13 50 -4 33 16 42 44 22 74 -18 27 -63 34 -84 13z"></path><path d="M2340 3411 c-126 -39 -220 -156 -220 -276 0 -155 114 -272 276 -283 62 -4 79 -1 133 23 155 70 215 234 140 383 -17 34 -47 75 -67 92 -70 57 -185 84 -262 61z"></path><path d="M1391 2825 c-444 -100 -751 -452 -778 -891 -9 -147 -4 -150 67 -56 136 181 338 316 567 379 86 24 116 27 243 27 126 0 157 -3 240 -26 52 -14 126 -40 163 -57 252 -113 464 -349 548 -609 13 -40 26 -72 30 -72 11 0 48 163 60 266 51 460 -238 882 -698 1020 -73 22 -112 27 -233 30 -102 3 -164 -1 -209 -11z"></path><path d="M6419 2341 l-29 -29 0 -226 c0 -213 1 -227 20 -246 20 -20 33 -20 2334 -20 2264 0 2314 0 2337 19 24 19 24 20 24 244 l0 226 -29 30 -30 31 -2299 0 -2299 0 -29 -29z"></path><path d="M1168 2103 c-65 -74 -90 -243 -52 -355 33 -102 97 -184 151 -194 19 -4 36 -4 39 -2 2 3 -3 22 -12 44 -21 51 -15 162 14 224 11 25 25 69 32 99 l12 53 -73 74 c-40 41 -79 74 -85 74 -6 0 -18 -8 -26 -17z"></path><path d="M1870 2060 c-12 -8 -13 -13 -3 -27 95 -137 115 -263 64 -408 -11 -32 -18 -62 -15 -66 3 -5 19 -16 37 -25 l31 -17 43 47 c52 58 119 189 129 252 6 45 6 46 -47 101 -54 55 -191 153 -212 153 -7 0 -19 -5 -27 -10z"></path><path d="M1545 2036 c-51 -22 -85 -71 -85 -122 l0 -44 58 6 c114 12 234 -51 287 -150 11 -20 22 -36 26 -36 21 0 25 131 7 192 -15 51 -82 126 -133 149 -47 22 -117 24 -160 5z"></path><path d="M956 1998 c-111 -73 -228 -214 -288 -346 -27 -60 -29 -69 -18 -111 36 -145 171 -324 319 -423 69 -47 75 -49 99 -37 44 24 242 250 242 277 0 5 -22 24 -48 41 -61 39 -160 141 -195 202 -63 107 -88 238 -68 354 7 37 10 69 8 71 -2 2 -25 -10 -51 -28z"></path><path d="M1482 1768 c-7 -7 -12 -27 -12 -45 0 -39 21 -53 78 -53 41 0 108 -31 168 -76 33 -26 34 -26 34 -5 0 56 -62 145 -122 177 -33 17 -129 19 -146 2z"></path><path d="M2207 1648 c-79 -165 -236 -306 -396 -358 -51 -16 -71 -27 -71 -40 0 -38 87 -261 108 -274 9 -6 109 26 187 59 128 55 278 186 322 281 l26 57 -17 81 c-19 87 -54 183 -91 248 l-23 40 -45 -94z"></path><path d="M3666 1695 c-36 -19 -53 -41 -60 -80 -19 -93 -206 -1206 -206 -1224 0 -12 11 -33 25 -46 l24 -25 5289 0 5289 0 23 25 c33 36 44 -32 -171 1085 -40 210 -52 243 -100 267 -19 10 -1082 13 -5054 13 -4474 0 -5033 -2 -5059 -15z"></path><path d="M1370 1662 c0 -48 26 -102 68 -144 20 -20 45 -47 55 -58 15 -17 26 -21 50 -15 18 3 50 9 72 12 56 7 63 19 17 27 -27 4 -41 12 -45 25 -2 10 -16 26 -30 36 -24 15 -28 15 -58 -1 l-33 -17 -28 34 c-16 19 -34 52 -40 74 -15 54 -28 66 -28 27z"></path><path d="M1330 1471 c0 -5 12 -16 26 -26 20 -13 28 -14 40 -4 11 9 12 15 3 25 -13 15 -69 19 -69 5z"></path><path d="M1790 1435 c-57 -41 -123 -58 -203 -52 -40 3 -82 8 -94 12 -14 4 -23 3 -23 -3 0 -15 82 -32 157 -32 130 0 295 68 227 94 -22 9 -25 8 -64 -19z"></path><path d="M616 1303 c10 -67 45 -175 81 -248 129 -256 346 -421 638 -485 75 -17 269 -14 349 4 204 48 390 167 511 329 53 70 99 146 93 152 -2 3 -28 -12 -58 -32 -206 -139 -510 -211 -773 -184 -340 34 -643 200 -796 435 -24 36 -45 66 -47 66 -1 0 0 -17 2 -37z"></path><path d="M1365 1233 c-27 -32 -82 -95 -123 -140 l-73 -81 63 -21 c35 -12 98 -28 142 -36 85 -16 331 -21 340 -6 4 5 -10 46 -29 91 -19 45 -44 112 -55 149 l-21 67 -72 13 c-40 8 -84 16 -98 18 -21 4 -33 -5 -74 -54z"></path><path d="M586 979 c-3 -18 -6 -129 -6 -249 0 -172 3 -220 14 -229 9 -8 97 -11 302 -9 l289 3 -80 33 c-184 75 -362 227 -461 395 -51 85 -52 86 -58 56z"></path><path d="M3402 208 c-20 -20 -14 -63 14 -89 l26 -24 5281 -3 c5014 -2 5284 -1 5317 15 45 23 61 64 35 93 l-18 20 -5322 0 c-4125 0 -5324 -3 -5333 -12z"></path></g></svg>`,Ot=K`<svg viewBox="0 0 175 82"><g transform="translate(0,82) rotate(-90)"><g class="ink"><path d="M2.15 170.65 c-0.57 -0.14 -1.13 -0.48 -1.67 -0.98 l-0.49 -0.48 0 -81.59 0 -81.58 0.28 -0.36 c0.38 -0.51 1.27 -0.96 2.17 -1.12 0.55 -0.09 10.38 -0.12 35.18 -0.09 31.32 0.03 34.45 0.05 34.83 0.22 0.23 0.10 0.58 0.35 0.78 0.56 0.20 0.20 0.45 0.36 0.56 0.36 0.77 0 3.04 2.26 3.69 3.68 0.26 0.55 0.27 0.72 0.30 4.30 0.05 4.15 -0.01 4.72 -0.57 5.36 l-0.35 0.38 0.24 0.47 c0.36 0.70 0.44 1.49 0.61 6.31 0.19 5.72 0.19 28.04 0 33.72 -0.16 4.83 -0.23 5.22 -1.01 6.09 l-0.49 0.55 0.35 0.35 c0.69 0.70 0.90 1.39 1.01 3.28 0.52 8.67 0.52 26.92 0 36.82 -0.09 1.71 -0.13 1.97 -0.41 2.54 -0.17 0.36 -0.42 0.70 -0.54 0.78 -0.31 0.20 -0.28 0.75 0.08 1.21 0.62 0.82 0.73 1.28 0.86 3.37 0.54 9.45 0.54 27.58 0 38.22 -0.12 2.27 -0.21 2.68 -0.82 3.42 l-0.33 0.41 0.38 0.31 c0.21 0.16 0.50 0.56 0.65 0.86 0.28 0.56 0.28 0.59 0.28 4.52 l0 3.96 -0.31 0.59 c-0.17 0.33 -0.57 0.83 -0.89 1.11 -0.71 0.64 -2.13 1.39 -2.63 1.39 -0.24 0 -0.47 0.09 -0.61 0.24 -0.12 0.14 -0.45 0.38 -0.75 0.56 l-0.52 0.30 -34.77 0.02 c-19.13 0 -34.92 -0.02 -35.12 -0.07z m68.85 -2.06 c0.72 -0.35 0.75 -0.48 0.75 -4.25 l0 -3.39 -0.45 -0.45 -0.45 -0.45 -9.09 0 c-7.13 0 -9.11 0.03 -9.20 0.15 -0.06 0.07 -0.34 0.77 -0.62 1.53 -0.85 2.36 -1.39 2.91 -2.76 2.84 -0.61 -0.03 -0.93 -0.15 -1.98 -0.68 -1.48 -0.76 -3.98 -2.25 -5.43 -3.25 l-1.05 -0.71 -7.09 0 c-6.69 0 -7.14 0.01 -7.99 0.23 -1.74 0.44 -2.64 0.59 -4.16 0.70 -2.07 0.15 -3.09 0.02 -4.12 -0.54 l-0.79 -0.43 -0.51 0.26 c-0.49 0.23 -0.68 0.24 -3.75 0.24 -2.99 0 -3.26 -0.01 -3.68 -0.23 -0.44 -0.22 -0.91 -0.75 -1.11 -1.22 -0.12 -0.27 -0.21 -141.33 -0.10 -142.82 0.07 -1.04 0.28 -1.49 0.90 -1.95 0.31 -0.23 0.49 -0.24 3.76 -0.28 2.06 -0.02 3.51 0.01 3.63 0.08 0.15 0.09 0.34 -0.02 0.92 -0.58 1.14 -1.11 1.47 -1.20 3.76 -1.20 1.06 0.01 2.32 0.08 2.80 0.16 1.09 0.19 2.85 0.79 5.42 1.85 l1.98 0.83 3.26 0 3.26 0 0.97 -1.05 c1.23 -1.33 1.72 -1.63 2.68 -1.63 0.89 0 1.13 0.19 2.18 1.70 l0.77 1.09 13.45 0 c14.49 0 13.99 0.02 14.42 -0.59 0.16 -0.23 0.19 -0.73 0.19 -3.84 l0 -3.58 -0.36 -0.30 -0.36 -0.30 -34.10 0.02 -34.12 0.03 -0.33 0.24 c-0.17 0.13 -0.44 0.42 -0.59 0.63 l-0.26 0.38 0.02 79.80 0.03 79.80 0.28 0.40 c0.16 0.22 0.54 0.51 0.87 0.66 l0.59 0.28 33.58 0 c30.85 0 33.63 -0.01 33.99 -0.19z"></path><path d="M44.91 158.44 c-3.31 -3.47 -8.84 -8.93 -11.29 -11.16 l-2.18 -1.98 0 -0.50 c0 -0.82 0.13 -0.96 0.92 -0.96 0.66 0 0.68 0 1.70 0.89 3.81 3.26 9.40 8.88 13.31 13.36 0.90 1.04 0.99 1.20 1.05 1.70 0.05 0.49 0.01 0.58 -0.22 0.76 -0.15 0.10 -0.45 0.19 -0.69 0.19 -0.38 0 -0.56 -0.16 -2.61 -2.29z"></path><path d="M28.98 143.65 c-0.29 -0.24 -0.87 -0.76 -1.30 -1.14 l-0.77 -0.70 0 -0.66 c0 -0.77 0.14 -0.91 0.92 -0.91 0.41 0 0.58 0.09 1.26 0.69 1.78 1.54 1.90 1.67 1.90 2.21 0 0.79 -0.14 0.94 -0.86 0.94 -0.56 0 -0.69 -0.05 -1.14 -0.43z"></path><path d="M22.34 158.21 c-0.22 -0.26 -0.27 -0.65 -0.56 -4.87 -0.40 -5.82 -0.49 -8.57 -0.50 -13.86 0 -5.84 0.20 -10.68 0.45 -11.09 0.14 -0.22 0.27 -0.27 0.80 -0.27 0.92 0 0.92 -0.01 0.77 3.13 -0.34 7.29 -0.17 16.11 0.45 23.77 0.15 1.86 0.15 3.06 -0.02 3.24 -0.22 0.22 -1.19 0.17 -1.40 -0.06z"></path><path d="M21.43 120.15 c-0.35 -0.42 -0.62 -12.01 -0.47 -19.63 0.15 -7.31 0.43 -12.32 0.72 -12.66 0.17 -0.22 1.30 -0.20 1.49 0.02 0.16 0.19 0.13 1.21 -0.13 5.01 -0.20 2.99 -0.27 18.12 -0.10 22.79 0.12 3.45 0.12 4.32 0 4.46 -0.20 0.23 -1.32 0.24 -1.51 0z"></path><path d="M16.73 119.94 c-0.21 -0.31 -0.58 -4.73 -0.78 -9.34 -0.17 -4.23 -0.07 -14.82 0.17 -17.82 0.40 -4.61 0.38 -4.60 1.36 -4.60 0.97 0 1.06 0.30 0.75 2.18 -0.33 2.02 -0.43 4.27 -0.49 10.87 -0.07 7.97 0.09 12.87 0.56 17.15 0.19 1.67 0.12 1.84 -0.77 1.84 -0.54 0 -0.66 -0.05 -0.80 -0.27z"></path><path d="M21.04 82.79 c-0.35 -0.56 -0.55 -15.39 -0.30 -22.28 0.21 -5.61 0.29 -6.79 0.54 -7.06 0.22 -0.24 0.96 -0.30 1.33 -0.10 0.31 0.16 0.36 0.54 0.23 2.11 -0.23 2.90 -0.36 13.90 -0.23 20.70 0.08 4.76 0.07 6.63 -0.01 6.74 -0.08 0.09 -0.38 0.15 -0.76 0.15 -0.52 0 -0.65 -0.05 -0.79 -0.26z"></path><path d="M25.63 38.79 c-0.27 -0.27 -0.31 -1.02 -0.09 -1.43 0.29 -0.56 3.17 -4 3.42 -4.09 0.34 -0.13 0.92 -0.07 1.19 0.12 0.40 0.27 0.36 1.22 -0.06 1.78 -0.84 1.11 -2.99 3.63 -3.18 3.74 -0.37 0.20 -1.02 0.14 -1.28 -0.12z"></path><path d="M30.63 32.26 c-0.16 -0.16 -0.23 -0.38 -0.23 -0.75 0 -0.44 0.09 -0.63 0.66 -1.36 1.11 -1.44 1.18 -1.50 1.78 -1.50 0.70 0 0.93 0.23 0.93 0.96 0 0.48 -0.08 0.65 -0.71 1.51 -0.38 0.52 -0.82 1.06 -0.94 1.18 -0.34 0.28 -1.19 0.27 -1.49 -0.03z"></path></g><g class="paper"><path d="M2.49 168.85 c-0.34 -0.15 -0.71 -0.44 -0.87 -0.66 l-0.28 -0.40 -0.03 -80.15 -0.02 -80.15 0.26 -0.38 c0.15 -0.21 0.42 -0.50 0.59 -0.63 l0.33 -0.24 34.48 -0.03 34.47 -0.02 0.35 0.33 0.36 0.31 -0.01 3.90 c0 3.31 -0.03 3.94 -0.19 4.17 -0.41 0.63 0.13 0.61 -14.77 0.61 l-13.80 0 -0.77 -1.09 c-0.42 -0.61 -0.92 -1.23 -1.12 -1.40 -0.75 -0.63 -1.55 -0.28 -3.04 1.33 l-0.97 1.05 -3.14 0.01 c-1.74 0.01 -3.26 0.06 -3.41 0.12 -0.20 0.07 -0.40 0.03 -0.72 -0.13 -0.71 -0.36 -4.62 -1.92 -5.65 -2.25 -1.35 -0.44 -2.22 -0.56 -4.08 -0.58 -1.57 -0.01 -1.68 0 -2.29 0.30 -0.41 0.20 -0.92 0.61 -1.36 1.08 l-0.71 0.76 -0.47 -0.24 c-0.45 -0.23 -0.64 -0.24 -3.55 -0.21 -2.90 0.03 -3.09 0.05 -3.40 0.28 -0.57 0.43 -0.82 0.90 -0.89 1.76 -0.10 1.21 -0.01 141.93 0.09 142.25 0.14 0.49 0.63 1.04 1.12 1.29 0.44 0.22 0.64 0.23 3.47 0.20 l3.01 -0.03 0.50 -0.34 0.51 -0.34 1 0.52 c1.25 0.66 1.40 0.70 3.03 0.69 1.43 -0.01 2.75 -0.20 4.57 -0.65 l1.13 -0.29 7.43 0 7.44 0 1.05 0.71 c2.46 1.69 6.14 3.74 6.95 3.89 0.59 0.12 1.22 -0.22 1.65 -0.89 0.20 -0.29 0.58 -1.15 0.86 -1.92 0.28 -0.76 0.56 -1.46 0.62 -1.53 0.09 -0.12 2.14 -0.15 9.55 -0.15 l9.43 0 0.45 0.45 0.45 0.45 0 3.74 c0 4.16 -0.01 4.25 -0.75 4.60 -0.36 0.17 -3.17 0.19 -34.34 0.19 l-33.93 0 -0.59 -0.28z"></path><path d="M73.50 164.37 c0 -2.71 -0.03 -3.61 -0.17 -4.04 -0.09 -0.31 -0.14 -0.61 -0.10 -0.66 0.09 -0.15 2.11 -1.14 2.32 -1.14 0.09 0 0.24 0.15 0.35 0.35 0.24 0.48 0.26 6.67 0.01 7.27 -0.16 0.38 -0.82 0.98 -1.60 1.44 -0.84 0.51 -0.80 0.66 -0.80 -3.21z"></path><path d="M47.58 162.16 c-4.57 -2.40 -8.82 -5.66 -13.69 -10.51 -3.14 -3.12 -4.79 -5.06 -6.48 -7.63 -1.04 -1.58 -2.03 -3.42 -2.03 -3.77 0 -0.22 0.15 -0.33 0.85 -0.63 1.35 -0.59 2.69 -1.30 4.26 -2.28 0.80 -0.50 1.99 -1.22 2.63 -1.60 1.12 -0.66 1.16 -0.70 1.16 -1.09 l0 -0.41 -0.55 0.02 -0.55 0.01 0.42 -0.83 c0.23 -0.47 0.54 -1.18 0.68 -1.60 0.23 -0.68 0.28 -0.76 0.54 -0.72 0.78 0.10 3.14 1.46 5.43 3.13 4.46 3.25 11.50 9.41 13.26 11.60 0.84 1.04 2.05 3.27 2.06 3.80 0.01 0.35 -0.08 0.50 -1.64 2.56 -0.76 1 -1.01 1.26 -1.08 1.12 -0.16 -0.28 -0.78 -0.22 -0.91 0.09 -0.06 0.14 -0.29 1.28 -0.52 2.53 -0.66 3.61 -1.35 6.13 -1.82 6.62 -0.13 0.14 -0.35 0.26 -0.49 0.26 -0.14 0 -0.83 -0.30 -1.54 -0.68z"></path><path d="M18.81 159.18 c-0.45 -0.20 -0.59 -0.38 -0.70 -0.94 -0.09 -0.57 -0.35 -0.87 -0.72 -0.87 -0.34 0 -0.80 -0.44 -1.02 -0.97 -0.34 -0.82 -0.72 -4.66 -0.99 -9.81 -0.26 -5 -0.08 -15.65 0.30 -18.81 0.16 -1.41 0.33 -2.20 0.54 -2.66 0.28 -0.58 1.12 -1.36 1.64 -1.53 0.21 -0.06 2.13 -0.14 4.27 -0.16 2.70 -0.05 4.68 -0.13 6.46 -0.30 2.83 -0.28 3.10 -0.24 3.60 0.35 0.42 0.49 0.51 0.93 0.71 3.42 0.29 3.62 0.28 4.31 -0.05 5.13 -0.58 1.43 -1.63 2.95 -2.70 3.88 -1 0.86 -3.02 2 -4.57 2.59 -1.27 0.48 -1.78 1.23 -1.48 2.17 0.33 1.01 2.10 3.98 3.56 5.95 1.15 1.55 2.19 2.75 4.03 4.66 1.54 1.57 1.47 1.42 1.26 3.05 -0.16 1.22 -0.41 1.55 -1.55 2.11 -1.84 0.89 -6.53 2.32 -8.98 2.74 -1.26 0.21 -3.14 0.22 -3.62 0.01z"></path><path d="M9.46 158.49 l-0.26 -0.27 0 -71.16 c0 -66.12 0.01 -71.17 0.20 -71.37 0.17 -0.19 0.42 -0.21 2.88 -0.21 2.48 0.01 2.71 0.02 2.96 0.23 0.27 0.22 0.27 0.22 0.09 1.09 -0.21 1.01 -0.58 4.22 -0.77 6.53 -0.31 4.16 -0.37 5.96 -0.43 12.93 -0.06 7.63 0.01 9.80 0.36 10.96 0.30 0.99 1.07 1.71 2.21 2.07 0.19 0.07 0.15 0.12 -0.23 0.41 -1.72 1.27 -2.02 2.53 -2.39 10.32 -0.08 1.81 -0.12 5.24 -0.07 9.73 0.08 8.78 0.28 12.10 0.79 13.71 0.28 0.84 0.96 1.68 1.67 2.04 l0.48 0.24 -0.29 0.17 c-0.16 0.10 -0.56 0.45 -0.89 0.78 -0.72 0.70 -1.04 1.48 -1.27 3.08 -0.96 6.52 -0.70 27.22 0.36 30.55 0.24 0.76 0.78 1.44 1.46 1.86 0.31 0.20 0.57 0.41 0.57 0.45 0 0.06 -0.14 0.17 -0.31 0.27 -0.19 0.09 -0.52 0.37 -0.76 0.62 -1.20 1.23 -1.47 3.05 -1.75 11.66 -0.20 6.06 0.02 12.78 0.61 18.31 0.28 2.74 0.40 3.25 0.87 3.97 l0.40 0.58 -0.48 0.34 -0.48 0.35 -2.64 0 c-2.61 0 -2.64 0 -2.89 -0.27z"></path><path d="M71.75 158.64 c-0.10 -0.07 -3.75 -0.12 -9.70 -0.12 l-9.53 0 0.03 -0.31 0.03 -0.33 10.66 -0.06 c5.86 -0.03 10.73 -0.03 10.81 -0.01 0.15 0.03 -1.77 0.94 -2.02 0.94 -0.06 0 -0.20 -0.06 -0.29 -0.12z"></path><path d="M31.04 158.12 c0.57 -0.27 0.65 -0.28 4.07 -0.28 3.33 -0.01 3.49 0 3.87 0.23 0.22 0.13 0.40 0.27 0.40 0.29 0 0.02 -2 0.05 -4.45 0.03 l-4.46 -0.01 0.58 -0.27z"></path><path d="M33.79 156.03 c0.22 -0.41 0.37 -0.87 0.42 -1.29 0.03 -0.35 0.10 -0.68 0.15 -0.70 0.08 -0.05 1.55 1.25 2.62 2.28 l0.35 0.34 -1.96 0 -1.95 0 0.36 -0.63z"></path><path d="M52.94 156.29 c0.15 -0.72 0.87 -1.90 2.22 -3.65 1.41 -1.81 1.78 -2.45 1.79 -3.01 0 -0.37 -1.11 -2.62 -1.78 -3.63 -1.48 -2.19 -9.53 -9.39 -14.45 -12.92 -2.52 -1.81 -5.22 -3.32 -5.93 -3.33 -0.31 0 -0.40 -0.37 -0.54 -2.47 -0.16 -2.31 -0.30 -3.25 -0.58 -3.88 -0.22 -0.49 -0.72 -1.08 -1.12 -1.33 l-0.23 -0.14 0.23 -0.14 c0.55 -0.33 1.20 -1.13 1.39 -1.67 0.23 -0.72 0.37 -2.27 0.55 -5.81 0.08 -1.82 0.17 -2.83 0.27 -2.88 0.07 -0.05 8.54 -0.09 18.82 -0.09 18.16 0 18.71 0.01 19.06 0.22 0.71 0.43 0.87 1.02 1.01 3.72 0.16 3.21 0.16 35.27 0 37.90 -0.14 2.20 -0.33 2.81 -1.01 3.24 -0.38 0.23 -0.54 0.23 -10.08 0.23 l-9.70 0 0.08 -0.37z"></path><path d="M74.59 155.59 c0.23 -1.09 0.29 -2.39 0.43 -9.12 0.09 -4.74 0.12 -10.81 0.07 -17.12 -0.09 -11 -0.22 -15.82 -0.49 -16.81 -0.09 -0.36 -0.14 -0.68 -0.10 -0.71 0.08 -0.08 0.64 0.36 1 0.82 0.42 0.52 0.50 1.26 0.69 5.93 0.31 8.50 0.26 23.35 -0.13 33.11 -0.13 3.05 -0.20 3.34 -0.93 3.97 -0.49 0.41 -0.63 0.38 -0.54 -0.07z"></path><path d="M18.11 121.67 c-1.34 -0.33 -1.93 -0.92 -2.20 -2.19 -0.45 -2.12 -0.79 -8.85 -0.80 -15.93 0 -6.83 0.33 -12.81 0.79 -14.61 0.30 -1.15 1.04 -1.92 2.13 -2.24 0.56 -0.16 0.99 -0.19 2.70 -0.13 3.42 0.13 10.90 0.76 11.29 0.96 0.58 0.29 0.82 0.83 0.94 2.17 0.48 5.06 0.48 20.51 0 27.88 -0.19 2.85 -0.45 3.21 -2.54 3.49 -2.43 0.34 -8.69 0.76 -10.91 0.75 -0.44 0 -1.07 -0.07 -1.40 -0.15z"></path><path d="M34.97 109.87 c-0.24 -0.21 -0.24 -0.29 -0.30 -8.13 -0.06 -9.62 -0.23 -12.64 -0.78 -13.93 -0.15 -0.34 -0.48 -0.78 -0.79 -1.06 -0.35 -0.31 -0.48 -0.49 -0.38 -0.54 0.31 -0.10 0.98 -0.77 1.19 -1.19 0.29 -0.56 0.43 -1.47 0.58 -3.79 0.16 -2.50 0.35 -8.62 0.35 -11.73 0 -2.39 0.01 -2.54 0.23 -2.66 0.15 -0.08 6.07 -0.10 18.86 -0.09 l18.62 0.03 0.31 0.29 c0.79 0.75 0.83 1.06 0.99 12.35 0.13 8.34 0 23.12 -0.22 27.22 -0.12 1.97 -0.33 2.63 -0.98 3.11 -0.33 0.24 -0.38 0.24 -18.89 0.28 -17.55 0.02 -18.57 0.01 -18.79 -0.17z"></path><path d="M74.56 109.06 c0.41 -1.15 0.50 -5.11 0.50 -20.88 0 -14.08 -0.09 -19.27 -0.40 -20.26 -0.14 -0.50 -0.09 -0.55 0.28 -0.30 0.51 0.34 0.98 1.16 1.05 1.90 0.58 5.70 0.43 37.45 -0.20 38.94 -0.17 0.43 -1.04 1.27 -1.29 1.27 -0.14 0 -0.13 -0.12 0.06 -0.66z"></path><path d="M27.95 85.24 c-1.41 -0.07 -2.17 -0.15 -2.20 -0.24 -0.10 -0.29 -0.61 -0.66 -0.90 -0.66 -0.22 0 -0.45 0.15 -0.77 0.48 -0.42 0.44 -0.48 0.47 -1.05 0.43 -0.59 -0.03 -0.62 -0.05 -0.69 -0.43 -0.09 -0.45 -0.28 -0.61 -0.69 -0.57 -0.20 0.02 -0.35 0.15 -0.47 0.42 l-0.17 0.38 -1.51 -0.03 c-1.37 -0.03 -1.57 -0.07 -2.11 -0.35 -0.75 -0.40 -1.39 -1.12 -1.54 -1.76 -0.37 -1.46 -0.61 -5.91 -0.69 -12.95 -0.07 -6.29 0.06 -10.84 0.38 -14.27 0.30 -3.25 0.48 -3.91 1.21 -4.62 0.68 -0.65 1.09 -0.79 2.33 -0.78 1.47 0.02 2.10 0.19 2.10 0.57 0 0.78 0.48 1.16 1 0.82 0.26 -0.16 0.29 -0.26 0.26 -0.73 -0.03 -0.55 -0.03 -0.55 0.31 -0.51 0.33 0.03 6.13 1.28 8.04 1.71 1.09 0.26 1.71 0.56 1.97 0.99 0.13 0.22 0.24 0.77 0.30 1.43 0.50 5.29 0.41 24.91 -0.13 28.97 -0.24 1.85 -0.56 1.96 -5 1.72z"></path><path d="M35.02 65.25 c-0.15 -0.17 -0.21 -0.80 -0.31 -3.98 -0.14 -4.44 -0.31 -7.21 -0.49 -7.86 -0.16 -0.64 -0.41 -1.11 -0.82 -1.53 l-0.34 -0.36 0.47 -0.45 c0.43 -0.44 0.83 -1.36 0.83 -1.93 0 -0.12 0.03 -0.21 0.09 -0.21 0.05 0 1.09 0.98 2.33 2.17 1.23 1.19 2.42 2.24 2.64 2.33 0.57 0.23 1.04 0.09 1.54 -0.47 0.61 -0.65 2.45 -3.58 7.87 -12.42 1.72 -2.82 3.79 -6.08 5.06 -8.01 0.72 -1.12 1.40 -2.18 1.49 -2.35 0.22 -0.43 0.22 -1.20 0 -1.62 -0.09 -0.19 -0.80 -0.87 -1.60 -1.54 -3.49 -2.96 -5.92 -5.40 -7.70 -7.76 -0.09 -0.12 2.55 -0.15 13.12 -0.15 l13.23 0 0.42 0.36 c0.71 0.63 0.75 0.91 0.87 6.92 0.24 11.87 0.08 36.59 -0.24 37.74 -0.07 0.26 -0.33 0.66 -0.57 0.90 l-0.44 0.44 -18.62 0 c-17.66 0 -18.65 -0.01 -18.82 -0.21z"></path><path d="M74.31 65.38 c0 -0.06 0.12 -0.38 0.24 -0.73 0.40 -1.04 0.48 -4.31 0.48 -21.26 0 -14.86 -0.12 -22.03 -0.36 -23.06 -0.07 -0.26 -0.09 -0.49 -0.06 -0.51 0.08 -0.08 0.98 0.83 1.16 1.19 0.30 0.57 0.40 4.41 0.48 17.90 0.07 12.63 -0.07 23.40 -0.33 24.74 -0.12 0.65 -0.54 1.26 -1.08 1.60 -0.38 0.23 -0.54 0.27 -0.54 0.14z"></path><path d="M37.16 49.71 c-2.45 -2.40 -5.47 -5.23 -7.45 -6.95 -1.47 -1.28 -1.40 -1.21 -0.99 -1.13 1.04 0.22 1.46 0.08 1.46 -0.47 0 -0.42 -0.36 -0.59 -1.89 -0.91 -2.40 -0.50 -3.60 -0.96 -3.79 -1.41 -0.13 -0.36 1.09 -3.24 2.38 -5.59 1.68 -3.05 6.87 -10.95 9.60 -14.57 1.83 -2.43 3.77 -4.59 4.13 -4.59 0.17 0 0.56 0.47 1.39 1.65 1.63 2.34 3.44 4.75 4.48 5.98 1.23 1.43 3.94 4.05 5.77 5.58 1.76 1.48 2.04 1.75 2.04 2.05 0 0.13 -0.86 1.55 -1.90 3.17 -1.65 2.56 -4.60 7.24 -5.44 8.65 -0.36 0.61 -2.02 3.28 -3.70 6 -2.42 3.88 -3.18 5.01 -3.39 5.01 -0.10 -0.01 -1.32 -1.12 -2.69 -2.47z"></path><path d="M28.71 50.02 c-1.47 -0.35 -3.48 -0.83 -4.47 -1.05 l-1.79 -0.43 0.07 -0.70 c0.07 -0.80 -0.03 -1.20 -0.37 -1.30 -0.42 -0.13 -0.68 0.12 -0.76 0.72 -0.03 0.31 -0.15 0.69 -0.26 0.84 -0.19 0.26 -0.22 0.27 -2.13 0.22 -1.81 -0.03 -1.97 -0.06 -2.46 -0.33 -1.16 -0.64 -1.27 -1.49 -1.28 -9.73 0 -8.95 0.49 -17.42 1.22 -20.91 0.36 -1.76 1.22 -3.02 2.34 -3.45 0.71 -0.27 3.31 -0.17 4.64 0.17 1.78 0.47 7.86 3.08 9.11 3.91 0.83 0.55 1 0.83 1.01 1.71 0.02 0.83 0.29 0.36 -3.20 5.51 -3.46 5.09 -5.21 8.21 -6.67 11.87 -0.45 1.14 -0.54 1.47 -0.49 1.90 0.07 0.69 0.35 0.96 2.34 2.29 1.79 1.19 3.69 2.74 6.12 4.96 l1.55 1.43 -0.07 0.87 c-0.05 0.49 -0.15 1.05 -0.24 1.26 -0.19 0.44 -0.79 0.86 -1.22 0.85 -0.16 0 -1.49 -0.29 -2.97 -0.64z"></path><path d="M59.05 17.84 l-14.04 -0.03 -0.37 -0.51 c-0.21 -0.28 -0.38 -0.55 -0.38 -0.58 0 -0.03 6.10 -0.06 13.56 -0.06 9.59 0 13.65 -0.03 13.92 -0.13 0.34 -0.12 0.41 -0.09 0.98 0.34 0.34 0.27 0.73 0.62 0.90 0.78 l0.27 0.29 -0.40 -0.02 c-0.22 -0.02 -6.71 -0.05 -14.43 -0.07z"></path><path d="M34.17 17.58 c-0.12 -0.14 -0.42 -0.41 -0.66 -0.58 l-0.45 -0.33 0.31 -0.08 c0.31 -0.08 2.85 0.03 2.95 0.13 0.02 0.02 -0.13 0.26 -0.34 0.51 -0.31 0.41 -0.44 0.48 -0.82 0.48 -0.23 0 -0.51 0.02 -0.59 0.06 -0.09 0.03 -0.27 -0.05 -0.40 -0.19z"></path><path d="M75.13 17.32 c-0.29 -0.27 -0.85 -0.78 -1.26 -1.13 l-0.72 -0.64 0.16 -0.47 c0.14 -0.37 0.17 -1.20 0.19 -4.04 0 -2.02 0.05 -3.59 0.10 -3.59 0.19 0 1.99 1.99 2.22 2.46 0.22 0.41 0.23 0.69 0.23 3.95 0 3.28 -0.06 3.97 -0.33 3.96 -0.05 0 -0.31 -0.22 -0.61 -0.50z"></path></g></g></svg>`;function Ut(t){const e={};for(const r of t){if(r.ht){const t=r.ht.bar;e[t.uid]={room:r.name,role:"CC",anchorUid:t.uid,name:t.name};for(const o of ft){const s=r.ht.slots[o];s&&(e[s.uid]={room:r.name,role:o,anchorUid:t.uid,name:s.name})}}for(const t of r.pairs)t.L&&(e[t.L.uid]={room:r.name,role:"pairL",anchorUid:t.L.uid,name:t.L.name},t.R&&(e[t.R.uid]={room:r.name,role:"pairR",anchorUid:t.L.uid,name:t.R.name}));for(const t of r.tray)e[t.uid]={room:r.name,role:"solo",anchorUid:t.uid,name:t.name}}return e}function Tt(t){return structuredClone(t)}function Nt(t,e){return t.find(t=>t.key===e)}function Ht(t,e,r){const o=Tt(t),s=Nt(o,e);if(!s||!s.ht)return o;const i=s.ht.slots[r];return i?(s.ht.slots[r]=null,s.tray.push(i),s.tray.sort((t,e)=>t.name.localeCompare(e.name,void 0,{numeric:!0})),o):o}const Dt=["LF","RF","LR","RR","SW"],jt={LF:"Front L",RF:"Front R",LR:"Rear L",RR:"Rear R",SW:"Sub",CC:"Center"},Ft={LF:"lf",RF:"rf",LR:"lr",RR:"rr",SW:"sw"},Bt={separate:0,move:1,create_pair:2,add_ht:2,remove_ht:2};function Wt(t){return!!t&&-1!==Dt.indexOf(t.role)}function It(t,e){return Wt(t)&&Wt(e)&&t.anchorUid===e.anchorUid&&t.role===e.role&&!!t.height==!!e.height}function Kt(t){const e=Object.keys(t).sort(),r=[];for(const o of e){if("pairL"!==t[o].role)continue;const s=e.find(e=>"pairR"===t[e].role&&t[e].anchorUid===o);s&&r.push({left:o,right:s,leftName:t[o].name,rightName:t[s].name,room:t[o].room})}return r}function qt(t){const e=t.map((t,e)=>e);function r(t){for(;e[t]!==t;)e[t]=e[e[t]],t=e[t];return t}const o={};t.forEach((t,s)=>{t.touches.forEach(t=>{null!=o[t]&&function(t,o){e[r(t)]=r(o)}(s,o[t]),o[t]=s})});const s=new Map;return t.forEach((t,e)=>{const o=r(e),i=s.get(o);i?i.push(e):s.set(o,[e])}),Array.from(s.values()).sort((t,e)=>t[0]-e[0]).map(e=>e.slice().sort((e,r)=>Bt[t[e].type]-Bt[t[r].type]||e-r).map(e=>t[e]))}function Vt(t){return t?.message??String(t)}function Qt(t,e,r){const o=[],s=[];for(const t of e){s.push(o.length);for(const e of t)o.push({op:e,status:"pending"})}const i=()=>{r?.onUpdate?.(o)};return i(),Promise.all(e.map((e,r)=>async function(e,r){let s=!1;for(let a=0;a<e.length;a++){const e=o[r+a];if(s)e.status="skipped",i();else{e.status="running",i();try{await t.callService(e.op.service.domain,e.op.service.service,e.op.service.data),e.status="done",i()}catch(t){e.status="error",e.error=Vt(t),i(),s=!0}}}}(e,s[r]))).then(()=>o)}function Zt(t,e){const r=qt(function(t,e){const r=[],o=Array.from(new Set([...Object.keys(t),...Object.keys(e)])).sort(),s=Kt(t),i=Kt(e),a=new Set(i.map(t=>`${t.left}|${t.right}`));for(const t of s)a.has(`${t.left}|${t.right}`)||r.push({type:"separate",touches:[t.left,t.right],service:{domain:"chorus",service:"separate",data:{left:t.left,right:t.right}},summary:`${t.room} — separate stereo pair`});for(const s of o){const o=t[s],i=e[s];Wt(o)&&!It(o,i)&&r.push({type:"remove_ht",touches:[s,o.anchorUid],service:{domain:"chorus",service:"remove_home_theater",data:{soundbar:o.anchorUid,channel:o.role}},summary:`${o.room} — remove ${jt[o.role]??o.role}`})}for(const s of o){const o=t[s],i=e[s];o&&i&&"solo"===o.role&&"solo"===i.role&&o.room!==i.room&&r.push({type:"move",touches:[s],service:{domain:"chorus",service:"move",data:{speaker:s,name:i.room}},summary:`${i.name} — move to ${i.room}`})}const n=new Set(s.map(t=>`${t.left}|${t.right}`));for(const t of i)n.has(`${t.left}|${t.right}`)||r.push({type:"create_pair",touches:[t.left,t.right],service:{domain:"chorus",service:"create_stereo_pair",data:{left:t.left,right:t.right}},summary:`${t.room} — create stereo pair`});for(const s of o){const o=t[s],i=e[s];if(Wt(i)&&!It(o,i)){const t=Ft[i.role];r.push({type:"add_ht",touches:[s,i.anchorUid],service:{domain:"chorus",service:"set_home_theater",data:{soundbar:i.anchorUid,[t]:s}},summary:`${i.room} — add ${jt[i.role]??i.role}`})}}return r}(t,e)),o=r.flat(),s=o.map(t=>({summary:t.summary,status:"pending"}));return{ops:o,lanes:r,rows:s}}let Gt=class extends pt{constructor(){super(...arguments),this.rows=[],this.busy=!1,this.open=!1}toggle(){this.busy||(this.open=!this.open)}emit(t){this.dispatchEvent(new CustomEvent(t,{bubbles:!0,composed:!0}))}renderStatus(t){return"done"===t?I`
        <span class="state done" aria-label="done" title="Done">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <polyline points="5 12.5 10 17 19 7.5" />
          </svg>
        </span>
      `:"error"===t?I`
        <span class="state error" aria-label="error" title="Error">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <line x1="7" y1="7" x2="17" y2="17" />
            <line x1="17" y1="7" x2="7" y2="17" />
          </svg>
        </span>
      `:"running"===t?I`<span class="state running" aria-label="running" title="Applying"></span>`:"skipped"===t?I`<span class="state skipped" aria-label="skipped" title="Skipped"></span>`:I`<span class="state pending" aria-label="pending" title="Pending"></span>`}render(){const t=this.rows.length;if(0===t)return V;const e=this.busy||this.open,r=`${t} pending change${1===t?"":"s"}`;return I`
      <div
        class="bar ${e?"open":""} ${this.busy?"busy":""}"
        role="region"
        aria-label="Pending changes"
      >
        <div class="head">
          <button
            type="button"
            class="info"
            @click=${this.toggle}
            ?disabled=${this.busy}
            aria-expanded=${e?"true":"false"}
          >
            <span class="dot"></span>
            <b>${r}</b>
            ${this.busy?V:I`<span class="tog">${this.open?"Hide":"Details"}</span>`}
          </button>

          <div class="acts">
            ${this.busy?V:I`
                  <button type="button" class="discard" @click=${()=>this.emit("discard")}>
                    Discard
                  </button>
                `}
            <button
              type="button"
              class="apply"
              ?disabled=${this.busy}
              @click=${()=>this.emit("apply")}
              aria-busy=${this.busy?"true":"false"}
            >
              ${this.busy?I`<span class="apply-spin" aria-hidden="true"></span>Applying…`:"Apply"}
            </button>
          </div>
        </div>

        <div class="list" ?hidden=${!e}>
          ${this.rows.map(t=>I`
              <div class="row ${t.status}">
                ${this.renderStatus(t.status)}
                <span class="summary">${t.summary}</span>
              </div>
            `)}
        </div>
      </div>
    `}};Gt.styles=a`
    :host {
      /* Green for a completed step; falls back to the theme accent so we never
         hardcode a color that could clash with a custom HA theme. */
      --cb-done: var(--success-color, var(--primary-color));
      --cb-error: var(--error-color);
    }

    .bar {
      position: fixed;
      left: 50%;
      bottom: 22px;
      transform: translateX(-50%);
      width: min(680px, calc(100vw - 32px));
      box-sizing: border-box;
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      box-shadow: var(--ha-card-box-shadow, 0 12px 40px -12px rgba(0, 0, 0, 0.4));
      color: var(--primary-text-color);
      z-index: 6;
      overflow: hidden;
    }

    .bar.busy {
      /* keep interactive (Apply announces progress) but signal locked state */
      cursor: default;
    }

    .head {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 10px 10px 16px;
    }

    .info {
      flex: 1;
      display: flex;
      align-items: center;
      gap: 10px;
      background: none;
      border: 0;
      font: inherit;
      color: var(--primary-text-color);
      cursor: pointer;
      text-align: left;
      padding: 6px 4px;
      border-radius: 8px;
      min-width: 0;
    }
    .info:disabled {
      cursor: default;
    }
    .info b {
      font-size: 14.5px;
      font-weight: 600;
      letter-spacing: -0.01em;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-color);
      flex: none;
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--primary-color) 20%, transparent);
    }

    .tog {
      font-size: 12.5px;
      color: var(--secondary-text-color);
      flex: none;
    }
    .bar.open .tog {
      color: var(--primary-color);
    }

    .acts {
      display: flex;
      gap: 6px;
      flex: none;
      align-items: center;
    }

    .discard {
      font: inherit;
      font-size: 13.5px;
      font-weight: 500;
      color: var(--secondary-text-color);
      background: none;
      border: 0;
      padding: 9px 13px;
      border-radius: 10px;
      cursor: pointer;
    }
    .discard:hover {
      background: var(--secondary-background-color);
    }

    .apply {
      font: inherit;
      font-size: 13.5px;
      font-weight: 600;
      color: var(--text-primary-color, #fff);
      background: var(--primary-color);
      border: 0;
      padding: 9px 20px;
      border-radius: 10px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .apply:hover:not(:disabled) {
      filter: brightness(1.06);
    }
    .apply:disabled {
      cursor: default;
      opacity: 0.85;
    }

    .apply-spin {
      width: 13px;
      height: 13px;
      border-radius: 50%;
      border: 2px solid color-mix(in srgb, currentColor 40%, transparent);
      border-top-color: currentColor;
      animation: spin 0.7s linear infinite;
      flex: none;
    }

    button:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .list {
      max-height: 240px;
      overflow-y: auto;
      padding: 0 16px 10px;
    }
    .list[hidden] {
      display: none;
    }

    .row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 9px 2px;
      border-top: 1px solid var(--divider-color);
      font-size: 12.5px;
    }

    .summary {
      color: var(--primary-text-color);
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .row.skipped .summary {
      color: var(--secondary-text-color);
    }

    /* Per-row status indicator: a fixed-size disc that each status restyles. */
    .state {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      border: 1.6px solid var(--divider-color);
      background: transparent;
      flex: none;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .state svg {
      width: 12px;
      height: 12px;
    }

    /* pending: hollow disc (the base .state look) */

    /* running: spinning ring */
    .state.running {
      border-color: var(--divider-color);
      border-top-color: var(--primary-color);
      animation: spin 0.7s linear infinite;
    }

    /* done: filled green with a check */
    .state.done {
      background: var(--cb-done);
      border-color: var(--cb-done);
    }
    .state.done svg {
      stroke: var(--text-primary-color, #fff);
      stroke-width: 3;
      stroke-linecap: round;
      stroke-linejoin: round;
    }

    /* error: filled red with an x */
    .state.error {
      background: var(--cb-error);
      border-color: var(--cb-error);
    }
    .state.error svg {
      stroke: var(--text-primary-color, #fff);
      stroke-width: 3;
      stroke-linecap: round;
    }

    /* skipped: dimmed hollow disc */
    .state.skipped {
      border-style: dashed;
      opacity: 0.5;
    }

    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .apply-spin,
      .state.running {
        animation: none;
      }
    }
  `,t([mt({attribute:!1})],Gt.prototype,"rows",void 0),t([mt({type:Boolean})],Gt.prototype,"busy",void 0),t([gt()],Gt.prototype,"open",void 0),Gt=t([lt("chorus-changebar")],Gt);const Yt=K`
  <path d="M4 9.5v5h3.3L11.5 18V6L7.3 9.5H4z" fill="currentColor" stroke="none" />
  <path d="M15 9.3a4 4 0 0 1 0 5.4" />
  <path d="M17.7 6.5a8 8 0 0 1 0 11" />
`;let Jt=class extends pt{constructor(){super(...arguments),this._message="",this._visible=!1}show(t){this._clearTimer(),this._message=t,this._visible=!0,this._timer=window.setTimeout(()=>{this._visible=!1,this._timer=void 0},2700)}disconnectedCallback(){super.disconnectedCallback(),this._clearTimer()}_clearTimer(){void 0!==this._timer&&(window.clearTimeout(this._timer),this._timer=void 0)}render(){return this._message?I`
      <div class="toast ${this._visible?"on":""}" role="status" aria-live="polite">
        <span class="wave">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            ${Yt}
          </svg>
        </span>
        <span class="msg">${this._message}</span>
      </div>
    `:V}};Jt.styles=a`
    :host {
      position: fixed;
      left: 0;
      right: 0;
      bottom: 30px;
      z-index: 1000;
      display: flex;
      justify-content: center;
      pointer-events: none;
    }
    .toast {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      max-width: min(90vw, 420px);
      padding: 12px 20px;
      border-radius: 980px;
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      box-shadow: var(--ha-card-box-shadow, 0 18px 44px -14px rgba(0, 0, 0, 0.4));
      color: var(--primary-text-color);
      font-size: 13.5px;
      font-weight: 500;
      opacity: 0;
      transform: translateY(10px) scale(0.97);
      transition: opacity 0.32s cubic-bezier(0.34, 1.4, 0.6, 1),
        transform 0.32s cubic-bezier(0.34, 1.4, 0.6, 1);
    }
    .toast.on {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
    .wave {
      display: grid;
      place-items: center;
      color: var(--primary-color);
      flex: none;
    }
    .wave svg {
      width: 17px;
      height: 17px;
      display: block;
    }
    .msg {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    @media (prefers-reduced-motion: reduce) {
      .toast {
        transition: none;
        transform: none;
      }
      .toast.on {
        transform: none;
      }
    }
  `,t([gt()],Jt.prototype,"_message",void 0),t([gt()],Jt.prototype,"_visible",void 0),Jt=t([lt("chorus-toast")],Jt);let Xt=class extends pt{constructor(){super(...arguments),this.heading="",this.subheading="",this.items=[],this.open=!1,this._onKeyDown=t=>{this.open&&"Escape"===t.key&&(t.stopPropagation(),this._close())}}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._onKeyDown)}disconnectedCallback(){window.removeEventListener("keydown",this._onKeyDown),super.disconnectedCallback()}_close(){this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}_select(t){t.disabled||(this.dispatchEvent(new CustomEvent("select",{detail:t.id,bubbles:!0,composed:!0})),this._close())}_onBackdrop(t){t.target===t.currentTarget&&this._close()}render(){return this.open?I`
      <div class="backdrop" @click=${this._onBackdrop}>
        <div
          class="sheet"
          role="dialog"
          aria-modal="true"
          aria-label=${this.heading||"Actions"}
        >
          ${this.heading||this.subheading?I`<div class="head">
                ${this.heading?I`<b>${this.heading}</b>`:V}
                ${this.subheading?I`<span>${this.subheading}</span>`:V}
              </div>`:V}
          <div class="items">
            ${this.items.map(t=>I`
                <button
                  type="button"
                  class="item ${t.danger?"danger":""}"
                  ?disabled=${t.disabled}
                  aria-disabled=${t.disabled?"true":"false"}
                  @click=${()=>this._select(t)}
                >
                  <span class="label">${t.label}</span>
                  ${t.sub?I`<span class="sub">${t.sub}</span>`:V}
                </button>
              `)}
          </div>
          <button type="button" class="cancel" @click=${this._close}>Cancel</button>
        </div>
      </div>
    `:V}};Xt.styles=a`
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 1000;
      background: rgba(0, 0, 0, 0.42);
      display: flex;
      align-items: flex-end;
      justify-content: center;
      padding: 16px;
      animation: fade 0.2s ease;
    }

    .sheet {
      width: 360px;
      max-width: 100%;
      max-height: 82vh;
      overflow-y: auto;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: 20px;
      box-shadow: 0 24px 70px -20px rgba(0, 0, 0, 0.55);
      padding: 8px;
      margin-bottom: max(8px, env(safe-area-inset-bottom));
      animation: rise 0.24s cubic-bezier(0.34, 1.4, 0.6, 1);
    }
    /* Center it as a true action-sheet on wider viewports. */
    @media (min-width: 560px) {
      .backdrop {
        align-items: center;
      }
    }

    .head {
      text-align: center;
      padding: 13px 12px 10px;
    }
    .head b {
      display: block;
      font-size: 16px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .head span {
      display: block;
      font-size: 12.5px;
      color: var(--secondary-text-color);
      margin-top: 3px;
    }

    .items {
      display: flex;
      flex-direction: column;
    }

    .item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      width: 100%;
      border: none;
      background: none;
      font: inherit;
      color: var(--primary-text-color);
      text-align: left;
      padding: 12px 14px;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.12s ease;
    }
    .item + .item {
      border-top: 1px solid var(--divider-color);
      border-radius: 0;
    }
    .item:hover {
      background: var(--secondary-background-color);
    }
    .item:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }
    .item .label {
      font-size: 15px;
      line-height: 1.3;
    }
    .item .sub {
      font-size: 12.5px;
      color: var(--secondary-text-color);
      line-height: 1.3;
    }

    .item.danger .label {
      color: var(--error-color, #d32f2f);
    }
    .item.danger:hover {
      background: color-mix(in srgb, var(--error-color, #d32f2f) 12%, transparent);
    }

    .item:disabled {
      cursor: default;
      opacity: 0.4;
    }
    .item:disabled:hover {
      background: none;
    }

    .cancel {
      width: 100%;
      border: none;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      font: inherit;
      font-size: 15px;
      font-weight: 600;
      padding: 12px;
      border-radius: 12px;
      cursor: pointer;
      margin-top: 6px;
      transition: filter 0.12s ease;
    }
    .cancel:hover {
      filter: brightness(0.95);
    }
    .cancel:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: -2px;
    }

    @keyframes fade {
      from {
        opacity: 0;
      }
    }
    @keyframes rise {
      from {
        opacity: 0;
        transform: translateY(16px) scale(0.96);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .backdrop,
      .sheet {
        animation: none;
      }
    }
  `,t([mt({type:String})],Xt.prototype,"heading",void 0),t([mt({type:String})],Xt.prototype,"subheading",void 0),t([mt({attribute:!1})],Xt.prototype,"items",void 0),t([mt({type:Boolean})],Xt.prototype,"open",void 0),Xt=t([lt("chorus-menu")],Xt);const te={LF:"t-front",RF:"t-front",LR:"t-rear",RR:"t-rear",SW:"t-sub"};let ee=class extends pt{constructor(){super(...arguments),this.narrow=!1,this._dirty=!1,this._applying=!1,this._rows=[],this._onMenuSelect=t=>{const e=this._menu;this._menu=void 0,e?.onSelect(t.detail)}}willUpdate(t){(t.has("graph")&&!this._dirty||void 0===this._working)&&(this._working=structuredClone(Mt(this.graph)))}get _rooms(){return this._working??Mt(this.graph)}_room(){const t=this._rooms;if(this._selected){const e=t.find(t=>t.key===this._selected);if(e)return e}return this.narrow?void 0:t[0]}_plan(){return Zt(Ut(Mt(this.graph)),Ut(this._rooms))}_toast(t){const e=this.shadowRoot?.querySelector("chorus-toast");e?.show(t)}_assign(t,e,r){this._working=function(t,e,r,o){const s=Tt(t),i=Nt(s,e);if(!i||!i.ht)return s;const a=i.tray.findIndex(t=>t.uid===o);if(-1===a)return s;const[n]=i.tray.splice(a,1),c=i.ht.slots[r];return c&&i.tray.push(c),i.ht.slots[r]=n,i.tray.sort((t,e)=>t.name.localeCompare(e.name,void 0,{numeric:!0})),s}(this._rooms,t,e,r.uid),this._dirty=!0,this._picker=void 0,this._toast(`${this._name(r)} → ${vt[e]}`)}_canDrop(t,e){return!!this._drag&&this._drag.roomKey===t.key&&$t(e,this._drag.model)}_dropOnChannel(t,e){if(!this._canDrop(t,e))return;const r=t.tray.find(t=>t.uid===this._drag.uid);this._drag=void 0,r&&this._assign(t.key,e,r)}_onDragOver(t,e,r){this._canDrop(e,r)&&(t.preventDefault(),t.currentTarget.classList.add("over"))}_onDrop(t,e,r){t.preventDefault(),t.currentTarget.classList.remove("over"),this._dropOnChannel(e,r)}_clear(t,e,r){this._working=Ht(this._rooms,t,e),this._dirty=!0,this._toast(`${r.name} removed from ${vt[e]}`)}_separate(t,e){this._working=function(t,e,r){const o=Tt(t),s=Nt(o,e);if(!s||r<0||r>=s.pairs.length)return o;const[i]=s.pairs.splice(r,1);for(const t of[i.L,i.R,i.sub])t&&s.tray.push(t);return s.tray.sort((t,e)=>t.name.localeCompare(e.name,void 0,{numeric:!0})),o}(this._rooms,t,e),this._dirty=!0,this._toast("Stereo pair separated")}_pickPairMember(t){if(!this._pairPick)return;const{roomKey:e,first:r}=this._pairPick;r?t.uid!==r&&(this._working=function(t,e,r,o){const s=Tt(t),i=Nt(s,e);if(!i||r===o)return s;const a=i.tray.findIndex(t=>t.uid===r),n=i.tray.findIndex(t=>t.uid===o);if(-1===a||-1===n)return s;const c=i.tray[a],p=i.tray[n];return i.tray=i.tray.filter(t=>t.uid!==r&&t.uid!==o),i.pairs.push({L:c,R:p,sub:null}),s}(this._rooms,e,r,t.uid),this._dirty=!0,this._pairPick=void 0,this._toast("Stereo pair created")):this._pairPick={roomKey:e,first:t.uid}}_openRoomMenu(t){const e=[];t.ht&&e.push({id:"dissolve",label:"Separate home theater",danger:!0}),e.length&&(this._menu={heading:t.name,items:e,onSelect:e=>{"dissolve"===e&&(this._working=function(t,e){const r=Nt(t,e);if(!r?.ht)return Tt(t);let o=Tt(t);for(const t of ft)o=Ht(o,e,t);return o}(this._rooms,t.key),this._dirty=!0,this._toast("Home theater separated"))}})}_openPairMenu(t,e){this._menu={heading:"Stereo pair",items:[{id:"swap",label:"Swap L / R"},{id:"separate",label:"Separate pair",danger:!0}],onSelect:r=>{"swap"===r?(this._working=function(t,e,r){const o=Tt(t),s=Nt(o,e);if(!s||r<0||r>=s.pairs.length)return o;const i=s.pairs[r];return[i.L,i.R]=[i.R,i.L],o}(this._rooms,t.key,e),this._dirty=!0,this._toast("Swapped L / R")):"separate"===r&&this._separate(t.key,e)}}}_openSpeakerMenu(t){this._menu={heading:this._name(t),items:[{id:"identify",label:"Identify"}],onSelect:e=>{"identify"===e&&this._toast(`Chiming on ${this._name(t)}`)}}}_dots(t){return I`<button
      type="button"
      class="dots"
      title="Options"
      aria-label="Options"
      @click=${e=>{e.stopPropagation(),t(e)}}
    >
      ⋯
    </button>`}_discard(){this._working=structuredClone(Mt(this.graph)),this._dirty=!1,this._picker=void 0,this._toast("Changes discarded")}async _apply(){const t=this._plan();if(function(t){return 0===t.ops.length}(t)||this._applying)return;this._applying=!0,this._rows=t.rows,await function(t,e,r){const o=t=>t.map(t=>({summary:t.op.summary,status:t.status}));return Qt(t,e.lanes,{onUpdate:t=>r(o(t))}).then(t=>o(t))}(this.hass,t,t=>{this._rows=[...t]});const e=this._bondSignature(Ut(this._rooms)),r=await this._awaitConvergence(e),o=this._rows.filter(t=>"error"===t.status).length;this._applying=!1,this._dirty=!1,r?this.dispatchEvent(new CustomEvent("chorus-graph",{detail:r,bubbles:!0,composed:!0})):this.dispatchEvent(new CustomEvent("chorus-refresh",{bubbles:!0,composed:!0})),this._toast(o?`Applied with ${o} error${1===o?"":"s"}`:"Applied")}_bondSignature(t){return Object.keys(t).sort().map(e=>`${e}:${t[e].role}:${t[e].anchorUid}`).join(";")}async _awaitConvergence(t){let e;for(let r=0;r<5;r++){let r;try{r=await this.hass.connection.sendMessagePromise({type:"chorus/refresh"})}catch{return e}if(e=r,this._bondSignature(Ut(Mt(r)))===t)return r;await new Promise(t=>window.setTimeout(t,1500))}return e}_name(t){return t.name&&!/^RINCON_/i.test(t.name)?t.name:Pt(t.model)||"Speaker"}render(){const t=this._rooms;if(!t.length)return I`<div class="empty">No Sonos speakers discovered yet.</div>
        <chorus-toast></chorus-toast>`;const e=this._room(),r=this._plan(),o=this._applying?this._rows:r.rows;return I`
      <div class="grid" data-detail=${e?"on":"off"}>
        <div class="col-list">
          <div class="eyebrow">Rooms</div>
          <div class="list">${t.map(t=>this._roomButton(t,e))}</div>
        </div>
        <div class="col-detail">${e?this._detail(e):V}</div>
      </div>
      ${this._pickerOverlay()}
      ${this._pairOverlay()}
      <chorus-menu
        .open=${!!this._menu}
        .heading=${this._menu?.heading??""}
        .items=${this._menu?.items??[]}
        @select=${this._onMenuSelect}
        @close=${()=>this._menu=void 0}
      ></chorus-menu>
      <chorus-changebar
        .rows=${o}
        .busy=${this._applying}
        @apply=${this._apply}
        @discard=${this._discard}
      ></chorus-changebar>
      <chorus-toast></chorus-toast>
    `}_roomGlyphModel(t){return t.ht?.bar.model??t.pairs[0]?.L?.model??t.tray[0]?.model??""}_roomTint(t){return t.ht?"t-bar":t.pairs.length?"t-front":"t-neutral"}_roomButton(t,e){const r=e?.key===t.key;return I`
      <button type="button" class="room ${r?"sel":""}" @click=${()=>this._selected=t.key}>
        <span class="ric ${this._roomTint(t)}">${Et(this._roomGlyphModel(t))}</span>
        <span class="rmeta">
          <b>${t.name}</b>
          <span>${this._roomSummary(t)}</span>
        </span>
        <span class="chev">›</span>
      </button>
    `}_roomSummary(t){const e=[];if(t.ht){const r=ft.filter(e=>"SW"!==e&&t.ht.slots[e]).length;e.push(`Home theater · ${r}.${t.ht.slots.SW?"1":"0"}`)}t.pairs.length&&e.push(1===t.pairs.length?"Stereo pair":`${t.pairs.length} pairs`);const r=t.tray.length;return r&&!t.ht&&e.push(1===r?"1 speaker":`${r} speakers`),e.join(" · ")||"No speakers"}_detail(t){return I`
      ${this.narrow?I`<button type="button" class="back" @click=${()=>this._selected=void 0}>
            ‹ All rooms
          </button>`:V}
      <div class="head">
        <h1>${t.name}</h1>
        ${t.area?V:I`<span class="kind">No HA area</span>`}
        <span class="grow"></span>
        ${t.ht?this._dots(()=>this._openRoomMenu(t)):V}
      </div>
      ${t.ht?this._htStage(t,t.ht):V}
      ${t.pairs.length?I`<div class="paircards">${t.pairs.map((e,r)=>this._pairCard(t,e,r))}</div>`:V}
      ${this._traySection(t)}
    `}_htStage(t,e){return I`
      <div class="stage">
        <div class="tv">${Lt}</div>
        <div class="postile bar t-bar">
          <span class="badge t-bar">${Et(e.bar.model)}</span>
          <span class="pmeta"><b>${this._name(e.bar)}</b><span>${Pt(e.bar.model)||"Center"}</span></span>
        </div>
        <div class="prow fronts">${this._pos(t,e,"LF")}${this._pos(t,e,"RF")}</div>
        <div class="lp"><div class="couch">${Ot}</div><small>Listening position</small></div>
        <div class="prow rear">${this._pos(t,e,"LR")}${this._pos(t,e,"RR")}</div>
        <div class="psub">${this._pos(t,e,"SW")}</div>
      </div>
    `}_pos(t,e,r){const o=e.slots[r],s=t.tray.some(t=>$t(r,t.model));if(!o){const e=()=>{s&&(this._picker={roomKey:t.key,ch:r})};return I`
        <div
          class="postile empty ${s?"actionable":""}"
          role=${s?"button":V}
          tabindex=${s?"0":V}
          title=${s?`Add ${vt[r]}`:"No eligible speaker in this room"}
          @click=${e}
          @keydown=${t=>{"Enter"!==t.key&&" "!==t.key||(t.preventDefault(),e())}}
          @dragover=${e=>this._onDragOver(e,t,r)}
          @dragleave=${t=>t.currentTarget.classList.remove("over")}
          @drop=${e=>this._onDrop(e,t,r)}
        >
          <span class="badge empty-badge">${r}</span>
          <span class="pmeta"><b>${vt[r]}</b><span>${s?"Tap to add":"Empty"}</span></span>
        </div>
      `}return I`
      <div
        class="postile"
        @dragover=${e=>this._onDragOver(e,t,r)}
        @dragleave=${t=>t.currentTarget.classList.remove("over")}
        @drop=${e=>this._onDrop(e,t,r)}
      >
        <span class="badge ${te[r]}">${Et(o.model)}</span>
        <span class="pmeta">
          <b>${this._name(o)}</b>
          <span>${vt[r]} · ${Pt(o.model)}</span>
        </span>
        <button type="button" class="x" title="Remove" @click=${()=>this._clear(t.key,r,o)}>×</button>
      </div>
    `}_pairCard(t,e,r){return I`
      <div class="paircard">
        <div class="pc-orbs">
          ${this._pcSlot("L",e.L)}
          <span class="pc-div">+</span>
          ${this._pcSlot("R",e.R)}
        </div>
        <div class="pc-meta">
          <b>${e.L?this._name(e.L):e.R?this._name(e.R):"Stereo pair"}</b>
          <span>${Pt(e.L?.model??e.R?.model)} · stereo pair</span>
        </div>
        ${e.sub?I`<span class="pc-sub"><span class="pc-sub-ic">${Et(e.sub.model)}</span> Sub · ${e.sub.name}</span>`:V}
        <span class="grow"></span>
        ${this._dots(()=>this._openPairMenu(t,r))}
      </div>
    `}_pcSlot(t,e){return I`
      <div class="pc-slot ${e?"":"empty"}">
        ${e?I`<span class="badge orb t-front">${Et(e.model)}</span>`:I`<span class="badge empty-badge">${t}</span>`}
        <span class="pc-side">${t}</span>
      </div>
    `}_traySection(t){if(!t.tray.length)return t.ht||t.pairs.length?V:I`<div class="empty">No speakers in this room.</div>`;const e=t.ht||t.pairs.length?"Available speakers":"Speakers",r=t.tray.filter(t=>_t(t.model)).length>=2;return I`
      <div class="sec">${e}</div>
      <div class="rows">${t.tray.map(e=>this._speakerRow(e,t.key))}</div>
      ${r?I`<button type="button" class="newpair" @click=${()=>this._pairPick={roomKey:t.key}}>
            ＋ Create stereo pair
          </button>`:V}
    `}_speakerRow(t,e){return I`
      <div
        class="row drag"
        draggable="true"
        @dragstart=${r=>{this._drag={uid:t.uid,roomKey:e,model:t.model},r.dataTransfer&&(r.dataTransfer.effectAllowed="move"),r.currentTarget.classList.add("dragging")}}
        @dragend=${t=>{this._drag=void 0,t.currentTarget.classList.remove("dragging")}}
      >
        <span class="rt">${Et(t.model)}</span>
        <span class="rx"><b>${this._name(t)}</b><span>${Pt(t.model)}</span></span>
        <span class="grow"></span>
        ${this._dots(()=>this._openSpeakerMenu(t))}
      </div>
    `}_pickerOverlay(){if(!this._picker)return V;const{roomKey:t,ch:e}=this._picker,r=this._rooms.find(e=>e.key===t),o=(r?.tray??[]).filter(t=>$t(e,t.model));return I`
      <div class="backdrop" @click=${()=>this._picker=void 0}>
        <div class="sheet" @click=${t=>t.stopPropagation()}>
          <div class="sheet-h">Add ${vt[e]}</div>
          ${o.length?o.map(r=>I`
                  <button type="button" class="sheet-item" @click=${()=>this._assign(t,e,r)}>
                    <span class="rt">${Et(r.model)}</span>
                    <span class="rx"><b>${r.name}</b><span>${Pt(r.model)}</span></span>
                  </button>
                `):I`<div class="sheet-empty">No eligible speaker in this room.</div>`}
          <button type="button" class="sheet-cancel" @click=${()=>this._picker=void 0}>Cancel</button>
        </div>
      </div>
    `}_pairOverlay(){if(!this._pairPick)return V;const{roomKey:t,first:e}=this._pairPick,r=this._rooms.find(e=>e.key===t),o=(r?.tray??[]).filter(t=>_t(t.model)&&t.uid!==e);return I`
      <div class="backdrop" @click=${()=>this._pairPick=void 0}>
        <div class="sheet" @click=${t=>t.stopPropagation()}>
          <div class="sheet-h">
            ${e?"Pick the partner speaker":"Create stereo pair — pick the first speaker"}
          </div>
          ${o.length?o.map(t=>I`
                  <button type="button" class="sheet-item" @click=${()=>this._pickPairMember(t)}>
                    <span class="rt">${Et(t.model)}</span>
                    <span class="rx"><b>${this._name(t)}</b><span>${Pt(t.model)}</span></span>
                  </button>
                `):I`<div class="sheet-empty">No speaker available to pair.</div>`}
          <button type="button" class="sheet-cancel" @click=${()=>this._pairPick=void 0}>Cancel</button>
        </div>
      </div>
    `}};ee.styles=a`
    :host {
      display: block;
      color: var(--primary-text-color);
      --chorus-front: #2f6fed;
      --chorus-rear: #12a3a3;
      --chorus-sub: #6a4bd8;
      --chorus-bar: var(--primary-color);
    }
    .grid {
      display: grid;
      grid-template-columns: 240px 1fr;
      gap: 24px;
      align-items: start;
    }
    .eyebrow {
      font-size: 12px;
      font-weight: 600;
      color: var(--secondary-text-color);
      margin: 0 4px 8px;
    }
    .list {
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 14px;
      overflow: hidden;
    }
    .room {
      width: 100%;
      border: none;
      background: none;
      font: inherit;
      color: var(--primary-text-color);
      cursor: pointer;
      text-align: left;
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 11px;
    }
    .room + .room {
      border-top: 1px solid var(--divider-color);
    }
    .room:hover {
      background: var(--secondary-background-color);
    }
    .room.sel {
      background: color-mix(in srgb, var(--primary-color) 13%, transparent);
    }
    .ric {
      width: 30px;
      height: 30px;
      border-radius: 8px;
      flex: none;
      display: grid;
      place-items: center;
    }
    .ric svg {
      width: 19px;
      height: 19px;
    }
    .rmeta {
      flex: 1;
      min-width: 0;
    }
    .rmeta b {
      display: block;
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .rmeta span {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .chev {
      color: var(--secondary-text-color);
    }
    .room.sel .chev {
      color: var(--primary-color);
    }
    .back {
      border: none;
      background: none;
      color: var(--primary-color);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      padding: 0 0 12px;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 2px 12px;
    }
    .head h1 {
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    }
    .kind {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--secondary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      padding: 1px 8px;
      font-weight: 600;
    }
    .grow {
      flex: 1;
    }
    .dots {
      flex: none;
      border: none;
      background: none;
      color: var(--secondary-text-color);
      font-size: 20px;
      line-height: 1;
      cursor: pointer;
      padding: 2px 9px;
      border-radius: 8px;
    }
    .dots:hover {
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
    }

    .t-front {
      background: color-mix(in srgb, var(--chorus-front) 16%, var(--card-background-color));
      color: var(--chorus-front);
    }
    .t-rear {
      background: color-mix(in srgb, var(--chorus-rear) 17%, var(--card-background-color));
      color: var(--chorus-rear);
    }
    .t-sub {
      background: color-mix(in srgb, var(--chorus-sub) 16%, var(--card-background-color));
      color: var(--chorus-sub);
    }
    .t-bar {
      background: color-mix(in srgb, var(--chorus-bar) 16%, var(--card-background-color));
      color: var(--chorus-bar);
    }
    .t-neutral {
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
    }

    .stage {
      padding: 8px 0 18px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }
    .tv {
      width: 210px;
      max-width: 60%;
      color: var(--secondary-text-color);
      margin-bottom: 6px;
    }
    .tv svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .ink {
      fill: currentColor;
    }
    .paper {
      fill: var(--primary-background-color, var(--card-background-color, #fff));
    }
    .prow {
      display: flex;
      gap: 44px;
      justify-content: center;
      flex-wrap: wrap;
      margin-top: 12px;
    }
    .psub {
      margin-top: 12px;
    }
    .lp {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      margin: 16px 0 4px;
    }
    .lp .couch {
      width: 150px;
      color: var(--secondary-text-color);
    }
    .lp .couch svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .lp small {
      font-size: 11px;
      color: var(--secondary-text-color);
    }
    .postile {
      box-sizing: border-box;
      min-width: 158px;
      min-height: 62px;
      border-radius: 15px;
      background: var(--card-background-color, var(--ha-card-background));
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.12));
      border: 1px solid var(--divider-color);
      padding: 10px 12px;
      display: flex;
      align-items: center;
      gap: 11px;
      position: relative;
    }
    button.postile {
      appearance: none;
      -webkit-appearance: none;
      margin: 0;
      font: inherit;
      color: var(--primary-text-color);
      text-align: left;
      cursor: pointer;
    }
    .postile.bar {
      min-width: 200px;
    }
    .postile.empty {
      background: none;
      border: 1.5px dashed var(--divider-color);
      box-shadow: none;
    }
    .postile.empty.actionable:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
    .postile.empty[disabled] {
      cursor: default;
      opacity: 0.75;
    }
    .badge {
      width: 40px;
      height: 40px;
      border-radius: 11px;
      display: grid;
      place-items: center;
      flex: none;
    }
    .badge svg {
      width: 23px;
      height: 23px;
    }
    .badge.empty-badge {
      border: 1.5px dashed var(--divider-color);
      color: var(--secondary-text-color);
      font-size: 12px;
      font-weight: 700;
      font-family: ui-monospace, monospace;
    }
    .pmeta {
      min-width: 0;
    }
    .pmeta b {
      display: block;
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .pmeta span {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .x {
      position: absolute;
      top: 6px;
      right: 8px;
      border: none;
      background: none;
      color: var(--secondary-text-color);
      font-size: 18px;
      line-height: 1;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 6px;
    }
    .x:hover {
      color: var(--error-color, #d32f2f);
      background: var(--secondary-background-color);
    }
    /* drag & drop + tactile feedback */
    .postile {
      transition: box-shadow 0.15s ease, transform 0.2s cubic-bezier(0.34, 1.4, 0.6, 1);
    }
    .postile.over {
      box-shadow: 0 0 0 3px var(--primary-color);
      border-color: var(--primary-color);
      transform: scale(1.04);
    }
    .postile.actionable:active {
      transform: scale(0.98);
    }
    .row.drag {
      cursor: grab;
    }
    .row.drag:active {
      cursor: grabbing;
    }
    .row.dragging {
      opacity: 0.4;
    }
    @media (prefers-reduced-motion: reduce) {
      .postile {
        transition: none;
      }
      .postile.over,
      .postile.actionable:active {
        transform: none;
      }
    }

    .paircards {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 8px;
    }
    .paircard {
      display: flex;
      align-items: center;
      gap: 16px;
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      padding: 13px 15px;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
      flex-wrap: wrap;
    }
    .pc-orbs {
      display: flex;
      align-items: center;
      gap: 10px;
      flex: none;
    }
    .pc-slot {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .pc-side {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.4px;
      color: var(--secondary-text-color);
    }
    .pc-div {
      color: var(--secondary-text-color);
      font-weight: 700;
    }
    .pc-meta {
      flex: 1;
      min-width: 0;
    }
    .pc-meta b {
      display: block;
      font-size: 15px;
      font-weight: 600;
    }
    .pc-meta span {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .pc-sub {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--chorus-sub);
      background: color-mix(in srgb, var(--chorus-sub) 15%, transparent);
      border-radius: 999px;
      padding: 5px 12px 5px 8px;
      flex: none;
    }
    .pc-sub-ic svg {
      width: 15px;
      height: 15px;
      display: block;
    }
    .pc-sep {
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--secondary-text-color);
      font: inherit;
      font-size: 12px;
      font-weight: 600;
      border-radius: 999px;
      padding: 5px 12px;
      cursor: pointer;
    }
    .pc-sep:hover {
      color: var(--error-color, #d32f2f);
      border-color: var(--error-color, #d32f2f);
    }

    .sec {
      font-size: 13px;
      font-weight: 700;
      margin: 22px 4px 10px;
    }
    .rows {
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 14px;
      overflow: hidden;
    }
    .row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 13px;
    }
    .row + .row {
      border-top: 1px solid var(--divider-color);
    }
    .rt {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      flex: none;
      display: grid;
      place-items: center;
      background: var(--secondary-background-color);
      color: var(--secondary-text-color);
    }
    .rt svg {
      width: 22px;
      height: 22px;
    }
    .rx {
      min-width: 0;
    }
    .rx b {
      display: block;
      font-size: 14px;
      font-weight: 600;
    }
    .rx span {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .empty {
      padding: 40px 8px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 15px;
    }

    .newpair {
      width: 100%;
      margin-top: 10px;
      border: 1.5px dashed var(--divider-color);
      background: none;
      color: var(--primary-color);
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      border-radius: 14px;
      padding: 12px;
      cursor: pointer;
    }
    .newpair:hover {
      border-color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    }

    /* ---- picker sheet ---- */
    .backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.32);
      display: grid;
      place-items: center;
      z-index: 50;
    }
    .sheet {
      background: var(--card-background-color, #fff);
      border-radius: 18px;
      box-shadow: 0 24px 70px -20px rgba(0, 0, 0, 0.5);
      width: 320px;
      max-width: 92vw;
      max-height: 80vh;
      overflow-y: auto;
      padding: 8px;
    }
    .sheet-h {
      text-align: center;
      font-size: 15px;
      font-weight: 700;
      padding: 12px 10px 8px;
    }
    .sheet-item {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      border: none;
      background: none;
      font: inherit;
      color: var(--primary-text-color);
      text-align: left;
      padding: 10px 12px;
      border-radius: 12px;
      cursor: pointer;
    }
    .sheet-item:hover {
      background: var(--secondary-background-color);
    }
    .sheet-empty {
      padding: 16px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 13px;
    }
    .sheet-cancel {
      width: 100%;
      border: none;
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      font: inherit;
      font-weight: 600;
      padding: 11px;
      border-radius: 12px;
      cursor: pointer;
      margin-top: 5px;
    }
    @media (max-width: 800px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .grid[data-detail="on"] .col-list {
        display: none;
      }
    }
  `,t([mt({attribute:!1})],ee.prototype,"hass",void 0),t([mt({attribute:!1})],ee.prototype,"graph",void 0),t([mt({type:Boolean})],ee.prototype,"narrow",void 0),t([gt()],ee.prototype,"_selected",void 0),t([gt()],ee.prototype,"_working",void 0),t([gt()],ee.prototype,"_dirty",void 0),t([gt()],ee.prototype,"_applying",void 0),t([gt()],ee.prototype,"_rows",void 0),t([gt()],ee.prototype,"_picker",void 0),t([gt()],ee.prototype,"_pairPick",void 0),t([gt()],ee.prototype,"_menu",void 0),ee=t([lt("chorus-editor")],ee);const re={home_theater:"Home theater",stereo_pair:"Stereo pair",standalone:"Standalone"},oe={CC:"Center",LF:"Front L",RF:"Front R",LR:"Rear L",RR:"Rear R",SW:"Sub"},se={CC:"var(--chorus-cc)",LF:"var(--chorus-front)",RF:"var(--chorus-front)",LR:"var(--chorus-rear)",RR:"var(--chorus-rear)",SW:"var(--chorus-sub)"},ie={home_theater:0,stereo_pair:1,standalone:2};let ae=class extends pt{constructor(){super(...arguments),this.narrow=!1,this._view="editor",this._loading=!0}firstUpdated(){this._load()}async _load(t=!1){this._loading=!0,this._error=void 0;try{this._graph=await this.hass.connection.sendMessagePromise({type:t?"chorus/refresh":"chorus/bond_graph"})}catch(t){this._error=t?.message||t?.code||"unknown error"}finally{this._loading=!1}}render(){return I`
      <div class="wrap">
        ${this._header()}
        ${"overview"===this._view?this._overview():this._editor()}
      </div>
    `}_header(){const t=this._graph?.units?.length??0;return I`
      <header>
        <span class="mark"><i></i></span>
        <h1>Chorus</h1>
        <span class="tag">Sonos speaker manager</span>
        <span class="spacer"></span>
        <div class="seg" role="tablist">
          <button
            class=${"editor"===this._view?"on":""}
            role="tab"
            aria-selected=${"editor"===this._view}
            @click=${()=>this._view="editor"}
          >
            Editor
          </button>
          <button
            class=${"overview"===this._view?"on":""}
            role="tab"
            aria-selected=${"overview"===this._view}
            @click=${()=>this._view="overview"}
          >
            Overview
          </button>
        </div>
        ${"overview"===this._view&&t?I`<span class="count">${t} unit${1===t?"":"s"}</span>`:V}
        <button class="refresh" @click=${()=>this._load()}>Refresh</button>
      </header>
    `}_editor(){return this._loading&&!this._graph?I`<div class="msg">Reading your speakers…</div>`:this._error?I`<div class="msg err">Couldn't load the speaker graph: ${this._error}</div>`:I`<chorus-editor
      .hass=${this.hass}
      .graph=${this._graph}
      .narrow=${this.narrow}
      @chorus-graph=${t=>{this._graph=t.detail,this._loading=!1}}
      @chorus-refresh=${()=>this._load(!0)}
    ></chorus-editor>`}_overview(){if(this._loading&&!this._graph)return I`<div class="msg">Reading your speakers…</div>`;if(this._error)return I`<div class="msg err">Couldn't load the speaker graph: ${this._error}</div>`;const t=this._graph?.units??[];if(!t.length)return I`<div class="msg">No Sonos speakers discovered yet.</div>`;const e=[...t].sort((t,e)=>(ie[t.kind]??9)-(ie[e.kind]??9)||(t.name??"").localeCompare(e.name??""));return I`<div class="grid">${e.map(t=>this._card(t))}</div>`}_card(t){return I`
      <div class="card">
        <h2>
          ${t.name||t.primary_uid}
          <span class="kind">${re[t.kind]??t.kind}</span>
        </h2>
        <div class="members">${t.members.map(t=>this._member(t))}</div>
      </div>
    `}_member(t){const e=t.channel?oe[t.channel]??t.channel:"Speaker",r=t.channel?se[t.channel]??"var(--chorus-cc)":"",o=[t.model,t.ip].filter(Boolean).join(" · ");return I`
      <div class="member">
        <span
          class="chip ${t.channel?"":"solo"}"
          style=${r?`background:${r}`:V}
          >${e}</span
        >
        <span class="m-main">
          <span class="m-name">${t.name||t.uid}</span>
          ${o?I`<span class="m-sub">${o}</span>`:V}
        </span>
        ${t.invisible?I`<span class="inv">bonded</span>`:V}
      </div>
    `}};ae.styles=a`
    :host {
      display: block;
      color: var(--primary-text-color);
      --chorus-front: #2f6fed;
      --chorus-rear: #129d9d;
      --chorus-sub: #6a4bd8;
      --chorus-cc: #8a8f98;
    }
    .wrap {
      max-width: 1000px;
      margin: 0 auto;
      padding: 16px 16px 48px;
    }
    header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin: 8px 4px 20px;
      flex-wrap: wrap;
    }
    .mark {
      width: 26px;
      height: 26px;
      border-radius: 7px;
      background: var(--primary-text-color);
      display: grid;
      place-items: center;
      flex: none;
    }
    .mark i {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 2.4px solid var(--card-background-color, #fff);
    }
    h1 {
      font-size: 22px;
      font-weight: 600;
      margin: 0;
      letter-spacing: 0.2px;
    }
    .tag {
      color: var(--secondary-text-color);
      font-size: 13px;
    }
    .spacer {
      flex: 1 1 auto;
    }
    .seg {
      display: inline-flex;
      background: var(--secondary-background-color);
      border-radius: 999px;
      padding: 3px;
      gap: 2px;
    }
    .seg button {
      border: none;
      background: none;
      color: var(--secondary-text-color);
      font: inherit;
      font-size: 13px;
      font-weight: 600;
      padding: 5px 14px;
      border-radius: 999px;
      cursor: pointer;
    }
    .seg button.on {
      background: var(--card-background-color, #fff);
      color: var(--primary-color);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
    }
    .count {
      color: var(--secondary-text-color);
      font-size: 13px;
    }
    button.refresh {
      border: 1px solid var(--divider-color);
      background: var(--card-background-color);
      color: var(--primary-text-color);
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 13px;
      cursor: pointer;
    }
    button.refresh:hover {
      background: var(--secondary-background-color);
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 14px;
    }
    .card {
      background: var(--card-background-color, var(--ha-card-background));
      border-radius: 12px;
      border: 1px solid var(--divider-color);
      padding: 14px 16px;
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.08));
    }
    .card h2 {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .kind {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--secondary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: 10px;
      padding: 1px 7px;
      font-weight: 600;
    }
    .members {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .member {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .chip {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.3px;
      color: #fff;
      border-radius: 6px;
      padding: 2px 7px;
      min-width: 52px;
      text-align: center;
      flex: none;
    }
    .chip.solo {
      background: var(--secondary-text-color);
    }
    .m-main {
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    .m-name {
      font-size: 14px;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .m-sub {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .inv {
      font-size: 11px;
      color: var(--secondary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: 8px;
      padding: 0 6px;
      margin-left: auto;
    }
    .msg {
      padding: 40px 8px;
      text-align: center;
      color: var(--secondary-text-color);
      font-size: 15px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .msg.err {
      color: var(--error-color, #d32f2f);
    }
    .msg b {
      color: var(--primary-text-color);
      font-size: 17px;
    }
    .link {
      border: none;
      background: none;
      color: var(--primary-color);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      padding: 0;
    }
  `,t([mt({attribute:!1})],ae.prototype,"hass",void 0),t([mt({attribute:!1})],ae.prototype,"narrow",void 0),t([gt()],ae.prototype,"_view",void 0),t([gt()],ae.prototype,"_graph",void 0),t([gt()],ae.prototype,"_error",void 0),t([gt()],ae.prototype,"_loading",void 0),ae=t([lt("chorus-panel")],ae);export{ae as ChorusPanel};
