import apiClient from "../lib/api-client";

export const fastSearch = async (q) => {
  const params = new URLSearchParams({ q });
  return apiClient.request(`/search?${params}`, { method: "GET" });
};

export default { fastSearch };
