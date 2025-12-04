import axios from 'axios';
import {API_BASE_URL} from "@/lib/variables.ts";


export class ApiSettings {
    private apiUrl: string;
    private headers: Record<string, string>;

    constructor() {
        // Set API URL based on environment (default to development)
        this.apiUrl = API_BASE_URL;

        // Set default headers
        this.headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };

        // Get token from localStorage if available
        const token = localStorage.getItem('access');
        if (token) {
            this.headers['Authorization'] = `Bearer ${token}`;
        }
    }

    // Set authentication token
    setToken(token: string) {
        this.headers['Authorization'] = `Bearer ${token}`;
        localStorage.setItem('auth-token', token);
    }

    // Clear authentication token
    clearToken() {
        delete this.headers['Authorization'];
        localStorage.removeItem('auth-token');
    }

    // GET request
    async get(endpoint: string, params: Record<string, any> = {}) {
        try {
            const response = await axios.get(`${this.apiUrl}${endpoint}`, {
                headers: this.headers,
                params: params
            });
            return response.data;
        } catch (error) {
            console.error('API GET Error:', error);
            this.handleApiError(error);
            throw error;
        }
    }

    // POST request
    async post(endpoint: string, data: any, isFormData: boolean = false) {
        try {
            const headers = {...this.headers};

            // If sending form data, remove Content-Type to let browser set it
            if (isFormData) {
                delete headers['Content-Type'];
            }

            const response = await axios.post(`${this.apiUrl}${endpoint}`, data, {
                headers: headers
            });
            return response.data;
        } catch (error) {
            console.error('API POST Error:', error);
            this.handleApiError(error);
            throw error;
        }
    }

    // PUT request
    async put(endpoint: string, data: any, isFormData: boolean = false) {
        try {
            const headers = {...this.headers};

            if (isFormData) {
                delete headers['Content-Type'];
            }

            const response = await axios.put(`${this.apiUrl}${endpoint}`, data, {
                headers: headers
            });
            return response.data;
        } catch (error) {
            console.error('API PUT Error:', error);
            this.handleApiError(error);
            throw error;
        }
    }

    // DELETE request
    async delete(endpoint: string) {
        try {
            const response = await axios.delete(`${this.apiUrl}${endpoint}`, {
                headers: this.headers
            });
            return response.data;
        } catch (error) {
            console.error('API DELETE Error:', error);
            this.handleApiError(error);
            throw error;
        }
    }

    // Handle API errors
    private handleApiError(error) {
        // Check if error is network related (offline)
        if (!navigator.onLine || error.message === 'Network Error') {
            console.log('You are offline. Please check your internet connection.');
            // You can display an offline notification or handle it as needed
        }

        // Handle other types of errors
        if (error.response) {
            // Server responded with an error status
            if (error.response.status === 401) {
                // Unauthorized - clear token and redirect to login
                this.clearToken();
                window.location.href = '/login';
            }
        }
    }
}

export default ApiSettings;