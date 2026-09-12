"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { RecordPreview } from "@/components/RecordPreview";
import { ShareCard } from "@/components/ShareCard";
import { CreationProvider, useCreation } from "@/context/CreationContext";
import { extractPalette } from "@/lib/palette";
import { getRecordRenderer, RecordRenderError } from "@/lib/renderer";
import { saveShareCard, shareRecord } from "@/lib/share";
import { fetchStudioSnapshot, studioResult, submitStudioRequest } from "@/lib/studio/client";
import { StudioBrowserSnapshot, isTask2C01StudioOptionSupported } from "@/lib/studio/contracts";
import { CompositionMode, DoodleDensity, RecordMaterial, StylePack } from "@/types/record";

type Screen = "landing" | "upload" | "style" | "density" | "composition" | "material" | "message" | "making" | "reveal" | "share";

const flow: Screen[] = ["landing", "upload", "style", "density", "composition", "material", "message", "making", "reveal", "share"];

const styleOptions: { value: StylePack; title: string; note: string }[] = [
  { value: "neon_scribble", title: "AFTER DARK", note: "Marker, motion, midnight." },
  { value: "analog_memory", title: "IN A DRAWER", note: "Tape, paper, traces." },
  { value: "dream_archive", title: "SOMEWHERE IN A DREAM", note: "Haze, glow, soft orbit." },
];

const densityOptions: { value: DoodleDensity; title: string; note: string }[] = [
  { value: "low", title: "KEEP IT CLEAN", note: "A few intentional marks." },
  { value: "medium", title: "LEAVE A TRACE", note: "Rich, balanced, still vinyl." },
  { value: "high", title: "GO ALL IN", note: "Dense, loud, layered." },
];

const compositionOptions: { value: CompositionMode; title: string; note: string; mark: string }[] = [
  { value: "text_led", title: "THE WORDS", note: "Your message becomes the leading mark.", mark: "Aa" },
  { value: "motif_led", title: "THE MARKS", note: "Image-inspired doodles lead the record.", mark: "✦" },
];

const materialOptions: { value: RecordMaterial; title: string; note: string }[] = [
  { value: "classic", title: "CLASSIC", note: "Dark vinyl · soft gloss" },
  { value: "clear", title: "CLEAR", note: "Transparent · light-catching" },
  { value: "smoke", title: "SMOKE", note: "Charcoal · drifting layers" },
  { value: "aurora", title: "AURORA", note: "Iridescent · reflected color" },
  { value: "pearl", title: "PEARL", note: "Milky · subtle color shift" },
];

function Experience() {
  const { state, dispatch, artDirection } = useCreation();
  const [screen, setScreen] = useState<Screen>("landing");
  const [messageError, setMessageError] = useState("");
  const [shareStatus, setShareStatus] = useState("");
  const [generationError, setGenerationError] = useState<RecordRenderError | null>(null);
  const [studioSnapshot, setStudioSnapshot] = useState<StudioBrowserSnapshot | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const decisionScreens: Screen[] = ["upload", "style", "density", "composition", "material", "message"];
  const stepIndex = Math.max(0, decisionScreens.indexOf(screen));
  const go = (next: Screen) => setScreen(next);
  const goBack = () => {
    const index = flow.indexOf(screen);
    if (index > 0) setScreen(flow[index - 1]);
  };

  const applyStudioSnapshot = useCallback((snapshot: StudioBrowserSnapshot) => {
    setStudioSnapshot(snapshot);
    if (!snapshot.request || !snapshot.files.source) return;
    const sourceUrl = `${snapshot.files.source}?v=${encodeURIComponent(snapshot.status.updatedAt)}`;
    dispatch({ type: "HYDRATE_STUDIO_REQUEST", request: snapshot.request, image: sourceUrl });
    const result = studioResult(snapshot);
    if (result) {
      dispatch({ type: "SET_RESULT", result });
      setGenerationError(null);
      setScreen("reveal");
    } else if (snapshot.status.state === "error") {
      setGenerationError(new RecordRenderError("GENERATION_FAILED", snapshot.status.message ?? "The local development render could not be completed.", false));
      setScreen("making");
    } else {
      setScreen("making");
    }
  }, [dispatch]);

  const refreshStudio = useCallback(async () => {
    const snapshot = await fetchStudioSnapshot();
    if (snapshot) applyStudioSnapshot(snapshot);
    return snapshot;
  }, [applyStudioSnapshot]);

  useEffect(() => {
    refreshStudio().catch(() => undefined);
  }, [refreshStudio]);

  useEffect(() => {
    if (!studioSnapshot?.request || studioSnapshot.status.state === "complete" || studioSnapshot.status.state === "error") return;
    const timer = window.setInterval(() => refreshStudio().catch(() => undefined), 600);
    return () => window.clearInterval(timer);
  }, [refreshStudio, studioSnapshot?.request, studioSnapshot?.status.state]);

  const onImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const image = String(reader.result);
      dispatch({ type: "SET_IMAGE", image, fileName: file.name });
      const imagePalette = await extractPalette(image);
      dispatch({ type: "SET_PALETTE", imagePalette });
    };
    reader.readAsDataURL(file);
  };

  const makeRecord = async () => {
    if (!state.messageValidation.valid) {
      setMessageError("Keep your mark to 30 words or characters.");
      return;
    }
    setMessageError("");
    setGenerationError(null);
    go("making");
    try {
      if (studioSnapshot) {
        if (studioSnapshot.request) {
          await refreshStudio();
          return;
        }
        const updated = await submitStudioRequest({
          sessionId: studioSnapshot.session.sessionId,
          image: state.image,
          artDirection,
        });
        applyStudioSnapshot(updated);
        return;
      }
      const result = await getRecordRenderer(artDirection).render(artDirection);
      dispatch({ type: "SET_RESULT", result });
      window.setTimeout(() => go("reveal"), 900);
    } catch (error) {
      setGenerationError(error instanceof RecordRenderError ? error : new RecordRenderError("GENERATION_FAILED", "The artwork could not be completed.", true));
    }
  };

  const reset = () => {
    dispatch({ type: "RESET" });
    setShareStatus("");
    setGenerationError(null);
    if (fileInput.current) fileInput.current.value = "";
    go("upload");
  };

  const handleSave = async () => {
    if (!state.result) return;
    try {
      await saveShareCard(state.result);
      setShareStatus("SAVED TO YOUR DEVICE.");
    } catch {
      setShareStatus("COULDN’T SAVE. TRY AGAIN.");
    }
  };

  const handleShare = async () => {
    if (!state.result) return;
    try {
      await shareRecord(state.result);
      setShareStatus("READY TO SHARE.");
    } catch (error) {
      if ((error as Error).name !== "AbortError") setShareStatus("COULDN’T SHARE. TRY SAVE INSTEAD.");
    }
  };

  const currentDirection = artDirection;
  const header = screen !== "landing" && screen !== "making";

  return (
    <AppShell
      showHeader={header}
      onBack={screen === "reveal" || screen === "share" ? undefined : goBack}
      progress={decisionScreens.includes(screen) ? stepIndex + 1 : undefined}
    >
      <AnimatePresence mode="wait">
        {screen === "landing" && (
          <motion.main key="landing" className="screen landing" {...screenMotion}>
            <div className="landing-copy">
              <p className="eyebrow">AFTERMARK</p>
              <h1><span className="solid-line">MADE TO</span><span>KEEP.</span></h1>
              <p className="hook">Turn something you love into a one-of-one record.</p>
              <button className="primary-button" onClick={() => go("upload")}>MAKE ONE <span aria-hidden>↗</span></button>
            </div>
            <div className="hero-object" aria-hidden="true">
              <div className="hero-sleeve"><span>ONE<br />OF ONE</span></div>
              <RecordPreview artDirection={currentDirection} decorative size="hero" />
              <span className="hero-note">A moment, kept.</span>
            </div>
          </motion.main>
        )}

        {screen === "upload" && (
          <motion.main key="upload" className="screen decision-screen upload-screen" {...screenMotion}>
            <div className="screen-title">
              <p className="step-label">01 / BEGIN</p>
              <h2>GIVE IT SOMETHING<br />YOU LOVE.</h2>
              <p>A person. A place. Artwork. A moment. Anything.</p>
            </div>
            <button className={`upload-stage ${state.image ? "has-image" : ""}`} onClick={() => fileInput.current?.click()}>
              <RecordPreview artDirection={currentDirection} size="upload" />
              <span className="upload-action">{state.image ? "CHANGE PHOTO" : "+ ADD A PHOTO"}</span>
              {state.fileName && <span className="file-name">{state.fileName}</span>}
            </button>
            <input ref={fileInput} className="sr-only" type="file" accept="image/*" onChange={onImage} />
            <button className="primary-button footer-action" disabled={!state.image} onClick={() => go("style")}>KEEP GOING <span>→</span></button>
          </motion.main>
        )}

        {screen === "style" && (
          <motion.main key="style" className="screen decision-screen" {...screenMotion}>
            <div className="screen-title compact">
              <p className="step-label">02 / WORLD</p>
              <h2>WHERE DOES<br />THIS RECORD LIVE?</h2>
            </div>
            <div className="style-grid" role="radiogroup" aria-label="Style world">
              {styleOptions.map((option) => {
                const unavailable = Boolean(studioSnapshot) && !isTask2C01StudioOptionSupported("stylePack", option.value);
                const selected = !unavailable && state.stylePack === option.value;
                return (
                  <button
                    key={option.value}
                    role="radio"
                    aria-checked={selected}
                    aria-disabled={unavailable}
                    disabled={unavailable}
                    className={`style-card ${option.value} ${selected ? "selected" : ""} ${unavailable ? "skill-unavailable" : ""}`}
                    onClick={() => dispatch({ type: "SET_STYLE", stylePack: option.value })}
                  >
                    <span className="style-art"><RecordPreview artDirection={{ ...currentDirection, stylePack: option.value }} decorative size="card" /></span>
                    <span className="option-copy"><strong>{option.title}</strong><small>{option.note}</small></span>
                    {unavailable ? <span className="skill-option-status">COMING LATER</span> : <span className="selection-mark">{selected ? "●" : "○"}</span>}
                  </button>
                );
              })}
            </div>
            <button className="primary-button footer-action" disabled={!state.choicesMade.style || (Boolean(studioSnapshot) && !isTask2C01StudioOptionSupported("stylePack", state.stylePack))} onClick={() => go("density")}>THIS ONE <span>→</span></button>
          </motion.main>
        )}

        {screen === "density" && (
          <motion.main key="density" className="screen decision-screen density-screen" {...screenMotion}>
            <div className="screen-title compact">
              <p className="step-label">03 / ENERGY</p>
              <h2>HOW FAR<br />SHOULD WE TAKE IT?</h2>
            </div>
            <div className="density-stage"><RecordPreview artDirection={currentDirection} size="density" /></div>
            <div className="density-options" role="radiogroup" aria-label="Doodle intensity">
              {densityOptions.map((option) => {
                const unavailable = Boolean(studioSnapshot) && !isTask2C01StudioOptionSupported("doodleDensity", option.value);
                const selected = !unavailable && state.doodleDensity === option.value;
                return (
                  <button
                    key={option.value}
                    role="radio"
                    aria-checked={selected}
                    aria-disabled={unavailable}
                    disabled={unavailable}
                    className={`${selected ? "selected" : ""} ${unavailable ? "skill-unavailable" : ""}`}
                    onClick={() => dispatch({ type: "SET_DENSITY", doodleDensity: option.value })}
                  >
                    <span className="density-line" data-density={option.value} />
                    <strong>{option.title}</strong><small>{option.note}</small>
                    {unavailable && <span className="skill-option-status">COMING LATER</span>}
                  </button>
                );
              })}
            </div>
            <button className="primary-button footer-action" disabled={!state.choicesMade.density || (Boolean(studioSnapshot) && !isTask2C01StudioOptionSupported("doodleDensity", state.doodleDensity))} onClick={() => go("composition")}>CHOOSE THE LEAD <span>→</span></button>
          </motion.main>
        )}

        {screen === "composition" && (
          <motion.main key="composition" className="screen decision-screen composition-screen" {...screenMotion}>
            <div className="screen-title compact">
              <p className="step-label">04 / COMPOSITION</p>
              <h2>WHAT SHOULD LEAD?</h2>
              <p>The words stay exact. The marks stay image-inspired.</p>
            </div>
            <div className="composition-options" role="radiogroup" aria-label="Composition mode">
              {compositionOptions.map((option) => (
                <button
                  key={option.value}
                  role="radio"
                  aria-checked={state.compositionMode === option.value}
                  className={state.compositionMode === option.value ? "selected" : ""}
                  onClick={() => dispatch({ type: "SET_COMPOSITION_MODE", compositionMode: option.value })}
                >
                  <span className="composition-mark" aria-hidden>{option.mark}</span>
                  <span><strong>{option.title}</strong><small>{option.note}</small></span>
                  <span className="selection-mark">{state.compositionMode === option.value ? "●" : "○"}</span>
                </button>
              ))}
            </div>
            <button className="primary-button footer-action" disabled={!state.choicesMade.composition} onClick={() => go("material")}>SET THE SURFACE <span>→</span></button>
          </motion.main>
        )}

        {screen === "material" && (
          <motion.main key="material" className="screen decision-screen material-screen" {...screenMotion}>
            <div className="screen-title compact">
              <p className="step-label">05 / SURFACE</p>
              <h2>PICK A SURFACE.</h2>
            </div>
            <div className="material-preview"><RecordPreview artDirection={currentDirection} size="material" /></div>
            <div className="material-rail" role="radiogroup" aria-label="Record material">
              {materialOptions.map((option) => {
                const unavailable = Boolean(studioSnapshot) && !isTask2C01StudioOptionSupported("material", option.value);
                const selected = !unavailable && state.material === option.value;
                return (
                  <button
                    key={option.value}
                    data-material={option.value}
                    role="radio"
                    aria-checked={selected}
                    aria-disabled={unavailable}
                    disabled={unavailable}
                    className={`material-chip ${selected ? "selected" : ""} ${unavailable ? "skill-unavailable" : ""}`}
                    onClick={() => dispatch({ type: "SET_MATERIAL", material: option.value })}
                  >
                    <span className={`material-swatch ${option.value}`} />
                    <strong>{option.title}</strong><small>{option.note}</small>
                    {unavailable && <span className="skill-option-status">COMING LATER</span>}
                  </button>
                );
              })}
            </div>
            <button className="primary-button footer-action" disabled={!state.choicesMade.material || (Boolean(studioSnapshot) && !isTask2C01StudioOptionSupported("material", state.material))} onClick={() => go("message")}>LAST TOUCH <span>→</span></button>
          </motion.main>
        )}

        {screen === "message" && (
          <motion.main key="message" className="screen decision-screen message-screen" {...screenMotion}>
            <div className="screen-title">
              <p className="step-label">06 / YOUR MARK</p>
              <h2>LEAVE ONE MARK.</h2>
              <p>A tiny note for the moment. Or leave it unwritten.</p>
            </div>
            <div className="message-record"><RecordPreview artDirection={currentDirection} size="message" /></div>
            <div className={`message-field ${!state.messageValidation.valid ? "invalid" : ""}`}>
              <label htmlFor="mark">YOUR WORDS</label>
              <textarea
                id="mark"
                rows={2}
                value={state.userMessage}
                placeholder="A name, a date, a secret..."
                onChange={(event) => dispatch({ type: "SET_MESSAGE", userMessage: event.target.value })}
              />
              <div><span>Keep it short.</span><span>{state.messageValidation.count} / 30</span></div>
            </div>
            {messageError && <p className="form-error" role="alert">{messageError}</p>}
            <button className="primary-button footer-action make-button" onClick={makeRecord}>MAKE MY RECORD <span>✦</span></button>
          </motion.main>
        )}

        {screen === "making" && (
          <Making
            key="making"
            artDirection={currentDirection}
            error={generationError}
            studioStatus={studioSnapshot?.status.state}
            onRetry={studioSnapshot?.request ? () => { void refreshStudio(); } : makeRecord}
            onEdit={() => go(generationError?.code === "INVALID_IMAGE" ? "upload" : "message")}
          />
        )}

        {screen === "reveal" && state.result && (
          <motion.main key="reveal" className="screen reveal-screen" {...screenMotion}>
            <div className="reveal-title"><p>YOUR RECORD IS—</p><h2>{state.result.recordType}</h2></div>
            <div className="reveal-art">
              {state.result.mainArtwork ? (
                <img className="main-artwork" src={state.result.mainArtwork.dataUrl} alt="Your completed one-of-one Aftermark record" />
              ) : (
                <>
                  <div className="reveal-sleeve"><span>AFTERMARK</span><small>{state.result.catalogNumber}</small></div>
                  <RecordPreview artDirection={state.result.artDirection} size="reveal" />
                </>
              )}
            </div>
            <div className="record-identity">
              <div><span>ONE OF ONE</span><strong>{state.result.catalogNumber}</strong></div>
              <div><span>MADE</span><strong>{formatDate(state.result.artDirection.date)}</strong></div>
            </div>
            {state.userMessage && <p className="reveal-message">“{state.userMessage}”</p>}
            {state.result.renderMode === "development" && (
              <p className="development-badge">
                DEVELOPMENT · {state.result.providerDiagnostics?.providerId ?? "OUTER-ART ADAPTER"} · {state.result.providerDiagnostics?.modelId ?? "LOCAL"}
              </p>
            )}
            <button className="primary-button footer-action" onClick={() => go("share")}>KEEP THIS <span>→</span></button>
          </motion.main>
        )}

        {screen === "share" && state.result && (
          <motion.main key="share" className="screen share-screen" {...screenMotion}>
            <div className="screen-title compact"><p className="step-label">YOURS TO KEEP</p><h2>PASS IT ON.<br />OR KEEP IT CLOSE.</h2></div>
            <ShareCard result={state.result} />
            <div className="share-actions">
              <button className="primary-button" onClick={handleSave}>SAVE</button>
              <button className="outline-button" onClick={handleShare}>SHARE</button>
            </div>
            <p className="share-status" role="status" aria-live="polite">{shareStatus}</p>
            {studioSnapshot ? (
              <p className="share-status">START A NEW CODEX SESSION TO MAKE ANOTHER.</p>
            ) : (
              <button className="text-button" onClick={reset}>MAKE ANOTHER <span>↻</span></button>
            )}
          </motion.main>
        )}
      </AnimatePresence>
    </AppShell>
  );
}

function Making({ artDirection, error, studioStatus, onRetry, onEdit }: {
  artDirection: ReturnType<typeof useCreation>["artDirection"];
  error: RecordRenderError | null;
  studioStatus?: StudioBrowserSnapshot["status"]["state"];
  onRetry: () => void;
  onEdit: () => void;
}) {
  const [line, setLine] = useState(0);
  const studioLine = studioStatus === "request_ready" ? "Choices saved. Waiting for Codex."
    : studioStatus === "generating_outer_art" ? "Building the development outer art."
      : studioStatus === "compositing" ? "Protecting your image and setting every mark."
        : undefined;
  const lines = studioLine ? [studioLine, studioLine, studioLine] : ["Finding the right marks.", "Leaving a little chaos.", "Almost yours."];
  useEffect(() => {
    const timer = window.setInterval(() => setLine((value) => Math.min(2, value + 1)), 700);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <motion.main className="screen making-screen" {...screenMotion}>
      <p className="eyebrow inverted">AFTERMARK · ONE OF ONE</p>
      <div className="making-art"><RecordPreview artDirection={artDirection} size="making" /></div>
      {error ? (
        <div className="making-error" role="alert">
          <p className="step-label">{error.code.replaceAll("_", " ")}</p>
          <h2>THIS ONE<br />NEEDS ANOTHER GO.</h2>
          <p>{error.message} Your choices are still here.</p>
          <div>
            {error.retryable && <button className="primary-button" onClick={onRetry}>TRY AGAIN <span>↻</span></button>}
            <button className="outline-button" onClick={onEdit}>{error.code === "INVALID_IMAGE" ? "CHOOSE ANOTHER PHOTO" : error.code === "INVALID_MESSAGE" ? "EDIT MY MESSAGE" : "CHECK MY CHOICES"}</button>
          </div>
        </div>
      ) : (
        <>
          <div className="making-copy"><h2>MAKING IT<br />YOURS.</h2><AnimatePresence mode="wait"><motion.p key={line} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{lines[line]}</motion.p></AnimatePresence></div>
          <div className="making-marks" aria-hidden><i /><i /><i /><i /></div>
        </>
      )}
    </motion.main>
  );
}

const screenMotion = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] as const },
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${value}T12:00:00`)).toUpperCase();
}

export default function Home() {
  return <CreationProvider><Experience /></CreationProvider>;
}
