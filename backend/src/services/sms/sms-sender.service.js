import axios from "axios";

const PHONE_FIELD = "phone";
const MESSAGE_FIELD = "message";

export const NETWORK_ERROR_CODES = ["ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND", "ECONNABORTED", "EHOSTUNREACH"];

export const isNetworkError = (errorMessage) => {
  if (!errorMessage) return false;
  const msg = errorMessage.toLowerCase();
  return (
    msg.includes("هاټسپاټ") ||
    msg.includes("انټرنیټ") ||
    msg.includes("اتصال نشو") ||
    msg.includes("network") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound")
  );
};

/**
 * Send SMS via a configured endpoint (complete URL with port)
 */
export const sendSmsMessage = async (endpoint, phone, message) => {
  if (!endpoint?.apiUrl) {
    return { success: false, response: null, error: "د فون API پته نه ده تنظیم شوې", isNetworkError: false };
  }

  try {
    const response = await axios({
      method: "POST",
      url: endpoint.apiUrl.trim(),
      data: {
        [PHONE_FIELD]: phone,
        [MESSAGE_FIELD]: message,
      },
      headers: { "Content-Type": "application/json" },
      timeout: 15000,
    });

    return { success: true, response: response.data, error: null, isNetworkError: false };
  } catch (error) {
    console.error("SMS Send Error:", error.message);

    let errorMessage = "د SMS لیږلو کې تېروتنه";
    let networkError = false;

    if (NETWORK_ERROR_CODES.includes(error.code)) {
      errorMessage = "د SMS سرور سره اتصال نشو. ډاډ ترلاسه کړئ چې فون هاټسپاټ فعال دی او VPN بند وي";
      networkError = true;
    } else if (error.code === "ECONNABORTED") {
      errorMessage = "د SMS سرور ځواب و نه ورکړ. سرور ممکن بند وي — VPN بند کړئ او بیا هڅه وکړئ";
      networkError = true;
    } else if (error.response) {
      const status = error.response.status;
      if (status === 404) {
        errorMessage = "SMS API پته ونه موندل شوه. مهرباني وکړئ بشپړه پته او پورټ وګورئ";
        networkError = true;
      } else if (status >= 500) {
        errorMessage = "د SMS سرور ستونزه ده. سرور ممکن بند وي — VPN بند کړئ او بیا هڅه وکړئ";
        networkError = true;
      } else {
        errorMessage = `د SMS API تېروتنه: ${status}`;
      }
    } else if (error.message?.toLowerCase().includes("timeout")) {
      errorMessage = "د SMS سرور ځواب و نه ورکړ. سرور ممکن بند وي — VPN بند کړئ او بیا هڅه وکړئ";
      networkError = true;
    }

    return {
      success: false,
      response: error.response?.data || null,
      error: errorMessage,
      isNetworkError: networkError,
    };
  }
};

/**
 * Test SMS connection — calls API directly
 */
export const testSmsConnection = async (endpoint, phone, message) => {
  return sendSmsMessage(endpoint, phone, message || "دا د ازموینې پیغام دی");
};
