import apiClient, { ApiError } from "../lib/api-client";

/**
 * Authentication Service
 * Handles all authentication-related API calls with proper error handling
 */

export const authService = {
  /**
   * Register a new staff member
   * @param {Object} data - Registration data
   * @param {string} data.name - Full name
   * @param {string} data.email - Email address
   * @param {string} data.password - Password (min 6 characters)
   * @param {string} [data.role] - Role (admin, registrar, teacher, accountant, custom)
   * @returns {Promise<Object>} User data and tokens
   */
  async register(data) {
    try {
      const response = await apiClient.post("/auth/register", data);
      
      // Backend response: { success: true, message: string, status: 201, data: { user, accessToken, refreshToken } }
      if (response.success && response.data) {
        // Store tokens
        if (response.data.accessToken && response.data.refreshToken) {
          apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
        }
        
        // Store user data
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }
        
        return {
          success: true,
          user: response.data.user,
          message: response.message || "ثبت نام بریالی شو",
        };
      }
      
      throw new Error(response.message || "ثبت نام ناکام شو");
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("د ثبت نام کې تېروتنه");
    }
  },

  /**
   * Login with email and password
   * @param {Object} credentials
   * @param {string} credentials.email - Email address
   * @param {string} credentials.password - Password
   * @returns {Promise<Object>} User data and tokens
   */
  async login(credentials) {
    try {
      const loginId = String(credentials.identifier || credentials.email || "").trim();
      const payload = {
        identifier: loginId,
        password: credentials.password,
      };
      // Teachers/staff use username → username@school.local; admins use full email
      if (loginId.includes("@")) {
        payload.email = loginId;
      } else if (loginId) {
        payload.email = `${loginId.toLowerCase()}@school.local`;
      }

      const response = await apiClient.post("/auth/login", payload);
      
      // Backend response: { success: true, message: string, status: 200, data: { user, accessToken, refreshToken } }
      if (response.success && response.data) {
        // Store tokens
        if (response.data.accessToken && response.data.refreshToken) {
          apiClient.setTokens(response.data.accessToken, response.data.refreshToken);
        }
        
        // Store user data
        if (response.data.user) {
          localStorage.setItem("user", JSON.stringify(response.data.user));
        }
        
        return {
          success: true,
          user: response.data.user,
          message: response.message || "ننوتل بریالی شو",
        };
      }
      
      throw new Error(response.message || "ننوتل ناکام شو");
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("د ننوتلو کې تېروتنه");
    }
  },

  /**
   * Logout current user
   * @returns {Promise<Object>} Success message
   */
  async logout() {
    try {
      const response = await apiClient.post("/auth/logout");
      
      // Clear tokens and user data
      apiClient.clearTokens();
      
      return {
        success: true,
        message: response.message || "وتل بریالی شو",
      };
    } catch (error) {
      // Clear tokens even if API call fails
      apiClient.clearTokens();
      
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("د وتلو کې تېروتنه");
    }
  },

  /**
   * Verify current user session
   * @returns {Promise<Object>} User data
   */
  async verify() {
    try {
      const response = await apiClient.get("/auth/verify");
      
      // Backend response: { success: true, message: string, status: 200, data: { user } }
      if (response.success && response.data?.user) {
        // Update stored user data
        localStorage.setItem("user", JSON.stringify(response.data.user));
        
        return {
          success: true,
          user: response.data.user,
        };
      }
      
      throw new Error("تایید ناکام شو");
    } catch (error) {
      // Clear tokens if verification fails
      apiClient.clearTokens();
      
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("د تایید کې تېروتنه");
    }
  },

  /**
   * Change password for current user
   * @param {Object} data
   * @param {string} data.currentPassword - Current password
   * @param {string} data.newPassword - New password (min 6 characters)
   * @returns {Promise<Object>} Success message
   */
  async changePassword(data) {
    try {
      const response = await apiClient.patch("/auth/change-password", data);
      
      // Backend response: { success: true, message: string, status: 200 }
      return {
        success: true,
        message: response.message || "پاسورډ بدل شو",
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new Error("د پاسورډ بدلولو کې تېروتنه");
    }
  },

  /**
   * Get current user from localStorage
   * @returns {Object|null} User data or null
   */
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem("user");
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error("Error parsing user data:", error);
      return null;
    }
  },

  /**
   * Check if user is authenticated
   * @returns {boolean} True if authenticated
   */
  isAuthenticated() {
    const hasTokens = !!(apiClient.accessToken && apiClient.refreshToken);
    const hasUser = !!this.getCurrentUser();
    return hasTokens && hasUser;
  },
};

export default authService;
