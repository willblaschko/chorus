function t(t,e,r,s){var o,i=arguments.length,n=i<3?e:null===s?s=Object.getOwnPropertyDescriptor(e,r):s;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,r,s);else for(var a=t.length-1;a>=0;a--)(o=t[a])&&(n=(i<3?o(n):i>3?o(e,r,n):o(e,r))||n);return i>3&&n&&Object.defineProperty(e,r,n),n}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,r=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,s=Symbol(),o=new WeakMap;let i=class{constructor(t,e,r){if(this._$cssResult$=!0,r!==s)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(r&&void 0===t){const r=void 0!==e&&1===e.length;r&&(t=o.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),r&&o.set(e,t))}return t}toString(){return this.cssText}};const n=(t,...e)=>{const r=1===t.length?t[0]:e.reduce((e,r,s)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(r)+t[s+1],t[0]);return new i(r,t,s)},a=r?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const r of t.cssRules)e+=r.cssText;return(t=>new i("string"==typeof t?t:t+"",void 0,s))(e)})(t):t,{is:d,defineProperty:c,getOwnPropertyDescriptor:l,getOwnPropertyNames:p,getOwnPropertySymbols:h,getPrototypeOf:u}=Object,m=globalThis,g=m.trustedTypes,v=g?g.emptyScript:"",f=m.reactiveElementPolyfillSupport,_=(t,e)=>t,x={toAttribute(t,e){switch(e){case Boolean:t=t?v:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let r=t;switch(e){case Boolean:r=null!==t;break;case Number:r=null===t?null:Number(t);break;case Object:case Array:try{r=JSON.parse(t)}catch(t){r=null}}return r}},$=(t,e)=>!d(t,e),b={attribute:!0,type:String,converter:x,reflect:!1,useDefault:!1,hasChanged:$};Symbol.metadata??=Symbol("metadata"),m.litPropertyMetadata??=new WeakMap;let y=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=b){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const r=Symbol(),s=this.getPropertyDescriptor(t,r,e);void 0!==s&&c(this.prototype,t,s)}}static getPropertyDescriptor(t,e,r){const{get:s,set:o}=l(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:s,set(e){const i=s?.call(this);o?.call(this,e),this.requestUpdate(t,i,r)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??b}static _$Ei(){if(this.hasOwnProperty(_("elementProperties")))return;const t=u(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(_("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(_("properties"))){const t=this.properties,e=[...p(t),...h(t)];for(const r of e)this.createProperty(r,t[r])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,r]of e)this.elementProperties.set(t,r)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const r=this._$Eu(t,e);void 0!==r&&this._$Eh.set(r,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const r=new Set(t.flat(1/0).reverse());for(const t of r)e.unshift(a(t))}else void 0!==t&&e.push(a(t));return e}static _$Eu(t,e){const r=e.attribute;return!1===r?void 0:"string"==typeof r?r:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const r of e.keys())this.hasOwnProperty(r)&&(t.set(r,this[r]),delete this[r]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,s)=>{if(r)t.adoptedStyleSheets=s.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const r of s){const s=document.createElement("style"),o=e.litNonce;void 0!==o&&s.setAttribute("nonce",o),s.textContent=r.cssText,t.appendChild(s)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,r){this._$AK(t,r)}_$ET(t,e){const r=this.constructor.elementProperties.get(t),s=this.constructor._$Eu(t,r);if(void 0!==s&&!0===r.reflect){const o=(void 0!==r.converter?.toAttribute?r.converter:x).toAttribute(e,r.type);this._$Em=t,null==o?this.removeAttribute(s):this.setAttribute(s,o),this._$Em=null}}_$AK(t,e){const r=this.constructor,s=r._$Eh.get(t);if(void 0!==s&&this._$Em!==s){const t=r.getPropertyOptions(s),o="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:x;this._$Em=s;const i=o.fromAttribute(e,t.type);this[s]=i??this._$Ej?.get(s)??i,this._$Em=null}}requestUpdate(t,e,r,s=!1,o){if(void 0!==t){const i=this.constructor;if(!1===s&&(o=this[t]),r??=i.getPropertyOptions(t),!((r.hasChanged??$)(o,e)||r.useDefault&&r.reflect&&o===this._$Ej?.get(t)&&!this.hasAttribute(i._$Eu(t,r))))return;this.C(t,e,r)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:r,reflect:s,wrapped:o},i){r&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,i??e??this[t]),!0!==o||void 0!==i)||(this._$AL.has(t)||(this.hasUpdated||r||(e=void 0),this._$AL.set(t,e)),!0===s&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,r]of t){const{wrapped:t}=r,s=this[e];!0!==t||this._$AL.has(e)||void 0===s||this.C(e,void 0,r,s)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};y.elementStyles=[],y.shadowRootOptions={mode:"open"},y[_("elementProperties")]=new Map,y[_("finalized")]=new Map,f?.({ReactiveElement:y}),(m.reactiveElementVersions??=[]).push("2.1.2");const w=globalThis,A=t=>t,k=w.trustedTypes,S=k?k.createPolicy("lit-html",{createHTML:t=>t}):void 0,E="$lit$",R=`lit$${Math.random().toFixed(9).slice(2)}$`,C="?"+R,P=`<${C}>`,z=document,U=()=>z.createComment(""),O=t=>null===t||"object"!=typeof t&&"function"!=typeof t,H=Array.isArray,L="[ \t\n\f\r]",M=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,T=/>/g,D=RegExp(`>|${L}(?:([^\\s"'>=/]+)(${L}*=${L}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),j=/'/g,F=/"/g,W=/^(?:script|style|textarea|title)$/i,B=(t=>(e,...r)=>({_$litType$:t,strings:e,values:r}))(1),I=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),V=new WeakMap,J=z.createTreeWalker(z,129);function K(t,e){if(!H(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==S?S.createHTML(e):e}const Z=(t,e)=>{const r=t.length-1,s=[];let o,i=2===e?"<svg>":3===e?"<math>":"",n=M;for(let e=0;e<r;e++){const r=t[e];let a,d,c=-1,l=0;for(;l<r.length&&(n.lastIndex=l,d=n.exec(r),null!==d);)l=n.lastIndex,n===M?"!--"===d[1]?n=N:void 0!==d[1]?n=T:void 0!==d[2]?(W.test(d[2])&&(o=RegExp("</"+d[2],"g")),n=D):void 0!==d[3]&&(n=D):n===D?">"===d[0]?(n=o??M,c=-1):void 0===d[1]?c=-2:(c=n.lastIndex-d[2].length,a=d[1],n=void 0===d[3]?D:'"'===d[3]?F:j):n===F||n===j?n=D:n===N||n===T?n=M:(n=D,o=void 0);const p=n===D&&t[e+1].startsWith("/>")?" ":"";i+=n===M?r+P:c>=0?(s.push(a),r.slice(0,c)+E+r.slice(c)+R+p):r+R+(-2===c?e:p)}return[K(t,i+(t[r]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),s]};class G{constructor({strings:t,_$litType$:e},r){let s;this.parts=[];let o=0,i=0;const n=t.length-1,a=this.parts,[d,c]=Z(t,e);if(this.el=G.createElement(d,r),J.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(s=J.nextNode())&&a.length<n;){if(1===s.nodeType){if(s.hasAttributes())for(const t of s.getAttributeNames())if(t.endsWith(E)){const e=c[i++],r=s.getAttribute(t).split(R),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:o,name:n[2],strings:r,ctor:"."===n[1]?et:"?"===n[1]?rt:"@"===n[1]?st:tt}),s.removeAttribute(t)}else t.startsWith(R)&&(a.push({type:6,index:o}),s.removeAttribute(t));if(W.test(s.tagName)){const t=s.textContent.split(R),e=t.length-1;if(e>0){s.textContent=k?k.emptyScript:"";for(let r=0;r<e;r++)s.append(t[r],U()),J.nextNode(),a.push({type:2,index:++o});s.append(t[e],U())}}}else if(8===s.nodeType)if(s.data===C)a.push({type:2,index:o});else{let t=-1;for(;-1!==(t=s.data.indexOf(R,t+1));)a.push({type:7,index:o}),t+=R.length-1}o++}}static createElement(t,e){const r=z.createElement("template");return r.innerHTML=t,r}}function Q(t,e,r=t,s){if(e===I)return e;let o=void 0!==s?r._$Co?.[s]:r._$Cl;const i=O(e)?void 0:e._$litDirective$;return o?.constructor!==i&&(o?._$AO?.(!1),void 0===i?o=void 0:(o=new i(t),o._$AT(t,r,s)),void 0!==s?(r._$Co??=[])[s]=o:r._$Cl=o),void 0!==o&&(e=Q(t,o._$AS(t,e.values),o,s)),e}class X{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:r}=this._$AD,s=(t?.creationScope??z).importNode(e,!0);J.currentNode=s;let o=J.nextNode(),i=0,n=0,a=r[0];for(;void 0!==a;){if(i===a.index){let e;2===a.type?e=new Y(o,o.nextSibling,this,t):1===a.type?e=new a.ctor(o,a.name,a.strings,this,t):6===a.type&&(e=new ot(o,this,t)),this._$AV.push(e),a=r[++n]}i!==a?.index&&(o=J.nextNode(),i++)}return J.currentNode=z,s}p(t){let e=0;for(const r of this._$AV)void 0!==r&&(void 0!==r.strings?(r._$AI(t,r,e),e+=r.strings.length-2):r._$AI(t[e])),e++}}class Y{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,r,s){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=r,this.options=s,this._$Cv=s?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=Q(this,t,e),O(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==I&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>H(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&O(this._$AH)?this._$AA.nextSibling.data=t:this.T(z.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:r}=t,s="number"==typeof r?this._$AC(t):(void 0===r.el&&(r.el=G.createElement(K(r.h,r.h[0]),this.options)),r);if(this._$AH?._$AD===s)this._$AH.p(e);else{const t=new X(s,this),r=t.u(this.options);t.p(e),this.T(r),this._$AH=t}}_$AC(t){let e=V.get(t.strings);return void 0===e&&V.set(t.strings,e=new G(t)),e}k(t){H(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let r,s=0;for(const o of t)s===e.length?e.push(r=new Y(this.O(U()),this.O(U()),this,this.options)):r=e[s],r._$AI(o),s++;s<e.length&&(this._$AR(r&&r._$AB.nextSibling,s),e.length=s)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class tt{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,r,s,o){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=s,this.options=o,r.length>2||""!==r[0]||""!==r[1]?(this._$AH=Array(r.length-1).fill(new String),this.strings=r):this._$AH=q}_$AI(t,e=this,r,s){const o=this.strings;let i=!1;if(void 0===o)t=Q(this,t,e,0),i=!O(t)||t!==this._$AH&&t!==I,i&&(this._$AH=t);else{const s=t;let n,a;for(t=o[0],n=0;n<o.length-1;n++)a=Q(this,s[r+n],e,n),a===I&&(a=this._$AH[n]),i||=!O(a)||a!==this._$AH[n],a===q?t=q:t!==q&&(t+=(a??"")+o[n+1]),this._$AH[n]=a}i&&!s&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class et extends tt{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class rt extends tt{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class st extends tt{constructor(t,e,r,s,o){super(t,e,r,s,o),this.type=5}_$AI(t,e=this){if((t=Q(this,t,e,0)??q)===I)return;const r=this._$AH,s=t===q&&r!==q||t.capture!==r.capture||t.once!==r.once||t.passive!==r.passive,o=t!==q&&(r===q||s);s&&this.element.removeEventListener(this.name,this,r),o&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class ot{constructor(t,e,r){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=r}get _$AU(){return this._$AM._$AU}_$AI(t){Q(this,t)}}const it=w.litHtmlPolyfillSupport;it?.(G,Y),(w.litHtmlVersions??=[]).push("3.3.3");const nt=globalThis;class at extends y{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,r)=>{const s=r?.renderBefore??e;let o=s._$litPart$;if(void 0===o){const t=r?.renderBefore??null;s._$litPart$=o=new Y(e.insertBefore(U(),t),t,void 0,r??{})}return o._$AI(t),o})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return I}}at._$litElement$=!0,at.finalized=!0,nt.litElementHydrateSupport?.({LitElement:at});const dt=nt.litElementPolyfillSupport;dt?.({LitElement:at}),(nt.litElementVersions??=[]).push("4.2.2");const ct=t=>(e,r)=>{void 0!==r?r.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)},lt={attribute:!0,type:String,converter:x,reflect:!1,hasChanged:$},pt=(t=lt,e,r)=>{const{kind:s,metadata:o}=r;let i=globalThis.litPropertyMetadata.get(o);if(void 0===i&&globalThis.litPropertyMetadata.set(o,i=new Map),"setter"===s&&((t=Object.create(t)).wrapped=!0),i.set(r.name,t),"accessor"===s){const{name:s}=r;return{set(r){const o=e.get.call(this);e.set.call(this,r),this.requestUpdate(s,o,t,!0,r)},init(e){return void 0!==e&&this.C(s,void 0,t,e),e}}}if("setter"===s){const{name:s}=r;return function(r){const o=this[s];e.call(this,r),this.requestUpdate(s,o,t,!0,r)}}throw Error("Unsupported decorator location: "+s)};function ht(t){return(e,r)=>"object"==typeof r?pt(t,e,r):((t,e,r)=>{const s=e.hasOwnProperty(r);return e.constructor.createProperty(r,t),s?Object.getOwnPropertyDescriptor(e,r):void 0})(t,e,r)}function ut(t){return ht({...t,state:!0,attribute:!1})}const mt=["LF","RF","LR","RR","SW"],gt={LF:"Front L",RF:"Front R",LR:"Rear L",RR:"Rear R",SW:"Sub"};function vt(t){return{uid:t.uid,name:t.name||t.uid,model:t.model||"",ip:t.ip}}function ft(t){return(t?.units??[]).map(t=>function(t){if("home_theater"===t.kind){const e={LF:null,RF:null,LR:null,RR:null,SW:null};let r;for(const s of t.members)"CC"===s.channel?r=vt(s):s.channel&&mt.includes(s.channel)&&(e[s.channel]=vt(s));return{key:t.primary_uid,name:t.name,kind:t.kind,bar:r,slots:e,tray:[]}}if("stereo_pair"===t.kind){const e=t.members.find(t=>"LF"===t.channel)??t.members[0],r=t.members.find(t=>"RF"===t.channel)??t.members[1],s=t.members.find(t=>"SW"===t.channel)??null;return{key:t.primary_uid,name:t.name,kind:t.kind,pairs:[{L:e?vt(e):null,R:r?vt(r):null,sub:s?vt(s):null}],tray:[]}}return{key:t.primary_uid,name:t.name,kind:t.kind,pairs:[],tray:t.members.map(vt)}}(t))}const _t={home_theater:"Home theater",stereo_pair:"Stereo pair",standalone:"Standalone"},xt={LF:"var(--chorus-front)",RF:"var(--chorus-front)",LR:"var(--chorus-rear)",RR:"var(--chorus-rear)",SW:"var(--chorus-sub)"};let $t=class extends at{constructor(){super(...arguments),this.narrow=!1}get _rooms(){return ft(this.graph)}_room(){const t=this._rooms;if(this._selected){const e=t.find(t=>t.key===this._selected);if(e)return e}return this.narrow?void 0:t[0]}render(){const t=this._rooms;if(!t.length)return B`<div class="empty">No Sonos speakers discovered yet.</div>`;const e=this._room();return B`
      <div class="grid" data-detail=${e?"on":"off"}>
        <div class="col-list">
          <div class="eyebrow">Rooms</div>
          <div class="list">${t.map(t=>this._roomButton(t,e))}</div>
        </div>
        <div class="col-detail">
          ${e?this._detail(e):q}
        </div>
      </div>
    `}_roomButton(t,e){const r=e?.key===t.key;return B`
      <button type="button" class="room ${r?"sel":""}" @click=${()=>this._selected=t.key}>
        <span class="rmeta">
          <b>${t.name}</b>
          <span>${this._roomSummary(t)}</span>
        </span>
        <span class="chev">›</span>
      </button>
    `}_roomSummary(t){if("home_theater"===t.kind){const e=mt.filter(e=>t.slots?.[e]).length;return`Home theater · ${e}.${t.slots?.SW?"1":"0"}`}return"stereo_pair"===t.kind?"Stereo pair":1===(t.tray?.length??0)?"1 speaker":`${t.tray?.length??0} speakers`}_detail(t){return B`
      ${this.narrow?B`<button type="button" class="back" @click=${()=>this._selected=void 0}>‹ All rooms</button>`:q}
      <div class="head">
        <h1>${t.name}</h1>
        <span class="kind">${_t[t.kind]??t.kind}</span>
      </div>
      ${"home_theater"===t.kind?this._htDetail(t):"stereo_pair"===t.kind?this._pairDetail(t):this._soloDetail(t)}
    `}_htDetail(t){return B`
      <div class="stage">
        <div class="bar">${t.bar?t.bar.name:"Soundbar"}</div>
        <div class="prow">${["LF","RF"].map(e=>this._pos(t,e))}</div>
        <div class="seat">Listening position</div>
        <div class="prow">${["LR","RR"].map(e=>this._pos(t,e))}</div>
        <div class="prow sub">${this._pos(t,"SW")}</div>
      </div>
      ${this._availablePanel()}
    `}_pos(t,e){const r=t.slots?.[e]??null;return B`
      <div class="postile ${r?"":"empty"}">
        <span class="pchip" style=${r?`background:${xt[e]}`:q}>${gt[e]}</span>
        ${r?B`<span class="pmeta"><b>${r.name}</b><span>${r.model}</span></span>`:B`<span class="pmeta empty-note">Empty</span>`}
      </div>
    `}_pairDetail(t){const e=t.pairs?.[0];return e?B`
      <div class="paircard">
        ${this._pcSlot("L",e.L)}
        <span class="pc-div">+</span>
        ${this._pcSlot("R",e.R)}
        ${e.sub?B`<span class="pc-sub">Sub · ${e.sub.name}</span>`:q}
      </div>
    `:this._soloDetail(t)}_pcSlot(t,e){return B`
      <div class="pc-slot ${e?"":"empty"}">
        <span class="pc-side">${t}</span>
        ${e?B`<span class="pc-meta"><b>${e.name}</b><span>${e.model}</span></span>`:B`<span class="pc-meta empty-note">Empty</span>`}
      </div>
    `}_soloDetail(t){const e=t.tray??[];return e.length?B`<div class="rows">${e.map(t=>this._speakerRow(t))}</div>`:B`<div class="empty">No speakers in this room.</div>`}_speakerRow(t){return B`
      <div class="row">
        <span class="rx"><b>${t.name}</b><span>${t.model}</span></span>
      </div>
    `}_availablePanel(){const t=function(t){const e=t?.units??[],r=[];for(const t of e)if("standalone"===t.kind)for(const e of t.members)r.push(vt(e));return r}(this.graph);return B`
      <div class="sec">Available speakers</div>
      ${t.length?B`<div class="rows">${t.map(t=>this._speakerRow(t))}</div>`:B`<div class="empty small">Every speaker is in use.</div>`}
    `}};$t.styles=n`
    :host {
      display: block;
      --chorus-front: #2f6fed;
      --chorus-rear: #129d9d;
      --chorus-sub: #6a4bd8;
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
      border-radius: 12px;
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
      padding: 11px 13px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .room + .room {
      border-top: 1px solid var(--divider-color);
    }
    .room:hover {
      background: var(--secondary-background-color);
    }
    .room.sel {
      background: color-mix(in srgb, var(--primary-color) 14%, transparent);
    }
    .rmeta {
      flex: 1;
      min-width: 0;
    }
    .rmeta b {
      display: block;
      font-size: 14px;
      font-weight: 600;
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
      display: none;
      border: none;
      background: none;
      color: var(--primary-color);
      font: inherit;
      font-weight: 600;
      cursor: pointer;
      padding: 0 0 10px;
    }
    .head {
      display: flex;
      align-items: center;
      gap: 10px;
      margin: 0 2px 16px;
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
    .stage {
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
    }
    .bar {
      background: color-mix(in srgb, var(--primary-color) 16%, var(--card-background-color));
      color: var(--primary-color);
      font-weight: 600;
      font-size: 13px;
      border-radius: 10px;
      padding: 10px 40px;
    }
    .seat {
      font-size: 12px;
      color: var(--secondary-text-color);
      padding: 6px 0;
    }
    .prow {
      display: flex;
      gap: 40px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .postile {
      min-width: 150px;
      border-radius: 14px;
      background: var(--card-background-color, var(--ha-card-background));
      box-shadow: var(--ha-card-box-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
      border: 1px solid var(--divider-color);
      padding: 10px 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .postile.empty {
      background: none;
      border: 1.5px dashed var(--divider-color);
      box-shadow: none;
    }
    .pchip {
      align-self: flex-start;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      border-radius: 6px;
      padding: 2px 8px;
      background: var(--secondary-text-color);
    }
    .pmeta b {
      display: block;
      font-size: 14px;
      font-weight: 600;
    }
    .pmeta span {
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .pmeta.empty-note,
    .empty-note {
      color: var(--secondary-text-color);
      font-size: 13px;
    }
    .paircard {
      display: flex;
      align-items: center;
      gap: 16px;
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 16px;
      padding: 16px;
      flex-wrap: wrap;
    }
    .pc-slot {
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 120px;
    }
    .pc-side {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.4px;
      color: var(--secondary-text-color);
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
    .pc-div {
      color: var(--secondary-text-color);
      font-weight: 700;
    }
    .pc-sub {
      font-size: 12px;
      font-weight: 600;
      color: var(--chorus-sub);
      background: color-mix(in srgb, var(--chorus-sub) 15%, transparent);
      border-radius: 999px;
      padding: 5px 12px;
    }
    .sec {
      font-size: 13px;
      font-weight: 700;
      margin: 22px 4px 10px;
    }
    .rows {
      background: var(--card-background-color, var(--ha-card-background));
      border: 1px solid var(--divider-color);
      border-radius: 12px;
      overflow: hidden;
    }
    .row {
      display: flex;
      align-items: center;
      padding: 11px 14px;
    }
    .row + .row {
      border-top: 1px solid var(--divider-color);
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
    .empty.small {
      padding: 16px;
      font-size: 13px;
    }
    @media (max-width: 800px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .grid[data-detail="on"] .col-list {
        display: none;
      }
      .back {
        display: inline-block;
      }
    }
  `,t([ht({attribute:!1})],$t.prototype,"graph",void 0),t([ht({type:Boolean})],$t.prototype,"narrow",void 0),t([ut()],$t.prototype,"_selected",void 0),$t=t([ct("chorus-editor")],$t);const bt={home_theater:"Home theater",stereo_pair:"Stereo pair",standalone:"Standalone"},yt={CC:"Center",LF:"Front L",RF:"Front R",LR:"Rear L",RR:"Rear R",SW:"Sub"},wt={CC:"var(--chorus-cc)",LF:"var(--chorus-front)",RF:"var(--chorus-front)",LR:"var(--chorus-rear)",RR:"var(--chorus-rear)",SW:"var(--chorus-sub)"},At={home_theater:0,stereo_pair:1,standalone:2};let kt=class extends at{constructor(){super(...arguments),this.narrow=!1,this._view="editor",this._loading=!0}firstUpdated(){this._load()}async _load(){this._loading=!0,this._error=void 0;try{this._graph=await this.hass.connection.sendMessagePromise({type:"chorus/bond_graph"})}catch(t){this._error=t?.message||t?.code||"unknown error"}finally{this._loading=!1}}render(){return B`
      <div class="wrap">
        ${this._header()}
        ${"overview"===this._view?this._overview():this._editor()}
      </div>
    `}_header(){const t=this._graph?.units?.length??0;return B`
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
        ${"overview"===this._view&&t?B`<span class="count">${t} unit${1===t?"":"s"}</span>`:q}
        <button class="refresh" @click=${()=>this._load()}>Refresh</button>
      </header>
    `}_editor(){return this._loading&&!this._graph?B`<div class="msg">Reading your speakers…</div>`:this._error?B`<div class="msg err">Couldn't load the speaker graph: ${this._error}</div>`:B`<chorus-editor
      .graph=${this._graph}
      .narrow=${this.narrow}
    ></chorus-editor>`}_overview(){if(this._loading&&!this._graph)return B`<div class="msg">Reading your speakers…</div>`;if(this._error)return B`<div class="msg err">Couldn't load the speaker graph: ${this._error}</div>`;const t=this._graph?.units??[];if(!t.length)return B`<div class="msg">No Sonos speakers discovered yet.</div>`;const e=[...t].sort((t,e)=>(At[t.kind]??9)-(At[e.kind]??9)||(t.name??"").localeCompare(e.name??""));return B`<div class="grid">${e.map(t=>this._card(t))}</div>`}_card(t){return B`
      <div class="card">
        <h2>
          ${t.name||t.primary_uid}
          <span class="kind">${bt[t.kind]??t.kind}</span>
        </h2>
        <div class="members">${t.members.map(t=>this._member(t))}</div>
      </div>
    `}_member(t){const e=t.channel?yt[t.channel]??t.channel:"Speaker",r=t.channel?wt[t.channel]??"var(--chorus-cc)":"",s=[t.model,t.ip].filter(Boolean).join(" · ");return B`
      <div class="member">
        <span
          class="chip ${t.channel?"":"solo"}"
          style=${r?`background:${r}`:q}
          >${e}</span
        >
        <span class="m-main">
          <span class="m-name">${t.name||t.uid}</span>
          ${s?B`<span class="m-sub">${s}</span>`:q}
        </span>
        ${t.invisible?B`<span class="inv">bonded</span>`:q}
      </div>
    `}};kt.styles=n`
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
  `,t([ht({attribute:!1})],kt.prototype,"hass",void 0),t([ht({attribute:!1})],kt.prototype,"narrow",void 0),t([ut()],kt.prototype,"_view",void 0),t([ut()],kt.prototype,"_graph",void 0),t([ut()],kt.prototype,"_error",void 0),t([ut()],kt.prototype,"_loading",void 0),kt=t([ct("chorus-panel")],kt);export{kt as ChorusPanel};
