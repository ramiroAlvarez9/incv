"use client";

import {
  useState,
  useImperativeHandle,
  forwardRef,
  useRef,
  type ReactNode,
} from "react";

export type InfoModalHandle = {
  open: (title?: string, message?: string, steps?: ReactNode) => void;
};

const defaultContent = {
  title: "How the extractor works",
  message:
    "Drop or select your LinkedIn PDF resume, let the extractor parse the structured data, and preview it in the Harvard CV layout before downloading the DOCX template.",
  steps: (
    <ol className="p-4 mt-4 list-decimal list-inside space-y-3 text-gray-200">
      <li>Export your LinkedIn profile as a PDF resume from LinkedIn.</li>
      <li>
        Use the Upload tab to drag the file or click the drop zone and select
        it manually.
      </li>
      <li>
        Wait for the server to parse the file, then jump to the Harvard CV tab.
      </li>
      <li>
        When you are ready, click the download button to save the Harvard
        CV-themed DOCX.
      </li>
    </ol>
  ),
};

export default forwardRef<InfoModalHandle, {}>(function InfoModal(_props, ref) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [content, setContent] = useState<{
    title: string;
    message: string;
    steps: ReactNode;
  }>(defaultContent);

  const closeModal = () => {
    if (dialogRef.current) {
      dialogRef.current.close();
    }
  };

  useImperativeHandle(ref, () => ({
    open: (
      title = defaultContent.title,
      message = defaultContent.message,
      steps = defaultContent.steps,
    ) => {
      setContent({ title, message, steps });
      if (dialogRef.current && !dialogRef.current.open) {
        dialogRef.current.showModal();
      }
    },
  }));

  return (
    <dialog
      ref={dialogRef}
      className="m-auto w-3/4 md:w-full max-w-2xl rounded-3xl border border-gray-700 bg-gray-900 p-10 text-white shadow-2xl"
      aria-modal="true"
    >
      <div className="p-4 flex items-start justify-between gap-4">
        <h2 className="text-2xl font-semibold">{content.title}</h2>
        <button
          className="cursor-pointer text-gray-400 hover:text-white"
          onClick={closeModal}
          aria-label="Close native help dialog"
        >
          ✕
        </button>
      </div>
      <p className="p-4 text-gray-300 mt-4">{content.message}</p>
      {content.steps}
      <div className="p-4 mt-6 flex justify-end">
        <button
          className="cursor-pointer rounded-full bg-emerald-500 px-6 py-2 font-semibold text-black hover:bg-emerald-400 transition-colors"
          onClick={closeModal}
        >
          Got it
        </button>
      </div>
    </dialog>
  );
});
