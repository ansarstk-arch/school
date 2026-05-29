import { useState } from "react";
import pdfMake from "pdfmake/build/pdfmake";

/**
 * PDF Test Component - Temporary diagnostic tool
 * Add this to any page to test PDF functionality
 */
export function PdfTest() {
  const [log, setLog] = useState([]);

  const addLog = (message) => {
    console.log(message);
    setLog(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  // Test 1: Simple PDF without fonts
  const testSimplePDF = () => {
    try {
      addLog("Testing simple PDF...");
      const docDef = {
        content: [
          { text: 'Simple Test PDF', fontSize: 20 },
          { text: 'If you can download this, pdfMake works!', fontSize: 12 },
          { text: `Generated at: ${new Date().toLocaleString()}`, fontSize: 10 }
        ]
      };
      pdfMake.createPdf(docDef).download('simple-test.pdf');
      addLog("✅ Simple PDF download triggered");
    } catch (error) {
      addLog(`❌ Simple PDF failed: ${error.message}`);
    }
  };

  // Test 2: Check font files
  const testFontAccess = async () => {
    try {
      addLog("Checking font files...");
      
      const regularResponse = await fetch('/Amiri-Regular.ttf');
      addLog(`Amiri-Regular.ttf: ${regularResponse.ok ? '✅' : '❌'} (${regularResponse.status})`);
      
      const boldResponse = await fetch('/Amiri-Bold.ttf');
      addLog(`Amiri-Bold.ttf: ${boldResponse.ok ? '✅' : '❌'} (${boldResponse.status})`);
      
    } catch (error) {
      addLog(`❌ Font check failed: ${error.message}`);
    }
  };

  // Test 3: PDF with Pashto text
  const testPashtoPDF = async () => {
    try {
      addLog("Testing Pashto PDF...");
      
      // Load fonts
      addLog("Loading fonts...");
      const toBase64 = async (url) => {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i += 0x8000) {
          binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        }
        return btoa(binary);
      };

      const [regular, bold] = await Promise.all([
        toBase64("/Amiri-Regular.ttf"),
        toBase64("/Amiri-Bold.ttf"),
      ]);

      pdfMake.vfs = pdfMake.vfs || {};
      pdfMake.vfs["Amiri-Regular.ttf"] = regular;
      pdfMake.vfs["Amiri-Bold.ttf"] = bold;

      pdfMake.fonts = {
        Amiri: {
          normal: "Amiri-Regular.ttf",
          bold: "Amiri-Bold.ttf",
          italics: "Amiri-Regular.ttf",
          bolditalics: "Amiri-Bold.ttf",
        },
      };

      addLog("✅ Fonts loaded");

      // Create PDF with Pashto
      const docDef = {
        content: [
          { text: 'ښوونکي', font: 'Amiri', fontSize: 20, bold: true },
          { text: 'د ښوونکو لیست', font: 'Amiri', fontSize: 14 },
          { text: 'احمد، محمد، فاطمه', font: 'Amiri', fontSize: 12 },
        ],
        defaultStyle: {
          font: 'Amiri'
        }
      };

      pdfMake.createPdf(docDef).download('pashto-test.pdf');
      addLog("✅ Pashto PDF download triggered");
      
    } catch (error) {
      addLog(`❌ Pashto PDF failed: ${error.message}`);
    }
  };

  // Test 4: Alternative download method
  const testBlobDownload = () => {
    try {
      addLog("Testing blob download method...");
      const docDef = {
        content: [
          { text: 'Blob Download Test', fontSize: 20 },
          { text: 'Using createObjectURL method', fontSize: 12 }
        ]
      };

      pdfMake.createPdf(docDef).getBlob((blob) => {
        try {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = 'blob-test.pdf';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          addLog("✅ Blob download triggered");
        } catch (err) {
          addLog(`❌ Blob download failed: ${err.message}`);
        }
      });
    } catch (error) {
      addLog(`❌ Blob test failed: ${error.message}`);
    }
  };

  // Test 5: Open in new tab
  const testOpenInTab = () => {
    try {
      addLog("Testing open in new tab...");
      const docDef = {
        content: [
          { text: 'Open in Tab Test', fontSize: 20 },
          { text: 'This should open in a new browser tab', fontSize: 12 }
        ]
      };
      pdfMake.createPdf(docDef).open();
      addLog("✅ Open in tab triggered");
    } catch (error) {
      addLog(`❌ Open in tab failed: ${error.message}`);
    }
  };

  const clearLog = () => setLog([]);

  return (
    <div className="fixed bottom-4 right-4 bg-white border-2 border-gray-300 rounded-lg shadow-xl p-4 max-w-md z-50">
      <h3 className="font-bold text-lg mb-3">PDF Diagnostic Tool</h3>
      
      <div className="space-y-2 mb-3">
        <button onClick={testSimplePDF} className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">
          1. Test Simple PDF
        </button>
        <button onClick={testFontAccess} className="w-full px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm">
          2. Check Font Files
        </button>
        <button onClick={testPashtoPDF} className="w-full px-3 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm">
          3. Test Pashto PDF
        </button>
        <button onClick={testBlobDownload} className="w-full px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 text-sm">
          4. Test Blob Download
        </button>
        <button onClick={testOpenInTab} className="w-full px-3 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 text-sm">
          5. Open in New Tab
        </button>
        <button onClick={clearLog} className="w-full px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm">
          Clear Log
        </button>
      </div>

      <div className="bg-gray-100 rounded p-2 max-h-60 overflow-y-auto">
        <div className="text-xs font-mono">
          {log.length === 0 ? (
            <div className="text-gray-500">Click a test button above...</div>
          ) : (
            log.map((entry, i) => (
              <div key={i} className="mb-1">{entry}</div>
            ))
          )}
        </div>
      </div>

      <div className="mt-2 text-xs text-gray-600">
        Also check browser console (F12) for detailed logs
      </div>
    </div>
  );
}
