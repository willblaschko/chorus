import { LitElement, html, css, nothing, type TemplateResult, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { BondGraph, HomeAssistant } from "./types.js";
import {
  buildRooms,
  positionAccepts,
  canPair,
  isSub,
  isBar,
  CHANNELS,
  CHANNEL_NAME,
  type Channel,
  type Room,
  type HTLayout,
  type EditorPair,
  type EditorSpeaker,
} from "./model.js";
import { iconFor, shortModel } from "./icons.js";
import { TV_ART, COUCH_ART } from "./art.js";
import {
  roomsToLayout,
  assignToChannel,
  clearChannel,
  createPair,
  separatePair,
  swapPair,
  dissolveHT,
  moveSpeaker,
  addSubToPair,
  removeSubFromPair,
  setupHT,
} from "./layout.js";
import { planChanges, applyPlan, isEmpty } from "./staged.js";
import "./chorus-changebar.js";
import "./chorus-toast.js";
import "./chorus-menu.js";
import "./chorus-audio.js";
import type { ChangeRow } from "./chorus-changebar.js";
import type { MenuItem } from "./chorus-menu.js";
import type { AudioControl } from "./chorus-audio.js";

// Sonos audio settings exposed by HA as number.<slug>_<key> / switch.<slug>_<key>.
// Only the ones that actually exist for a given speaker are shown.
const AUDIO_SPEC: Array<{ key: string; label: string; group: string; toggle?: boolean }> = [
  { key: "bass", label: "Bass", group: "EQ" },
  { key: "treble", label: "Treble", group: "EQ" },
  { key: "loudness", label: "Loudness", group: "EQ", toggle: true },
  { key: "sub_gain", label: "Sub level", group: "Surround & sub" },
  { key: "subwoofer_enabled", label: "Subwoofer", group: "Surround & sub", toggle: true },
  { key: "surround_level", label: "Surround level", group: "Surround & sub" },
  { key: "surround_enabled", label: "Surround", group: "Surround & sub", toggle: true },
  { key: "night_sound", label: "Night sound", group: "TV audio", toggle: true },
  { key: "speech_enhancement", label: "Speech enhancement", group: "TV audio", toggle: true },
  { key: "audio_delay", label: "Audio delay", group: "TV audio" },
  { key: "crossfade", label: "Crossfade", group: "Playback", toggle: true },
  { key: "balance", label: "Balance", group: "Playback" },
];

const slugify = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const CH_TINT: Record<Channel, string> = {
  LF: "t-front",
  RF: "t-front",
  LR: "t-rear",
  RR: "t-rear",
  SW: "t-sub",
};

/**
 * The primary editor: rooms grouped by HA Area, a spatial home-theater stage, and
 * interactive editing. Tap an empty channel to assign a speaker from the room; tap
 * the × to remove one; separate a pair. Edits stage locally (nothing hits Sonos)
 * and surface in the change bar; Apply pushes them via the chorus.* services.
 */
@customElement("chorus-editor")
export class ChorusEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;
  @property({ attribute: false }) public graph?: BondGraph;
  @property({ type: Boolean }) public narrow = false;

  @state() private _selected?: string;
  @state() private _working?: Room[]; // staged edits (undefined until synced from graph)
  @state() private _dirty = false;
  @state() private _applying = false;
  @state() private _rows: ChangeRow[] = []; // live rows during apply
  @state() private _picker?: { roomKey: string; ch: Channel };
  @state() private _pairPick?: { roomKey: string; first?: string };
  private _drag?: { uid: string; roomKey: string; model: string };
  @state() private _menu?: { heading: string; items: MenuItem[]; onSelect: (id: string) => void };
  @state() private _audio?: { heading: string; controls: AudioControl[] };
  @state() private _movePick?: string; // uid of the speaker being moved
  @state() private _subPick?: { roomKey: string; pairIndex: number };
  @state() private _renameFor?: { uid: string; current: string };

  protected override willUpdate(changed: PropertyValues): void {
    // Sync the working model from the live graph — but never clobber staged edits
    // (the coordinator refreshes every 30s; that must not wipe your in-progress work).
    if ((changed.has("graph") && !this._dirty) || this._working === undefined) {
      this._working = structuredClone(buildRooms(this.graph));
    }
  }

  private get _rooms(): Room[] {
    return this._working ?? buildRooms(this.graph);
  }

  private _room(): Room | undefined {
    const rooms = this._rooms;
    if (this._selected) {
      const found = rooms.find((r) => r.key === this._selected);
      if (found) return found;
    }
    return this.narrow ? undefined : rooms[0];
  }

  // ---- staged plan + apply -------------------------------------------
  private _plan() {
    const base = roomsToLayout(buildRooms(this.graph));
    const working = roomsToLayout(this._rooms);
    return planChanges(base, working);
  }

  private _toast(message: string): void {
    const el = this.shadowRoot?.querySelector("chorus-toast") as
      | { show(m: string): void }
      | null;
    el?.show(message);
  }

  private _assign(roomKey: string, ch: Channel, sp: EditorSpeaker): void {
    this._working = assignToChannel(this._rooms, roomKey, ch, sp.uid);
    this._dirty = true;
    this._picker = undefined;
    this._toast(`${this._name(sp)} → ${CHANNEL_NAME[ch]}`);
  }

  // ---- drag & drop (desktop; tap-to-assign remains for touch) ---------
  private _canDrop(r: Room, ch: Channel): boolean {
    return !!this._drag && this._drag.roomKey === r.key && positionAccepts(ch, this._drag.model);
  }

  private _dropOnChannel(r: Room, ch: Channel): void {
    if (!this._canDrop(r, ch)) return;
    const sp = r.tray.find((s) => s.uid === this._drag!.uid);
    this._drag = undefined;
    if (sp) this._assign(r.key, ch, sp);
  }

  private _onDragOver(e: DragEvent, r: Room, ch: Channel): void {
    if (this._canDrop(r, ch)) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).classList.add("over");
    }
  }

  private _onDrop(e: DragEvent, r: Room, ch: Channel): void {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove("over");
    this._dropOnChannel(r, ch);
  }

  private _clear(roomKey: string, ch: Channel, sp: EditorSpeaker): void {
    this._working = clearChannel(this._rooms, roomKey, ch);
    this._dirty = true;
    this._toast(`${sp.name} removed from ${CHANNEL_NAME[ch]}`);
  }

  private _separate(roomKey: string, index: number): void {
    this._working = separatePair(this._rooms, roomKey, index);
    this._dirty = true;
    this._toast("Stereo pair separated");
  }

  private _pickPairMember(sp: EditorSpeaker): void {
    if (!this._pairPick) return;
    const { roomKey, first } = this._pairPick;
    if (!first) {
      this._pairPick = { roomKey, first: sp.uid }; // pick the partner next
      return;
    }
    if (sp.uid === first) return;
    this._working = createPair(this._rooms, roomKey, first, sp.uid);
    this._dirty = true;
    this._pairPick = undefined;
    this._toast("Stereo pair created");
  }

  // ---- ••• menus ------------------------------------------------------
  private _onMenuSelect = (e: Event): void => {
    const m = this._menu;
    this._menu = undefined;
    m?.onSelect((e as CustomEvent).detail as string);
  };

  private _openRoomMenu(r: Room): void {
    const items: MenuItem[] = [];
    if (r.ht) {
      items.push({ id: "audio", label: "Audio settings" });
      items.push({ id: "dissolve", label: "Separate home theater", danger: true });
    }
    if (!items.length) return;
    this._menu = {
      heading: r.name,
      items,
      onSelect: (id) => {
        if (id === "audio") {
          this._openAudio(r.ht!.bar.name);
        } else if (id === "dissolve") {
          this._working = dissolveHT(this._rooms, r.key);
          this._dirty = true;
          this._toast("Home theater separated");
        }
      },
    };
  }

  private _openPairMenu(r: Room, index: number): void {
    const hasSub = !!r.pairs[index]?.sub;
    this._menu = {
      heading: "Stereo pair",
      items: [
        { id: "audio", label: "Audio settings" },
        hasSub ? { id: "removesub", label: "Remove sub" } : { id: "addsub", label: "Add a sub…" },
        { id: "swap", label: "Swap L / R" },
        { id: "separate", label: "Separate pair", danger: true },
      ],
      onSelect: (id) => {
        if (id === "audio") {
          this._openAudio(r.pairs[index]?.L?.name ?? r.name);
        } else if (id === "addsub") {
          this._subPick = { roomKey: r.key, pairIndex: index };
        } else if (id === "removesub") {
          this._working = removeSubFromPair(this._rooms, r.key, index);
          this._dirty = true;
          this._toast("Sub removed");
        } else if (id === "swap") {
          this._working = swapPair(this._rooms, r.key, index);
          this._dirty = true;
          this._toast("Swapped L / R");
        } else if (id === "separate") {
          this._separate(r.key, index);
        }
      },
    };
  }

  private _doAddSub(roomKey: string, pairIndex: number, sub: EditorSpeaker): void {
    this._working = addSubToPair(this._rooms, roomKey, pairIndex, sub.uid);
    this._dirty = true;
    this._subPick = undefined;
    this._toast(`${this._name(sub)} → Sub`);
  }

  private _subOverlay(): TemplateResult | typeof nothing {
    if (!this._subPick) return nothing;
    const { roomKey, pairIndex } = this._subPick;
    const currentSub = this._rooms.find((r) => r.key === roomKey)?.pairs[pairIndex]?.sub?.uid;
    // Subs that addSubToPair can relocate: lone (tray) subs + subs bonded to other pairs.
    const subs: Array<{ sp: EditorSpeaker; where: string }> = [];
    for (const r of this._rooms) {
      for (const s of r.tray) if (isSub(s.model) && s.uid !== currentSub) subs.push({ sp: s, where: `${r.name} · available` });
      for (const p of r.pairs) if (p.sub && isSub(p.sub.model) && p.sub.uid !== currentSub) subs.push({ sp: p.sub, where: `${r.name} · paired` });
    }
    return html`
      <div class="backdrop" @click=${() => (this._subPick = undefined)}>
        <div class="sheet" @click=${(e: Event) => e.stopPropagation()}>
          <div class="sheet-h">Add a sub</div>
          ${subs.length
            ? subs.map(
                ({ sp, where }) => html`
                  <button type="button" class="sheet-item" @click=${() => this._doAddSub(roomKey, pairIndex, sp)}>
                    <span class="rt">${iconFor(sp.model)}</span>
                    <span class="rx"><b>${this._name(sp)}</b><span>${where}</span></span>
                  </button>
                `
              )
            : html`<div class="sheet-empty">No sub available to add.</div>`}
          <button type="button" class="sheet-cancel" @click=${() => (this._subPick = undefined)}>Cancel</button>
        </div>
      </div>
    `;
  }

  private _openSpeakerMenu(s: EditorSpeaker): void {
    this._menu = {
      heading: this._name(s),
      items: [
        { id: "identify", label: "Identify" },
        { id: "rename", label: "Rename…" },
        { id: "move", label: "Move to another room…" },
      ],
      onSelect: (id) => {
        if (id === "identify") this._toast(`Chiming on ${this._name(s)}`);
        else if (id === "rename") this._renameFor = { uid: s.uid, current: this._name(s) };
        else if (id === "move") this._movePick = s.uid;
      },
    };
  }

  private _doRename(): void {
    const input = this.shadowRoot?.querySelector(".rename-input") as HTMLInputElement | null;
    const value = input?.value.trim();
    const target = this._renameFor;
    this._renameFor = undefined;
    if (!target || !value || value === target.current) return;
    // Applies immediately (renames the Sonos zone); then reload so the name shows.
    void this.hass.callService("chorus", "rename", { speaker: target.uid, name: value });
    this._toast(`Renamed to ${value}`);
    this.dispatchEvent(new CustomEvent("chorus-refresh", { bubbles: true, composed: true }));
  }

  private _renameOverlay(): TemplateResult | typeof nothing {
    if (!this._renameFor) return nothing;
    return html`
      <div class="backdrop" @click=${() => (this._renameFor = undefined)}>
        <div class="sheet" @click=${(e: Event) => e.stopPropagation()}>
          <div class="sheet-h">Rename speaker</div>
          <input
            class="rename-input"
            type="text"
            .value=${this._renameFor.current}
            @keydown=${(e: KeyboardEvent) => {
              if (e.key === "Enter") this._doRename();
            }}
          />
          <div class="rename-btns">
            <button type="button" class="sheet-cancel" @click=${() => (this._renameFor = undefined)}>
              Cancel
            </button>
            <button type="button" class="rename-save" @click=${() => this._doRename()}>Save</button>
          </div>
        </div>
      </div>
    `;
  }

  private _doMove(uid: string, target: string): void {
    this._working = moveSpeaker(this._rooms, uid, target);
    this._dirty = true;
    this._movePick = undefined;
    this._toast(`Moved to ${target}`);
  }

  private _moveOverlay(): TemplateResult | typeof nothing {
    if (!this._movePick) return nothing;
    const uid = this._movePick;
    const current = this._rooms.find((r) => r.tray.some((s) => s.uid === uid));
    const names = new Set<string>();
    for (const r of this._rooms) names.add(r.name);
    for (const a of this.graph?.areas ?? []) names.add(a);
    if (current) names.delete(current.name);
    const targets = [...names].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    return html`
      <div class="backdrop" @click=${() => (this._movePick = undefined)}>
        <div class="sheet" @click=${(e: Event) => e.stopPropagation()}>
          <div class="sheet-h">Move to another room</div>
          ${targets.length
            ? targets.map(
                (name) => html`
                  <button type="button" class="sheet-item" @click=${() => this._doMove(uid, name)}>
                    <span class="rx"><b>${name}</b></span>
                  </button>
                `
              )
            : html`<div class="sheet-empty">No other rooms available.</div>`}
          <button type="button" class="sheet-cancel" @click=${() => (this._movePick = undefined)}>
            Cancel
          </button>
        </div>
      </div>
    `;
  }

  private _openAudio(name: string): void {
    const slug = slugify(name);
    const controls: AudioControl[] = [];
    for (const spec of AUDIO_SPEC) {
      const eid = `${spec.toggle ? "switch" : "number"}.${slug}_${spec.key}`;
      const ent = this.hass?.states?.[eid];
      if (!ent || ent.state === "unavailable" || ent.state === "unknown") continue;
      if (spec.toggle) {
        controls.push({
          id: eid,
          kind: "toggle",
          label: spec.label,
          group: spec.group,
          value: ent.state === "on",
        });
      } else {
        const a = ent.attributes as { min?: number; max?: number; step?: number };
        controls.push({
          id: eid,
          kind: "slider",
          label: spec.label,
          group: spec.group,
          value: Number(ent.state),
          min: a.min ?? 0,
          max: a.max ?? 100,
          step: a.step ?? 1,
        });
      }
    }
    if (!controls.length) {
      this._toast("No audio settings available for this speaker");
      return;
    }
    this._audio = { heading: `${name} · Audio`, controls };
  }

  private _onAudioChange = (e: Event): void => {
    const { id, value } = (e as CustomEvent).detail as { id: string; value: number | boolean };
    if (typeof value === "boolean") {
      void this.hass.callService("switch", value ? "turn_on" : "turn_off", { entity_id: id });
    } else {
      void this.hass.callService("number", "set_value", { entity_id: id, value });
    }
    // Optimistic local update so the sheet reflects the change immediately.
    if (this._audio) {
      this._audio = {
        ...this._audio,
        controls: this._audio.controls.map((c) => (c.id === id ? { ...c, value } : c)),
      };
    }
  };

  private _dots(onClick: (e: Event) => void): TemplateResult {
    return html`<button
      type="button"
      class="dots"
      title="Options"
      aria-label="Options"
      @click=${(e: Event) => {
        e.stopPropagation();
        onClick(e);
      }}
    >
      ⋯
    </button>`;
  }

  private _discard(): void {
    this._working = structuredClone(buildRooms(this.graph));
    this._dirty = false;
    this._picker = undefined;
    this._toast("Changes discarded");
  }

  private async _apply(): Promise<void> {
    const plan = this._plan();
    if (isEmpty(plan) || this._applying) return;
    this._applying = true;
    this._rows = plan.rows;
    await applyPlan(this.hass, plan, (rows) => {
      this._rows = [...rows];
    });
    // The service calls have returned, but Sonos keeps re-syncing for a beat after.
    // Wait for the live topology to actually converge to what we asked for before
    // reporting done — mirror what the Sonos app does.
    const intended = this._bondSignature(roomsToLayout(this._rooms));
    const fresh = await this._awaitConvergence(intended);
    const failed = this._rows.filter((r) => r.status === "error").length;
    this._applying = false;
    this._dirty = false;
    if (fresh) {
      // Push the settled graph straight to the panel (no extra round-trip).
      this.dispatchEvent(
        new CustomEvent("chorus-graph", { detail: fresh, bubbles: true, composed: true })
      );
    } else {
      this.dispatchEvent(new CustomEvent("chorus-refresh", { bubbles: true, composed: true }));
    }
    this._toast(failed ? `Applied with ${failed} error${failed === 1 ? "" : "s"}` : "Applied");
  }

  // A stable fingerprint of the bonding topology (each speaker's role + anchor),
  // ignoring names/rooms — so convergence tracks the actual bonds, not transient labels.
  private _bondSignature(map: ReturnType<typeof roomsToLayout>): string {
    return Object.keys(map)
      .sort()
      .map((u) => `${u}:${map[u].role}:${map[u].anchorUid}`)
      .join(";");
  }

  // Full-graph fingerprint: every speaker's channel + NAME + membership. Changes
  // while the device is still cycling (names resolving, removed speakers reappearing
  // as standalones), so "unchanged" == truly settled. Measured: a 2×2 front swap's
  // topology is right at ~9s but the graph doesn't stop changing until ~53s.
  private _fullSignature(graph: BondGraph): string {
    const parts: string[] = [];
    for (const u of graph.units ?? []) {
      for (const m of u.members) parts.push(`${m.uid}:${m.channel ?? "-"}:${m.name ?? ""}`);
    }
    return parts.sort().join(";");
  }

  // Re-discover until the live bonding matches `intended` AND the full graph has been
  // STABLE across two consecutive polls (no more transitions), or the budget runs out.
  private async _awaitConvergence(intended: string): Promise<BondGraph | undefined> {
    let last: BondGraph | undefined;
    let prevFull = " "; // sentinel so the first poll can never count as "stable"
    for (let i = 0; i < 24; i++) {
      let fresh: BondGraph;
      try {
        fresh = await this.hass.connection.sendMessagePromise<BondGraph>({ type: "chorus/refresh" });
      } catch {
        return last;
      }
      last = fresh;
      const topo = this._bondSignature(roomsToLayout(buildRooms(fresh)));
      const full = this._fullSignature(fresh);
      if (topo === intended && full === prevFull) return fresh; // settled: matched + stable
      prevFull = full;
      await new Promise((r) => window.setTimeout(r, 1000));
    }
    return last;
  }

  // Never show a raw "RINCON_…" UID: fall back to the model while a name resolves.
  private _name(sp: EditorSpeaker): string {
    return sp.name && !/^RINCON_/i.test(sp.name) ? sp.name : shortModel(sp.model) || "Speaker";
  }

  public override render(): TemplateResult {
    const rooms = this._rooms;
    if (!rooms.length) {
      return html`<div class="empty">No Sonos speakers discovered yet.</div>
        <chorus-toast></chorus-toast>`;
    }
    const room = this._room();
    const plan = this._plan();
    const rows = this._applying ? this._rows : plan.rows;
    return html`
      <div class="grid ${this._applying ? "locked" : ""}" data-detail=${room ? "on" : "off"}>
        <div class="col-list">
          <div class="eyebrow">Rooms</div>
          <div class="list">${rooms.map((r) => this._roomButton(r, room))}</div>
        </div>
        <div class="col-detail">${room ? this._detail(room) : nothing}</div>
      </div>
      ${this._applying
        ? html`<div class="settling">Finishing up… this can take up to a minute.</div>`
        : nothing}
      ${this._pickerOverlay()}
      ${this._pairOverlay()}
      ${this._moveOverlay()}
      ${this._subOverlay()}
      ${this._renameOverlay()}
      <chorus-menu
        .open=${!!this._menu}
        .heading=${this._menu?.heading ?? ""}
        .items=${this._menu?.items ?? []}
        @select=${this._onMenuSelect}
        @close=${() => (this._menu = undefined)}
      ></chorus-menu>
      <chorus-audio
        .open=${!!this._audio}
        .heading=${this._audio?.heading ?? ""}
        .controls=${this._audio?.controls ?? []}
        @change=${this._onAudioChange}
        @close=${() => (this._audio = undefined)}
      ></chorus-audio>
      <chorus-changebar
        .rows=${rows}
        .busy=${this._applying}
        @apply=${this._apply}
        @discard=${this._discard}
      ></chorus-changebar>
      <chorus-toast></chorus-toast>
    `;
  }

  // ---- room list ------------------------------------------------------
  private _roomGlyphModel(r: Room): string {
    return r.ht?.bar.model ?? r.pairs[0]?.L?.model ?? r.tray[0]?.model ?? "";
  }

  private _roomTint(r: Room): string {
    if (r.ht) return "t-bar";
    if (r.pairs.length) return "t-front";
    return "t-neutral";
  }

  private _roomButton(r: Room, sel?: Room): TemplateResult {
    const on = sel?.key === r.key;
    return html`
      <button type="button" class="room ${on ? "sel" : ""}" @click=${() => (this._selected = r.key)}>
        <span class="ric ${this._roomTint(r)}">${iconFor(this._roomGlyphModel(r))}</span>
        <span class="rmeta">
          <b>${r.name}</b>
          <span>${this._roomSummary(r)}</span>
        </span>
        <span class="chev">›</span>
      </button>
    `;
  }

  private _roomSummary(r: Room): string {
    const parts: string[] = [];
    if (r.ht) {
      const n = CHANNELS.filter((c) => c !== "SW" && r.ht!.slots[c]).length;
      parts.push(`Home theater · ${n}.${r.ht.slots.SW ? "1" : "0"}`);
    }
    if (r.pairs.length) parts.push(r.pairs.length === 1 ? "Stereo pair" : `${r.pairs.length} pairs`);
    const solo = r.tray.length;
    if (solo && !r.ht) parts.push(solo === 1 ? "1 speaker" : `${solo} speakers`);
    return parts.join(" · ") || "No speakers";
  }

  // ---- detail ---------------------------------------------------------
  private _detail(r: Room): TemplateResult {
    return html`
      ${this.narrow
        ? html`<button type="button" class="back" @click=${() => (this._selected = undefined)}>
            ‹ All rooms
          </button>`
        : nothing}
      <div class="head">
        <h1>${r.name}</h1>
        ${r.area ? nothing : html`<span class="kind">No HA area</span>`}
        <span class="grow"></span>
        ${r.ht ? this._dots(() => this._openRoomMenu(r)) : nothing}
      </div>
      ${r.ht ? this._htStage(r, r.ht) : this._setupCta(r)}
      ${r.pairs.length
        ? html`<div class="paircards">${r.pairs.map((p, i) => this._pairCard(r, p, i))}</div>`
        : nothing}
      ${this._traySection(r)}
    `;
  }

  private _setupCta(r: Room): TemplateResult | typeof nothing {
    const bar = r.tray.find((s) => isBar(s.model));
    if (!bar) return nothing;
    return html`
      <button
        type="button"
        class="cta"
        @click=${() => {
          this._working = setupHT(this._rooms, r.key, bar.uid);
          this._dirty = true;
          this._toast("Home theater created");
        }}
      >
        ＋ Set up a home theater with ${this._name(bar)}
      </button>
    `;
  }

  private _htStage(r: Room, ht: HTLayout): TemplateResult {
    return html`
      <div class="stage">
        <div class="tv">${TV_ART}</div>
        <div class="postile bar t-bar">
          <span class="badge t-bar">${iconFor(ht.bar.model)}</span>
          <span class="pmeta"><b>${this._name(ht.bar)}</b><span>${shortModel(ht.bar.model) || "Center"}</span></span>
        </div>
        <div class="prow fronts">${this._pos(r, ht, "LF")}${this._pos(r, ht, "RF")}</div>
        <div class="lp"><div class="couch">${COUCH_ART}</div><small>Listening position</small></div>
        <div class="prow rear">${this._pos(r, ht, "LR")}${this._pos(r, ht, "RR")}</div>
        <div class="psub">${this._pos(r, ht, "SW")}</div>
      </div>
    `;
  }

  private _pos(r: Room, ht: HTLayout, ch: Channel): TemplateResult {
    const sp = ht.slots[ch];
    const eligible = r.tray.some((s) => positionAccepts(ch, s.model));
    if (!sp) {
      const add = () => {
        if (eligible) this._picker = { roomKey: r.key, ch };
      };
      // A <div> (not <button>) so it matches the filled tile's box model exactly.
      return html`
        <div
          class="postile empty ${eligible ? "actionable" : ""}"
          role=${eligible ? "button" : nothing}
          tabindex=${eligible ? "0" : nothing}
          title=${eligible ? `Add ${CHANNEL_NAME[ch]}` : "No eligible speaker in this room"}
          @click=${add}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              add();
            }
          }}
          @dragover=${(e: DragEvent) => this._onDragOver(e, r, ch)}
          @dragleave=${(e: DragEvent) => (e.currentTarget as HTMLElement).classList.remove("over")}
          @drop=${(e: DragEvent) => this._onDrop(e, r, ch)}
        >
          <span class="badge empty-badge">${ch}</span>
          <span class="pmeta"><b>${CHANNEL_NAME[ch]}</b><span>${eligible ? "Tap to add" : "Empty"}</span></span>
        </div>
      `;
    }
    return html`
      <div
        class="postile filled"
        @dragover=${(e: DragEvent) => this._onDragOver(e, r, ch)}
        @dragleave=${(e: DragEvent) => (e.currentTarget as HTMLElement).classList.remove("over")}
        @drop=${(e: DragEvent) => this._onDrop(e, r, ch)}
      >
        <span class="badge ${CH_TINT[ch]}">${iconFor(sp.model)}</span>
        <span class="pmeta">
          <b>${this._name(sp)}</b>
          <span>${CHANNEL_NAME[ch]} · ${shortModel(sp.model)}</span>
        </span>
        <button type="button" class="x" title="Remove" @click=${() => this._clear(r.key, ch, sp)}>×</button>
      </div>
    `;
  }

  // ---- pairs ----------------------------------------------------------
  private _pairCard(r: Room, p: EditorPair, index: number): TemplateResult {
    return html`
      <div class="paircard">
        <div class="pc-orbs">
          ${this._pcSlot("L", p.L)}
          <span class="pc-div">+</span>
          ${this._pcSlot("R", p.R)}
        </div>
        <div class="pc-meta">
          <b>${p.L ? this._name(p.L) : p.R ? this._name(p.R) : "Stereo pair"}</b>
          <span>${shortModel(p.L?.model ?? p.R?.model)} · stereo pair</span>
        </div>
        ${p.sub
          ? html`<span class="pc-sub"><span class="pc-sub-ic">${iconFor(p.sub.model)}</span> Sub · ${p.sub.name}</span>`
          : nothing}
        <span class="grow"></span>
        ${this._dots(() => this._openPairMenu(r, index))}
      </div>
    `;
  }

  private _pcSlot(side: string, sp: EditorSpeaker | null): TemplateResult {
    return html`
      <div class="pc-slot ${sp ? "" : "empty"}">
        ${sp
          ? html`<span class="badge orb t-front">${iconFor(sp.model)}</span>`
          : html`<span class="badge empty-badge">${side}</span>`}
        <span class="pc-side">${side}</span>
      </div>
    `;
  }

  // ---- lone speakers / available pool --------------------------------
  private _traySection(r: Room): TemplateResult | typeof nothing {
    if (!r.tray.length) {
      return r.ht || r.pairs.length ? nothing : html`<div class="empty">No speakers in this room.</div>`;
    }
    const heading = r.ht || r.pairs.length ? "Available speakers" : "Speakers";
    const pairable = r.tray.filter((s) => canPair(s.model)).length >= 2;
    return html`
      <div class="sec">${heading}</div>
      <div class="rows">${r.tray.map((s) => this._speakerRow(s, r.key))}</div>
      ${pairable
        ? html`<button type="button" class="newpair" @click=${() => (this._pairPick = { roomKey: r.key })}>
            ＋ Create stereo pair
          </button>`
        : nothing}
    `;
  }

  private _speakerRow(s: EditorSpeaker, roomKey: string): TemplateResult {
    return html`
      <div
        class="row drag"
        draggable="true"
        @dragstart=${(e: DragEvent) => {
          // Don't start a drag from the ••• button (or its menu).
          if ((e.target as HTMLElement).closest(".dots")) {
            e.preventDefault();
            return;
          }
          this._drag = { uid: s.uid, roomKey, model: s.model };
          if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
          (e.currentTarget as HTMLElement).classList.add("dragging");
        }}
        @dragend=${(e: DragEvent) => {
          this._drag = undefined;
          (e.currentTarget as HTMLElement).classList.remove("dragging");
        }}
      >
        <span class="rt">${iconFor(s.model)}</span>
        <span class="rx"><b>${this._name(s)}</b><span>${shortModel(s.model)}</span></span>
        <span class="grow"></span>
        ${this._dots(() => this._openSpeakerMenu(s))}
      </div>
    `;
  }

  // ---- picker overlay (tap-to-assign) --------------------------------
  private _pickerOverlay(): TemplateResult | typeof nothing {
    if (!this._picker) return nothing;
    const { roomKey, ch } = this._picker;
    const room = this._rooms.find((r) => r.key === roomKey);
    const candidates = (room?.tray ?? []).filter((s) => positionAccepts(ch, s.model));
    return html`
      <div class="backdrop" @click=${() => (this._picker = undefined)}>
        <div class="sheet" @click=${(e: Event) => e.stopPropagation()}>
          <div class="sheet-h">Add ${CHANNEL_NAME[ch]}</div>
          ${candidates.length
            ? candidates.map(
                (s) => html`
                  <button type="button" class="sheet-item" @click=${() => this._assign(roomKey, ch, s)}>
                    <span class="rt">${iconFor(s.model)}</span>
                    <span class="rx"><b>${s.name}</b><span>${shortModel(s.model)}</span></span>
                  </button>
                `
              )
            : html`<div class="sheet-empty">No eligible speaker in this room.</div>`}
          <button type="button" class="sheet-cancel" @click=${() => (this._picker = undefined)}>Cancel</button>
        </div>
      </div>
    `;
  }

  // ---- picker overlay (create stereo pair) ---------------------------
  private _pairOverlay(): TemplateResult | typeof nothing {
    if (!this._pairPick) return nothing;
    const { roomKey, first } = this._pairPick;
    const room = this._rooms.find((r) => r.key === roomKey);
    const candidates = (room?.tray ?? []).filter((s) => canPair(s.model) && s.uid !== first);
    return html`
      <div class="backdrop" @click=${() => (this._pairPick = undefined)}>
        <div class="sheet" @click=${(e: Event) => e.stopPropagation()}>
          <div class="sheet-h">
            ${first ? "Pick the partner speaker" : "Create stereo pair — pick the first speaker"}
          </div>
          ${candidates.length
            ? candidates.map(
                (s) => html`
                  <button type="button" class="sheet-item" @click=${() => this._pickPairMember(s)}>
                    <span class="rt">${iconFor(s.model)}</span>
                    <span class="rx"><b>${this._name(s)}</b><span>${shortModel(s.model)}</span></span>
                  </button>
                `
              )
            : html`<div class="sheet-empty">No speaker available to pair.</div>`}
          <button type="button" class="sheet-cancel" @click=${() => (this._pairPick = undefined)}>Cancel</button>
        </div>
      </div>
    `;
  }

  static override styles = css`
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
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "chorus-editor": ChorusEditor;
  }
}
