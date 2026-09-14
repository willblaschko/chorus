function t(t,e,s,r){var i,o=arguments.length,n=o<3?e:null===r?r=Object.getOwnPropertyDescriptor(e,s):r;if("object"==typeof Reflect&&"function"==typeof Reflect.decorate)n=Reflect.decorate(t,e,s,r);else for(var a=t.length-1;a>=0;a--)(i=t[a])&&(n=(o<3?i(n):o>3?i(e,s,n):i(e,s))||n);return o>3&&n&&Object.defineProperty(e,s,n),n}"function"==typeof SuppressedError&&SuppressedError;const e=globalThis,s=e.ShadowRoot&&(void 0===e.ShadyCSS||e.ShadyCSS.nativeShadow)&&"adoptedStyleSheets"in Document.prototype&&"replace"in CSSStyleSheet.prototype,r=Symbol(),i=new WeakMap;let o=class{constructor(t,e,s){if(this._$cssResult$=!0,s!==r)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=t,this.t=e}get styleSheet(){let t=this.o;const e=this.t;if(s&&void 0===t){const s=void 0!==e&&1===e.length;s&&(t=i.get(e)),void 0===t&&((this.o=t=new CSSStyleSheet).replaceSync(this.cssText),s&&i.set(e,t))}return t}toString(){return this.cssText}};const n=s?t=>t:t=>t instanceof CSSStyleSheet?(t=>{let e="";for(const s of t.cssRules)e+=s.cssText;return(t=>new o("string"==typeof t?t:t+"",void 0,r))(e)})(t):t,{is:a,defineProperty:h,getOwnPropertyDescriptor:c,getOwnPropertyNames:l,getOwnPropertySymbols:d,getPrototypeOf:p}=Object,u=globalThis,f=u.trustedTypes,$=f?f.emptyScript:"",_=u.reactiveElementPolyfillSupport,g=(t,e)=>t,v={toAttribute(t,e){switch(e){case Boolean:t=t?$:null;break;case Object:case Array:t=null==t?t:JSON.stringify(t)}return t},fromAttribute(t,e){let s=t;switch(e){case Boolean:s=null!==t;break;case Number:s=null===t?null:Number(t);break;case Object:case Array:try{s=JSON.parse(t)}catch(t){s=null}}return s}},m=(t,e)=>!a(t,e),y={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:m};Symbol.metadata??=Symbol("metadata"),u.litPropertyMetadata??=new WeakMap;let b=class extends HTMLElement{static addInitializer(t){this._$Ei(),(this.l??=[]).push(t)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(t,e=y){if(e.state&&(e.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(t)&&((e=Object.create(e)).wrapped=!0),this.elementProperties.set(t,e),!e.noAccessor){const s=Symbol(),r=this.getPropertyDescriptor(t,s,e);void 0!==r&&h(this.prototype,t,r)}}static getPropertyDescriptor(t,e,s){const{get:r,set:i}=c(this.prototype,t)??{get(){return this[e]},set(t){this[e]=t}};return{get:r,set(e){const o=r?.call(this);i?.call(this,e),this.requestUpdate(t,o,s)},configurable:!0,enumerable:!0}}static getPropertyOptions(t){return this.elementProperties.get(t)??y}static _$Ei(){if(this.hasOwnProperty(g("elementProperties")))return;const t=p(this);t.finalize(),void 0!==t.l&&(this.l=[...t.l]),this.elementProperties=new Map(t.elementProperties)}static finalize(){if(this.hasOwnProperty(g("finalized")))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(g("properties"))){const t=this.properties,e=[...l(t),...d(t)];for(const s of e)this.createProperty(s,t[s])}const t=this[Symbol.metadata];if(null!==t){const e=litPropertyMetadata.get(t);if(void 0!==e)for(const[t,s]of e)this.elementProperties.set(t,s)}this._$Eh=new Map;for(const[t,e]of this.elementProperties){const s=this._$Eu(t,e);void 0!==s&&this._$Eh.set(s,t)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(t){const e=[];if(Array.isArray(t)){const s=new Set(t.flat(1/0).reverse());for(const t of s)e.unshift(n(t))}else void 0!==t&&e.push(n(t));return e}static _$Eu(t,e){const s=e.attribute;return!1===s?void 0:"string"==typeof s?s:"string"==typeof t?t.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(t=>this.enableUpdating=t),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(t=>t(this))}addController(t){(this._$EO??=new Set).add(t),void 0!==this.renderRoot&&this.isConnected&&t.hostConnected?.()}removeController(t){this._$EO?.delete(t)}_$E_(){const t=new Map,e=this.constructor.elementProperties;for(const s of e.keys())this.hasOwnProperty(s)&&(t.set(s,this[s]),delete this[s]);t.size>0&&(this._$Ep=t)}createRenderRoot(){const t=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return((t,r)=>{if(s)t.adoptedStyleSheets=r.map(t=>t instanceof CSSStyleSheet?t:t.styleSheet);else for(const s of r){const r=document.createElement("style"),i=e.litNonce;void 0!==i&&r.setAttribute("nonce",i),r.textContent=s.cssText,t.appendChild(r)}})(t,this.constructor.elementStyles),t}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(t=>t.hostConnected?.())}enableUpdating(t){}disconnectedCallback(){this._$EO?.forEach(t=>t.hostDisconnected?.())}attributeChangedCallback(t,e,s){this._$AK(t,s)}_$ET(t,e){const s=this.constructor.elementProperties.get(t),r=this.constructor._$Eu(t,s);if(void 0!==r&&!0===s.reflect){const i=(void 0!==s.converter?.toAttribute?s.converter:v).toAttribute(e,s.type);this._$Em=t,null==i?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(t,e){const s=this.constructor,r=s._$Eh.get(t);if(void 0!==r&&this._$Em!==r){const t=s.getPropertyOptions(r),i="function"==typeof t.converter?{fromAttribute:t.converter}:void 0!==t.converter?.fromAttribute?t.converter:v;this._$Em=r;const o=i.fromAttribute(e,t.type);this[r]=o??this._$Ej?.get(r)??o,this._$Em=null}}requestUpdate(t,e,s,r=!1,i){if(void 0!==t){const o=this.constructor;if(!1===r&&(i=this[t]),s??=o.getPropertyOptions(t),!((s.hasChanged??m)(i,e)||s.useDefault&&s.reflect&&i===this._$Ej?.get(t)&&!this.hasAttribute(o._$Eu(t,s))))return;this.C(t,e,s)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(t,e,{useDefault:s,reflect:r,wrapped:i},o){s&&!(this._$Ej??=new Map).has(t)&&(this._$Ej.set(t,o??e??this[t]),!0!==i||void 0!==o)||(this._$AL.has(t)||(this.hasUpdated||s||(e=void 0),this._$AL.set(t,e)),!0===r&&this._$Em!==t&&(this._$Eq??=new Set).add(t))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(t){Promise.reject(t)}const t=this.scheduleUpdate();return null!=t&&await t,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(const[t,e]of this._$Ep)this[t]=e;this._$Ep=void 0}const t=this.constructor.elementProperties;if(t.size>0)for(const[e,s]of t){const{wrapped:t}=s,r=this[e];!0!==t||this._$AL.has(e)||void 0===r||this.C(e,void 0,s,r)}}let t=!1;const e=this._$AL;try{t=this.shouldUpdate(e),t?(this.willUpdate(e),this._$EO?.forEach(t=>t.hostUpdate?.()),this.update(e)):this._$EM()}catch(e){throw t=!1,this._$EM(),e}t&&this._$AE(e)}willUpdate(t){}_$AE(t){this._$EO?.forEach(t=>t.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(t)),this.updated(t)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(t){return!0}update(t){this._$Eq&&=this._$Eq.forEach(t=>this._$ET(t,this[t])),this._$EM()}updated(t){}firstUpdated(t){}};b.elementStyles=[],b.shadowRootOptions={mode:"open"},b[g("elementProperties")]=new Map,b[g("finalized")]=new Map,_?.({ReactiveElement:b}),(u.reactiveElementVersions??=[]).push("2.1.2");const x=globalThis,A=t=>t,w=x.trustedTypes,E=w?w.createPolicy("lit-html",{createHTML:t=>t}):void 0,S="$lit$",C=`lit$${Math.random().toFixed(9).slice(2)}$`,k="?"+C,P=`<${k}>`,R=document,O=()=>R.createComment(""),U=t=>null===t||"object"!=typeof t&&"function"!=typeof t,M=Array.isArray,H="[ \t\n\f\r]",T=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,N=/-->/g,z=/>/g,j=RegExp(`>|${H}(?:([^\\s"'>=/]+)(${H}*=${H}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,"g"),L=/'/g,D=/"/g,B=/^(?:script|style|textarea|title)$/i,I=(t=>(e,...s)=>({_$litType$:t,strings:e,values:s}))(1),W=Symbol.for("lit-noChange"),q=Symbol.for("lit-nothing"),F=new WeakMap,V=R.createTreeWalker(R,129);function J(t,e){if(!M(t)||!t.hasOwnProperty("raw"))throw Error("invalid template strings array");return void 0!==E?E.createHTML(e):e}const K=(t,e)=>{const s=t.length-1,r=[];let i,o=2===e?"<svg>":3===e?"<math>":"",n=T;for(let e=0;e<s;e++){const s=t[e];let a,h,c=-1,l=0;for(;l<s.length&&(n.lastIndex=l,h=n.exec(s),null!==h);)l=n.lastIndex,n===T?"!--"===h[1]?n=N:void 0!==h[1]?n=z:void 0!==h[2]?(B.test(h[2])&&(i=RegExp("</"+h[2],"g")),n=j):void 0!==h[3]&&(n=j):n===j?">"===h[0]?(n=i??T,c=-1):void 0===h[1]?c=-2:(c=n.lastIndex-h[2].length,a=h[1],n=void 0===h[3]?j:'"'===h[3]?D:L):n===D||n===L?n=j:n===N||n===z?n=T:(n=j,i=void 0);const d=n===j&&t[e+1].startsWith("/>")?" ":"";o+=n===T?s+P:c>=0?(r.push(a),s.slice(0,c)+S+s.slice(c)+C+d):s+C+(-2===c?e:d)}return[J(t,o+(t[s]||"<?>")+(2===e?"</svg>":3===e?"</math>":"")),r]};class Z{constructor({strings:t,_$litType$:e},s){let r;this.parts=[];let i=0,o=0;const n=t.length-1,a=this.parts,[h,c]=K(t,e);if(this.el=Z.createElement(h,s),V.currentNode=this.el.content,2===e||3===e){const t=this.el.content.firstChild;t.replaceWith(...t.childNodes)}for(;null!==(r=V.nextNode())&&a.length<n;){if(1===r.nodeType){if(r.hasAttributes())for(const t of r.getAttributeNames())if(t.endsWith(S)){const e=c[o++],s=r.getAttribute(t).split(C),n=/([.?@])?(.*)/.exec(e);a.push({type:1,index:i,name:n[2],strings:s,ctor:"."===n[1]?tt:"?"===n[1]?et:"@"===n[1]?st:Y}),r.removeAttribute(t)}else t.startsWith(C)&&(a.push({type:6,index:i}),r.removeAttribute(t));if(B.test(r.tagName)){const t=r.textContent.split(C),e=t.length-1;if(e>0){r.textContent=w?w.emptyScript:"";for(let s=0;s<e;s++)r.append(t[s],O()),V.nextNode(),a.push({type:2,index:++i});r.append(t[e],O())}}}else if(8===r.nodeType)if(r.data===k)a.push({type:2,index:i});else{let t=-1;for(;-1!==(t=r.data.indexOf(C,t+1));)a.push({type:7,index:i}),t+=C.length-1}i++}}static createElement(t,e){const s=R.createElement("template");return s.innerHTML=t,s}}function G(t,e,s=t,r){if(e===W)return e;let i=void 0!==r?s._$Co?.[r]:s._$Cl;const o=U(e)?void 0:e._$litDirective$;return i?.constructor!==o&&(i?._$AO?.(!1),void 0===o?i=void 0:(i=new o(t),i._$AT(t,s,r)),void 0!==r?(s._$Co??=[])[r]=i:s._$Cl=i),void 0!==i&&(e=G(t,i._$AS(t,e.values),i,r)),e}class Q{constructor(t,e){this._$AV=[],this._$AN=void 0,this._$AD=t,this._$AM=e}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(t){const{el:{content:e},parts:s}=this._$AD,r=(t?.creationScope??R).importNode(e,!0);V.currentNode=r;let i=V.nextNode(),o=0,n=0,a=s[0];for(;void 0!==a;){if(o===a.index){let e;2===a.type?e=new X(i,i.nextSibling,this,t):1===a.type?e=new a.ctor(i,a.name,a.strings,this,t):6===a.type&&(e=new rt(i,this,t)),this._$AV.push(e),a=s[++n]}o!==a?.index&&(i=V.nextNode(),o++)}return V.currentNode=R,r}p(t){let e=0;for(const s of this._$AV)void 0!==s&&(void 0!==s.strings?(s._$AI(t,s,e),e+=s.strings.length-2):s._$AI(t[e])),e++}}class X{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(t,e,s,r){this.type=2,this._$AH=q,this._$AN=void 0,this._$AA=t,this._$AB=e,this._$AM=s,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let t=this._$AA.parentNode;const e=this._$AM;return void 0!==e&&11===t?.nodeType&&(t=e.parentNode),t}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(t,e=this){t=G(this,t,e),U(t)?t===q||null==t||""===t?(this._$AH!==q&&this._$AR(),this._$AH=q):t!==this._$AH&&t!==W&&this._(t):void 0!==t._$litType$?this.$(t):void 0!==t.nodeType?this.T(t):(t=>M(t)||"function"==typeof t?.[Symbol.iterator])(t)?this.k(t):this._(t)}O(t){return this._$AA.parentNode.insertBefore(t,this._$AB)}T(t){this._$AH!==t&&(this._$AR(),this._$AH=this.O(t))}_(t){this._$AH!==q&&U(this._$AH)?this._$AA.nextSibling.data=t:this.T(R.createTextNode(t)),this._$AH=t}$(t){const{values:e,_$litType$:s}=t,r="number"==typeof s?this._$AC(t):(void 0===s.el&&(s.el=Z.createElement(J(s.h,s.h[0]),this.options)),s);if(this._$AH?._$AD===r)this._$AH.p(e);else{const t=new Q(r,this),s=t.u(this.options);t.p(e),this.T(s),this._$AH=t}}_$AC(t){let e=F.get(t.strings);return void 0===e&&F.set(t.strings,e=new Z(t)),e}k(t){M(this._$AH)||(this._$AH=[],this._$AR());const e=this._$AH;let s,r=0;for(const i of t)r===e.length?e.push(s=new X(this.O(O()),this.O(O()),this,this.options)):s=e[r],s._$AI(i),r++;r<e.length&&(this._$AR(s&&s._$AB.nextSibling,r),e.length=r)}_$AR(t=this._$AA.nextSibling,e){for(this._$AP?.(!1,!0,e);t!==this._$AB;){const e=A(t).nextSibling;A(t).remove(),t=e}}setConnected(t){void 0===this._$AM&&(this._$Cv=t,this._$AP?.(t))}}class Y{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(t,e,s,r,i){this.type=1,this._$AH=q,this._$AN=void 0,this.element=t,this.name=e,this._$AM=r,this.options=i,s.length>2||""!==s[0]||""!==s[1]?(this._$AH=Array(s.length-1).fill(new String),this.strings=s):this._$AH=q}_$AI(t,e=this,s,r){const i=this.strings;let o=!1;if(void 0===i)t=G(this,t,e,0),o=!U(t)||t!==this._$AH&&t!==W,o&&(this._$AH=t);else{const r=t;let n,a;for(t=i[0],n=0;n<i.length-1;n++)a=G(this,r[s+n],e,n),a===W&&(a=this._$AH[n]),o||=!U(a)||a!==this._$AH[n],a===q?t=q:t!==q&&(t+=(a??"")+i[n+1]),this._$AH[n]=a}o&&!r&&this.j(t)}j(t){t===q?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,t??"")}}class tt extends Y{constructor(){super(...arguments),this.type=3}j(t){this.element[this.name]=t===q?void 0:t}}class et extends Y{constructor(){super(...arguments),this.type=4}j(t){this.element.toggleAttribute(this.name,!!t&&t!==q)}}class st extends Y{constructor(t,e,s,r,i){super(t,e,s,r,i),this.type=5}_$AI(t,e=this){if((t=G(this,t,e,0)??q)===W)return;const s=this._$AH,r=t===q&&s!==q||t.capture!==s.capture||t.once!==s.once||t.passive!==s.passive,i=t!==q&&(s===q||r);r&&this.element.removeEventListener(this.name,this,s),i&&this.element.addEventListener(this.name,this,t),this._$AH=t}handleEvent(t){"function"==typeof this._$AH?this._$AH.call(this.options?.host??this.element,t):this._$AH.handleEvent(t)}}class rt{constructor(t,e,s){this.element=t,this.type=6,this._$AN=void 0,this._$AM=e,this.options=s}get _$AU(){return this._$AM._$AU}_$AI(t){G(this,t)}}const it=x.litHtmlPolyfillSupport;it?.(Z,X),(x.litHtmlVersions??=[]).push("3.3.3");const ot=globalThis;class nt extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){const t=super.createRenderRoot();return this.renderOptions.renderBefore??=t.firstChild,t}update(t){const e=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(t),this._$Do=((t,e,s)=>{const r=s?.renderBefore??e;let i=r._$litPart$;if(void 0===i){const t=s?.renderBefore??null;r._$litPart$=i=new X(e.insertBefore(O(),t),t,void 0,s??{})}return i._$AI(t),i})(e,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return W}}nt._$litElement$=!0,nt.finalized=!0,ot.litElementHydrateSupport?.({LitElement:nt});const at=ot.litElementPolyfillSupport;at?.({LitElement:nt}),(ot.litElementVersions??=[]).push("4.2.2");const ht={attribute:!0,type:String,converter:v,reflect:!1,hasChanged:m},ct=(t=ht,e,s)=>{const{kind:r,metadata:i}=s;let o=globalThis.litPropertyMetadata.get(i);if(void 0===o&&globalThis.litPropertyMetadata.set(i,o=new Map),"setter"===r&&((t=Object.create(t)).wrapped=!0),o.set(s.name,t),"accessor"===r){const{name:r}=s;return{set(s){const i=e.get.call(this);e.set.call(this,s),this.requestUpdate(r,i,t,!0,s)},init(e){return void 0!==e&&this.C(r,void 0,t,e),e}}}if("setter"===r){const{name:r}=s;return function(s){const i=this[r];e.call(this,s),this.requestUpdate(r,i,t,!0,s)}}throw Error("Unsupported decorator location: "+r)};function lt(t){return(e,s)=>"object"==typeof s?ct(t,e,s):((t,e,s)=>{const r=e.hasOwnProperty(s);return e.constructor.createProperty(s,t),r?Object.getOwnPropertyDescriptor(e,s):void 0})(t,e,s)}function dt(t){return lt({...t,state:!0,attribute:!1})}const pt={home_theater:"Home theater",stereo_pair:"Stereo pair",standalone:"Standalone"},ut={CC:"Center",LF:"Front L",RF:"Front R",LR:"Rear L",RR:"Rear R",SW:"Sub"},ft={CC:"var(--chorus-cc)",LF:"var(--chorus-front)",RF:"var(--chorus-front)",LR:"var(--chorus-rear)",RR:"var(--chorus-rear)",SW:"var(--chorus-sub)"},$t={home_theater:0,stereo_pair:1,standalone:2};let _t=class extends nt{constructor(){super(...arguments),this.narrow=!1,this._view="editor",this._loading=!0}firstUpdated(){this._load()}async _load(){this._loading=!0,this._error=void 0;try{this._graph=await this.hass.connection.sendMessagePromise({type:"chorus/bond_graph"})}catch(t){this._error=t?.message||t?.code||"unknown error"}finally{this._loading=!1}}render(){return I`
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
        ${"overview"===this._view&&t?I`<span class="count">${t} unit${1===t?"":"s"}</span>`:q}
        <button class="refresh" @click=${()=>this._load()}>Refresh</button>
      </header>
    `}_editor(){return I`
      <div class="msg">
        <b>Editor coming next.</b>
        <span
          >The drag-and-drop room editor will live here. For now, open
          <button class="link" @click=${()=>this._view="overview"}>Overview</button>
          to see your live speaker layout.</span
        >
      </div>
    `}_overview(){if(this._loading&&!this._graph)return I`<div class="msg">Reading your speakers…</div>`;if(this._error)return I`<div class="msg err">Couldn't load the speaker graph: ${this._error}</div>`;const t=this._graph?.units??[];if(!t.length)return I`<div class="msg">No Sonos speakers discovered yet.</div>`;const e=[...t].sort((t,e)=>($t[t.kind]??9)-($t[e.kind]??9)||(t.name??"").localeCompare(e.name??""));return I`<div class="grid">${e.map(t=>this._card(t))}</div>`}_card(t){return I`
      <div class="card">
        <h2>
          ${t.name||t.primary_uid}
          <span class="kind">${pt[t.kind]??t.kind}</span>
        </h2>
        <div class="members">${t.members.map(t=>this._member(t))}</div>
      </div>
    `}_member(t){const e=t.channel?ut[t.channel]??t.channel:"Speaker",s=t.channel?ft[t.channel]??"var(--chorus-cc)":"",r=[t.model,t.ip].filter(Boolean).join(" · ");return I`
      <div class="member">
        <span
          class="chip ${t.channel?"":"solo"}"
          style=${s?`background:${s}`:q}
          >${e}</span
        >
        <span class="m-main">
          <span class="m-name">${t.name||t.uid}</span>
          ${r?I`<span class="m-sub">${r}</span>`:q}
        </span>
        ${t.invisible?I`<span class="inv">bonded</span>`:q}
      </div>
    `}};_t.styles=((t,...e)=>{const s=1===t.length?t[0]:e.reduce((e,s,r)=>e+(t=>{if(!0===t._$cssResult$)return t.cssText;if("number"==typeof t)return t;throw Error("Value passed to 'css' function must be a 'css' function result: "+t+". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.")})(s)+t[r+1],t[0]);return new o(s,t,r)})`
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
  `,t([lt({attribute:!1})],_t.prototype,"hass",void 0),t([lt({attribute:!1})],_t.prototype,"narrow",void 0),t([dt()],_t.prototype,"_view",void 0),t([dt()],_t.prototype,"_graph",void 0),t([dt()],_t.prototype,"_error",void 0),t([dt()],_t.prototype,"_loading",void 0),_t=t([(t=>(e,s)=>{void 0!==s?s.addInitializer(()=>{customElements.define(t,e)}):customElements.define(t,e)})("chorus-panel")],_t);export{_t as ChorusPanel};
