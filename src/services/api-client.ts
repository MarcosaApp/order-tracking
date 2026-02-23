// API Client - Single instance with configuration
export const BASE_URL = "http://localhost:8081/api/v1";

interface ApiResponse<T> {
  error: boolean;
  data: T;
  message?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const config: RequestInit = {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    };

    const response = await fetch(`${this.baseURL}${endpoint}`, config);

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status} ${response.statusText}`);
    }

    const result = (await response.json()) as ApiResponse<T>;

    if (result.error) {
      throw new Error(result.message || "An error occurred");
    }

    return result.data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async put<T>(endpoint: string, body: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }

  async uploadFile(endpoint: string, file: File): Promise<any> {
    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onload = async () => {
        try {
          const base64Data = reader.result?.toString().split(",")[1];
          const payload = {
            imageBody: base64Data,
            fileName: file.name,
            contentType: file.type,
          };

          const result = await this.post(endpoint, payload);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient(BASE_URL);
