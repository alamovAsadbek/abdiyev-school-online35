import axios from 'axios';
import {API_BASE_URL} from "@/lib/variables.ts";


export class ApiSettings {
    private apiUrl: string;

    constructor() {
        this.apiUrl = API_BASE_URL;
    }

    // Har chaqiriqda localStorage'dan yangilab headers quramiz
    private getHeaders(isFormData: boolean = false): Record<string, string> {
        const headers: Record<string, string> = {
            'Accept': 'application/json',
        };

        if (!isFormData) {
            headers['Content-Type'] = 'application/json';
        }

        const token = localStorage.getItem('access');
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        return headers;
    }

    setToken(token: string) {
        localStorage.setItem('access', token);
    }

    clearToken() {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
    }

    async get(endpoint: string, params: Record<string, any> = {}) {
        try {
            const response = await axios.get(`${this.apiUrl}${endpoint}`, {
                headers: this.getHeaders(),
                params: params
            });
            return response.data;
        } catch (error) {
            console.error('API GET Error:', error);
            this.handleApiError(error);
            throw error;
        }
    }

    async post(endpoint: string, data: any, isFormData: boolean = false) {
        try {
            const response = await axios.post(`${this.apiUrl}${endpoint}`, data, {
                headers: this.getHeaders(isFormData)
            });
            return response.data;
        } catch (error) {
            console.error('API POST Error:', error);
            this.handleApiError(error);
            throw error;
        }
    }

    async put(endpoint: string, data: any, isFormData: boolean = false) {
        try {
            const response = await axios.put(`${this.apiUrl}${endpoint}`, data, {
                headers: this.getHeaders(isFormData)
            });
            return response.data;
        } catch (error) {
            console.error('API PUT Error:', error);
            this.handleApiError(error);
            throw error;
        }
    }

    async delete(endpoint: string) {
        try {
            const response = await axios.delete(`${this.apiUrl}${endpoint}`, {
                headers: this.getHeaders()
            });
            return response.data;
        } catch (error) {
            console.error('API DELETE Error:', error);
            this.handleApiError(error);
            throw error;
        }
    }

    private handleApiError(error: any) {
        if (!navigator.onLine || error.message === 'Network Error') {
            console.log('You are offline. Please check your internet connection.');
            return;
        }

        if (error.response && error.response.status === 401) {
            const hadToken = !!localStorage.getItem('access');

            // Token bo'lgan holda 401 keldi — bu sessiya muddati tugaganini bildiradi
            if (hadToken) {
                this.clearToken();

                // Faqat himoyalangan sahifada bo'lsa (/student, /admin) login'ga tashlaymiz.
                // Public sahifada (kurslar ro'yxati va h.k.) foydalanuvchini uzib yubormaymiz —
                // token'ni tozalab, xatoni yuqoriga uzatamiz, sahifa o'zi "anonim" holatda ishlashda davom etadi.
                const path = window.location.pathname;
                if (path.startsWith('/student') || path.startsWith('/admin')) {
                    window.location.href = '/login';
                }
            }
            // Token bo'lmagan holda 401 keldi — bu allaqachon anonim so'rov, redirect kerak emas
        }
    }
}

export default ApiSettings;