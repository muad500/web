import { useState, useEffect, useRef, useCallback } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get } from "firebase/database";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { getStorage, ref as storageRef, uploadString, getDownloadURL, deleteObject, listAll, getMetadata } from "firebase/storage";

// ── Firebase Configuration ─────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBQe3B-2gz6WfMlQy31oqHwX8oUuhehu-Q",
  authDomain: "muad-web.firebaseapp.com",
  databaseURL: "https://muad-web-default-rtdb.firebaseio.com",
  projectId: "muad-web",
  storageBucket: "muad-web.firebasestorage.app",
  messagingSenderId: "596064156298",
  appId: "1:596064156298:web:8bc59c954aa61db99c8b73",
  measurementId: "G-6SDRC5G91B"
};
const GH_IMG = { owner: "muad500", repo: "portfolio-images", path: "images", branch: "Branch-3" };
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase(firebaseApp);
const auth = getAuth(firebaseApp);
const fbStorage = getStorage(firebaseApp);

// ── Theme-aware palette ─────────────────────────────────────────────────────
// Neutrals are `let` so applyTheme() can flip them at runtime. Every component
// reads them at render time, so a re-render (triggered from App) picks up the
// new values with no per-component changes. Accents (AC, GRAD*) stay identical
// across themes so the `${AC}12` hex-alpha pattern keeps working everywhere.
let BG = "#ffffff", BG2 = "#f5f5f7", BG3 = "#fbfbfd", BG4 = "#e8e8ed", TX = "#1d1d1f", TX2 = "#86868b", TX3 = "#6e6e73";
const AC = "#0071e3", GRAD1 = "#af52de", GRAD2 = "#5e5ce6", GRAD3 = "#30d158";
const FONT = "-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif";
const FONTD = "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', sans-serif";
let BORDER = "#d2d2d7";
let CARDBG = "#ffffff";
let SHADOW = "0 2px 12px rgba(0,0,0,0.08)";
let SHADOW2 = "0 4px 24px rgba(0,0,0,0.12)";

function applyTheme(mode) {
  const dark = mode === "dark";
  BG      = dark ? "#0a0a0b" : "#ffffff";
  BG2     = dark ? "#1c1c1e" : "#f5f5f7";
  BG3     = dark ? "#161617" : "#fbfbfd";
  BG4     = dark ? "#2a2a2c" : "#e8e8ed";
  TX      = dark ? "#f5f5f7" : "#1d1d1f";
  TX2     = dark ? "#a1a1a6" : "#86868b";
  TX3     = dark ? "#8a8a8f" : "#6e6e73";
  BORDER  = dark ? "#2c2c2e" : "#d2d2d7";
  CARDBG  = dark ? "#1c1c1e" : "#ffffff";
  SHADOW  = dark ? "0 2px 14px rgba(0,0,0,0.55)" : "0 2px 12px rgba(0,0,0,0.08)";
  SHADOW2 = dark ? "0 8px 30px rgba(0,0,0,0.65)" : "0 4px 24px rgba(0,0,0,0.12)";
  try { document.documentElement.setAttribute("data-theme", mode); } catch {}
}

let THEME_MODE = "light";
try {
  const _saved = localStorage.getItem("theme");
  if (_saved === "dark" || _saved === "light") THEME_MODE = _saved;
  else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) THEME_MODE = "dark";
} catch {}
applyTheme(THEME_MODE);

// Global CSS reset — overrides Vite default styles
const GlobalStyle = () => (
  <style>{`
    :root{
      --page-bg:#ffffff;
      --nav-bg:rgba(251,251,253,0.85);
      --nav-bg-solid:rgba(251,251,253,0.97);
      --glass-btn:rgba(255,255,255,0.85);
      --fade:rgba(255,255,255,0.55);
      --border-c:#d2d2d7;
    }
    [data-theme="dark"]{
      --page-bg:#0a0a0b;
      --nav-bg:rgba(16,16,18,0.82);
      --nav-bg-solid:rgba(16,16,18,0.96);
      --glass-btn:rgba(28,28,30,0.88);
      --fade:rgba(10,10,11,0.55);
      --border-c:#2c2c2e;
    }

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    html, body, #root {
      width: 100%;
      min-height: 100vh;
      background: var(--page-bg);
      overflow-x: hidden;
    }
    body { -webkit-font-smoothing: antialiased; transition: background-color 0.3s ease; }

    /* ── Mobile fixes ── */
    @media (max-width: 768px) {
      nav > div { padding: 0 16px !important; height: 52px !important; }
      section[style*="minHeight: 100vh"] { padding: 100px 20px 60px !important; }
      section[style*="minHeight: 100vh"] h1 { font-size: clamp(2.2rem, 10vw, 3.5rem) !important; }
      section[style*="minHeight: 100vh"] p { font-size: 1rem !important; }
      div[style*="flex: 1 1 320px"] { flex: 1 1 100% !important; max-width: 100% !important; }
      section { padding: 72px 16px !important; }
      .admin-sidebar { display: none !important; }
      .admin-content { margin-left: 0 !important; padding: 20px 16px 40px !important; }
      div[style*="columns: 3 280px"] { columns: 1 !important; }
      div[style*="columns: 3 260px"] { columns: 1 !important; }
      div[style*="height: 75vh"] { height: 55vh !important; min-height: 320px !important; }
      div[style*="flex-wrap: wrap"][style*="gap: 20"] { gap: 12px !important; padding: 20px 16px !important; }
      h1, h2, h3, p { overflow-wrap: break-word !important; word-break: break-word !important; }
      div[style*="gap: 56"][style*="flexWrap: wrap"] { gap: 24px !important; }
      div[style*="width: 220"][style*="height: 220"] { width: 140px !important; height: 140px !important; font-size: 52px !important; }
      div[style*="gap: 32"][style*="flexWrap: wrap"] { gap: 20px !important; }
      div[style*="gridTemplateColumns: repeat(auto-fit, minmax(340px"] { grid-template-columns: 1fr !important; }
      div[style*="gridTemplateColumns: 1fr 1fr"][style*="gap"] { grid-template-columns: 1fr !important; }
      .feature-row { grid-template-columns: 1fr !important; }
      .feature-row > div { order: initial !important; }
    }

    @media (max-width: 480px) {
      nav > div button { font-size: 10px !important; padding: 4px 8px !important; }
      div[style*="flex: 1 1 320px"] { flex: 1 1 100% !important; }
    }
  `}</style>
);

const SEED_GAMES = [
  { id: "1", title: "Neon Drift", tagline: "Outrun the city. Outrun yourself.", description: "High-speed cyberpunk racing through procedurally generated neon cityscapes with dynamic weather and AI traffic.", story: "Inspired by the neon-soaked streets of Tokyo and Hong Kong, I wanted to capture that feeling of hurtling through a living city at impossible speeds.", goal: "Build a racing game with infinite replayability through procedural generation.", learned: "Procedural generation is equal parts math and art. Layering simple rules creates the best results.", engine: "Unity", genre: "Racing", platform: "PC / Web", teamSize: "Solo", year: "2025", devTime: "4 months", techStack: ["Unity", "C#", "Shader Graph", "ProBuilder"], bannerImg: "", screenshots: [], trailerUrl: "", codeSnippet: "// Procedural city block generator", codeLang: "csharp", btsImages: [], playUrl: "#", downloadUrl: "#", downloads: 2847, plays: 12453, status: "published", color: "#af52de" },
  { id: "2", title: "Echoes of Aether", tagline: "Every realm remembers.", description: "A hand-painted metroidvania with interconnected realms and a unique echo mechanic that lets you replay ghost versions of your past actions.", story: "The concept came from a game jam theme: 'echo'. What if your past self could help your present self?", goal: "Create a metroidvania that feels genuinely new through the echo mechanic.", learned: "Visual clarity is everything — players need to instantly understand what their echo is doing.", engine: "Godot", genre: "Metroidvania", platform: "PC / Switch", teamSize: "2 (Art + Code)", year: "2025", devTime: "6 months", techStack: ["Godot", "GDScript", "Aseprite", "FMOD"], bannerImg: "", screenshots: [], trailerUrl: "", codeSnippet: "# Echo replay system", codeLang: "gdscript", btsImages: [], playUrl: "#", downloadUrl: "#", downloads: 1563, plays: 8921, status: "published", color: "#5e5ce6" },
  { id: "3", title: "Starforge", tagline: "Survive. Build. Conquer the stars.", description: "Base-building survival on a hostile alien planet with co-op multiplayer and dynamic alien ecosystems.", story: "I wanted a survival game where the environment is genuinely alive — creatures migrate, plants grow, terrain shifts.", goal: "Build a survival game where the world feels reactive to player actions.", learned: "Networking multiplayer survival is incredibly hard — client-side prediction is essential.", engine: "Unreal", genre: "Survival", platform: "PC", teamSize: "3", year: "2024", devTime: "8 months", techStack: ["Unreal Engine 5", "C++", "Blender", "Substance Painter"], bannerImg: "", screenshots: [], trailerUrl: "", codeSnippet: "// Dynamic ecosystem tick", codeLang: "cpp", btsImages: [], playUrl: "#", downloadUrl: "#", downloads: 4210, plays: 19300, status: "published", color: "#ff9500" },
  { id: "4", title: "Pixel Depths", tagline: "Die. Learn. Descend deeper.", description: "Roguelike dungeon crawler with hand-crafted room templates, procedural assembly, and brutal permadeath.", story: "Born from my love of classic roguelikes and pixel art — hand-designed rooms assembled procedurally.", goal: "Prove that pixel art roguelikes can still innovate.", learned: "Balancing difficulty in a permadeath game is an art. Adaptive invisible difficulty is the key.", engine: "Unity", genre: "Roguelike", platform: "PC / Mobile", teamSize: "Solo", year: "2025", devTime: "5 months", techStack: ["Unity", "C#", "Aseprite", "Tiled"], bannerImg: "", screenshots: [], trailerUrl: "", codeSnippet: "// Adaptive difficulty scaling", codeLang: "csharp", btsImages: [], playUrl: "#", downloadUrl: "#", downloads: 6102, plays: 31200, status: "published", color: "#30d158" },
  { id: "5", title: "Void Circuit", tagline: "Debug reality itself.", description: "Puzzle platformer set in a deconstructing digital world where glitches are your tools.", story: "What if the game world was breaking apart and you had to use the glitches as mechanics?", goal: "Create a puzzle game where the mechanics feel subversive and surprising.", learned: "What feels intuitive to the designer is often confusing to players — playtesting is everything.", engine: "Godot", genre: "Puzzle Platformer", platform: "PC / Web", teamSize: "Solo", year: "2024", devTime: "3 months", techStack: ["Godot", "GDScript", "Pixelorama"], bannerImg: "", screenshots: [], trailerUrl: "", codeSnippet: "# Wall clip glitch ability", codeLang: "gdscript", btsImages: [], playUrl: "#", downloadUrl: "#", downloads: 920, plays: 5430, status: "published", color: "#0071e3" },
  { id: "6", title: "Iron Bastion", tagline: "Every wall can fall.", description: "Real-time strategy with fully destructible environments and physics-based combat.", story: "RTS games treat buildings as health bars. I wanted destruction to be physical — walls crumble, towers topple.", goal: "Bring real physics destruction to the RTS genre.", learned: "Physics destruction in an RTS is a performance nightmare — LOD systems are essential.", engine: "Unreal", genre: "RTS", platform: "PC", teamSize: "4", year: "2024", devTime: "10 months", techStack: ["Unreal Engine 5", "C++", "Blender", "Houdini"], bannerImg: "", screenshots: [], trailerUrl: "", codeSnippet: "// Destruction LOD system", codeLang: "cpp", btsImages: [], playUrl: "#", downloadUrl: "#", downloads: 3750, plays: 15800, status: "published", color: "#ff375f" },
];

const SEED_POSTS = [
  { id: "1", title: "How I Built Procedural Cities for Neon Drift", date: "2026-03-02", excerpt: "A deep dive into the algorithm behind infinite cyberpunk cityscapes using wave function collapse.", content: "", thumbnail: "", status: "published" },
  { id: "2", title: "Optimizing Physics in Unreal for Iron Bastion", date: "2026-02-18", excerpt: "Lessons learned from making 500+ destructible objects run smoothly on mid-range hardware.", content: "", thumbnail: "", status: "published" },
  { id: "3", title: "Pixel Art Animation Workflow in Aseprite", date: "2026-02-05", excerpt: "My frame-by-frame workflow for creating fluid character animations in retro-style games.", content: "", thumbnail: "", status: "published" },
];

const SEED_BTS = [
  { id: "b1", url: "", caption: "Early Prototype — first playable build" },
  { id: "b2", url: "", caption: "Concept Art — environment exploration" },
  { id: "b3", url: "", caption: "Tileset WIP — hand-painted assets" },
  { id: "b4", url: "", caption: "Layout Sketch — level design planning" },
];

const SEED_SHOWCASE = [
  { id: "s1", title: "Neon City Environment", category: "3D Art", description: "A fully modelled cyberpunk city environment built in Blender with custom neon lighting shaders and procedural textures.", tags: ["Blender", "3D Art", "Environment"], images: [], gif: "", videoUrl: "", downloadUrl: "", downloadLabel: "Download .blend file", year: "2025", status: "published", color: "#af52de" },
  { id: "s2", title: "Character Rig — Space Marine", category: "3D Art", description: "Fully rigged and animated space marine character with custom bone controllers and facial animation system.", tags: ["Blender", "Rigging", "Animation"], images: [], gif: "", videoUrl: "", downloadUrl: "", downloadLabel: "Download assets", year: "2025", status: "published", color: "#0071e3" },
  { id: "s3", title: "Pixel Art Asset Pack", category: "Game Assets", description: "A complete 16x16 dungeon tileset with 200+ tiles, animated torches, doors, and environmental props.", tags: ["Pixel Art", "Aseprite", "Tileset"], images: [], gif: "", videoUrl: "", downloadUrl: "", downloadLabel: "Download pack", year: "2024", status: "published", color: "#30d158" },
];

const SOCIAL_ICONS = {
  "itch.io": `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3.13 1.338C2.08 1.96.5 3.68.5 4.42v1.65c0 1.36.75 2.55 1.86 2.55 1.33 0 2.12-1.1 2.12-2.38 0 1.28.97 2.38 2.3 2.38 1.33 0 2.12-1.1 2.12-2.38 0 1.28.85 2.38 2.18 2.38h1.84c1.33 0 2.18-1.1 2.18-2.38 0 1.28.79 2.38 2.12 2.38 1.33 0 2.3-1.1 2.3-2.38 0 1.28.79 2.38 2.12 2.38 1.11 0 1.86-1.19 1.86-2.55V4.42c0-.74-1.58-2.46-2.63-3.08C19.3.56 16.58.3 12 .3c-4.58 0-7.3.26-8.87 1.04zM12 8.82c-.54.87-1.52 1.48-2.6 1.48h-.07c-1.06 0-2.03-.6-2.57-1.44-.53.84-1.55 1.44-2.6 1.44-.39 0-1.05-.07-1.58-.34v7.2c0 3.36.58 4.17 3.3 4.44 1.5.15 3.2.2 4.12.2.92 0 2.62-.05 4.12-.2 2.72-.27 3.3-1.08 3.3-4.44v-7.2c-.53.27-1.19.34-1.58.34-1.05 0-2.07-.6-2.6-1.44-.54.84-1.51 1.44-2.57 1.44h-.07c-1.08 0-2.06-.61-2.6-1.48zm-1.4 4.08c.76 0 1.38.32 1.38.32s.62-.32 1.38-.32c1.33 0 2.42 1.3 2.42 2.52 0 2.37-2.34 4.46-3.8 5.13-.1.04-.04.04-.14 0-1.46-.67-3.8-2.76-3.8-5.13.04-1.22 1.23-2.52 2.56-2.52z"/></svg>`,
  "Discord": `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.74 19.74 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.11 13.11 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.3 12.3 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.84 19.84 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>`,
  "Twitter / X": `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>`,
  "YouTube": `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12z"/></svg>`,
  "LinkedIn": `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z"/></svg>`,
  "GitHub": `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/></svg>`,
  "Twitch": `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z"/></svg>`,
};

const SEED_SETTINGS = {
  name: "YOUR NAME", role: "Game Developer & AI Engineer", tagline: "I build worlds, one game at a time.", ctaWork: "See My Work", ctaCollab: "Get in Touch",
  logoImg: "", favicon: "",
  bio: "I'm an indie game developer who thrives at the intersection of art and code. From pixel-perfect 2D worlds to immersive 3D environments, I love crafting experiences that pull players in and don't let go.",
  specialties: ["Gameplay Programming", "Level Design", "Pixel Art", "Shader Dev", "Narrative Design", "Procedural Generation"],
  availability: "open",
  email: "",
  socials: [
    { id: "1", name: "GitHub", url: "#", icon: "" },
    { id: "2", name: "LinkedIn", url: "#", icon: "" },
    { id: "3", name: "Hugging Face", url: "#", icon: "" },
    { id: "4", name: "itch.io", url: "#", icon: "" },
  ]
};

const useHash = () => {
  const [h, setH] = useState(window.location.hash || "#/");
  useEffect(() => { const fn = () => setH(window.location.hash || "#/"); window.addEventListener("hashchange", fn); return () => window.removeEventListener("hashchange", fn); }, []);
  return h;
};
const nav = (p) => { window.location.hash = p; window.scrollTo(0, 0); };

// Storage helper — Firebase Realtime Database (saves publicly for everyone)
const storage = {
  get: async (key) => {
    try {
      const snap = await get(ref(db, key.replace(/[.#$/\[\]]/g, "_")));
      if (snap.exists()) return { value: snap.val() };
    } catch {}
    try { const v = localStorage.getItem(key); if (v) return { value: v }; } catch {}
    return null;
  },
  set: async (key, value) => {
    try { await set(ref(db, key.replace(/[.#$/\[\]]/g, "_")), value); } catch {}
    try { localStorage.setItem(key, value); } catch {}
    return null;
  },
  delete: async (key) => {
    try { await set(ref(db, key.replace(/[.#$/\[\]]/g, "_")), null); } catch {}
    try { localStorage.removeItem(key); } catch {}
    return null;
  },
};

const uploadImageToStorage = async (base64, path) => {
  try {
    if (!base64 || !base64.startsWith("data:image")) return base64;
    const imgRef = storageRef(fbStorage, `portfolio/${path}_${Date.now()}`);
    await uploadString(imgRef, base64, "data_url");
    const url = await getDownloadURL(imgRef);
    return url;
  } catch (e) {
    console.error("Upload failed:", e);
    return base64;
  }
};

const uploadAllImages = async (obj, prefix) => {
  const o = { ...obj };
  for (const key of ["bannerImg", "cardGif", "gif", "thumbnail"]) {
    if (o[key] && o[key].startsWith("data:image")) {
      o[key] = await uploadImageToStorage(o[key], `${prefix}_${key}`);
    }
  }
  for (const key of ["cardImages", "screenshots", "btsImages", "images"]) {
    if (Array.isArray(o[key])) {
      o[key] = await Promise.all(o[key].map((img, i) =>
        img && img.startsWith("data:image")
          ? uploadImageToStorage(img, `${prefix}_${key}_${i}`)
          : Promise.resolve(img)
      ));
    }
  }
  return o;
};

const useData = () => {
  const [data, setData] = useState({ games: SEED_GAMES, posts: SEED_POSTS, messages: [], bts: SEED_BTS, showcase: SEED_SHOWCASE, settings: SEED_SETTINGS, loaded: false });
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => { setAuthed(!!user); });
    (async () => {
      try {
        const localFull = localStorage.getItem("portfolio_data_v2_full");
        if (localFull) {
          setData({ ...JSON.parse(localFull), loaded: true });
        } else {
          const r = await storage.get("portfolio_data_v2");
          if (r?.value) setData({ ...JSON.parse(r.value), loaded: true });
          else setData(p => ({ ...p, loaded: true }));
        }
        try {
          const msnap = await get(ref(db, "messages"));
          if (msnap.exists()) setData(p => ({ ...p, messages: Object.values(msnap.val() || {}) }));
        } catch {}
      } catch { setData(p => ({ ...p, loaded: true })); }
    })();
    return () => unsub();
  }, []);

  const save = useCallback(async (nd) => {
    setData(nd);
    const { messages, ...blob } = nd; // messages live in their own locked node, not the public blob
    try {
      await storage.set("portfolio_data_v2", JSON.stringify(blob));
      try { localStorage.setItem("portfolio_data_v2_full", JSON.stringify(nd)); } catch {}
    } catch (e) {
      console.error("Save error:", e);
      try { localStorage.setItem("portfolio_data_v2_full", JSON.stringify(nd)); } catch {}
    }
  }, []);

  const login = async (email, password) => {
    try { await signInWithEmailAndPassword(auth, email, password); return true; }
    catch (e) { return false; }
  };

  const logout = async () => {
    try { await signOut(auth); } catch {}
    nav("#/");
  };

  return { data, save, auth: authed, login, logout };
};

// ── Shared UI ──────────────────────────────────────────────────────────────

const Reveal = ({ children, delay = 0, style = {} }) => {
  const ref = useRef(null); const [v, setV] = useState(false);
  useEffect(() => { const el = ref.current; const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setV(true); obs.disconnect(); } }, { threshold: 0.08 }); if (el) obs.observe(el); return () => obs.disconnect(); }, []);
  return <div ref={ref} style={{ ...style, opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(28px)", transition: `opacity 0.8s ${delay}s cubic-bezier(.25,.46,.45,.94), transform 0.8s ${delay}s cubic-bezier(.25,.46,.45,.94)` }}>{children}</div>;
};

const Badge = ({ children, color }) => (
  <span style={{ display: "inline-block", padding: "5px 14px", borderRadius: 980, fontSize: 12, fontWeight: 500, background: color ? color + "12" : BG2, color: color || TX2, letterSpacing: 0.2 }}>{children}</span>
);

const AppleBtn = ({ children, primary, color, onClick, full, small, style: sx = {} }) => {
  const [h, setH] = useState(false);
  return (
    <button onClick={onClick} onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} style={{
      fontFamily: FONT, fontSize: small ? 14 : 17, fontWeight: 400,
      padding: small ? "9px 20px" : "12px 28px", borderRadius: 980, cursor: "pointer", width: full ? "100%" : "auto",
      display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
      ...(primary
        ? { background: h ? (color ? color + "dd" : "#0077ED") : (color || AC), color: "#fff", border: "none" }
        : { background: h ? BG2 : "transparent", color: color || AC, border: "none" }),
      transition: "all 0.3s cubic-bezier(.25,.46,.45,.94)", ...sx
    }}>{children}{!primary && <span>›</span>}</button>
  );
};

const Input = ({ label, value, onChange, placeholder, type = "text", textarea, rows = 4 }) => (
  <div style={{ marginBottom: 20 }}>
    {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 6 }}>{label}</label>}
    {textarea
      ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${BORDER}`, background: BG2, color: TX, fontSize: 15, outline: "none", fontFamily: FONT, resize: "vertical", boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = AC} onBlur={e => e.target.style.borderColor = BORDER} />
      : <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${BORDER}`, background: BG2, color: TX, fontSize: 15, outline: "none", fontFamily: FONT, boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = AC} onBlur={e => e.target.style.borderColor = BORDER} />
    }
  </div>
);

const TagInput = ({ label, tags = [], onChange }) => {
  const [v, setV] = useState("");
  const add = () => { if (v.trim() && !tags.includes(v.trim())) { onChange([...tags, v.trim()]); setV(""); } };
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 6 }}>{label}</label>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        {tags.map(t => <span key={t} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "5px 14px", borderRadius: 980, background: BG2, color: TX, fontSize: 13, fontWeight: 500 }}>{t}<span onClick={() => onChange(tags.filter(x => x !== t))} style={{ cursor: "pointer", color: TX3 }}>×</span></span>)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={v} onChange={e => setV(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())} placeholder="Add tag..." style={{ flex: 1, padding: "10px 14px", borderRadius: 12, border: `1px solid ${BORDER}`, background: BG2, color: TX, fontSize: 14, outline: "none", fontFamily: FONT }} />
        <button onClick={add} style={{ padding: "10px 18px", borderRadius: 12, border: "none", background: AC, color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 500 }}>+</button>
      </div>
    </div>
  );
};

// ── Media Library — Firebase Storage backed ────────────────────────────────
const ML_CACHE_KEY = "media_library_cache_v1";
const getMediaCache = () => { try { return JSON.parse(localStorage.getItem(ML_CACHE_KEY) || "[]"); } catch { return []; } };
const setMediaCache = (urls) => { try { localStorage.setItem(ML_CACHE_KEY, JSON.stringify(urls)); } catch {} };
const addToMediaLibrary = (url) => {
  if (!url || url.startsWith("data:")) return;
  const cache = getMediaCache();
  if (!cache.includes(url)) { cache.unshift(url); setMediaCache(cache); }
};
const fetchMediaLibrary = async () => {
  try {
    const folderRef = storageRef(fbStorage, "portfolio");
    const result = await listAll(folderRef);
    const urls = await Promise.all(result.items.map(item => getDownloadURL(item)));
    urls.sort((a, b) => {
      const getTs = u => { const m = u.match(/img_(\d+)_/); return m ? parseInt(m[1]) : 0; };
      return getTs(b) - getTs(a);
    });
    setMediaCache(urls);
    return urls;
  } catch (e) { console.error("Failed to fetch media library:", e); return getMediaCache(); }
};
const deleteFromStorage = async (url) => {
  try {
    const path = decodeURIComponent(url.split("/o/")[1]?.split("?")[0] || "");
    if (path) { const imgRef = storageRef(fbStorage, path); await deleteObject(imgRef); }
  } catch (e) { console.error("Delete from storage failed:", e); }
  setMediaCache(getMediaCache().filter(u => u !== url));
};
const getMediaLibrary = getMediaCache;
const removeFromMediaLibrary = (url) => setMediaCache(getMediaCache().filter(u => u !== url));

const MediaPickerModal = ({ onSelect, onClose, multi }) => {
  const [library, setLibrary] = useState(getMediaCache());
  useEffect(() => { fetchMediaLibrary().then(setLibrary); }, []);
  const [uploading, setUploading] = useState(false);
  const [selected, setSelected] = useState([]);
  const [tab, setTab] = useState(library.length > 0 ? "library" : "upload");

  const uploadFiles = async (files) => {
    setUploading(true);
    try {
      const results = await Promise.all(Array.from(files).map(f => new Promise((resolve) => {
        const r = new FileReader();
        r.onload = async () => {
          try {
            const imgRef = storageRef(fbStorage, `portfolio/img_${Date.now()}_${Math.random().toString(36).slice(2,7)}`);
            await uploadString(imgRef, r.result, "data_url");
            const url = await getDownloadURL(imgRef);
            addToMediaLibrary(url);
            resolve(url);
          } catch { resolve(r.result); }
        };
        r.readAsDataURL(f);
      })));
      setLibrary(getMediaLibrary());
      if (multi) { setSelected(p => [...p, ...results]); setTab("library"); }
      else { onSelect(results[0]); onClose(); }
    } finally { setUploading(false); }
  };

  const toggleSelect = (url) => {
    if (!multi) { onSelect(url); onClose(); return; }
    setSelected(p => p.includes(url) ? p.filter(u => u !== url) : [...p, url]);
  };
  const removeImg = async (url, e) => {
    e.stopPropagation();
    await deleteFromStorage(url);
    setLibrary(prev => prev.filter(u => u !== url));
    setSelected(p => p.filter(u => u !== url));
  };
  const confirmMulti = () => { if (selected.length > 0) { onSelect(selected); onClose(); } };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: CARDBG, borderRadius: 20, width: "100%", maxWidth: 680, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontFamily: FONTD, fontSize: 18, fontWeight: 700, color: TX }}>🗂️ Media Library</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {multi && selected.length > 0 && (
              <button onClick={confirmMulti} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: AC, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Use {selected.length} selected</button>
            )}
            <button onClick={onClose} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: TX2, fontSize: 13, cursor: "pointer" }}>✕ Close</button>
          </div>
        </div>
        <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${BORDER}`, padding: "0 24px" }}>
          {[["library", `📁 Library (${library.length})`], ["upload", "⬆️ Upload New"]].map(([t, l]) => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "12px 16px", border: "none", background: "transparent", color: tab === t ? AC : TX2, fontFamily: FONT, fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: "pointer", borderBottom: `2px solid ${tab === t ? AC : "transparent"}`, marginBottom: -1, transition: "all 0.2s" }}>{l}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {tab === "upload" ? (
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 200, borderRadius: 16, border: `2px dashed ${uploading ? AC : BORDER}`, background: uploading ? `${AC}05` : BG2, cursor: "pointer", color: TX2, gap: 12, transition: "all 0.3s" }}>
              <input type="file" accept="image/*,image/gif" multiple={multi} onChange={e => uploadFiles(e.target.files)} style={{ display: "none" }} />
              <span style={{ fontSize: 40 }}>{uploading ? "⏳" : "📤"}</span>
              <span style={{ fontSize: 15, fontWeight: 500, color: uploading ? AC : TX2 }}>{uploading ? "Uploading to Firebase..." : `Click or drag to upload image${multi ? "s" : ""}`}</span>
              <span style={{ fontSize: 12, color: TX3 }}>Supports JPG, PNG, GIF, WebP</span>
            </label>
          ) : library.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: TX2 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
              <p>No images yet. Upload some first!</p>
              <button onClick={() => setTab("upload")} style={{ marginTop: 12, padding: "8px 20px", borderRadius: 10, border: "none", background: AC, color: "#fff", fontSize: 13, cursor: "pointer" }}>Upload now</button>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 12, color: TX3, marginBottom: 12 }}>{multi ? "Click images to select multiple, then click Use selected" : "Click an image to use it"}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                {library.map((url, i) => (
                  <div key={i} onClick={() => toggleSelect(url)} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `3px solid ${selected.includes(url) ? AC : "transparent"}`, cursor: "pointer", transition: "all 0.2s", boxShadow: selected.includes(url) ? `0 0 0 2px ${AC}40` : "none" }}>
                    <img src={url} alt="" style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                    {selected.includes(url) && (
                      <div style={{ position: "absolute", top: 6, left: 6, width: 22, height: 22, borderRadius: "50%", background: AC, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</div>
                    )}
                    <button onClick={e => removeImg(url, e)} style={{ position: "absolute", top: 6, right: 6, width: 22, height: 22, borderRadius: "50%", background: "rgba(255,59,48,0.9)", border: "none", color: "#fff", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>×</button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const IMG_EXT = /\.(png|jpe?g|gif|webp|svg|avif|bmp)$/i;
const GitHubMediaPicker = ({ onSelect, onClose, multi }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [selected, setSelected] = useState([]);
  useEffect(() => {
    let alive = true;
    setLoading(true); setErr("");
    fetch(`https://api.github.com/repos/${GH_IMG.owner}/${GH_IMG.repo}/contents/${GH_IMG.path}?ref=${GH_IMG.branch}`)
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(list => { if (!alive) return; const imgs = (Array.isArray(list) ? list : []).filter(f => f.type === "file" && IMG_EXT.test(f.name)).map(f => ({ name: f.name, url: f.download_url })); setItems(imgs); setLoading(false); })
      .catch(() => { if (alive) { setErr(`Couldn't read the "${GH_IMG.path}" folder in ${GH_IMG.owner}/${GH_IMG.repo}. Make sure the repo is public and the folder exists.`); setLoading(false); } });
    return () => { alive = false; };
  }, []);
  const pick = (url) => { if (!multi) { onSelect(url); onClose(); return; } setSelected(p => p.includes(url) ? p.filter(u => u !== url) : [...p, url]); };
  const confirmMulti = () => { if (selected.length) { onSelect(selected); onClose(); } };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div onClick={e => e.stopPropagation()} style={{ background: CARDBG, borderRadius: 20, width: "100%", maxWidth: 680, maxHeight: "80vh", display: "flex", flexDirection: "column", boxShadow: "0 24px 80px rgba(0,0,0,0.25)", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ fontFamily: FONTD, fontSize: 18, fontWeight: 700, color: TX }}>🖼️ Choose an image</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {multi && selected.length > 0 && <button onClick={confirmMulti} style={{ padding: "8px 18px", borderRadius: 10, border: "none", background: AC, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Use {selected.length} selected</button>}
            <button onClick={onClose} style={{ padding: "8px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: TX2, fontSize: 13, cursor: "pointer" }}>✕ Close</button>
          </div>
        </div>
        <div style={{ padding: "10px 24px", borderBottom: `1px solid ${BORDER}`, fontSize: 12, color: TX3 }}>
          Showing images from <strong style={{ color: TX2 }}>{GH_IMG.owner}/{GH_IMG.repo}/{GH_IMG.path}</strong>. Add files to that folder on GitHub and they appear here.
        </div>
        <div style={{ flex: 1, overflow: "auto", padding: 20 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: TX2 }}>Loading images…</div>
          ) : err ? (
            <div style={{ textAlign: "center", padding: "40px 0", color: "#ff9500", fontSize: 14, lineHeight: 1.6 }}>{err}</div>
          ) : items.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: TX2 }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
              <p>No images in that folder yet. Upload some to the <strong>{GH_IMG.path}</strong> folder on GitHub.</p>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 12, color: TX3, marginBottom: 12 }}>{multi ? "Click images to select multiple, then click Use selected." : "Click an image to use it."}</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                {items.map((it, i) => (
                  <div key={i} onClick={() => pick(it.url)} title={it.name} style={{ position: "relative", borderRadius: 12, overflow: "hidden", border: `3px solid ${selected.includes(it.url) ? AC : "transparent"}`, cursor: "pointer", boxShadow: selected.includes(it.url) ? `0 0 0 2px ${AC}40` : "none" }}>
                    <img src={it.url} alt={it.name} loading="lazy" style={{ width: "100%", height: 110, objectFit: "cover", display: "block" }} />
                    {selected.includes(it.url) && <div style={{ position: "absolute", top: 6, left: 6, width: 22, height: 22, borderRadius: "50%", background: AC, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>✓</div>}
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "3px 6px", background: "rgba(0,0,0,0.55)", color: "#fff", fontSize: 10, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{it.name}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const ImgUpload = ({ label, value, onChange, multi }) => {
  const [open, setOpen] = useState(false);
  const handleSelect = (urlOrUrls) => {
    if (multi) {
      const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
      onChange(prev => [...(Array.isArray(prev) ? prev : []), ...urls]);
    } else { onChange(urlOrUrls); }
  };
  const removeOne = (idx) => onChange(value.filter((_, j) => j !== idx));
  return (
    <div style={{ marginBottom: 20 }}>
      {label && <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 6 }}>{label}</label>}
      {!multi && value && (
        <div style={{ position: "relative", display: "inline-block", marginBottom: 8 }}>
          <img src={value} alt="" style={{ maxWidth: "100%", maxHeight: 100, borderRadius: 12, objectFit: "cover", display: "block" }} />
          <span onClick={() => onChange("")} style={{ position: "absolute", top: -5, right: -5, width: 20, height: 20, borderRadius: "50%", background: "#ff3b30", color: "#fff", fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>×</span>
        </div>
      )}
      {multi && Array.isArray(value) && value.length > 0 && (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
          {value.map((img, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img src={img} alt="" style={{ width: 64, height: 64, borderRadius: 10, objectFit: "cover" }} />
              <span onClick={() => removeOne(i)} style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: "#ff3b30", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>×</span>
            </div>
          ))}
        </div>
      )}
      <button type="button" onClick={() => setOpen(true)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", height: 56, borderRadius: 12, border: `2px dashed ${BORDER}`, background: BG2, cursor: "pointer", color: TX2, fontSize: 14, fontFamily: FONT, fontWeight: 500, transition: "all 0.2s" }} onMouseEnter={e => { e.currentTarget.style.borderColor = AC; e.currentTarget.style.color = AC; }} onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = TX2; }}>
        🗂️ {multi ? "Add from Library / Upload" : "Choose from Library / Upload"}
      </button>
      {open && <GitHubMediaPicker onSelect={handleSelect} onClose={() => setOpen(false)} multi={multi} />}
    </div>
  );
};

const Stat = ({ label, value }) => (
  <div style={{ textAlign: "center", flex: "1 1 100px" }}>
    <div style={{ fontSize: 32, fontWeight: 700, color: TX, letterSpacing: -1, fontFamily: FONTD }}>{value}</div>
    <div style={{ fontSize: 13, color: TX2, marginTop: 4, fontWeight: 500 }}>{label}</div>
  </div>
);

const SocialIcon = ({ name, customIcon, size = 18, color = "currentColor" }) => {
  if (customIcon) return <img src={customIcon} alt={name} style={{ width: size, height: size, borderRadius: 4, objectFit: "contain" }} />;
  const svg = SOCIAL_ICONS[name];
  if (svg) return <span style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", color }} dangerouslySetInnerHTML={{ __html: svg.replace('viewBox=', `width="${size}" height="${size}" viewBox=`) }} />;
  return <span style={{ fontSize: size * 0.7, fontWeight: 700, color, lineHeight: 1 }}>{(name || "?")[0].toUpperCase()}</span>;
};

// Uploadable brand logo (image) with "M" monogram fallback
const BrandLogo = ({ logoImg, size = 30, radius = 9, fontSize = 17, alt = "Logo" }) => (
  logoImg
    ? <img src={logoImg} alt={alt} style={{ height: size, maxWidth: size * 5, borderRadius: radius - 1, objectFit: "contain", display: "block" }} />
    : <div style={{ width: size, height: size, borderRadius: radius, background: `linear-gradient(135deg, ${GRAD2}, ${GRAD1})`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontFamily: FONTD, fontWeight: 700, fontSize, letterSpacing: -0.5, boxShadow: "0 2px 8px rgba(94,92,230,0.3)" }}>M</div>
);

const ThemeToggle = ({ theme, onToggle, style = {} }) => (
  <button onClick={onToggle} title="Toggle light / dark" aria-label="Toggle theme" style={{ background: "none", border: "none", cursor: "pointer", padding: 6, fontSize: 16, lineHeight: 1, ...style }}>
    {theme === "dark" ? "☀️" : "🌙"}
  </button>
);

// ── Project external links (GitHub / Hugging Face / Live demo / etc.) ───────
const linkMeta = (url = "", label = "") => {
  const u = (url || "").toLowerCase();
  let kind = "web", auto = "Live";
  if (u.includes("github.com")) { kind = "github"; auto = "GitHub"; }
  else if (u.includes("huggingface.co")) { kind = "hf"; auto = "Hugging Face"; }
  else if (u.includes("play.google.com")) { kind = "play"; auto = "Google Play"; }
  else if (u.includes("itch.io")) { kind = "itch"; auto = "itch.io"; }
  else if (u.includes("youtube.") || u.includes("youtu.be")) { kind = "youtube"; auto = "YouTube"; }
  else if (u.includes("npmjs.com")) { kind = "npm"; auto = "npm"; }
  else if (u.includes("vercel.app") || u.includes("netlify.app") || u.includes("github.io") || u.includes("pages.dev")) { kind = "web"; auto = "Live Demo"; }
  return { kind, label: label && label.trim() ? label : auto };
};

const LinkGlyph = ({ kind, size = 16 }) => {
  const svgName = kind === "github" ? "GitHub" : kind === "itch" ? "itch.io" : kind === "youtube" ? "YouTube" : null;
  if (svgName && SOCIAL_ICONS[svgName]) {
    return <span style={{ width: size, height: size, display: "inline-flex" }} dangerouslySetInnerHTML={{ __html: SOCIAL_ICONS[svgName].replace('viewBox=', `width="${size}" height="${size}" viewBox=`) }} />;
  }
  const emoji = kind === "hf" ? "🤗" : kind === "play" ? "▶️" : kind === "npm" ? "📦" : "🌐";
  return <span style={{ fontSize: size - 2, lineHeight: 1 }}>{emoji}</span>;
};

// Compact icon-only row (used on project cards)
const ProjectLinkIcons = ({ links = [] }) => {
  const valid = (links || []).filter(l => l && l.url && l.url !== "#");
  if (valid.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 14, flexWrap: "wrap" }}>
      {valid.map((l, i) => {
        const m = linkMeta(l.url, l.label);
        return (
          <span key={i} title={m.label} style={{ width: 30, height: 30, borderRadius: 8, background: BG2, display: "inline-flex", alignItems: "center", justifyContent: "center", color: TX2 }}>
            <LinkGlyph kind={m.kind} size={15} />
          </span>
        );
      })}
    </div>
  );
};

// Labeled buttons (used on the project detail page)
const ProjectLinkButtons = ({ links = [] }) => {
  const valid = (links || []).filter(l => l && l.url && l.url !== "#");
  if (valid.length === 0) return null;
  return (
    <>
      {valid.map((l, i) => {
        const m = linkMeta(l.url, l.label);
        return (
          <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" onClick={() => createTracker().then(t => t.trackClick(`Project Link: ${m.label}`, `${m.label} link opened`, "🔗"))} style={{ textDecoration: "none" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "9px 18px", borderRadius: 980, background: BG2, color: TX, fontSize: 14, fontWeight: 500, fontFamily: FONT }}>
              <LinkGlyph kind={m.kind} size={16} /> {m.label}
            </span>
          </a>
        );
      })}
    </>
  );
};

// Browser-chrome wrapper (mac dots + url bar) used by embed / browser sections
const BrowserFrame = ({ children, url = "", compact }) => (
  <div style={{ borderRadius: compact ? 12 : 16, overflow: "hidden", border: `1px solid ${BORDER}`, background: BG2, boxShadow: SHADOW }}>
    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: compact ? "7px 10px" : "10px 14px", background: BG3, borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ display: "flex", gap: 5 }}>
        {["#ff5f57", "#febc2e", "#28c840"].map(c => <div key={c} style={{ width: compact ? 8 : 11, height: compact ? 8 : 11, borderRadius: "50%", background: c }} />)}
      </div>
      {url && <div style={{ flex: 1, marginLeft: 6, padding: compact ? "3px 10px" : "5px 14px", borderRadius: 980, background: BG4, color: TX3, fontSize: compact ? 10 : 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{url.replace(/^https?:\/\//, "")}</div>}
    </div>
    <div style={{ background: BG }}>{children}</div>
  </div>
);

// Live GitHub repo card — fetches stars/lang/desc from the public API (anon, ~60/hr); degrades to a plain link
const GitHubRepoCard = ({ url = "", role = "" }) => {
  const slug = (() => { const m = (url || "").match(/github\.com\/([^/]+\/[^/?#]+)/i); return m ? m[1].replace(/\.git$/, "") : ""; })();
  const [repo, setRepo] = useState(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!slug) return;
    let alive = true;
    fetch(`https://api.github.com/repos/${slug}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(d => { if (alive) setRepo(d); })
      .catch(() => { if (alive) setFailed(true); });
    return () => { alive = false; };
  }, [slug]);
  if (!slug) return null;
  const langColors = { JavaScript: "#f1e05a", TypeScript: "#3178c6", Python: "#3572A5", "C#": "#178600", "C++": "#f34b7d", C: "#555555", HTML: "#e34c26", CSS: "#563d7c", Shell: "#89e051", Java: "#b07219", Go: "#00ADD8", Rust: "#dea584", Ruby: "#701516", Dart: "#00B4AB", Kotlin: "#A97BFF", Swift: "#F05138" };
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => createTracker().then(t => t.trackClick("GitHub Repo Card", `Repo opened: ${slug}`, "🐙"))} style={{ textDecoration: "none", display: "block" }}>
      <div style={{ border: `1px solid ${BORDER}`, borderRadius: 16, padding: 22, background: CARDBG, boxShadow: SHADOW, transition: "all 0.3s" }} onMouseEnter={e => e.currentTarget.style.boxShadow = SHADOW2} onMouseLeave={e => e.currentTarget.style.boxShadow = SHADOW}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ width: 22, height: 22, display: "inline-flex", color: TX }} dangerouslySetInnerHTML={{ __html: SOCIAL_ICONS.GitHub.replace('viewBox=', 'width="22" height="22" viewBox=') }} />
          <span style={{ fontFamily: FONTD, fontSize: 16, fontWeight: 700, color: TX, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{repo?.full_name || slug}</span>
          {role && <span style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: AC, background: `${AC}12`, padding: "3px 10px", borderRadius: 980, flexShrink: 0 }}>{role}</span>}
        </div>
        <p style={{ color: TX2, fontSize: 14, lineHeight: 1.6, margin: "0 0 14px" }}>{repo?.description || "View the source and docs on GitHub."}</p>
        <div style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
          {repo?.language && <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: TX2 }}><span style={{ width: 11, height: 11, borderRadius: "50%", background: langColors[repo.language] || TX3 }} />{repo.language}</span>}
          {repo && <span style={{ fontSize: 13, color: TX2 }}>★ {repo.stargazers_count?.toLocaleString?.() ?? 0}</span>}
          {repo && <span style={{ fontSize: 13, color: TX2 }}>⑂ {repo.forks_count?.toLocaleString?.() ?? 0}</span>}
          <span style={{ marginLeft: "auto", fontSize: 13, fontWeight: 600, color: AC }}>View on GitHub ›</span>
        </div>
      </div>
    </a>
  );
};

// ── Mini-game ──────────────────────────────────────────────────────────────
const OrbitalDefense = () => {
  const canvasRef = useRef(null);
  const g = useRef({ mx: 0, my: 0, cx: 0, cy: 0, coreHP: 5, maxHP: 5, score: 0, best: 0, combo: 0, maxCombo: 0, threats: [], particles: [], pickups: [], shieldAngle: 0, shieldLen: 0.9, shieldFlash: 0, coreFlash: 0, wave: 1, waveTimer: 0, waveDelay: 280, spawnRate: 90, spawnTimer: 0, gameOver: false, started: false, time: 0, screenShake: 0, powerup: null, powerupTimer: 0, trail: [] });
  useEffect(() => {
    const c = canvasRef.current, ctx = c.getContext("2d"); let raf, W, H;
    const resize = () => { c.width = c.offsetWidth; c.height = c.offsetHeight; W = c.width; H = c.height; g.current.cx = W / 2; g.current.cy = H / 2; };
    resize(); window.addEventListener("resize", resize);
    const onMove = (e) => { const r = c.getBoundingClientRect(); g.current.mx = e.clientX - r.left; g.current.my = e.clientY - r.top; if (!g.current.started) g.current.started = true; };
    const onTouch = (e) => { const r = c.getBoundingClientRect(); g.current.mx = e.touches[0].clientX - r.left; g.current.my = e.touches[0].clientY - r.top; if (!g.current.started) g.current.started = true; };
    const onClick = () => { if (g.current.gameOver) { Object.assign(g.current, { coreHP: 5, score: 0, combo: 0, threats: [], pickups: [], wave: 1, spawnRate: 90, gameOver: false, started: true, powerup: null }); } };
    c.addEventListener("mousemove", onMove); c.addEventListener("touchmove", onTouch, { passive: true }); c.addEventListener("click", onClick);
    const spawnThreat = () => {
      const s = g.current, ang = Math.random() * Math.PI * 2, dist = Math.max(W, H) * 0.7;
      const x = s.cx + Math.cos(ang) * dist, y = s.cy + Math.sin(ang) * dist;
      const speed = 1.2 + s.wave * 0.15 + Math.random() * 0.8, dx = s.cx - x, dy = s.cy - y, d = Math.hypot(dx, dy);
      const t = Math.random(); let kind = "normal";
      if (s.wave >= 3 && t > 0.82) kind = "fast"; if (s.wave >= 5 && t > 0.92) kind = "heavy";
      const spd = kind === "fast" ? speed * 1.7 : kind === "heavy" ? speed * 0.6 : speed;
      s.threats.push({ x, y, vx: (dx / d) * spd, vy: (dy / d) * spd, r: kind === "heavy" ? 10 : kind === "fast" ? 5 : 7, kind, life: 1, rotation: Math.random() * Math.PI * 2, hp: kind === "heavy" ? 2 : 1 });
    };
    const burst = (x, y, count, hue, spd) => { const s = g.current; for (let i = 0; i < count; i++) { const a = (i / count) * Math.PI * 2 + Math.random() * 0.3; s.particles.push({ x, y, vx: Math.cos(a) * (spd + Math.random() * spd), vy: Math.sin(a) * (spd + Math.random() * spd), life: 1, hue, r: 1.5 + Math.random() * 2.5 }); } };
    const draw = () => {
      const s = g.current; s.time++;
      const sk = s.screenShake > 0 ? (Math.random() - 0.5) * s.screenShake : 0, sky = s.screenShake > 0 ? (Math.random() - 0.5) * s.screenShake : 0;
      s.screenShake *= 0.9; if (s.screenShake < 0.3) s.screenShake = 0;
      ctx.save(); ctx.translate(sk, sky); ctx.clearRect(-10, -10, W + 20, H + 20);
      const cx = s.cx, cy = s.cy;
      if (!s.started) {
        const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60); grd.addColorStop(0, "rgba(0,113,227,0.06)"); grd.addColorStop(1, "rgba(0,113,227,0)");
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, 60, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx, cy, 16 + Math.sin(s.time * 0.03) * 2, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,113,227,0.08)"; ctx.fill();
        for (let i = 0; i < 3; i++) { const a = s.time * 0.015 + (i * Math.PI * 2 / 3); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 40, cy + Math.sin(a) * 40, 3, 0, Math.PI * 2); ctx.fillStyle = "rgba(0,113,227,0.1)"; ctx.fill(); }
        ctx.restore(); raf = requestAnimationFrame(draw); return;
      }
      if (!s.gameOver) {
        s.spawnTimer++; if (s.spawnTimer >= s.spawnRate) { spawnThreat(); s.spawnTimer = 0; }
        s.waveTimer++; if (s.waveTimer >= s.waveDelay) { s.wave++; s.waveTimer = 0; s.spawnRate = Math.max(20, 90 - s.wave * 5); }
        const ang = Math.atan2(s.my - cy, s.mx - cx); s.shieldAngle = ang;
        const shieldDist = 55, arcLen = s.shieldLen + (s.powerup === "wide" ? 0.6 : 0);
        s.shieldFlash = Math.max(0, s.shieldFlash - 0.04);
        s.trail.push({ ang, time: 8 }); if (s.trail.length > 6) s.trail.shift();
        s.trail.forEach(t => { t.time--; if (t.time > 0) { ctx.beginPath(); ctx.arc(cx, cy, shieldDist, t.ang - arcLen / 2, t.ang + arcLen / 2); ctx.strokeStyle = `rgba(0,113,227,${t.time * 0.008})`; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.stroke(); } });
        s.trail = s.trail.filter(t => t.time > 0);
        ctx.beginPath(); ctx.arc(cx, cy, shieldDist, ang - arcLen / 2, ang + arcLen / 2);
        ctx.strokeStyle = `rgba(0,113,227,${0.18 + s.shieldFlash * 0.35})`; ctx.lineWidth = s.shieldFlash > 0 ? 8 : 5; ctx.lineCap = "round"; ctx.stroke();
        s.threats.forEach(t => {
          if (t.life <= 0) return;
          const td = Math.hypot(t.x - cx, t.y - cy);
          if (td < shieldDist + t.r + 6 && td > shieldDist - t.r - 20) {
            const ta = Math.atan2(t.y - cy, t.x - cx); let diff = ta - ang;
            while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
            if (Math.abs(diff) < arcLen / 2 + 0.15) {
              t.hp--; if (t.hp <= 0) { t.life = 0; s.combo++; if (s.combo > s.maxCombo) s.maxCombo = s.combo; s.score += (t.kind === "heavy" ? 3 : t.kind === "fast" ? 2 : 1) * Math.min(s.combo, 10); if (s.score > s.best) s.best = s.score; s.shieldFlash = 1; burst(t.x, t.y, 10, 210, 3); }
              else { const nx = (t.x - cx) / td, ny = (t.y - cy) / td; t.vx = nx * 2; t.vy = ny * 2; s.shieldFlash = 0.5; }
              return;
            }
          }
          if (td < 20) { t.life = 0; s.coreHP--; s.combo = 0; s.coreFlash = 1; s.screenShake = 8; burst(cx, cy, 16, 0, 4); if (s.coreHP <= 0) s.gameOver = true; }
        });
        if (s.powerup) { s.powerupTimer--; if (s.powerupTimer <= 0) s.powerup = null; }
      }
      s.threats.forEach(t => { t.x += t.vx; t.y += t.vy; t.rotation += 0.03; });
      s.threats = s.threats.filter(t => t.life > 0); s.pickups = s.pickups.filter(p => p.life > 0);
      s.coreFlash = Math.max(0, s.coreFlash - 0.03);
      const coreHue = s.coreHP <= 1 ? 0 : s.coreHP <= 2 ? 30 : 210;
      const grd = ctx.createRadialGradient(cx, cy, 0, cx, cy, 45 + Math.sin(s.time * 0.04) * 5);
      grd.addColorStop(0, `hsla(${coreHue},70%,60%,${0.08 + s.coreFlash * 0.15})`); grd.addColorStop(1, `hsla(${coreHue},60%,50%,0)`);
      ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(cx, cy, 45 + Math.sin(s.time * 0.04) * 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx, cy, 18, 0, Math.PI * 2); ctx.strokeStyle = `hsla(${coreHue},60%,60%,${0.12 + s.coreFlash * 0.25})`; ctx.lineWidth = 2; ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, 6 + Math.sin(s.time * 0.05) * 1.5, 0, Math.PI * 2); ctx.fillStyle = `hsla(${coreHue},65%,65%,${0.15 + s.coreFlash * 0.3})`; ctx.fill();
      for (let i = 0; i < s.maxHP; i++) { const pa = -Math.PI / 2 + (i - (s.maxHP - 1) / 2) * 0.35; ctx.beginPath(); ctx.arc(cx + Math.cos(pa) * 30, cy + Math.sin(pa) * 30, 3, 0, Math.PI * 2); ctx.fillStyle = i < s.coreHP ? "rgba(0,113,227,0.25)" : "rgba(200,0,0,0.12)"; ctx.fill(); }
      s.threats.forEach(t => {
        ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(t.rotation);
        if (t.kind === "fast") { ctx.beginPath(); ctx.moveTo(0, -t.r); ctx.lineTo(-t.r * 0.7, t.r * 0.6); ctx.lineTo(t.r * 0.7, t.r * 0.6); ctx.closePath(); ctx.fillStyle = "rgba(255,149,0,0.22)"; ctx.fill(); }
        else if (t.kind === "heavy") { ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; i === 0 ? ctx.moveTo(Math.cos(a) * t.r, Math.sin(a) * t.r) : ctx.lineTo(Math.cos(a) * t.r, Math.sin(a) * t.r); } ctx.closePath(); ctx.fillStyle = "rgba(175,82,222,0.2)"; ctx.fill(); }
        else { ctx.beginPath(); ctx.arc(0, 0, t.r, 0, Math.PI * 2); ctx.fillStyle = "rgba(255,59,48,0.15)"; ctx.fill(); }
        ctx.restore();
      });
      s.particles.forEach(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.025; p.vx *= 0.96; p.vy *= 0.96; if (p.life > 0) { ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); ctx.fillStyle = `hsla(${p.hue},60%,65%,${p.life * 0.3})`; ctx.fill(); } });
      s.particles = s.particles.filter(p => p.life > 0);
      if (s.started) { ctx.font = `600 11px ${FONT}`; ctx.textAlign = "right"; ctx.fillStyle = "rgba(127,127,127,0.35)"; ctx.fillText(`score: ${s.score}`, W - 20, H - 40); ctx.fillText(`wave ${s.wave}`, W - 20, H - 24); if (s.combo > 1) { ctx.fillStyle = "rgba(0,113,227,0.4)"; ctx.fillText(`${s.combo}× combo`, W - 20, H - 56); } }
      if (s.gameOver) { ctx.fillStyle = "rgba(127,127,127,0.18)"; ctx.fillRect(0, 0, W, H); ctx.textAlign = "center"; ctx.font = `700 28px ${FONTD}`; ctx.fillStyle = "rgba(127,127,127,0.6)"; ctx.fillText("game over", cx, cy - 10); ctx.font = `500 15px ${FONT}`; ctx.fillStyle = "rgba(127,127,127,0.5)"; ctx.fillText(`score: ${s.score}  ·  wave ${s.wave}  ·  best combo: ${s.maxCombo}×`, cx, cy + 18); ctx.fillText("click to retry", cx, cy + 42); }
      ctx.restore(); raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); c.removeEventListener("mousemove", onMove); c.removeEventListener("touchmove", onTouch); c.removeEventListener("click", onClick); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} />;
};

// ── Public Sections ────────────────────────────────────────────────────────

const NavProjects = ({ label, cats, onPick, mobile, onAfter }) => {
  const [open, setOpen] = useState(false);
  if (mobile) {
    return (
      <div>
        <button onClick={() => { onPick("All"); onAfter && onAfter(); }} style={{ display: "block", width: "100%", background: "none", border: "none", color: TX, cursor: "pointer", fontFamily: FONT, fontSize: 16, padding: "12px 24px", textAlign: "left" }}>{label}</button>
        <div style={{ paddingLeft: 8 }}>
          {cats.filter(c => c !== "All").map(c => (
            <button key={c} onClick={() => { onPick(c); onAfter && onAfter(); }} style={{ display: "block", width: "100%", background: "none", border: "none", color: TX2, cursor: "pointer", fontFamily: FONT, fontSize: 14, padding: "8px 24px", textAlign: "left" }}>↳ {c}</button>
          ))}
        </div>
      </div>
    );
  }
  return (
    <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} style={{ position: "relative" }}>
      <button onClick={() => onPick("All")} style={{ background: "none", border: "none", color: TX2, cursor: "pointer", fontFamily: FONT, fontSize: 12, padding: "6px 10px", borderRadius: 6, whiteSpace: "nowrap" }} onMouseEnter={e => e.target.style.color = TX} onMouseLeave={e => e.target.style.color = TX2}>{label} ▾</button>
      {open && (
        <div style={{ position: "absolute", top: "100%", left: 0, minWidth: 170, background: "var(--nav-bg-solid)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: `0.5px solid ${BORDER}`, borderRadius: 12, padding: 6, boxShadow: SHADOW2, zIndex: 120 }}>
          {cats.map(c => (
            <button key={c} onClick={() => onPick(c)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", color: TX2, cursor: "pointer", fontFamily: FONT, fontSize: 13, padding: "8px 12px", borderRadius: 8, whiteSpace: "nowrap" }} onMouseEnter={e => { e.currentTarget.style.color = TX; e.currentTarget.style.background = BG2; }} onMouseLeave={e => { e.currentTarget.style.color = TX2; e.currentTarget.style.background = "none"; }}>{c === "All" ? "All projects" : c}</button>
          ))}
        </div>
      )}
    </div>
  );
};

const PortNav = ({ settings, data, theme, onToggleTheme, projCategories = [], onPickCategory }) => {
  const [sc, setSc] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { const h = () => setSc(window.scrollY > 10); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  const scrollTo = (id) => { document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); setMenuOpen(false); };

  const allLinks = [
    ["games", "Projects", data.games.filter(g => g.status === "published").length > 0],
    ["showcase", "Showcase", (data.showcase || []).filter(s => s.status === "published").length > 0],
    ["about", "About", true],
    ["skills", "Skills", data.settings.specialties && data.settings.specialties.length > 0],
    ["bts", "Behind the Scenes", data.bts.length > 0],
    ["blog", "Blog", data.posts.filter(p => p.status === "published").length > 0],
    ["collab", "Contact", true],
  ];
  const links = allLinks.filter(([, , show]) => show);
  const brandName = settings.name && settings.name !== "YOUR NAME" ? settings.name : "Muad";

  return (
    <>
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "var(--nav-bg)", backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)", borderBottom: `0.5px solid ${sc ? BORDER : "transparent"}`, transition: "border-bottom 0.3s" }}>
        <div style={{ maxWidth: 1024, margin: "0 auto", padding: "0 20px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52 }}>
          <div onClick={() => nav("#/")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <BrandLogo logoImg={settings.logoImg} alt={brandName} />
            <span style={{ fontFamily: FONTD, fontWeight: 700, fontSize: 19, color: TX, letterSpacing: -0.3 }}>{brandName}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }} className="desktop-nav">
              {links.map(([id, l]) => id === "games"
                ? <NavProjects key={id} label={l} cats={["All", ...projCategories]} onPick={(c) => { onPickCategory && onPickCategory(c); scrollTo("games"); }} />
                : <button key={id} onClick={() => scrollTo(id)} style={{ background: "none", border: "none", color: TX2, cursor: "pointer", fontFamily: FONT, fontSize: 12, padding: "6px 10px", borderRadius: 6, whiteSpace: "nowrap" }} onMouseEnter={e => e.target.style.color = TX} onMouseLeave={e => e.target.style.color = TX2}>{l}</button>
              )}
            </div>
            <ThemeToggle theme={theme} onToggle={onToggleTheme} style={{ marginLeft: 4 }} />
            <button onClick={() => setMenuOpen(p => !p)} style={{ display: "none", background: "none", border: "none", cursor: "pointer", padding: 8, color: TX, fontSize: 20 }} className="mobile-hamburger">
              {menuOpen ? "✕" : "☰"}
            </button>
          </div>
        </div>
      </nav>
      <style>{`
        @media(max-width:640px){
          .desktop-nav{display:none!important}
          .mobile-hamburger{display:block!important}
        }
      `}</style>
      {menuOpen && (
        <div style={{ position: "fixed", top: 52, left: 0, right: 0, zIndex: 99, background: "var(--nav-bg-solid)", backdropFilter: "blur(20px)", borderBottom: `0.5px solid ${BORDER}`, padding: "12px 0 16px" }}>
          {links.map(([id, l]) => id === "games"
            ? <NavProjects key={id} label={l} cats={["All", ...projCategories]} mobile onPick={(c) => { onPickCategory && onPickCategory(c); }} onAfter={() => scrollTo("games")} />
            : <button key={id} onClick={() => scrollTo(id)} style={{ display: "block", width: "100%", background: "none", border: "none", color: TX, cursor: "pointer", fontFamily: FONT, fontSize: 16, padding: "12px 24px", textAlign: "left" }}>{l}</button>
          )}
        </div>
      )}
    </>
  );
};

const Hero = ({ settings }) => {
  const scrollTo = (id) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  return (
    <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(180deg, ${BG3} 0%, ${BG} 100%)`, padding: "120px 24px 100px", textAlign: "center", overflow: "hidden" }}>
      <OrbitalDefense />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 720, pointerEvents: "none" }}>
        <Reveal><p style={{ fontSize: 17, fontWeight: 500, color: TX2, marginBottom: 16 }}>{settings.role || "Game Developer & AI Engineer"}</p></Reveal>
        <Reveal delay={0.08}><h1 style={{ fontFamily: FONTD, fontSize: "clamp(3rem, 8vw, 5.5rem)", fontWeight: 700, color: TX, margin: "0 0 16px", lineHeight: 1.05, letterSpacing: "-0.04em" }}>{settings.name || "Your Name"}.</h1></Reveal>
        <Reveal delay={0.16}><p style={{ fontSize: "clamp(1.1rem, 2.8vw, 1.55rem)", color: TX2, margin: "0 0 44px", lineHeight: 1.5, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>{settings.tagline}</p></Reveal>
        <Reveal delay={0.24}>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", pointerEvents: "auto" }}>
            <AppleBtn primary onClick={() => { scrollTo("games"); createTracker().then(t => t.trackClick("CTA: See My Work", "See My Work clicked", "🎮")); }}>{settings.ctaWork || "See My Work"}</AppleBtn>
            <AppleBtn onClick={() => { scrollTo("collab"); createTracker().then(t => t.trackClick("CTA: Get in Touch", "Get in Touch clicked", "✉️")); }}>{settings.ctaCollab || "Get in Touch"}</AppleBtn>
          </div>
        </Reveal>
        <Reveal delay={0.32}><p style={{ fontSize: 12, color: TX3, marginTop: 48 }}>Move to aim your shield · Defend the core · Click to retry</p></Reveal>
      </div>
    </section>
  );
};

const GameCard = ({ g, i }) => {
  const [h, setH] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const cardImgs = g.cardImages && g.cardImages.length > 0 ? g.cardImages : (g.bannerImg ? [g.bannerImg] : []);
  const hasGif = !!g.cardGif;
  useEffect(() => {
    if (!hasGif && cardImgs.length > 1) {
      const iv = setInterval(() => setImgIdx(p => (p + 1) % cardImgs.length), 2500);
      return () => clearInterval(iv);
    }
  }, [cardImgs.length, hasGif]);
  const mediaSrc = hasGif ? g.cardGif : (cardImgs.length > 0 ? cardImgs[imgIdx] : null);
  return (
    <Reveal delay={i * 0.06} style={{ flex: "1 1 320px", maxWidth: 400 }}>
      <div onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)} onClick={() => { nav(`#/games/${g.id}`); createTracker().then(t => t.trackClick("Game Card Click", `Game card: ${g.title}`, "🎮")); }} style={{ background: CARDBG, borderRadius: 20, overflow: "hidden", boxShadow: h ? SHADOW2 : SHADOW, transform: h ? "scale(1.02)" : "scale(1)", transition: "all 0.5s cubic-bezier(.25,.46,.45,.94)", cursor: "pointer" }}>
        <div style={{ height: 200, background: mediaSrc ? `url(${mediaSrc}) center/cover` : `linear-gradient(145deg, ${g.color}22, ${g.color}08, ${BG2})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {!mediaSrc && <span style={{ fontSize: 48, opacity: 0.25 }}>{(g.category || "Games") === "Games" ? "🎮" : "🧩"}</span>}
        </div>
        <div style={{ padding: "22px 24px 26px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}><Badge color={g.color}>{g.category || "Project"}</Badge>{(g.engine || g.genre) && <Badge>{g.engine || g.genre}</Badge>}</div>
          <h3 style={{ fontFamily: FONTD, fontSize: 22, fontWeight: 700, color: TX, margin: "0 0 6px", letterSpacing: -0.3 }}>{g.title}</h3>
          <p style={{ color: TX2, fontSize: 15, lineHeight: 1.55, margin: 0 }}>{g.description?.substring(0, 100)}...</p>
          <ProjectLinkIcons links={g.links} />
        </div>
      </div>
    </Reveal>
  );
};

const GamesSection = ({ games, category = "All", setCategory }) => {
  const published = games.filter(g => g.status === "published");
  const cats = ["All", ...Array.from(new Set(published.map(g => g.category || "Games")))];
  const active = cats.includes(category) ? category : "All";
  const filtered = published.filter(g => active === "All" || (g.category || "Games") === active);
  const setCat = setCategory || (() => {});
  return (
    <section id="games" style={{ padding: "120px 24px", maxWidth: 1080, margin: "0 auto" }}>
      <Reveal style={{ textAlign: "center", marginBottom: 20 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: AC, marginBottom: 8 }}>Projects</p>
        <h2 style={{ fontFamily: FONTD, fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 700, color: TX, margin: 0, letterSpacing: "-0.03em" }}>Things I've built.</h2>
        <p style={{ color: TX2, fontSize: 17, marginTop: 14, maxWidth: 520, marginLeft: "auto", marginRight: "auto" }}>Deployed work across games, applications and AI. Click any project to dig in.</p>
      </Reveal>
      {cats.length > 2 && (
        <Reveal style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginBottom: 48, marginTop: 36 }}>
          {cats.map(c => <button key={c} onClick={() => setCat(c)} style={{ padding: "8px 20px", borderRadius: 980, border: "none", background: active === c ? TX : BG2, color: active === c ? BG : TX2, fontFamily: FONT, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.3s" }}>{c}</button>)}
        </Reveal>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, justifyContent: "center", marginTop: cats.length > 2 ? 0 : 36 }}>
        {filtered.map((g, i) => <GameCard key={g.id} g={g} i={i} />)}
      </div>
    </section>
  );
};

const About = ({ settings }) => (
  <section id="about" style={{ padding: "120px 24px", background: BG2 }}>
    <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", gap: 56, flexWrap: "wrap", alignItems: "center", justifyContent: "center" }}>
      <Reveal><div style={{ width: 220, height: 220, borderRadius: 32, flexShrink: 0, background: `linear-gradient(145deg, ${GRAD1}20, ${GRAD2}20, ${GRAD3}20)`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 80 }}>👾</div></Reveal>
      <div style={{ flex: 1, minWidth: 280 }}>
        <Reveal>
          <p style={{ fontSize: 15, fontWeight: 600, color: GRAD1, marginBottom: 8 }}>About Me</p>
          <h2 style={{ fontFamily: FONTD, fontSize: "clamp(1.8rem, 4vw, 2.6rem)", fontWeight: 700, color: TX, margin: "0 0 16px", letterSpacing: "-0.03em" }}>Crafting interactive experiences.</h2>
        </Reveal>
        <Reveal delay={0.08}><p style={{ color: TX2, fontSize: 17, lineHeight: 1.65, margin: "0 0 24px" }}>{settings.bio}</p></Reveal>
        <Reveal delay={0.12}><div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{(settings.specialties || []).map(s => <span key={s} style={{ padding: "7px 16px", borderRadius: 980, background: CARDBG, fontSize: 13, color: TX, fontWeight: 500, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>{s}</span>)}</div></Reveal>
      </div>
    </div>
  </section>
);

const SkillBar = ({ name, level, color }) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold: 0.3 });
    if (el) obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ marginBottom: 18 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: TX }}>{name}</span>
        <span style={{ fontSize: 13, fontWeight: 600, color: TX2 }}>{level}%</span>
      </div>
      <div style={{ height: 8, background: BG2, borderRadius: 980, overflow: "hidden" }}>
        <div style={{ height: "100%", width: visible ? `${level}%` : "0%", background: `linear-gradient(90deg, ${color}, ${color}bb)`, borderRadius: 980, transition: "width 1.2s cubic-bezier(.25,.46,.45,.94)" }} />
      </div>
    </div>
  );
};

const Skills = () => {
  const groups = [
    { t: "Game Development", color: GRAD1, items: [["Unity", 92], ["C#", 88], ["PlayFab", 85]] },
    { t: "Programming", color: GRAD2, items: [["JavaScript", 84], ["Python", 80], ["Backends / Node.js", 78]] },
    { t: "AI & Machine Learning", color: AC, items: [["Computer Vision (YOLOv8)", 82], ["Model Training", 80], ["Data Pipelines", 75]] },
    { t: "Cloud & Infrastructure", color: GRAD3, items: [["Microsoft Azure", 80], ["Cosmos DB", 74], ["Cloudflare", 76]] },
  ];
  return (
    <section id="skills" style={{ padding: "120px 24px", maxWidth: 1080, margin: "0 auto" }}>
      <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: GRAD2, marginBottom: 8 }}>Skills & Tools</p>
        <h2 style={{ fontFamily: FONTD, fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 700, color: TX, margin: 0, letterSpacing: "-0.03em" }}>My toolkit.</h2>
        <p style={{ color: TX2, fontSize: 17, marginTop: 14, maxWidth: 480, marginLeft: "auto", marginRight: "auto" }}>Where I spend my time, and how deep I go.</p>
      </Reveal>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
        {groups.map((grp, gi) => (
          <Reveal key={grp.t} delay={gi * 0.08}>
            <div style={{ background: CARDBG, borderRadius: 20, padding: 32, boxShadow: SHADOW, height: "100%" }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: grp.color, letterSpacing: 0.5, textTransform: "uppercase", margin: "0 0 24px" }}>{grp.t}</h3>
              {grp.items.map(([name, level]) => <SkillBar key={name} name={name} level={level} color={grp.color} />)}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
};

const BTSSection = ({ bts }) => (
  <section id="bts" style={{ padding: "120px 24px", background: BG2 }}>
    <div style={{ maxWidth: 1080, margin: "0 auto" }}>
      <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: "#ff9500", marginBottom: 8 }}>Behind the Scenes</p>
        <h2 style={{ fontFamily: FONTD, fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 700, color: TX, margin: 0, letterSpacing: "-0.03em" }}>The process.</h2>
      </Reveal>
      <div style={{ columns: "3 260px", gap: 16 }}>
        {bts.map((b, i) => (
          <Reveal key={b.id || i} delay={i * 0.05}>
            <div style={{ breakInside: "avoid", marginBottom: 16, borderRadius: 16, overflow: "hidden", background: CARDBG, boxShadow: SHADOW }}>
              <div style={{ height: 160 + (i % 3) * 50, background: b.url ? `url(${b.url}) center/cover` : `linear-gradient(${140 + i * 30}deg, ${BG2}, ${BG4})`, display: "flex", alignItems: "center", justifyContent: "center" }}>{!b.url && <span style={{ fontSize: 28, opacity: 0.2 }}>🖼️</span>}</div>
              <div style={{ padding: "14px 18px" }}><p style={{ color: TX, fontSize: 14, fontWeight: 500, margin: 0 }}>{b.caption || "Untitled"}</p></div>
            </div>
          </Reveal>
        ))}
      </div>
    </div>
  </section>
);

const ShowcaseCard = ({ item, i }) => {
  const [imgIndex, setImgIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const heights = [260, 320, 280, 350, 240, 300];
  const h = heights[i % heights.length];
  useEffect(() => {
    if (!item.gif && item.images && item.images.length > 1) {
      const iv = setInterval(() => setImgIndex(p => (p + 1) % item.images.length), 2500);
      return () => clearInterval(iv);
    }
  }, [item.images, item.gif]);
  const mediaSrc = item.gif ? item.gif : (item.images && item.images.length > 0 ? item.images[imgIndex] : null);
  return (
    <div onClick={() => nav(`#/showcase/${item.id}`)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ breakInside: "avoid", marginBottom: 16, borderRadius: 20, overflow: "hidden", background: CARDBG, boxShadow: hovered ? SHADOW2 : SHADOW, transform: hovered ? "scale(1.02)" : "scale(1)", transition: "all 0.4s cubic-bezier(.25,.46,.45,.94)", cursor: "pointer", position: "relative" }}>
      <div style={{ height: h, background: mediaSrc ? `url(${mediaSrc}) center/cover` : `linear-gradient(145deg, ${item.color || GRAD1}22, ${item.color || GRAD2}08, ${BG2})`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", transition: "height 0.3s" }}>
        {!mediaSrc && <span style={{ fontSize: 40, opacity: 0.2 }}>🎨</span>}
        {item.images && item.images.length > 1 && !item.gif && (
          <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 5 }}>
            {item.images.map((_, idx) => (
              <div key={idx} style={{ width: idx === imgIndex ? 16 : 6, height: 6, borderRadius: 3, background: idx === imgIndex ? "#fff" : "rgba(255,255,255,0.5)", transition: "all 0.3s" }} />
            ))}
          </div>
        )}
        {item.videoUrl && (
          <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(0,0,0,0.5)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#fff", fontWeight: 600 }}>▶ Video</div>
        )}
        <div style={{ position: "absolute", inset: 0, background: hovered ? "rgba(0,0,0,0.15)" : "transparent", transition: "all 0.3s" }} />
      </div>
      <div style={{ padding: "16px 18px 20px" }}>
        <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: item.color || GRAD1, background: (item.color || GRAD1) + "15", padding: "3px 10px", borderRadius: 980 }}>{item.category}</span>
          <span style={{ fontSize: 11, color: TX3, padding: "3px 8px" }}>{item.year}</span>
        </div>
        <h3 style={{ fontFamily: FONTD, fontSize: 17, fontWeight: 700, color: TX, margin: "0 0 6px", letterSpacing: -0.2 }}>{item.title}</h3>
        <p style={{ color: TX2, fontSize: 13, lineHeight: 1.5, margin: "0 0 10px" }}>{item.description?.substring(0, 80)}{item.description?.length > 80 ? "..." : ""}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {(item.tags || []).slice(0, 3).map(t => (
            <span key={t} style={{ fontSize: 11, color: TX3, background: BG2, padding: "3px 10px", borderRadius: 980 }}>{t}</span>
          ))}
        </div>
        {item.downloadUrl && (
          <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 6, color: AC, fontSize: 12, fontWeight: 600 }}>
            <span>⬇</span><span>{item.downloadLabel || "Download"}</span>
          </div>
        )}
      </div>
    </div>
  );
};

const ShowcaseSection = ({ showcase }) => {
  const [filter, setFilter] = useState("All");
  const published = (showcase || []).filter(s => s.status === "published");
  const categories = ["All", ...new Set(published.map(s => s.category).filter(Boolean))];
  const filtered = filter === "All" ? published : published.filter(s => s.category === filter);
  return (
    <section id="showcase" style={{ padding: "120px 24px", background: BG2 }}>
      <div style={{ maxWidth: 1080, margin: "0 auto" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 20 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: GRAD1, marginBottom: 8 }}>Showcase</p>
          <h2 style={{ fontFamily: FONTD, fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 700, color: TX, margin: 0, letterSpacing: "-0.03em" }}>Things I've made.</h2>
          <p style={{ color: TX2, fontSize: 17, marginTop: 14, maxWidth: 480, margin: "14px auto 0" }}>Art, assets, models and more. Click anything to explore.</p>
        </Reveal>
        {categories.length > 1 && (
          <Reveal style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", margin: "32px 0 40px" }}>
            {categories.map(c => (
              <button key={c} onClick={() => setFilter(c)} style={{ padding: "8px 20px", borderRadius: 980, border: "none", background: filter === c ? TX : CARDBG, color: filter === c ? BG : TX2, fontFamily: FONT, fontSize: 13, fontWeight: 500, cursor: "pointer", transition: "all 0.3s", boxShadow: SHADOW }}>{c}</button>
            ))}
          </Reveal>
        )}
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: TX2 }}>Nothing here yet.</div>
        ) : (
          <div style={{ columns: "3 280px", gap: 16 }}>
            {filtered.map((item, i) => <ShowcaseCard key={item.id} item={item} i={i} />)}
          </div>
        )}
      </div>
    </section>
  );
};

const CollabCard = ({ sec, color }) => (
  <Reveal>
    <div style={{ marginBottom: 48 }}>
      {sec.title && <h2 style={{ fontFamily: FONTD, fontSize: 28, fontWeight: 700, color: TX, margin: "0 0 20px" }}>{sec.title}</h2>}
      <div style={{ display: "flex", alignItems: "center", gap: 20, background: CARDBG, borderRadius: 20, padding: 28, boxShadow: SHADOW, flexWrap: "wrap" }}>
        {sec.collabAvatar && (
          <img src={sec.collabAvatar} alt={sec.collabName} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `3px solid ${color || GRAD1}30` }} />
        )}
        {!sec.collabAvatar && (
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${color || GRAD1}18`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTD, fontWeight: 700, fontSize: 28, color: color || GRAD1, flexShrink: 0 }}>
            {sec.collabName?.[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: FONTD, fontSize: 18, fontWeight: 700, color: TX, marginBottom: 4 }}>{sec.collabName || "Collaborator"}</div>
          {sec.collabRole && <div style={{ fontSize: 13, fontWeight: 600, color: color || GRAD1, marginBottom: 8 }}>{sec.collabRole}</div>}
          {sec.collabBio && <p style={{ color: TX2, fontSize: 14, lineHeight: 1.65, margin: 0 }}>{sec.collabBio}</p>}
          {sec.collabLink && (
            <a href={sec.collabLink} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 10, fontSize: 13, color: color || AC, textDecoration: "none", fontWeight: 500 }}>View profile ›</a>
          )}
        </div>
      </div>
    </div>
  </Reveal>
);

const RenderSection = ({ sec, color, onLightbox, idx = 0 }) => {
  if (sec.type === "collaborator") return <CollabCard sec={sec} color={color} />;
  if (sec.type === "embed" && sec.url) {
    const raw = sec.url.trim();
    const embedUrl = /youtube\.com\/watch\?v=/.test(raw) ? raw.replace("watch?v=", "embed/").split("&")[0]
      : /youtu\.be\//.test(raw) ? raw.replace("youtu.be/", "www.youtube.com/embed/")
      : raw;
    return (
      <Reveal>
        <div style={{ marginBottom: 48 }}>
          {sec.title && <h2 style={{ fontFamily: FONTD, fontSize: 28, fontWeight: 700, color: TX, margin: "0 0 20px" }}>{sec.title}</h2>}
          <BrowserFrame url={raw}>
            <div style={{ position: "relative", width: "100%", aspectRatio: "16 / 10" }}>
              <iframe src={embedUrl} title={sec.title || "embed"} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", display: "block" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen sandbox="allow-scripts allow-same-origin allow-popups allow-forms" />
            </div>
          </BrowserFrame>
          <a href={raw} target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 10, fontSize: 13, fontWeight: 600, color: AC, textDecoration: "none" }}>Open in a new tab ›</a>
        </div>
      </Reveal>
    );
  }
  if (sec.type === "browser") {
    if (!sec.image) return null;
    return (
      <Reveal>
        <div style={{ marginBottom: 48 }}>
          {sec.title && <h2 style={{ fontFamily: FONTD, fontSize: 28, fontWeight: 700, color: TX, margin: "0 0 20px" }}>{sec.title}</h2>}
          <BrowserFrame url="">
            <img src={sec.image} alt={sec.title || ""} onClick={() => onLightbox && onLightbox([sec.image], 0)} style={{ width: "100%", display: "block", cursor: "zoom-in" }} />
          </BrowserFrame>
        </div>
      </Reveal>
    );
  }
  if (sec.type === "feature") {
    const flip = (idx % 2) === 1;
    const html = (sec.text || "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\n/g, "<br/>");
    return (
      <Reveal>
        <div className="feature-row" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "center", marginBottom: 48 }}>
          {sec.image && (
            <div style={{ order: flip ? 2 : 1, borderRadius: 16, overflow: "hidden", boxShadow: SHADOW, cursor: onLightbox ? "zoom-in" : "default" }} onClick={() => sec.image && onLightbox && onLightbox([sec.image], 0)}>
              <img src={sec.image} alt={sec.title || ""} style={{ width: "100%", display: "block" }} />
            </div>
          )}
          <div style={{ order: flip ? 1 : 2 }}>
            {sec.title && <h2 style={{ fontFamily: FONTD, fontSize: 26, fontWeight: 700, color: TX, margin: "0 0 14px", letterSpacing: -0.3 }}>{sec.title}</h2>}
            {sec.text && <div style={{ color: TX2, fontSize: 16, lineHeight: 1.75 }} dangerouslySetInnerHTML={{ __html: html }} />}
          </div>
        </div>
      </Reveal>
    );
  }
  return (
    <Reveal>
      <div style={{ marginBottom: 48 }}>
        {sec.title && <h2 style={{ fontFamily: FONTD, fontSize: 28, fontWeight: 700, color: TX, margin: "0 0 20px" }}>{sec.title}</h2>}
        {sec.text && (
          <div style={{ color: TX2, fontSize: 16, lineHeight: 1.8, marginBottom: sec.images?.length || sec.gif ? 20 : 0 }}
            dangerouslySetInnerHTML={{ __html: sec.text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/\n/g, "<br/>") }}
          />
        )}
        {sec.gif && (
          <div style={{ borderRadius: 16, overflow: "hidden", marginBottom: 12 }}>
            <img src={sec.gif} alt="" style={{ width: "100%", maxHeight: 400, objectFit: "cover", display: "block" }} />
          </div>
        )}
        {sec.images && sec.images.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: sec.images.length === 1 ? "1fr" : "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {sec.images.map((img, ii) => (
              <div key={ii} onClick={() => onLightbox && onLightbox(sec.images, ii)} style={{ borderRadius: 14, overflow: "hidden", cursor: "zoom-in", boxShadow: SHADOW }}>
                <img src={img} alt="" style={{ width: "100%", height: 220, objectFit: "cover", display: "block" }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Reveal>
  );
};

const SectionBuilder = ({ sections, onChange }) => {
  const secs = sections || [];
  const update = (i, key, val) => { const s = [...secs]; s[i] = { ...s[i], [key]: val }; onChange(s); };
  const move = (i, dir) => { const s = [...secs]; [s[i], s[i+dir]] = [s[i+dir], s[i]]; onChange(s); };
  const remove = (i) => onChange(secs.filter((_, j) => j !== i));
  const addSection = (type) => onChange([...secs, { id: Date.now().toString(), type: type || "text", title: "", text: "", images: [], gif: "", image: "", url: "", collabName: "", collabRole: "", collabBio: "", collabAvatar: "", collabLink: "" }]);
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: TX }}>Content Sections</label>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button onClick={() => addSection("text")} style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: AC, color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Text Section</button>
          <button onClick={() => addSection("feature")} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${AC}`, background: `${AC}12`, color: AC, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Feature row</button>
          <button onClick={() => addSection("browser")} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${AC}`, background: `${AC}12`, color: AC, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Browser shot</button>
          <button onClick={() => addSection("embed")} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${AC}`, background: `${AC}12`, color: AC, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Embed</button>
          <button onClick={() => addSection("collaborator")} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${GRAD1}`, background: `${GRAD1}12`, color: GRAD1, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>+ Collaborator</button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: TX3, marginBottom: 12 }}>Use ↑↓ to reorder. Text supports **bold** and *italic*.</div>
      {secs.length === 0 && <div style={{ padding: 16, borderRadius: 12, background: BG2, textAlign: "center", color: TX3, fontSize: 13 }}>No sections yet</div>}
      {secs.map((sec, si) => (
        <div key={sec.id || si} style={{ background: BG2, borderRadius: 14, padding: 16, marginBottom: 12, border: sec.type === "collaborator" ? `1px solid ${GRAD1}30` : "none" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: sec.type === "collaborator" ? GRAD1 : TX2 }}>
              {sec.type === "collaborator" ? "👤 Collaborator" : sec.type === "feature" ? `🪟 Feature ${si + 1}` : sec.type === "browser" ? `🖥️ Browser ${si + 1}` : sec.type === "embed" ? `🔗 Embed ${si + 1}` : `Section ${si + 1}`}
            </span>
            <div style={{ display: "flex", gap: 6 }}>
              {si > 0 && <button onClick={() => move(si, -1)} style={{ padding:"4px 8px", borderRadius:6, border:"none", background:CARDBG, color:TX2, fontSize:11, cursor:"pointer" }}>↑</button>}
              {si < secs.length-1 && <button onClick={() => move(si, 1)} style={{ padding:"4px 8px", borderRadius:6, border:"none", background:CARDBG, color:TX2, fontSize:11, cursor:"pointer" }}>↓</button>}
              <button onClick={() => remove(si)} style={{ padding:"4px 8px", borderRadius:6, border:"none", background:"#ff3b3012", color:"#ff3b30", fontSize:11, cursor:"pointer" }}>Remove</button>
            </div>
          </div>
          {sec.type === "collaborator" ? (
            <div>
              <Input label="Section Heading (optional)" value={sec.title} onChange={v => update(si, "title", v)} placeholder="e.g. Made with, Collaborator..." />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
                <Input label="Name" value={sec.collabName} onChange={v => update(si, "collabName", v)} placeholder="e.g. Soran Ahmed" />
                <Input label="Role" value={sec.collabRole} onChange={v => update(si, "collabRole", v)} placeholder="e.g. Game Designer, Artist..." />
              </div>
              <Input label="Short Bio" value={sec.collabBio} onChange={v => update(si, "collabBio", v)} textarea rows={2} placeholder="A short line about them..." />
              <Input label="Profile Link (optional)" value={sec.collabLink} onChange={v => update(si, "collabLink", v)} placeholder="https://..." />
              <ImgUpload label="Profile Photo (optional)" value={sec.collabAvatar} onChange={v => update(si, "collabAvatar", v)} />
            </div>
          ) : sec.type === "embed" ? (
            <div>
              <Input label="Embed Title (optional)" value={sec.title} onChange={v => update(si, "title", v)} placeholder="e.g. Live Demo, Try it..." />
              <Input label="Embed URL (live site, Hugging Face Space, YouTube…)" value={sec.url || ""} onChange={v => update(si, "url", v)} placeholder="https://..." />
              <div style={{ padding: 12, borderRadius: 10, background: CARDBG, fontSize: 12, color: TX2, lineHeight: 1.6 }}>Tip: for Hugging Face Spaces use the <strong style={{ color: TX }}>*.hf.space</strong> embed URL. Some sites block embedding; if it stays blank, the "Open in a new tab" link still works.</div>
            </div>
          ) : sec.type === "feature" ? (
            <div>
              <Input label="Feature Heading (optional)" value={sec.title} onChange={v => update(si, "title", v)} placeholder="e.g. Real-time detection" />
              <div style={{ marginBottom: 12 }}>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:TX, marginBottom:6 }}>Text (optional) — **bold** *italic*</label>
                <textarea value={sec.text} onChange={e => update(si, "text", e.target.value)} placeholder="Describe this feature..." rows={4} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${BORDER}`, background:CARDBG, color:TX, fontSize:14, outline:"none", fontFamily:FONT, resize:"vertical", boxSizing:"border-box" }} onFocus={e=>e.target.style.borderColor=AC} onBlur={e=>e.target.style.borderColor=BORDER} />
              </div>
              <ImgUpload label="Feature Image (alternates left / right down the page)" value={sec.image || ""} onChange={v => update(si, "image", v)} />
            </div>
          ) : sec.type === "browser" ? (
            <div>
              <Input label="Caption (optional)" value={sec.title} onChange={v => update(si, "title", v)} placeholder="e.g. The live web app" />
              <ImgUpload label="Screenshot (shown inside a browser frame)" value={sec.image || ""} onChange={v => update(si, "image", v)} />
            </div>
          ) : (
            <div>
              <Input label="Section Title (optional)" value={sec.title} onChange={v => update(si, "title", v)} placeholder="e.g. The Story, Behind the Scenes..." />
              <div style={{ marginBottom: 12 }}>
                <label style={{ display:"block", fontSize:13, fontWeight:600, color:TX, marginBottom:6 }}>Text (optional) — **bold** *italic*</label>
                <textarea value={sec.text} onChange={e => update(si, "text", e.target.value)} placeholder="Write anything..." rows={4} style={{ width:"100%", padding:"10px 14px", borderRadius:10, border:`1px solid ${BORDER}`, background:CARDBG, color:TX, fontSize:14, outline:"none", fontFamily:FONT, resize:"vertical", boxSizing:"border-box" }} onFocus={e=>e.target.style.borderColor=AC} onBlur={e=>e.target.style.borderColor=BORDER} />
              </div>
              <ImgUpload label="Images (optional)" value={sec.images||[]} onChange={v => update(si, "images", typeof v === "function" ? v(sec.images||[]) : v)} multi />
              <ImgUpload label="GIF (optional)" value={sec.gif||""} onChange={v => update(si, "gif", v)} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ShowcaseDetail = ({ item, showcase }) => {
  const [activeImg, setActiveImg] = useState(0);
  const [lightboxData, setLightboxData] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => { const h = () => setScrollY(window.scrollY); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  if (!item) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}><h2 style={{ fontFamily: FONTD, color: TX, fontSize: 28, fontWeight: 700 }}>Item not found.</h2><AppleBtn onClick={() => nav("#/")}>Go back</AppleBtn></div>;
  const allMedia = [...(item.images || [])];
  const published = (showcase || []).filter(s => s.status === "published");
  const idx = published.findIndex(s => s.id === item.id);
  const prev = published[idx - 1], next = published[idx + 1];
  const ic = item.color || GRAD1;
  return (
    <div style={{ background: BG }}>
      {lightboxData && <Lightbox images={lightboxData.images} startIndex={lightboxData.idx} onClose={() => setLightboxData(null)} />}
      <div style={{ position: "relative", height: "65vh", minHeight: 400, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: item.gif ? `url(${item.gif}) center/cover` : allMedia[activeImg] ? `url(${allMedia[activeImg]}) center/cover` : `linear-gradient(180deg, ${ic}18 0%, ${BG2} 60%, ${BG} 100%)`, transform: `translateY(${scrollY * 0.2}px)` }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 70%, var(--fade) 88%, ${BG} 100%)` }} />
        <button onClick={() => nav("#/")} style={{ position: "absolute", top: 20, left: 24, zIndex: 10, background: "var(--glass-btn)", backdropFilter: "blur(12px)", border: "none", borderRadius: 980, padding: "10px 22px", color: TX, fontFamily: FONT, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>← Back</button>
        <div style={{ position: "absolute", bottom: 60, left: 0, right: 0, padding: "0 24px", maxWidth: 880, margin: "0 auto" }}>
          <Reveal><div style={{ display: "flex", gap: 8, marginBottom: 12 }}><span style={{ fontSize: 13, fontWeight: 600, color: ic, background: ic + "20", padding: "5px 14px", borderRadius: 980 }}>{item.category}</span><span style={{ fontSize: 13, color: TX2, padding: "5px 8px" }}>{item.year}</span></div></Reveal>
          <Reveal delay={0.06}><h1 style={{ fontFamily: FONTD, fontSize: "clamp(2.2rem, 5vw, 3.8rem)", fontWeight: 700, color: TX, margin: "0 0 8px", lineHeight: 1.08, letterSpacing: "-0.04em" }}>{item.title}</h1></Reveal>
          <Reveal delay={0.12}>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 16 }}>
              {item.downloadUrl && (
                <a href={item.downloadUrl} download style={{ textDecoration: "none" }}>
                  <AppleBtn primary color={ic} small onClick={() => {}}>⬇ {item.downloadLabel || "Download"}</AppleBtn>
                </a>
              )}
              {item.videoUrl && (
                <AppleBtn small color={ic} onClick={() => window.open(item.videoUrl)}>▶ Watch Video</AppleBtn>
              )}
            </div>
          </Reveal>
        </div>
      </div>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 24px 80px" }}>
        {(item.tags || []).length > 0 && (
          <Reveal>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "32px 0 24px" }}>
              {item.tags.map(t => <span key={t} style={{ fontSize: 13, color: TX2, background: BG2, padding: "6px 16px", borderRadius: 980, fontWeight: 500 }}>{t}</span>)}
            </div>
          </Reveal>
        )}
        {item.description && (
          <Reveal>
            <p style={{ color: TX2, fontSize: 17, lineHeight: 1.75, marginBottom: 40 }}>{item.description}</p>
          </Reveal>
        )}
        {item.videoUrl && item.videoUrl.includes("youtube") && (
          <Reveal>
            <div style={{ marginBottom: 40 }}>
              <div style={{ borderRadius: 20, overflow: "hidden", boxShadow: SHADOW, aspectRatio: "16/9" }}>
                <iframe width="100%" height="100%" src={item.videoUrl.replace("watch?v=", "embed/")} style={{ border: "none", display: "block" }} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
              </div>
            </div>
          </Reveal>
        )}
        {(item.customSections || []).map((sec, si) => (
          <RenderSection key={si} idx={si} sec={sec} color={ic} onLightbox={(imgs, ix) => setLightboxData({ images: imgs, idx: ix })} />
        ))}
        <Reveal>
          <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
            {prev && <div onClick={() => nav(`#/showcase/${prev.id}`)} style={{ flex: 1, minWidth: 200, background: CARDBG, borderRadius: 16, padding: 24, boxShadow: SHADOW, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e => e.currentTarget.style.transform=""}><p style={{ fontSize: 13, color: TX2, margin: "0 0 4px" }}>← Previous</p><h3 style={{ fontFamily: FONTD, fontSize: 17, fontWeight: 700, color: TX, margin: 0 }}>{prev.title}</h3></div>}
            {next && <div onClick={() => nav(`#/showcase/${next.id}`)} style={{ flex: 1, minWidth: 200, background: CARDBG, borderRadius: 16, padding: 24, boxShadow: SHADOW, cursor: "pointer", textAlign: "right" }} onMouseEnter={e => e.currentTarget.style.transform="scale(1.02)"} onMouseLeave={e => e.currentTarget.style.transform=""}><p style={{ fontSize: 13, color: TX2, margin: "0 0 4px" }}>Next →</p><h3 style={{ fontFamily: FONTD, fontSize: 17, fontWeight: 700, color: TX, margin: 0 }}>{next.title}</h3></div>}
          </div>
        </Reveal>
      </div>
    </div>
  );
};

const BlogSection = ({ posts }) => (
  <section id="blog" style={{ padding: "120px 24px", maxWidth: 1080, margin: "0 auto" }}>
    <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
      <p style={{ fontSize: 15, fontWeight: 600, color: "#ff375f", marginBottom: 8 }}>Devlog</p>
      <h2 style={{ fontFamily: FONTD, fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 700, color: TX, margin: 0, letterSpacing: "-0.03em" }}>Latest from the lab.</h2>
    </Reveal>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
      {posts.filter(p => p.status === "published").map((p, i) => (
        <Reveal key={p.id} delay={i * 0.08}>
          <div style={{ background: CARDBG, borderRadius: 20, overflow: "hidden", boxShadow: SHADOW, cursor: "pointer", transition: "all 0.5s cubic-bezier(.25,.46,.45,.94)" }} onClick={() => createTracker().then(t => t.trackClick("Blog Post Click", `Blog: ${p.title}`, "📝"))} onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.02)"; e.currentTarget.style.boxShadow = SHADOW2; }} onMouseLeave={e => { e.currentTarget.style.transform = ""; e.currentTarget.style.boxShadow = SHADOW; }}>
            <div style={{ height: 160, background: p.thumbnail ? `url(${p.thumbnail}) center/cover` : `linear-gradient(145deg, ${BG2}, ${BG4})`, display: "flex", alignItems: "center", justifyContent: "center" }}>{!p.thumbnail && <span style={{ fontSize: 28, opacity: 0.2 }}>📝</span>}</div>
            <div style={{ padding: "22px 24px 26px" }}>
              <p style={{ fontSize: 13, color: TX2, marginBottom: 6 }}>{p.date}</p>
              <h3 style={{ fontFamily: FONTD, fontSize: 19, fontWeight: 700, color: TX, margin: "0 0 8px", lineHeight: 1.3 }}>{p.title}</h3>
              <p style={{ color: TX2, fontSize: 15, lineHeight: 1.5, margin: 0 }}>{p.excerpt}</p>
            </div>
          </div>
        </Reveal>
      ))}
    </div>
  </section>
);

const CollabSection = ({ settings, onMessage }) => {
  const [form, setForm] = useState({ name: "", email: "", idea: "" });
  const [sent, setSent] = useState(false);
  const submit = () => { if (form.name && form.email && form.idea) { onMessage({ id: Date.now().toString(), ...form, message: form.idea, date: new Date().toISOString(), read: false }); setSent(true); createTracker().then(t => t.trackClick("Contact Form Submit", "Contact form submitted", "✉️")); } };
  const avColors = { open: "#30d158", busy: "#ff9500", unavailable: "#ff3b30" };
  const avLabels = { open: "Open to collaborations", busy: "Currently busy", unavailable: "Unavailable" };
  const av = settings.availability || "open";
  return (
    <section id="collab" style={{ padding: "120px 24px", background: BG2 }}>
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <Reveal style={{ textAlign: "center", marginBottom: 56 }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: GRAD3, marginBottom: 8 }}>Collaborate</p>
          <h2 style={{ fontFamily: FONTD, fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 700, color: TX, margin: 0, letterSpacing: "-0.03em" }}>Let's build together.</h2>
        </Reveal>
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap", justifyContent: "center" }}>
          <Reveal style={{ flex: "1 1 300px", maxWidth: 380 }}>
            <div style={{ background: CARDBG, borderRadius: 20, padding: 32, boxShadow: SHADOW }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 16px", borderRadius: 980, background: `${avColors[av]}12`, marginBottom: 24 }}>
                <div style={{ width: 8, height: 8, borderRadius: "50%", background: avColors[av] }} />
                <span style={{ fontSize: 13, color: avColors[av], fontWeight: 600 }}>{avLabels[av]}</span>
              </div>
              <h3 style={{ fontFamily: FONTD, fontSize: 20, fontWeight: 700, color: TX, margin: "0 0 20px" }}>What I'm looking for</h3>
              {["Game jams & hackathons", "Indie co-development", "Soundtrack collaboration", "Commissioned game art", "Open-source game tools"].map(item => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ color: GRAD3 }}>●</span>
                  <span style={{ color: TX2, fontSize: 15 }}>{item}</span>
                </div>
              ))}
              {(settings.email || (settings.socials || []).some(s => s.url && s.url !== "#")) && (
                <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
                  <h4 style={{ fontFamily: FONTD, fontSize: 14, fontWeight: 700, color: TX, margin: "0 0 14px" }}>Reach me directly</h4>
                  {settings.email && (
                    <a href={`mailto:${settings.email}`} onClick={() => createTracker().then(t => t.trackClick("Email Click", "Direct email clicked", "✉️"))} style={{ display: "inline-flex", alignItems: "center", gap: 8, color: AC, fontSize: 15, fontWeight: 500, textDecoration: "none", marginBottom: 16, wordBreak: "break-all" }}>
                      <span>✉️</span><span>{settings.email}</span>
                    </a>
                  )}
                  <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                    {(settings.socials || []).filter(s => s.url && s.url !== "#").map(s => (
                      <a key={s.id} href={s.url} target="_blank" rel="noopener noreferrer" onClick={() => createTracker().then(t => t.trackClick(`Social: ${s.name}`, `Social link: ${s.name}`, "🔗"))} title={s.name} style={{ width: 40, height: 40, borderRadius: 12, background: BG2, display: "flex", alignItems: "center", justifyContent: "center", color: TX3, textDecoration: "none", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.color = TX; e.currentTarget.style.background = BG4; }} onMouseLeave={e => { e.currentTarget.style.color = TX3; e.currentTarget.style.background = BG2; }}>
                        <SocialIcon name={s.name} customIcon={s.icon} size={18} />
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Reveal>
          <Reveal delay={0.08} style={{ flex: "1 1 380px", maxWidth: 480 }}>
            <div style={{ background: CARDBG, borderRadius: 20, padding: 32, boxShadow: SHADOW }}>
              {sent ? (
                <div style={{ textAlign: "center", padding: 36 }}>
                  <div style={{ fontSize: 44, marginBottom: 14 }}>✓</div>
                  <h3 style={{ fontFamily: FONTD, fontSize: 22, color: TX, fontWeight: 700, margin: "0 0 6px" }}>Message sent.</h3>
                  <p style={{ color: TX2, fontSize: 15 }}>I'll get back to you soon.</p>
                </div>
              ) : (<>
                <h3 style={{ fontFamily: FONTD, fontSize: 20, fontWeight: 700, color: TX, margin: "0 0 24px" }}>Get in touch</h3>
                <Input label="Name" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="John Doe" />
                <Input label="Email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="you@example.com" />
                <Input label="Project Idea" value={form.idea} onChange={v => setForm({ ...form, idea: v })} placeholder="Tell me about your project..." textarea />
                <AppleBtn primary full onClick={submit} style={{ borderRadius: 12, fontSize: 16 }}>Send Message</AppleBtn>
              </>)}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
};

const Footer = ({ settings }) => (
  <footer style={{ borderTop: `0.5px solid ${BORDER}`, padding: "40px 24px", background: BG3 }}>
    <div style={{ maxWidth: 1024, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
        {(settings.socials || []).filter(s => s.url && s.url !== "#").map(s => (
          <a key={s.id} href={s.url || "#"} target="_blank" rel="noopener noreferrer" onClick={() => createTracker().then(t => t.trackClick(`Social: ${s.name}`, `Social link: ${s.name}`, "🔗"))} style={{ width: 40, height: 40, borderRadius: 12, background: BG2, display: "flex", alignItems: "center", justifyContent: "center", color: TX3, textDecoration: "none", transition: "all 0.3s" }} onMouseEnter={e => { e.currentTarget.style.color = TX; e.currentTarget.style.background = BG4; }} onMouseLeave={e => { e.currentTarget.style.color = TX3; e.currentTarget.style.background = BG2; }} title={s.name}>
            <SocialIcon name={s.name} customIcon={s.icon} size={18} />
          </a>
        ))}
      </div>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <span onClick={() => nav("#/admin")} style={{ fontSize: 10, color: "rgba(127,127,127,0.25)", cursor: "default", userSelect: "none" }} onMouseEnter={e => e.target.style.color = "rgba(127,127,127,0.6)"} onMouseLeave={e => e.target.style.color = "rgba(127,127,127,0.25)"}>●</span>
        <span style={{ color: TX3 }}>·</span>
        <span style={{ fontSize: 12, color: TX3 }}>© 2026</span>
      </div>
    </div>
  </footer>
);

// ── Lightbox ────────────────────────────────────────────────────────────────
const Lightbox = ({ images, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex || 0);
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(p => (p + 1) % images.length);
      if (e.key === "ArrowLeft") setIdx(p => (p - 1 + images.length) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <button onClick={onClose} style={{ position: "absolute", top: 20, right: 24, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 24, borderRadius: "50%", width: 44, height: 44, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
      {images.length > 1 && <button onClick={e => { e.stopPropagation(); setIdx(p => (p - 1 + images.length) % images.length); }} style={{ position: "absolute", left: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 24, borderRadius: "50%", width: 44, height: 44, cursor: "pointer" }}>‹</button>}
      <img onClick={e => e.stopPropagation()} src={images[idx]} alt="" style={{ maxWidth: "90vw", maxHeight: "90vh", objectFit: "contain", borderRadius: 12 }} />
      {images.length > 1 && <button onClick={e => { e.stopPropagation(); setIdx(p => (p + 1) % images.length); }} style={{ position: "absolute", right: 20, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 24, borderRadius: "50%", width: 44, height: 44, cursor: "pointer" }}>›</button>}
      {images.length > 1 && <div style={{ position: "absolute", bottom: 20, color: "rgba(255,255,255,0.5)", fontSize: 13 }}>{idx + 1} / {images.length}</div>}
    </div>
  );
};

// ── Game Detail ────────────────────────────────────────────────────────────
const GameDetail = ({ game, games }) => {
  const [activeImg, setActiveImg] = useState(0);
  const [lightbox, setLightbox] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => { const h = () => setScrollY(window.scrollY); window.addEventListener("scroll", h); return () => window.removeEventListener("scroll", h); }, []);
  if (!game) return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}><h2 style={{ fontFamily: FONTD, color: TX, fontSize: 28, fontWeight: 700 }}>Game not found.</h2><AppleBtn onClick={() => nav("#/")}>Go back</AppleBtn></div>;
  const published = games.filter(g => g.status === "published");
  const idx = published.findIndex(g => g.id === game.id);
  const prev = published[idx - 1], next = published[idx + 1];
  const gc = game.color || AC;
  const allScreenshots = game.screenshots?.filter(Boolean) || [];
  return (
    <div style={{ background: BG }}>
      {lightbox !== null && (
        typeof lightbox === "object"
          ? <Lightbox images={lightbox.images} startIndex={lightbox.idx} onClose={() => setLightbox(null)} />
          : <Lightbox images={allScreenshots} startIndex={lightbox} onClose={() => setLightbox(null)} />
      )}
      <div style={{ position: "relative", height: "75vh", minHeight: 440, overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: game.bannerImg ? `url(${game.bannerImg}) center/cover` : `linear-gradient(180deg, ${gc}18 0%, ${BG2} 60%, ${BG} 100%)`, transform: `translateY(${scrollY * 0.2}px)` }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, transparent 40%, ${BG} 100%)` }} />
        <button onClick={() => nav("#/")} style={{ position: "absolute", top: 20, left: 24, zIndex: 10, background: "var(--glass-btn)", backdropFilter: "blur(12px)", border: "none", borderRadius: 980, padding: "10px 22px", color: TX, fontFamily: FONT, fontSize: 14, fontWeight: 500, cursor: "pointer" }}>← Back</button>
        <div style={{ position: "absolute", bottom: 80, left: 0, right: 0, padding: "0 24px", maxWidth: 880, margin: "0 auto", zIndex: 1 }}>
          <Reveal><div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>{[game.category, game.engine, game.genre, game.platform, game.year].filter(Boolean).map(b => <Badge key={b} color={gc}>{b}</Badge>)}</div></Reveal>
          <Reveal delay={0.06}><h1 style={{ fontFamily: FONTD, fontSize: "clamp(2.5rem, 6vw, 4.5rem)", fontWeight: 700, color: TX, margin: "0 0 8px", lineHeight: 1.06, letterSpacing: "-0.04em" }}>{game.title}.</h1></Reveal>
          <Reveal delay={0.12}><p style={{ fontSize: "clamp(1rem, 2.2vw, 1.3rem)", color: TX2, margin: "0 0 28px", fontStyle: "italic" }}>{game.tagline}</p></Reveal>
          <Reveal delay={0.18}><div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            {game.playUrl && game.playUrl !== "#" && <AppleBtn primary color={gc} small onClick={() => { window.open(game.playUrl); createTracker().then(t => t.trackClick("Play Now", `Play Now: ${game.title}`, "▶️")); }}>Play Now</AppleBtn>}
            {game.downloadUrl && game.downloadUrl !== "#" && <AppleBtn small color={gc} onClick={() => { window.open(game.downloadUrl); createTracker().then(t => t.trackClick("Download", `Download: ${game.title}`, "⬇️")); }}>⬇ Download</AppleBtn>}
            <ProjectLinkButtons links={game.links} />
          </div></Reveal>
        </div>
      </div>
      <div style={{ maxWidth: 880, margin: "0 auto", padding: "0 24px" }}>
        {game.showStats !== false && (
        <Reveal>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, justifyContent: "center", padding: "36px 32px", background: CARDBG, borderRadius: 20, marginTop: -36, position: "relative", zIndex: 2, boxShadow: SHADOW }}>
            <Stat label="Dev Time" value={game.devTime || "—"} /><Stat label="Team" value={game.teamSize || "—"} /><Stat label="Engine" value={game.engine || "—"} /><Stat label="Downloads" value={game.downloads?.toLocaleString() || "—"} /><Stat label="Plays" value={game.plays?.toLocaleString() || "—"} />
          </div>
        </Reveal>
        )}
        {game.techStack && game.techStack.length > 0 && (
          <Reveal>
            <div style={{ marginBottom: 60 }}>
              <h2 style={{ fontFamily: FONTD, fontSize: 28, fontWeight: 700, color: TX, margin: "0 0 16px" }}>Tech stack.</h2>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{game.techStack.map(t => <Badge key={t} color={gc}>{t}</Badge>)}</div>
            </div>
          </Reveal>
        )}
        {allScreenshots.length > 0 && (
          <Reveal>
            <div style={{ margin: "60px 0" }}>
              <div onClick={() => setLightbox(activeImg)} style={{ borderRadius: 20, overflow: "hidden", height: 420, background: `url(${allScreenshots[activeImg]}) center/cover`, boxShadow: SHADOW, cursor: "zoom-in", marginBottom: 12, position: "relative" }}>
                <div style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.45)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "#fff", fontWeight: 500 }}>🔍 Click to expand</div>
              </div>
              {allScreenshots.length > 1 && (
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {allScreenshots.map((img, i) => (
                    <div key={i} onClick={() => setActiveImg(i)} style={{ width: 80, height: 60, borderRadius: 10, background: `url(${img}) center/cover`, cursor: "pointer", border: `3px solid ${i === activeImg ? gc : "transparent"}`, transition: "all 0.2s", opacity: i === activeImg ? 1 : 0.55, flexShrink: 0 }} />
                  ))}
                </div>
              )}
            </div>
          </Reveal>
        )}
        {game.showRepoCard !== false && (() => { const gh = (game.links || []).find(l => l.url && /github\.com/i.test(l.url)); return gh ? (
          <Reveal><div style={{ marginBottom: 48 }}><GitHubRepoCard url={gh.url} role={game.repoRole || ""} /></div></Reveal>
        ) : null; })()}
        {(game.customSections || []).map((sec, si) => (
          <RenderSection key={si} idx={si} sec={sec} color={gc} onLightbox={(imgs, ix) => setLightbox({ images: imgs, idx: ix })} />
        ))}
        <Reveal><div style={{ display: "flex", gap: 16, marginBottom: 60, flexWrap: "wrap" }}>
          {prev && <div onClick={() => nav(`#/games/${prev.id}`)} style={{ flex: 1, minWidth: 220, background: CARDBG, borderRadius: 16, padding: 24, boxShadow: SHADOW, cursor: "pointer" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"} onMouseLeave={e => e.currentTarget.style.transform = ""}><p style={{ fontSize: 13, color: TX2, margin: "0 0 4px" }}>← Previous</p><h3 style={{ fontFamily: FONTD, fontSize: 18, fontWeight: 700, color: TX, margin: 0 }}>{prev.title}</h3></div>}
          {next && <div onClick={() => nav(`#/games/${next.id}`)} style={{ flex: 1, minWidth: 220, background: CARDBG, borderRadius: 16, padding: 24, boxShadow: SHADOW, cursor: "pointer", textAlign: "right" }} onMouseEnter={e => e.currentTarget.style.transform = "scale(1.02)"} onMouseLeave={e => e.currentTarget.style.transform = ""}><p style={{ fontSize: 13, color: TX2, margin: "0 0 4px" }}>Next →</p><h3 style={{ fontFamily: FONTD, fontSize: 18, fontWeight: 700, color: TX, margin: 0 }}>{next.title}</h3></div>}
        </div></Reveal>
      </div>
    </div>
  );
};

// ── Admin ──────────────────────────────────────────────────────────────────
const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [warned, setWarned] = useState(false);
  const go = async () => {
    setLoading(true); setErr("");
    const ok = await onLogin(email, p);
    setLoading(false);
    if (!ok) setErr("Access denied. Invalid credentials.");
    else nav("#/admin/dashboard");
  };
  if (!warned) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#0a0a0a", fontFamily: FONT }}>
      <div style={{ width: "100%", maxWidth: 480, textAlign: "center" }}>
        <div style={{ fontSize: 72, marginBottom: 24, filter: "drop-shadow(0 0 20px #ff3b30)" }}>⚠️</div>
        <div style={{ fontFamily: FONTD, fontSize: 28, fontWeight: 700, color: "#ff3b30", marginBottom: 12, letterSpacing: -0.5 }}>RESTRICTED AREA</div>
        <div style={{ width: 60, height: 2, background: "#ff3b30", margin: "0 auto 24px", opacity: 0.6 }} />
        <p style={{ color: "#888", fontSize: 16, lineHeight: 1.7, marginBottom: 8 }}>You are attempting to access a private administrative area.</p>
        <p style={{ color: "#555", fontSize: 14, lineHeight: 1.7, marginBottom: 36 }}>Unauthorised access is strictly prohibited and may be subject to legal action. All access attempts are logged and monitored.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => nav("#/")} style={{ padding: "14px 32px", borderRadius: 12, border: "none", background: "#ff3b30", color: "#fff", fontFamily: FONT, fontSize: 15, fontWeight: 600, cursor: "pointer" }}>← Get Me Out of Here</button>
          <button onClick={() => setWarned(true)} style={{ padding: "14px 32px", borderRadius: 12, border: "1px solid #333", background: "transparent", color: "#555", fontFamily: FONT, fontSize: 15, cursor: "pointer" }}>I am authorised</button>
        </div>
        <p style={{ color: "#2a2a2a", fontSize: 11, marginTop: 32 }}>Access attempt logged · {new Date().toISOString()}</p>
      </div>
    </div>
  );
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, background: "#0a0a0a" }}>
      <div style={{ width: "100%", maxWidth: 400, background: "#111", borderRadius: 20, padding: 40, boxShadow: "0 0 60px rgba(255,59,48,0.1)", border: "1px solid #1a1a1a" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: FONTD, fontWeight: 700, fontSize: 28, color: "#fff", marginBottom: 4 }}>🔐 Admin Portal</div>
          <p style={{ fontSize: 13, color: "#555" }}>Authorised personnel only</p>
        </div>
        {err && <div style={{ padding: "12px 16px", borderRadius: 12, background: "#ff3b3015", color: "#ff3b30", fontSize: 14, marginBottom: 16, textAlign: "center", border: "1px solid #ff3b3030" }}>{err}</div>}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 6 }}>Email</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #222", background: "#0a0a0a", color: "#fff", fontSize: 15, outline: "none", fontFamily: FONT, boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor="#ff3b30"} onBlur={e => e.target.style.borderColor="#222"} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "#666", marginBottom: 6 }}>Password</label>
          <input type="password" value={p} onChange={e => setP(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} placeholder="••••••••" style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid #222", background: "#0a0a0a", color: "#fff", fontSize: 15, outline: "none", fontFamily: FONT, boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor="#ff3b30"} onBlur={e => e.target.style.borderColor="#222"} />
        </div>
        <button onClick={go} style={{ width: "100%", padding: "14px", borderRadius: 12, border: "none", background: loading ? "#333" : "#ff3b30", color: "#fff", fontFamily: FONT, fontSize: 16, fontWeight: 600, cursor: "pointer", transition: "all 0.3s" }}>{loading ? "Verifying..." : "Access Portal"}</button>
        <p onClick={() => nav("#/")} style={{ textAlign: "center", color: "#333", fontSize: 13, marginTop: 20, cursor: "pointer" }}>← Back to safety</p>
      </div>
    </div>
  );
};

// ── AdminAnalytics ─────────────────────────────────────────────────────────
const MiniBarChart = ({ data, color, height = 48 }) => {
  const max = Math.max(...data.map(d => d.v), 1);
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height }}>
      {data.map((d, i) => (
        <div key={i} title={`${d.label}: ${d.v.toLocaleString()}`} style={{ flex: 1, background: color, borderRadius: "3px 3px 0 0", height: `${(d.v / max) * 100}%`, opacity: 0.75 + (i / data.length) * 0.25, transition: "all 0.4s", cursor: "default" }} />
      ))}
    </div>
  );
};

const DonutChart = ({ segments, size = 120 }) => {
  const total = segments.reduce((s, x) => s + x.v, 0) || 1;
  let cumulative = 0;
  const r = 42, cx = 60, cy = 60, strokeWidth = 18;
  const circ = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={BG2} strokeWidth={strokeWidth} />
      {segments.map((seg, i) => {
        const pct = seg.v / total;
        const dash = pct * circ;
        const offset = circ * (1 - cumulative);
        cumulative += pct;
        return (
          <circle key={i} cx={cx} cy={cy} r={r} fill="none" stroke={seg.color} strokeWidth={strokeWidth}
            strokeDasharray={`${dash} ${circ - dash}`} strokeDashoffset={offset}
            transform={`rotate(-90 ${cx} ${cy})`} style={{ transition: "all 0.6s" }} />
        );
      })}
      <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 18, fontWeight: 700, fill: TX, fontFamily: "-apple-system,BlinkMacSystemFont,'SF Pro Display',sans-serif" }}>
        {total.toLocaleString()}
      </text>
    </svg>
  );
};

const SparkLine = ({ data, color, height = 40, width = 120 }) => {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data), min = Math.min(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`).join(" ");
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};

// ── Real Analytics Tracking Engine ─────────────────────────────────────────
const ANALYTICS_KEY = "analytics_v1";

const getDevice = () => {
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "Tablet";
  if (/mobile|iphone|ipod|android|blackberry|mini|windows\sce|palm/i.test(ua)) return "Mobile";
  return "Desktop";
};

const getReferrerSource = () => {
  const ref = document.referrer;
  if (!ref) return "Direct";
  try {
    const host = new URL(ref).hostname.replace("www.", "");
    if (host.includes("google")) return "Google";
    if (host.includes("twitter") || host.includes("t.co") || host.includes("x.com")) return "Twitter / X";
    if (host.includes("itch.io")) return "itch.io";
    if (host.includes("youtube") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("discord")) return "Discord";
    if (host.includes("reddit")) return "Reddit";
    if (host.includes("linkedin")) return "LinkedIn";
    if (host.includes("github")) return "GitHub";
    return host.split(".")[0].charAt(0).toUpperCase() + host.split(".")[0].slice(1);
  } catch { return "Direct"; }
};

const getCountryFromTimezone = () => {
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  const map = {
    "America/New_York":"United States","America/Chicago":"United States","America/Denver":"United States",
    "America/Los_Angeles":"United States","America/Phoenix":"United States","America/Anchorage":"United States",
    "America/Honolulu":"United States","America/Toronto":"Canada","America/Vancouver":"Canada",
    "America/Montreal":"Canada","Europe/London":"United Kingdom","Europe/Dublin":"United Kingdom",
    "Europe/Berlin":"Germany","Europe/Paris":"France","Europe/Madrid":"Spain","Europe/Rome":"Italy",
    "Europe/Amsterdam":"Netherlands","Europe/Brussels":"Belgium","Europe/Stockholm":"Sweden",
    "Europe/Oslo":"Norway","Europe/Copenhagen":"Denmark","Europe/Helsinki":"Finland",
    "Europe/Warsaw":"Poland","Europe/Prague":"Czech Republic","Europe/Vienna":"Austria",
    "Europe/Zurich":"Switzerland","Europe/Lisbon":"Portugal","Europe/Athens":"Greece",
    "Asia/Tokyo":"Japan","Asia/Seoul":"South Korea","Asia/Shanghai":"China","Asia/Hong_Kong":"Hong Kong",
    "Asia/Singapore":"Singapore","Asia/Kolkata":"India","Asia/Mumbai":"India","Asia/Dubai":"UAE",
    "Asia/Istanbul":"Turkey","Australia/Sydney":"Australia","Australia/Melbourne":"Australia",
    "Pacific/Auckland":"New Zealand","America/Sao_Paulo":"Brazil","America/Argentina/Buenos_Aires":"Argentina",
    "America/Mexico_City":"Mexico","America/Bogota":"Colombia","Africa/Johannesburg":"South Africa",
    "Africa/Lagos":"Nigeria","Africa/Cairo":"Egypt",
  };
  return map[tz] || "Other";
};

const COUNTRY_FLAGS = {
  "United States":"🇺🇸","United Kingdom":"🇬🇧","Germany":"🇩🇪","France":"🇫🇷","Canada":"🇨🇦",
  "Japan":"🇯🇵","South Korea":"🇰🇷","China":"🇨🇳","India":"🇮🇳","Australia":"🇦🇺",
  "Brazil":"🇧🇷","Spain":"🇪🇸","Italy":"🇮🇹","Netherlands":"🇳🇱","Sweden":"🇸🇪",
  "Norway":"🇳🇴","Denmark":"🇩🇰","Finland":"🇫🇮","Poland":"🇵🇱","Austria":"🇦🇹",
  "Switzerland":"🇨🇭","Belgium":"🇧🇪","Portugal":"🇵🇹","Greece":"🇬🇷","Turkey":"🇹🇷",
  "Mexico":"🇲🇽","Argentina":"🇦🇷","Colombia":"🇨🇴","Singapore":"🇸🇬","Hong Kong":"🇭🇰",
  "UAE":"🇦🇪","South Africa":"🇿🇦","Nigeria":"🇳🇬","Egypt":"🇪🇬","New Zealand":"🇳🇿",
  "Czech Republic":"🇨🇿","Other":"🌍",
};

const COUNTRY_COLORS = ["#0071e3","#af52de","#5e5ce6","#30d158","#ff9500","#ff375f","#32ade6","#ffd60a","#ff6961","#77dd77","#d2d2d7"];

const loadAnalytics = async () => {
  try {
    const r = await storage.get(ANALYTICS_KEY);
    if (r?.value) return JSON.parse(r.value);
  } catch {}
  return { sessions: [], pageViews: [], clicks: [], activity: [] };
};

const saveAnalytics = async (an) => {
  try {
    if (an.sessions.length > 2000) an.sessions = an.sessions.slice(-2000);
    if (an.pageViews.length > 5000) an.pageViews = an.pageViews.slice(-5000);
    if (an.clicks.length > 5000) an.clicks = an.clicks.slice(-5000);
    if (an.activity.length > 200) an.activity = an.activity.slice(-200);
    await storage.set(ANALYTICS_KEY, JSON.stringify(an));
  } catch {}
};

let _tracker = null;
const createTracker = async () => {
  if (_tracker) return _tracker;
  const an = await loadAnalytics();
  const sessionId = `s_${Date.now()}_${Math.random().toString(36).slice(2,7)}`;
  const device = getDevice();
  const referrer = getReferrerSource();
  const country = getCountryFromTimezone();
  const session = { id: sessionId, start: Date.now(), end: Date.now(), device, referrer, country, pages: [] };
  an.sessions.push(session);
  const flush = async () => {
    const idx = an.sessions.findIndex(s => s.id === sessionId);
    if (idx !== -1) an.sessions[idx].end = Date.now();
    await saveAnalytics(an);
  };
  const trackPage = async (path, label) => {
    const ts = Date.now();
    an.pageViews.push({ ts, path, label });
    const idx = an.sessions.findIndex(s => s.id === sessionId);
    if (idx !== -1 && !an.sessions[idx].pages.includes(path)) an.sessions[idx].pages.push(path);
    an.activity.push({ ts, icon: "📄", event: `Page viewed: ${label}` });
    await flush();
  };
  const trackClick = async (event, label, icon = "🖱️") => {
    const ts = Date.now();
    an.clicks.push({ ts, event, label });
    an.activity.push({ ts, icon, event: label });
    await flush();
  };
  window.addEventListener("beforeunload", flush);
  _tracker = { trackPage, trackClick, sessionId, device, referrer, country };
  return _tracker;
};

const useTracker = () => {
  const [tracker, setTracker] = useState(null);
  useEffect(() => { createTracker().then(setTracker); }, []);
  return tracker;
};

const AdminAnalytics = ({ data }) => {
  const [range, setRange] = useState("7d");
  const [an, setAn] = useState(null);
  const [clearing, setClearing] = useState(false);
  useEffect(() => {
    const load = async () => { const d = await loadAnalytics(); setAn(d); };
    load();
    const iv = setInterval(load, 30000);
    return () => clearInterval(iv);
  }, []);
  const clearData = async () => {
    if (!window.confirm("Clear all analytics data? This cannot be undone.")) return;
    setClearing(true);
    const empty = { sessions: [], pageViews: [], clicks: [], activity: [] };
    await saveAnalytics(empty);
    setAn(empty);
    setClearing(false);
  };
  if (!an) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300, color: TX2, fontSize: 15 }}>Loading analytics...</div>
  );
  const now = Date.now();
  const windowMs = range === "7d" ? 7*86400000 : range === "30d" ? 30*86400000 : range === "90d" ? 90*86400000 : Infinity;
  const since = range === "All" ? 0 : now - windowMs;
  const sessions = an.sessions.filter(s => s.start >= since);
  const pageViews = an.pageViews.filter(p => p.ts >= since);
  const clicks = an.clicks.filter(c => c.ts >= since);
  const activity = [...an.activity].reverse().slice(0, 20);
  const totalSessions = sessions.length;
  const totalPageViews = pageViews.length;
  const totalClicks = clicks.length;
  const durations = sessions.map(s => s.end - s.start).filter(d => d > 0 && d < 3600000);
  const avgMs = durations.length ? durations.reduce((a,b)=>a+b,0)/durations.length : 0;
  const avgSession = avgMs ? `${Math.floor(avgMs/60000)}m ${Math.floor((avgMs%60000)/1000)}s` : "—";
  const bounceRate = sessions.length ? Math.round(sessions.filter(s=>s.pages.length<=1).length/sessions.length*100) : 0;
  const chartDays = range === "30d" || range === "90d" ? 30 : range === "All" ? 30 : 7;
  const dailyBars = Array.from({ length: chartDays }, (_, i) => {
    const dayStart = new Date(); dayStart.setHours(0,0,0,0); dayStart.setDate(dayStart.getDate() - (chartDays - 1 - i));
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
    const label = dayStart.toLocaleDateString("en", chartDays <= 7 ? { weekday:"short" } : { month:"short", day:"numeric" });
    const v = sessions.filter(s => s.start >= dayStart.getTime() && s.start < dayEnd.getTime()).length;
    return { label, v };
  });
  const pvTrend = Array.from({ length: 30 }, (_, i) => {
    const dayStart = new Date(); dayStart.setHours(0,0,0,0); dayStart.setDate(dayStart.getDate() - (29 - i));
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate() + 1);
    return pageViews.filter(p => p.ts >= dayStart.getTime() && p.ts < dayEnd.getTime()).length;
  });
  const pageCounts = {};
  pageViews.forEach(p => { pageCounts[p.label || p.path] = (pageCounts[p.label || p.path] || 0) + 1; });
  const topPages = Object.entries(pageCounts).sort((a,b) => b[1]-a[1]).slice(0,7).map(([label, views]) => {
    const pct = totalPageViews ? Math.round(views/totalPageViews*1000)/10 : 0;
    return { label, views, pct };
  });
  const deviceCounts = { Desktop: 0, Mobile: 0, Tablet: 0 };
  sessions.forEach(s => { if (deviceCounts[s.device] !== undefined) deviceCounts[s.device]++; });
  const deviceColors = { Desktop: "#0071e3", Mobile: "#af52de", Tablet: "#30d158" };
  const deviceSegments = Object.entries(deviceCounts).filter(([,v])=>v>0).map(([label, v]) => ({ label, v, color: deviceColors[label] }));
  const countryCounts = {};
  sessions.forEach(s => { const c = s.country || "Other"; countryCounts[c] = (countryCounts[c]||0) + 1; });
  const topCountries = Object.entries(countryCounts).sort((a,b)=>b[1]-a[1]).slice(0,7).map(([name, v], i) => ({
    name, v, flag: COUNTRY_FLAGS[name] || "🌍", pct: totalSessions ? Math.round(v/totalSessions*1000)/10 : 0,
    color: COUNTRY_COLORS[i % COUNTRY_COLORS.length]
  }));
  const refIcons = { Direct:"🔗", Google:"🔍", "Twitter / X":"𝕏", "itch.io":"🎮", YouTube:"▶️", Discord:"💬", Reddit:"👾", LinkedIn:"💼", GitHub:"🐙" };
  const refCounts = {};
  sessions.forEach(s => { const r = s.referrer || "Direct"; refCounts[r] = (refCounts[r]||0)+1; });
  const topReferrers = Object.entries(refCounts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([source, v]) => ({
    source, v, icon: refIcons[source] || "🌐"
  }));
  const clickColors = ["#30d158","#0071e3","#af52de","#ff9500","#5e5ce6","#ff375f","#32ade6"];
  const clickCounts = {};
  clicks.forEach(c => { const k = c.event; clickCounts[k] = (clickCounts[k]||0)+1; });
  const topClicks = Object.entries(clickCounts).sort((a,b)=>b[1]-a[1]).slice(0,6).map(([event, v], i) => ({
    event, v, color: clickColors[i % clickColors.length]
  }));
  const sessionSparkDays = 7;
  const sessionSpark = Array.from({ length: sessionSparkDays }, (_, i) => {
    const dayStart = new Date(); dayStart.setHours(0,0,0,0); dayStart.setDate(dayStart.getDate() - (sessionSparkDays-1-i));
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate()+1);
    return sessions.filter(s=>s.start>=dayStart.getTime()&&s.start<dayEnd.getTime()).length;
  });
  const pvSpark = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(); dayStart.setHours(0,0,0,0); dayStart.setDate(dayStart.getDate() - (6-i));
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate()+1);
    return pageViews.filter(p=>p.ts>=dayStart.getTime()&&p.ts<dayEnd.getTime()).length;
  });
  const clickSpark = Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(); dayStart.setHours(0,0,0,0); dayStart.setDate(dayStart.getDate() - (6-i));
    const dayEnd = new Date(dayStart); dayEnd.setDate(dayEnd.getDate()+1);
    return clicks.filter(c=>c.ts>=dayStart.getTime()&&c.ts<dayEnd.getTime()).length;
  });
  const relTime = (ts) => {
    const d = Math.floor((now - ts)/1000);
    if (d < 60) return `${d}s ago`;
    if (d < 3600) return `${Math.floor(d/60)}m ago`;
    if (d < 86400) return `${Math.floor(d/3600)}h ago`;
    return `${Math.floor(d/86400)}d ago`;
  };
  const CARD = { background: CARDBG, borderRadius: 16, padding: 24, boxShadow: SHADOW };
  const maxRef = Math.max(...topReferrers.map(r=>r.v), 1);
  const maxClick = Math.max(...topClicks.map(c=>c.v), 1);
  const isEmpty = totalSessions === 0 && totalPageViews === 0;
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: FONTD, fontSize: 32, fontWeight: 700, color: TX, margin: 0 }}>Analytics</h1>
          <p style={{ color: TX2, fontSize: 14, margin: "4px 0 0" }}>Real visitor data from your portfolio — tracking started from first load</p>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6, background: BG2, padding: 4, borderRadius: 10 }}>
            {["7d","30d","90d","All"].map(r => (
              <button key={r} onClick={() => setRange(r)} style={{ padding: "7px 16px", borderRadius: 7, border: "none", background: range === r ? CARDBG : "transparent", color: range === r ? TX : TX2, fontFamily: FONT, fontSize: 13, fontWeight: range === r ? 600 : 400, cursor: "pointer", boxShadow: range === r ? SHADOW : "none", transition: "all 0.25s" }}>{r}</button>
            ))}
          </div>
          <button onClick={clearData} disabled={clearing} style={{ padding: "9px 16px", borderRadius: 10, border: "none", background: "#ff3b3012", color: "#ff3b30", fontSize: 13, cursor: "pointer", fontWeight: 500 }}>{clearing ? "Clearing…" : "Clear Data"}</button>
        </div>
      </div>
      {isEmpty && (
        <div style={{ ...CARD, textAlign: "center", padding: "60px 32px", marginBottom: 20 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
          <div style={{ fontFamily: FONTD, fontSize: 20, fontWeight: 700, color: TX, marginBottom: 8 }}>No data yet for this period</div>
          <p style={{ color: TX2, fontSize: 15, maxWidth: 400, margin: "0 auto" }}>Analytics are tracked automatically when visitors browse your public portfolio. Share your portfolio link to start collecting real data. Data from your current session is already being recorded.</p>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))", gap: 14, marginBottom: 24 }}>
        {[
          { icon:"👥", label:"Sessions", value: totalSessions.toLocaleString(), sub: "unique visits", color:"#0071e3", spark: sessionSpark },
          { icon:"📄", label:"Page Views", value: totalPageViews.toLocaleString(), sub: "pages loaded", color:"#af52de", spark: pvSpark },
          { icon:"🖱️", label:"Clicks Tracked", value: totalClicks.toLocaleString(), sub: "button interactions", color:"#30d158", spark: clickSpark },
          { icon:"⏱️", label:"Avg. Session", value: avgSession, sub: `${bounceRate}% bounce rate`, color:"#ff9500", spark: [] },
          { icon:"📱", label:"Top Device", value: deviceSegments.length ? deviceSegments.sort((a,b)=>b.v-a.v)[0]?.label : "—", sub: deviceSegments.length ? `${Math.round(deviceSegments.sort((a,b)=>b.v-a.v)[0]?.v / Math.max(totalSessions,1) * 100)}% of sessions` : "no data", color:"#5e5ce6", spark: [] },
          { icon:"🌍", label:"Top Country", value: topCountries[0]?.name || "—", sub: topCountries[0] ? `${topCountries[0].pct}% of visitors` : "no data", color:"#ff375f", spark: [] },
        ].map(({ icon, label, value, sub, color, spark }) => (
          <div key={label} style={{ ...CARD, padding: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 20, marginBottom: 8 }}>{icon}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: TX2, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 4 }}>{label}</div>
                <div style={{ fontFamily: FONTD, fontSize: 22, fontWeight: 700, color: TX, letterSpacing: -0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{value}</div>
                <div style={{ fontSize: 12, color, marginTop: 4, fontWeight: 500 }}>{sub}</div>
              </div>
              {spark.length > 1 && <SparkLine data={spark} color={color} height={42} width={70} />}
            </div>
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 16, marginBottom: 16 }}>
        <div style={CARD}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: FONTD, fontSize: 17, fontWeight: 700, color: TX }}>Sessions — {range === "All" ? "Last 30 days" : range}</div>
              <div style={{ fontSize: 13, color: TX2 }}>Daily visitor sessions</div>
            </div>
            <div style={{ fontFamily: FONTD, fontSize: 22, fontWeight: 700, color: AC }}>{dailyBars.reduce((s,d)=>s+d.v,0).toLocaleString()}</div>
          </div>
          <div style={{ height: 140, display: "flex", alignItems: "flex-end", gap: 6 }}>
            {dailyBars.map((d, i) => {
              const max = Math.max(...dailyBars.map(x=>x.v), 1);
              const pct = (d.v / max) * 100;
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                  {d.v > 0 && <div style={{ fontSize: 10, color: TX2, fontWeight: 500 }}>{d.v}</div>}
                  <div title={`${d.label}: ${d.v}`} style={{ width: "100%", height: `${Math.max(pct, 2)}%`, background: d.v > 0 ? `linear-gradient(to top, ${AC}, #42a4ff)` : BG2, borderRadius: "5px 5px 0 0", transition: "height 0.5s cubic-bezier(.25,.46,.45,.94)", minHeight: 3 }} />
                  <div style={{ fontSize: dailyBars.length > 10 ? 9 : 11, color: TX2, whiteSpace: "nowrap", overflow: "hidden", maxWidth: "100%", textAlign: "center" }}>{dailyBars.length > 14 ? (i % 5 === 0 ? d.label : "") : d.label}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div style={CARD}>
          <div style={{ fontFamily: FONTD, fontSize: 17, fontWeight: 700, color: TX, marginBottom: 4 }}>Devices</div>
          <div style={{ fontSize: 13, color: TX2, marginBottom: 20 }}>Sessions by device type</div>
          {deviceSegments.length === 0
            ? <div style={{ textAlign: "center", color: TX2, fontSize: 14, padding: "40px 0" }}>No session data yet</div>
            : <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
                <DonutChart segments={deviceSegments} size={130} />
                <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8 }}>
                  {deviceSegments.map(d => (
                    <div key={d.label} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color }} />
                        <span style={{ fontSize: 13, color: TX }}>{d.label}</span>
                      </div>
                      <span style={{ fontSize: 13, color: TX2, fontWeight: 500 }}>{d.v} · {((d.v/totalSessions)*100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              </div>
          }
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={CARD}>
          <div style={{ fontFamily: FONTD, fontSize: 17, fontWeight: 700, color: TX, marginBottom: 4 }}>Page Views — Last 30 Days</div>
          <div style={{ fontSize: 13, color: TX2, marginBottom: 20 }}>Daily page view trend</div>
          <div style={{ height: 100 }}>
            {(() => {
              const d = pvTrend;
              const max = Math.max(...d, 1), min = 0;
              const W = 560, H = 100;
              const pts = d.map((v,i) => `${(i/(d.length-1))*W},${H - ((v-min)/(max-min||1))*(H-10)}`).join(" ");
              return (
                <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ overflow:"visible" }}>
                  <defs>
                    <linearGradient id="pvgrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={AC} stopOpacity="0.2" />
                      <stop offset="100%" stopColor={AC} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon points={`${pts} ${W},${H} 0,${H}`} fill="url(#pvgrad)" />
                  <polyline points={pts} fill="none" stroke={AC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              );
            })()}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11, color: TX3 }}>30 days ago</span>
            <span style={{ fontSize: 11, color: TX3 }}>Today</span>
          </div>
        </div>
        <div style={CARD}>
          <div style={{ fontFamily: FONTD, fontSize: 17, fontWeight: 700, color: TX, marginBottom: 4 }}>Top Pages</div>
          <div style={{ fontSize: 13, color: TX2, marginBottom: 16 }}>Most visited pages</div>
          {topPages.length === 0
            ? <div style={{ color: TX2, fontSize: 14, padding: "20px 0" }}>No page view data yet. Browse your portfolio to start tracking.</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topPages.map((p, i) => (
                  <div key={p.label}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 11, color: TX3, width: 16, textAlign: "right", flexShrink: 0 }}>{i+1}</span>
                        <span style={{ fontSize: 13, color: TX, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{p.label}</span>
                      </div>
                      <span style={{ fontSize: 12, color: TX2, flexShrink: 0 }}>{p.views} · {p.pct}%</span>
                    </div>
                    <div style={{ height: 4, background: BG2, borderRadius: 2, overflow: "hidden", marginLeft: 24 }}>
                      <div style={{ height: "100%", width: `${Math.min(p.pct * 4, 100)}%`, background: `linear-gradient(90deg, ${AC}, #42a4ff)`, borderRadius: 2, transition: "width 0.8s" }} />
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 16 }}>
        <div style={CARD}>
          <div style={{ fontFamily: FONTD, fontSize: 17, fontWeight: 700, color: TX, marginBottom: 4 }}>Top Locations</div>
          <div style={{ fontSize: 13, color: TX2, marginBottom: 16 }}>Detected via timezone</div>
          {topCountries.length === 0
            ? <div style={{ color: TX2, fontSize: 14 }}>No location data yet</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {topCountries.map(loc => (
                  <div key={loc.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 16 }}>{loc.flag}</span>
                        <span style={{ fontSize: 13, color: TX, fontWeight: 500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth: 110 }}>{loc.name}</span>
                      </div>
                      <span style={{ fontSize: 12, color: TX2 }}>{loc.v} · {loc.pct}%</span>
                    </div>
                    <div style={{ height: 4, background: BG2, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${loc.pct}%`, background: loc.color, borderRadius: 2, transition: "width 0.8s" }} />
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
        <div style={CARD}>
          <div style={{ fontFamily: FONTD, fontSize: 17, fontWeight: 700, color: TX, marginBottom: 4 }}>Traffic Sources</div>
          <div style={{ fontSize: 13, color: TX2, marginBottom: 16 }}>Where visitors come from</div>
          {topReferrers.length === 0
            ? <div style={{ color: TX2, fontSize: 14 }}>No referrer data yet</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {topReferrers.map(ref => (
                  <div key={ref.source}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 15 }}>{ref.icon}</span>
                        <span style={{ fontSize: 13, color: TX, fontWeight: 500 }}>{ref.source}</span>
                      </div>
                      <span style={{ fontSize: 12, color: TX2 }}>{ref.v}</span>
                    </div>
                    <div style={{ height: 4, background: BG2, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(ref.v/maxRef)*100}%`, background: `linear-gradient(90deg, ${GRAD1}, ${GRAD2})`, borderRadius: 2, transition: "width 0.8s" }} />
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
        <div style={CARD}>
          <div style={{ fontFamily: FONTD, fontSize: 17, fontWeight: 700, color: TX, marginBottom: 4 }}>Click Events</div>
          <div style={{ fontSize: 13, color: TX2, marginBottom: 16 }}>Most clicked elements</div>
          {topClicks.length === 0
            ? <div style={{ color: TX2, fontSize: 14 }}>No click data yet</div>
            : <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {topClicks.map(ev => (
                  <div key={ev.event}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: ev.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, color: TX, fontWeight: 500, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth: 130 }}>{ev.event}</span>
                      </div>
                      <span style={{ fontSize: 12, color: TX2 }}>{ev.v}</span>
                    </div>
                    <div style={{ height: 4, background: BG2, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${(ev.v/maxClick)*100}%`, background: ev.color, borderRadius: 2, opacity: 0.8, transition: "width 0.8s" }} />
                    </div>
                  </div>
                ))}
              </div>
          }
        </div>
      </div>
      <div style={CARD}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#30d158", boxShadow: "0 0 6px #30d158" }} />
          <div style={{ fontFamily: FONTD, fontSize: 17, fontWeight: 700, color: TX }}>Recent Activity</div>
          <span style={{ fontSize: 12, color: TX2, marginLeft: 4 }}>— auto-refreshes every 30s</span>
        </div>
        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 0 }}>
          {activity.length === 0
            ? <div style={{ color: TX2, fontSize: 14, padding: "20px 0", gridColumn: "1/-1" }}>No activity recorded yet. Browse the public portfolio to generate events.</div>
            : activity.map((act, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 12px", borderBottom: `1px solid ${BORDER}` }}>
                  <span style={{ fontSize: 18, flexShrink: 0 }}>{act.icon}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, color: TX, fontWeight: 500, lineHeight: 1.3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{act.event}</div>
                    <div style={{ fontSize: 11, color: TX3, marginTop: 2 }}>{relTime(act.ts)}</div>
                  </div>
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
};

// ── AdminShowcase ──────────────────────────────────────────────────────────
// ── Shared JSON quick-fill (used by Showcase + Games + Blog-style flows) ────
const normalizeSections = (arr) => Array.isArray(arr)
  ? arr.map((s, i) => ({
      id: s.id || `${Date.now()}_${i}`,
      type: ["collaborator", "embed", "feature", "browser"].includes(s.type) ? s.type : "text",
      title: s.title || "",
      text: s.text || "",
      images: Array.isArray(s.images) ? s.images.filter(x => typeof x === "string") : [],
      gif: typeof s.gif === "string" ? s.gif : "",
      image: typeof s.image === "string" ? s.image : "",
      url: typeof s.url === "string" ? s.url : "",
      collabName: s.collabName || "", collabRole: s.collabRole || "",
      collabBio: s.collabBio || "", collabAvatar: s.collabAvatar || "", collabLink: s.collabLink || "",
    }))
  : null;

const JsonQuickFill = ({ value, onChange, onFill, onClear, msg, keysHint, placeholder, saveLabel }) => (
  <div style={{ background: CARDBG, borderRadius: 16, padding: 24, boxShadow: SHADOW, marginBottom: 20 }}>
    <div style={{ fontSize: 13, fontWeight: 700, color: TX, marginBottom: 8 }}>⚡ Quick-fill from JSON</div>
    <p style={{ fontSize: 12, color: TX2, lineHeight: 1.6, margin: "0 0 12px" }}>
      Paste JSON (e.g. generated by ChatGPT) to auto-fill the fields below. Recognised keys: {keysHint}. Image fields also accept URLs if you include them. Review everything, then click {saveLabel} — nothing saves until you do.
    </p>
    <textarea value={value} onChange={e => onChange(e.target.value)} rows={7} placeholder={placeholder} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, background: BG2, color: TX, fontSize: 13, fontFamily: "monospace", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
    {msg && <div style={{ marginTop: 10, fontSize: 13, color: msg.ok ? "#30d158" : "#ff3b30" }}>{msg.text}</div>}
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <AppleBtn primary small onClick={onFill}>Fill fields</AppleBtn>
      <button onClick={onClear} style={{ padding: "9px 18px", borderRadius: 980, border: `1px solid ${BORDER}`, background: "transparent", color: TX2, fontSize: 14, cursor: "pointer", fontFamily: FONT }}>Clear</button>
    </div>
  </div>
);

const AdminShowcase = ({ data, save }) => {
  const [editing, setEditing] = useState(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonMsg, setJsonMsg] = useState(null);
  const blank = { id: "", title: "", category: "3D Art", description: "", tags: [], images: [], gif: "", videoUrl: "", downloadUrl: "", downloadLabel: "Download", year: new Date().getFullYear().toString(), status: "draft", color: "#af52de", customSections: [] };
  const importJson = () => {
    try {
      const j = JSON.parse(jsonText.trim());
      const CATS = ["3D Art", "2D Art", "Game Assets", "Animation", "Pixel Art", "Concept Art", "Other"];
      const ns = normalizeSections(j.customSections);
      setEditing(p => ({
        ...p,
        title: j.title ?? p.title,
        category: CATS.includes(j.category) ? j.category : p.category,
        description: j.description ?? p.description,
        tags: Array.isArray(j.tags) ? j.tags.filter(x => typeof x === "string") : p.tags,
        year: j.year != null ? String(j.year) : p.year,
        color: typeof j.color === "string" && j.color ? j.color : p.color,
        videoUrl: j.videoUrl ?? p.videoUrl,
        downloadUrl: j.downloadUrl ?? p.downloadUrl,
        downloadLabel: j.downloadLabel ?? p.downloadLabel,
        status: j.status === "published" ? "published" : p.status,
        images: Array.isArray(j.images) ? j.images.filter(x => typeof x === "string") : p.images,
        gif: typeof j.gif === "string" ? j.gif : p.gif,
        customSections: ns !== null ? ns : p.customSections,
      }));
      setJsonMsg({ ok: true, text: "Imported — fields below are filled. Review them, then click Save Item." });
      setJsonText("");
    } catch {
      setJsonMsg({ ok: false, text: "Invalid JSON — check for a missing quote, comma or bracket." });
    }
  };
  const saveItem = (item) => {
    const exists = (data.showcase || []).find(x => x.id === item.id);
    save({ ...data, showcase: exists ? (data.showcase || []).map(x => x.id === item.id ? item : x) : [...(data.showcase || []), item] });
    setEditing(null);
  };
  const del = (id) => save({ ...data, showcase: (data.showcase || []).filter(s => s.id !== id) });
  if (editing) {
    const it = editing; const u = (k, v) => setEditing(p => ({ ...p, [k]: v }));
    return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
          <h1 style={{ fontFamily: FONTD, fontSize: 28, fontWeight: 700, color: TX, margin: 0 }}>{it.title ? `Edit: ${it.title}` : "New Showcase Item"}</h1>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setEditing(null)} style={{ padding: "9px 20px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: TX2, fontSize: 14, cursor: "pointer" }}>Cancel</button>
            <AppleBtn primary small onClick={() => saveItem(it)}>Save Item</AppleBtn>
          </div>
        </div>
        <JsonQuickFill value={jsonText} onChange={setJsonText} onFill={importJson} onClear={() => { setJsonText(""); setJsonMsg(null); }} msg={jsonMsg} saveLabel="Save Item" keysHint="title, category (must match a dropdown option), description, tags[], year, color, videoUrl, downloadUrl, downloadLabel, status, customSections[]" placeholder={'{\n  "title": "Realistic FPS Showcase",\n  "category": "3D Art",\n  "description": "A visual showcase pushing Unity lighting and feel.",\n  "tags": ["Unity", "Lighting", "FPS"],\n  "year": "2025",\n  "status": "published",\n  "customSections": [\n    { "type": "text", "title": "Goal", "text": "..." }\n  ]\n}'} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
          <div style={{ background: CARDBG, borderRadius: 16, padding: 28, boxShadow: SHADOW }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: AC, margin: "0 0 20px", textTransform: "uppercase" }}>Basic Info</h3>
            <Input label="Title" value={it.title} onChange={v => u("title", v)} placeholder="Work title" />
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 6 }}>Category</label>
              <select value={it.category} onChange={e => u("category", e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${BORDER}`, background: BG2, color: TX, fontSize: 15, fontFamily: FONT }}>
                {["3D Art", "2D Art", "Game Assets", "Animation", "Pixel Art", "Concept Art", "Other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Description" value={it.description} onChange={v => u("description", v)} textarea rows={4} placeholder="Describe your work..." />
            <TagInput label="Tags" tags={it.tags || []} onChange={v => u("tags", v)} />
            <Input label="Year" value={it.year} onChange={v => u("year", v)} />
            <Input label="Accent Color" value={it.color} onChange={v => u("color", v)} type="color" />
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 8 }}>Status</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["draft","published"].map(s => <button key={s} onClick={() => u("status", s)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${it.status===s?(s==="published"?"#30d158":"#ff9500"):BORDER}`, background: it.status===s?(s==="published"?"#30d15812":"#ff950012"):"transparent", color: it.status===s?(s==="published"?"#30d158":"#ff9500"):TX2, fontSize: 14, cursor: "pointer", textTransform: "capitalize" }}>{s}</button>)}
              </div>
            </div>
          </div>
          <div style={{ background: CARDBG, borderRadius: 16, padding: 28, boxShadow: SHADOW }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: AC, margin: "0 0 20px", textTransform: "uppercase" }}>Media</h3>
            <ImgUpload label="Images (auto-rotate on card)" value={it.images || []} onChange={v => typeof v === "function" ? u("images", v(it.images || [])) : u("images", v)} multi />
            <ImgUpload label="GIF (overrides images on card)" value={it.gif} onChange={v => u("gif", v)} />
            <Input label="YouTube / Video URL" value={it.videoUrl} onChange={v => u("videoUrl", v)} placeholder="https://youtube.com/watch?v=..." />
          </div>
          <div style={{ background: CARDBG, borderRadius: 16, padding: 28, boxShadow: SHADOW }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: AC, margin: "0 0 20px", textTransform: "uppercase" }}>Download</h3>
            <Input label="Download URL" value={it.downloadUrl} onChange={v => u("downloadUrl", v)} placeholder="https://drive.google.com/..." />
            <Input label="Download Button Label" value={it.downloadLabel} onChange={v => u("downloadLabel", v)} placeholder="Download .blend file" />
            <div style={{ padding: 16, borderRadius: 12, background: BG2, fontSize: 13, color: TX2, lineHeight: 1.6 }}>💡 Upload your file to Google Drive, Dropbox or itch.io and paste the link here. It will show as a download button on the page.</div>
          </div>
          <div style={{ background: CARDBG, borderRadius: 16, padding: 28, boxShadow: SHADOW, gridColumn: "1 / -1" }}>
            <h3 style={{ fontSize: 13, fontWeight: 600, color: AC, margin: "0 0 20px", textTransform: "uppercase" }}>Content Sections</h3>
            <SectionBuilder sections={it.customSections || []} onChange={v => u("customSections", v)} />
          </div>
        </div>
      </div>
    );
  }
  const items = data.showcase || [];
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontFamily: FONTD, fontSize: 32, fontWeight: 700, color: TX, margin: 0 }}>Showcase</h1>
        <AppleBtn primary small onClick={() => { setJsonText(""); setJsonMsg(null); setEditing({ ...blank, id: Date.now().toString() }); }}>+ Add Item</AppleBtn>
      </div>
      {items.length === 0 ? (
        <div style={{ background: CARDBG, borderRadius: 16, padding: "56px 32px", boxShadow: SHADOW, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎨</div>
          <p style={{ color: TX2, fontSize: 17 }}>No showcase items yet — click + Add Item to get started.</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {items.map(it => (
            <div key={it.id} style={{ display: "flex", alignItems: "center", gap: 16, background: CARDBG, borderRadius: 14, padding: "14px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flexWrap: "wrap" }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: it.gif ? `url(${it.gif}) center/cover` : it.images?.[0] ? `url(${it.images[0]}) center/cover` : `linear-gradient(145deg,${it.color||GRAD1}20,${BG2})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{!it.gif && !it.images?.[0] && "🎨"}</div>
              <div style={{ flex: 1, minWidth: 120 }}>
                <div style={{ color: TX, fontWeight: 600, fontSize: 16 }}>{it.title}</div>
                <div style={{ color: TX2, fontSize: 13, marginTop: 2 }}>{it.category} · {it.year}</div>
              </div>
              <span style={{ padding: "4px 12px", borderRadius: 980, fontSize: 12, fontWeight: 500, background: it.status==="published"?"#30d15818":"#ff950018", color: it.status==="published"?"#30d158":"#ff9500" }}>{it.status}</span>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={() => nav(`#/showcase/${it.id}`)} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: TX2, fontSize: 13, cursor: "pointer" }}>View</button>
                <button onClick={() => { setJsonText(""); setJsonMsg(null); setEditing({ ...it }); }} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: AC, color: "#fff", fontSize: 13, cursor: "pointer" }}>Edit</button>
                <button onClick={() => del(it.id)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#ff3b3012", color: "#ff3b30", fontSize: 13, cursor: "pointer" }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── AdminMediaLibrary ──────────────────────────────────────────────────────
const AdminMediaLibrary = () => {
  const [library, setLibrary] = useState(getMediaCache());
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);
  const [search, setSearch] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [uploading, setUploading] = useState(false);
  useEffect(() => { setLoading(true); fetchMediaLibrary().then(urls => { setLibrary(urls); setLoading(false); }); }, []);
  const filtered = search ? library.filter(url => url.toLowerCase().includes(search.toLowerCase())) : library;
  const copyUrl = (url) => { navigator.clipboard.writeText(url).then(() => { setCopied(url); setTimeout(() => setCopied(null), 2000); }); };
  const remove = async (url) => {
    if (!window.confirm("Delete this image from Firebase Storage? This cannot be undone.")) return;
    setDeleting(url);
    await deleteFromStorage(url);
    setLibrary(prev => prev.filter(u => u !== url));
    setDeleting(null);
  };
  const uploadNew = async (files) => {
    setUploading(true);
    await Promise.all(Array.from(files).map(f => new Promise(resolve => {
      const r = new FileReader();
      r.onload = async () => {
        try {
          const imgRef = storageRef(fbStorage, `portfolio/img_${Date.now()}_${Math.random().toString(36).slice(2,7)}`);
          await uploadString(imgRef, r.result, "data_url");
          const url = await getDownloadURL(imgRef);
          addToMediaLibrary(url);
          resolve(url);
        } catch { resolve(null); }
      };
      r.readAsDataURL(f);
    })));
    const updated = await fetchMediaLibrary();
    setLibrary(updated);
    setUploading(false);
  };
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: FONTD, fontSize: 32, fontWeight: 700, color: TX, margin: 0 }}>Media Library</h1>
          <p style={{ color: TX2, fontSize: 14, margin: "4px 0 0" }}>{loading ? "Loading from Firebase..." : `${library.length} images in Firebase Storage`}</p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => fetchMediaLibrary().then(setLibrary)} style={{ padding: "10px 16px", borderRadius: 12, border: `1px solid ${BORDER}`, background: CARDBG, color: TX2, fontSize: 13, cursor: "pointer" }}>↻ Refresh</button>
          <label style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 12, background: uploading ? "#30d158" : AC, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all 0.3s" }}>
            <input type="file" accept="image/*,image/gif" multiple onChange={e => uploadNew(e.target.files)} style={{ display: "none" }} />
            {uploading ? "⏳ Uploading..." : "⬆️ Upload Images"}
          </label>
        </div>
      </div>
      <div style={{ marginBottom: 20 }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search images..." style={{ width: "100%", maxWidth: 400, padding: "10px 16px", borderRadius: 12, border: `1px solid ${BORDER}`, background: CARDBG, color: TX, fontSize: 14, outline: "none", fontFamily: FONT, boxSizing: "border-box" }} onFocus={e => e.target.style.borderColor = AC} onBlur={e => e.target.style.borderColor = BORDER} />
      </div>
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {[...Array(8)].map((_, i) => (<div key={i} style={{ background: BG2, borderRadius: 14, height: 160 }} />))}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ background: CARDBG, borderRadius: 16, padding: "60px 32px", textAlign: "center", boxShadow: SHADOW }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🗂️</div>
          <p style={{ color: TX2, fontSize: 16, marginBottom: 8 }}>No images in Firebase Storage yet.</p>
          <p style={{ color: TX3, fontSize: 14 }}>Every image you upload through Games, Showcase, BTS or Blog will appear here automatically.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
          {filtered.map((url, i) => (
            <div key={i} style={{ background: CARDBG, borderRadius: 14, overflow: "hidden", boxShadow: SHADOW, position: "relative", opacity: deleting === url ? 0.4 : 1, transition: "opacity 0.3s" }}>
              <img src={url} alt="" style={{ width: "100%", height: 130, objectFit: "cover", display: "block" }} />
              <button onClick={() => remove(url)} title="Delete from Firebase Storage" style={{ position: "absolute", top: 7, right: 7, width: 26, height: 26, borderRadius: "50%", background: "rgba(255,59,48,0.92)", border: "none", color: "#fff", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>{deleting === url ? "..." : "×"}</button>
              <div style={{ padding: "8px 10px" }}>
                <button onClick={() => copyUrl(url)} style={{ width: "100%", padding: "6px", borderRadius: 8, border: "none", background: copied === url ? "#30d15820" : `${AC}12`, color: copied === url ? "#30d158" : AC, fontSize: 12, cursor: "pointer", fontWeight: 600, transition: "all 0.3s" }}>{copied === url ? "✓ Copied!" : "Copy URL"}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ── FirebaseUsage — read-only storage/database meter ────────────────────────
const fmtBytes = (b) => {
  if (!b || b < 0) return "0 B";
  const u = ["B","KB","MB","GB"]; let i = 0; let n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
};

const FirebaseUsage = () => {
  const [loading, setLoading] = useState(true);
  const [storageBytes, setStorageBytes] = useState(0);
  const [imageCount, setImageCount] = useState(0);
  const [dbBytes, setDbBytes] = useState(0);
  const [err, setErr] = useState("");

  const measure = async () => {
    setLoading(true); setErr("");
    try {
      const folderRef = storageRef(fbStorage, "portfolio");
      const result = await listAll(folderRef);
      setImageCount(result.items.length);
      const sizes = await Promise.all(result.items.map(async it => { try { const m = await getMetadata(it); return m.size || 0; } catch { return 0; } }));
      setStorageBytes(sizes.reduce((a, b) => a + b, 0));
    } catch (e) { setErr("Couldn't read Storage usage — check your Storage rules allow read."); }
    try {
      let total = 0;
      for (const key of ["portfolio_data_v2", "analytics_v1"]) {
        const r = await storage.get(key);
        if (r?.value) total += new Blob([typeof r.value === "string" ? r.value : JSON.stringify(r.value)]).size;
      }
      setDbBytes(total);
    } catch {}
    setLoading(false);
  };
  useEffect(() => { measure(); }, []);

  const STORAGE_LIMIT = 5 * 1024 * 1024 * 1024; // 5 GB (Spark)
  const DB_LIMIT = 1 * 1024 * 1024 * 1024;       // 1 GB stored (Spark)
  const Bar = ({ used, limit, color }) => {
    const pct = Math.min((used / limit) * 100, 100);
    return (
      <div style={{ height: 10, background: BG2, borderRadius: 980, overflow: "hidden", marginTop: 10 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: pct > 85 ? "#ff3b30" : color, borderRadius: 980, transition: "width 0.8s" }} />
      </div>
    );
  };
  const CARD = { background: CARDBG, borderRadius: 16, padding: 28, boxShadow: SHADOW };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: FONTD, fontSize: 32, fontWeight: 700, color: TX, margin: 0 }}>🔥 Firebase Usage</h1>
          <p style={{ color: TX2, fontSize: 14, margin: "4px 0 0" }}>Live snapshot of your stored data. Bandwidth/quota lives in the Firebase Console.</p>
        </div>
        <button onClick={measure} disabled={loading} style={{ padding: "10px 16px", borderRadius: 12, border: `1px solid ${BORDER}`, background: CARDBG, color: TX2, fontSize: 13, cursor: "pointer" }}>{loading ? "Measuring…" : "↻ Refresh"}</button>
      </div>
      {err && <div style={{ padding: "12px 16px", borderRadius: 12, background: "#ff950012", color: "#ff9500", fontSize: 13, margin: "12px 0" }}>{err}</div>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16, marginTop: 16 }}>
        <div style={CARD}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontFamily: FONTD, fontSize: 17, fontWeight: 700, color: TX, margin: 0 }}>Storage (images)</h3>
            <span style={{ fontSize: 13, color: TX2 }}>{loading ? "…" : `${imageCount} files`}</span>
          </div>
          <div style={{ fontFamily: FONTD, fontSize: 30, fontWeight: 700, color: TX, marginTop: 12 }}>{loading ? "—" : fmtBytes(storageBytes)}</div>
          <div style={{ fontSize: 13, color: TX2 }}>of {fmtBytes(STORAGE_LIMIT)} free-tier reference</div>
          <Bar used={storageBytes} limit={STORAGE_LIMIT} color={AC} />
        </div>
        <div style={CARD}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <h3 style={{ fontFamily: FONTD, fontSize: 17, fontWeight: 700, color: TX, margin: 0 }}>Realtime Database</h3>
            <span style={{ fontSize: 13, color: TX2 }}>content + analytics</span>
          </div>
          <div style={{ fontFamily: FONTD, fontSize: 30, fontWeight: 700, color: TX, marginTop: 12 }}>{loading ? "—" : fmtBytes(dbBytes)}</div>
          <div style={{ fontSize: 13, color: TX2 }}>of {fmtBytes(DB_LIMIT)} free-tier reference</div>
          <Bar used={dbBytes} limit={DB_LIMIT} color={GRAD2} />
        </div>
      </div>
      <div style={{ ...CARD, marginTop: 16 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: AC, margin: "0 0 12px", textTransform: "uppercase" }}>Notes</h3>
        <ul style={{ margin: 0, paddingLeft: 18, color: TX2, fontSize: 14, lineHeight: 1.8 }}>
          <li>These are <strong style={{ color: TX }}>stored-size</strong> figures measured live from your project — not monthly download/bandwidth.</li>
          <li>Free-tier (Spark) limits shown are references; your exact plan limits and bandwidth are on the Firebase Console → Usage tab.</li>
          <li>Images uploaded through the older BTS uploader are stored inside the database as data, so they count toward the Database figure, not Storage.</li>
        </ul>
        <a href="https://console.firebase.google.com/project/muad-web/usage" target="_blank" rel="noopener noreferrer" style={{ display: "inline-block", marginTop: 14, fontSize: 14, color: AC, textDecoration: "none", fontWeight: 600 }}>Open Firebase Console → Usage ›</a>
      </div>
    </div>
  );
};

const AdminSidebar = ({ active, onLogout, data, theme, onToggleTheme }) => {
  const unread = (data?.messages || []).filter(m => !m.read).length;
  const items = [
    ["dashboard","📊","Dashboard", 0],
    ["games","🎮","Projects", 0],
    ["showcase-admin","🎨","Showcase", 0],
    ["blog","📝","Blog", 0],
    ["bts-admin","🖼️","Behind the Scenes", 0],
    ["messages","✉️","Messages", unread],
    ["analytics","📈","Analytics", 0],
    ["media","🗂️","Media Library", 0],
    ["firebase","🔥","Firebase Usage", 0],
    ["settings","⚙️","Settings", 0],
  ];
  return (
    <div style={{ position: "fixed", left: 0, top: 0, bottom: 0, width: 240, background: BG3, borderRight: `0.5px solid ${BORDER}`, display: "flex", flexDirection: "column", zIndex: 150, overflowY: "auto" }}>
      <div style={{ padding: "18px 20px", borderBottom: `0.5px solid ${BORDER}` }}>
        <div onClick={() => nav("#/")} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
          <BrandLogo logoImg={data?.settings?.logoImg} size={28} radius={8} fontSize={15} />
          <span style={{ fontFamily: FONTD, fontWeight: 700, fontSize: 18, color: TX }}>Admin</span>
        </div>
      </div>
      <div style={{ flex: 1, padding: "12px 0" }}>
        {items.map(([id, icon, label, badge]) => (
          <div key={id} onClick={() => nav(`#/admin/${id}`)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 20px", cursor: "pointer", background: active === id ? `${AC}12` : "transparent", color: active === id ? AC : TX2, fontSize: 14, fontWeight: active === id ? 600 : 400, margin: "2px 8px", borderRadius: 8, transition: "all 0.2s", position: "relative" }}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            <span style={{ flex: 1 }}>{label}</span>
            {badge > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <div style={{ width: 7, height: 7, borderRadius: "50%", background: AC, animation: "pulse 1.5s infinite" }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: AC, background: `${AC}15`, padding: "2px 7px", borderRadius: 980 }}>{badge}</span>
              </div>
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: "16px 20px", borderTop: `0.5px solid ${BORDER}`, display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={onToggleTheme} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: TX2, cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>{theme === "dark" ? "☀️ Light mode" : "🌙 Dark mode"}</button>
        <button onClick={onLogout} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: TX2, cursor: "pointer", fontSize: 14 }}>Sign Out</button>
      </div>
    </div>
  );
};

const AdminWrap = ({ active, children, onLogout, data, theme, onToggleTheme }) => (
  <div style={{ display: "flex", minHeight: "100vh", background: BG2 }}>
    <style>{`
      @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.5)}}
      @media(max-width:768px){
        .admin-sidebar{display:none!important}
        .admin-content{margin-left:0!important;padding:16px!important}
        .admin-mobile-bar{display:flex!important}
      }
      .admin-mobile-bar{display:none;position:fixed;top:0;left:0;right:0;height:52px;background:var(--nav-bg-solid);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:0.5px solid var(--border-c);align-items:center;justify-content:space-between;padding:0 16px;z-index:200}
    `}</style>
    <div className="admin-mobile-bar">
      <div onClick={() => nav("#/")} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
        <BrandLogo logoImg={data?.settings?.logoImg} size={24} radius={7} fontSize={13} />
        <span style={{ fontFamily: FONTD, fontWeight: 700, fontSize: 17, color: TX }}>Admin</span>
      </div>
      <div style={{ display: "flex", gap: 4, overflowX: "auto", alignItems: "center" }}>
        {[["dashboard","📊"],["games","🎮"],["showcase-admin","🎨"],["messages","✉️"],["analytics","📈"],["firebase","🔥"],["settings","⚙️"]].map(([id, icon]) => (
          <button key={id} onClick={() => nav(`#/admin/${id}`)} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: active === id ? `${AC}15` : "transparent", color: active === id ? AC : TX2, fontSize: 16, cursor: "pointer", flexShrink: 0 }}>{icon}</button>
        ))}
        <ThemeToggle theme={theme} onToggle={onToggleTheme} style={{ flexShrink: 0 }} />
        <button onClick={onLogout} style={{ padding: "6px 10px", borderRadius: 8, border: "none", background: "transparent", color: TX2, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>Out</button>
      </div>
    </div>
    <div className="admin-sidebar"><AdminSidebar active={active} onLogout={onLogout} data={data} theme={theme} onToggleTheme={onToggleTheme} /></div>
    <div className="admin-content" style={{ marginLeft: 240, flex: 1, padding: "32px 40px 60px", minWidth: 0, paddingTop: 32 }}>{children}</div>
  </div>
);

const AdminDash = ({ data }) => {
  const cards = [["🎮","Projects",data.games.length,`${data.games.filter(g=>g.status==="published").length} published`],["📝","Posts",data.posts.length,`${data.posts.filter(p=>p.status==="published").length} published`],["🖼️","BTS Items",data.bts.length,"in gallery"],["✉️","Messages",data.messages.length,`${data.messages.filter(m=>!m.read).length} unread`]];
  return (<div>
    <h1 style={{ fontFamily: FONTD, fontSize: 32, fontWeight: 700, color: TX, margin: "0 0 32px" }}>Overview</h1>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 40 }}>
      {cards.map(([icon, label, val, sub]) => (
        <div key={label} style={{ background: CARDBG, borderRadius: 16, padding: 24, boxShadow: SHADOW }}>
          <span style={{ fontSize: 24 }}>{icon}</span>
          <div style={{ fontFamily: FONTD, fontSize: 36, fontWeight: 700, color: TX, margin: "8px 0 2px" }}>{val}</div>
          <div style={{ fontSize: 15, color: TX2 }}>{label}</div>
          <div style={{ fontSize: 13, color: AC, marginTop: 4 }}>{sub}</div>
        </div>
      ))}
    </div>
    <h3 style={{ fontSize: 15, fontWeight: 600, color: TX, margin: "0 0 12px" }}>Quick actions</h3>
    <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
      <AppleBtn primary small onClick={() => nav("#/admin/games")}>Manage Projects</AppleBtn>
      <AppleBtn primary small onClick={() => nav("#/admin/blog")}>Manage Blog</AppleBtn>
      <AppleBtn primary small onClick={() => nav("#/admin/bts-admin")}>Manage BTS</AppleBtn>
      <AppleBtn small onClick={() => nav("#/admin/messages")}>View Messages</AppleBtn>
    </div>
  </div>);
};

const LinksEditor = ({ links, onChange }) => {
  const list = links || [];
  const update = (i, key, val) => { const a = [...list]; a[i] = { ...a[i], [key]: val }; onChange(a); };
  const remove = (i) => onChange(list.filter((_, j) => j !== i));
  const add = () => onChange([...list, { id: `${Date.now()}_${Math.random().toString(36).slice(2,5)}`, label: "", url: "" }]);
  const field = { padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, background: BG2, color: TX, fontSize: 14, outline: "none", fontFamily: FONT, boxSizing: "border-box" };
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 6 }}>External Links</label>
      <div style={{ fontSize: 12, color: TX3, marginBottom: 10 }}>GitHub, Hugging Face, Live Demo, Play Store, npm… Paste the URL and the icon auto-detects. Leave the label blank to auto-name it.</div>
      {list.map((l, i) => {
        const m = linkMeta(l.url, "");
        return (
          <div key={l.id || i} style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <span style={{ width: 34, height: 34, borderRadius: 9, background: BG2, display: "inline-flex", alignItems: "center", justifyContent: "center", color: TX2, flexShrink: 0 }}><LinkGlyph kind={m.kind} size={16} /></span>
            <input value={l.label} onChange={e => update(i, "label", e.target.value)} placeholder={m.label} style={{ ...field, width: 120, flexShrink: 0 }} />
            <input value={l.url} onChange={e => update(i, "url", e.target.value)} placeholder="https://..." style={{ ...field, flex: 1, minWidth: 0 }} />
            <button onClick={() => remove(i)} style={{ padding: "8px 11px", borderRadius: 8, border: "none", background: "#ff3b3012", color: "#ff3b30", fontSize: 13, cursor: "pointer", flexShrink: 0 }}>✕</button>
          </div>
        );
      })}
      <button onClick={add} style={{ width: "100%", padding: "9px", borderRadius: 10, border: `1px dashed ${BORDER}`, background: "transparent", color: AC, fontSize: 13, cursor: "pointer", fontFamily: FONT, fontWeight: 600, marginTop: 2 }}>+ Add link</button>
    </div>
  );
};

const PROJECT_CATEGORIES = ["Games", "Applications", "AI / ML", "Websites", "Tools", "Open Source", "Other"];

const AdminGames = ({ data, save }) => {
  const [editing, setEditing] = useState(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonMsg, setJsonMsg] = useState(null);
  const blank = { id: "", title: "", category: "Games", tagline: "", description: "", engine: "", genre: "", platform: "", teamSize: "Solo", year: "2025", devTime: "", techStack: [], links: [], bannerImg: "", cardImages: [], cardGif: "", screenshots: [], trailerUrl: "", btsImages: [], playUrl: "", downloadUrl: "", downloads: 0, plays: 0, status: "draft", color: "#0071e3", showStats: true, repoRole: "", showRepoCard: true, customSections: [] };
  const importJson = () => {
    try {
      const j = JSON.parse(jsonText.trim());
      const ns = normalizeSections(j.customSections);
      setEditing(p => ({
        ...p,
        title: j.title ?? p.title,
        category: typeof j.category === "string" && j.category ? j.category : p.category,
        tagline: j.tagline ?? p.tagline,
        description: j.description ?? p.description,
        engine: typeof j.engine === "string" ? j.engine : p.engine,
        genre: j.genre ?? p.genre,
        platform: j.platform ?? p.platform,
        teamSize: j.teamSize ?? p.teamSize,
        year: j.year != null ? String(j.year) : p.year,
        devTime: j.devTime ?? p.devTime,
        techStack: Array.isArray(j.techStack) ? j.techStack.filter(x => typeof x === "string") : p.techStack,
        links: Array.isArray(j.links) ? j.links.filter(l => l && typeof l.url === "string").map((l, i) => ({ id: l.id || `${Date.now()}_${i}`, label: typeof l.label === "string" ? l.label : "", url: l.url })) : p.links,
        playUrl: j.playUrl ?? p.playUrl,
        downloadUrl: j.downloadUrl ?? p.downloadUrl,
        trailerUrl: j.trailerUrl ?? p.trailerUrl,
        downloads: j.downloads != null ? (parseInt(j.downloads) || 0) : p.downloads,
        plays: j.plays != null ? (parseInt(j.plays) || 0) : p.plays,
        color: typeof j.color === "string" && j.color ? j.color : p.color,
        status: j.status === "published" ? "published" : p.status,
        bannerImg: typeof j.bannerImg === "string" ? j.bannerImg : p.bannerImg,
        cardGif: typeof j.cardGif === "string" ? j.cardGif : p.cardGif,
        cardImages: Array.isArray(j.cardImages) ? j.cardImages.filter(x => typeof x === "string") : p.cardImages,
        screenshots: Array.isArray(j.screenshots) ? j.screenshots.filter(x => typeof x === "string") : p.screenshots,
        btsImages: Array.isArray(j.btsImages) ? j.btsImages.filter(x => typeof x === "string") : p.btsImages,
        showStats: typeof j.showStats === "boolean" ? j.showStats : p.showStats,
        repoRole: j.repoRole ?? p.repoRole,
        showRepoCard: typeof j.showRepoCard === "boolean" ? j.showRepoCard : p.showRepoCard,
        customSections: ns !== null ? ns : p.customSections,
      }));
      setJsonMsg({ ok: true, text: "Imported — fields below are filled. Review them, then click Save Project." });
      setJsonText("");
    } catch {
      setJsonMsg({ ok: false, text: "Invalid JSON — check for a missing quote, comma or bracket." });
    }
  };
  const saveGame = (g) => { const exists = data.games.find(x => x.id === g.id); save({ ...data, games: exists ? data.games.map(x => x.id === g.id ? g : x) : [...data.games, g] }); setEditing(null); };
  const del = (id) => save({ ...data, games: data.games.filter(g => g.id !== id) });
  if (editing) {
    const g = editing; const u = (k, v) => setEditing(p => ({ ...p, [k]: v }));
    return (<div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <h1 style={{ fontFamily: FONTD, fontSize: 28, fontWeight: 700, color: TX, margin: 0 }}>{g.title ? `Edit: ${g.title}` : "New Project"}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setEditing(null)} style={{ padding: "9px 20px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: TX2, fontSize: 14, cursor: "pointer" }}>Cancel</button>
          <AppleBtn primary small onClick={() => saveGame(g)}>Save Project</AppleBtn>
        </div>
      </div>
      <JsonQuickFill value={jsonText} onChange={setJsonText} onFill={importJson} onClear={() => { setJsonText(""); setJsonMsg(null); }} msg={jsonMsg} saveLabel="Save Project" keysHint="title, category, tagline, description, techStack[], links[] (each {label, url}), engine, genre, platform, teamSize, year, devTime, playUrl, downloadUrl, trailerUrl, downloads, plays, color, status, customSections[]" placeholder={'{\n  "title": "AI Parking Detection",\n  "category": "AI / ML",\n  "tagline": "Spotting free spaces from the sky.",\n  "description": "A YOLOv8 model detecting parking from top-down imagery.",\n  "techStack": ["Python", "YOLOv8", "Azure"],\n  "links": [\n    { "label": "GitHub", "url": "https://github.com/muad500/..." },\n    { "url": "https://huggingface.co/syedmuad/..." }\n  ],\n  "status": "published"\n}'} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
        <div style={{ background: CARDBG, borderRadius: 16, padding: 28, boxShadow: SHADOW }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: AC, margin: "0 0 20px", textTransform: "uppercase" }}>Basic Info</h3>
          <Input label="Title" value={g.title} onChange={v => u("title", v)} placeholder="Project title" />
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 6 }}>Category</label>
            <select value={PROJECT_CATEGORIES.includes(g.category) ? g.category : (g.category ? "__custom" : "Games")} onChange={e => { const v = e.target.value; u("category", v === "__custom" ? "" : v); }} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${BORDER}`, background: BG2, color: TX, fontSize: 15, fontFamily: FONT }}>
              {PROJECT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__custom">Custom…</option>
            </select>
            {!PROJECT_CATEGORIES.includes(g.category) && (
              <input value={g.category} onChange={e => u("category", e.target.value)} placeholder="Custom category name" style={{ width: "100%", marginTop: 8, padding: "12px 16px", borderRadius: 12, border: `1px solid ${BORDER}`, background: BG2, color: TX, fontSize: 15, outline: "none", fontFamily: FONT, boxSizing: "border-box" }} />
            )}
            <div style={{ fontSize: 12, color: TX3, marginTop: 6 }}>This drives the homepage filter and the navbar “Projects” dropdown.</div>
          </div>
          <Input label="Tagline" value={g.tagline} onChange={v => u("tagline", v)} placeholder="One-liner pitch" />
          <Input label="Short Description" value={g.description} onChange={v => u("description", v)} textarea rows={3} placeholder="Brief description shown on the project card..." />
          <SectionBuilder sections={g.customSections || []} onChange={v => u("customSections", v)} />
        </div>
        <div style={{ background: CARDBG, borderRadius: 16, padding: 28, boxShadow: SHADOW }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: AC, margin: "0 0 6px", textTransform: "uppercase" }}>Details</h3>
          <div style={{ fontSize: 12, color: TX3, marginBottom: 18 }}>Engine, plays & downloads are optional — fill them for games, leave blank for apps/AI.</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 16px" }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 6 }}>Engine (optional)</label>
              <select value={g.engine || ""} onChange={e => u("engine", e.target.value)} style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${BORDER}`, background: BG2, color: TX, fontSize: 15, fontFamily: FONT }}>
                {["", "Unity","Unreal","Godot","Custom","Other"].map(e => <option key={e} value={e}>{e === "" ? "— none —" : e}</option>)}
              </select>
            </div>
            <Input label="Genre" value={g.genre} onChange={v => u("genre", v)} />
            <Input label="Platform" value={g.platform} onChange={v => u("platform", v)} />
            <Input label="Team Size" value={g.teamSize} onChange={v => u("teamSize", v)} />
            <Input label="Year" value={g.year} onChange={v => u("year", v)} />
            <Input label="Dev Time" value={g.devTime} onChange={v => u("devTime", v)} />
            <Input label="Downloads" value={String(g.downloads)} onChange={v => u("downloads", parseInt(v)||0)} type="number" />
            <Input label="Plays" value={String(g.plays)} onChange={v => u("plays", parseInt(v)||0)} type="number" />
          </div>
          <TagInput label="Tech Stack" tags={g.techStack} onChange={v => u("techStack", v)} />
          <Input label="Accent Color" value={g.color} onChange={v => u("color", v)} type="color" />
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 8 }}>Status</label>
            <div style={{ display: "flex", gap: 8 }}>
              {["draft","published"].map(s => <button key={s} onClick={() => u("status", s)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${g.status===s?(s==="published"?"#30d158":"#ff9500"):BORDER}`, background: g.status===s?(s==="published"?"#30d15812":"#ff950012"):"transparent", color: g.status===s?(s==="published"?"#30d158":"#ff9500"):TX2, fontSize: 14, cursor: "pointer", textTransform: "capitalize" }}>{s}</button>)}
            </div>
          </div>
          <div style={{ marginBottom: 0 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 8 }}>Stats bar (Dev Time / Team / Downloads / Plays on the detail page)</label>
            <div style={{ display: "flex", gap: 8 }}>
              {[["show","Show"],["hide","Hide"]].map(([val,lab]) => { const on = (val === "show") === (g.showStats !== false); return <button key={val} onClick={() => u("showStats", val === "show")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${on ? AC : BORDER}`, background: on ? `${AC}12` : "transparent", color: on ? AC : TX2, fontSize: 14, cursor: "pointer" }}>{lab}</button>; })}
            </div>
            <div style={{ fontSize: 12, color: TX3, marginTop: 6 }}>Hide it for apps / AI projects where play counts don't apply.</div>
          </div>
        </div>
        <div style={{ background: CARDBG, borderRadius: 16, padding: 28, boxShadow: SHADOW }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: AC, margin: "0 0 20px", textTransform: "uppercase" }}>Links, Repos & Media</h3>
          <LinksEditor links={g.links || []} onChange={v => u("links", v)} />
          {(g.links || []).some(l => l.url && /github\.com/i.test(l.url)) && (
            <div style={{ marginBottom: 20, padding: 14, borderRadius: 12, background: BG2 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: TX, marginBottom: 6 }}>GitHub repo card</div>
              <div style={{ fontSize: 12, color: TX3, marginBottom: 12 }}>A live card (stars, language, description) auto-shows on the detail page whenever a GitHub link is added above.</div>
              <Input label="Your role on this repo (optional badge — e.g. Contributor, Team project)" value={g.repoRole || ""} onChange={v => u("repoRole", v)} placeholder="Leave blank if it's solely yours" />
              <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 8 }}>Show the repo card</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[["show","Show"],["hide","Hide"]].map(([val,lab]) => { const on = (val === "show") === (g.showRepoCard !== false); return <button key={val} onClick={() => u("showRepoCard", val === "show")} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${on ? AC : BORDER}`, background: on ? `${AC}12` : "transparent", color: on ? AC : TX2, fontSize: 14, cursor: "pointer" }}>{lab}</button>; })}
              </div>
            </div>
          )}
          <Input label="Play / Live URL (optional — shows a primary button)" value={g.playUrl} onChange={v => u("playUrl", v)} placeholder="https://..." />
          <Input label="Download URL (optional)" value={g.downloadUrl} onChange={v => u("downloadUrl", v)} placeholder="https://..." />
          <Input label="Trailer URL (optional)" value={g.trailerUrl} onChange={v => u("trailerUrl", v)} placeholder="https://youtube.com/..." />
          <ImgUpload label="Banner Image (detail page hero)" value={g.bannerImg} onChange={v => u("bannerImg", v)} />
          <ImgUpload label="Card Thumbnail Images (rotate on homepage card)" value={g.cardImages || []} onChange={v => typeof v === "function" ? u("cardImages", v(g.cardImages || [])) : u("cardImages", v)} multi />
          <ImgUpload label="Card GIF (overrides thumbnails on homepage card)" value={g.cardGif || ""} onChange={v => u("cardGif", v)} />
          <ImgUpload label="Screenshots (gallery on detail page)" value={g.screenshots} onChange={v => typeof v === "function" ? u("screenshots", v(g.screenshots)) : u("screenshots", v)} multi />
          <ImgUpload label="BTS Images" value={g.btsImages} onChange={v => typeof v === "function" ? u("btsImages", v(g.btsImages)) : u("btsImages", v)} multi />
        </div>
      </div>
    </div>);
  }
  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
      <h1 style={{ fontFamily: FONTD, fontSize: 32, fontWeight: 700, color: TX, margin: 0 }}>Projects</h1>
      <AppleBtn primary small onClick={() => { setJsonText(""); setJsonMsg(null); setEditing({ ...blank, id: Date.now().toString() }); }}>+ Add Project</AppleBtn>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.games.map(g => (
        <div key={g.id} style={{ display: "flex", alignItems: "center", gap: 16, background: CARDBG, borderRadius: 14, padding: "14px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flexWrap: "wrap" }}>
          <div style={{ width: 52, height: 52, borderRadius: 12, background: g.bannerImg ? `url(${g.bannerImg}) center/cover` : `linear-gradient(145deg,${g.color}20,${BG2})`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{!g.bannerImg && ((g.category || "Games") === "Games" ? "🎮" : "🧩")}</div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ color: TX, fontWeight: 600, fontSize: 16 }}>{g.title}</div>
            <div style={{ color: TX2, fontSize: 13, marginTop: 2 }}>{[g.category || "Games", g.engine || g.genre, g.year].filter(Boolean).join(" · ")}</div>
          </div>
          <span style={{ padding: "4px 12px", borderRadius: 980, fontSize: 12, fontWeight: 500, background: g.status==="published"?"#30d15818":"#ff950018", color: g.status==="published"?"#30d158":"#ff9500" }}>{g.status}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { window.location.hash = `#/games/${g.id}`; }} style={{ padding: "7px 14px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: TX2, fontSize: 13, cursor: "pointer" }}>View</button>
            <button onClick={() => { setJsonText(""); setJsonMsg(null); setEditing({ ...g }); }} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: AC, color: "#fff", fontSize: 13, cursor: "pointer" }}>Edit</button>
            <button onClick={() => del(g.id)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#ff3b3012", color: "#ff3b30", fontSize: 13, cursor: "pointer" }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  </div>);
};

const AdminBlog = ({ data, save }) => {
  const [editing, setEditing] = useState(null);
  const [jsonText, setJsonText] = useState("");
  const [jsonMsg, setJsonMsg] = useState(null);
  const blank = { id: "", title: "", date: new Date().toISOString().split("T")[0], excerpt: "", content: "", thumbnail: "", status: "draft", customSections: [] };
  const importJson = () => {
    try {
      const parsed = JSON.parse(jsonText.trim());
      setEditing(p => ({
        ...p,
        title: parsed.title ?? p.title,
        date: parsed.date ?? p.date,
        excerpt: parsed.excerpt ?? p.excerpt,
        content: parsed.content ?? p.content,
        status: parsed.status === "published" ? "published" : p.status,
        customSections: Array.isArray(parsed.customSections)
          ? parsed.customSections.map((s, i) => ({
              id: s.id || `${Date.now()}_${i}`,
              type: s.type === "collaborator" ? "collaborator" : "text",
              title: s.title || "",
              text: s.text || "",
              images: Array.isArray(s.images) ? s.images : [],
              gif: s.gif || "",
              collabName: s.collabName || "", collabRole: s.collabRole || "",
              collabBio: s.collabBio || "", collabAvatar: s.collabAvatar || "", collabLink: s.collabLink || "",
            }))
          : p.customSections,
      }));
      setJsonMsg({ ok: true, text: "Imported — fields below are filled. Review them, then click Save Post." });
      setJsonText("");
    } catch {
      setJsonMsg({ ok: false, text: "Invalid JSON — check for a missing quote, comma or bracket." });
    }
  };
  const savePost = (p) => { const exists = data.posts.find(x => x.id === p.id); save({ ...data, posts: exists ? data.posts.map(x => x.id === p.id ? p : x) : [...data.posts, p] }); setEditing(null); };
  const del = (id) => save({ ...data, posts: data.posts.filter(p => p.id !== id) });
  if (editing) {
    const p = editing; const u = (k, v) => setEditing(prev => ({ ...prev, [k]: v }));
    return (<div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12 }}>
        <h1 style={{ fontFamily: FONTD, fontSize: 28, fontWeight: 700, color: TX, margin: 0 }}>{p.title ? "Edit Post" : "New Post"}</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setEditing(null)} style={{ padding: "9px 20px", borderRadius: 10, border: `1px solid ${BORDER}`, background: "transparent", color: TX2, fontSize: 14, cursor: "pointer" }}>Cancel</button>
          <AppleBtn primary small onClick={() => savePost(p)}>Save Post</AppleBtn>
        </div>
      </div>
      <div style={{ background: CARDBG, borderRadius: 16, padding: 28, boxShadow: SHADOW, maxWidth: 640 }}>
        <div style={{ marginBottom: 20, padding: 16, borderRadius: 14, background: BG2, border: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: TX }}>⚡ Quick-fill from JSON</div>
          </div>
          <p style={{ fontSize: 12, color: TX2, lineHeight: 1.6, margin: "0 0 12px" }}>
            Paste JSON (e.g. generated by ChatGPT) to auto-fill the fields below. Keys: title, date, excerpt, content, status, customSections. Nothing saves until you click Save Post.
          </p>
          <textarea value={jsonText} onChange={e => setJsonText(e.target.value)} rows={6} placeholder={'{\n  "title": "My Post",\n  "excerpt": "Short summary...",\n  "content": "Full article...",\n  "customSections": [\n    { "type": "text", "title": "The Story", "text": "..." }\n  ]\n}'} style={{ width: "100%", padding: "12px 14px", borderRadius: 10, border: `1px solid ${BORDER}`, background: BG2, color: TX, fontSize: 13, fontFamily: "monospace", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
          {jsonMsg && <div style={{ marginTop: 10, fontSize: 13, color: jsonMsg.ok ? "#30d158" : "#ff3b30" }}>{jsonMsg.text}</div>}
          <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
            <AppleBtn primary small onClick={importJson}>Fill fields</AppleBtn>
            <button onClick={() => { setJsonText(""); setJsonMsg(null); }} style={{ padding: "9px 18px", borderRadius: 980, border: `1px solid ${BORDER}`, background: "transparent", color: TX2, fontSize: 14, cursor: "pointer", fontFamily: FONT }}>Clear</button>
          </div>
        </div>
        <Input label="Title" value={p.title} onChange={v => u("title", v)} placeholder="Post title..." />
        <Input label="Date" value={p.date} onChange={v => u("date", v)} type="date" />
        <Input label="Excerpt" value={p.excerpt} onChange={v => u("excerpt", v)} textarea rows={2} placeholder="Short summary..." />
        <Input label="Content" value={p.content} onChange={v => u("content", v)} textarea rows={10} placeholder="Full article content..." />
        <ImgUpload label="Thumbnail" value={p.thumbnail} onChange={v => u("thumbnail", v)} />
        <div style={{ marginTop: 8, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
          <SectionBuilder sections={p.customSections || []} onChange={v => u("customSections", v)} />
        </div>
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 8 }}>Status</label>
        <div style={{ display: "flex", gap: 8 }}>
          {["draft","published"].map(s => <button key={s} onClick={() => u("status", s)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${p.status===s?AC:BORDER}`, background: p.status===s?`${AC}12`:"transparent", color: p.status===s?AC:TX2, fontSize: 14, cursor: "pointer", textTransform: "capitalize" }}>{s}</button>)}
        </div>
      </div>
    </div>);
  }
  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, gap: 12 }}>
      <h1 style={{ fontFamily: FONTD, fontSize: 32, fontWeight: 700, color: TX, margin: 0 }}>Blog Posts</h1>
      <AppleBtn primary small onClick={() => { setJsonText(""); setJsonMsg(null); setEditing({ ...blank, id: Date.now().toString() }); }}>+ Add Post</AppleBtn>
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {data.posts.map(p => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 16, background: CARDBG, borderRadius: 14, padding: "14px 20px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)", flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ color: TX, fontWeight: 600, fontSize: 16 }}>{p.title}</div>
            <div style={{ color: TX2, fontSize: 13, marginTop: 2 }}>{p.date} · {p.excerpt?.substring(0, 60)}{p.excerpt?.length > 60 ? "..." : ""}</div>
          </div>
          <span style={{ padding: "4px 12px", borderRadius: 980, fontSize: 12, fontWeight: 500, background: p.status==="published"?"#30d15818":"#ff950018", color: p.status==="published"?"#30d158":"#ff9500" }}>{p.status}</span>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => { setJsonText(""); setJsonMsg(null); setEditing({ ...p }); }} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: AC, color: "#fff", fontSize: 13, cursor: "pointer" }}>Edit</button>
            <button onClick={() => del(p.id)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "#ff3b3012", color: "#ff3b30", fontSize: 13, cursor: "pointer" }}>Delete</button>
          </div>
        </div>
      ))}
    </div>
  </div>);
};

// ── AdminBTS ───────────────────────────────────────────────────────────────
const AdminBTS = ({ data, save }) => {
  const [caption, setCaption] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editCaption, setEditCaption] = useState("");
  const addImage = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const newItem = { id: Date.now().toString(), url: reader.result, caption: caption.trim() || "Untitled" };
      save({ ...data, bts: [...data.bts, newItem] });
      setCaption("");
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };
  const deleteItem = (id) => save({ ...data, bts: data.bts.filter(b => b.id !== id) });
  const startEdit = (item) => { setEditingId(item.id); setEditCaption(item.caption); };
  const saveEdit = (id) => { save({ ...data, bts: data.bts.map(b => b.id === id ? { ...b, caption: editCaption } : b) }); setEditingId(null); };
  return (
    <div>
      <h1 style={{ fontFamily: FONTD, fontSize: 32, fontWeight: 700, color: TX, margin: "0 0 8px" }}>Behind the Scenes</h1>
      <p style={{ color: TX2, fontSize: 15, margin: "0 0 28px" }}>These images appear in the BTS gallery on your portfolio's public page.</p>
      <div style={{ background: CARDBG, borderRadius: 16, padding: 28, boxShadow: SHADOW, maxWidth: 480, marginBottom: 32 }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: AC, margin: "0 0 16px", textTransform: "uppercase", letterSpacing: 0.5 }}>Upload new image</h3>
        <Input label="Caption" value={caption} onChange={setCaption} placeholder="e.g. Early prototype sketch..." />
        <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, height: 72, borderRadius: 12, border: `2px dashed ${BORDER}`, background: BG2, cursor: "pointer", color: TX2, fontSize: 15, fontWeight: 500, transition: "border-color 0.2s" }} onMouseEnter={e => e.currentTarget.style.borderColor = AC} onMouseLeave={e => e.currentTarget.style.borderColor = BORDER}>
          <span style={{ fontSize: 20 }}>🖼️</span> Choose image to upload
          <input type="file" accept="image/*" onChange={addImage} style={{ display: "none" }} />
        </label>
      </div>
      {data.bts.length === 0 ? (
        <div style={{ background: CARDBG, borderRadius: 16, padding: "56px 32px", boxShadow: SHADOW, textAlign: "center" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🖼️</div>
          <p style={{ color: TX2, fontSize: 17, margin: 0 }}>No BTS images yet — upload one above to get started.</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 13, color: TX3, marginBottom: 12 }}>{data.bts.length} image{data.bts.length !== 1 ? "s" : ""} in gallery</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 16 }}>
            {data.bts.map(item => (
              <div key={item.id} style={{ background: CARDBG, borderRadius: 16, overflow: "hidden", boxShadow: SHADOW, transition: "box-shadow 0.3s" }} onMouseEnter={e => e.currentTarget.style.boxShadow = SHADOW2} onMouseLeave={e => e.currentTarget.style.boxShadow = SHADOW}>
                <div style={{ height: 160, background: item.url ? `url(${item.url}) center/cover` : `linear-gradient(145deg, ${BG2}, ${BG4})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {!item.url && <span style={{ fontSize: 32, opacity: 0.2 }}>🖼️</span>}
                </div>
                <div style={{ padding: "14px 16px" }}>
                  {editingId === item.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input value={editCaption} onChange={e => setEditCaption(e.target.value)} onKeyDown={e => e.key === "Enter" && saveEdit(item.id)} autoFocus style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${AC}`, background: BG2, color: TX, fontSize: 13, outline: "none", fontFamily: FONT }} />
                      <button onClick={() => saveEdit(item.id)} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: AC, color: "#fff", fontSize: 12, cursor: "pointer", fontWeight: 600 }}>✓</button>
                      <button onClick={() => setEditingId(null)} style={{ padding: "8px 12px", borderRadius: 8, border: `1px solid ${BORDER}`, background: "transparent", color: TX2, fontSize: 12, cursor: "pointer" }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <p style={{ color: TX, fontSize: 13, fontWeight: 500, margin: 0, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.caption}</p>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        <button onClick={() => startEdit(item)} style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: `${AC}12`, color: AC, fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Edit</button>
                        <button onClick={() => deleteItem(item.id)} style={{ padding: "5px 10px", borderRadius: 7, border: "none", background: "#ff3b3012", color: "#ff3b30", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>Del</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const AdminMessages = ({ data, save }) => {
  const [sel, setSel] = useState(null);
  const unread = data.messages.filter(m => !m.read).length;
  const markRead = async (id) => {
    const updated = data.messages.map(m => m.id === id ? { ...m, read: true, seen: true } : m);
    try { await set(ref(db, `messages/${id}`), updated.find(x => x.id === id)); } catch {}
    save({ ...data, messages: updated });
  };
  const del = async (id) => {
    try { await set(ref(db, `messages/${id}`), null); } catch {}
    save({ ...data, messages: data.messages.filter(m => m.id !== id) });
    setSel(null);
  };
  const getStatus = (m) => {
    if (!m.read && !m.seen) return { label: "NEW", color: AC, pulse: true };
    if (!m.read) return { label: "SEEN", color: "#ff9500", pulse: false };
    return { label: "READ", color: "#30d158", pulse: false };
  };
  return (
    <div>
      <style>{`@keyframes pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.4)} }`}</style>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <h1 style={{ fontFamily: FONTD, fontSize: 32, fontWeight: 700, color: TX, margin: 0 }}>Messages</h1>
        {unread > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: `${AC}12`, padding: "6px 14px", borderRadius: 980 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: AC, animation: "pulse 1.5s infinite" }} />
            <span style={{ fontSize: 13, color: AC, fontWeight: 600 }}>{unread} new message{unread > 1 ? "s" : ""}</span>
          </div>
        )}
      </div>
      {data.messages.length === 0
        ? <div style={{ background: CARDBG, borderRadius: 16, padding: 48, textAlign: "center", boxShadow: SHADOW }}><p style={{ color: TX2 }}>No messages yet.</p></div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...data.messages].reverse().map(m => {
              const status = getStatus(m);
              return (
                <div key={m.id} onClick={() => { setSel(m); markRead(m.id); }} style={{ display: "flex", alignItems: "center", gap: 14, background: m.read ? CARDBG : `${AC}06`, borderRadius: 14, padding: "16px 20px", boxShadow: m.read ? "0 1px 4px rgba(0,0,0,0.04)" : `0 2px 12px ${AC}15`, cursor: "pointer", border: m.read ? "1px solid transparent" : `1px solid ${AC}20`, transition: "all 0.3s" }}>
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: status.color, animation: status.pulse ? "pulse 1.5s infinite" : "none" }} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{ color: TX, fontWeight: m.read ? 500 : 700, fontSize: 15 }}>{m.name}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, color: status.color, background: status.color + "18", padding: "2px 8px", borderRadius: 980, letterSpacing: 0.5 }}>{status.label}</span>
                    </div>
                    <div style={{ color: TX2, fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.message}</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6, flexShrink: 0 }}>
                    <div style={{ color: TX3, fontSize: 11 }}>{new Date(m.date).toLocaleDateString()}</div>
                    <button onClick={e => { e.stopPropagation(); del(m.id); }} style={{ padding: "4px 10px", borderRadius: 7, border: "none", background: "#ff3b3012", color: "#ff3b30", fontSize: 11, cursor: "pointer", fontWeight: 500 }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>}
      {sel && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 300, padding: 24 }} onClick={() => setSel(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: CARDBG, borderRadius: 24, padding: 40, maxWidth: 500, width: "100%", boxShadow: "0 24px 80px rgba(0,0,0,0.25)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: `${AC}15`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONTD, fontWeight: 700, fontSize: 18, color: AC }}>{sel.name?.[0]?.toUpperCase()}</div>
              <div>
                <h3 style={{ fontFamily: FONTD, fontSize: 18, fontWeight: 700, color: TX, margin: 0 }}>{sel.name}</h3>
                <p style={{ color: AC, fontSize: 13, margin: 0 }}>{sel.email}</p>
              </div>
            </div>
            <div style={{ background: BG2, borderRadius: 16, padding: 20, marginBottom: 16 }}>
              <p style={{ color: TX, fontSize: 15, lineHeight: 1.7, margin: 0 }}>{sel.message}</p>
            </div>
            <p style={{ color: TX3, fontSize: 12, marginBottom: 24 }}>Received: {new Date(sel.date).toLocaleString()}</p>
            <div style={{ display: "flex", gap: 8 }}>
              <AppleBtn primary small onClick={() => setSel(null)}>Close</AppleBtn>
              <a href={`mailto:${sel.email}`} style={{ textDecoration: "none" }}><AppleBtn small onClick={() => {}}>Reply by email ›</AppleBtn></a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SOCIAL_NAME_OPTIONS = ["GitHub", "LinkedIn", "Hugging Face", "itch.io", "YouTube", "Discord", "Twitter / X", "Twitch", "Custom"];

const SocialRow = ({ soc, i, count, update, remove, move }) => {
  const known = SOCIAL_NAME_OPTIONS.includes(soc.name) && soc.name !== "Custom";
  const selectVal = known ? soc.name : "Custom";
  const [showIcon, setShowIcon] = useState(!!soc.icon);
  const mini = { padding: "5px 9px", borderRadius: 7, border: "none", background: CARDBG, color: TX2, fontSize: 12, cursor: "pointer" };
  const field = { width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, background: CARDBG, color: TX, fontSize: 14, outline: "none", fontFamily: FONT, boxSizing: "border-box" };
  return (
    <div style={{ background: BG2, borderRadius: 14, padding: 14, marginBottom: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 9, background: CARDBG, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: TX2 }}>
          <SocialIcon name={soc.name} customIcon={soc.icon} size={18} />
        </div>
        <select value={selectVal} onChange={e => { const v = e.target.value; update(i, "name", v === "Custom" ? "" : v); }} style={{ padding: "9px 12px", borderRadius: 10, border: `1px solid ${BORDER}`, background: CARDBG, color: TX, fontSize: 14, fontFamily: FONT }}>
          {SOCIAL_NAME_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <div style={{ display: "flex", gap: 4, marginLeft: "auto" }}>
          {i > 0 && <button onClick={() => move(i, -1)} style={mini}>↑</button>}
          {i < count - 1 && <button onClick={() => move(i, 1)} style={mini}>↓</button>}
          <button onClick={() => remove(i)} style={{ ...mini, background: "#ff3b3012", color: "#ff3b30" }}>✕</button>
        </div>
      </div>
      {selectVal === "Custom" && (
        <input value={soc.name} onChange={e => update(i, "name", e.target.value)} placeholder="Platform name (e.g. Hugging Face)" style={{ ...field, marginTop: 8 }} />
      )}
      <input value={soc.url} onChange={e => update(i, "url", e.target.value)} placeholder="https://..." style={{ ...field, marginTop: 8 }} />
      {showIcon
        ? <div style={{ marginTop: 8 }}><ImgUpload label="Custom icon (optional — overrides the built-in)" value={soc.icon || ""} onChange={v => update(i, "icon", v)} /></div>
        : <button onClick={() => setShowIcon(true)} style={{ marginTop: 8, background: "none", border: "none", color: AC, fontSize: 12, cursor: "pointer", padding: 0, fontFamily: FONT }}>+ Custom icon (optional)</button>}
    </div>
  );
};

const SocialsEditor = ({ socials, onChange }) => {
  const list = socials || [];
  const update = (i, key, val) => { const a = [...list]; a[i] = { ...a[i], [key]: val }; onChange(a); };
  const remove = (i) => onChange(list.filter((_, j) => j !== i));
  const move = (i, dir) => { const j = i + dir; if (j < 0 || j >= list.length) return; const a = [...list]; [a[i], a[j]] = [a[j], a[i]]; onChange(a); };
  const add = () => onChange([...list, { id: `${Date.now()}_${Math.random().toString(36).slice(2,5)}`, name: "GitHub", url: "", icon: "" }]);
  return (
    <div>
      {list.length === 0 && <div style={{ padding: 14, borderRadius: 12, background: BG2, textAlign: "center", color: TX3, fontSize: 13, marginBottom: 10 }}>No social links yet.</div>}
      {list.map((soc, i) => <SocialRow key={soc.id || i} soc={soc} i={i} count={list.length} update={update} remove={remove} move={move} />)}
      <button onClick={add} style={{ width: "100%", padding: "10px", borderRadius: 10, border: `1px dashed ${BORDER}`, background: "transparent", color: AC, fontSize: 14, cursor: "pointer", fontFamily: FONT, fontWeight: 600 }}>+ Add social link</button>
    </div>
  );
};

const AdminSettings = ({ data, save }) => {
  const [s, setS] = useState(data.settings);
  const u = (k, v) => setS(p => ({ ...p, [k]: v }));
  return (<div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
      <h1 style={{ fontFamily: FONTD, fontSize: 32, fontWeight: 700, color: TX, margin: 0 }}>Settings</h1>
      <AppleBtn primary small onClick={() => save({ ...data, settings: s })}>Save Changes</AppleBtn>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: 20 }}>
      <div style={{ background: CARDBG, borderRadius: 16, padding: 28, boxShadow: SHADOW }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: AC, margin: "0 0 20px", textTransform: "uppercase" }}>Hero</h3>
        <Input label="Name" value={s.name} onChange={v => u("name", v)} />
        <Input label="Role / Subtitle (shown above your name)" value={s.role || ""} onChange={v => u("role", v)} placeholder="e.g. Game Developer & AI Engineer" />
        <Input label="Tagline" value={s.tagline} onChange={v => u("tagline", v)} />
        <Input label="CTA: Work Button" value={s.ctaWork} onChange={v => u("ctaWork", v)} />
        <Input label="CTA: Collab Button" value={s.ctaCollab} onChange={v => u("ctaCollab", v)} />
      </div>
      <div style={{ background: CARDBG, borderRadius: 16, padding: 28, boxShadow: SHADOW }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: AC, margin: "0 0 20px", textTransform: "uppercase" }}>About</h3>
        <Input label="Bio" value={s.bio} onChange={v => u("bio", v)} textarea rows={4} />
        <TagInput label="Specialties" tags={s.specialties || []} onChange={v => u("specialties", v)} />
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 8 }}>Availability</label>
        <div style={{ display: "flex", gap: 8 }}>
          {[["open","Open","#30d158"],["busy","Busy","#ff9500"],["unavailable","Unavailable","#ff3b30"]].map(([v,l,c]) => (
            <button key={v} onClick={() => u("availability", v)} style={{ flex: 1, padding: "10px", borderRadius: 10, border: `1px solid ${s.availability===v?c:BORDER}`, background: s.availability===v?`${c}12`:"transparent", color: s.availability===v?c:TX2, fontSize: 13, cursor: "pointer" }}>{l}</button>
          ))}
        </div>
      </div>
      <div style={{ background: CARDBG, borderRadius: 16, padding: 28, boxShadow: SHADOW }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: AC, margin: "0 0 20px", textTransform: "uppercase" }}>Branding</h3>
        <ImgUpload label="Logo — navbar & admin (PNG/SVG, transparent works best)" value={s.logoImg || ""} onChange={v => u("logoImg", v)} />
        <ImgUpload label="Favicon — browser tab icon (square works best)" value={s.favicon || ""} onChange={v => u("favicon", v)} />
        <div style={{ padding: 14, borderRadius: 12, background: BG2, fontSize: 12, color: TX2, lineHeight: 1.6 }}>
          The logo replaces the “M” mark in the public navbar and the admin panel. The favicon shows in the browser tab. Leave either empty to fall back to the default “M”.
        </div>
      </div>
      <div style={{ background: CARDBG, borderRadius: 16, padding: 28, boxShadow: SHADOW, gridColumn: "1 / -1" }}>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: AC, margin: "0 0 20px", textTransform: "uppercase" }}>Contact & Social Links</h3>
        <Input label="Public email (shown as a direct link in the contact section)" value={s.email || ""} onChange={v => u("email", v)} placeholder="you@example.com" type="email" />
        <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: TX, marginBottom: 8 }}>Social links</label>
        <div style={{ fontSize: 12, color: TX3, marginBottom: 12 }}>Pick a platform for its icon (or “Custom” for anything else), then paste the full URL including https://. These show in the footer and the contact section. Use ↑↓ to reorder. Links left blank or set to “#” are hidden automatically.</div>
        <SocialsEditor socials={s.socials || []} onChange={v => u("socials", v)} />
      </div>
    </div>
  </div>);
};

// ── App Shell ──────────────────────────────────────────────────────────────
export default function App() {
  const hash = useHash();
  const { data, save, auth, login, logout } = useData();
  const addMessage = useCallback(async (msg) => {
    save({ ...data, messages: [...(data.messages || []), msg] });
    try { await set(ref(db, `messages/${msg.id}`), msg); } catch {}
  }, [data, save]);
  const [theme, setThemeState] = useState(THEME_MODE);
  const [projCat, setProjCat] = useState("All");
  const projCategories = Array.from(new Set((data.games || []).filter(g => g.status === "published").map(g => g.category || "Games")));

  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    try { localStorage.setItem("theme", next); } catch {}
    setThemeState(next);
  }, [theme]);

  // Apply admin-set favicon + page title from settings
  useEffect(() => {
    const fav = data.settings?.favicon;
    if (fav) {
      let link = document.querySelector("link[rel~='icon']");
      if (!link) { link = document.createElement("link"); link.setAttribute("rel", "icon"); document.head.appendChild(link); }
      link.setAttribute("href", fav);
    }
    const nm = data.settings?.name;
    if (nm && nm !== "YOUR NAME") document.title = nm;
  }, [data.settings?.favicon, data.settings?.name]);

  // Real analytics: auto-track every public page navigation
  useEffect(() => {
    if (!data.loaded) return;
    const parts = (hash || "#/").replace("#/", "").split("/").filter(Boolean);
    const route = parts[0] || "";
    if (route === "admin") return;
    let label = "Home";
    if (route === "games" && parts[1]) {
      const gm = data.games.find(g => g.id === parts[1]);
      label = gm ? `Game: ${gm.title}` : "Game Detail";
    } else if (route === "games") {
      label = "Games";
    } else if (route === "showcase" && parts[1]) {
      const sc = (data.showcase || []).find(s => s.id === parts[1]);
      label = sc ? `Showcase: ${sc.title}` : "Showcase Detail";
    }
    createTracker().then(tracker => tracker.trackPage(hash || "#/", label));
  }, [hash, data.loaded]);

  if (!data.loaded) return (
    <div style={{ background: BG, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: FONT }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 36, fontWeight: 700, color: TX, marginBottom: 8 }}>●</div>
        <p style={{ color: TX2, fontSize: 15 }}>Loading...</p>
      </div>
    </div>
  );

  const parts = hash.replace("#/", "").split("/").filter(Boolean);
  const route = parts[0] || "";

  const render = () => {
    if (route === "games" && parts[1]) return <GameDetail game={data.games.find(g => g.id === parts[1])} games={data.games} />;
    if (route === "showcase" && parts[1]) return <ShowcaseDetail item={(data.showcase||[]).find(s => s.id === parts[1])} showcase={data.showcase||[]} />;
    if (route === "admin") {
      if (!auth) return <AdminLogin onLogin={login} />;
      const s = parts[1] || "dashboard";
      return (
        <AdminWrap active={s} onLogout={logout} data={data} theme={theme} onToggleTheme={toggleTheme}>
          {s === "dashboard"  && <AdminDash data={data} />}
          {s === "games"      && <AdminGames data={data} save={save} />}
          {s === "blog"       && <AdminBlog data={data} save={save} />}
          {s === "showcase-admin" && <AdminShowcase data={data} save={save} />}
          {s === "media"          && <AdminMediaLibrary data={data} save={save} />}
          {s === "firebase"       && <FirebaseUsage />}
          {s === "bts-admin"  && <AdminBTS data={data} save={save} />}
          {s === "messages"   && <AdminMessages data={data} save={save} />}
          {s === "analytics"  && <AdminAnalytics data={data} />}
          {s === "settings"   && <AdminSettings data={data} save={save} />}
        </AdminWrap>
      );
    }
    return (
      <>
        <PortNav settings={data.settings} data={data} theme={theme} onToggleTheme={toggleTheme} projCategories={projCategories} onPickCategory={setProjCat} />
        <Hero settings={data.settings} />
        {data.games.filter(g => g.status === "published").length > 0 && <GamesSection games={data.games} category={projCat} setCategory={setProjCat} />}
        {(data.showcase || []).filter(s => s.status === "published").length > 0 && <ShowcaseSection showcase={data.showcase || []} />}
        <About settings={data.settings} />
        {data.settings.specialties && data.settings.specialties.length > 0 && <Skills />}
        {data.bts.length > 0 && <BTSSection bts={data.bts} />}
        {data.posts.filter(p => p.status === "published").length > 0 && <BlogSection posts={data.posts} />}
        <CollabSection settings={data.settings} onMessage={addMessage} />
        <Footer settings={data.settings} />
      </>
    );
  };

  return <><GlobalStyle /><div style={{ background: BG, color: TX, minHeight: "100vh", fontFamily: FONT, overflowX: "hidden", width: "100%" }}>{render()}</div></>;
}