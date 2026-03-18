'use client';

import type { AxiosInstance, AxiosRequestConfig } from 'axios';
import axios from 'axios';

import { ClientVars } from '@/constants/client-only';
import { Router } from '@/constants/router';
import { StatusCode } from '@/enums/http-status';
import { AUTH_TOKEN_KEY } from '@/providers/auth';
import { isClient } from '@/utils/client-only';
import { createLogger } from '@/utils/logger';

export type ResponseBase<T> = {
    message: string;
    data?: T;
    success: boolean;
    timestamp: Date;
};

export type PaginatedData<T> = {
    items: T[];
    pagination: {
        currentPage: string;
        totalPages: number;
        totalItems: number;
        hasNext: boolean;
        hasPrev: boolean;
    };
};

const logger = createLogger('HttpClient');

class HttpClient {
    axiosInstance: AxiosInstance;
    private isRefreshing = false;
    private failedQueue: Array<{
        resolve: (value: any) => void;
        reject: (error: any) => void;
    }> = [];

    constructor() {
        this.axiosInstance = axios.create({
            baseURL: ClientVars.API_URL + '/api/v1',
            headers: {
                // 'Content-Type': 'application/json',
                'Access-Control-Allow-Credentials': 'true',
                // accept: 'application/json',
            },
            withCredentials: true,
            maxRedirects: 5,
            timeout: 10000,
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor to add auth header
        this.axiosInstance.interceptors.request.use(
            (config) => {
                const token = this.getStoredToken();
                if (token && !config.headers.Authorization) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error),
        );

        // Response interceptor to handle token expiration
        this.axiosInstance.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                if (error.response?.status === StatusCode.SESSION_EXPIRED && !originalRequest._retry) {
                    if (this.isRefreshing) {
                        // If refresh is in progress, queue the request
                        return new Promise((resolve, reject) => {
                            this.failedQueue.push({ resolve, reject });
                        })
                            .then((token) => {
                                originalRequest.headers.Authorization = `Bearer ${token}`;
                                return this.axiosInstance(originalRequest);
                            })
                            .catch((err) => {
                                return Promise.reject(err);
                            });
                    }

                    originalRequest._retry = true;
                    this.isRefreshing = true;

                    try {
                        const newToken = await this.refreshToken();
                        this.processQueue(null, newToken);
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return this.axiosInstance(originalRequest);
                    } catch (refreshError) {
                        this.processQueue(refreshError, null);
                        this.handleAuthFailure();
                        return Promise.reject(refreshError);
                    } finally {
                        this.isRefreshing = false;
                    }
                }

                if (error.response) {
                    return Promise.resolve({
                        data: {
                            success: false,
                            message: error.response.data?.message ?? error.message,
                            data: error.response.data,
                        },
                    });
                }

                return Promise.reject(error);
            },
        );
    }

    private getStoredToken(): string | null {
        if (!isClient) return null;

        try {
            const rawToken = localStorage.getItem(AUTH_TOKEN_KEY);
            return rawToken ? JSON.parse(rawToken) : null;
        } catch (error) {
            logger.error('Error parsing token', error);
            return null;
        }
    }

    private setStoredToken(token: string): void {
        if (!isClient) return;
        localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(token));
    }

    private async refreshToken(): Promise<string> {
        const endpoint = this.axiosInstance.defaults.baseURL;
        const response = await fetch(`${endpoint}/auth/refresh-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
        });

        if (!response.ok) {
            throw new Error('Token refresh failed');
        }

        const data = await response.json();
        if (data.success && data.data?.accessToken) {
            const newToken = data.data.accessToken;
            this.setStoredToken(newToken);
            return newToken;
        }

        throw new Error('Invalid refresh response');
    }

    private processQueue(error: any, token: string | null = null): void {
        this.failedQueue.forEach(({ resolve, reject }) => {
            if (error) {
                reject(error);
            } else {
                resolve(token);
            }
        });

        this.failedQueue = [];
    }

    private handleAuthFailure(): void {
        if (!isClient) return;
        localStorage.removeItem(AUTH_TOKEN_KEY);
        window.location.href = Router.LOGIN;
    }

    private getAuthenticationHeader(): string {
        if (!isClient) return '';

        const accessToken = this.getStoredToken();
        return `Bearer ${accessToken}`;
    }

    async get<T>(url: string, config?: AxiosRequestConfig): Promise<ResponseBase<T>> {
        const response = await this.axiosInstance.get(url, config);
        return response.data as ResponseBase<T>;
    }

    async post<T, K = never>(url: string, data?: K, config?: AxiosRequestConfig) {
        const response = await this.axiosInstance.post(url, data, config);
        return response.data as ResponseBase<T>;
    }

    async put<T, K = never>(url: string, data?: K, config?: AxiosRequestConfig) {
        const response = await this.axiosInstance.put(url, data, config);
        return response.data as ResponseBase<T>;
    }

    async delete<T>(url: string, config?: AxiosRequestConfig) {
        const response = await this.axiosInstance.delete(url, config);
        return response.data as ResponseBase<T>;
    }
    async makeSSE<K = never>(url: string, data?: K, config?: AxiosRequestConfig): Promise<Response> {
        const fullUrl = `${this.axiosInstance.defaults.baseURL}${url}`;

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
            'Cache-Control': 'no-cache',
        };

        // Add authentication header if token exists
        if (this.getStoredToken()) {
            headers.Authorization = this.getAuthenticationHeader();
        }

        // Add config headers if they exist and are valid strings
        if (config?.headers) {
            Object.entries(config.headers).forEach(([key, value]) => {
                if (typeof value === 'string') {
                    headers[key] = value;
                }
            });
        }

        return fetch(fullUrl, {
            method: 'POST',
            headers,
            credentials: 'include',
            body: JSON.stringify(data),
            keepalive: false,
            // Fix for strict-origin-when-cross-origin referrer policy
            referrerPolicy: 'no-referrer-when-downgrade',
        });
    }
}

const httpClient = new HttpClient();

export default httpClient;
