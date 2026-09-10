import { Document, Packer, Paragraph, TextRun, AlignmentType, Footer, PageNumber } from "docx";
import { saveAs } from "file-saver";

export interface DocxExportOptions {
  title: string;
  content: string;
  filename?: string;
  fontFamily?: string;
}

/**
 * Builds a docx Document instance with standard legal formatting.
 */
function buildLegalDocument(title: string, content: string, fontFamily: string = "Noto Sans Gujarati"): Document {
  const lines = (content || "").split("\n");
  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 360, after: 240 },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 32, // 16pt
          font: fontFamily,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { line: 360, after: 360 },
      children: [
        new TextRun({
          text: `Generated on: ${new Date().toLocaleString("en-IN")}`,
          italics: true,
          size: 18, // 9pt
          font: fontFamily,
        }),
      ],
    }),
  ];

  for (const line of lines) {
    if (!line.trim()) {
      children.push(
        new Paragraph({
          spacing: { line: 360, after: 120 },
          children: [
            new TextRun({
              text: "",
              font: fontFamily,
            }),
          ],
        })
      );
      continue;
    }

    children.push(
      new Paragraph({
        alignment: AlignmentType.JUSTIFIED,
        spacing: { line: 360, after: 240 }, // 1.5 line spacing (360 twips), 12pt (240 twips) space after
        children: [
          new TextRun({
            text: line,
            size: 24, // 12pt
            font: fontFamily,
          }),
        ],
      })
    );
  }

  return new Document({
    styles: {
      default: {
        document: {
          run: {
            font: fontFamily,
            size: 24, // 12pt
          },
          paragraph: {
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 360, after: 240 },
          },
        },
      },
    },
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: "Page ", font: fontFamily, size: 20 }),
                  new TextRun({ children: [PageNumber.CURRENT], font: fontFamily, size: 20 }),
                  new TextRun({ text: " of ", font: fontFamily, size: 20 }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], font: fontFamily, size: 20 }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });
}

/**
 * Programmatically generates and downloads a professionally formatted DOCX file.
 */
export async function downloadFormattedDocx({
  title,
  content,
  filename,
  fontFamily = "Noto Sans Gujarati",
}: DocxExportOptions): Promise<void> {
  const doc = buildLegalDocument(title, content, fontFamily);
  const blob = await Packer.toBlob(doc);
  const downloadName = filename
    ? filename.endsWith(".docx")
      ? filename
      : `${filename}.docx`
    : `${title.replace(/[^a-zA-Z0-9_-]/g, "_")}.docx`;

  saveAs(blob, downloadName);
}

/**
 * Generates base64 data URL for DOCX file to transmit to cloud backend.
 */
export async function generateDocxBase64({
  title,
  content,
  fontFamily = "Noto Sans Gujarati",
}: DocxExportOptions): Promise<string> {
  const doc = buildLegalDocument(title, content, fontFamily);
  const blob = await Packer.toBlob(doc);
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
