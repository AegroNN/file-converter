import { readFile, writeFile } from "fs/promises";
import { PDFDocument } from "pdf-lib";
import sharp from "sharp";
import { getJob, updateJob } from "./jobs";

const IMAGE_EXTS = ["png", "jpg", "jpeg", "webp", "bmp", "tiff", "gif"];
const OFFICE_EXTS = ["docx", "xlsx", "pptx"];

export function runDocumentConversion(jobId: string): void {
  const job = getJob(jobId);
  if (!job) return;

  updateJob(jobId, { status: "processing", progress: 10 });

  const inputExt = job.inputPath.split(".").pop()?.toLowerCase() || "";
  const outputFmt = job.outputFormat.toLowerCase();

  let promise: Promise<void>;

  if (outputFmt === "pdf") {
    if (IMAGE_EXTS.includes(inputExt)) {
      promise = imageToPdf(job.inputPath, job.outputPath);
    } else if (OFFICE_EXTS.includes(inputExt)) {
      promise = officeToPdf(job.inputPath, job.outputPath);
    } else {
      promise = copyFile(job.inputPath, job.outputPath);
    }
  } else if (["png", "jpg", "jpeg", "webp"].includes(outputFmt)) {
    if (inputExt === "pdf") {
      promise = pdfToImage(job.inputPath, job.outputPath, outputFmt);
    } else {
      promise = imageToImage(job.inputPath, job.outputPath, outputFmt);
    }
  } else {
    promise = Promise.reject(new Error("Unsupported conversion"));
  }

  promise
    .then(() => {
      updateJob(jobId, { status: "done", progress: 100 });
    })
    .catch((err: Error) => {
      updateJob(jobId, { status: "error", error: err.message });
    });
}

async function imageToPdf(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const imageBuffer = await readFile(inputPath);
  const pngBuffer = await sharp(imageBuffer).png().toBuffer();

  const pdfDoc = await PDFDocument.create();
  const pngImage = await pdfDoc.embedPng(pngBuffer);

  const page = pdfDoc.addPage([pngImage.width, pngImage.height]);
  page.drawImage(pngImage, {
    x: 0,
    y: 0,
    width: pngImage.width,
    height: pngImage.height,
  });

  const pdfBytes = await pdfDoc.save();
  await writeFile(outputPath, pdfBytes);
}

async function pdfToImage(
  inputPath: string,
  outputPath: string,
  format: string
): Promise<void> {
  const mupdf = await import("mupdf");
  const data = await readFile(inputPath);

  const doc = mupdf.Document.openDocument(data, "application/pdf");
  const page = doc.loadPage(0);

  const bounds = page.getBounds();
  const scale = 2.0;
  const matrix = [scale, 0, 0, scale, 0, 0] as [
    number,
    number,
    number,
    number,
    number,
    number,
  ];
  const pixmap = page.toPixmap(
    matrix,
    mupdf.ColorSpace.DeviceRGB,
    false,
    true
  );

  const pngBuffer = pixmap.asPNG();

  if (format === "png") {
    await writeFile(outputPath, pngBuffer);
  } else {
    await sharp(Buffer.from(pngBuffer))
      .toFormat(format as keyof sharp.FormatEnum)
      .toFile(outputPath);
  }
}

async function officeToPdf(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const { promisify } = await import("util");
  const libre = await import("libreoffice-convert");
  const convertAsync = promisify(libre.convert);
  const input = await readFile(inputPath);
  const result = await convertAsync(input, ".pdf", undefined);
  await writeFile(outputPath, result);
}

async function imageToImage(
  inputPath: string,
  outputPath: string,
  format: string
): Promise<void> {
  await sharp(inputPath)
    .toFormat(format as keyof sharp.FormatEnum)
    .toFile(outputPath);
}

async function copyFile(
  inputPath: string,
  outputPath: string
): Promise<void> {
  const data = await readFile(inputPath);
  await writeFile(outputPath, data);
}
