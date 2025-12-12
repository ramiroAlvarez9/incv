export default function Steps() {
  return (
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
  );
}
