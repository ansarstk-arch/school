// API Client with error handling and token management

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api/v1";

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

class ApiClient {
  constructor() {
    this.accessToken = localStorage.getItem("accessToken");
    this.refreshToken = localStorage.getItem("refreshToken");
  }

  setTokens(accessToken, refreshToken) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    if (accessToken) {
      localStorage.setItem("accessToken", accessToken);
    } else {
      localStorage.removeItem("accessToken");
    }
    if (refreshToken) {
      localStorage.setItem("refreshToken", refreshToken);
    } else {
      localStorage.removeItem("refreshToken");
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    // Don't set Content-Type for FormData (browser sets it with boundary)
    const isFormData = options.body instanceof FormData;
    const headers = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    };

    // Always get fresh tokens from localStorage
    const currentAccessToken = localStorage.getItem("accessToken");
    const currentRefreshToken = localStorage.getItem("refreshToken");

    // Add access token if available
    if (currentAccessToken) {
      headers["Authorization"] = `Bearer ${currentAccessToken}`;
    }

    // Add refresh token if available
    if (currentRefreshToken) {
      headers["x-refresh-token"] = currentRefreshToken;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: "include",
      });

      // Check for new tokens in response headers
      const newAccessToken = response.headers.get("x-new-access-token");
      const newRefreshToken = response.headers.get("x-new-refresh-token");

      if (newAccessToken && newRefreshToken) {
        this.setTokens(newAccessToken, newRefreshToken);
      }

      // Parse response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If JSON parsing fails, throw network error
        throw new ApiError("د سرور ځواب سم نه دی", response.status, null);
      }

      // Backend returns: { success: boolean, message: string, status: number, data?: any }
      // Handle error responses based on success flag
      if (!data.success) {
        throw new ApiError(
          data.message || "د غوښتنې کې تېروتنه",
          data.status || response.status,
          data
        );
      }

      return data;
    } catch (error) {
      // Network errors (no internet, server down, etc.)
      if (error instanceof TypeError || error.message === "Failed to fetch") {
        throw new ApiError("د شبکې سره اړیکه نشته. مهرباني وکړئ خپل انټرنیټ وګورئ.", 0, null);
      }

      // API errors
      if (error instanceof ApiError) {
        throw error;
      }

      // Unknown errors
      console.error("Unknown API error:", error);
      throw new ApiError("نامعلومه تېروتنه", 500, null);
    }
  }

  // HTTP Methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "GET",
    });
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async postForm(endpoint, formData, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "POST",
      body: formData,
    });
  }

  async putForm(endpoint, formData, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "PUT",
      body: formData,
    });
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: "DELETE",
    });
  }
}

// Create singleton instance
const apiClient = new ApiClient();

export default apiClient;
export { ApiError };
