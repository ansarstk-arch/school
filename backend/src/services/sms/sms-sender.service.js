import axios from "axios";

/**
 * Send SMS message via configured API
 * @param {Object} settings - SMS settings from database
 * @param {string} phone - Recipient phone number
 * @param {string} message - Message content
 * @returns {Promise<Object>} - { success: boolean, response: any, error: string }
 */
export const sendSmsMessage = async (settings, phone, message) => {
  try {
    // Build request config
    const config = {
      method: settings.requestMethod,
      url: settings.apiPort ? `${settings.apiUrl}:${settings.apiPort}` : settings.apiUrl,
      timeout: 30000, // 30 seconds
    };

    // Prepare data
    const data = {
      [settings.phoneField]: phone,
      [settings.messageField]: message,
    };

    // Handle authentication
    if (settings.authMethod === "token") {
      if (settings.tokenPlacement === "header") {
        config.headers = {
          Authorization: `Bearer ${settings.apiToken}`,
          "Content-Type": "application/json",
        };
      } else if (settings.tokenPlacement === "query") {
        config.params = { token: settings.apiToken };
      } else if (settings.tokenPlacement === "body") {
        data.token = settings.apiToken;
      }
    } else if (settings.authMethod === "basic") {
      config.auth = {
        username: settings.apiUsername,
        password: settings.apiPassword,
      };
    } else if (settings.authMethod === "bearer") {
      config.headers = {
        Authorization: `Bearer ${settings.apiToken}`,
        "Content-Type": "application/json",
      };
    }

    // Set data based on method
    if (settings.requestMethod === "POST") {
      config.data = data;
      config.headers = {
        ...config.headers,
        "Content-Type": "application/json",
      };
    } else {
      config.params = { ...config.params, ...data };
    }

    // Make API call
    const response = await axios(config);

    return {
      success: true,
      response: response.data,
      error: null,
    };
  } catch (error) {
    console.error("SMS Send Error:", error.message);

    let errorMessage = "د SMS لیږلو کې تېروتنه";

    if (error.code === "ECONNREFUSED") {
      errorMessage = "د سرور سره اتصال نشو. مهرباني وکړئ API پته او پورټ وګورئ";
    } else if (error.code === "ETIMEDOUT") {
      errorMessage = "د API غوښتنه ډیره وخت ونیوه";
    } else if (error.code === "ENOTFOUND") {
      errorMessage = "د انټرنیټ اتصال نشته. مهرباني وکړئ خپل هاټسپاټ وګورئ";
    } else if (error.response) {
      const status = error.response.status;
      if (status === 401) {
        errorMessage = "د تصدیق تېروتنه. مهرباني وکړئ ټوکن وګورئ";
      } else if (status === 403) {
        errorMessage = "اجازه نشته";
      } else if (status === 404) {
        errorMessage = "API پته ونه موندل شوه";
      } else if (status === 500) {
        errorMessage = "د سرور تېروتنه";
      } else {
        errorMessage = `د API تېروتنه: ${status}`;
      }
    }

    return {
      success: false,
      response: error.response?.data || null,
      error: errorMessage,
    };
  }
};

/**
 * Send bulk SMS messages
 * @param {Object} settings - SMS settings
 * @param {Array} recipients - Array of { phone, message }
 * @param {Function} onProgress - Progress callback (current, total)
 * @returns {Promise<Object>} - { sent: number, failed: number, results: Array }
 */
export const sendBulkSms = async (settings, recipients, onProgress) => {
  const results = {
    sent: 0,
    failed: 0,
    details: [],
  };

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i];
    
    try {
      const result = await sendSmsMessage(settings, recipient.phone, recipient.message);
      
      if (result.success) {
        results.sent++;
      } else {
        results.failed++;
      }

      results.details.push({
        phone: recipient.phone,
        success: result.success,
        error: result.error,
      });

      // Call progress callback
      if (onProgress) {
        onProgress(i + 1, recipients.length);
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      results.failed++;
      results.details.push({
        phone: recipient.phone,
        success: false,
        error: error.message,
      });
    }
  }

  return results;
};
