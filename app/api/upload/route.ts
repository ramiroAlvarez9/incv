import { type NextRequest } from "next/server";
import {
  formatResumeData,
  getTimesUsed,
  incrementTimesUsed,
  isLinkedInResume,
} from "../../lib/helpers";
import { pdfToText } from "pdf-ts";

export async function POST(req: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
      };

      try {
        sendEvent({ message: "Checking IP limit..." });
        const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
        const timesUsed = await getTimesUsed(ip);

        if (timesUsed === null) {
          sendEvent({ error: "Could not verify request limit" });
          controller.close();
          return;
        }

        if (timesUsed >= 3) {
          sendEvent({ error: "Too many requests" });
          controller.close();
          return;
        }

        await incrementTimesUsed(ip);
        sendEvent({ message: "Processing PDF file..." });

        const formData = await req.formData();
        const pdfFile = formData.get("pdf") as File;
        if (!pdfFile) {
          sendEvent({ error: "No PDF file provided" });
          controller.close();
          return;
        }

        const pdfBuffer = await pdfFile.arrayBuffer();
        const text = await pdfToText(new Uint8Array(pdfBuffer));

        if (!isLinkedInResume(text)) {
          sendEvent({ error: "Not a LinkedIn resume" });
          controller.close();
          return;
        }

        sendEvent({ message: "Extracting and formatting data..." });
        const formattedData = await formatResumeData(text);

        sendEvent({ message: "Done!", data: formattedData });
        controller.close();
      } catch (error) {
        console.error("PDF processing error:", error);
        let errorMessage = "Failed to process PDF";
        if (error instanceof Error) {
          errorMessage = error.message;
        }
        sendEvent({ error: errorMessage });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
