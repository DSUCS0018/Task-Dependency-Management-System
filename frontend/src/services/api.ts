import axios, { AxiosError } from 'axios';
import type { Task, TaskStatus, ApiError } from '../types';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Centralized error handling
api.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
        // Return the data directly if available, so components catch { error: "...", path: [...] }
        if (error.response && error.response.data) {
            return Promise.reject(error.response.data);
        }
        return Promise.reject(error);
    }
);

export const taskService = {
    getTasks: async (): Promise<Task[]> => {
        const response = await api.get('/tasks/');
        return response.data;
    },

    createTask: async (title: string, description: string): Promise<Task> => {
        const response = await api.post('/tasks/', { title, description });
        return response.data;
    },

    updateTaskStatus: async (taskId: number, status: TaskStatus): Promise<Task> => {
        const response = await api.patch(`/tasks/${taskId}/`, { status });
        return response.data;
    },

    addDependency: async (taskId: number, dependsOnId: number): Promise<any> => {
        const response = await api.post(`/tasks/${taskId}/dependencies/`, { depends_on_id: dependsOnId });
        return response.data;
    },

    deleteTask: async (taskId: number): Promise<void> => {
        await api.delete(`/tasks/${taskId}/`);
    },
};

export default api;
