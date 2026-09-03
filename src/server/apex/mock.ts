import type { ApexStatus } from "@/server/apex/types";
import type { FeedChannel, HistoryPoint, OutletMode } from "@/server/types";

type MockOutlet = {
  did: string;
  name: string;
  type: string;
  mode: OutletMode;
  device: "return" | "gyre" | "light" | "skimmer" | "heater" | "other";
};

type MockState = {
  startedAt: number;
  temp: number;
  ph: number;
  sal: number;
  alk: number;
  ca: number;
  mg: number;
  roomTemp: number;
  roomRh: number;
  roomCo2: number;
  roomVoc: number;
  feed: { channel: FeedChannel | null; remaining: number; total: number };
  outlets: MockOutlet[];
  history: HistoryPoint[];
};

const FEED_DURATION: Record<FeedChannel, number> = {
  A: 5 * 60,
  B: 15 * 60,
  C: 10 * 60,
  D: 20 * 60,
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function jitter(n: number, amt: number) {
  return n + (Math.random() - 0.5) * amt;
}

const state: MockState = {
  startedAt: Date.now(),
  temp: 78.4,
  ph: 8.11,
  sal: 35.1,
  alk: 8.4,
  ca: 430,
  mg: 1350,
  roomTemp: 76.8,
  roomRh: 54,
  roomCo2: 920,
  roomVoc: 180,
  feed: { channel: null, remaining: 0, total: 0 },
  outlets: [
    { did: "1_1", name: "Return Vortex", type: "variable", mode: "auto", device: "return" },
    { did: "1_2", name: "Jebao Gyre", type: "variable", mode: "auto", device: "gyre" },
    { did: "2_1", name: "AI Hydra Left", type: "alert", mode: "auto", device: "light" },
    { did: "2_2", name: "AI Hydra Right", type: "alert", mode: "auto", device: "light" },
    { did: "3_1", name: "Skimmer", type: "outlet", mode: "auto", device: "skimmer" },
    { did: "3_2", name: "Heater", type: "outlet", mode: "auto", device: "heater" },
    { did: "4_1", name: "ATO", type: "outlet", mode: "auto", device: "other" },
    { did: "4_2", name: "Sump Light", type: "outlet", mode: "off", device: "other" },
  ],
  history: [],
};

function hourCurve(): number {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  // Photosynthesis: pH rises in the afternoon, room CO2 higher at night.
  return Math.sin(((h - 8) / 24) * Math.PI * 2);
}

function tick() {
  const now = Date.now();
  if (state.history.length === 0) {
    for (let i = 48; i >= 0; i--) {
      const t = now - i * 30 * 60 * 1000;
      const wave = Math.sin((i / 48) * Math.PI * 2);
      state.history.push({
        t,
        temp: 78.3 + wave * 0.35,
        ph: 8.08 + wave * 0.07,
      });
    }
  }

  const photo = hourCurve();
  state.temp = clamp(jitter(state.temp * 0.7 + (78.3 + photo * 0.2) * 0.3, 0.04), 77.2, 79.6);
  state.ph = clamp(jitter(state.ph * 0.65 + (8.1 + photo * 0.08) * 0.35, 0.008), 7.92, 8.28);
  state.sal = clamp(jitter(state.sal, 0.02), 34.7, 35.5);
  state.alk = clamp(jitter(state.alk, 0.01), 8.0, 8.8);
  state.roomCo2 = clamp(jitter(state.roomCo2 * 0.8 + (880 - photo * 180) * 0.2, 12), 620, 1400);
  // High room CO2 pulls tank pH down a little — the InSight Pro story.
  if (state.roomCo2 > 1100) state.ph = clamp(state.ph - 0.01, 7.85, 8.3);
  state.roomTemp = clamp(jitter(state.roomTemp, 0.05), 74, 80);
  state.roomRh = clamp(jitter(state.roomRh, 0.3), 45, 65);
  state.roomVoc = clamp(jitter(state.roomVoc, 4), 80, 320);

  if (state.feed.channel && state.feed.remaining > 0) {
    state.feed.remaining = Math.max(0, state.feed.remaining - 2);
    if (state.feed.remaining === 0) state.feed.channel = null;
  }

  const last = state.history[state.history.length - 1];
  if (!last || now - last.t > 30_000) {
    state.history.push({ t: now, temp: state.temp, ph: state.ph });
    if (state.history.length > 96) state.history.shift();
  }
}

function runningFor(o: MockOutlet): boolean {
  if (o.mode === "off") return false;
  if (o.mode === "on") return true;
  if (state.feed.channel) {
    if (o.device === "gyre" || o.device === "skimmer") return false;
    if (o.device === "return") return true;
  }
  if (o.device === "light") {
    const h = new Date().getHours();
    return h >= 8 && h < 21;
  }
  return true;
}

function lightIntensity(): number {
  const h = new Date().getHours() + new Date().getMinutes() / 60;
  if (h < 8 || h >= 21) return 0;
  if (h < 10) return Math.round(((h - 8) / 2) * 70);
  if (h > 19) return Math.round(((21 - h) / 2) * 70);
  return 72;
}

export function getMockApexStatus(): ApexStatus {
  tick();
  const feedActive = state.feed.channel
    ? FEED_CHANNELS_INDEX[state.feed.channel]
    : 0;
  return {
    system: { hostname: "apex-demo.local", software: "Sightglass-mock" },
    inputs: [
      { did: "1_1", name: "Temp", type: "Temp", value: state.temp.toFixed(1) },
      { did: "1_2", name: "pH", type: "pH", value: state.ph.toFixed(2) },
      { did: "1_3", name: "Cond", type: "Cond", value: state.sal.toFixed(1) },
      { did: "5_1", name: "Alk", type: "Alk", value: state.alk.toFixed(1) },
      { did: "5_2", name: "Ca", type: "Ca", value: String(Math.round(state.ca)) },
      { did: "5_3", name: "Mg", type: "Mg", value: String(Math.round(state.mg)) },
    ],
    outputs: state.outlets.map((o) => {
      const run = runningFor(o);
      let s0 = "OFF";
      if (o.mode === "on") s0 = "ON";
      else if (o.mode === "off") s0 = "OFF";
      else s0 = run ? "AON" : "AOF";
      return { did: o.did, name: o.name, type: o.type, status: [s0, "", "OK", ""] };
    }),
    feed: {
      name: state.feed.channel ?? "",
      active: feedActive,
      time: state.feed.remaining,
    },
  };
}

const FEED_CHANNELS_INDEX: Record<FeedChannel, number> = {
  A: 1,
  B: 2,
  C: 3,
  D: 4,
};

export function mockStartFeed(channel: FeedChannel) {
  state.feed = {
    channel,
    remaining: FEED_DURATION[channel],
    total: FEED_DURATION[channel],
  };
}

export function mockCancelFeed() {
  state.feed = { channel: null, remaining: 0, total: 0 };
}

export function mockSetOutlet(did: string, mode: OutletMode) {
  const o = state.outlets.find((x) => x.did === did);
  if (!o) throw new Error(`Unknown outlet ${did}`);
  o.mode = mode;
}

export function getMockExtras() {
  tick();
  return {
    room: {
      available: true,
      temperatureF: Number(state.roomTemp.toFixed(1)),
      humidity: Number(state.roomRh.toFixed(0)),
      co2: Math.round(state.roomCo2),
      voc: Math.round(state.roomVoc),
    },
    history: state.history.slice(),
    feedTotal: state.feed.total,
    lightIntensity: lightIntensity(),
  };
}
