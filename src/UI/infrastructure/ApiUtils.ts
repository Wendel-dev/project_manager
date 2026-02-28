export const getHeaders = () => {
  return {
    "Content-Type": "application/json",
  };
};

export const handleResponse = async (response: Response) => {
  if (response.status === 401) {
    throw new Error("Unauthorized");
  }
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP error! status: ${response.status}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};
