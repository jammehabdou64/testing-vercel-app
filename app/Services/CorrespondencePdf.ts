export type CorrespondenceDocument = {
  fromMissionName: string;
  toMissionName: string;
  composedOn: string;
  body: string;
};

/**
 * Renders one letter as a PDF.
 * A fuller PDF library is still undecided. This writer keeps the file a real
 * PDF so storage and cleanup do not wait on that choice.
 */
export interface CorrespondencePdfWriter {
  render(document: CorrespondenceDocument): Uint8Array;
}

export class CorrespondencePdf implements CorrespondencePdfWriter {
  render(document: CorrespondenceDocument): Uint8Array {
    const lines = [
      `From: ${document.fromMissionName}`,
      `To: ${document.toMissionName}`,
      `Date: ${document.composedOn}`,
      "",
      ...document.body.split(/\r?\n/),
    ];
    const commands = ["BT", "/F1 12 Tf"];
    lines.forEach((line, index) => {
      const y = 720 - index * 16;
      commands.push(`1 0 0 1 72 ${y} Tm (${escapePdfText(line)}) Tj`);
    });
    commands.push("ET");

    return new TextEncoder().encode(pdfDocument(commands.join("\n")));
  }
}

function escapePdfText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}

function pdfDocument(stream: string): string {
  const objects = [
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n",
    `4 0 obj << /Length ${stream.length} >> stream\n${stream}\nendstream endobj\n`,
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n",
  ];
  let body = "%PDF-1.4\n";
  const offsets = [0];

  for (const object of objects) {
    offsets.push(body.length);
    body += object;
  }

  const xrefAt = body.length;
  let xref = "xref\n0 6\n0000000000 65535 f \n";
  for (let index = 1; index <= 5; index += 1) {
    xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }

  return `${body}${xref}trailer << /Size 6 /Root 1 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
}
