// Chorus — sidebar panel (v0.2 shell).
// Renders the live bond graph the coordinator parsed from ZoneGroupState. This is
// the read-only foundation; the drag/drop + tap-to-assign editor wires onto the
// same data + the chorus.* services next.

const CHANNELS = {
  CC: { label: "Center", tint: "var(--chorus-cc)" },
  LF: { label: "Front L", tint: "var(--chorus-front)" },
  RF: { label: "Front R", tint: "var(--chorus-front)" },
  LR: { label: "Rear L", tint: "var(--chorus-rear)" },
  RR: { label: "Rear R", tint: "var(--chorus-rear)" },
  SW: { label: "Sub", tint: "var(--chorus-sub)" },
};

const KIND = {
  home_theater: "Home theater",
  stereo_pair: "Stereo pair",
  standalone: "Standalone",
};

const esc = (s) =>
  String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));

const STYLE = `
:host { display:block; color:var(--primary-text-color); font-family:var(--paper-font-body1_-_font-family, Roboto, sans-serif); }
.wrap { max-width:1000px; margin:0 auto; padding:16px 16px 48px; }
header { display:flex; align-items:baseline; gap:12px; margin:8px 4px 20px; flex-wrap:wrap; }
h1 { font-size:22px; font-weight:600; margin:0; letter-spacing:.2px; }
.tag { color:var(--secondary-text-color); font-size:13px; }
.spacer { flex:1 1 auto; }
button.refresh {
  border:1px solid var(--divider-color); background:var(--card-background-color);
  color:var(--primary-text-color); border-radius:20px; padding:6px 14px; font-size:13px;
  cursor:pointer; transition:background .15s;
}
button.refresh:hover { background:var(--secondary-background-color); }
.grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; }
.card {
  background:var(--card-background-color, var(--ha-card-background)); border-radius:12px;
  border:1px solid var(--divider-color); padding:14px 16px;
  box-shadow:var(--ha-card-box-shadow, 0 1px 3px rgba(0,0,0,.08));
}
.card h2 { font-size:16px; font-weight:600; margin:0 0 2px; display:flex; align-items:center; gap:8px; }
.kind { font-size:11px; text-transform:uppercase; letter-spacing:.5px; color:var(--secondary-text-color);
  border:1px solid var(--divider-color); border-radius:10px; padding:1px 7px; font-weight:600; }
.members { margin-top:12px; display:flex; flex-direction:column; gap:8px; }
.member { display:flex; align-items:center; gap:10px; }
.chip { font-size:11px; font-weight:700; letter-spacing:.3px; color:#fff; border-radius:6px;
  padding:2px 7px; min-width:52px; text-align:center; }
.chip.solo { background:var(--secondary-text-color); }
.m-main { display:flex; flex-direction:column; min-width:0; }
.m-name { font-size:14px; font-weight:500; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
.m-sub { font-size:12px; color:var(--secondary-text-color); }
.inv { font-size:11px; color:var(--secondary-text-color); border:1px solid var(--divider-color);
  border-radius:8px; padding:0 6px; margin-left:auto; }
.msg { padding:40px 8px; text-align:center; color:var(--secondary-text-color); font-size:15px; }
.msg.err { color:var(--error-color, #d32f2f); }
.count { color:var(--secondary-text-color); font-size:13px; }
:host {
  --chorus-front:#2f6fed; --chorus-rear:#129d9d; --chorus-sub:#6a4bd8; --chorus-cc:#8a8f98;
}
`;

class ChorusPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._data = null;
    this._error = null;
    this._loading = true;
    this._started = false;
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._started) {
      this._started = true;
      this._render();
      this._load();
    }
  }

  async _load() {
    this._loading = true;
    this._error = null;
    this._render();
    try {
      const res = await this._hass.connection.sendMessagePromise({
        type: "chorus/bond_graph",
      });
      this._data = res || { units: [], players: [] };
      this._loading = false;
    } catch (e) {
      this._error = (e && (e.message || e.code)) || "unknown error";
      this._loading = false;
    }
    this._render();
  }

  _header(units) {
    const n = units ? units.length : 0;
    return `<header>
      <h1>Chorus</h1>
      <span class="tag">Sonos speaker manager</span>
      <span class="spacer"></span>
      ${n ? `<span class="count">${n} unit${n === 1 ? "" : "s"}</span>` : ""}
      <button class="refresh" id="refresh">Refresh</button>
    </header>`;
  }

  _memberRow(m) {
    const ch = CHANNELS[m.channel];
    const chip = ch
      ? `<span class="chip" style="background:${ch.tint}">${esc(ch.label)}</span>`
      : `<span class="chip solo">Speaker</span>`;
    const sub = [m.model, m.ip].filter(Boolean).map(esc).join(" · ");
    return `<div class="member">
      ${chip}
      <span class="m-main">
        <span class="m-name">${esc(m.name || m.uid)}</span>
        ${sub ? `<span class="m-sub">${sub}</span>` : ""}
      </span>
      ${m.invisible ? `<span class="inv">bonded</span>` : ""}
    </div>`;
  }

  _card(u) {
    return `<div class="card">
      <h2>${esc(u.name || u.primary_uid)} <span class="kind">${esc(KIND[u.kind] || u.kind)}</span></h2>
      <div class="members">${(u.members || []).map((m) => this._memberRow(m)).join("")}</div>
    </div>`;
  }

  _body() {
    if (this._loading) return this._header(null) + `<div class="msg">Reading your speakers…</div>`;
    if (this._error)
      return this._header(null) + `<div class="msg err">Couldn't load the speaker graph: ${esc(this._error)}</div>`;
    const units = (this._data && this._data.units) || [];
    if (!units.length)
      return this._header(units) + `<div class="msg">No Sonos speakers discovered yet.</div>`;
    // Bonded units (HT/pairs) first, standalones after — the interesting stuff on top.
    const order = { home_theater: 0, stereo_pair: 1, standalone: 2 };
    const sorted = [...units].sort(
      (a, b) => (order[a.kind] ?? 9) - (order[b.kind] ?? 9) || String(a.name).localeCompare(b.name)
    );
    return this._header(units) + `<div class="grid">${sorted.map((u) => this._card(u)).join("")}</div>`;
  }

  _render() {
    this.shadowRoot.innerHTML = `<style>${STYLE}</style><div class="wrap">${this._body()}</div>`;
    const btn = this.shadowRoot.getElementById("refresh");
    if (btn) btn.onclick = () => this._load();
  }
}

customElements.define("chorus-panel", ChorusPanel);
