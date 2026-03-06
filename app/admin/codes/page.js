'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import QRCode from 'qrcode';

function QRModal({ code, onClose }) {
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    if (code) {
      const redemptionUrl = `${window.location.origin}/redeem?code=${code}`;
      QRCode.toDataURL(redemptionUrl, { width: 300, margin: 2 })
        .then(url => setQrDataUrl(url))
        .catch(err => console.error(err));
    }
  }, [code]);

  if (!code) return null;

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h2 style={{marginTop: 0}}>{code}</h2>
        {qrDataUrl ? (
          <img src={qrDataUrl} alt={`QR for ${code}`} style={{width: '250px', height: '250px'}} />
        ) : (
          <p>Generating QR...</p>
        )}
        <div style={{marginTop: '20px'}}>
          <button onClick={onClose} style={styles.cancelButton}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCodesPage() {
  const [codes, setCodes] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ status: '', cashbackAmount: 0, expiresAt: '' });
  const [viewingQrCode, setViewingQrCode] = useState(null);
  
  const router = useRouter();

  const fetchCodes = async (query = '') => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/admin/codes?q=${query}`);
      const data = await response.json();

      if (data.success) {
        setCodes(data.data);
      } else {
        setMessage(`Error: ${data.message}`);
        setIsError(true);
      }
    } catch (error) {
      console.error('Failed to fetch codes:', error);
      setMessage('An unexpected error occurred while fetching codes.');
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCodes(searchQuery);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleEditClick = (codeItem) => {
    setEditingId(codeItem._id);
    setEditForm({
      status: codeItem.status,
      cashbackAmount: codeItem.cashbackAmount || 0,
      expiresAt: codeItem.expiresAt ? new Date(codeItem.expiresAt).toISOString().split('T')[0] : ''
    });
  };

  const handleSaveEdit = async (id) => {
    try {
      const response = await fetch('/api/admin/codes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...editForm }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage('Code updated successfully!');
        setIsError(false);
        setEditingId(null);
        fetchCodes(searchQuery);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setMessage(`Update failed: ${error.message}`);
      setIsError(true);
    }
  };

  const handleDeleteCode = async (id) => {
    if (!window.confirm('Are you sure you want to delete this code? Users scanning its QR will get an "Invalid Code" message.')) {
      return;
    }

    try {
      const response = await fetch('/api/admin/codes', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const data = await response.json();

      if (data.success) {
        setMessage('Code deleted successfully!');
        setIsError(false);
        fetchCodes(searchQuery);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      setMessage(`Delete failed: ${error.message}`);
      setIsError(true);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getStatusChip = (status) => {
    const style = {
      ...styles.statusChip,
      backgroundColor: status === 'redeemed' ? 'var(--success-color)' : (status === 'expired' ? 'var(--error-color)' : '#6c757d'),
    };
    return <span style={style}>{status}</span>;
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.headerBar}>
        <button onClick={() => router.back()} style={styles.backButton}>&larr; Back to Dashboard</button>
        <h1 style={styles.header}>Manage Cashback Codes</h1>
      </div>

      <div style={styles.searchContainer}>
        <input
          type="text"
          placeholder="Search by code..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={styles.searchInput}
        />
      </div>
      
      {message && (
        <p style={{ 
          ...styles.message, 
          color: isError ? 'var(--error-color)' : 'var(--success-color)',
          backgroundColor: isError ? '#f8d7da' : '#d4edda'
        }}>
          {message}
        </p>
      )}

      <div style={styles.tableContainer}>
        {isLoading ? (
          <p style={styles.loading}>Loading codes...</p>
        ) : codes.length === 0 ? (
          <p style={styles.noData}>No codes found matching your search.</p>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Code</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Amount</th>
                <th style={styles.th}>Expires At</th>
                <th style={styles.th}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((codeItem) => (
                <tr key={codeItem._id}>
                  <td style={styles.td}><strong>{codeItem.code}</strong></td>
                  <td style={styles.td}>
                    {editingId === codeItem._id ? (
                      <select 
                        value={editForm.status} 
                        onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                        style={styles.editInput}
                      >
                        <option value="generated">generated</option>
                        <option value="pending_redemption">pending_redemption</option>
                        <option value="redeemed">redeemed</option>
                        <option value="expired">expired</option>
                      </select>
                    ) : (
                      getStatusChip(codeItem.status)
                    )}
                  </td>
                  <td style={styles.td}>
                    {editingId === codeItem._id ? (
                      <input 
                        type="number" 
                        value={editForm.cashbackAmount} 
                        onChange={(e) => setEditForm({...editForm, cashbackAmount: e.target.value})}
                        style={styles.editInput}
                      />
                    ) : (
                      codeItem.cashbackAmount > 0 ? `₹${codeItem.cashbackAmount}` : 'N/A'
                    )}
                  </td>
                  <td style={styles.td}>
                    {editingId === codeItem._id ? (
                      <input 
                        type="date" 
                        value={editForm.expiresAt} 
                        onChange={(e) => setEditForm({...editForm, expiresAt: e.target.value})}
                        style={styles.editInput}
                      />
                    ) : (
                      formatDate(codeItem.expiresAt)
                    )}
                  </td>
                  <td style={styles.td}>
                    {editingId === codeItem._id ? (
                      <div style={styles.actionButtons}>
                        <button onClick={() => handleSaveEdit(codeItem._id)} style={styles.saveButton}>Save</button>
                        <button onClick={() => setEditingId(null)} style={styles.cancelButton}>Cancel</button>
                      </div>
                    ) : (
                      <div style={styles.actionButtons}>
                        <button onClick={() => setViewingQrCode(codeItem.code)} style={styles.viewQrButton}>View QR</button>
                        <button onClick={() => handleEditClick(codeItem)} style={styles.editButton}>Edit</button>
                        <button onClick={() => handleDeleteCode(codeItem._id)} style={styles.deleteButton}>Delete</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <QRModal code={viewingQrCode} onClose={() => setViewingQrCode(null)} />
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
  searchContainer: {
    marginBottom: '20px',
  },
  searchInput: {
    width: '100%',
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid var(--border-color, #ddd)',
    fontSize: '16px',
    boxSizing: 'border-box',
  },
  message: {
    padding: '15px',
    borderRadius: '8px',
    textAlign: 'center',
    marginBottom: '20px',
  },
  loading: {
    textAlign: 'center',
    fontSize: '1.1em',
    color: 'var(--light-text-color, #666)',
  },
  noData: {
    textAlign: 'center',
    fontSize: '1.1em',
    color: '#888',
    padding: '40px',
    backgroundColor: 'var(--form-background-color, #fff)',
    borderRadius: '12px',
  },
  tableContainer: {
    overflowX: 'auto',
    backgroundColor: 'var(--form-background-color, #fff)',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
    padding: '20px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  th: {
    borderBottom: '2px solid var(--border-color, #ddd)',
    padding: '12px 15px',
    textAlign: 'left',
    fontWeight: '600',
    color: 'var(--light-text-color, #666)',
  },
  td: {
    borderBottom: '1px solid var(--border-color, #ddd)',
    padding: '12px 15px',
    textAlign: 'left',
  },
  statusChip: {
    padding: '4px 10px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '0.8em',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  viewQrButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px',
  },
  editButton: {
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px',
  },
  deleteButton: {
    backgroundColor: 'var(--error-color)',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  saveButton: {
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
    marginRight: '5px',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    padding: '6px 12px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  actionButtons: {
    display: 'flex',
  },
  editInput: {
    padding: '5px',
    borderRadius: '4px',
    border: '1px solid #ccc',
    width: '100%',
    boxSizing: 'border-box',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '12px',
    textAlign: 'center',
    maxWidth: '400px',
    width: '90%',
  }
};
