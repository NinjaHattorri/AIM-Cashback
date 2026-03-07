'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';
import { jsPDF } from 'jspdf';

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
    setMessage('Generating PDF with QR Codes...');

    try {
      // Create PDF - A4 size (210mm x 297mm)
      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      for (let i = 0; i < generatedCodesList.length; i++) {
        const code = generatedCodesList[i];
        
        // Add a new page for every code except the first one
        if (i > 0) {
          pdf.addPage();
        }

        // Generate QR Code as DataURL
        const redemptionUrl = `${window.location.origin}/redeem?code=${code}`;
        const qrDataUrl = await QRCode.toDataURL(redemptionUrl, { 
          width: 500, 
          margin: 1,
          errorCorrectionLevel: 'H'
        });

        // Calculate centering
        const qrSize = 150; 
        const x = (210 - qrSize) / 2;
        const y = (297 - qrSize) / 2;

        pdf.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize);
        pdf.setFontSize(16);
        pdf.text(code, 105, y + qrSize + 15, { align: 'center' });
      }

      pdf.save(`cashback_qr_codes_${new Date().toISOString().slice(0, 10)}.pdf`);

      setMessage('QR Code PDF exported successfully!');
      setIsError(false);
    } catch (err) {
      console.error('PDF Export Error:', err);
      setMessage('Failed to export PDF.');
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
      <header style={styles.headerBar}>
        <div style={{...styles.logoContainer, cursor: 'pointer'}} onClick={() => router.push('/admin/dashboard')}>
          <span style={styles.logoTextMain}>AIM</span>
          <span style={styles.logoTextSub}>FILAMENTS</span>
        </div>
        <button onClick={() => router.push('/admin/dashboard')} style={styles.backButton}>Dashboard</button>
      </header>

      <main style={styles.mainContent}>
        <h1 style={styles.pageTitle}>Inventory Generation</h1>

        {message && (
          <p style={{ 
              ...styles.message, 
              color: isError ? 'var(--error-color)' : 'var(--success-color)',
              border: `1px solid ${isError ? 'var(--error-color)' : 'var(--success-color)'}`,
              backgroundColor: isError ? '#fff5f5' : '#f5fff5'
          }}>
            {message}
          </p>
        )}
        
        <div style={styles.grid}>
          {/* Random Generation Form */}
          <div style={styles.formContainer}>
            <h2 style={styles.subHeader}>Batch Generation</h2>
            <form onSubmit={handleRandomSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label htmlFor="numberOfCodes" style={styles.label}>Quantity</label>
                <input type="number" id="numberOfCodes" value={numberOfCodes} onChange={(e) => setNumberOfCodes(e.target.value)} min="1" max="10000" required style={styles.input} />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="randomExpiresAt" style={styles.label}>Expiry Date (Optional)</label>
                <input type="date" id="randomExpiresAt" value={randomExpiresAt} onChange={(e) => setRandomExpiresAt(e.target.value)} style={styles.input} />
              </div>
              <button type="submit" style={styles.button} disabled={isLoading}>
                {isLoading ? 'Processing...' : 'Generate New Batch'}
              </button>
              {generatedCodesList.length > 0 && (
                <button 
                  type="button" 
                  onClick={downloadCodes} 
                  style={{ ...styles.button, backgroundColor: 'var(--success-color)', marginTop: '10px' }}
                >
                  Download PDF Labels
                </button>
              )}
            </form>
          </div>

          {/* Custom Codes Form */}
          <div style={styles.formContainer}>
            <h2 style={styles.subHeader}>Manual Import</h2>
            <form onSubmit={handleCustomSubmit} style={styles.form}>
              <div style={styles.formGroup}>
                <label htmlFor="customCodes" style={styles.label}>Codes List (New line separated)</label>
                <textarea id="customCodes" value={customCodes} onChange={(e) => setCustomCodes(e.target.value)} required style={styles.textarea} rows="5" placeholder="CODE001&#10;CODE002&#10;CODE003" />
              </div>
              <div style={styles.formGroup}>
                <label htmlFor="customExpiresAt" style={styles.label}>Expiry Date (Optional)</label>
                <input type="date" id="customExpiresAt" value={customExpiresAt} onChange={(e) => setCustomExpiresAt(e.target.value)} style={styles.input} />
              </div>
              <button type="submit" style={{...styles.button, backgroundColor: 'var(--secondary-color)'}} disabled={isLoading}>
                {isLoading ? 'Importing...' : 'Confirm Manual Import'}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer style={styles.footer}>
        © {new Date().getFullYear()} Aim Filaments. All Rights Reserved.
      </footer>
    </div>
  );
}

const styles = {
  pageContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    backgroundColor: 'var(--background-color)',
  },
  headerBar: {
    backgroundColor: '#ffffff',
    padding: '15px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '3px solid var(--primary-color)',
    boxShadow: 'var(--shadow-sm)',
  },
  logoContainer: {
    display: 'flex',
    flexDirection: 'column',
    lineHeight: '1',
  },
  logoTextMain: {
    fontSize: '24px',
    fontWeight: '900',
    color: 'var(--secondary-color)',
    letterSpacing: '1px',
  },
  logoTextSub: {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--primary-color)',
    letterSpacing: '3px',
  },
  backButton: {
    backgroundColor: 'var(--secondary-color)',
    color: 'white',
    padding: '8px 20px',
    border: 'none',
    borderRadius: 'var(--border-radius)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  mainContent: {
    flex: 1,
    padding: '40px 20px',
    maxWidth: '1200px',
    width: '100%',
    margin: '0 auto',
  },
  pageTitle: {
    fontSize: '2em',
    fontWeight: '800',
    color: 'var(--secondary-color)',
    marginBottom: '30px',
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
    gap: '30px',
  },
  formContainer: {
    backgroundColor: '#ffffff',
    padding: '30px',
    borderRadius: 'var(--border-radius)',
    boxShadow: 'var(--shadow-md)',
    border: '1px solid var(--border-color)',
  },
  subHeader: {
    color: 'var(--secondary-color)',
    marginBottom: '25px',
    fontSize: '1.3em',
    fontWeight: '700',
    textTransform: 'uppercase',
    borderLeft: '4px solid var(--primary-color)',
    paddingLeft: '12px',
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
    color: 'var(--secondary-color)',
    fontWeight: '600',
    fontSize: '0.85em',
    textTransform: 'uppercase',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ced4da',
    borderRadius: 'var(--border-radius)',
    fontSize: '16px',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    padding: '12px',
    border: '1px solid #ced4da',
    borderRadius: 'var(--border-radius)',
    fontSize: '14px',
    outline: 'none',
    minHeight: '120px',
  },
  button: {
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    padding: '14px',
    border: 'none',
    borderRadius: 'var(--border-radius)',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  message: {
    marginBottom: '30px',
    padding: '15px',
    borderRadius: 'var(--border-radius)',
    textAlign: 'center',
    fontWeight: '500',
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    fontSize: '12px',
    color: 'var(--light-text-color)',
    backgroundColor: '#ffffff',
    borderTop: '1px solid #eee',
  }
};
