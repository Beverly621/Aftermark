import { RecordRenderResult } from "@/types/record";

export async function saveShareCard(result: RecordRenderResult) {
  const blob = await composeShareCard(result);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.download = `aftermark-${result.recordType.toLowerCase().replaceAll(" ", "-")}.png`;
  anchor.href = url;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function shareRecord(result: RecordRenderResult) {
  const blob = await composeShareCard(result);
  const file = new File([blob], `aftermark-${result.catalogNumber}.png`, { type: "image/png" });
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({ title: `My Aftermark: ${result.recordType}`, text: "Made to keep.", files: [file] });
  } else {
    await saveShareCard(result);
  }
}

async function composeShareCard(result: RecordRenderResult): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable");
  const isDream = result.artDirection.stylePack === "dream_archive";
  const isAnalog = result.artDirection.stylePack === "analog_memory";
  ctx.fillStyle = isDream ? "#d9d9ef" : isAnalog ? "#c8b28f" : "#171715";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = isDream ? "#25233c" : "#f4f0e6";
  ctx.font = "700 34px Arial";
  ctx.letterSpacing = "5px";
  ctx.fillText("YOUR RECORD", 90, 120);
  ctx.font = "500 22px monospace";
  ctx.fillText("ONE OF ONE", 820, 120);

  ctx.save();
  ctx.translate(540, 730);
  ctx.rotate(-0.035);
  ctx.fillStyle = isAnalog ? "#6d563a" : isDream ? "#7d76a5" : "#262624";
  ctx.fillRect(-355, -355, 710, 710);
  ctx.restore();
  await drawRecord(ctx, 540, 700, 345, result);

  ctx.fillStyle = isDream ? "#25233c" : "#f4f0e6";
  ctx.font = "500 22px monospace";
  ctx.fillText("AFTERMARK PRESENTS", 90, 1190);
  ctx.font = "900 92px Arial";
  wrapText(ctx, result.recordType, 90, 1305, 900, 96);
  if (result.artDirection.userMessage) {
    ctx.font = "italic 38px Georgia";
    wrapText(ctx, `“${result.artDirection.userMessage}”`, 90, 1510, 870, 54);
  }
  ctx.font = "500 25px monospace";
  ctx.fillText(result.catalogNumber, 90, 1710);
  ctx.fillText(result.artDirection.date.replaceAll("-", "."), 765, 1710);
  ctx.strokeStyle = isDream ? "#25233c" : "#f4f0e6";
  ctx.globalAlpha = 0.35;
  ctx.beginPath(); ctx.moveTo(90, 1770); ctx.lineTo(990, 1770); ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.font = "700 24px Arial";
  ctx.fillText("AFTERMARK", 90, 1840);
  ctx.font = "500 20px monospace";
  ctx.fillText("MADE TO KEEP.", 800, 1840);

  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not create image")), "image/png"));
}

async function drawRecord(ctx: CanvasRenderingContext2D, x: number, y: number, radius: number, result: RecordRenderResult) {
  const art = result.artDirection;
  const materialColors = { classic: ["#070707", "#242421"], clear: ["#a7aaa7", "#353936"], smoke: ["#191a1a", "#585b59"], aurora: ["#181b1c", "#42645f"], pearl: ["#dfddd4", "#999c9b"] } as const;
  const gradient = ctx.createRadialGradient(x - 75, y - 90, 35, x, y, radius);
  gradient.addColorStop(0, materialColors[art.material][1]);
  gradient.addColorStop(1, materialColors[art.material][0]);
  ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fillStyle = gradient; ctx.fill();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.clip();
  ctx.globalAlpha = 0.2; ctx.strokeStyle = "#fff";
  for (let r = 120; r < radius; r += 18) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); }
  ctx.globalAlpha = 1;
  const colors = [art.imagePalette?.primary ?? "#2bc4d9", art.imagePalette?.surprise ?? "#ff4f9a", "#f4f0e6", art.imagePalette?.secondary ?? "#ffd34e"];
  ctx.lineWidth = 13; ctx.lineCap = "round";
  const marks = art.doodleDensity === "low" ? 6 : art.doodleDensity === "medium" ? 12 : 18;
  for (let i = 0; i < marks; i++) {
    const angle = i * 2.399;
    const distance = 190 + (i % 3) * 45;
    ctx.strokeStyle = colors[i % colors.length];
    ctx.beginPath();
    ctx.moveTo(x + Math.cos(angle) * distance, y + Math.sin(angle) * distance);
    ctx.quadraticCurveTo(x + Math.cos(angle + .15) * (distance + 35), y + Math.sin(angle + .15) * (distance + 35), x + Math.cos(angle + .35) * (distance + 20), y + Math.sin(angle + .35) * (distance + 20));
    ctx.stroke();
  }
  ctx.restore();
  ctx.save(); ctx.beginPath(); ctx.arc(x, y, radius * .3, 0, Math.PI * 2); ctx.clip();
  if (art.image) {
    const image = await loadImage(art.image);
    const ratio = Math.max((radius * .6) / image.width, (radius * .6) / image.height);
    ctx.drawImage(image, x - image.width * ratio / 2, y - image.height * ratio / 2, image.width * ratio, image.height * ratio);
  } else { ctx.fillStyle = "#d9c74e"; ctx.fillRect(x - radius * .3, y - radius * .3, radius * .6, radius * .6); }
  ctx.restore();
  ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fillStyle = "#171715"; ctx.fill();
}

function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the uploaded image"));
    image.src = source;
  });
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(" "); let line = ""; let currentY = y;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) { ctx.fillText(line, x, currentY); line = word; currentY += lineHeight; }
    else line = test;
  }
  ctx.fillText(line, x, currentY);
}
