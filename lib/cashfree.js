import crypto from 'crypto';

const CASHFREE_BASE_URL = process.env.CASHFREE_ENVIRONMENT === 'PRODUCTION'
  ? 'https://api.cashfree.com/payout'
  : 'https://sandbox.cashfree.com/payout';

const CASHFREE_CLIENT_ID = process.env.CASHFREE_CLIENT_ID;
const CASHFREE_CLIENT_SECRET = process.env.CASHFREE_CLIENT_SECRET;

export const CashfreeService = {
  
  /**
   * Generates the required Cashfree API headers, dynamically injecting RSA Signatures if a Public Key is provided.
   */
  getHeaders() {
    const headers = {
      'x-client-id': CASHFREE_CLIENT_ID,
      'x-client-secret': CASHFREE_CLIENT_SECRET,
      'Content-Type': 'application/json',
      'x-api-version': '2024-01-01'
    };

    const publicKey = process.env.CASHFREE_PUBLIC_KEY;
    if (publicKey && publicKey.length > 50) {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const dataToEncrypt = `${CASHFREE_CLIENT_ID}.${timestamp}`;
      
      let formattedKey = publicKey.replace(/\\n/g, '\n');
      if (!formattedKey.includes('KEY-----')) {
          formattedKey = `-----BEGIN PUBLIC KEY-----\n${formattedKey.match(/.{1,64}/g).join('\n')}\n-----END PUBLIC KEY-----`;
      }

      const buffer = Buffer.from(dataToEncrypt, 'utf8');
      const encrypted = crypto.publicEncrypt(
          {
              key: formattedKey,
              padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
              oaepHash: "sha256",
          },
          buffer
      );
      
      headers['X-Cf-Signature'] = encrypted.toString('base64');
    }
    
    return headers;
  },

  /**
   * Send a payout via UPI or Bank Account
   * @param {Object} payoutDetails 
   * @returns {Promise<Object>}
   */
  async initiateTransfer({ transferId, amount, upiId, bankAccount, ifsc, name, phone }) {
    try {
      if (!CASHFREE_CLIENT_ID || !CASHFREE_CLIENT_SECRET) {
        throw new Error('Cashfree credentials are not configured');
      }

      const payload = {
        transfer_id: transferId,
        transfer_amount: parseFloat(amount),
        transfer_currency: 'INR',
        transfer_mode: upiId ? 'UPI' : 'IMPS', // Default to IMPS for bank accounts
        beneficiary_details: {
          beneficiary_name: name,
          beneficiary_phone: phone,
        }
      };

      if (upiId) {
        payload.beneficiary_details.beneficiary_vpa = upiId;
      } else {
        payload.beneficiary_details.beneficiary_account_number = bankAccount;
        payload.beneficiary_details.beneficiary_ifsc = ifsc;
      }

      const response = await fetch(`${CASHFREE_BASE_URL}/transfer`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Cashfree Transfer Error:', data);
        throw new Error(data.message || 'Failed to initiate transfer');
      }

      return data;
    } catch (error) {
      console.error('Cashfree Service Error:', error);
      throw error;
    }
  },

  /**
   * Get status of a transfer
   * @param {string} transferId 
   * @returns {Promise<Object>}
   */
  async getTransferStatus(transferId) {
    try {
      // Use the unified V2 endpoint with signature headers
      const response = await fetch(`${CASHFREE_BASE_URL}/transfers/${transferId}`, {
        method: 'GET',
        headers: this.getHeaders()
      });

      const data = await response.json();

      // Cashfree returns 404 subCode if transfer doesn't exist
      if (data.status === 'ERROR' && data.subCode === '404') {
          throw new Error('Transfer not found in Cashfree system');
      }
      
      // Cashfree sometimes returns 200 OK HTTP status for Auth errors!
      if (data.status === 'ERROR' && (data.subCode === '403' || data.subCode === '401' || data.message?.includes('Token'))) {
          throw new Error(`Cashfree API Auth Error: ${data.message} - Make sure CASHFREE_PUBLIC_KEY is correctly loaded in Vercel.`);
      }

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch transfer status');
      }

      // Return unified response
      return {
          status: data.status, // e.g. SUCCESS, PENDING, FAILED
          reference_id: data.reference_id,
          utr: data.cf_transfer_id || data.utr,
          failure_reason: data.status_description || data.message
      };

    } catch (error) {
      console.error('Cashfree Status Error:', error);
      throw error;
    }
  }
};
