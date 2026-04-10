// ~/lib/pdf2img.ts
export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    isLoading = true;

    // @ts-ignore - pdfjs-dist doesn't have proper type definitions
    const pdfjs = await import("pdfjs-dist/build/pdf.mjs");

    // Set the worker source - use the local file from public folder
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

    pdfjsLib = pdfjs;
    isLoading = false;
    return pdfjsLib;
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        console.log("Starting PDF conversion for:", file.name);

        const lib = await loadPdfJs();
        console.log("PDF.js loaded successfully");

        const arrayBuffer = await file.arrayBuffer();
        console.log("PDF loaded, arrayBuffer size:", arrayBuffer.byteLength);

        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        console.log("PDF document loaded, pages:", pdf.numPages);

        const page = await pdf.getPage(1);
        console.log("First page loaded");

        const viewport = page.getViewport({ scale: 2 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
        }

        console.log("Rendering page to canvas...");
        await page.render({ canvasContext: context!, viewport }).promise;
        console.log("Page rendered successfully");

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });

                        console.log("Image created successfully, size:", blob.size);

                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        console.error("Failed to create blob from canvas");
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                0.95
            );
        });
    } catch (err) {
        console.error("PDF conversion error:", err);
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${err}`,
        };
    }
}