import "server-only";

import sharp from "sharp";

export async function createServerShareCard(input: {
  record: Buffer;
  recordType: string;
  catalogNumber: string;
  date: string;
  userMessage?: string;
}): Promise<Buffer> {
  const record = await sharp(input.record).resize(770, 770, { fit: "contain" }).png().toBuffer();
  const message = input.userMessage?.trim() ? `“${input.userMessage.trim().slice(0, 180)}”` : "";
  const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
    <rect width="1080" height="1920" fill="#171715"/>
    <g fill="#f4f0e6">
      <text x="90" y="120" font-family="Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="5">YOUR RECORD</text>
      <text x="990" y="120" text-anchor="end" font-family="Courier New, monospace" font-size="22">ONE OF ONE</text>
      <text x="90" y="1190" font-family="Courier New, monospace" font-size="22" letter-spacing="3">AFTERMARK PRESENTS</text>
      <text x="90" y="1310" font-family="Arial, sans-serif" font-size="88" font-weight="900">${escapeXml(input.recordType)}</text>
      ${message ? `<text x="90" y="1465" font-family="Georgia, serif" font-size="38" font-style="italic">${escapeXml(message)}</text>` : ""}
      <text x="90" y="1710" font-family="Courier New, monospace" font-size="25">${escapeXml(input.catalogNumber)}</text>
      <text x="990" y="1710" text-anchor="end" font-family="Courier New, monospace" font-size="25">${escapeXml(input.date.replaceAll("-", "."))}</text>
      <text x="90" y="1840" font-family="Arial, sans-serif" font-size="24" font-weight="700" letter-spacing="4">AFTERMARK</text>
      <text x="990" y="1840" text-anchor="end" font-family="Courier New, monospace" font-size="20" letter-spacing="2">MADE TO KEEP.</text>
    </g>
    <path d="M90 1770H990" stroke="#f4f0e6" stroke-opacity=".35"/>
  </svg>`);
  return sharp(svg).composite([{ input: record, left: 155, top: 285 }]).png().toBuffer();
}

function escapeXml(value: string): string {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&apos;",
    '"': "&quot;",
  })[character] ?? character);
}
