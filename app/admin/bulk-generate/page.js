'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

export default function BulkGeneratePage() {
  // State for random generation
  const [numberOfCodes, setNumberOfCodes] = useState(10);
  const [randomExpiresAt, setRandomExpiresAt] = useState('');
  const [generatedCodesList, setGeneratedCodesList] = useState([]);
  
  // State for custom code import
  const [customCodes, setCustomCodes] = useState('');
  const [customExpiresAt, setCustomExpiresAt] = useState('');

  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRandomSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setIsLoading(true);

    try {
      const response = await fetch('/api/admin/bulk-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          count: parseInt(numberOfCodes, 10),
          expiresAt: randomExpiresAt || null,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setMessage(`Successfully generated ${data.count} random codes!`);
        setGeneratedCodesList(data.codes);
        setIsError(false);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadCodes = async () => {
    if (generatedCodesList.length === 0) return;
    setIsLoading(true);
    setMessage('Generating QR Codes...');

    try {
      const qrCodesHtml = await Promise.all(generatedCodesList.map(async (code) => {
        const redemptionUrl = `${window.location.origin}/redeem?code=${code}`;
        const qrDataUrl = await QRCode.toDataURL(redemptionUrl, { width: 200, margin: 2 });
        return `
          <div style="display: inline-block; margin: 15px; padding: 15px; border: 1px solid #ccc; text-align: center; font-family: sans-serif; border-radius: 8px; width: 220px;">
            <img src="${qrDataUrl}" alt="${code}" style="width: 200px; height: 200px;" />
            <div style="margin-top: 10px; font-weight: bold; font-size: 1.2em; letter-spacing: 1px;">${code}</div>
            <div style="font-size: 0.8em; color: #666; margin-top: 5px;">Scan to Redeem Cashback</div>
          </div>
        `;
      }));

      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cashback QR Codes</title>
          <style>
            body { margin: 0; padding: 20px; font-family: sans-serif; }
            @media print {
              .no-print { display: none; }
              div { page-break-inside: avoid; }
            }
            .qr-container { display: flex; flex-wrap: wrap; justify-content: center; }
          </style>
        </head>
        <body>
          <div class="no-print" style="padding: 20px; background: #f8f9fa; border-bottom: 2px solid #dee2e6; margin-bottom: 30px; text-align: center; border-radius: 8px;">
            <h1 style="margin-top: 0;">Cashback QR Codes Generation</h1>
            <p>Generated ${generatedCodesList.length} codes on ${new Date().toLocaleString()}</p>
            <button onclick="window.print()" style="padding: 12px 25px; cursor: pointer; font-size: 16px; background-color: #007bff; color: white; border: none; border-radius: 5px; font-weight: bold;">Print QR Codes / Save as PDF</button>
          </div>
          <div class="qr-container">
            ${qrCodesHtml.join('')}
          </div>
        </body>
        </html>
      `;

      const element = document.createElement("a");
      const file = new Blob([htmlContent], {type: 'text/html'});
      element.href = URL.createObjectURL(file);
      element.download = `cashback_qr_codes_${new Date().toISOString().slice(0, 10)}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
      setMessage('QR Codes generated successfully!');
      setIsError(false);
    } catch (err) {
      console.error('QR Generation Error:', err);
      setMessage('Failed to generate QR codes.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setIsLoading(true);

    const codesArray = customCodes.split('\n').map(code => code.trim()).filter(code => code);
    if (codesArray.length === 0) {
        setMessage('Please paste at least one code.');
        setIsError(true);
        setIsLoading(false);
        return;
    }

    try {
        const response = await fetch('/api/admin/custom-codes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                codes: codesArray,
                expiresAt: customExpiresAt || null,
            }),
        });

        const data = await response.json();
        if (data.success) {
            setMessage(`Successfully processed codes. Inserted: ${data.insertedCount}. Duplicates skipped: ${data.duplicateCount}.`);
            setIsError(false);
            setCustomCodes('');
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        setMessage(error.message);
        setIsError(true);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.headerBar}>
        <button onClick={() => router.back()} style={styles.backButton}>&larr; Back to Dashboard</button>
        <h1 style={styles.header}>Manage Codes</h1>
      </div>

      {message && (
        <p style={{ ...styles.message, color: isError ? 'var(--error-color)' : 'var(--success-color)', backgroundColor: isError ? '#f8d7da' : '#d4edda' }}>
          {message}
        </p>
      )}
      
      <div style={styles.grid}>
        {/* Random Generation Form */}
        <div style={styles.formContainer}>
          <h2 style={styles.subHeader}>Generate Random Codes</h2>
          <form onSubmit={handleRandomSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="numberOfCodes" style={styles.label}>Number of Codes</label>
              <input type="number" id="numberOfCodes" value={numberOfCodes} onChange={(e) => setNumberOfCodes(e.target.value)} min="1" max="10000" required style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="randomExpiresAt" style={styles.label}>Expiration Date (Optional)</label>
              <input type="date" id="randomExpiresAt" value={randomExpiresAt} onChange={(e) => setRandomExpiresAt(e.target.value)} style={styles.input} />
            </div>
            <button type="submit" style={styles.button} disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Random Codes'}
            </button>
            {generatedCodesList.length > 0 && (
              <button 
                type="button" 
                onClick={downloadCodes} 
                style={{ ...styles.button, backgroundColor: 'var(--success-color)', marginTop: '10px' }}
              >
                Export QR Codes (.html)
              </button>
            )}
          </form>
        </div>

        {/* Custom Codes Form */}
        <div style={styles.formContainer}>
          <h2 style={styles.subHeader}>Import Custom Codes</h2>
          <form onSubmit={handleCustomSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="customCodes" style={styles.label}>Paste Codes (one per line)</label>
              <textarea id="customCodes" value={customCodes} onChange={(e) => setCustomCodes(e.target.value)} required style={styles.textarea} rows="5" placeholder="CODE123&#10;CODE456&#10;CODE789" />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="customExpiresAt" style={styles.label}>Expiration Date (Optional)</label>
              <input type="date" id="customExpiresAt" value={customExpiresAt} onChange={(e) => setCustomExpiresAt(e.target.value)} style={styles.input} />
            </div>
            <button type="submit" style={styles.button} disabled={isLoading}>
              {isLoading ? 'Importing...' : 'Import Custom Codes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    fontFamily: 'var(--font-family, Arial, sans-serif)',
    padding: '20px',
    maxWidth: '1200px',
    margin: '20px auto',
  },
  headerBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
    borderBottom: '1px solid var(--border-color, #eee)',
    paddingBottom: '15px',
    marginBottom: '30px',
  },
  header: {
    color: 'var(--text-color, #333)',
    margin: 0,
    fontSize: '1.8em',
  },
  backButton: {
    background: 'none',
    border: 'none',
    color: 'var(--primary-color, #007bff)',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '30px',
  },
  formContainer: {
    backgroundColor: 'var(--form-background-color, #fff)',
    padding: '30px',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
  },
  subHeader: {
    textAlign: 'center',
    color: 'var(--text-color, #333)',
    marginBottom: '25px',
    fontSize: '1.4em',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
  },
  formGroup: {
    marginBottom: '20px',
  },
  label: {
    marginBottom: '8px',
    display: 'block',
    color: 'var(--light-text-color, #666)',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid var(--border-color, #ccc)',
    borderRadius: '8px',
    boxSizing: 'border-box',
    fontSize: '16px',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid var(--border-color, #ccc)',
    borderRadius: '8px',
    boxSizing: 'border-box',
    fontFamily: 'monospace',
    fontSize: '14px',
  },
  button: {
    backgroundColor: 'var(--primary-color, #007bff)',
    color: 'white',
    padding: '12px 15px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '10px',
  },
  message: {
    marginBottom: '20px',
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
  }
};
