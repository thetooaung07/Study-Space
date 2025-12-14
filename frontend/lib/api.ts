const BASE_URL = "http://localhost:8080/api";

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || response.statusText);
  }
  // Handle 204 No Content
  if (response.status === 204) {
    return {} as T;
  }
  return response.json();
}

export const api = {
  get: async <T>(endpoint: string): Promise<T> => {
    const res = await fetch(`${BASE_URL}${endpoint}`);
    return handleResponse<T>(res);
  },

  post: async <T>(endpoint: string, body: any): Promise<T> => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    return handleResponse<T>(res);
  },

  put: async <T>(endpoint: string, body?: any): Promise<T> => {
    const options: RequestInit = {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const res = await fetch(`${BASE_URL}${endpoint}`, options);
    return handleResponse<T>(res);
  },

  delete: async <T>(endpoint: string): Promise<T> => {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      method: "DELETE",
    });
    return handleResponse<T>(res);
  },
};
