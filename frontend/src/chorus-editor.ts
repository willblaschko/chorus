import { LitElement, html, css, nothing, type TemplateResult, type PropertyValues } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import type { BondGraph, HomeAssistant } from "./types.js";
import {
  buildRooms,
  positionAccepts,
  canPair,
  isBar,
  setKind,
  CHANNELS,
  CHANNEL_NAME,
  AVAILABLE_SUBS_KEY,
  type Channel,
  type Room,
  type BondedSet,
  type EditorSpeaker,
} from "./model.js";
import { iconFor, shortModel } from "./icons.js";
import { TV_ART, COUCH_ART } from "./art.js";
import {
  roomsToLayout,
  assignToChannel,
  clearChannel,
  assignSubToChannel,
  bondSubToSpeaker,
  createPair,
  separatePair,
  swapPair,
  dissolveHT,
  moveSpeaker,
  renameSpeaker,
  setupHT,
} from "./layout.js";
import { planChanges, applyPlan, isEmpty } from "./staged.js";
import {
  bondSignature,
  fullSignature,
  settled,
  expectedSettleMs,
  settleView,
  type SettleView,
} from "./settle.js";
import type { LayoutMap } from "./apply.js";
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

// Sentinel id prefix for the Fixed line-out toggle. It's a Chorus SOAP setting (not an
// HA entity), so the audio sheet routes its change to chorus.set_fixed_output instead of
// switch.turn_on. The speaker uid is appended: `chorus:fixed_output:<uid>`.
const FIXED_OUTPUT_ID = "chorus:fixed_output";

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
  /** Room KEY to select on entry (e.g. clicking a room's edit pencil on the Overview
   * page). The host sets this + switches to the editor view; we select that room. */
  @property({ attribute: false }) public selectRoom?: string;

  @state() private _selected?: string;
  @state() private _working?: Room[]; // staged edits (undefined until synced from graph)
  @state() private _dirty = false;
  @state() private _applying = false;
  @state() private _rows: ChangeRow[] = []; // live rows during apply
  @state() private _settleView: SettleView | null = null; // live settle progress
  private _releasedUids: string[] = []; // speakers this apply un-bonds (awaited back)
  private _settleTimedOut = false; // convergence budget exhausted without settling
  @state() private _picker?: { roomKey: string; setId: string; ch: Channel };
  @state() private _pairPick?: { roomKey: string; first?: string };
  private _drag?: { uid: string; roomKey: string; model: string };
  @state() private _menu?: { heading: string; items: MenuItem[]; onSelect: (id: string) => void };
  @state() private _audio?: { heading: string; controls: AudioControl[] };
  @state() private _movePick?: string; // uid of the speaker being moved
  @state() private _renameFor?: { uid: string; current: string };
  private _ro?: ResizeObserver;

  public override connectedCallback(): void {
    super.connectedCallback();
    // The bottom overlays (change bar, toast, settling banner) are position:fixed, so
    // left:50% centers them on the VIEWPORT — which, with HA's sidebar, sits left of
    // the content column. Center them under the editor content instead by publishing
    // its live centre-x as a CSS var the overlays read (re-measured on any resize).
    this._syncOverlayCentre();
    this._ro = new ResizeObserver(() => this._syncOverlayCentre());
    this._ro.observe(this);
    window.addEventListener("resize", this._syncOverlayCentre);
  }

  public override disconnectedCallback(): void {
    this._ro?.disconnect();
    window.removeEventListener("resize", this._syncOverlayCentre);
    super.disconnectedCallback();
  }

  private _syncOverlayCentre = (): void => {
    const r = this.getBoundingClientRect();
    if (r.width) this.style.setProperty("--chorus-bar-left", `${Math.round(r.left + r.width / 2)}px`);
  };

  protected override willUpdate(changed: PropertyValues): void {
    // Sync the working model from the live graph — but never clobber staged edits
    // (the coordinator refreshes every 30s; that must not wipe your in-progress work).
    if ((changed.has("graph") && !this._dirty) || this._working === undefined) {
      this._working = structuredClone(buildRooms(this.graph));
    }
    // Host asked to open a specific room (e.g. the Overview edit pencil).
    if (changed.has("selectRoom") && this.selectRoom) {
      this._selected = this.selectRoom;
    }
  }

  private get _rooms(): Room[] {
    return this._working ?? buildRooms(this.graph);
  }

  private _room(): Room | undefined {
    const rooms = this._rooms.filter((r) => r.key !== AVAILABLE_SUBS_KEY);
    if (this._selected) {
      const found = rooms.find((r) => r.key === this._selected);
      if (found) return found;
    }
    return this.narrow ? undefined : rooms[0];
  }

  /** The global pool of unbonded subs (droppable onto any home theater's SW). */
  private _availableSubs(): EditorSpeaker[] {
    return this._rooms.find((r) => r.key === AVAILABLE_SUBS_KEY)?.tray ?? [];
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

  private _assign(roomKey: string, setId: string, ch: Channel, sp: EditorSpeaker): void {
    this._working = assignToChannel(this._rooms, roomKey, setId, ch, sp.uid);
    this._dirty = true;
    this._picker = undefined;
    this._toast(`${this._name(sp)} → ${CHANNEL_NAME[ch]}`);
  }

  private _assignSub(roomKey: string, setId: string, subUid: string): void {
    // Read the sub's name before the mutation moves it out of the pool.
    const sub = this._availableSubs().find((s) => s.uid === subUid);
    this._working = assignSubToChannel(this._rooms, roomKey, setId, subUid);
    this._dirty = true;
    this._picker = undefined;
    this._toast(sub ? `${this._name(sub)} → ${CHANNEL_NAME.SW}` : "Sub added");
  }

  // ---- drag & drop (desktop; tap-to-assign remains for touch) ---------
  private _canDrop(r: Room, ch: Channel): boolean {
    if (!this._drag) return false;
    // An available sub (from the global pool) can drop onto ANY set's SW slot.
    if (this._drag.roomKey === AVAILABLE_SUBS_KEY) {
      return ch === "SW" && positionAccepts("SW", this._drag.model);
    }
    return this._drag.roomKey === r.key && positionAccepts(ch, this._drag.model);
  }

  private _dropOnChannel(r: Room, setId: string, ch: Channel): void {
    if (!this._canDrop(r, ch)) return;
    const drag = this._drag!;
    this._drag = undefined;
    if (drag.roomKey === AVAILABLE_SUBS_KEY) {
      this._assignSub(r.key, setId, drag.uid);
    } else {
      const sp = r.tray.find((s) => s.uid === drag.uid);
      if (sp) this._assign(r.key, setId, ch, sp);
    }
  }

  private _onDragOver(e: DragEvent, r: Room, ch: Channel): void {
    if (this._canDrop(r, ch)) {
      e.preventDefault();
      (e.currentTarget as HTMLElement).classList.add("over");
    }
  }

  private _onDrop(e: DragEvent, r: Room, setId: string, ch: Channel): void {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove("over");
    this._dropOnChannel(r, setId, ch);
  }

  private _clear(roomKey: string, setId: string, ch: Channel, sp: EditorSpeaker): void {
    this._working = clearChannel(this._rooms, roomKey, setId, ch);
    this._dirty = true;
    this._toast(`${sp.name} removed from ${CHANNEL_NAME[ch]}`);
  }

  private _separate(roomKey: string, setId: string): void {
    this._working = separatePair(this._rooms, roomKey, setId);
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

  private _openRoomMenu(r: Room, set: BondedSet): void {
    this._menu = {
      heading: r.name,
      items: [
        { id: "audio", label: "Audio settings" },
        { id: "dissolve", label: "Separate home theater", danger: true },
      ],
      onSelect: (id) => {
        if (id === "audio") {
          void this._openAudio(this._setName(set), set.primary.uid);
        } else if (id === "dissolve") {
          this._working = dissolveHT(this._rooms, r.key, set.id);
          this._dirty = true;
          this._toast("Home theater separated");
        }
      },
    };
  }

  private _openPairMenu(r: Room, set: BondedSet): void {
    const hasSub = !!set.slots.SW;
    // With a sub bonded, swap/separate operate on the 2-member map — offer them only
    // once the sub is removed (keeps the ChannelMapSet ops unambiguous).
    const items: MenuItem[] = hasSub
      ? [
          { id: "audio", label: "Audio settings" },
          { id: "rename", label: "Rename" },
          { id: "removesub", label: "Remove sub" },
        ]
      : [
          { id: "audio", label: "Audio settings" },
          { id: "rename", label: "Rename" },
          { id: "addsub", label: "Add a sub" },
          { id: "swap", label: "Swap L / R" },
          { id: "separate", label: "Separate pair", danger: true },
        ];
    this._menu = {
      heading: "Stereo pair",
      items,
      onSelect: (id) => {
        if (id === "audio") {
          void this._openAudio(this._setName(set), set.primary.uid);
        } else if (id === "rename") {
          this._renameFor = { uid: set.primary.uid, current: this._setName(set) };
        } else if (id === "addsub") {
          if (this._availableSubs().length) this._picker = { roomKey: r.key, setId: set.id, ch: "SW" };
          else this._toast("No available sub");
        } else if (id === "removesub") {
          this._working = clearChannel(this._rooms, r.key, set.id, "SW");
          this._dirty = true;
          this._toast("Sub removed");
        } else if (id === "swap") {
          this._working = swapPair(this._rooms, r.key, set.id);
          this._dirty = true;
          this._toast("Swapped L / R");
        } else if (id === "separate") {
          this._separate(r.key, set.id);
        }
      },
    };
  }

  private _openSpeakerMenu(s: EditorSpeaker, roomKey: string): void {
    const canAddSub = !isBar(s.model) && this._availableSubs().length > 0;
    const items: MenuItem[] = [
      { id: "identify", label: "Identify" },
      { id: "audio", label: "Audio settings" },
    ];
    if (canAddSub) items.push({ id: "addsub", label: "Add a sub" });
    items.push({ id: "rename", label: "Rename" }, { id: "move", label: "Move to another room" });
    this._menu = {
      heading: this._name(s),
      items,
      onSelect: (id) => {
        if (id === "identify") this._identify(s);
        else if (id === "audio") void this._openAudio(this._name(s), s.uid);
        else if (id === "addsub") {
          const sub = this._availableSubs()[0];
          if (sub) {
            this._working = bondSubToSpeaker(this._rooms, roomKey, s.uid, sub.uid);
            this._dirty = true;
            this._toast(`${this._name(sub)} → ${CHANNEL_NAME.SW}`);
          }
        } else if (id === "rename") this._renameFor = { uid: s.uid, current: this._name(s) };
        else if (id === "move") this._movePick = s.uid;
      },
    };
  }

  private _openSpeakerSetMenu(r: Room, set: BondedSet): void {
    this._menu = {
      heading: this._setName(set),
      items: [{ id: "removesub", label: "Remove sub" }],
      onSelect: (id) => {
        if (id === "removesub") {
          // separatePair dissolves the set: speaker back to the tray, sub to the pool.
          this._working = separatePair(this._rooms, r.key, set.id);
          this._dirty = true;
          this._toast("Sub removed");
        }
      },
    };
  }

  private _doRename(): void {
    const input = this.shadowRoot?.querySelector(".rename-input") as HTMLInputElement | null;
    const value = input?.value.trim();
    const target = this._renameFor;
    this._renameFor = undefined;
    if (!target || !value || value === target.current) return;
    // Stage it like every other edit — it shows in the change bar and applies on Apply.
    this._working = renameSpeaker(this._rooms, target.uid, value);
    this._dirty = true;
    this._toast(`Rename to ${value}`);
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
    for (const r of this._rooms) if (r.key !== AVAILABLE_SUBS_KEY) names.add(r.name);
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

  // The number.<slug>_<key> / switch.<slug>_<key> entity ids for a speaker. Prefer the
  // HA device registry (keyed by the Sonos RINCON uid) — exact, and it survives zone
  // renames and works for stereo pairs; fall back to guessing from the name slug.
  private _hassReg() {
    return this.hass as unknown as {
      devices?: Record<string, { identifiers?: [string, string][] }>;
      entities?: Record<string, { device_id?: string | null }>;
      states?: Record<string, unknown>;
    };
  }

  /** HA device id for a Sonos speaker, matched by its RINCON uid. */
  private _deviceIdFor(uid: string | undefined): string | undefined {
    if (!uid) return undefined;
    const { devices } = this._hassReg();
    for (const [id, dev] of Object.entries(devices ?? {})) {
      if (dev.identifiers?.some((i) => i[0] === "sonos" && i[1] === uid)) return id;
    }
    return undefined;
  }

  private _speakerEntityIds(uid: string | undefined, name: string): string[] {
    const { entities, states } = this._hassReg();
    const deviceId = this._deviceIdFor(uid);
    if (deviceId && entities) {
      return Object.entries(entities)
        .filter(([, e]) => e.device_id === deviceId)
        .map(([eid]) => eid);
    }
    const slug = slugify(name);
    return Object.keys(states ?? {}).filter((id) => id.includes(`.${slug}_`));
  }

  /** The media_player entity for a speaker (via its device) — for identify/announce. */
  private _mediaPlayerFor(uid: string): string | undefined {
    const deviceId = this._deviceIdFor(uid);
    const { entities } = this._hassReg();
    if (!deviceId || !entities) return undefined;
    return Object.keys(entities).find(
      (eid) => eid.startsWith("media_player.") && entities[eid].device_id === deviceId
    );
  }

  private _ttsEngine(): string | undefined {
    return Object.keys(this.hass?.states ?? {}).find((e) => e.startsWith("tts."));
  }

  // Identify a speaker by announcing its name on it (snapshots + restores playback via
  // announce:true) — a chirp SOAP returned success but no audio, so we use HA's TTS.
  // A speaker only has its OWN media_player when it's a standalone zone. A bonded
  // satellite (or one whose un-bond hasn't been applied to hardware yet) has no player
  // of its own — HA reports it `unavailable` and routes playback to the group
  // coordinator, so an announce would chirp the WRONG speaker. Gate on a live, available
  // player and tell the user to apply first rather than mis-identify.
  private _canIdentify(uid: string): boolean {
    const entity = this._mediaPlayerFor(uid);
    const st = entity ? this.hass?.states?.[entity]?.state : undefined;
    return !!entity && st !== "unavailable" && st !== "unknown" && st != null;
  }

  private _identify(s: EditorSpeaker): void {
    if (!this._canIdentify(s.uid)) {
      this._toast("Can't identify yet — this speaker isn't a standalone player (still bonded to another set, or offline). Apply your changes first.");
      return;
    }
    const entity = this._mediaPlayerFor(s.uid);
    const tts = this._ttsEngine();
    if (!tts) {
      this._toast("Can't identify — no TTS engine configured in Home Assistant.");
      return;
    }
    if (!entity) {
      this._toast("Can't identify — no media player resolved for this speaker.");
      return;
    }
    void this.hass.callService("media_player", "play_media", {
      entity_id: entity,
      media_content_id: `media-source://tts/${tts}?message=This is ${this._name(s)}`,
      media_content_type: "music",
      announce: true,
    });
    this._toast(`Identifying ${this._name(s)}`);
  }

  private async _openAudio(name: string, uid?: string): Promise<void> {
    const ids = this._speakerEntityIds(uid, name);
    const controls: AudioControl[] = [];
    for (const spec of AUDIO_SPEC) {
      const domain = spec.toggle ? "switch" : "number";
      const eid = ids.find((id) => id.startsWith(`${domain}.`) && id.endsWith(`_${spec.key}`));
      const ent = eid ? this.hass?.states?.[eid] : undefined;
      if (!ent || !eid || ent.state === "unavailable" || ent.state === "unknown") continue;
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
    // Fixed line-out volume (Connect/Port/Amp/Five) is a Chorus SOAP setting, not an HA
    // entity — query it over the websocket and add a toggle only if the device supports it.
    if (uid) {
      try {
        const fx = await this.hass.connection.sendMessagePromise<{
          supported: boolean;
          fixed: boolean;
        }>({ type: "chorus/output_fixed", speaker: uid });
        if (fx?.supported) {
          controls.push({
            id: `${FIXED_OUTPUT_ID}:${uid}`,
            kind: "toggle",
            label: "Fixed line-out volume",
            group: "Output",
            value: !!fx.fixed,
          });
        }
      } catch {
        /* offline / unsupported — just omit the toggle */
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
    if (id.startsWith(`${FIXED_OUTPUT_ID}:`)) {
      const uid = id.slice(FIXED_OUTPUT_ID.length + 1);
      void this.hass.callService("chorus", "set_fixed_output", { speaker: uid, enabled: !!value });
    } else if (typeof value === "boolean") {
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
    // The speakers this plan un-bonds are the ones we'll wait to see reappear as
    // standalones -- measured to be the slow part of settling (~30-54s). Track them
    // so the progress banner can name who it's waiting on.
    const released: string[] = [];
    for (const op of plan.ops) {
      if (op.type === "remove_ht") released.push(op.touches[0]);
      else if (op.type === "separate") released.push(...op.touches);
    }
    this._releasedUids = released;
    this._settleTimedOut = false;
    this._settleView = { label: "Applying changes...", ratio: 0.05 };
    this._applying = true;
    this._rows = plan.rows;
    await applyPlan(this.hass, plan, (rows) => {
      this._rows = [...rows];
    });
    // The service calls have returned, but Sonos keeps re-syncing for a beat after.
    // Wait for the live topology to actually converge to what we asked for before
    // reporting done — mirror what the Sonos app does.
    const intendedMap = roomsToLayout(this._rooms);
    const intended = bondSignature(intendedMap);
    const budgetMs = Math.round(expectedSettleMs(plan.ops.map((o) => o.type)) * 1.5);
    const fresh = await this._awaitConvergence(intended, intendedMap, budgetMs);
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
    const msg = failed
      ? `Applied with ${failed} error${failed === 1 ? "" : "s"}`
      : this._settleTimedOut
        ? "Applied -- speakers still reconnecting"
        : "Applied";
    this._toast(msg);
  }

  // A stable fingerprint of the bonding topology (each speaker's role + anchor),
  // ignoring names/rooms — so convergence tracks the actual bonds, not transient labels.
  // (topology / full-graph signatures + the settle predicate now live in ./settle.ts)

  // Full-graph fingerprint: every speaker's channel + NAME + membership. Changes
  // while the device is still cycling (names resolving, removed speakers reappearing
  // as standalones), so "unchanged" == truly settled. Measured: a 2×2 front swap's
  // topology is right at ~9s but the graph doesn't stop changing until ~53s.

  // Re-discover until the live bonding matches `intended` AND the full graph has been
  // STABLE across two consecutive polls (no more transitions), or the budget runs out.
  private async _awaitConvergence(
    intended: string,
    intendedMap: LayoutMap,
    budgetMs: number
  ): Promise<BondGraph | undefined> {
    let last: BondGraph | undefined;
    let prevFull = " "; // sentinel so the first poll can never count as "stable"
    const start = Date.now();
    while (Date.now() - start < budgetMs) {
      let fresh: BondGraph;
      try {
        fresh = await this.hass.connection.sendMessagePromise<BondGraph>({ type: "chorus/refresh" });
      } catch {
        return last;
      }
      last = fresh;
      const freshMap = roomsToLayout(buildRooms(fresh));
      const topo = bondSignature(freshMap);
      // Publish live progress for the banner: which released speakers are back yet.
      this._settleView = settleView(intendedMap, freshMap, this._releasedUids);
      if (settled(intended, topo, fresh, prevFull)) return fresh;
      prevFull = fullSignature(fresh);
      await new Promise((r) => window.setTimeout(r, 1500));
    }
    this._settleTimedOut = true;
    return last;
  }

  // Never show a raw "RINCON_…" UID: fall back to the model while a name resolves.
  private _name(sp: EditorSpeaker): string {
    return sp.name && !/^RINCON_/i.test(sp.name) ? sp.name : shortModel(sp.model) || "Speaker";
  }

  // A bonded set is ONE zone with ONE name (set.name), independent of which member is
  // currently primary — so a header/rename reads set.name, never the primary's own name
  // (that's what stops an L/R swap from flipping the displayed name).
  private _setName(set: BondedSet): string {
    return set.name && !/^RINCON_/i.test(set.name) ? set.name : this._name(set.primary);
  }

  public override render(): TemplateResult {
    const rooms = this._rooms.filter((r) => r.key !== AVAILABLE_SUBS_KEY);
    if (!rooms.length) {
      return html`<div class="empty-state">No Sonos speakers discovered yet.</div>
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
      ${this._pickerOverlay()}
      ${this._pairOverlay()}
      ${this._moveOverlay()}
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
        .statusLabel=${this._settleView?.label ?? ""}
        .progress=${this._settleView?.ratio ?? -1}
        @apply=${this._apply}
        @discard=${this._discard}
      ></chorus-changebar>
      <chorus-toast></chorus-toast>
    `;
  }

  // ---- room list ------------------------------------------------------
  private _htSet(r: Room): BondedSet | undefined {
    return r.sets.find((s) => setKind(s) === "home_theater");
  }
  private _pairSets(r: Room): BondedSet[] {
    return r.sets.filter((s) => setKind(s) === "stereo_pair");
  }
  // A non-soundbar, non-pair set — i.e. a lone speaker that has a sub bonded to it.
  private _speakerSets(r: Room): BondedSet[] {
    return r.sets.filter((s) => setKind(s) === "speaker");
  }

  private _speakerSetCard(r: Room, set: BondedSet): TemplateResult {
    const sub = set.slots.SW ?? null;
    return html`
      <div class="paircard">
        <span class="badge orb t-front">${iconFor(set.primary.model)}</span>
        <div class="pc-meta">
          <b>${this._setName(set)}</b>
          <span>${shortModel(set.primary.model)}${sub ? " · with sub" : ""}</span>
        </div>
        ${sub
          ? html`<span class="pc-sub"><span class="pc-sub-ic">${iconFor(sub.model)}</span> Sub · ${sub.name}</span>`
          : nothing}
        <span class="grow"></span>
        ${sub ? this._dots(() => this._openSpeakerSetMenu(r, set)) : nothing}
      </div>
    `;
  }

  private _roomGlyphModel(r: Room): string {
    return this._htSet(r)?.primary.model ?? r.sets[0]?.primary.model ?? r.tray[0]?.model ?? "";
  }

  private _roomTint(r: Room): string {
    if (this._htSet(r)) return "t-bar";
    if (this._pairSets(r).length) return "t-front";
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
    const ht = this._htSet(r);
    if (ht) {
      const n = CHANNELS.filter((c) => c !== "SW" && ht.slots[c]).length;
      parts.push(`Home theater · ${n}.${ht.slots.SW ? "1" : "0"}`);
    }
    const pairs = this._pairSets(r).length;
    if (pairs) parts.push(pairs === 1 ? "Stereo pair" : `${pairs} pairs`);
    const solo = r.tray.length;
    if (solo && !ht) parts.push(solo === 1 ? "1 speaker" : `${solo} speakers`);
    return parts.join(" · ") || "No speakers";
  }

  // ---- detail ---------------------------------------------------------
  private _detail(r: Room): TemplateResult {
    const ht = this._htSet(r);
    const pairs = this._pairSets(r);
    const speakerSets = this._speakerSets(r);
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
        ${ht ? this._dots(() => this._openRoomMenu(r, ht)) : nothing}
      </div>
      ${this._availableSubsStrip(r)}
      ${ht ? html`<div class="sec">Home theater</div>` : nothing}
      ${ht ? this._htStage(r, ht) : this._setupCta(r)}
      ${pairs.length
        ? html`<div class="sec">${pairs.length === 1 ? "Stereo pair" : "Stereo pairs"}</div>
            <div class="paircards">${pairs.map((set) => this._pairCard(r, set))}</div>`
        : nothing}
      ${speakerSets.length
        ? html`<div class="sec">${speakerSets.length === 1 ? "Speaker + sub" : "Speakers + sub"}</div>
            <div class="paircards">
              ${speakerSets.map((set) => this._speakerSetCard(r, set))}
            </div>`
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

  // A strip of unbonded subs, shown on any home-theater room: drag one onto the
  // Sub slot (or tap it) to re-home it here, even if it came from another room.
  private _availableSubsStrip(r: Room): TemplateResult | typeof nothing {
    const subs = this._availableSubs();
    const ht = this._htSet(r);
    if (!subs.length || !ht) return nothing;
    return html`
      <div class="subbin">
        <span class="subbin-label">Available sub${subs.length === 1 ? "" : "s"}</span>
        <div class="subbin-chips">
          ${subs.map(
            (s) => html`
              <div
                class="subchip"
                draggable="true"
                title="Drag onto the Sub slot, or tap to add"
                @dragstart=${(e: DragEvent) => {
                  e.dataTransfer?.setData("text/plain", s.uid);
                  this._drag = { uid: s.uid, roomKey: AVAILABLE_SUBS_KEY, model: s.model };
                }}
                @dragend=${() => (this._drag = undefined)}
                @click=${() => this._assignSub(r.key, ht.id, s.uid)}
              >
                <span class="subchip-ic">${iconFor(s.model)}</span>
                <b>${this._name(s)}</b>
              </div>
            `
          )}
        </div>
      </div>
    `;
  }

  private _htStage(r: Room, set: BondedSet): TemplateResult {
    const bar = set.primary;
    return html`
      <div class="stage">
        <div class="tv">
          <div class="tv-art">${TV_ART}</div>
          <small>Television</small>
        </div>
        <div class="postile bar t-bar">
          <span class="badge t-bar">${iconFor(bar.model)}</span>
          <span class="pmeta"><b>${this._name(bar)}</b><span>${shortModel(bar.model) || "Center"}</span></span>
        </div>
        <div class="prow fronts">${this._pos(r, set, "LF")}${this._pos(r, set, "RF")}</div>
        <div class="lp"><small>Listening position</small><div class="couch">${COUCH_ART}</div></div>
        <div class="prow rear">${this._pos(r, set, "LR")}${this._pos(r, set, "RR")}</div>
        <div class="psub">${this._pos(r, set, "SW")}</div>
      </div>
    `;
  }

  private _pos(r: Room, set: BondedSet, ch: Channel): TemplateResult {
    const sp = set.slots[ch];
    // Subs come from the global available pool (cross-room), everything else from
    // this room's tray.
    const eligible =
      ch === "SW"
        ? this._availableSubs().length > 0
        : r.tray.some((s) => positionAccepts(ch, s.model));
    if (!sp) {
      const add = () => {
        if (eligible) this._picker = { roomKey: r.key, setId: set.id, ch };
      };
      // A <div> (not <button>) so it matches the filled tile's box model exactly.
      return html`
        <div
          class="postile empty ${eligible ? "actionable" : ""}"
          role=${eligible ? "button" : nothing}
          tabindex=${eligible ? "0" : nothing}
          title=${eligible
            ? `Add ${CHANNEL_NAME[ch]}`
            : ch === "SW"
              ? "No available sub"
              : "No eligible speaker in this room"}
          @click=${add}
          @keydown=${(e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              add();
            }
          }}
          @dragover=${(e: DragEvent) => this._onDragOver(e, r, ch)}
          @dragleave=${(e: DragEvent) => (e.currentTarget as HTMLElement).classList.remove("over")}
          @drop=${(e: DragEvent) => this._onDrop(e, r, set.id, ch)}
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
        @drop=${(e: DragEvent) => this._onDrop(e, r, set.id, ch)}
      >
        <span class="badge ${CH_TINT[ch]}">${iconFor(sp.model)}</span>
        <span class="pmeta">
          <b>${this._name(sp)} <span class="pos">(${CHANNEL_NAME[ch]})</span></b>
          <span>${shortModel(sp.model)}</span>
        </span>
        <button type="button" class="x" title="Remove" @click=${() => this._clear(r.key, set.id, ch, sp)}>×</button>
      </div>
    `;
  }

  // ---- pairs ----------------------------------------------------------
  private _pairCard(r: Room, set: BondedSet): TemplateResult {
    const L = set.primary;
    const R = set.slots.RF ?? null;
    const sub = set.slots.SW ?? null;
    return html`
      <div class="paircard">
        <div class="pc-orbs">
          ${this._pcSlot("L", L)}
          <span class="pc-div">+</span>
          ${this._pcSlot("R", R)}
        </div>
        <div class="pc-meta">
          <b>${this._setName(set)}</b>
          <span>${shortModel(L.model ?? R?.model)} · stereo pair</span>
        </div>
        ${sub
          ? html`<span class="pc-sub"><span class="pc-sub-ic">${iconFor(sub.model)}</span> Sub · ${sub.name}</span>`
          : nothing}
        <span class="grow"></span>
        ${this._dots(() => this._openPairMenu(r, set))}
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
      return r.sets.length ? nothing : html`<div class="empty-state">No speakers in this room.</div>`;
    }
    const heading = r.sets.length ? "Available speakers" : "Speakers";
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
        ${this._dots(() => this._openSpeakerMenu(s, roomKey))}
      </div>
    `;
  }

  // ---- picker overlay (tap-to-assign) --------------------------------
  private _pickerOverlay(): TemplateResult | typeof nothing {
    if (!this._picker) return nothing;
    const { roomKey, setId, ch } = this._picker;
    const room = this._rooms.find((r) => r.key === roomKey);
    // Subs are drawn from the global available pool (any room); other channels from
    // this room's tray.
    const isSw = ch === "SW";
    const candidates = isSw
      ? this._availableSubs()
      : (room?.tray ?? []).filter((s) => positionAccepts(ch, s.model));
    const pick = (s: EditorSpeaker) =>
      isSw ? this._assignSub(roomKey, setId, s.uid) : this._assign(roomKey, setId, ch, s);
    return html`
      <div class="backdrop" @click=${() => (this._picker = undefined)}>
        <div class="sheet" @click=${(e: Event) => e.stopPropagation()}>
          <div class="sheet-h">Add ${CHANNEL_NAME[ch]}</div>
          ${candidates.length
            ? candidates.map(
                (s) => html`
                  <button type="button" class="sheet-item" @click=${() => pick(s)}>
                    <span class="rt">${iconFor(s.model)}</span>
                    <span class="rx"><b>${this._name(s)}</b><span>${shortModel(s.model)}</span></span>
                  </button>
                `
              )
            : html`<div class="sheet-empty">${isSw ? "No available sub." : "No eligible speaker in this room."}</div>`}
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
      /* The stage can never be wider than its column — rows shrink + truncate
         instead of spilling and forcing horizontal scroll on mobile. */
      max-width: 100%;
      overflow-x: hidden;
    }
    .tv {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      color: var(--secondary-text-color);
      margin-bottom: 24px;
    }
    .tv-art {
      /* The TV is the anchor of the stage, so it reads clearly larger than the couch
         (150px). max-width still lets it shrink on a narrow column. */
      width: 234px;
      max-width: 80%;
    }
    .tv svg {
      width: 100%;
      height: auto;
      display: block;
    }
    .tv small {
      font-size: 11px;
      color: var(--secondary-text-color);
    }
    .ink {
      fill: currentColor;
    }
    .paper {
      fill: var(--primary-background-color, var(--card-background-color, #fff));
    }
    .prow {
      display: flex;
      gap: 24px;
      justify-content: center;
      flex-wrap: nowrap; /* L/R must never stack — shrink + truncate instead */
      margin-top: 12px;
      max-width: 100%; /* row can't be wider than the stage */
    }
    /* In a row, the two tiles share the width and shrink (min-width:0 lets the
       subtitle truncate) rather than wrapping to a stack. The 50% cap + overflow
       hidden guarantee neither tile can spill and force sideways scroll. */
    .prow .postile {
      flex: 1 1 0;
      min-width: 0;
      max-width: 50%;
      overflow: hidden;
    }
    .psub {
      margin-top: 12px;
      max-width: 100%;
    }
    /* The lone sub tile must also stay inside the stage on narrow widths. */
    .psub .postile {
      min-width: 0;
      max-width: 100%;
      overflow: hidden;
    }
    .lp {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      margin: 28px 0;
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
    .subbin {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px 12px;
      margin: 2px 0 14px;
      padding: 10px 12px;
      border: 1.5px dashed var(--divider-color);
      border-radius: 14px;
    }
    .subbin-label {
      font-size: 11px;
      font-weight: 700;
      color: var(--secondary-text-color);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .subbin-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .subchip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 13px 6px 8px;
      border-radius: 999px;
      border: 1px solid var(--divider-color);
      background: var(--card-background-color, var(--ha-card-background));
      cursor: grab;
      font-size: 13px;
      font-weight: 600;
      color: var(--primary-text-color);
    }
    .subchip:active {
      cursor: grabbing;
    }
    .subchip:hover {
      border-color: var(--primary-color);
      color: var(--primary-color);
    }
    .subchip-ic {
      width: 24px;
      height: 24px;
      display: grid;
      place-items: center;
      color: var(--secondary-text-color);
      flex: none;
    }
    .subchip-ic svg {
      width: 20px;
      height: 20px;
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
    /* The position, small + muted, on the same line as the (big) room name. */
    .pmeta b .pos {
      font-weight: 400;
      font-size: 12px;
      color: var(--secondary-text-color);
    }
    .pmeta span {
      display: block;
      font-size: 12px;
      color: var(--secondary-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
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
    /* The full-width "no speakers" message. Renamed off ".empty" so it can't bleed
       into the empty-channel tiles (which carry a "postile empty" modifier). */
    .empty-state {
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
      z-index: 50;
    }
    .sheet {
      /* Centre under the editor content (var set by chorus-editor), not the raw
         viewport — otherwise HA's sidebar shifts the modal left of the content. */
      position: absolute;
      left: var(--chorus-bar-left, 50%);
      top: 50%;
      transform: translate(-50%, -50%);
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
      left: var(--chorus-bar-left, 50%);
      bottom: 88px;
      transform: translateX(-50%);
      width: min(300px, calc(100vw - 40px));
      background: var(--card-background-color, #fff);
      border: 1px solid var(--divider-color);
      color: var(--secondary-text-color);
      padding: 12px 16px 14px;
      border-radius: 14px;
      box-shadow: var(--ha-card-box-shadow, 0 6px 20px -6px rgba(0, 0, 0, 0.3));
      z-index: 40;
    }
    .settling-txt {
      font-size: 13px;
      font-weight: 500;
      margin-bottom: 9px;
      text-align: center;
    }
    .settling-track {
      height: 4px;
      background: var(--divider-color);
      border-radius: 2px;
      overflow: hidden;
    }
    .settling-fill {
      height: 100%;
      width: 0;
      background: var(--primary-color);
      border-radius: 2px;
      /* Width is driven by the live settleView ratio (bonds done, then each released
         speaker reappearing), so the bar reflects real progress, not a fixed timer.
         It transitions smoothly between polls; the banner unmounts once settled. */
      transition: width 0.6s ease;
    }
    @media (prefers-reduced-motion: reduce) {
      .settling-fill {
        transition: none;
      }
    }
    @media (max-width: 800px) {
      .grid {
        grid-template-columns: 1fr;
      }
      .grid[data-detail="on"] .col-list {
        display: none;
      }
      /* Tighter row gap on mobile so the two channel tiles have more room before
         their text has to truncate. */
      .prow {
        gap: 12px;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    "chorus-editor": ChorusEditor;
  }
}
