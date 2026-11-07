import PDFDocument from "pdfkit";
import type { SeekerProfile } from "@/lib/profile/types";

export type RenderCvInput = {
  profile: SeekerProfile;
  roleTitle: string;
  matchBullets?: string[];
};

export function cvFileName(profile: SeekerProfile, roleTitle: string): string {
  const name = (profile.fullName || "Candidate")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  const role = roleTitle
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 40);
  return `${name || "Candidate"}_${role || "Role"}_KaziCheck.pdf`;
}

/** Single-column ATS-friendly PDF. Facts only from the profile. */
export async function renderCvPdf(input: RenderCvInput): Promise<Buffer> {
  const { profile, roleTitle, matchBullets = [] } = input;

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: 48, bottom: 48, left: 54, right: 54 },
      info: {
        Title: `${profile.fullName || "CV"} — ${roleTitle}`,
        Author: profile.fullName || "Kazi Check",
        Creator: "Kazi Check",
      },
    });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const name = profile.fullName || "Your name";
    doc.font("Helvetica-Bold").fontSize(18).fillColor("#111").text(name);
    if (profile.headline) {
      doc.moveDown(0.2);
      doc.font("Helvetica").fontSize(11).fillColor("#333").text(profile.headline);
    }
    const contact = [
      profile.location,
      ...profile.links.filter((l) => !l.startsWith("mailto:") && !l.startsWith("tel:")),
      ...profile.links
        .filter((l) => l.startsWith("mailto:") || l.startsWith("tel:"))
        .map((l) => l.replace(/^mailto:|^tel:/, "")),
    ]
      .filter(Boolean)
      .join("  ·  ");
    if (contact) {
      doc.moveDown(0.25);
      doc.fontSize(9).fillColor("#555").text(contact);
    }

    doc.moveDown(0.6);
    section(doc, "Target role");
    doc.font("Helvetica").fontSize(10).fillColor("#222").text(roleTitle);

    if (matchBullets.length) {
      doc.moveDown(0.5);
      section(doc, "Selected highlights for this role");
      for (const b of matchBullets.slice(0, 4)) {
        bullet(doc, b);
      }
    }

    if (profile.summary) {
      doc.moveDown(0.5);
      section(doc, "Summary");
      doc.font("Helvetica").fontSize(10).fillColor("#222").text(profile.summary, {
        align: "left",
        lineGap: 2,
      });
    }

    if (profile.skills.length) {
      doc.moveDown(0.5);
      section(doc, "Skills");
      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#222")
        .text(profile.skills.join(", "), { lineGap: 2 });
    }

    if (profile.experience.length) {
      doc.moveDown(0.5);
      section(doc, "Experience");
      for (const exp of profile.experience.slice(0, 6)) {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#111")
          .text(exp.title || "Role");
        const meta = [exp.company, [exp.start, exp.end].filter(Boolean).join(" – ")]
          .filter(Boolean)
          .join("  ·  ");
        if (meta) {
          doc.font("Helvetica").fontSize(9).fillColor("#444").text(meta);
        }
        for (const b of exp.bullets ?? []) {
          bullet(doc, b);
        }
        doc.moveDown(0.35);
      }
    }

    if (profile.education.length) {
      doc.moveDown(0.2);
      section(doc, "Education");
      for (const edu of profile.education.slice(0, 4)) {
        doc
          .font("Helvetica-Bold")
          .fontSize(10)
          .fillColor("#111")
          .text(edu.school || "School");
        const meta = [edu.credential, edu.year].filter(Boolean).join("  ·  ");
        if (meta) {
          doc.font("Helvetica").fontSize(9).fillColor("#444").text(meta);
        }
        doc.moveDown(0.25);
      }
    }

    if (profile.languages.length) {
      doc.moveDown(0.2);
      section(doc, "Languages");
      doc.font("Helvetica").fontSize(10).fillColor("#222").text(profile.languages.join(", "));
    }

    doc.moveDown(1);
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#888")
      .text(
        "Prepared with Kazi Check for your own official application. We never auto-apply or pay fees for you.",
        { align: "left" },
      );

    doc.end();
  });
}

function section(doc: PDFKit.PDFDocument, title: string) {
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#0b3d2e").text(title.toUpperCase());
  doc
    .moveTo(doc.page.margins.left, doc.y + 2)
    .lineTo(doc.page.width - doc.page.margins.right, doc.y + 2)
    .strokeColor("#c5d5cc")
    .lineWidth(1)
    .stroke();
  doc.moveDown(0.45);
}

function bullet(doc: PDFKit.PDFDocument, text: string) {
  doc.font("Helvetica").fontSize(10).fillColor("#222").text(`• ${text}`, {
    indent: 8,
    lineGap: 1,
  });
}
