export type ForeignDirectoryMission = {
  name: string;
  country: string;
  address: string;
  email: string;
  phone: string;
  staff: ForeignDirectoryStaff[];
};

export type ForeignDirectoryStaff = {
  fullName: string;
  nationality: string;
  passportNumber: string;
  designation: string;
  countryRepresented: string;
  accreditationStartsOn: string;
  accreditationEndsOn: string | null;
  email: string | null;
  phone: string | null;
  dependents: ForeignDirectoryDependent[];
};

export type ForeignDirectoryDependent = {
  fullName: string;
  relationship: string;
};

export type ForeignDirectoryDocument = {
  missions: ForeignDirectoryMission[];
};

/** Renders the foreign diplomatic directory. A richer PDF library is still undecided. */
export interface ForeignDirectoryPdfWriter {
  render(document: ForeignDirectoryDocument): Uint8Array;
}

export class ForeignDirectoryPdf implements ForeignDirectoryPdfWriter {
  render(document: ForeignDirectoryDocument): Uint8Array {
    const lines = ["Foreign diplomatic directory"];
    for (const mission of document.missions) {
      lines.push(`Mission: ${mission.name}`);
      lines.push(`Country: ${mission.country}`);
      lines.push(`Address: ${mission.address}`);
      lines.push(`Email: ${mission.email}`);
      lines.push(`Phone: ${mission.phone}`);
      for (const member of mission.staff) {
        lines.push(`Staff: ${member.fullName}`);
        lines.push(`Nationality: ${member.nationality}`);
        lines.push(`Passport: ${member.passportNumber}`);
        lines.push(`Designation: ${member.designation}`);
        lines.push(`Represents: ${member.countryRepresented}`);
        lines.push(`Accreditation: ${member.accreditationStartsOn}`);
        if (member.accreditationEndsOn) {
          lines.push(`Accreditation ends: ${member.accreditationEndsOn}`);
        }
        if (member.email) {
          lines.push(`Staff email: ${member.email}`);
        }
        if (member.phone) {
          lines.push(`Staff phone: ${member.phone}`);
        }
        for (const dependent of member.dependents) {
          lines.push(`Dependent: ${dependent.fullName} (${dependent.relationship})`);
        }
      }
    }

    return new TextEncoder().encode(pdfDocument(lines));
  }
}

function pdfDocument(lines: string[]): string {
  const commands = ["BT", "/F1 11 Tf"];
  lines.forEach((line, index) => {
    const y = 760 - index * 14;
    commands.push(`1 0 0 1 48 ${y} Tm (${escapePdfText(line)}) Tj`);
  });
  commands.push("ET");
  const stream = commands.join("\n");
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

function escapePdfText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/[^\x20-\x7E]/g, "?");
}
