// ATS-optimized .docx generation.
//
// Applicant Tracking Systems parse text linearly, so this renderer is
// deliberately flat: no tables, no columns, no text boxes. Everything is a
// plain paragraph — headings carry semantic Word styles (Title / Heading 1)
// that ATS parsers and humans both understand, and the rest is normal body
// text with bullet lists. Visual polish is the PDF export's job; this file
// optimizes purely for machine readability.

import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
} from "docx";
import type {
  CategorizedTagsSection,
  CompactGridSection,
  DescriptionBlock,
  Resume,
  Section,
  ShowcaseSection,
  TimelineSection,
} from "../src/types.ts";
import type { Locale } from "./storage.ts";
import { formatDateRange, formatFlexibleDate } from "../src/pdf/format.ts";

// Render a description block list into flat paragraphs: paragraphs stay plain,
// bullets become a real Word bullet list (level 0) with an optional bold lead-in.
function descriptionParagraphs(blocks: DescriptionBlock[]): Paragraph[] {
  return blocks.map((block) => {
    if (block.type === "paragraph") {
      return new Paragraph({ children: [new TextRun(block.text)] });
    }
    const runs: TextRun[] = [];
    if (block.leadIn) {
      runs.push(new TextRun({ text: `${block.leadIn}: `, bold: true }));
    }
    runs.push(new TextRun(block.text));
    return new Paragraph({ children: runs, bullet: { level: 0 } });
  });
}

function sectionHeading(title: string): Paragraph {
  return new Paragraph({ text: title, heading: HeadingLevel.HEADING_1 });
}

function timelineParagraphs(
  section: TimelineSection,
  locale: Locale,
): Paragraph[] {
  const out: Paragraph[] = [sectionHeading(section.title)];
  for (const item of section.items) {
    out.push(
      new Paragraph({
        children: [
          new TextRun({ text: item.title, bold: true }),
          new TextRun({ text: ` — ${item.subtitle}`, bold: true }),
        ],
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: formatDateRange(item.dateRange, locale),
            italics: true,
          }),
        ],
      }),
      ...descriptionParagraphs(item.description),
    );
  }
  return out;
}

function compactGridParagraphs(
  section: CompactGridSection,
  locale: Locale,
): Paragraph[] {
  const out: Paragraph[] = [sectionHeading(section.title)];
  for (const item of section.items) {
    const runs: TextRun[] = [new TextRun({ text: item.title, bold: true })];
    if (item.subtitle) {
      runs.push(new TextRun({ text: ` — ${item.subtitle}` }));
    }
    if (item.date) {
      runs.push(
        new TextRun({ text: ` (${formatFlexibleDate(item.date, locale)})` }),
      );
    }
    out.push(new Paragraph({ children: runs }));
  }
  return out;
}

function showcaseParagraphs(section: ShowcaseSection): Paragraph[] {
  const out: Paragraph[] = [sectionHeading(section.title)];
  for (const item of section.items) {
    const headRuns: TextRun[] = [new TextRun({ text: item.title, bold: true })];
    if (item.techStack.length > 0) {
      headRuns.push(
        new TextRun({ text: ` [${item.techStack.join(", ")}]`, bold: true }),
      );
    }
    out.push(new Paragraph({ children: headRuns }));
    out.push(...descriptionParagraphs(item.description));
    // Links as plain text so ATS captures the URL alongside its label.
    for (const link of item.links) {
      const text = link.href ? `${link.label}: ${link.href}` : link.label;
      out.push(new Paragraph({ children: [new TextRun(text)] }));
    }
  }
  return out;
}

function categorizedTagsParagraphs(section: CategorizedTagsSection): Paragraph[] {
  const out: Paragraph[] = [sectionHeading(section.title)];
  for (const item of section.items) {
    out.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${item.category}: `, bold: true }),
          new TextRun(item.tags.join(", ")),
        ],
      }),
    );
  }
  return out;
}

function sectionParagraphs(section: Section, locale: Locale): Paragraph[] {
  switch (section.type) {
    case "timeline":
      return timelineParagraphs(section, locale);
    case "compactGrid":
      return compactGridParagraphs(section, locale);
    case "showcase":
      return showcaseParagraphs(section);
    case "categorizedTags":
      return categorizedTagsParagraphs(section);
  }
}

export async function buildResumeDocx(
  resume: Resume,
  locale: Locale,
): Promise<Buffer> {
  const children: Paragraph[] = [];

  // Header: name as the document Title, contacts on a single delimited line.
  children.push(
    new Paragraph({ text: resume.header.name, heading: HeadingLevel.TITLE }),
  );
  const contacts = resume.header.items
    .map((item) => item.text)
    .filter(Boolean)
    .join("  |  ");
  if (contacts) {
    children.push(new Paragraph({ children: [new TextRun(contacts)] }));
  }

  for (const section of resume.sections) {
    if (section.hidden) continue;
    children.push(...sectionParagraphs(section, locale));
  }

  const doc = new Document({
    title: resume.header.name,
    sections: [{ children }],
  });

  return Packer.toBuffer(doc);
}
