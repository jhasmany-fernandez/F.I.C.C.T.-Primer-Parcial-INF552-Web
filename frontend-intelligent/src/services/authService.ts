const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  phone?: string;
  face_image_base64: string;
}

export interface FaceLoginData {
  face_image_base64: string;
}

export interface PasswordLoginData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  phone?: string;
  face_registered: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
  message?: string;
  similarity?: number;
}

export interface ApiError {
  error?: string;
  detail?: string;
  message?: string;
  [key: string]: any;
}

class AuthService {
  /**
   * Register a new user with facial recognition
   */
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/register/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      // Try to parse JSON response
      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        throw {
          message: `Error del servidor: No se pudo procesar la respuesta (Estado: ${response.status})`,
          detail: 'El servidor devolvió una respuesta inválida. Verifica que el backend esté funcionando correctamente.',
        };
      }

      if (!response.ok) {
        throw result;
      }

      // Store tokens in localStorage (always remember for new registrations)
      if (result.access && result.refresh) {
        this.setTokens(result.access, result.refresh, true);
      }

      return result;
    } catch (error: any) {
      // Handle network errors (connection refused, DNS failure, etc.)
      if (error instanceof TypeError) {
        throw {
          message: 'No se pudo conectar al servidor',
          detail: `Verifica que el backend esté corriendo en ${API_URL}. Error: ${error.message}`,
        };
      }

      // Handle empty error objects
      if (error && typeof error === 'object' && Object.keys(error).length === 0) {
        throw {
          message: 'Error desconocido',
          detail: 'Ocurrió un error inesperado. Por favor, intenta nuevamente.',
        };
      }

      // Handle errors without proper structure
      const hasKnownField = error.message || error.detail || error.error ||
                           error.email || error.username || error.password ||
                           error.password_confirm || error.first_name || error.last_name ||
                           error.face_image_base64 || error.non_field_errors;

      if (!hasKnownField) {
        throw {
          message: 'Error de conexión',
          detail: 'No se pudo comunicar con el servidor. Verifica tu conexión a internet.',
        };
      }

      throw error;
    }
  }

  /**
   * Login using facial recognition
   */
  async loginWithFace(data: FaceLoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login/face/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        throw {
          message: `Error del servidor: No se pudo procesar la respuesta (Estado: ${response.status})`,
          detail: 'El servidor devolvió una respuesta inválida.',
        };
      }

      if (!response.ok) {
        throw result;
      }

      // Store tokens using the last remember preference, or default to true for face login
      if (result.access && result.refresh) {
        const lastRememberPreference = localStorage.getItem('remember_session') === 'true';
        this.setTokens(result.access, result.refresh, lastRememberPreference || true);
      }

      return result;
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError) {
        throw {
          message: 'No se pudo conectar al servidor',
          detail: `Verifica que el backend esté corriendo en ${API_URL}.`,
        };
      }

      // Handle errors without structure
      if (error && typeof error === 'object' && !error.message && !error.detail && !error.error) {
        throw {
          message: 'Error de conexión',
          detail: 'No se pudo comunicar con el servidor.',
        };
      }

      throw error;
    }
  }

  /**
   * Login using email and password
   */
  async loginWithPassword(data: PasswordLoginData): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_URL}/auth/login/password/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      let result;
      try {
        result = await response.json();
      } catch (jsonError) {
        throw {
          message: `Error del servidor: No se pudo procesar la respuesta (Estado: ${response.status})`,
          detail: 'El servidor devolvió una respuesta inválida.',
        };
      }

      if (!response.ok) {
        throw result;
      }

      // Store tokens in localStorage or sessionStorage based on remember preference
      if (result.access && result.refresh) {
        this.setTokens(result.access, result.refresh, data.remember || false);
      }

      return result;
    } catch (error: any) {
      // Handle network errors
      if (error instanceof TypeError) {
        throw {
          message: 'No se pudo conectar al servidor',
          detail: `Verifica que el backend esté corriendo en ${API_URL}.`,
        };
      }

      // Handle errors without structure
      if (error && typeof error === 'object' && !error.message && !error.detail && !error.error) {
        throw {
          message: 'Error de conexión',
          detail: 'No se pudo comunicar con el servidor.',
        };
      }

      throw error;
    }
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    try {
      const token = this.getAccessToken();

      if (!token) {
        throw new Error('No access token found');
      }

      const response = await fetch(`${API_URL}/auth/me/`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();

      if (!response.ok) {
        throw result;
      }

      return result;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<string> {
    try {
      const refreshToken = this.getRefreshToken();

      if (!refreshToken) {
        throw new Error('No refresh token found');
      }

      const response = await fetch(`${API_URL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw result;
      }

      // Update access token
      this.setAccessToken(result.access);

      return result.access;
    } catch (error) {
      console.error('Refresh token error:', error);
      // If refresh fails, logout
      this.logout();
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      const accessToken = this.getAccessToken();

      if (refreshToken && accessToken) {
        await fetch(`${API_URL}/auth/logout/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ refresh: refreshToken }),
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Always clear local storage
      this.clearTokens();
    }
  }

  /**
   * Store tokens in localStorage or sessionStorage based on remember preference
   */
  setTokens(access: string, refresh: string, remember: boolean = false): void {
    if (typeof window !== 'undefined') {
      const storage = remember ? localStorage : sessionStorage;
      storage.setItem('access_token', access);
      storage.setItem('refresh_token', refresh);

      // Store the remember preference
      localStorage.setItem('remember_session', remember.toString());

      // Clear tokens from the other storage to avoid conflicts
      const otherStorage = remember ? sessionStorage : localStorage;
      otherStorage.removeItem('access_token');
      otherStorage.removeItem('refresh_token');
    }
  }

  /**
   * Set access token only
   */
  setAccessToken(access: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', access);
    }
  }

  /**
   * Get access token from localStorage or sessionStorage
   */
  getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      // Try to get from localStorage first, then sessionStorage
      return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
    }
    return null;
  }

  /**
   * Get refresh token from localStorage or sessionStorage
   */
  getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      // Try to get from localStorage first, then sessionStorage
      return localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
    }
    return null;
  }

  /**
   * Clear tokens from both localStorage and sessionStorage
   */
  clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('remember_session');
      sessionStorage.removeItem('access_token');
      sessionStorage.removeItem('refresh_token');
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();
