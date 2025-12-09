'use client';

import { useState } from 'react';

export default function RedeemPage() {
  const [step, setStep] = useState('details'); // 'details', 'otp', 'payment', 'complete'
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [finalCashbackAmount, setFinalCashbackAmount] = useState(0);

  // Payment details state
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' or 'bank'
  const [upiId, setUpiId] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');

  const handleDetailsSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setIsLoading(true);

    try {
      const validateRes = await fetch('/api/validate-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const validateData = await validateRes.json();

      if (!validateData.success) {
        throw new Error(validateData.message);
      }
      
      setMessage('Code valid! Sending OTP...');
      const otpRes = await fetch('/api/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile }),
      });
      const otpData = await otpRes.json();

      if (otpData.success) {
        setMessage(`OTP sent to ${mobile}. Please enter it below. (Test OTP: ${otpData.otp})`);
        setIsError(false);
        setStep('otp');
      } else {
        throw new Error(otpData.message);
      }
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setIsLoading(true);

    try {
      const verifyRes = await fetch('/api/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp }),
      });
      const verifyData = await verifyRes.json();

      if (verifyData.success) {
        setMessage('OTP Verified! Please enter your payment details.');
        setIsError(false);
        setStep('payment');
      } else {
        throw new Error(verifyData.message);
      }
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setIsError(false);
    setIsLoading(true);

    try {
      const paymentDetails = {
        code,
        buyerName: name,
        buyerMobile: mobile,
        paymentMethod,
        upiId: paymentMethod === 'upi' ? upiId : undefined,
        bankDetails: paymentMethod === 'bank' ? { accountNumber, ifscCode, accountHolderName } : undefined,
      };

      const redeemRes = await fetch('/api/redeem-payout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(paymentDetails),
      });
      const redeemData = await redeemRes.json();

      if (redeemData.success) {
        setFinalCashbackAmount(redeemData.data.cashbackAmount);
        setMessage(`Cashback of ₹${redeemData.data.cashbackAmount} successfully redeemed!`);
        setIsError(false);
        setStep('complete');
      } else {
        throw new Error(redeemData.message);
      }
    } catch (error) {
      setMessage(error.message);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 'details':
        return (
          <form onSubmit={handleDetailsSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="code" style={styles.label}>Cashback Code</label>
              <input type="text" id="code" value={code} onChange={(e) => setCode(e.target.value)} required style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="name" style={styles.label}>Your Name</label>
              <input type="text" id="name" value={name} onChange={(e) => setName(e.target.value)} required style={styles.input} />
            </div>
            <div style={styles.formGroup}>
              <label htmlFor="mobile" style={styles.label}>Mobile Number</label>
              <input type="tel" id="mobile" value={mobile} onChange={(e) => setMobile(e.target.value)} pattern="[0-9]{10}" title="Please enter a 10-digit mobile number" required style={styles.input} />
            </div>
            <button type="submit" style={styles.button} disabled={isLoading}>{isLoading ? 'Validating...' : 'Get OTP'}</button>
          </form>
        );
      case 'otp':
        return (
          <form onSubmit={handleOtpSubmit} style={styles.form}>
            <div style={styles.formGroup}>
              <label htmlFor="otp" style={styles.label}>Enter OTP</label>
              <input type="text" id="otp" value={otp} onChange={(e) => setOtp(e.target.value)} required style={styles.input} />
            </div>
            <button type="submit" style={styles.button} disabled={isLoading}>{isLoading ? 'Verifying...' : 'Verify OTP'}</button>
          </form>
        );
      case 'payment':
        return (
          <form onSubmit={handlePaymentSubmit} style={styles.form}>
            <h2 style={styles.subHeader}>Enter Payment Details</h2>
            <div style={styles.formGroup}>
              <label style={styles.label}>Choose Payment Method</label>
              <div style={styles.radioGroup}>
                <label style={styles.radioLabel}>
                  <input type="radio" value="upi" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} /> UPI ID
                </label>
                <label style={styles.radioLabel}>
                  <input type="radio" value="bank" checked={paymentMethod === 'bank'} onChange={() => setPaymentMethod('bank')} /> Bank Transfer
                </label>
              </div>
            </div>
            {paymentMethod === 'upi' && (
              <div style={styles.formGroup}>
                <label htmlFor="upiId" style={styles.label}>UPI ID</label>
                <input type="text" id="upiId" value={upiId} onChange={(e) => setUpiId(e.target.value)} required style={styles.input} />
              </div>
            )}
            {paymentMethod === 'bank' && (
              <>
                <div style={styles.formGroup}><label htmlFor="accountNumber" style={styles.label}>Account Number</label><input type="text" id="accountNumber" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} required style={styles.input} /></div>
                <div style={styles.formGroup}><label htmlFor="ifscCode" style={styles.label}>IFSC Code</label><input type="text" id="ifscCode" value={ifscCode} onChange={(e) => setIfscCode(e.target.value)} required style={styles.input} /></div>
                <div style={styles.formGroup}><label htmlFor="accountHolderName" style={styles.label}>Account Holder Name</label><input type="text" id="accountHolderName" value={accountHolderName} onChange={(e) => setAccountHolderName(e.target.value)} required style={styles.input} /></div>
              </>
            )}
            <button type="submit" style={styles.button} disabled={isLoading}>{isLoading ? 'Processing...' : 'Redeem Your Cashback'}</button>
          </form>
        );
      case 'complete':
        return (
          <div style={styles.completionMessage}>
            <h2 style={styles.subHeader}>🎉 Redemption Complete! 🎉</h2>
            <p>Your cashback of</p>
            <p style={styles.cashbackAmount}>₹{finalCashbackAmount}</p>
            <p>has been initiated. You will receive a confirmation shortly.</p>
            <button style={styles.button} onClick={() => window.location.reload()}>Redeem Another Code</button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.formContainer}>
        <h1 style={styles.header}>Redeem Your Cashback</h1>
        {message && (
          <p style={{ ...styles.message, color: isError ? 'var(--error-color)' : 'var(--light-text-color)' }}>
            {message}
          </p>
        )}
        {renderStep()}
      </div>
    </div>
  );
}

const styles = {
  pageContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '20px',
  },
  formContainer: {
    width: '100%',
    maxWidth: '420px',
    backgroundColor: 'var(--form-background-color)',
    padding: '40px',
    borderRadius: '12px',
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
  },
  header: {
    textAlign: 'center',
    color: 'var(--text-color)',
    marginBottom: '30px',
    fontSize: '1.8em',
    fontWeight: '600',
  },
  subHeader: {
    textAlign: 'center',
    color: 'var(--text-color)',
    marginBottom: '20px',
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
    color: 'var(--light-text-color)',
    fontWeight: '500',
  },
  input: {
    width: '100%',
    padding: '12px',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    boxSizing: 'border-box',
    fontSize: '16px',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  },
  radioGroup: {
    display: 'flex',
    gap: '15px',
    marginTop: '5px',
  },
  radioLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  button: {
    backgroundColor: 'var(--primary-color)',
    color: 'white',
    padding: '12px 15px',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '600',
    marginTop: '10px',
    transition: 'background-color 0.2s',
  },
  message: {
    marginTop: '-10px',
    marginBottom: '20px',
    padding: '10px',
    borderRadius: '8px',
    textAlign: 'center',
    fontSize: '0.9em',
  },
  completionMessage: {
    textAlign: 'center',
  },
  cashbackAmount: {
    fontSize: '3em',
    fontWeight: 'bold',
    color: 'var(--success-color)',
    margin: '10px 0',
  }
};
