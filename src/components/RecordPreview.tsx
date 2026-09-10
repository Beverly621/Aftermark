import { CSSProperties } from "react";
import { getMaterialStyleModifiers } from "@/lib/materials";
import { RecordArtDirection } from "@/types/record";

type Size = "hero" | "upload" | "card" | "density" | "material" | "message" | "making" | "reveal" | "share";

export function RecordPreview({ artDirection, decorative = false, size = "hero" }: { artDirection: RecordArtDirection; decorative?: boolean; size?: Size }) {
  const palette = artDirection.imagePalette ?? { primary: "#29c3d8", secondary: "#ffd447", neutral: "#f4f0e6", surprise: "#ff4f9a" };
  const modifiers = getMaterialStyleModifiers(artDirection.stylePack, artDirection.material);
  const style = {
    "--primary": palette.primary,
    "--secondary": palette.secondary,
    "--neutral": palette.neutral,
    "--surprise": palette.surprise,
    "--marker-contrast": modifiers.markerContrast,
    "--material-glow": modifiers.glow,
    "--iridescence": modifiers.iridescence,
    "--transparency": modifiers.transparency,
  } as CSSProperties;

  return (
    <div className={`record-preview size-${size} style-${artDirection.stylePack} material-${artDirection.material} density-${artDirection.doodleDensity}`} style={style} aria-label={decorative ? undefined : `${artDirection.material} record preview`}>
      <div className="record-disc">
        <div className="record-grooves" />
        <Doodles density={artDirection.doodleDensity} stylePack={artDirection.stylePack} />
        <div className="center-label">
          {artDirection.image ? <img src={artDirection.image} alt="Your original upload, preserved as the center label" /> : <div className="center-placeholder"><span>A</span><small>ONE OF ONE</small></div>}
          <span className="spindle" />
        </div>
        <div className="record-shine" />
      </div>
    </div>
  );
}

function Doodles({ density, stylePack }: { density: RecordArtDirection["doodleDensity"]; stylePack: RecordArtDirection["stylePack"] }) {
  if (stylePack === "analog_memory") {
    return (
      <svg className="doodles analog-doodles" viewBox="0 0 300 300" aria-hidden>
        <path d="M34 71l62-9 5 24-63 8z" className="tape" /><path d="M198 42c18 5 32 19 36 38" className="pencil" />
        <path d="M201 230l55-12 6 28-58 8z" className="stamp" /><text x="211" y="238">KEEP</text>
        <path d="M39 211c25-16 46-20 68-14" className="pencil" /><path d="M54 222c18-5 36-7 49-4" className="pencil thin" />
        {density !== "low" && <><circle cx="241" cy="123" r="17" className="pencil" /><path d="M226 124h29M241 109v29" className="pencil thin" /><text x="44" y="123">FOUND / 01</text></>}
        {density === "high" && <><path d="M35 154l49 11M208 181l47 10" className="pencil" /><text x="182" y="276">SIDE A</text></>}
      </svg>
    );
  }
  if (stylePack === "dream_archive") {
    return (
      <svg className="doodles dream-doodles" viewBox="0 0 300 300" aria-hidden>
        <path d="M55 86c10-17 33-18 43-1 16-8 32 5 30 20H47c-4-9 0-16 8-19z" className="cloud" />
        <path d="M222 57l4 11 11 4-11 4-4 11-4-11-11-4 11-4zM62 211l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" className="star" />
        <path d="M205 220c21 1 33 13 37 30-17 4-36-6-42-21" className="orbit" />
        {density !== "low" && <><circle cx="239" cy="131" r="25" className="moon" /><path d="M47 151c15 10 26 21 32 37M197 40c-6 20-2 35 10 47" className="orbit" /><text x="34" y="258">SOFT ORBIT</text></>}
        {density === "high" && <><path d="M77 45l3 8 8 3-8 3-3 8-3-8-8-3 8-3zM245 183l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" className="star" /><circle cx="54" cy="131" r="7" className="moon" /></>}
      </svg>
    );
  }
  return (
    <svg className="doodles neon-doodles" viewBox="0 0 300 300" aria-hidden>
      <path d="M51 68c12-15 30-8 31 7 5-14 25-20 34-7 11 17-18 37-32 48-15-9-46-29-33-48z" className="marker surprise" />
      <path d="M201 44l6 16 17 1-13 10 4 17-14-10-15 9 5-17-13-10 17 1z" className="marker secondary" />
      <path d="M221 203c11 1 23 8 26 19-8 10-22 15-35 11-8-12-4-23 9-30zM219 216h2M237 217h2M222 226c5 4 10 4 15 0" className="marker primary" />
      <path d="M36 188c18 7 35 18 45 34M42 197c14 5 24 11 34 20" className="marker neutral" />
      <path d="M216 115c16 5 28 5 44-2M221 124c14 3 26 2 36-1" className="marker secondary" />
      {density !== "low" && <>
        <path d="M47 130c16-8 34-10 49-6M48 139c15-6 29-6 42-3" className="marker primary" />
        <path d="M184 241l10 6-8 8 10 7-8 9" className="marker surprise" />
        <path d="M83 246c7-8 18-8 26 0-8 10-17 10-26 0zM96 240v13" className="marker neutral" />
        <text x="188" y="104" className="hand-text">STAY LATE</text>
        <text x="35" y="174" className="micro-text">ONE / ONE</text>
        <circle cx="56" cy="253" r="4" className="dot primary" /><circle cx="70" cy="261" r="3" className="dot surprise" /><circle cx="243" cy="174" r="4" className="dot neutral" />
      </>}
      {density === "high" && <>
        <path d="M119 37c-5 12-8 24-7 36M128 37c-5 13-6 24-4 35" className="marker neutral" />
        <path d="M38 103l11 4-9 7 8 7-12 2" className="marker secondary" />
        <path d="M244 82c9 7 15 17 16 28M234 88c7 6 12 14 13 22" className="marker surprise" />
        <text x="125" y="276" className="hand-text">GOOD DAYS</text>
        <circle cx="102" cy="46" r="3" className="dot surprise" /><circle cx="260" cy="151" r="3" className="dot secondary" />
      </>}
    </svg>
  );
}
