function e(e,t,r,o){var i,s=arguments.length,a=s<3?t:null===o?o=Object.getOwnPropertyDescriptor(t,r):o;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)a=Reflect.decorate(e,t,r,o);else for(var n=e.length-1;n>=0;n--)(i=e[n])&&(a=(s<3?i(a):s>3?i(t,r,a):i(t,r))||a);return s>3&&a&&Object.defineProperty(t,r,a),a}"function"==typeof SuppressedError&&SuppressedError;const t=globalThis,r=t.ShadowRoot&&(void 0===t.ShadyCSS||t.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,o=Symbol(),i=new WeakMap;let s=class{constructor(e,t,r){if(this._$cssResult$=!0,r!==o)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o;const t=this.t;if(r&&void 0===e){const r=void 0!==t&&1===t.length;r&&(e=i.get(t)),void 0===e&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),r&&i.set(t,e))}return e}toString(){return this.cssText}};const a=(e,...t)=>{const r=1===e.length?e[0]:t.reduce((t,r,o)=>t+(e=>{if(!0===e._$cssResult$)return e.cssText;if("number"==typeof e)return e;throw Error("Value passed to 'css' function must be a 'css' function result: "+e+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+e[o+1],e[0]);return new s(r,e,o)},n=r?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t="";for(const r of e.cssRules)t+=r.cssText;return(e=>new s("string"==typeof e?e:e+"",void 0,o))(t)})(e):e,{is:c,defineProperty:l,getOwnPropertyDescriptor:d,getOwnPropertyNames:p,getOwnPropertySymbols:h,getPrototypeOf:u}=Object,g=globalThis,m=g.trustedTypes,b=m?m.emptyScript:"",v=g.reactiveElementPolyfillSupport,f=(e,t)=>e,x={toAttribute(e,t){switch(t){case Boolean:e=e?b:null;break;case Object:case Array:e=null==e?e:JSON.stringify(e)}return e},fromAttribute(e,t){let r=e;switch(t){case Boolean:r=null!==e;break;case Number:r=null===e?null:Number(e);break;case Object:case Array:try{r=JSON.parse(e)}catch(e){r=null}}return r}},y=(e,t)=>!c(e,t),_={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol("metadata"),g.litPropertyMetadata??=new WeakMap;let $=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=_){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){const r=Symbol(),o=this.getPropertyDescriptor(e,r,t);void 0!==o&&l(this.prototype,e,o)}}static getPropertyDescriptor(e,t,r){const{get:o,set:i}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:o,set(t){const s=o?.call(this);i?.call(this,t),this.requestUpdate(e,s,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??_}static _$Ei(){if(this.hasOwnProperty(f("elementProperties")))return;const e=u(this);e.finalize(),void 0!==e.l&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(f("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(f("properties"))){const e=this.properties,t=[...p(e),...h(e)];for(const r of t)this.createProperty(r,e[r])}const e=this[Symbol.metadata];if(null!==e){const t=litPropertyMetadata.get(e);if(void 0!==t)for(const[e,r]of t)this.elementProperties.set(e,r)}this._$Eh=new Map;for(const[e,t]of this.elementProperties){const r=this._$Eu(e,t);void 0!==r&&this._$Eh.set(r,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){const t=[];if(Array.isArray(e)){const r=new Set(e.flat(1/0).reverse());for(const e of r)t.unshift(n(e))}else void 0!==e&&t.push(n(e));return t}static _$Eu(e,t){const r=t.attribute;return!1===r?void 0:"string"==typeof r?r:"string"==typeof e?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),void 0!==this.renderRoot&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){const e=new Map,t=this.constructor.elementProperties;for(const r of t.keys())this.hasOwnProperty(r)&&(e.set(r,this[r]),delete this[r]);e.size>0&&(this._$Ep=e)}createRenderRoot(){const e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((e,o)=>{if(r)e.adoptedStyleSheets=o.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(const r of o){const o=document.createElement("style"),i=t.litNonce;void 0!==i&&o.setAttribute("nonce",i),o.textContent=r.cssText,e.appendChild(o)}})(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,r){this._$AK(e,r)}_$ET(e,t){const r=this.constructor.elementProperties.get(e),o=this.constructor._$Eu(e,r);if(void 0!==o&&!0===r.reflect){const i=(void 0!==r.converter?.toAttribute?r.converter:x).toAttribute(t,r.type);this._$Em=e,null==i?this.removeAttribute(o):this.setAttribute(o,i),this._$Em=null}}_$AK(e,t){const r=this.constructor,o=r._$Eh.get(e);if(void 0!==o&&this._$Em!==o){const e=r.getPropertyOptions(o),i="function"==typeof e.converter?{fromAttribute:e.converter}:void 0!==e.converter?.fromAttribute?e.converter:x;this._$Em=o;const s=i.fromAttribute(t,e.type);this[o]=s??this._$Ej?.get(o)??s,this._$Em=null}}requestUpdate(e,t,r,o=!1,i){if(void 0!==e){const s=this.constructor;if(!1===o&&(i=this[e]),r??=s.getPropertyOptions(e),!((r.hasChanged??y)(i,t)||r.useDefault&&r.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(s._$Eu(e,r))))return;this.C(e,t,r)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:r,reflect:o,wrapped:i},s){r&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,s??t??this[e]),!0!==i||void 0!==s)||(this._$AL.has(e)||(this.hasUpdated||r||(t=void 0),this._$AL.set(e,t)),!0===o&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}const e=this.scheduleUpdate();return null!=e&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}const e=this.constructor.elementProperties;if(e.size>0)for(const[t,r]of e){const{wrapped:e}=r,o=this[t];!0!==e||this._$AL.has(t)||void 0===o||this.C(t,void 0,r,o)}}let e=!1;const t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};$.elementStyles=[],$.shadowRootOptions={mode:"open"},$[f("elementProperties")]=new Map,$[f("finalized")]=new Map,v?.({ReactiveElement:$}),(g.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,k=e=>e,S=w.trustedTypes,z=S?S.createPolicy("lit-html",{createHTML:e=>e}):void 0,A="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,M="?"+C,E=`<${M}>`,R=document,P=()=>R.createComment(""),L=e=>null===e||"object"!=typeof e&&"function"!=typeof e,O=Array.isArray,T="[ \t\n\f\r]",U=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,D=/>/g,H=RegExp(`>|${T}(?:([^\\s"'>=/]+)(${T}*=${T}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,F=/"/g,B=/^(?:script|style|textarea|title)$/i,I=e=>(t,...r)=>({_$litType$:e,strings:t,values:r}),W=I(1),K=I(2),V=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),Q=new WeakMap,Y=R.createTreeWalker(R,129);function G(e,t){if(!O(e)||!e.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==z?z.createHTML(t):t}const Z=(e,t)=>{const r=e.length-1,o=[];let i,s=2===t?"<svg>":3===t?"<math>":"",a=U;for(let t=0;t<r;t++){const r=e[t];let n,c,l=-1,d=0;for(;d<r.length&&(a.lastIndex=d,c=a.exec(r),null!==c);)d=a.lastIndex,a===U?"!--"===c[1]?a=N:void 0!==c[1]?a=D:void 0!==c[2]?(B.test(c[2])&&(i=RegExp("</"+c[2],"g")),a=H):void 0!==c[3]&&(a=H):a===H?">"===c[0]?(a=i??U,l=-1):void 0===c[1]?l=-2:(l=a.lastIndex-c[2].length,n=c[1],a=void 0===c[3]?H:'"'===c[3]?F:j):a===F||a===j?a=H:a===N||a===D?a=U:(a=H,i=void 0);const p=a===H&&e[t+1].startsWith("/>")?" ":"";s+=a===U?r+E:l>=0?(o.push(n),r.slice(0,l)+A+r.slice(l)+C+p):r+C+(-2===l?t:p)}return[G(e,s+(e[r]||"<?>")+(2===t?"</svg>":3===t?"</math>":"")),o]};class X{constructor({strings:e,_$litType$:t},r){let o;this.parts=[];let i=0,s=0;const a=e.length-1,n=this.parts,[c,l]=Z(e,t);if(this.el=X.createElement(c,r),Y.currentNode=this.el.content,2===t||3===t){const e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;null!==(o=Y.nextNode())&&n.length<a;){if(1===o.nodeType){if(o.hasAttributes())for(const e of o.getAttributeNames())if(e.endsWith(A)){const t=l[s++],r=o.getAttribute(e).split(C),a=/([.?@])?(.*)/.exec(t);n.push({type:1,index:i,name:a[2],strings:r,ctor:"."===a[1]?oe:"?"===a[1]?ie:"@"===a[1]?se:re}),o.removeAttribute(e)}else e.startsWith(C)&&(n.push({type:6,index:i}),o.removeAttribute(e));if(B.test(o.tagName)){const e=o.textContent.split(C),t=e.length-1;if(t>0){o.textContent=S?S.emptyScript:"";for(let r=0;r<t;r++)o.append(e[r],P()),Y.nextNode(),n.push({type:2,index:++i});o.append(e[t],P())}}}else if(8===o.nodeType)if(o.data===M)n.push({type:2,index:i});else{let e=-1;for(;-1!==(e=o.data.indexOf(C,e+1));)n.push({type:7,index:i}),e+=C.length-1}i++}}static createElement(e,t){const r=R.createElement("template");return r.innerHTML=e,r}}function J(e,t,r=e,o){if(t===V)return t;let i=void 0!==o?r._$Co?.[o]:r._$Cl;const s=L(t)?void 0:t._$litDirective$;return i?.constructor!==s&&(i?._$AO?.(!1),void 0===s?i=void 0:(i=new s(e),i._$AT(e,r,o)),void 0!==o?(r._$Co??=[])[o]=i:r._$Cl=i),void 0!==i&&(t=J(e,i._$AS(e,t.values),i,o)),t}class ee{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){const{el:{content:t},parts:r}=this._$AD,o=(e?.creationScope??R).importNode(t,!0);Y.currentNode=o;let i=Y.nextNode(),s=0,a=0,n=r[0];for(;void 0!==n;){if(s===n.index){let t;2===n.type?t=new te(i,i.nextSibling,this,e):1===n.type?t=new n.ctor(i,n.name,n.strings,this,e):6===n.type&&(t=new ae(i,this,e)),this._$AV.push(t),n=r[++a]}s!==n?.index&&(i=Y.nextNode(),s++)}return Y.currentNode=R,o}p(e){let t=0;for(const r of this._$AV)void 0!==r&&(void 0!==r.strings?(r._$AI(e,r,t),t+=r.strings.length-2):r._$AI(e[t])),t++}}class te{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,r,o){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=r,this.options=o,this._$Cv=o?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode;const t=this._$AM;return void 0!==t&&11===e?.nodeType&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=J(this,e,t),L(e)?e===q||null==e||""===e?(this._$AH!==q&&this._$AR(),this._$AH=q):e!==this._$AH&&e!==V&&this._(e):void 0!==e._$litType$?this.$(e):void 0!==e.nodeType?this.T(e):(e=>O(e)||"function"==typeof e?.[Symbol.iterator])(e)?this.k(e):this._(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==q&&L(this._$AH)?this._$AA.nextSibling.data=e:this.T(R.createTextNode(e)),this._$AH=e}$(e){const{values:t,_$litType$:r}=e,o="number"==typeof r?this._$AC(e):(void 0===r.el&&(r.el=X.createElement(G(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===o)this._$AH.p(t);else{const e=new ee(o,this),r=e.u(this.options);e.p(t),this.T(r),this._$AH=e}}_$AC(e){let t=Q.get(e.strings);return void 0===t&&Q.set(e.strings,t=new X(e)),t}k(e){O(this._$AH)||(this._$AH=[],this._$AR());const t=this._$AH;let r,o=0;for(const i of e)o===t.length?t.push(r=new te(this.O(P()),this.O(P()),this,this.options)):r=t[o],r._$AI(i),o++;o<t.length&&(this._$AR(r&&r._$AB.nextSibling,o),t.length=o)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){const t=k(e).nextSibling;k(e).remove(),e=t}}setConnected(e){void 0===this._$AM&&(this._$Cv=e,this._$AP?.(e))}}class re{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,r,o,i){this.type=1,this._$AH=q,this._$AN=void 0,this.element=e,this.name=t,this._$AM=o,this.options=i,r.length>2||""!==r[0]||""!==r[1]?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=q}_$AI(e,t=this,r,o){const i=this.strings;let s=!1;if(void 0===i)e=J(this,e,t,0),s=!L(e)||e!==this._$AH&&e!==V,s&&(this._$AH=e);else{const o=e;let a,n;for(e=i[0],a=0;a<i.length-1;a++)n=J(this,o[r+a],t,a),n===V&&(n=this._$AH[a]),s||=!L(n)||n!==this._$AH[a],n===q?e=q:e!==q&&(e+=(n??"")+i[a+1]),this._$AH[a]=n}s&&!o&&this.j(e)}j(e){e===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??"")}}class oe extends re{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===q?void 0:e}}class ie extends re{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==q)}}class se extends re{constructor(e,t,r,o,i){super(e,t,r,o,i),this.type=5}_$AI(e,t=this){if((e=J(this,e,t,0)??q)===V)return;const r=this._$AH,o=e===q&&r!==q||e.capture!==r.capture||e.once!==r.once||e.passive!==r.passive,i=e!==q&&(r===q||o);o&&this.element.removeEventListener(this.name,this,r),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}}class ae{constructor(e,t,r){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(e){J(this,e)}}const ne=w.litHtmlPolyfillSupport;ne?.(X,te),(w.litHtmlVersions??=[]).push("3.3.3");const ce=globalThis;class le extends ${constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){const t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=((e,t,r)=>{const o=r?.renderBefore??t;let i=o._$litPart$;if(void 0===i){const e=r?.renderBefore??null;o._$litPart$=i=new te(t.insertBefore(P(),e),e,void 0,r??{})}return i._$AI(e),i})(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return V}}le._$litElement$=!0,le.finalized=!0,ce.litElementHydrateSupport?.({LitElement:le});const de=ce.litElementPolyfillSupport;de?.({LitElement:le}),(ce.litElementVersions??=[]).push("4.2.2");const pe=e=>(t,r)=>{void 0!==r?r.addInitializer(()=>{customElements.define(e,t)}):customElements.define(e,t)},he={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:y},ue=(e=he,t,r)=>{const{kind:o,metadata:i}=r;let s=globalThis.litPropertyMetadata.get(i);if(void 0===s&&globalThis.litPropertyMetadata.set(i,s=new Map),"setter"===o&&((e=Object.create(e)).wrapped=!0),s.set(r.name,e),"accessor"===o){const{name:o}=r;return{set(r){const i=t.get.call(this);t.set.call(this,r),this.requestUpdate(o,i,e,!0,r)},init(t){return void 0!==t&&this.C(o,void 0,e,t),t}}}if("setter"===o){const{name:o}=r;return function(r){const i=this[o];t.call(this,r),this.requestUpdate(o,i,e,!0,r)}}throw Error("Unsupported decorator location: "+o)};function ge(e){return(t,r)=>"object"==typeof r?ue(e,t,r):((e,t,r)=>{const o=t.hasOwnProperty(r);return t.constructor.createProperty(r,e),o?Object.getOwnPropertyDescriptor(t,r):void 0})(e,t,r)}function me(e){return ge({...e,state:!0,attribute:!1})}const be=["LF","RF","LR","RR","SW"],ve={LF:"Front L",RF:"Front R",LR:"Rear L",RR:"Rear R",SW:"Sub"},fe=[{re:/arc/,caps:{icon:"soundbar",primary:!0}},{re:/beam|ray|playbar|playbase/,caps:{icon:"soundbar",primary:!0}},{re:/sub/,caps:{icon:"sub",sub:!0}},{re:/era 300/,caps:{icon:"era",surround:!0,pair:!0,height:!0}},{re:/era/,caps:{icon:"era",surround:!0,pair:!0}},{re:/lamp/,caps:{icon:"lamp",surround:!0,pair:!0}},{re:/frame|picture/,caps:{icon:"frame",surround:!0,pair:!0}},{re:/bookshelf/,caps:{icon:"book",surround:!0,pair:!0}},{re:/connect|port|amp/,caps:{icon:"connect"}},{re:/move|roam/,caps:{icon:"driver"}}],xe={icon:"driver",surround:!0,pair:!0};function ye(e){const t=(e||"").toLowerCase();for(const e of fe)if(e.re.test(t))return e.caps;return xe}const _e=e=>!!ye(e).sub,$e=e=>!!ye(e).pair;function we(e,t){return"SW"===e?_e(t):(e=>!!ye(e).surround)(t)}function ke(e){return{uid:e.uid,name:e.name||e.uid,model:e.model||"",ip:e.ip}}function Se(e){const t=e.members.find(e=>e.is_primary)??e.members[0];return t?.area??null}function ze(e){const t={LF:null,RF:null,LR:null,RR:null,SW:null};let r;for(const o of e.members)"CC"===o.channel?r=ke(o):o.channel&&be.includes(o.channel)&&(t[o.channel]=ke(o));return{bar:r??ke(e.members[0]),slots:t}}function Ae(e){const t=e.members.find(e=>"LF"===e.channel)??e.members[0],r=e.members.find(e=>"RF"===e.channel)??e.members[1],o=e.members.find(e=>"SW"===e.channel)??null;return{L:t?ke(t):null,R:r?ke(r):null,sub:o?ke(o):null}}const Ce=(e,t)=>e.name.localeCompare(t.name,void 0,{numeric:!0});function Me(e){const t=e?.units??[],r=new Map,o=[];for(const e of t){const t=Se(e),i=t??e.name;let s=r.get(i);if(s||(s={key:i,name:t??e.name,area:t,ht:null,pairs:[],tray:[]},r.set(i,s),o.push(i)),"home_theater"===e.kind)s.ht||(s.ht=ze(e));else if("stereo_pair"===e.kind)s.pairs.push(Ae(e));else for(const t of e.members)s.tray.push(ke(t))}const i=o.map(e=>r.get(e));for(const e of i)e.tray.sort(Ce);return i.sort(Ce)}const Ee=e=>K`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${e}</svg>`,Re={soundbar:Ee(K`<rect x="2.8" y="9" width="18.4" height="6" rx="1.5"/><line x1="8" y1="10.7" x2="8" y2="13.3"/><line x1="12" y1="10.7" x2="12" y2="13.3"/><line x1="16" y1="10.7" x2="16" y2="13.3"/>`),sub:Ee(K`<rect x="5.5" y="4" width="13" height="16" rx="4"/><circle cx="12" cy="12" r="3.4"/>`),era:Ee(K`<path d="M4.4 9.4 Q4.4 7 6.8 7 L17.2 7 Q19.6 7 19.6 9.4 L19.6 14.6 Q19.6 17 17.2 17 L6.8 17 Q4.4 17 4.4 14.6 Z"/><circle cx="12" cy="12" r="2.3"/><circle cx="12" cy="4.7" r="1"/>`),book:Ee(K`<rect x="7" y="3.5" width="10" height="17" rx="2.5"/><circle cx="12" cy="14" r="2.6"/><circle cx="12" cy="7" r="1"/>`),lamp:Ee(K`<path d="M8 9 L16 9 L14.4 4.5 L9.6 4.5 Z"/><line x1="12" y1="9" x2="12" y2="18"/><line x1="8.5" y1="18" x2="15.5" y2="18"/>`),frame:Ee(K`<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><rect x="6.6" y="8.6" width="10.8" height="6.8" rx="1"/>`),connect:Ee(K`<rect x="3.5" y="8" width="17" height="8" rx="2.5"/><circle cx="17" cy="12" r="1.1" fill="currentColor" stroke="none"/>`),driver:Ee(K`<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2.4"/>`)};function Pe(e){return Re[ye(e).icon]??Re.driver}function Le(e){return(e||"").replace("Sonos ","").replace("Symfonisk ","")}const Oe=K`<svg viewBox="0 0 17920 5760"><g class="ink"><path d="M933 5610 c-24 -14 -35 -31 -44 -65 l-11 -45 -47 0 c-58 0 -138 -37 -174 -79 -34 -40 -111 -201 -232 -481 -107 -250 -140 -340 -154 -430 -15 -90 -15 -4150 -1 -4202 14 -48 53 -94 101 -118 37 -20 69 -20 1436 -20 769 0 1403 -4 1409 -8 6 -4 13 -26 17 -49 3 -23 15 -58 27 -78 l22 -35 5458 0 5458 0 21 33 c11 18 23 52 27 75 4 26 14 47 25 53 12 6 609 9 1709 9 l1691 -1 42 23 c31 17 49 37 70 78 l27 54 -2 2091 -3 2090 -38 105 c-69 188 -315 689 -386 787 -46 63 -108 95 -196 101 l-73 4 -11 37 c-18 62 -51 85 -130 89 -103 6 -146 -23 -161 -108 l-5 -35 -7771 -3 -7770 -2 -49 56 c-68 80 -96 94 -180 94 -52 0 -78 -5 -102 -20z"></path><path d="M15095 4081 c-89 -26 -131 -46 -200 -96 -198 -141 -298 -391 -254 -630 6 -33 19 -76 30 -96 10 -20 23 -68 29 -105 16 -107 85 -238 167 -319 78 -77 190 -137 298 -160 144 -30 345 -12 447 41 29 15 26 9 -28 -49 -66 -70 -106 -142 -129 -228 -17 -63 -19 -234 -4 -299 18 -80 70 -172 134 -236 105 -106 206 -144 385 -144 180 0 282 38 385 144 90 93 145 222 145 340 0 44 4 53 34 81 21 19 39 48 46 75 9 34 26 58 76 103 122 112 178 280 155 465 -23 181 -107 303 -256 373 -173 82 -417 50 -548 -70 l-44 -41 -6 163 c-10 269 -60 401 -202 535 -133 126 -260 172 -470 171 -93 0 -147 -5 -190 -18z"></path></g><g class="paper"><path d="M0 2880 l0 -2880 1676 0 1677 0 -26 20 c-32 25 -67 97 -67 137 0 19 -6 33 -16 37 -9 3 -643 6 -1410 6 -1365 0 -1396 0 -1433 20 -48 24 -87 70 -101 118 -14 52 -14 4052 1 4142 14 90 47 180 154 430 121 280 198 441 232 481 36 42 116 79 174 79 l47 0 11 45 c14 55 55 85 116 85 51 0 90 -24 150 -94 l49 -56 7800 2 7801 3 5 35 c9 50 26 78 62 96 66 34 147 -2 169 -77 l11 -37 73 -4 c88 -6 150 -38 196 -101 71 -98 317 -599 386 -787 l38 -105 3 -2060 2 -2061 -27 -54 c-21 -41 -39 -61 -70 -78 l-41 -23 -1692 1 c-1092 0 -1697 -3 -1709 -10 -12 -6 -21 -26 -25 -55 -5 -28 -20 -62 -42 -90 l-34 -45 1890 0 1890 0 0 2880 0 2880 -8960 0 -8960 0 0 -2880z"></path><path d="M781 5314 c-19 -16 -51 -67 -81 -131 -73 -153 -230 -520 -230 -538 0 -13 11 -15 61 -13 l61 3 47 120 c45 112 123 288 220 498 l40 87 -44 0 c-32 0 -51 -7 -74 -26z"></path><path d="M17253 5099 c67 -134 142 -295 167 -356 l45 -113 63 0 c37 0 62 4 62 11 0 43 -296 622 -340 664 -20 19 -43 29 -74 32 l-46 6 123 -244z"></path><path d="M1008 5297 c-43 -64 -81 -157 -89 -215 -11 -73 -17 -85 -59 -102 -42 -18 -65 -90 -49 -155 l12 -47 21 43 c13 25 35 49 56 60 33 18 81 19 1070 19 802 0 1040 -3 1059 -13 65 -33 91 -137 53 -215 -11 -22 -17 -43 -14 -46 7 -8 66 -8 86 0 12 5 16 20 16 61 0 51 3 59 38 93 21 21 55 43 77 49 28 8 378 11 1178 11 l1137 0 0 30 0 30 -1140 0 -1140 0 -30 28 c-57 50 -50 163 12 199 24 15 78 95 78 118 0 3 -18 5 -40 5 -39 0 -42 -2 -85 -69 -24 -39 -58 -98 -75 -132 -17 -34 -42 -72 -55 -85 l-24 -24 -1041 0 c-1158 0 -1087 -4 -1117 67 -18 44 -11 88 24 158 33 67 68 103 128 131 l50 24 -61 0 c-53 0 -64 -3 -76 -23z"></path><path d="M16939 5294 c120 -60 193 -244 127 -321 l-24 -28 -1043 -3 c-743 -2 -1046 -5 -1056 -13 -27 -23 -258 -28 -1350 -28 l-1123 -1 0 -30 0 -30 1143 -2 c1099 -3 1143 -4 1173 -22 44 -27 67 -71 70 -135 l2 -56 63 -3 c60 -3 61 -3 54 20 -4 13 -9 51 -12 86 -6 73 7 112 49 147 l30 25 1044 0 c1127 0 1071 3 1120 -52 39 -43 57 -89 57 -155 l1 -63 38 0 c21 0 38 4 38 9 0 46 -242 546 -310 639 -29 41 -32 42 -87 42 l-57 0 53 -26z"></path><path d="M14666 5253 c-13 -13 -4 -91 18 -148 27 -71 52 -87 127 -83 l52 3 -74 109 c-66 98 -106 136 -123 119z"></path><path d="M1145 5231 c-48 -29 -68 -67 -69 -134 -1 -47 3 -61 18 -73 17 -12 166 -14 988 -14 933 0 969 1 984 19 9 10 41 64 71 120 l54 101 -1008 0 c-964 0 -1009 -1 -1038 -19z"></path><path d="M3470 5230 c0 -20 7 -20 1020 -20 1013 0 1020 0 1020 20 0 20 -7 20 -1020 20 -1013 0 -1020 0 -1020 -20z"></path><path d="M6010 5230 c0 -20 7 -20 2990 -20 2983 0 2990 0 2990 20 0 20 -7 20 -2990 20 -2983 0 -2990 0 -2990 -20z"></path><path d="M12382 5233 c3 -17 64 -18 1091 -21 1082 -2 1087 -2 1087 18 0 20 -6 20 -1091 20 -1033 0 -1090 -1 -1087 -17z"></path><path d="M14834 5233 c10 -24 106 -185 124 -205 14 -17 73 -18 971 -18 755 0 961 3 981 13 23 12 25 18 25 81 0 66 -1 68 -42 107 l-42 39 -1012 0 c-939 0 -1011 -1 -1005 -17z"></path><path d="M3435 5097 c-7 -18 -15 -51 -17 -73 l-3 -39 1125 0 1125 0 3 56 c5 98 121 89 -1124 89 l-1095 0 -14 -33z"></path><path d="M5993 5120 c-35 -14 -43 -42 -43 -144 0 -84 2 -97 19 -106 14 -7 977 -10 3039 -10 2976 0 3019 0 3036 19 15 17 17 35 15 110 -4 78 -7 94 -27 113 l-23 23 -2997 2 c-1715 1 -3006 -2 -3019 -7z"></path><path d="M12394 5118 c-9 -15 -8 -113 1 -128 4 -7 364 -10 1111 -10 1081 0 1104 0 1104 19 0 26 -38 114 -53 123 -7 4 -494 8 -1084 8 -837 0 -1073 -3 -1079 -12z"></path><path d="M994 4823 c-12 -2 -29 -12 -39 -23 -18 -20 -43 -145 -31 -157 4 -4 455 -10 1001 -11 l994 -4 24 24 c32 32 45 110 23 142 -8 13 -29 26 -47 30 -34 7 -1890 6 -1925 -1z"></path><path d="M15103 4820 c-12 -5 -25 -21 -29 -35 -8 -34 3 -104 22 -132 l14 -23 999 0 c881 0 1000 2 1011 15 20 24 7 133 -19 159 l-22 21 -977 2 c-562 1 -986 -2 -999 -7z"></path><path d="M5955 4760 c-12 -14 -20 -41 -23 -80 l-4 -60 3096 0 3096 0 0 54 c0 48 -3 57 -31 80 l-31 26 -3042 0 -3043 0 -18 -20z"></path><path d="M3485 4761 c-82 -3 -155 -10 -162 -14 -12 -7 -33 -68 -33 -94 0 -10 239 -13 1160 -13 l1160 0 0 59 0 58 -162 6 c-208 7 -1765 5 -1963 -2z"></path><path d="M12472 4698 l3 -63 475 -8 c261 -5 769 -5 1128 -2 l652 7 -6 37 c-8 41 -22 73 -38 83 -6 4 -507 8 -1114 8 l-1103 0 3 -62z"></path><path d="M737 4710 c-33 -78 -33 -80 13 -80 46 0 45 -4 15 80 l-13 35 -15 -35z"></path><path d="M8831 4502 c-7784 -2 -8386 -3 -8403 -19 -17 -15 -18 -93 -18 -2055 0 -2244 -5 -2084 61 -2107 23 -8 426 -11 1405 -11 l1372 0 7 31 c4 17 3 35 -2 40 -5 5 -593 10 -1353 11 -1292 3 -1346 4 -1372 22 -16 10 -32 34 -38 55 -8 25 -10 637 -8 1966 3 1825 4 1931 21 1956 9 14 29 31 43 37 36 17 16932 17 16968 0 14 -6 34 -23 43 -37 17 -25 18 -130 21 -1936 2 -1050 0 -1929 -3 -1953 -4 -27 -17 -55 -35 -75 l-28 -32 -1637 -3 -1636 -2 3 -38 3 -37 1655 -3 c1133 -2 1666 0 1691 8 75 21 69 -142 69 1832 0 975 0 1891 0 2035 0 260 0 262 -24 289 l-23 28 -199 0 c-109 1 -3972 0 -8583 -2z"></path><path d="M599 4333 c-12 -13 -14 -185 -17 -1007 -1 -545 0 -998 4 -1006 3 -10 20 13 47 65 56 107 100 165 194 256 383 370 963 407 1393 89 227 -169 372 -408 411 -679 15 -105 6 -338 -16 -441 -34 -153 -107 -348 -220 -588 -105 -221 -251 -368 -474 -479 l-106 -53 738 0 737 0 10 23 c5 12 50 266 100 565 50 299 98 565 106 592 18 61 56 107 109 131 38 18 100 19 1331 19 l1291 0 19 21 c17 19 19 43 24 273 3 170 9 258 17 272 18 31 80 83 106 89 12 3 1075 4 2363 3 l2341 -3 36 -28 c69 -53 72 -63 75 -342 3 -211 6 -253 19 -267 15 -17 87 -18 1285 -18 1122 0 1273 -2 1306 -15 46 -20 79 -50 102 -96 11 -21 62 -264 126 -605 59 -313 110 -579 115 -591 l9 -23 1639 0 c1611 0 1640 0 1651 19 7 13 10 625 10 1908 0 1693 -2 1891 -16 1911 l-15 22 -8418 0 c-7818 0 -8420 -1 -8432 -17z"></path><path d="M15174 3911 c-115 -19 -195 -61 -269 -143 -42 -46 -113 -173 -104 -183 3 -2 26 25 51 60 157 217 470 296 727 185 l46 -20 -25 20 c-28 23 -111 56 -173 69 -65 15 -197 20 -253 12z"></path><path d="M15189 3762 c-90 -30 -157 -72 -217 -137 -97 -103 -142 -214 -142 -345 0 -187 103 -351 271 -434 273 -133 586 -8 695 279 26 69 27 237 1 315 -43 130 -167 261 -294 311 -81 31 -235 37 -314 11z"></path><path d="M16218 3233 c-192 -72 -281 -290 -195 -477 27 -59 118 -158 170 -185 25 -13 29 -13 55 11 40 38 65 48 117 48 49 0 77 -10 111 -41 20 -19 21 -19 62 11 59 42 99 102 124 183 52 174 -23 355 -183 438 -60 31 -194 37 -261 12z"></path><path d="M15800 2652 c-110 -55 -196 -172 -219 -299 -32 -172 65 -356 227 -431 72 -34 193 -42 274 -18 70 20 153 79 200 141 41 54 78 155 78 214 0 35 -2 37 -43 48 -35 10 -71 41 -224 192 -204 203 -198 200 -293 153z"></path><path d="M16322 2498 c-21 -21 -14 -66 12 -83 19 -13 28 -13 50 -4 33 16 42 44 22 74 -18 27 -63 34 -84 13z"></path><path d="M2340 3411 c-126 -39 -220 -156 -220 -276 0 -155 114 -272 276 -283 62 -4 79 -1 133 23 155 70 215 234 140 383 -17 34 -47 75 -67 92 -70 57 -185 84 -262 61z"></path><path d="M1391 2825 c-444 -100 -751 -452 -778 -891 -9 -147 -4 -150 67 -56 136 181 338 316 567 379 86 24 116 27 243 27 126 0 157 -3 240 -26 52 -14 126 -40 163 -57 252 -113 464 -349 548 -609 13 -40 26 -72 30 -72 11 0 48 163 60 266 51 460 -238 882 -698 1020 -73 22 -112 27 -233 30 -102 3 -164 -1 -209 -11z"></path><path d="M6419 2341 l-29 -29 0 -226 c0 -213 1 -227 20 -246 20 -20 33 -20 2334 -20 2264 0 2314 0 2337 19 24 19 24 20 24 244 l0 226 -29 30 -30 31 -2299 0 -2299 0 -29 -29z"></path><path d="M1168 2103 c-65 -74 -90 -243 -52 -355 33 -102 97 -184 151 -194 19 -4 36 -4 39 -2 2 3 -3 22 -12 44 -21 51 -15 162 14 224 11 25 25 69 32 99 l12 53 -73 74 c-40 41 -79 74 -85 74 -6 0 -18 -8 -26 -17z"></path><path d="M1870 2060 c-12 -8 -13 -13 -3 -27 95 -137 115 -263 64 -408 -11 -32 -18 -62 -15 -66 3 -5 19 -16 37 -25 l31 -17 43 47 c52 58 119 189 129 252 6 45 6 46 -47 101 -54 55 -191 153 -212 153 -7 0 -19 -5 -27 -10z"></path><path d="M1545 2036 c-51 -22 -85 -71 -85 -122 l0 -44 58 6 c114 12 234 -51 287 -150 11 -20 22 -36 26 -36 21 0 25 131 7 192 -15 51 -82 126 -133 149 -47 22 -117 24 -160 5z"></path><path d="M956 1998 c-111 -73 -228 -214 -288 -346 -27 -60 -29 -69 -18 -111 36 -145 171 -324 319 -423 69 -47 75 -49 99 -37 44 24 242 250 242 277 0 5 -22 24 -48 41 -61 39 -160 141 -195 202 -63 107 -88 238 -68 354 7 37 10 69 8 71 -2 2 -25 -10 -51 -28z"></path><path d="M1482 1768 c-7 -7 -12 -27 -12 -45 0 -39 21 -53 78 -53 41 0 108 -31 168 -76 33 -26 34 -26 34 -5 0 56 -62 145 -122 177 -33 17 -129 19 -146 2z"></path><path d="M2207 1648 c-79 -165 -236 -306 -396 -358 -51 -16 -71 -27 -71 -40 0 -38 87 -261 108 -274 9 -6 109 26 187 59 128 55 278 186 322 281 l26 57 -17 81 c-19 87 -54 183 -91 248 l-23 40 -45 -94z"></path><path d="M3666 1695 c-36 -19 -53 -41 -60 -80 -19 -93 -206 -1206 -206 -1224 0 -12 11 -33 25 -46 l24 -25 5289 0 5289 0 23 25 c33 36 44 -32 -171 1085 -40 210 -52 243 -100 267 -19 10 -1082 13 -5054 13 -4474 0 -5033 -2 -5059 -15z"></path><path d="M1370 1662 c0 -48 26 -102 68 -144 20 -20 45 -47 55 -58 15 -17 26 -21 50 -15 18 3 50 9 72 12 56 7 63 19 17 27 -27 4 -41 12 -45 25 -2 10 -16 26 -30 36 -24 15 -28 15 -58 -1 l-33 -17 -28 34 c-16 19 -34 52 -40 74 -15 54 -28 66 -28 27z"></path><path d="M1330 1471 c0 -5 12 -16 26 -26 20 -13 28 -14 40 -4 11 9 12 15 3 25 -13 15 -69 19 -69 5z"></path><path d="M1790 1435 c-57 -41 -123 -58 -203 -52 -40 3 -82 8 -94 12 -14 4 -23 3 -23 -3 0 -15 82 -32 157 -32 130 0 295 68 227 94 -22 9 -25 8 -64 -19z"></path><path d="M616 1303 c10 -67 45 -175 81 -248 129 -256 346 -421 638 -485 75 -17 269 -14 349 4 204 48 390 167 511 329 53 70 99 146 93 152 -2 3 -28 -12 -58 -32 -206 -139 -510 -211 -773 -184 -340 34 -643 200 -796 435 -24 36 -45 66 -47 66 -1 0 0 -17 2 -37z"></path><path d="M1365 1233 c-27 -32 -82 -95 -123 -140 l-73 -81 63 -21 c35 -12 98 -28 142 -36 85 -16 331 -21 340 -6 4 5 -10 46 -29 91 -19 45 -44 112 -55 149 l-21 67 -72 13 c-40 8 -84 16 -98 18 -21 4 -33 -5 -74 -54z"></path><path d="M586 979 c-3 -18 -6 -129 -6 -249 0 -172 3 -220 14 -229 9 -8 97 -11 302 -9 l289 3 -80 33 c-184 75 -362 227 -461 395 -51 85 -52 86 -58 56z"></path><path d="M3402 208 c-20 -20 -14 -63 14 -89 l26 -24 5281 -3 c5014 -2 5284 -1 5317 15 45 23 61 64 35 93 l-18 20 -5322 0 c-4125 0 -5324 -3 -5333 -12z"></path></g></svg>`,Te=K`<svg viewBox="0 0 175 82"><g transform="translate(0,82) rotate(-90)"><g class="ink"><path d="M2.15 170.65 c-0.57 -0.14 -1.13 -0.48 -1.67 -0.98 l-0.49 -0.48 0 -81.59 0 -81.58 0.28 -0.36 c0.38 -0.51 1.27 -0.96 2.17 -1.12 0.55 -0.09 10.38 -0.12 35.18 -0.09 31.32 0.03 34.45 0.05 34.83 0.22 0.23 0.10 0.58 0.35 0.78 0.56 0.20 0.20 0.45 0.36 0.56 0.36 0.77 0 3.04 2.26 3.69 3.68 0.26 0.55 0.27 0.72 0.30 4.30 0.05 4.15 -0.01 4.72 -0.57 5.36 l-0.35 0.38 0.24 0.47 c0.36 0.70 0.44 1.49 0.61 6.31 0.19 5.72 0.19 28.04 0 33.72 -0.16 4.83 -0.23 5.22 -1.01 6.09 l-0.49 0.55 0.35 0.35 c0.69 0.70 0.90 1.39 1.01 3.28 0.52 8.67 0.52 26.92 0 36.82 -0.09 1.71 -0.13 1.97 -0.41 2.54 -0.17 0.36 -0.42 0.70 -0.54 0.78 -0.31 0.20 -0.28 0.75 0.08 1.21 0.62 0.82 0.73 1.28 0.86 3.37 0.54 9.45 0.54 27.58 0 38.22 -0.12 2.27 -0.21 2.68 -0.82 3.42 l-0.33 0.41 0.38 0.31 c0.21 0.16 0.50 0.56 0.65 0.86 0.28 0.56 0.28 0.59 0.28 4.52 l0 3.96 -0.31 0.59 c-0.17 0.33 -0.57 0.83 -0.89 1.11 -0.71 0.64 -2.13 1.39 -2.63 1.39 -0.24 0 -0.47 0.09 -0.61 0.24 -0.12 0.14 -0.45 0.38 -0.75 0.56 l-0.52 0.30 -34.77 0.02 c-19.13 0 -34.92 -0.02 -35.12 -0.07z m68.85 -2.06 c0.72 -0.35 0.75 -0.48 0.75 -4.25 l0 -3.39 -0.45 -0.45 -0.45 -0.45 -9.09 0 c-7.13 0 -9.11 0.03 -9.20 0.15 -0.06 0.07 -0.34 0.77 -0.62 1.53 -0.85 2.36 -1.39 2.91 -2.76 2.84 -0.61 -0.03 -0.93 -0.15 -1.98 -0.68 -1.48 -0.76 -3.98 -2.25 -5.43 -3.25 l-1.05 -0.71 -7.09 0 c-6.69 0 -7.14 0.01 -7.99 0.23 -1.74 0.44 -2.64 0.59 -4.16 0.70 -2.07 0.15 -3.09 0.02 -4.12 -0.54 l-0.79 -0.43 -0.51 0.26 c-0.49 0.23 -0.68 0.24 -3.75 0.24 -2.99 0 -3.26 -0.01 -3.68 -0.23 -0.44 -0.22 -0.91 -0.75 -1.11 -1.22 -0.12 -0.27 -0.21 -141.33 -0.10 -142.82 0.07 -1.04 0.28 -1.49 0.90 -1.95 0.31 -0.23 0.49 -0.24 3.76 -0.28 2.06 -0.02 3.51 0.01 3.63 0.08 0.15 0.09 0.34 -0.02 0.92 -0.58 1.14 -1.11 1.47 -1.20 3.76 -1.20 1.06 0.01 2.32 0.08 2.80 0.16 1.09 0.19 2.85 0.79 5.42 1.85 l1.98 0.83 3.26 0 3.26 0 0.97 -1.05 c1.23 -1.33 1.72 -1.63 2.68 -1.63 0.89 0 1.13 0.19 2.18 1.70 l0.77 1.09 13.45 0 c14.49 0 13.99 0.02 14.42 -0.59 0.16 -0.23 0.19 -0.73 0.19 -3.84 l0 -3.58 -0.36 -0.30 -0.36 -0.30 -34.10 0.02 -34.12 0.03 -0.33 0.24 c-0.17 0.13 -0.44 0.42 -0.59 0.63 l-0.26 0.38 0.02 79.80 0.03 79.80 0.28 0.40 c0.16 0.22 0.54 0.51 0.87 0.66 l0.59 0.28 33.58 0 c30.85 0 33.63 -0.01 33.99 -0.19z"></path><path d="M44.91 158.44 c-3.31 -3.47 -8.84 -8.93 -11.29 -11.16 l-2.18 -1.98 0 -0.50 c0 -0.82 0.13 -0.96 0.92 -0.96 0.66 0 0.68 0 1.70 0.89 3.81 3.26 9.40 8.88 13.31 13.36 0.90 1.04 0.99 1.20 1.05 1.70 0.05 0.49 0.01 0.58 -0.22 0.76 -0.15 0.10 -0.45 0.19 -0.69 0.19 -0.38 0 -0.56 -0.16 -2.61 -2.29z"></path><path d="M28.98 143.65 c-0.29 -0.24 -0.87 -0.76 -1.30 -1.14 l-0.77 -0.70 0 -0.66 c0 -0.77 0.14 -0.91 0.92 -0.91 0.41 0 0.58 0.09 1.26 0.69 1.78 1.54 1.90 1.67 1.90 2.21 0 0.79 -0.14 0.94 -0.86 0.94 -0.56 0 -0.69 -0.05 -1.14 -0.43z"></path><path d="M22.34 158.21 c-0.22 -0.26 -0.27 -0.65 -0.56 -4.87 -0.40 -5.82 -0.49 -8.57 -0.50 -13.86 0 -5.84 0.20 -10.68 0.45 -11.09 0.14 -0.22 0.27 -0.27 0.80 -0.27 0.92 0 0.92 -0.01 0.77 3.13 -0.34 7.29 -0.17 16.11 0.45 23.77 0.15 1.86 0.15 3.06 -0.02 3.24 -0.22 0.22 -1.19 0.17 -1.40 -0.06z"></path><path d="M21.43 120.15 c-0.35 -0.42 -0.62 -12.01 -0.47 -19.63 0.15 -7.31 0.43 -12.32 0.72 -12.66 0.17 -0.22 1.30 -0.20 1.49 0.02 0.16 0.19 0.13 1.21 -0.13 5.01 -0.20 2.99 -0.27 18.12 -0.10 22.79 0.12 3.45 0.12 4.32 0 4.46 -0.20 0.23 -1.32 0.24 -1.51 0z"></path><path d="M16.73 119.94 c-0.21 -0.31 -0.58 -4.73 -0.78 -9.34 -0.17 -4.23 -0.07 -14.82 0.17 -17.82 0.40 -4.61 0.38 -4.60 1.36 -4.60 0.97 0 1.06 0.30 0.75 2.18 -0.33 2.02 -0.43 4.27 -0.49 10.87 -0.07 7.97 0.09 12.87 0.56 17.15 0.19 1.67 0.12 1.84 -0.77 1.84 -0.54 0 -0.66 -0.05 -0.80 -0.27z"></path><path d="M21.04 82.79 c-0.35 -0.56 -0.55 -15.39 -0.30 -22.28 0.21 -5.61 0.29 -6.79 0.54 -7.06 0.22 -0.24 0.96 -0.30 1.33 -0.10 0.31 0.16 0.36 0.54 0.23 2.11 -0.23 2.90 -0.36 13.90 -0.23 20.70 0.08 4.76 0.07 6.63 -0.01 6.74 -0.08 0.09 -0.38 0.15 -0.76 0.15 -0.52 0 -0.65 -0.05 -0.79 -0.26z"></path><path d="M25.63 38.79 c-0.27 -0.27 -0.31 -1.02 -0.09 -1.43 0.29 -0.56 3.17 -4 3.42 -4.09 0.34 -0.13 0.92 -0.07 1.19 0.12 0.40 0.27 0.36 1.22 -0.06 1.78 -0.84 1.11 -2.99 3.63 -3.18 3.74 -0.37 0.20 -1.02 0.14 -1.28 -0.12z"></path><path d="M30.63 32.26 c-0.16 -0.16 -0.23 -0.38 -0.23 -0.75 0 -0.44 0.09 -0.63 0.66 -1.36 1.11 -1.44 1.18 -1.50 1.78 -1.50 0.70 0 0.93 0.23 0.93 0.96 0 0.48 -0.08 0.65 -0.71 1.51 -0.38 0.52 -0.82 1.06 -0.94 1.18 -0.34 0.28 -1.19 0.27 -1.49 -0.03z"></path></g><g class="paper"><path d="M2.49 168.85 c-0.34 -0.15 -0.71 -0.44 -0.87 -0.66 l-0.28 -0.40 -0.03 -80.15 -0.02 -80.15 0.26 -0.38 c0.15 -0.21 0.42 -0.50 0.59 -0.63 l0.33 -0.24 34.48 -0.03 34.47 -0.02 0.35 0.33 0.36 0.31 -0.01 3.90 c0 3.31 -0.03 3.94 -0.19 4.17 -0.41 0.63 0.13 0.61 -14.77 0.61 l-13.80 0 -0.77 -1.09 c-0.42 -0.61 -0.92 -1.23 -1.12 -1.40 -0.75 -0.63 -1.55 -0.28 -3.04 1.33 l-0.97 1.05 -3.14 0.01 c-1.74 0.01 -3.26 0.06 -3.41 0.12 -0.20 0.07 -0.40 0.03 -0.72 -0.13 -0.71 -0.36 -4.62 -1.92 -5.65 -2.25 -1.35 -0.44 -2.22 -0.56 -4.08 -0.58 -1.57 -0.01 -1.68 0 -2.29 0.30 -0.41 0.20 -0.92 0.61 -1.36 1.08 l-0.71 0.76 -0.47 -0.24 c-0.45 -0.23 -0.64 -0.24 -3.55 -0.21 -2.90 0.03 -3.09 0.05 -3.40 0.28 -0.57 0.43 -0.82 0.90 -0.89 1.76 -0.10 1.21 -0.01 141.93 0.09 142.25 0.14 0.49 0.63 1.04 1.12 1.29 0.44 0.22 0.64 0.23 3.47 0.20 l3.01 -0.03 0.50 -0.34 0.51 -0.34 1 0.52 c1.25 0.66 1.40 0.70 3.03 0.69 1.43 -0.01 2.75 -0.20 4.57 -0.65 l1.13 -0.29 7.43 0 7.44 0 1.05 0.71 c2.46 1.69 6.14 3.74 6.95 3.89 0.59 0.12 1.22 -0.22 1.65 -0.89 0.20 -0.29 0.58 -1.15 0.86 -1.92 0.28 -0.76 0.56 -1.46 0.62 -1.53 0.09 -0.12 2.14 -0.15 9.55 -0.15 l9.43 0 0.45 0.45 0.45 0.45 0 3.74 c0 4.16 -0.01 4.25 -0.75 4.60 -0.36 0.17 -3.17 0.19 -34.34 0.19 l-33.93 0 -0.59 -0.28z"></path><path d="M73.50 164.37 c0 -2.71 -0.03 -3.61 -0.17 -4.04 -0.09 -0.31 -0.14 -0.61 -0.10 -0.66 0.09 -0.15 2.11 -1.14 2.32 -1.14 0.09 0 0.24 0.15 0.35 0.35 0.24 0.48 0.26 6.67 0.01 7.27 -0.16 0.38 -0.82 0.98 -1.60 1.44 -0.84 0.51 -0.80 0.66 -0.80 -3.21z"></path><path d="M47.58 162.16 c-4.57 -2.40 -8.82 -5.66 -13.69 -10.51 -3.14 -3.12 -4.79 -5.06 -6.48 -7.63 -1.04 -1.58 -2.03 -3.42 -2.03 -3.77 0 -0.22 0.15 -0.33 0.85 -0.63 1.35 -0.59 2.69 -1.30 4.26 -2.28 0.80 -0.50 1.99 -1.22 2.63 -1.60 1.12 -0.66 1.16 -0.70 1.16 -1.09 l0 -0.41 -0.55 0.02 -0.55 0.01 0.42 -0.83 c0.23 -0.47 0.54 -1.18 0.68 -1.60 0.23 -0.68 0.28 -0.76 0.54 -0.72 0.78 0.10 3.14 1.46 5.43 3.13 4.46 3.25 11.50 9.41 13.26 11.60 0.84 1.04 2.05 3.27 2.06 3.80 0.01 0.35 -0.08 0.50 -1.64 2.56 -0.76 1 -1.01 1.26 -1.08 1.12 -0.16 -0.28 -0.78 -0.22 -0.91 0.09 -0.06 0.14 -0.29 1.28 -0.52 2.53 -0.66 3.61 -1.35 6.13 -1.82 6.62 -0.13 0.14 -0.35 0.26 -0.49 0.26 -0.14 0 -0.83 -0.30 -1.54 -0.68z"></path><path d="M18.81 159.18 c-0.45 -0.20 -0.59 -0.38 -0.70 -0.94 -0.09 -0.57 -0.35 -0.87 -0.72 -0.87 -0.34 0 -0.80 -0.44 -1.02 -0.97 -0.34 -0.82 -0.72 -4.66 -0.99 -9.81 -0.26 -5 -0.08 -15.65 0.30 -18.81 0.16 -1.41 0.33 -2.20 0.54 -2.66 0.28 -0.58 1.12 -1.36 1.64 -1.53 0.21 -0.06 2.13 -0.14 4.27 -0.16 2.70 -0.05 4.68 -0.13 6.46 -0.30 2.83 -0.28 3.10 -0.24 3.60 0.35 0.42 0.49 0.51 0.93 0.71 3.42 0.29 3.62 0.28 4.31 -0.05 5.13 -0.58 1.43 -1.63 2.95 -2.70 3.88 -1 0.86 -3.02 2 -4.57 2.59 -1.27 0.48 -1.78 1.23 -1.48 2.17 0.33 1.01 2.10 3.98 3.56 5.95 1.15 1.55 2.19 2.75 4.03 4.66 1.54 1.57 1.47 1.42 1.26 3.05 -0.16 1.22 -0.41 1.55 -1.55 2.11 -1.84 0.89 -6.53 2.32 -8.98 2.74 -1.26 0.21 -3.14 0.22 -3.62 0.01z"></path><path d="M9.46 158.49 l-0.26 -0.27 0 -71.16 c0 -66.12 0.01 -71.17 0.20 -71.37 0.17 -0.19 0.42 -0.21 2.88 -0.21 2.48 0.01 2.71 0.02 2.96 0.23 0.27 0.22 0.27 0.22 0.09 1.09 -0.21 1.01 -0.58 4.22 -0.77 6.53 -0.31 4.16 -0.37 5.96 -0.43 12.93 -0.06 7.63 0.01 9.80 0.36 10.96 0.30 0.99 1.07 1.71 2.21 2.07 0.19 0.07 0.15 0.12 -0.23 0.41 -1.72 1.27 -2.02 2.53 -2.39 10.32 -0.08 1.81 -0.12 5.24 -0.07 9.73 0.08 8.78 0.28 12.10 0.79 13.71 0.28 0.84 0.96 1.68 1.67 2.04 l0.48 0.24 -0.29 0.17 c-0.16 0.10 -0.56 0.45 -0.89 0.78 -0.72 0.70 -1.04 1.48 -1.27 3.08 -0.96 6.52 -0.70 27.22 0.36 30.55 0.24 0.76 0.78 1.44 1.46 1.86 0.31 0.20 0.57 0.41 0.57 0.45 0 0.06 -0.14 0.17 -0.31 0.27 -0.19 0.09 -0.52 0.37 -0.76 0.62 -1.20 1.23 -1.47 3.05 -1.75 11.66 -0.20 6.06 0.02 12.78 0.61 18.31 0.28 2.74 0.40 3.25 0.87 3.97 l0.40 0.58 -0.48 0.34 -0.48 0.35 -2.64 0 c-2.61 0 -2.64 0 -2.89 -0.27z"></path><path d="M71.75 158.64 c-0.10 -0.07 -3.75 -0.12 -9.70 -0.12 l-9.53 0 0.03 -0.31 0.03 -0.33 10.66 -0.06 c5.86 -0.03 10.73 -0.03 10.81 -0.01 0.15 0.03 -1.77 0.94 -2.02 0.94 -0.06 0 -0.20 -0.06 -0.29 -0.12z"></path><path d="M31.04 158.12 c0.57 -0.27 0.65 -0.28 4.07 -0.28 3.33 -0.01 3.49 0 3.87 0.23 0.22 0.13 0.40 0.27 0.40 0.29 0 0.02 -2 0.05 -4.45 0.03 l-4.46 -0.01 0.58 -0.27z"></path><path d="M33.79 156.03 c0.22 -0.41 0.37 -0.87 0.42 -1.29 0.03 -0.35 0.10 -0.68 0.15 -0.70 0.08 -0.05 1.55 1.25 2.62 2.28 l0.35 0.34 -1.96 0 -1.95 0 0.36 -0.63z"></path><path d="M52.94 156.29 c0.15 -0.72 0.87 -1.90 2.22 -3.65 1.41 -1.81 1.78 -2.45 1.79 -3.01 0 -0.37 -1.11 -2.62 -1.78 -3.63 -1.48 -2.19 -9.53 -9.39 -14.45 -12.92 -2.52 -1.81 -5.22 -3.32 -5.93 -3.33 -0.31 0 -0.40 -0.37 -0.54 -2.47 -0.16 -2.31 -0.30 -3.25 -0.58 -3.88 -0.22 -0.49 -0.72 -1.08 -1.12 -1.33 l-0.23 -0.14 0.23 -0.14 c0.55 -0.33 1.20 -1.13 1.39 -1.67 0.23 -0.72 0.37 -2.27 0.55 -5.81 0.08 -1.82 0.17 -2.83 0.27 -2.88 0.07 -0.05 8.54 -0.09 18.82 -0.09 18.16 0 18.71 0.01 19.06 0.22 0.71 0.43 0.87 1.02 1.01 3.72 0.16 3.21 0.16 35.27 0 37.90 -0.14 2.20 -0.33 2.81 -1.01 3.24 -0.38 0.23 -0.54 0.23 -10.08 0.23 l-9.70 0 0.08 -0.37z"></path><path d="M74.59 155.59 c0.23 -1.09 0.29 -2.39 0.43 -9.12 0.09 -4.74 0.12 -10.81 0.07 -17.12 -0.09 -11 -0.22 -15.82 -0.49 -16.81 -0.09 -0.36 -0.14 -0.68 -0.10 -0.71 0.08 -0.08 0.64 0.36 1 0.82 0.42 0.52 0.50 1.26 0.69 5.93 0.31 8.50 0.26 23.35 -0.13 33.11 -0.13 3.05 -0.20 3.34 -0.93 3.97 -0.49 0.41 -0.63 0.38 -0.54 -0.07z"></path><path d="M18.11 121.67 c-1.34 -0.33 -1.93 -0.92 -2.20 -2.19 -0.45 -2.12 -0.79 -8.85 -0.80 -15.93 0 -6.83 0.33 -12.81 0.79 -14.61 0.30 -1.15 1.04 -1.92 2.13 -2.24 0.56 -0.16 0.99 -0.19 2.70 -0.13 3.42 0.13 10.90 0.76 11.29 0.96 0.58 0.29 0.82 0.83 0.94 2.17 0.48 5.06 0.48 20.51 0 27.88 -0.19 2.85 -0.45 3.21 -2.54 3.49 -2.43 0.34 -8.69 0.76 -10.91 0.75 -0.44 0 -1.07 -0.07 -1.40 -0.15z"></path><path d="M34.97 109.87 c-0.24 -0.21 -0.24 -0.29 -0.30 -8.13 -0.06 -9.62 -0.23 -12.64 -0.78 -13.93 -0.15 -0.34 -0.48 -0.78 -0.79 -1.06 -0.35 -0.31 -0.48 -0.49 -0.38 -0.54 0.31 -0.10 0.98 -0.77 1.19 -1.19 0.29 -0.56 0.43 -1.47 0.58 -3.79 0.16 -2.50 0.35 -8.62 0.35 -11.73 0 -2.39 0.01 -2.54 0.23 -2.66 0.15 -0.08 6.07 -0.10 18.86 -0.09 l18.62 0.03 0.31 0.29 c0.79 0.75 0.83 1.06 0.99 12.35 0.13 8.34 0 23.12 -0.22 27.22 -0.12 1.97 -0.33 2.63 -0.98 3.11 -0.33 0.24 -0.38 0.24 -18.89 0.28 -17.55 0.02 -18.57 0.01 -18.79 -0.17z"></path><path d="M74.56 109.06 c0.41 -1.15 0.50 -5.11 0.50 -20.88 0 -14.08 -0.09 -19.27 -0.40 -20.26 -0.14 -0.50 -0.09 -0.55 0.28 -0.30 0.51 0.34 0.98 1.16 1.05 1.90 0.58 5.70 0.43 37.45 -0.20 38.94 -0.17 0.43 -1.04 1.27 -1.29 1.27 -0.14 0 -0.13 -0.12 0.06 -0.66z"></path><path d="M27.95 85.24 c-1.41 -0.07 -2.17 -0.15 -2.20 -0.24 -0.10 -0.29 -0.61 -0.66 -0.90 -0.66 -0.22 0 -0.45 0.15 -0.77 0.48 -0.42 0.44 -0.48 0.47 -1.05 0.43 -0.59 -0.03 -0.62 -0.05 -0.69 -0.43 -0.09 -0.45 -0.28 -0.61 -0.69 -0.57 -0.20 0.02 -0.35 0.15 -0.47 0.42 l-0.17 0.38 -1.51 -0.03 c-1.37 -0.03 -1.57 -0.07 -2.11 -0.35 -0.75 -0.40 -1.39 -1.12 -1.54 -1.76 -0.37 -1.46 -0.61 -5.91 -0.69 -12.95 -0.07 -6.29 0.06 -10.84 0.38 -14.27 0.30 -3.25 0.48 -3.91 1.21 -4.62 0.68 -0.65 1.09 -0.79 2.33 -0.78 1.47 0.02 2.10 0.19 2.10 0.57 0 0.78 0.48 1.16 1 0.82 0.26 -0.16 0.29 -0.26 0.26 -0.73 -0.03 -0.55 -0.03 -0.55 0.31 -0.51 0.33 0.03 6.13 1.28 8.04 1.71 1.09 0.26 1.71 0.56 1.97 0.99 0.13 0.22 0.24 0.77 0.30 1.43 0.50 5.29 0.41 24.91 -0.13 28.97 -0.24 1.85 -0.56 1.96 -5 1.72z"></path><path d="M35.02 65.25 c-0.15 -0.17 -0.21 -0.80 -0.31 -3.98 -0.14 -4.44 -0.31 -7.21 -0.49 -7.86 -0.16 -0.64 -0.41 -1.11 -0.82 -1.53 l-0.34 -0.36 0.47 -0.45 c0.43 -0.44 0.83 -1.36 0.83 -1.93 0 -0.12 0.03 -0.21 0.09 -0.21 0.05 0 1.09 0.98 2.33 2.17 1.23 1.19 2.42 2.24 2.64 2.33 0.57 0.23 1.04 0.09 1.54 -0.47 0.61 -0.65 2.45 -3.58 7.87 -12.42 1.72 -2.82 3.79 -6.08 5.06 -8.01 0.72 -1.12 1.40 -2.18 1.49 -2.35 0.22 -0.43 0.22 -1.20 0 -1.62 -0.09 -0.19 -0.80 -0.87 -1.60 -1.54 -3.49 -2.96 -5.92 -5.40 -7.70 -7.76 -0.09 -0.12 2.55 -0.15 13.12 -0.15 l13.23 0 0.42 0.36 c0.71 0.63 0.75 0.91 0.87 6.92 0.24 11.87 0.08 36.59 -0.24 37.74 -0.07 0.26 -0.33 0.66 -0.57 0.90 l-0.44 0.44 -18.62 0 c-17.66 0 -18.65 -0.01 -18.82 -0.21z"></path><path d="M74.31 65.38 c0 -0.06 0.12 -0.38 0.24 -0.73 0.40 -1.04 0.48 -4.31 0.48 -21.26 0 -14.86 -0.12 -22.03 -0.36 -23.06 -0.07 -0.26 -0.09 -0.49 -0.06 -0.51 0.08 -0.08 0.98 0.83 1.16 1.19 0.30 0.57 0.40 4.41 0.48 17.90 0.07 12.63 -0.07 23.40 -0.33 24.74 -0.12 0.65 -0.54 1.26 -1.08 1.60 -0.38 0.23 -0.54 0.27 -0.54 0.14z"></path><path d="M37.16 49.71 c-2.45 -2.40 -5.47 -5.23 -7.45 -6.95 -1.47 -1.28 -1.40 -1.21 -0.99 -1.13 1.04 0.22 1.46 0.08 1.46 -0.47 0 -0.42 -0.36 -0.59 -1.89 -0.91 -2.40 -0.50 -3.60 -0.96 -3.79 -1.41 -0.13 -0.36 1.09 -3.24 2.38 -5.59 1.68 -3.05 6.87 -10.95 9.60 -14.57 1.83 -2.43 3.77 -4.59 4.13 -4.59 0.17 0 0.56 0.47 1.39 1.65 1.63 2.34 3.44 4.75 4.48 5.98 1.23 1.43 3.94 4.05 5.77 5.58 1.76 1.48 2.04 1.75 2.04 2.05 0 0.13 -0.86 1.55 -1.90 3.17 -1.65 2.56 -4.60 7.24 -5.44 8.65 -0.36 0.61 -2.02 3.28 -3.70 6 -2.42 3.88 -3.18 5.01 -3.39 5.01 -0.10 -0.01 -1.32 -1.12 -2.69 -2.47z"></path><path d="M28.71 50.02 c-1.47 -0.35 -3.48 -0.83 -4.47 -1.05 l-1.79 -0.43 0.07 -0.70 c0.07 -0.80 -0.03 -1.20 -0.37 -1.30 -0.42 -0.13 -0.68 0.12 -0.76 0.72 -0.03 0.31 -0.15 0.69 -0.26 0.84 -0.19 0.26 -0.22 0.27 -2.13 0.22 -1.81 -0.03 -1.97 -0.06 -2.46 -0.33 -1.16 -0.64 -1.27 -1.49 -1.28 -9.73 0 -8.95 0.49 -17.42 1.22 -20.91 0.36 -1.76 1.22 -3.02 2.34 -3.45 0.71 -0.27 3.31 -0.17 4.64 0.17 1.78 0.47 7.86 3.08 9.11 3.91 0.83 0.55 1 0.83 1.01 1.71 0.02 0.83 0.29 0.36 -3.20 5.51 -3.46 5.09 -5.21 8.21 -6.67 11.87 -0.45 1.14 -0.54 1.47 -0.49 1.90 0.07 0.69 0.35 0.96 2.34 2.29 1.79 1.19 3.69 2.74 6.12 4.96 l1.55 1.43 -0.07 0.87 c-0.05 0.49 -0.15 1.05 -0.24 1.26 -0.19 0.44 -0.79 0.86 -1.22 0.85 -0.16 0 -1.49 -0.29 -2.97 -0.64z"></path><path d="M59.05 17.84 l-14.04 -0.03 -0.37 -0.51 c-0.21 -0.28 -0.38 -0.55 -0.38 -0.58 0 -0.03 6.10 -0.06 13.56 -0.06 9.59 0 13.65 -0.03 13.92 -0.13 0.34 -0.12 0.41 -0.09 0.98 0.34 0.34 0.27 0.73 0.62 0.90 0.78 l0.27 0.29 -0.40 -0.02 c-0.22 -0.02 -6.71 -0.05 -14.43 -0.07z"></path><path d="M34.17 17.58 c-0.12 -0.14 -0.42 -0.41 -0.66 -0.58 l-0.45 -0.33 0.31 -0.08 c0.31 -0.08 2.85 0.03 2.95 0.13 0.02 0.02 -0.13 0.26 -0.34 0.51 -0.31 0.41 -0.44 0.48 -0.82 0.48 -0.23 0 -0.51 0.02 -0.59 0.06 -0.09 0.03 -0.27 -0.05 -0.40 -0.19z"></path><path d="M75.13 17.32 c-0.29 -0.27 -0.85 -0.78 -1.26 -1.13 l-0.72 -0.64 0.16 -0.47 c0.14 -0.37 0.17 -1.20 0.19 -4.04 0 -2.02 0.05 -3.59 0.10 -3.59 0.19 0 1.99 1.99 2.22 2.46 0.22 0.41 0.23 0.69 0.23 3.95 0 3.28 -0.06 3.97 -0.33 3.96 -0.05 0 -0.31 -0.22 -0.61 -0.50z"></path></g></g></svg>`;function Ue(e){const t={};for(const r of e){if(r.ht){const e=r.ht.bar;t[e.uid]={room:r.name,role:"CC",anchorUid:e.uid,name:e.name};for(const o of be){const i=r.ht.slots[o];i&&(t[i.uid]={room:r.name,role:o,anchorUid:e.uid,name:i.name})}}for(const e of r.pairs)e.L&&(t[e.L.uid]={room:r.name,role:"pairL",anchorUid:e.L.uid,name:e.L.name},e.R&&(t[e.R.uid]={room:r.name,role:"pairR",anchorUid:e.L.uid,name:e.R.name}));for(const e of r.tray)t[e.uid]={room:r.name,role:"solo",anchorUid:e.uid,name:e.name}}return t}function Ne(e){return structuredClone(e)}function De(e,t){return e.find(e=>e.key===t)}function He(e,t,r){const o=Ne(e),i=De(o,t);if(!i||!i.ht)return o;const s=i.ht.slots[r];return s?(i.ht.slots[r]=null,i.tray.push(s),i.tray.sort((e,t)=>e.name.localeCompare(t.name,void 0,{numeric:!0})),o):o}const je=["LF","RF","LR","RR","SW"],Fe={LF:"Front L",RF:"Front R",LR:"Rear L",RR:"Rear R",SW:"Sub",CC:"Center"},Be={LF:"lf",RF:"rf",LR:"lr",RR:"rr",SW:"sw"},Ie={separate:0,move:1,create_pair:2,add_ht:2,remove_ht:2};function We(e){return!!e&&-1!==je.indexOf(e.role)}function Ke(e,t){return We(e)&&We(t)&&e.anchorUid===t.anchorUid&&e.role===t.role&&!!e.height==!!t.height}function Ve(e){const t=Object.keys(e).sort(),r=[];for(const o of t){if("pairL"!==e[o].role)continue;const i=t.find(t=>"pairR"===e[t].role&&e[t].anchorUid===o);i&&r.push({left:o,right:i,leftName:e[o].name,rightName:e[i].name,room:e[o].room})}return r}function qe(e){const t=e.map((e,t)=>t);function r(e){for(;t[e]!==e;)t[e]=t[t[e]],e=t[e];return e}const o={};e.forEach((e,i)=>{e.touches.forEach(e=>{null!=o[e]&&function(e,o){t[r(e)]=r(o)}(i,o[e]),o[e]=i})});const i=new Map;return e.forEach((e,t)=>{const o=r(t),s=i.get(o);s?s.push(t):i.set(o,[t])}),Array.from(i.values()).sort((e,t)=>e[0]-t[0]).map(t=>t.slice().sort((t,r)=>Ie[e[t].type]-Ie[e[r].type]||t-r).map(t=>e[t]))}function Qe(e){return e?.message??String(e)}function Ye(e,t,r){const o=[],i=[];for(const e of t){i.push(o.length);for(const t of e)o.push({op:t,status:"pending"})}const s=()=>{r?.onUpdate?.(o)};return s(),Promise.all(t.map((t,r)=>async function(t,r){let i=!1;for(let a=0;a<t.length;a++){const t=o[r+a];if(i)t.status="skipped",s();else{t.status="running",s();try{await e.callService(t.op.service.domain,t.op.service.service,t.op.service.data),t.status="done",s()}catch(e){t.status="error",t.error=Qe(e),s(),i=!0}}}}(t,i[r]))).then(()=>o)}function Ge(e,t){const r=qe(function(e,t){const r=[],o=Array.from(new Set([...Object.keys(e),...Object.keys(t)])).sort(),i=Ve(e),s=Ve(t),a=new Set(s.map(e=>`${e.left}|${e.right}`));for(const e of i)a.has(`${e.left}|${e.right}`)||r.push({type:"separate",touches:[e.left,e.right],service:{domain:"chorus",service:"separate",data:{left:e.left,right:e.right}},summary:`${e.room} — separate stereo pair`});for(const i of o){const o=e[i],s=t[i];We(o)&&!Ke(o,s)&&r.push({type:"remove_ht",touches:[i,o.anchorUid],service:{domain:"chorus",service:"remove_home_theater",data:{soundbar:o.anchorUid,channel:o.role}},summary:`${o.room} — remove ${Fe[o.role]??o.role}`})}for(const i of o){const o=e[i],s=t[i];o&&s&&"solo"===o.role&&"solo"===s.role&&o.room!==s.room&&r.push({type:"move",touches:[i],service:{domain:"chorus",service:"move",data:{speaker:i,name:s.room}},summary:`${s.name} — move to ${s.room}`})}const n=new Set(i.map(e=>`${e.left}|${e.right}`));for(const e of s)n.has(`${e.left}|${e.right}`)||r.push({type:"create_pair",touches:[e.left,e.right],service:{domain:"chorus",service:"create_stereo_pair",data:{left:e.left,right:e.right}},summary:`${e.room} — create stereo pair`});for(const i of o){const o=e[i],s=t[i];if(We(s)&&!Ke(o,s)){const e=Be[s.role];r.push({type:"add_ht",touches:[i,s.anchorUid],service:{domain:"chorus",service:"set_home_theater",data:{soundbar:s.anchorUid,[e]:i}},summary:`${s.room} — add ${Fe[s.role]??s.role}`})}}return r}(e,t)),o=r.flat(),i=o.map(e=>({summary:e.summary,status:"pending"}));return{ops:o,lanes:r,rows:i}}let Ze=class extends le{constructor(){super(...arguments),this.rows=[],this.busy=!1,this.open=!1}toggle(){this.busy||(this.open=!this.open)}emit(e){this.dispatchEvent(new CustomEvent(e,{bubbles:!0,composed:!0}))}renderStatus(e){return"done"===e?W`
        <span class="state done" aria-label="done" title="Done">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <polyline points="5 12.5 10 17 19 7.5" />
          </svg>
        </span>
      `:"error"===e?W`
        <span class="state error" aria-label="error" title="Error">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <line x1="7" y1="7" x2="17" y2="17" />
            <line x1="17" y1="7" x2="7" y2="17" />
          </svg>
        </span>
      `:"running"===e?W`<span class="state running" aria-label="running" title="Applying"></span>`:"skipped"===e?W`<span class="state skipped" aria-label="skipped" title="Skipped"></span>`:W`<span class="state pending" aria-label="pending" title="Pending"></span>`}render(){const e=this.rows.length;if(0===e)return q;const t=this.busy||this.open,r=`${e} pending change${1===e?"":"s"}`;return W`
      <div
        class="bar ${t?"open":""} ${this.busy?"busy":""}"
        role="region"
        aria-label="Pending changes"
      >
        <div class="head">
          <button
            type="button"
            class="info"
            @click=${this.toggle}
            ?disabled=${this.busy}
            aria-expanded=${t?"true":"false"}
          >
            <span class="dot"></span>
            <b>${r}</b>
            ${this.busy?q:W`<span class="tog">${this.open?"Hide":"Details"}</span>`}
          </button>

          <div class="acts">
            ${this.busy?q:W`
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
              ${this.busy?W`<span class="apply-spin" aria-hidden="true"></span>Applying…`:"Apply"}
            </button>
          </div>
        </div>

        <div class="list" ?hidden=${!t}>
          ${this.rows.map(e=>W`
              <div class="row ${e.status}">
                ${this.renderStatus(e.status)}
                <span class="summary">${e.summary}</span>
              </div>
            `)}
        </div>
      </div>
    `}};Ze.styles=a`
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
  `,e([ge({attribute:!1})],Ze.prototype,"rows",void 0),e([ge({type:Boolean})],Ze.prototype,"busy",void 0),e([me()],Ze.prototype,"open",void 0),Ze=e([pe("chorus-changebar")],Ze);const Xe=K`
  <path d="M4 9.5v5h3.3L11.5 18V6L7.3 9.5H4z" fill="currentColor" stroke="none" />
  <path d="M15 9.3a4 4 0 0 1 0 5.4" />
  <path d="M17.7 6.5a8 8 0 0 1 0 11" />
`;let Je=class extends le{constructor(){super(...arguments),this._message="",this._visible=!1}show(e){this._clearTimer(),this._message=e,this._visible=!0,this._timer=window.setTimeout(()=>{this._visible=!1,this._timer=void 0},2700)}disconnectedCallback(){super.disconnectedCallback(),this._clearTimer()}_clearTimer(){void 0!==this._timer&&(window.clearTimeout(this._timer),this._timer=void 0)}render(){return this._message?W`
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
            ${Xe}
          </svg>
        </span>
        <span class="msg">${this._message}</span>
      </div>
    `:q}};Je.styles=a`
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
  `,e([me()],Je.prototype,"_message",void 0),e([me()],Je.prototype,"_visible",void 0),Je=e([pe("chorus-toast")],Je);let et=class extends le{constructor(){super(...arguments),this.heading="",this.subheading="",this.items=[],this.open=!1,this._onKeyDown=e=>{this.open&&"Escape"===e.key&&(e.stopPropagation(),this._close())}}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._onKeyDown)}disconnectedCallback(){window.removeEventListener("keydown",this._onKeyDown),super.disconnectedCallback()}_close(){this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}_select(e){e.disabled||(this.dispatchEvent(new CustomEvent("select",{detail:e.id,bubbles:!0,composed:!0})),this._close())}_onBackdrop(e){e.target===e.currentTarget&&this._close()}render(){return this.open?W`
      <div class="backdrop" @click=${this._onBackdrop}>
        <div
          class="sheet"
          role="dialog"
          aria-modal="true"
          aria-label=${this.heading||"Actions"}
        >
          ${this.heading||this.subheading?W`<div class="head">
                ${this.heading?W`<b>${this.heading}</b>`:q}
                ${this.subheading?W`<span>${this.subheading}</span>`:q}
              </div>`:q}
          <div class="items">
            ${this.items.map(e=>W`
                <button
                  type="button"
                  class="item ${e.danger?"danger":""}"
                  ?disabled=${e.disabled}
                  aria-disabled=${e.disabled?"true":"false"}
                  @click=${()=>this._select(e)}
                >
                  <span class="label">${e.label}</span>
                  ${e.sub?W`<span class="sub">${e.sub}</span>`:q}
                </button>
              `)}
          </div>
          <button type="button" class="cancel" @click=${this._close}>Cancel</button>
        </div>
      </div>
    `:q}};et.styles=a`
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
  `,e([ge({type:String})],et.prototype,"heading",void 0),e([ge({type:String})],et.prototype,"subheading",void 0),e([ge({attribute:!1})],et.prototype,"items",void 0),e([ge({type:Boolean})],et.prototype,"open",void 0),et=e([pe("chorus-menu")],et);let tt=class extends le{constructor(){super(...arguments),this.heading="",this.subheading="",this.controls=[],this.open=!1,this._onKeyDown=e=>{this.open&&"Escape"===e.key&&(e.stopPropagation(),this._close())}}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._onKeyDown)}disconnectedCallback(){window.removeEventListener("keydown",this._onKeyDown),super.disconnectedCallback()}_close(){this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}_onBackdrop(e){e.target===e.currentTarget&&this._close()}_emit(e,t){this.dispatchEvent(new CustomEvent("change",{detail:{id:e,value:t},bubbles:!0,composed:!0}))}_grouped(){const e=[],t=new Map;for(const r of this.controls){const o=r.group;t.has(o)||(t.set(o,[]),e.push(o)),t.get(o).push(r)}return e.map(e=>({group:e,rows:t.get(e)}))}_pct(e){const t=e.min??0,r=e.max??100,o="number"==typeof e.value?e.value:0;if(r===t)return 0;return(Math.min(r,Math.max(t,o))-t)/(r-t)*100}_fill(e){return`linear-gradient(90deg, var(--primary-color) ${e}%, var(--divider-color) ${e}%)`}_formatValue(e){const t="number"==typeof e.value?e.value:0;return e.format?`${t}${e.format}`:`${t}`}_onSlider(e,t){const r=t.target,o=Number(r.value),i=e.min??0,s=e.max??100,a=s===i?0:(o-i)/(s-i)*100;r.style.background=this._fill(a);const n=r.closest(".aset-row")?.querySelector(".rv");n&&(n.textContent=e.format?`${o}${e.format}`:`${o}`),this._emit(e.id,o)}_onToggle(e,t){const r=t.target;this._emit(e.id,r.checked)}_sliderRow(e){const t=this._pct(e),r="number"==typeof e.value?e.value:0;return W`
      <div class="aset-row ${e.disabled?"disabled":""}">
        <label class="rl" for=${`sl-${e.id}`}>${e.label}</label>
        <div class="rc">
          <span class="rv">${this._formatValue(e)}</span>
          <input
            id=${`sl-${e.id}`}
            class="sl"
            type="range"
            min=${e.min??0}
            max=${e.max??100}
            step=${e.step??1}
            .value=${String(r)}
            style=${`background:${this._fill(t)}`}
            aria-label=${e.label}
            ?disabled=${e.disabled}
            @input=${t=>this._onSlider(e,t)}
          />
        </div>
      </div>
    `}_toggleRow(e){const t=!0===e.value;return W`
      <div class="aset-row ${e.disabled?"disabled":""}">
        <label class="rl" for=${`sw-${e.id}`}>${e.label}</label>
        <label class="sw">
          <input
            id=${`sw-${e.id}`}
            type="checkbox"
            .checked=${t}
            aria-label=${e.label}
            ?disabled=${e.disabled}
            @change=${t=>this._onToggle(e,t)}
          />
          <span class="tr"></span>
          <span class="kn"></span>
        </label>
      </div>
    `}_row(e){return"toggle"===e.kind?this._toggleRow(e):this._sliderRow(e)}render(){if(!this.open)return q;const e=this._grouped();return W`
      <div class="backdrop" @click=${this._onBackdrop}>
        <div
          class="sheet"
          role="dialog"
          aria-modal="true"
          aria-label=${this.heading||"Audio settings"}
        >
          ${this.heading||this.subheading?W`<div class="head">
                ${this.heading?W`<b>${this.heading}</b>`:q}
                ${this.subheading?W`<span>${this.subheading}</span>`:q}
              </div>`:q}
          ${e.map(e=>W`
              ${e.group?W`<div class="aset-lbl">${e.group}</div>`:q}
              <div class="aset-group">${e.rows.map(e=>this._row(e))}</div>
            `)}
          <button type="button" class="done" @click=${this._close}>Done</button>
        </div>
      </div>
    `}};tt.styles=a`
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
    /* Center it as a true sheet on wider viewports. */
    @media (min-width: 560px) {
      .backdrop {
        align-items: center;
      }
    }

    .sheet {
      width: 380px;
      max-width: 100%;
      max-height: 82vh;
      overflow-y: auto;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: 20px;
      box-shadow: 0 24px 70px -20px rgba(0, 0, 0, 0.55);
      padding: 20px;
      margin-bottom: max(8px, env(safe-area-inset-bottom));
      animation: rise 0.24s cubic-bezier(0.34, 1.4, 0.6, 1);
    }

    .head {
      text-align: center;
      padding: 2px 8px 4px;
    }
    .head b {
      display: block;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .head span {
      display: block;
      font-size: 12.5px;
      color: var(--secondary-text-color);
      margin-top: 3px;
    }

    .aset-lbl {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: var(--secondary-text-color);
      margin: 16px 4px 7px;
    }

    .aset-group {
      background: var(--secondary-background-color);
      border-radius: 13px;
      overflow: hidden;
    }

    .aset-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 10px 14px;
      min-height: 46px;
      box-sizing: border-box;
    }
    .aset-row + .aset-row {
      border-top: 0.5px solid var(--divider-color);
    }
    .aset-row.disabled {
      opacity: 0.4;
    }
    .aset-row.disabled .sl,
    .aset-row.disabled .sw,
    .aset-row.disabled input {
      pointer-events: none;
    }

    .rl {
      font-size: 14.5px;
      line-height: 1.3;
    }
    .rc {
      display: flex;
      align-items: center;
      gap: 11px;
    }
    .rv {
      font-family: var(--code-font-family, ui-monospace, "SF Mono", Menlo, monospace);
      font-size: 11px;
      color: var(--secondary-text-color);
      min-width: 48px;
      text-align: right;
    }

    /* ---- slider: thin track with a blue fill computed from the value ---- */
    .sl {
      -webkit-appearance: none;
      appearance: none;
      width: 148px;
      max-width: 40vw;
      height: 4px;
      border-radius: 2px;
      background: var(--divider-color);
      outline: none;
      cursor: pointer;
      vertical-align: middle;
      margin: 2px 0;
    }
    .sl::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--card-background-color, #fff);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.12);
      cursor: pointer;
    }
    .sl::-moz-range-thumb {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: var(--card-background-color, #fff);
      border: 1px solid rgba(0, 0, 0, 0.12);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      cursor: pointer;
    }
    .sl:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 3px;
    }

    /* ---- iOS-style toggle: real checkbox styled as a switch ---- */
    .sw {
      position: relative;
      width: 44px;
      height: 26px;
      flex: none;
    }
    .sw input {
      opacity: 0;
      width: 100%;
      height: 100%;
      margin: 0;
      cursor: pointer;
      position: relative;
      z-index: 2;
    }
    .sw .tr {
      position: absolute;
      inset: 0;
      border-radius: 999px;
      background: var(--divider-color);
      transition: background 0.2s ease;
    }
    .sw .kn {
      position: absolute;
      top: 2px;
      left: 2px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: #fff;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
      transition: transform 0.2s ease;
    }
    .sw input:checked ~ .tr {
      background: var(--primary-color);
    }
    .sw input:checked ~ .kn {
      transform: translateX(18px);
    }
    .sw input:focus-visible ~ .tr {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
    }

    .done {
      width: 100%;
      border: none;
      background: var(--primary-color);
      color: #fff;
      font: inherit;
      font-size: 15px;
      font-weight: 600;
      padding: 12px;
      border-radius: 12px;
      cursor: pointer;
      margin-top: 18px;
      transition: filter 0.12s ease;
    }
    .done:hover {
      filter: brightness(0.95);
    }
    .done:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
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
      .sw .tr,
      .sw .kn,
      .done {
        transition: none;
      }
    }
  `,e([ge({type:String})],tt.prototype,"heading",void 0),e([ge({type:String})],tt.prototype,"subheading",void 0),e([ge({attribute:!1})],tt.prototype,"controls",void 0),e([ge({type:Boolean})],tt.prototype,"open",void 0),tt=e([pe("chorus-audio")],tt);const rt=[{key:"bass",label:"Bass",group:"EQ"},{key:"treble",label:"Treble",group:"EQ"},{key:"loudness",label:"Loudness",group:"EQ",toggle:!0},{key:"sub_gain",label:"Sub level",group:"Surround & sub"},{key:"subwoofer_enabled",label:"Subwoofer",group:"Surround & sub",toggle:!0},{key:"surround_level",label:"Surround level",group:"Surround & sub"},{key:"surround_enabled",label:"Surround",group:"Surround & sub",toggle:!0},{key:"night_sound",label:"Night sound",group:"TV audio",toggle:!0},{key:"speech_enhancement",label:"Speech enhancement",group:"TV audio",toggle:!0},{key:"audio_delay",label:"Audio delay",group:"TV audio"},{key:"crossfade",label:"Crossfade",group:"Playback",toggle:!0},{key:"balance",label:"Balance",group:"Playback"}],ot={LF:"t-front",RF:"t-front",LR:"t-rear",RR:"t-rear",SW:"t-sub"};let it=class extends le{constructor(){super(...arguments),this.narrow=!1,this._dirty=!1,this._applying=!1,this._rows=[],this._onMenuSelect=e=>{const t=this._menu;this._menu=void 0,t?.onSelect(e.detail)},this._onAudioChange=e=>{const{id:t,value:r}=e.detail;"boolean"==typeof r?this.hass.callService("switch",r?"turn_on":"turn_off",{entity_id:t}):this.hass.callService("number","set_value",{entity_id:t,value:r}),this._audio&&(this._audio={...this._audio,controls:this._audio.controls.map(e=>e.id===t?{...e,value:r}:e)})}}willUpdate(e){(e.has("graph")&&!this._dirty||void 0===this._working)&&(this._working=structuredClone(Me(this.graph)))}get _rooms(){return this._working??Me(this.graph)}_room(){const e=this._rooms;if(this._selected){const t=e.find(e=>e.key===this._selected);if(t)return t}return this.narrow?void 0:e[0]}_plan(){return Ge(Ue(Me(this.graph)),Ue(this._rooms))}_toast(e){const t=this.shadowRoot?.querySelector("chorus-toast");t?.show(e)}_assign(e,t,r){this._working=function(e,t,r,o){const i=Ne(e),s=De(i,t);if(!s||!s.ht)return i;const a=s.tray.findIndex(e=>e.uid===o);if(-1===a)return i;const[n]=s.tray.splice(a,1),c=s.ht.slots[r];return c&&s.tray.push(c),s.ht.slots[r]=n,s.tray.sort((e,t)=>e.name.localeCompare(t.name,void 0,{numeric:!0})),i}(this._rooms,e,t,r.uid),this._dirty=!0,this._picker=void 0,this._toast(`${this._name(r)} → ${ve[t]}`)}_canDrop(e,t){return!!this._drag&&this._drag.roomKey===e.key&&we(t,this._drag.model)}_dropOnChannel(e,t){if(!this._canDrop(e,t))return;const r=e.tray.find(e=>e.uid===this._drag.uid);this._drag=void 0,r&&this._assign(e.key,t,r)}_onDragOver(e,t,r){this._canDrop(t,r)&&(e.preventDefault(),e.currentTarget.classList.add("over"))}_onDrop(e,t,r){e.preventDefault(),e.currentTarget.classList.remove("over"),this._dropOnChannel(t,r)}_clear(e,t,r){this._working=He(this._rooms,e,t),this._dirty=!0,this._toast(`${r.name} removed from ${ve[t]}`)}_separate(e,t){this._working=function(e,t,r){const o=Ne(e),i=De(o,t);if(!i||r<0||r>=i.pairs.length)return o;const[s]=i.pairs.splice(r,1);for(const e of[s.L,s.R,s.sub])e&&i.tray.push(e);return i.tray.sort((e,t)=>e.name.localeCompare(t.name,void 0,{numeric:!0})),o}(this._rooms,e,t),this._dirty=!0,this._toast("Stereo pair separated")}_pickPairMember(e){if(!this._pairPick)return;const{roomKey:t,first:r}=this._pairPick;r?e.uid!==r&&(this._working=function(e,t,r,o){const i=Ne(e),s=De(i,t);if(!s||r===o)return i;const a=s.tray.findIndex(e=>e.uid===r),n=s.tray.findIndex(e=>e.uid===o);if(-1===a||-1===n)return i;const c=s.tray[a],l=s.tray[n];return s.tray=s.tray.filter(e=>e.uid!==r&&e.uid!==o),s.pairs.push({L:c,R:l,sub:null}),i}(this._rooms,t,r,e.uid),this._dirty=!0,this._pairPick=void 0,this._toast("Stereo pair created")):this._pairPick={roomKey:t,first:e.uid}}_openRoomMenu(e){const t=[];e.ht&&(t.push({id:"audio",label:"Audio settings"}),t.push({id:"dissolve",label:"Separate home theater",danger:!0})),t.length&&(this._menu={heading:e.name,items:t,onSelect:t=>{"audio"===t?this._openAudio(e.ht.bar.name):"dissolve"===t&&(this._working=function(e,t){const r=De(e,t);if(!r?.ht)return Ne(e);let o=Ne(e);for(const e of be)o=He(o,t,e);return o}(this._rooms,e.key),this._dirty=!0,this._toast("Home theater separated"))}})}_openPairMenu(e,t){const r=!!e.pairs[t]?.sub;this._menu={heading:"Stereo pair",items:[{id:"audio",label:"Audio settings"},r?{id:"removesub",label:"Remove sub"}:{id:"addsub",label:"Add a sub…"},{id:"swap",label:"Swap L / R"},{id:"separate",label:"Separate pair",danger:!0}],onSelect:r=>{"audio"===r?this._openAudio(e.pairs[t]?.L?.name??e.name):"addsub"===r?this._subPick={roomKey:e.key,pairIndex:t}:"removesub"===r?(this._working=function(e,t,r){const o=Ne(e),i=De(o,t);if(!i)return o;const s=i.pairs[r];return s&&s.sub?(i.tray.push(s.sub),s.sub=null,i.tray.sort((e,t)=>e.name.localeCompare(t.name,void 0,{numeric:!0})),o):o}(this._rooms,e.key,t),this._dirty=!0,this._toast("Sub removed")):"swap"===r?(this._working=function(e,t,r){const o=Ne(e),i=De(o,t);if(!i||r<0||r>=i.pairs.length)return o;const s=i.pairs[r];return[s.L,s.R]=[s.R,s.L],o}(this._rooms,e.key,t),this._dirty=!0,this._toast("Swapped L / R")):"separate"===r&&this._separate(e.key,t)}}}_doAddSub(e,t,r){this._working=function(e,t,r,o){const i=Ne(e),s=De(i,t);if(!s)return i;const a=s.pairs[r];if(!a)return i;let n;for(const e of i){const t=e.tray.findIndex(e=>e.uid===o);if(-1!==t){n=e.tray.splice(t,1)[0];break}const r=e.pairs.find(e=>e.sub?.uid===o);if(r){n=r.sub,r.sub=null;break}}return n?(a.sub&&(s.tray.push(a.sub),s.tray.sort((e,t)=>e.name.localeCompare(t.name,void 0,{numeric:!0}))),a.sub=n,i):i}(this._rooms,e,t,r.uid),this._dirty=!0,this._subPick=void 0,this._toast(`${this._name(r)} → Sub`)}_subOverlay(){if(!this._subPick)return q;const{roomKey:e,pairIndex:t}=this._subPick,r=this._rooms.find(t=>t.key===e)?.pairs[t]?.sub?.uid,o=[];for(const e of this._rooms){for(const t of e.tray)_e(t.model)&&t.uid!==r&&o.push({sp:t,where:`${e.name} · available`});for(const t of e.pairs)t.sub&&_e(t.sub.model)&&t.sub.uid!==r&&o.push({sp:t.sub,where:`${e.name} · paired`})}return W`
      <div class="backdrop" @click=${()=>this._subPick=void 0}>
        <div class="sheet" @click=${e=>e.stopPropagation()}>
          <div class="sheet-h">Add a sub</div>
          ${o.length?o.map(({sp:r,where:o})=>W`
                  <button type="button" class="sheet-item" @click=${()=>this._doAddSub(e,t,r)}>
                    <span class="rt">${Pe(r.model)}</span>
                    <span class="rx"><b>${this._name(r)}</b><span>${o}</span></span>
                  </button>
                `):W`<div class="sheet-empty">No sub available to add.</div>`}
          <button type="button" class="sheet-cancel" @click=${()=>this._subPick=void 0}>Cancel</button>
        </div>
      </div>
    `}_openSpeakerMenu(e){this._menu={heading:this._name(e),items:[{id:"identify",label:"Identify"},{id:"rename",label:"Rename…"},{id:"move",label:"Move to another room…"}],onSelect:t=>{"identify"===t?this._toast(`Chiming on ${this._name(e)}`):"rename"===t?this._renameFor={uid:e.uid,current:this._name(e)}:"move"===t&&(this._movePick=e.uid)}}}_doRename(){const e=this.shadowRoot?.querySelector(".rename-input"),t=e?.value.trim(),r=this._renameFor;this._renameFor=void 0,r&&t&&t!==r.current&&(this.hass.callService("chorus","rename",{speaker:r.uid,name:t}),this._toast(`Renamed to ${t}`),this.dispatchEvent(new CustomEvent("chorus-refresh",{bubbles:!0,composed:!0})))}_renameOverlay(){return this._renameFor?W`
      <div class="backdrop" @click=${()=>this._renameFor=void 0}>
        <div class="sheet" @click=${e=>e.stopPropagation()}>
          <div class="sheet-h">Rename speaker</div>
          <input
            class="rename-input"
            type="text"
            .value=${this._renameFor.current}
            @keydown=${e=>{"Enter"===e.key&&this._doRename()}}
          />
          <div class="rename-btns">
            <button type="button" class="sheet-cancel" @click=${()=>this._renameFor=void 0}>
              Cancel
            </button>
            <button type="button" class="rename-save" @click=${()=>this._doRename()}>Save</button>
          </div>
        </div>
      </div>
    `:q}_doMove(e,t){this._working=function(e,t,r){const o=Ne(e);let i;for(const e of o){const r=e.tray.findIndex(e=>e.uid===t);if(-1!==r){i=e.tray.splice(r,1)[0];break}}if(!i)return o;let s=o.find(e=>e.name===r);return s||(s={key:r,name:r,area:r,ht:null,pairs:[],tray:[]},o.push(s)),s.tray.push(i),s.tray.sort((e,t)=>e.name.localeCompare(t.name,void 0,{numeric:!0})),o.sort((e,t)=>e.name.localeCompare(t.name,void 0,{numeric:!0})),o}(this._rooms,e,t),this._dirty=!0,this._movePick=void 0,this._toast(`Moved to ${t}`)}_moveOverlay(){if(!this._movePick)return q;const e=this._movePick,t=this._rooms.find(t=>t.tray.some(t=>t.uid===e)),r=new Set;for(const e of this._rooms)r.add(e.name);for(const e of this.graph?.areas??[])r.add(e);t&&r.delete(t.name);const o=[...r].sort((e,t)=>e.localeCompare(t,void 0,{numeric:!0}));return W`
      <div class="backdrop" @click=${()=>this._movePick=void 0}>
        <div class="sheet" @click=${e=>e.stopPropagation()}>
          <div class="sheet-h">Move to another room</div>
          ${o.length?o.map(t=>W`
                  <button type="button" class="sheet-item" @click=${()=>this._doMove(e,t)}>
                    <span class="rx"><b>${t}</b></span>
                  </button>
                `):W`<div class="sheet-empty">No other rooms available.</div>`}
          <button type="button" class="sheet-cancel" @click=${()=>this._movePick=void 0}>
            Cancel
          </button>
        </div>
      </div>
    `}_openAudio(e){const t=(e=>e.toLowerCase().replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,""))(e),r=[];for(const e of rt){const o=`${e.toggle?"switch":"number"}.${t}_${e.key}`,i=this.hass?.states?.[o];if(i&&"unavailable"!==i.state&&"unknown"!==i.state)if(e.toggle)r.push({id:o,kind:"toggle",label:e.label,group:e.group,value:"on"===i.state});else{const t=i.attributes;r.push({id:o,kind:"slider",label:e.label,group:e.group,value:Number(i.state),min:t.min??0,max:t.max??100,step:t.step??1})}}r.length?this._audio={heading:`${e} · Audio`,controls:r}:this._toast("No audio settings available for this speaker")}_dots(e){return W`<button
      type="button"
      class="dots"
      title="Options"
      aria-label="Options"
      @click=${t=>{t.stopPropagation(),e(t)}}
    >
      ⋯
    </button>`}_discard(){this._working=structuredClone(Me(this.graph)),this._dirty=!1,this._picker=void 0,this._toast("Changes discarded")}async _apply(){const e=this._plan();if(function(e){return 0===e.ops.length}(e)||this._applying)return;this._applying=!0,this._rows=e.rows,await function(e,t,r){const o=e=>e.map(e=>({summary:e.op.summary,status:e.status}));return Ye(e,t.lanes,{onUpdate:e=>r(o(e))}).then(e=>o(e))}(this.hass,e,e=>{this._rows=[...e]});const t=this._bondSignature(Ue(this._rooms)),r=await this._awaitConvergence(t),o=this._rows.filter(e=>"error"===e.status).length;this._applying=!1,this._dirty=!1,r?this.dispatchEvent(new CustomEvent("chorus-graph",{detail:r,bubbles:!0,composed:!0})):this.dispatchEvent(new CustomEvent("chorus-refresh",{bubbles:!0,composed:!0})),this._toast(o?`Applied with ${o} error${1===o?"":"s"}`:"Applied")}_bondSignature(e){return Object.keys(e).sort().map(t=>`${t}:${e[t].role}:${e[t].anchorUid}`).join(";")}_fullSignature(e){const t=[];for(const r of e.units??[])for(const e of r.members)t.push(`${e.uid}:${e.channel??"-"}:${e.name??""}`);return t.sort().join(";")}async _awaitConvergence(e){let t,r="\0";for(let o=0;o<24;o++){let o;try{o=await this.hass.connection.sendMessagePromise({type:"chorus/refresh"})}catch{return t}t=o;const i=this._bondSignature(Ue(Me(o))),s=this._fullSignature(o);if(i===e&&s===r)return o;r=s,await new Promise(e=>window.setTimeout(e,1e3))}return t}_name(e){return e.name&&!/^RINCON_/i.test(e.name)?e.name:Le(e.model)||"Speaker"}render(){const e=this._rooms;if(!e.length)return W`<div class="empty">No Sonos speakers discovered yet.</div>
        <chorus-toast></chorus-toast>`;const t=this._room(),r=this._plan(),o=this._applying?this._rows:r.rows;return W`
      <div class="grid ${this._applying?"locked":""}" data-detail=${t?"on":"off"}>
        <div class="col-list">
          <div class="eyebrow">Rooms</div>
          <div class="list">${e.map(e=>this._roomButton(e,t))}</div>
        </div>
        <div class="col-detail">${t?this._detail(t):q}</div>
      </div>
      ${this._applying?W`<div class="settling">Settling — waiting for your speakers to finish…</div>`:q}
      ${this._pickerOverlay()}
      ${this._pairOverlay()}
      ${this._moveOverlay()}
      ${this._subOverlay()}
      ${this._renameOverlay()}
      <chorus-menu
        .open=${!!this._menu}
        .heading=${this._menu?.heading??""}
        .items=${this._menu?.items??[]}
        @select=${this._onMenuSelect}
        @close=${()=>this._menu=void 0}
      ></chorus-menu>
      <chorus-audio
        .open=${!!this._audio}
        .heading=${this._audio?.heading??""}
        .controls=${this._audio?.controls??[]}
        @change=${this._onAudioChange}
        @close=${()=>this._audio=void 0}
      ></chorus-audio>
      <chorus-changebar
        .rows=${o}
        .busy=${this._applying}
        @apply=${this._apply}
        @discard=${this._discard}
      ></chorus-changebar>
      <chorus-toast></chorus-toast>
    `}_roomGlyphModel(e){return e.ht?.bar.model??e.pairs[0]?.L?.model??e.tray[0]?.model??""}_roomTint(e){return e.ht?"t-bar":e.pairs.length?"t-front":"t-neutral"}_roomButton(e,t){const r=t?.key===e.key;return W`
      <button type="button" class="room ${r?"sel":""}" @click=${()=>this._selected=e.key}>
        <span class="ric ${this._roomTint(e)}">${Pe(this._roomGlyphModel(e))}</span>
        <span class="rmeta">
          <b>${e.name}</b>
          <span>${this._roomSummary(e)}</span>
        </span>
        <span class="chev">›</span>
      </button>
    `}_roomSummary(e){const t=[];if(e.ht){const r=be.filter(t=>"SW"!==t&&e.ht.slots[t]).length;t.push(`Home theater · ${r}.${e.ht.slots.SW?"1":"0"}`)}e.pairs.length&&t.push(1===e.pairs.length?"Stereo pair":`${e.pairs.length} pairs`);const r=e.tray.length;return r&&!e.ht&&t.push(1===r?"1 speaker":`${r} speakers`),t.join(" · ")||"No speakers"}_detail(e){return W`
      ${this.narrow?W`<button type="button" class="back" @click=${()=>this._selected=void 0}>
            ‹ All rooms
          </button>`:q}
      <div class="head">
        <h1>${e.name}</h1>
        ${e.area?q:W`<span class="kind">No HA area</span>`}
        <span class="grow"></span>
        ${e.ht?this._dots(()=>this._openRoomMenu(e)):q}
      </div>
      ${e.ht?this._htStage(e,e.ht):this._setupCta(e)}
      ${e.pairs.length?W`<div class="paircards">${e.pairs.map((t,r)=>this._pairCard(e,t,r))}</div>`:q}
      ${this._traySection(e)}
    `}_setupCta(e){const t=e.tray.find(e=>!!ye(e.model).primary);return t?W`
      <button
        type="button"
        class="cta"
        @click=${()=>{this._working=function(e,t,r){const o=Ne(e),i=De(o,t);if(!i||i.ht)return o;const s=i.tray.findIndex(e=>e.uid===r);if(-1===s)return o;const[a]=i.tray.splice(s,1),n={};for(const e of be)n[e]=null;return i.ht={bar:a,slots:n},o}(this._rooms,e.key,t.uid),this._dirty=!0,this._toast("Home theater created")}}
      >
        ＋ Set up a home theater with ${this._name(t)}
      </button>
    `:q}_htStage(e,t){return W`
      <div class="stage">
        <div class="tv">${Oe}</div>
        <div class="postile bar t-bar">
          <span class="badge t-bar">${Pe(t.bar.model)}</span>
          <span class="pmeta"><b>${this._name(t.bar)}</b><span>${Le(t.bar.model)||"Center"}</span></span>
        </div>
        <div class="prow fronts">${this._pos(e,t,"LF")}${this._pos(e,t,"RF")}</div>
        <div class="lp"><div class="couch">${Te}</div><small>Listening position</small></div>
        <div class="prow rear">${this._pos(e,t,"LR")}${this._pos(e,t,"RR")}</div>
        <div class="psub">${this._pos(e,t,"SW")}</div>
      </div>
    `}_pos(e,t,r){const o=t.slots[r],i=e.tray.some(e=>we(r,e.model));if(!o){const t=()=>{i&&(this._picker={roomKey:e.key,ch:r})};return W`
        <div
          class="postile empty ${i?"actionable":""}"
          role=${i?"button":q}
          tabindex=${i?"0":q}
          title=${i?`Add ${ve[r]}`:"No eligible speaker in this room"}
          @click=${t}
          @keydown=${e=>{"Enter"!==e.key&&" "!==e.key||(e.preventDefault(),t())}}
          @dragover=${t=>this._onDragOver(t,e,r)}
          @dragleave=${e=>e.currentTarget.classList.remove("over")}
          @drop=${t=>this._onDrop(t,e,r)}
        >
          <span class="badge empty-badge">${r}</span>
          <span class="pmeta"><b>${ve[r]}</b><span>${i?"Tap to add":"Empty"}</span></span>
        </div>
      `}return W`
      <div
        class="postile filled"
        @dragover=${t=>this._onDragOver(t,e,r)}
        @dragleave=${e=>e.currentTarget.classList.remove("over")}
        @drop=${t=>this._onDrop(t,e,r)}
      >
        <span class="badge ${ot[r]}">${Pe(o.model)}</span>
        <span class="pmeta">
          <b>${this._name(o)}</b>
          <span>${ve[r]} · ${Le(o.model)}</span>
        </span>
        <button type="button" class="x" title="Remove" @click=${()=>this._clear(e.key,r,o)}>×</button>
      </div>
    `}_pairCard(e,t,r){return W`
      <div class="paircard">
        <div class="pc-orbs">
          ${this._pcSlot("L",t.L)}
          <span class="pc-div">+</span>
          ${this._pcSlot("R",t.R)}
        </div>
        <div class="pc-meta">
          <b>${t.L?this._name(t.L):t.R?this._name(t.R):"Stereo pair"}</b>
          <span>${Le(t.L?.model??t.R?.model)} · stereo pair</span>
        </div>
        ${t.sub?W`<span class="pc-sub"><span class="pc-sub-ic">${Pe(t.sub.model)}</span> Sub · ${t.sub.name}</span>`:q}
        <span class="grow"></span>
        ${this._dots(()=>this._openPairMenu(e,r))}
      </div>
    `}_pcSlot(e,t){return W`
      <div class="pc-slot ${t?"":"empty"}">
        ${t?W`<span class="badge orb t-front">${Pe(t.model)}</span>`:W`<span class="badge empty-badge">${e}</span>`}
        <span class="pc-side">${e}</span>
      </div>
    `}_traySection(e){if(!e.tray.length)return e.ht||e.pairs.length?q:W`<div class="empty">No speakers in this room.</div>`;const t=e.ht||e.pairs.length?"Available speakers":"Speakers",r=e.tray.filter(e=>$e(e.model)).length>=2;return W`
      <div class="sec">${t}</div>
      <div class="rows">${e.tray.map(t=>this._speakerRow(t,e.key))}</div>
      ${r?W`<button type="button" class="newpair" @click=${()=>this._pairPick={roomKey:e.key}}>
            ＋ Create stereo pair
          </button>`:q}
    `}_speakerRow(e,t){return W`
      <div
        class="row drag"
        draggable="true"
        @dragstart=${r=>{r.target.closest(".dots")?r.preventDefault():(this._drag={uid:e.uid,roomKey:t,model:e.model},r.dataTransfer&&(r.dataTransfer.effectAllowed="move"),r.currentTarget.classList.add("dragging"))}}
        @dragend=${e=>{this._drag=void 0,e.currentTarget.classList.remove("dragging")}}
      >
        <span class="rt">${Pe(e.model)}</span>
        <span class="rx"><b>${this._name(e)}</b><span>${Le(e.model)}</span></span>
        <span class="grow"></span>
        ${this._dots(()=>this._openSpeakerMenu(e))}
      </div>
    `}_pickerOverlay(){if(!this._picker)return q;const{roomKey:e,ch:t}=this._picker,r=this._rooms.find(t=>t.key===e),o=(r?.tray??[]).filter(e=>we(t,e.model));return W`
      <div class="backdrop" @click=${()=>this._picker=void 0}>
        <div class="sheet" @click=${e=>e.stopPropagation()}>
          <div class="sheet-h">Add ${ve[t]}</div>
          ${o.length?o.map(r=>W`
                  <button type="button" class="sheet-item" @click=${()=>this._assign(e,t,r)}>
                    <span class="rt">${Pe(r.model)}</span>
                    <span class="rx"><b>${r.name}</b><span>${Le(r.model)}</span></span>
                  </button>
                `):W`<div class="sheet-empty">No eligible speaker in this room.</div>`}
          <button type="button" class="sheet-cancel" @click=${()=>this._picker=void 0}>Cancel</button>
        </div>
      </div>
    `}_pairOverlay(){if(!this._pairPick)return q;const{roomKey:e,first:t}=this._pairPick,r=this._rooms.find(t=>t.key===e),o=(r?.tray??[]).filter(e=>$e(e.model)&&e.uid!==t);return W`
      <div class="backdrop" @click=${()=>this._pairPick=void 0}>
        <div class="sheet" @click=${e=>e.stopPropagation()}>
          <div class="sheet-h">
            ${t?"Pick the partner speaker":"Create stereo pair — pick the first speaker"}
          </div>
          ${o.length?o.map(e=>W`
                  <button type="button" class="sheet-item" @click=${()=>this._pickPairMember(e)}>
                    <span class="rt">${Pe(e.model)}</span>
                    <span class="rx"><b>${this._name(e)}</b><span>${Le(e.model)}</span></span>
                  </button>
                `):W`<div class="sheet-empty">No speaker available to pair.</div>`}
          <button type="button" class="sheet-cancel" @click=${()=>this._pairPick=void 0}>Cancel</button>
        </div>
      </div>
    `}};it.styles=a`
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
    .postile.filled .pmeta {
      padding-right: 22px; /* clear the absolutely-positioned × */
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
    .cta {
      width: 100%;
      margin: 4px 0 8px;
      border: 1.5px dashed var(--divider-color);
      background: none;
      color: var(--primary-color);
      font: inherit;
      font-size: 14px;
      font-weight: 600;
      border-radius: 14px;
      padding: 14px;
      cursor: pointer;
    }
    .cta:hover {
      border-color: var(--primary-color);
      background: color-mix(in srgb, var(--primary-color) 8%, transparent);
    }
    .rename-input {
      width: 100%;
      box-sizing: border-box;
      font: inherit;
      font-size: 15px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 1px solid var(--divider-color);
      background: var(--secondary-background-color);
      color: var(--primary-text-color);
      margin: 8px 0 8px;
    }
    .rename-input:focus {
      outline: 2px solid var(--primary-color);
      border-color: transparent;
    }
    .rename-btns {
      display: flex;
      gap: 8px;
    }
    .rename-btns button {
      flex: 1;
    }
    .rename-save {
      border: none;
      background: var(--primary-color);
      color: #fff;
      font: inherit;
      font-weight: 600;
      padding: 11px;
      border-radius: 12px;
      cursor: pointer;
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
    .grid.locked {
      pointer-events: none;
      opacity: 0.55;
      transition: opacity 0.2s;
    }
    .settling {
      position: fixed;
      left: 50%;
      bottom: 88px;
      transform: translateX(-50%);
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color);
      color: var(--secondary-text-color);
      font-size: 13px;
      font-weight: 500;
      padding: 8px 16px;
      border-radius: 999px;
      box-shadow: var(--ha-card-box-shadow, 0 2px 10px rgba(0, 0, 0, 0.15));
      z-index: 40;
    }
    @media (max-width: 800px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .grid[data-detail="on"] .col-list {
        display: none;
      }
    }
  `,e([ge({attribute:!1})],it.prototype,"hass",void 0),e([ge({attribute:!1})],it.prototype,"graph",void 0),e([ge({type:Boolean})],it.prototype,"narrow",void 0),e([me()],it.prototype,"_selected",void 0),e([me()],it.prototype,"_working",void 0),e([me()],it.prototype,"_dirty",void 0),e([me()],it.prototype,"_applying",void 0),e([me()],it.prototype,"_rows",void 0),e([me()],it.prototype,"_picker",void 0),e([me()],it.prototype,"_pairPick",void 0),e([me()],it.prototype,"_menu",void 0),e([me()],it.prototype,"_audio",void 0),e([me()],it.prototype,"_movePick",void 0),e([me()],it.prototype,"_subPick",void 0),e([me()],it.prototype,"_renameFor",void 0),it=e([pe("chorus-editor")],it);const st="none",at="1.7",nt=[{accent:"front",icon:W`<svg
  viewBox="0 0 24 24"
  fill=${st}
  stroke="currentColor"
  stroke-width=${at}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M9 11V6a2 2 0 0 1 4 0v5" />
  <path d="M13 8a2 2 0 0 1 4 0v3" />
  <path d="M17 9.5a2 2 0 0 1 4 0V15a6 6 0 0 1-6 6h-2.5a5 5 0 0 1-4-2l-3-4a2 2 0 0 1 3-2.6L9 11" />
</svg>`,title:"Tap or drag to assign",text:"Tap an empty channel — or drag a speaker onto it — to add it to a home theater."},{accent:"rear",icon:W`<svg
  viewBox="0 0 24 24"
  fill=${st}
  stroke="currentColor"
  stroke-width=${at}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect x="3" y="4" width="5.5" height="16" rx="1.6" />
  <rect x="9.25" y="4" width="5.5" height="16" rx="1.6" />
  <rect x="15.5" y="4" width="5.5" height="16" rx="1.6" />
</svg>`,title:"Channels are color-coded",text:"Front is blue, Rear is teal, Sub is indigo."},{accent:"neutral",icon:W`<svg
  viewBox="0 0 24 24"
  fill="currentColor"
  stroke="none"
>
  <circle cx="5" cy="12" r="1.8" />
  <circle cx="12" cy="12" r="1.8" />
  <circle cx="19" cy="12" r="1.8" />
</svg>`,title:"••• for actions",text:"Room, pair, and speaker menus: separate, swap L/R, audio settings, move to another room, identify."},{accent:"sub",icon:W`<svg
  viewBox="0 0 24 24"
  fill=${st}
  stroke="currentColor"
  stroke-width=${at}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <path d="M4 12.5l5 5L20 6" />
</svg>`,title:"Nothing changes until Apply",text:"Edits stage locally; the change bar shows what's pending, and Apply pushes it to your speakers."},{accent:"neutral",icon:W`<svg
  viewBox="0 0 24 24"
  fill=${st}
  stroke="currentColor"
  stroke-width=${at}
  stroke-linecap="round"
  stroke-linejoin="round"
>
  <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
  <path d="M3.5 9.5h17" />
  <path d="M8.5 9.5v10" />
</svg>`,title:"Overview tab",text:"A read-only, at-a-glance view of everything currently bonded."}];let ct=class extends le{constructor(){super(...arguments),this.open=!1,this._onKeyDown=e=>{this.open&&"Escape"===e.key&&(e.stopPropagation(),this._close())}}connectedCallback(){super.connectedCallback(),window.addEventListener("keydown",this._onKeyDown)}disconnectedCallback(){window.removeEventListener("keydown",this._onKeyDown),super.disconnectedCallback()}_close(){this.dispatchEvent(new CustomEvent("close",{bubbles:!0,composed:!0}))}_onBackdrop(e){e.target===e.currentTarget&&this._close()}render(){return this.open?W`
      <div class="backdrop" @click=${this._onBackdrop}>
        <div
          class="card"
          role="dialog"
          aria-modal="true"
          aria-labelledby="chorus-help-title"
        >
          <header class="head">
            <h2 id="chorus-help-title">Chorus</h2>
            <p class="sub">Configure Sonos bonding — no cloud, all local.</p>
          </header>

          <ul class="tips">
            ${nt.map(e=>W`
                <li class="tip">
                  <div class="tile ${e.accent}" aria-hidden="true">${e.icon}</div>
                  <div class="tt">
                    <b>${e.title}</b>
                    <span>${e.text}</span>
                  </div>
                </li>
              `)}
          </ul>

          <button type="button" class="done" @click=${this._close}>Got it</button>
        </div>
      </div>
    `:q}};ct.styles=a`
    :host {
      display: contents;
    }

    .backdrop {
      position: fixed;
      inset: 0;
      z-index: 1100;
      background: rgba(0, 0, 0, 0.42);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      animation: fade 0.2s ease;
    }

    .card {
      width: 400px;
      max-width: 100%;
      max-height: 86vh;
      overflow-y: auto;
      box-sizing: border-box;
      background: var(--card-background-color, #fff);
      color: var(--primary-text-color);
      border: 1px solid var(--divider-color);
      border-radius: 20px;
      box-shadow: 0 24px 70px -20px rgba(0, 0, 0, 0.55);
      padding: 22px 20px 18px;
      animation: rise 0.24s cubic-bezier(0.34, 1.4, 0.6, 1);
    }

    .head {
      text-align: center;
      margin-bottom: 18px;
    }
    .head h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      letter-spacing: -0.02em;
      color: var(--primary-text-color);
    }
    .head .sub {
      margin: 6px 0 0;
      font-size: 13px;
      color: var(--secondary-text-color);
    }

    .tips {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .tip {
      display: flex;
      align-items: flex-start;
      gap: 13px;
    }

    .tile {
      flex: 0 0 auto;
      width: 38px;
      height: 38px;
      border-radius: 11px;
      display: flex;
      align-items: center;
      justify-content: center;
      /* Tint the tile from an accent color mixed into the card background. */
      background: color-mix(in srgb, var(--tile-accent) 16%, transparent);
      color: var(--tile-accent);
    }
    .tile svg {
      width: 20px;
      height: 20px;
    }
    /* Front = blue, Rear = teal, Sub = indigo; neutral falls back to the theme. */
    .tile.front {
      --tile-accent: var(--info-color, #2196f3);
    }
    .tile.rear {
      --tile-accent: #009688;
    }
    .tile.sub {
      --tile-accent: #3f51b5;
    }
    .tile.neutral {
      --tile-accent: var(--primary-color);
    }

    .tt {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    .tt b {
      font-size: 14.5px;
      font-weight: 600;
      line-height: 1.3;
      color: var(--primary-text-color);
    }
    .tt span {
      font-size: 13px;
      line-height: 1.4;
      color: var(--secondary-text-color);
    }

    .done {
      width: 100%;
      border: none;
      background: var(--primary-color);
      color: var(--text-primary-color, #fff);
      font: inherit;
      font-size: 15px;
      font-weight: 600;
      padding: 12px;
      border-radius: 12px;
      cursor: pointer;
      margin-top: 20px;
      transition: filter 0.12s ease;
    }
    .done:hover {
      filter: brightness(1.06);
    }
    .done:focus-visible {
      outline: 2px solid var(--primary-color);
      outline-offset: 2px;
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
      .card {
        animation: none;
      }
    }
  `,e([ge({type:Boolean})],ct.prototype,"open",void 0),ct=e([pe("chorus-help")],ct);const lt={home_theater:"Home theater",stereo_pair:"Stereo pair",standalone:"Standalone"},dt={CC:"Center",LF:"Front L",RF:"Front R",LR:"Rear L",RR:"Rear R",SW:"Sub"},pt={CC:"var(--chorus-cc)",LF:"var(--chorus-front)",RF:"var(--chorus-front)",LR:"var(--chorus-rear)",RR:"var(--chorus-rear)",SW:"var(--chorus-sub)"},ht={home_theater:0,stereo_pair:1,standalone:2};let ut=class extends le{constructor(){super(...arguments),this.narrow=!1,this._view="editor",this._loading=!0,this._help=!1,this._polling=!1}firstUpdated(){this._load()}connectedCallback(){super.connectedCallback(),this._pollTimer=window.setInterval(()=>{this._poll()},12e3)}disconnectedCallback(){super.disconnectedCallback(),this._pollTimer&&(window.clearInterval(this._pollTimer),this._pollTimer=void 0)}async _poll(){if(!this._polling&&this.hass){this._polling=!0;try{this._graph=await this.hass.connection.sendMessagePromise({type:"chorus/refresh"})}catch{}finally{this._polling=!1}}}async _load(e=!1){this._loading=!0,this._error=void 0;try{this._graph=await this.hass.connection.sendMessagePromise({type:e?"chorus/refresh":"chorus/bond_graph"})}catch(e){this._error=e?.message||e?.code||"unknown error"}finally{this._loading=!1}}render(){return W`
      <div class="wrap">
        ${this._header()}
        ${"overview"===this._view?this._overview():this._editor()}
      </div>
      <chorus-help .open=${this._help} @close=${()=>this._help=!1}></chorus-help>
    `}_header(){const e=this._graph?.units?.length??0;return W`
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
        ${"overview"===this._view&&e?W`<span class="count">${e} unit${1===e?"":"s"}</span>`:q}
        <button class="refresh" @click=${()=>this._load(!0)}>Refresh</button>
        <button class="refresh" title="How it works" @click=${()=>this._help=!0}>?</button>
      </header>
    `}_editor(){return this._loading&&!this._graph?W`<div class="msg">Reading your speakers…</div>`:this._error?W`<div class="msg err">Couldn't load the speaker graph: ${this._error}</div>`:W`<chorus-editor
      .hass=${this.hass}
      .graph=${this._graph}
      .narrow=${this.narrow}
      @chorus-graph=${e=>{this._graph=e.detail,this._loading=!1}}
      @chorus-refresh=${()=>this._load(!0)}
    ></chorus-editor>`}_overview(){if(this._loading&&!this._graph)return W`<div class="msg">Reading your speakers…</div>`;if(this._error)return W`<div class="msg err">Couldn't load the speaker graph: ${this._error}</div>`;const e=this._graph?.units??[];if(!e.length)return W`<div class="msg">No Sonos speakers discovered yet.</div>`;const t=[...e].sort((e,t)=>(ht[e.kind]??9)-(ht[t.kind]??9)||(e.name??"").localeCompare(t.name??""));return W`<div class="grid">${t.map(e=>this._card(e))}</div>`}_card(e){return W`
      <div class="card">
        <h2>
          ${e.name||e.primary_uid}
          <span class="kind">${lt[e.kind]??e.kind}</span>
        </h2>
        <div class="members">${e.members.map(e=>this._member(e))}</div>
      </div>
    `}_member(e){const t=e.channel?dt[e.channel]??e.channel:"Speaker",r=e.channel?pt[e.channel]??"var(--chorus-cc)":"",o=[e.model,e.ip].filter(Boolean).join(" · ");return W`
      <div class="member">
        <span
          class="chip ${e.channel?"":"solo"}"
          style=${r?`background:${r}`:q}
          >${t}</span
        >
        <span class="m-main">
          <span class="m-name">${e.name||e.uid}</span>
          ${o?W`<span class="m-sub">${o}</span>`:q}
        </span>
        ${e.invisible?W`<span class="inv">bonded</span>`:q}
      </div>
    `}};ut.styles=a`
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
  `,e([ge({attribute:!1})],ut.prototype,"hass",void 0),e([ge({attribute:!1})],ut.prototype,"narrow",void 0),e([me()],ut.prototype,"_view",void 0),e([me()],ut.prototype,"_graph",void 0),e([me()],ut.prototype,"_error",void 0),e([me()],ut.prototype,"_loading",void 0),e([me()],ut.prototype,"_help",void 0),ut=e([pe("chorus-panel")],ut);export{ut as ChorusPanel};
