export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'blocked';

export interface Task {
    id: number;
    title: string;
    description: string;
    status: TaskStatus;
    created_at?: string;
    updated_at?: string;
}

export interface TaskDependency {
    id: number;
    task: number;
    depends_on: number;
    created_at: string;
}

export interface ApiError {
    error?: string;
    path?: number[];
    [key: string]: any;
}
