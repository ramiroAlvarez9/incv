"use client";
import "./globals.css";
import { useState, useRef, useEffect } from "react";
import { CVSchema, type CV } from "./schemas/cv";
import * as v from "valibot";
import HarvardCV from "./components/harvardCv";
import { downloadDocx } from "./utils/docxGenerator";
import InfoModal, { type InfoModalHandle } from "./components/InfoModal";

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const infoModalRef = useRef<InfoModalHandle>(null);
  const [activeTab, setActiveTab] = useState<"upload" | "harvard-cv">("upload");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<string>("");
  const [cvData, setCvData] = useState<CV | null>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.includes("pdf")) {
      setUploadStatus("Please select a PDF file");
      return;
    }

    setIsLoading(true);
    setUploadStatus("Starting upload...");

    try {
      const formData = new FormData();
      formData.append("pdf", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.body) {
        throw new Error("No response body");
      }

      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += value;
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const eventData = JSON.parse(line.substring(6));
            if (eventData.error) {
              if (eventData.error === "Too many requests") {
                infoModalRef.current?.open(
                  "Too Many Requests",
                  "You have made too many requests for this IP address. The limit will be reset in 24 hours.",
                  null,
                );
                throw new Error("Too many requests");
              }
              throw new Error(eventData.error);
            }

            if (eventData.message) {
              setUploadStatus(eventData.message);
            }

            if (eventData.data) {
              const parsedCv = v.parse(CVSchema, eventData.data);
              localStorage.setItem("parsedCv", JSON.stringify(parsedCv));
              setCvData(parsedCv);
              setActiveTab("harvard-cv");
              setUploadStatus("PDF processed successfully!");
            }
          }
        }
      }
    } catch (error) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadStatus(`Error: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };


  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      handleFileUpload(files[0]);
    }
  };

  const handleDownloadDocx = async () => {
    if (!cvData) return;
    try {
      await downloadDocx(cvData, `${cvData.name.replace(/\s+/g, "_")}_Harvard_CV.docx`);
    } catch (error) {
      console.error("Error generating DOCX:", error);
    }
  };

  useEffect(() => {
    try {
      const storedCv = localStorage.getItem("parsedCv");
      if (storedCv) {
        const parsedCv = JSON.parse(storedCv);
        if (v.safeParse(CVSchema, parsedCv).success) {
          setCvData(parsedCv);
          setActiveTab("harvard-cv");
        }
      }
    } catch (error) {
      console.error("Failed to parse CV from localStorage", error);
      localStorage.removeItem("parsedCv");
    }
  }, []);



  return (
    <div className="w-screen min-h-screen bg-gray-800 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap justify-center gap-3 mb-4">
          <button
            onClick={() => infoModalRef.current?.open()}
            className="cursor-pointer border border-emerald-500 text-emerald-300 px-4 py-2 rounded hover:bg-emerald-500/10 transition-colors"
          >
            How it works
          </button>
        </div>
        <h1 className="p-8 text-3xl font-bold mb-8 text-center">LinkedIn PDF to Harvard CV</h1>
        <div className="flex mb-8 border-b border-gray-700">
          <button
            onClick={() => setActiveTab("upload")}
            className={`cursor-pointer px-6 py-3 font-medium transition-colors ${activeTab === "upload" ? "border-b-2 border-blue-500 text-blue-400" : "text-gray-400 hover:text-white"
              }`}
          >
            Upload PDF
          </button>
          <button
            onClick={() => setActiveTab("harvard-cv")}
            className={`cursor-pointer px-6 py-3 font-medium transition-all duration-200 rounded-t-lg ${activeTab === "harvard-cv"
              ? "border-b-2 border-emerald-500 text-emerald-400 bg-emerald-500/10 shadow-lg"
              : "text-gray-400 hover:text-white hover:bg-gray-700/50 hover:shadow-md"
              }`}
          >
            🎓 Harvard CV
          </button>
        </div>
        {activeTab === "upload" && (
          <div className="bg-gray-800 rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-6">Upload LinkedIn PDF Resume</h2>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-300">
                  {uploadStatus || "Processing..."}
                </p>
              </div>
            ) : (
              <div>
                <div
                  className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors"
                  onDrop={(e: React.DragEvent<HTMLDivElement>) => {
                    e.preventDefault();
                    const files = e.dataTransfer?.files;
                    if (files && files[0]) {
                      handleFileUpload(files[0]);
                    }
                  }}
                  onDragOver={(e: React.DragEvent<HTMLDivElement>) => {
                    e.preventDefault();
                  }}
                  onClick={() => {
                    fileInputRef.current?.click();
                  }}
                >
                  <div className="text-4xl mb-4">📄</div>
                  <p className="text-lg font-medium mb-2">Choose PDF File</p>
                  <p className="text-gray-400 mb-4">Drop your LinkedIn PDF resume here or click to select</p>
                  <input ref={fileInputRef} type="file" accept=".pdf" onChange={handleFileInput} className="hidden" />
                </div>
                {uploadStatus && !isLoading && (
                  <div className="mt-4 text-center">
                    <p
                      className={
                        uploadStatus.includes("Error") || uploadStatus.includes("failed")
                          ? "text-red-400"
                          : "text-green-400"
                      }
                    >
                      {uploadStatus}
                    </p>
                  </div>
                )}
              </div>
            )}
            <footer className="mt-8 text-center text-gray-500">
              <p>
                100% Bug-Free ( Maybe) - Made by{" "}
                <a
                  href="https://github.com/ramiroAlvarez9"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  Ramiro Alvarez
                </a>
              </p>
            </footer>
          </div>
        )}

        {activeTab === "harvard-cv" && (
          <div className="bg-gray-800 rounded-lg p-8">
            <div className="flex justify-center items-center p-4">
              <button
                onClick={handleDownloadDocx}
                disabled={!cvData}
                className="cursor-pointer px-4 py-2 bg-emerald-600 lg:hover:bg-emerald-700 text-white font-medium rounded-lg transition-all duration-200 shadow-md lg:hover:shadow-lg lg:hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                📥 Download .docx
              </button>
            </div>
            <div className="flex justify-center">
              <div className="bg-white shadow-lg w-full max-w-full p-0">
                {cvData ? (
                  <HarvardCV cvData={cvData} />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500 p-8">
                    <p>No data available yet. Upload a LinkedIn PDF to generate the Harvard CV.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <InfoModal ref={infoModalRef} />
    </div>
  );
}
