import { createHash } from "node:crypto";
import sharp from "sharp";
import { FinalRecordCompositor, FinalRecordCompositorInput } from "@/lib/rendering/contracts";
import { decodeAssetDataUrl, decodeImageDataUrl } from "@/lib/rendering/data-url.server";
import { RenderPipelineError } from "@/lib/rendering/errors";

export const MAIN_ARTWORK_SIZE = 2048;
export const RECORD_CENTER = { x: 1120, y: 982 } as const;
export const RECORD_DIAMETER = 1480;
export const CENTER_LABEL_DIAMETER = Math.round(RECORD_DIAMETER * 0.3);

export class SharpFinalRecordCompositor implements FinalRecordCompositor {
  async compose(input: FinalRecordCompositorInput) {
    const { buffer: sourceBuffer } = decodeImageDataUrl(input.artDirection.image);
    const outerBuffer = decodeAssetDataUrl(input.outerArtwork.layerDataUrl);

    try {
      const centerLabel = await createProtectedCenterLabel(sourceBuffer);
      const outerRing = await createProtectedOuterRing(outerBuffer);
      const base = Buffer.from(createBaseSvg());
      const deterministicText = Buffer.from(createDeterministicTextSvg(input));
      const output = await sharp(base, { density: 144 })
        .resize(MAIN_ARTWORK_SIZE, MAIN_ARTWORK_SIZE)
        .composite([
          { input: outerRing, top: 0, left: 0 },
          { input: deterministicText, top: 0, left: 0 },
          {
            input: centerLabel,
            top: RECORD_CENTER.y - Math.floor(CENTER_LABEL_DIAMETER / 2),
            left: RECORD_CENTER.x - Math.floor(CENTER_LABEL_DIAMETER / 2),
          },
        ])
        .png({ compressionLevel: 9, adaptiveFiltering: true })
        .toBuffer();

      return {
        artwork: {
          dataUrl: `data:image/png;base64,${output.toString("base64")}`,
          mimeType: "image/png" as const,
          width: MAIN_ARTWORK_SIZE,
          height: MAIN_ARTWORK_SIZE,
        },
        sourceImageSha256: createHash("sha256").update(sourceBuffer).digest("hex"),
      };
    } catch (error) {
      if (error instanceof RenderPipelineError) throw error;
      throw new RenderPipelineError("GENERATION_FAILED", "The final record could not be composited.", true, { cause: error });
    }
  }
}

async function createProtectedOuterRing(outerBuffer: Buffer): Promise<Buffer> {
  const ringMask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${MAIN_ARTWORK_SIZE}" height="${MAIN_ARTWORK_SIZE}" viewBox="0 0 ${MAIN_ARTWORK_SIZE} ${MAIN_ARTWORK_SIZE}">
    <mask id="ring"><rect width="100%" height="100%" fill="black"/><circle cx="${RECORD_CENTER.x}" cy="${RECORD_CENTER.y}" r="${RECORD_DIAMETER / 2}" fill="white"/><circle cx="${RECORD_CENTER.x}" cy="${RECORD_CENTER.y}" r="${CENTER_LABEL_DIAMETER / 2}" fill="black"/></mask>
    <rect width="100%" height="100%" fill="white" mask="url(#ring)"/>
  </svg>`);
  return sharp(outerBuffer, { failOn: "error" })
    .resize(MAIN_ARTWORK_SIZE, MAIN_ARTWORK_SIZE, { fit: "fill" })
    .ensureAlpha()
    .composite([{ input: ringMask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

export async function createProtectedCenterLabel(sourceBuffer: Buffer): Promise<Buffer> {
  const circleMask = Buffer.from(`<svg width="${CENTER_LABEL_DIAMETER}" height="${CENTER_LABEL_DIAMETER}" xmlns="http://www.w3.org/2000/svg"><circle cx="50%" cy="50%" r="50%" fill="white"/></svg>`);
  return sharp(sourceBuffer, { failOn: "error" })
    .rotate()
    .resize(CENTER_LABEL_DIAMETER, CENTER_LABEL_DIAMETER, { fit: "cover", position: "attention" })
    .ensureAlpha()
    .composite([{ input: circleMask, blend: "dest-in" }])
    .png()
    .toBuffer();
}

function createBaseSvg(): string {
  const radius = RECORD_DIAMETER / 2;
  const grooveStart = CENTER_LABEL_DIAMETER / 2 + 32;
  const grooves = Array.from({ length: 56 }, (_, index) => {
    const grooveRadius = grooveStart + index * ((radius - grooveStart - 18) / 55);
    return `<circle cx="${RECORD_CENTER.x}" cy="${RECORD_CENTER.y}" r="${grooveRadius.toFixed(1)}" fill="none" stroke="#bdbdb3" stroke-opacity="${index % 4 === 0 ? 0.16 : 0.075}" stroke-width="2"/>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 2048 2048">
    <defs>
      <radialGradient id="vinyl" cx="35%" cy="27%"><stop offset="0" stop-color="#353532"/><stop offset=".32" stop-color="#171715"/><stop offset=".78" stop-color="#070707"/><stop offset="1" stop-color="#020202"/></radialGradient>
      <linearGradient id="sleeve" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#34332f"/><stop offset="1" stop-color="#1c1c1a"/></linearGradient>
      <filter id="shadow"><feDropShadow dx="0" dy="42" stdDeviation="42" flood-color="#000" flood-opacity=".42"/></filter>
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".72" numOctaves="3" seed="17"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 .08"/></feComponentTransfer></filter>
      <clipPath id="disc"><circle cx="${RECORD_CENTER.x}" cy="${RECORD_CENTER.y}" r="${radius}"/></clipPath>
      <linearGradient id="shine" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff" stop-opacity="0"/><stop offset=".47" stop-color="#fff" stop-opacity=".1"/><stop offset=".53" stop-color="#fff" stop-opacity="0"/></linearGradient>
    </defs>
    <rect width="2048" height="2048" fill="#e6e0d2"/>
    <g transform="rotate(-4 825 1030)" filter="url(#shadow)">
      <rect x="115" y="292" width="1480" height="1480" rx="5" fill="url(#sleeve)"/>
      <rect x="142" y="319" width="1426" height="1426" rx="3" fill="none" stroke="#eee9dc" stroke-opacity=".13" stroke-width="3"/>
      <rect x="115" y="292" width="1480" height="1480" filter="url(#grain)"/>
    </g>
    <circle cx="${RECORD_CENTER.x}" cy="${RECORD_CENTER.y}" r="${radius}" fill="url(#vinyl)" filter="url(#shadow)"/>
    <g clip-path="url(#disc)">${grooves}<rect x="360" y="210" width="1510" height="1510" fill="url(#shine)" transform="rotate(21 ${RECORD_CENTER.x} ${RECORD_CENTER.y})"/></g>
    <circle cx="${RECORD_CENTER.x}" cy="${RECORD_CENTER.y}" r="${CENTER_LABEL_DIAMETER / 2 + 7}" fill="#080808" stroke="#eee9dc" stroke-opacity=".35" stroke-width="3"/>
  </svg>`;
}

export function createDeterministicTextSvg({ artDirection, plan }: FinalRecordCompositorInput): string {
  const userMessage = artDirection.userMessage ? escapeXml(artDirection.userMessage.slice(0, 180)) : "";
  const firstPhrase = escapeXml(plan.aiPhrases[0] ?? "");
  const secondPhrase = escapeXml(plan.aiPhrases[1] ?? "");
  const catalog = escapeXml(artDirection.catalogNumber);
  const date = escapeXml(artDirection.date.replaceAll("-", "."));
  const userMessageMarkup = userMessage
    ? plan.compositionMode === "text_led"
      ? `<text x="1360" y="1320" font-family="Georgia, serif" font-size="56" font-style="italic" font-weight="700" fill="${plan.palette.neutral}" text-anchor="middle" transform="rotate(-7 1360 1320)">${userMessage}</text><path d="M1115 1362c160 24 326 13 480-22" fill="none" stroke="${plan.palette.surprise}" stroke-width="16" stroke-linecap="round"/>`
      : `<text x="1340" y="1335" font-family="Georgia, serif" font-size="38" font-style="italic" font-weight="700" fill="${plan.palette.neutral}" text-anchor="middle" transform="rotate(-5 1340 1335)">${userMessage}</text><path d="M1170 1366c112 16 230 11 340-14" fill="none" stroke="${plan.palette.surprise}" stroke-width="11" stroke-linecap="round"/>`
    : "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="2048" height="2048" viewBox="0 0 2048 2048">
    <g font-family="Courier New, monospace" fill="#f4f0e6">
      <text x="190" y="380" font-size="24" font-weight="700" letter-spacing="5">AFTERMARK</text>
      <text x="190" y="1538" font-size="20" letter-spacing="4" fill-opacity=".7">ONE OF ONE</text>
      <text x="190" y="1574" font-size="22" font-weight="700" letter-spacing="3">${catalog}</text>
      <text x="190" y="1620" font-size="19" letter-spacing="3" fill-opacity=".7">${date}</text>
      <text x="1450" y="625" font-size="21" font-weight="700" letter-spacing="3" transform="rotate(8 1450 625)">SIDE A</text>
    </g>
    ${firstPhrase ? `<text x="1450" y="840" font-family="Georgia, serif" font-size="39" font-style="italic" font-weight="700" fill="${plan.palette.neutral}" transform="rotate(-7 1450 840)">${firstPhrase}</text>` : ""}
    ${secondPhrase ? `<text x="530" y="1450" font-family="Georgia, serif" font-size="34" font-style="italic" font-weight="700" fill="${plan.palette.secondary}" transform="rotate(9 530 1450)">${secondPhrase}</text>` : ""}
    ${userMessageMarkup}
  </svg>`;
}

function escapeXml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&apos;", '"': "&quot;" })[character] ?? character);
}
