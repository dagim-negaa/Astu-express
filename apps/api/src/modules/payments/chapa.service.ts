import { normalizeEthiopianPhone } from "@astu/shared";

export interface ChapaInitParams {
  amount: number | string;
  currency?: "ETB" | "USD";
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  txRef: string;
  callbackUrl?: string;
  returnUrl?: string;
  title?: string;
  description?: string;
  meta?: Record<string, any>;
}

export interface ChapaInitResult {
  checkoutUrl: string;
  txRef: string;
  rawResponse: any;
}

export interface ChapaVerifyResult {
  success: boolean;
  status: string;
  reference?: string;
  txRef: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  rawResponse: any;
}

export class ChapaService {
  private secretKey: string;
  private baseUrl: string = "https://api.chapa.co/v1";

  constructor(secretKey: string) {
    if (!secretKey) {
      throw new Error("Chapa secret key (CHAPA_SECRET_KEY) is required.");
    }
    this.secretKey = secretKey.trim();
  }

  /**
   * Initializes a payment session on Chapa and returns the hosted checkout URL
   */
  async initializeTransaction(params: ChapaInitParams): Promise<ChapaInitResult> {
    const formattedPhone = normalizeEthiopianPhone(params.phoneNumber);
    const amountNum = typeof params.amount === "string" ? parseFloat(params.amount) : params.amount;

    if (isNaN(amountNum) || amountNum <= 0) {
      throw new Error("Invalid payment amount specified for Chapa initialization.");
    }

    const payload: Record<string, any> = {
      amount: amountNum.toFixed(2),
      currency: params.currency || "ETB",
      email: params.email.trim(),
      first_name: params.firstName.trim() || "Valued",
      last_name: params.lastName.trim() || "Client",
      tx_ref: params.txRef,
      callback_url: params.callbackUrl,
      return_url: params.returnUrl,
      customization: {
        title: (params.title || "ASTU Garment").slice(0, 16),
        description: params.description || `Order Payment (${params.txRef})`,
      },
    };

    if (formattedPhone) {
      payload.phone_number = formattedPhone;
    }

    if (params.meta) {
      payload.meta = params.meta;
    }

    const response = await fetch(`${this.baseUrl}/transaction/initialize`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data: any = await response.json().catch(() => null);

    if (!response.ok || !data || data.status !== "success" || !data.data?.checkout_url) {
      let errMsg = `Chapa initialize request failed with status ${response.status}`;
      if (typeof data?.message === "string") {
        errMsg = data.message;
      } else if (data?.message && typeof data.message === "object") {
        errMsg = Object.entries(data.message)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join(" | ");
      } else if (data?.errors) {
        errMsg = typeof data.errors === "string" ? data.errors : JSON.stringify(data.errors);
      }
      console.error("Chapa Initialize Error:", errMsg, data);
      throw new Error(errMsg);
    }

    return {
      checkoutUrl: data.data.checkout_url,
      txRef: params.txRef,
      rawResponse: data,
    };
  }

  /**
   * Verifies the authoritative state of a transaction from Chapa API
   */
  async verifyTransaction(txRef: string): Promise<ChapaVerifyResult> {
    if (!txRef) {
      throw new Error("Transaction reference (txRef) is required to verify transaction.");
    }

    const response = await fetch(`${this.baseUrl}/transaction/verify/${encodeURIComponent(txRef)}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
      },
    });

    const data: any = await response.json().catch(() => null);

    if (!response.ok || !data) {
      const errMsg = data?.message || `Chapa verify request failed with HTTP ${response.status}`;
      console.error("Chapa Verify HTTP Error:", errMsg, data);
      return {
        success: false,
        status: "failed",
        txRef,
        rawResponse: data,
      };
    }

    const status = (data.data?.status || data.status || "pending").toLowerCase();
    const isSuccess = status === "success";

    return {
      success: isSuccess,
      status: isSuccess ? "paid" : status,
      reference: data.data?.reference || data.data?.ref_id,
      txRef: data.data?.tx_ref || txRef,
      amount: data.data?.amount ? Number(data.data.amount) : undefined,
      currency: data.data?.currency,
      paymentMethod: data.data?.payment_method || data.data?.method,
      rawResponse: data,
    };
  }

  /**
   * Cryptographic verification of Chapa Webhook HMAC-SHA256 signature
   * Supports 'x-chapa-signature' and 'chapa-signature' headers
   */
  static async verifyWebhookSignature(
    rawBody: string,
    signatureHeader: string | null,
    secretHash: string
  ): Promise<boolean> {
    if (!signatureHeader || !secretHash) {
      return false;
    }

    try {
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(secretHash),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"]
      );

      const signatureBuffer = await crypto.subtle.sign(
        "HMAC",
        key,
        encoder.encode(rawBody)
      );

      const calculatedHex = Array.from(new Uint8Array(signatureBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("")
        .toLowerCase();

      const incomingHex = signatureHeader.trim().toLowerCase();

      // Timing-safe comparison to prevent timing attacks
      if (calculatedHex.length !== incomingHex.length) {
        return false;
      }

      let mismatch = 0;
      for (let i = 0; i < calculatedHex.length; i++) {
        mismatch |= calculatedHex.charCodeAt(i) ^ incomingHex.charCodeAt(i);
      }

      return mismatch === 0;
    } catch (err) {
      console.error("Chapa webhook signature verification failed:", err);
      return false;
    }
  }
}
