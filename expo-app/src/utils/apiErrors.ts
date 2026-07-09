export function getApiErrorMessage(error: any): string {
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return "Request timed out. Please check your connection and try again.";
    }
    return "Cannot connect to server. Make sure the backend is running and your device is on the same network.";
  }

  if (error.response?.data?.error) {
    return error.response.data.error;
  }

  const status = error.response?.status;
  if (status === 500) return "Server error. Please try again later.";
  if (status === 503) return "Service unavailable. Please try again later.";
  if (status) return `Server error (${status}). Please try again.`;

  return "Something went wrong. Please try again.";
}
