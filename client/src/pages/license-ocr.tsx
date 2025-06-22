import { useState } from "react";

export default function LicenseOCR() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    setFile(f || null);
  };

  const scan = async () => {
    if (!file) return;
    const form = new FormData();
    form.append("file", file);
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/paddle-ocr", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || res.statusText);
      }
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult(data.data);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Driver License OCR</h1>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <button
        className="border px-4 py-1 ml-2"
        onClick={scan}
        disabled={!file || loading}
      >
        {loading ? "Scanning..." : "Scan"}
      </button>
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {result && (
        <pre className="bg-gray-100 p-2 mt-4 rounded text-sm">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  );
}
