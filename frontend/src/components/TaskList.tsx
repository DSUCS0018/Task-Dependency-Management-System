import React, { useEffect, useState } from 'react';
import type { Task } from '../types';
import { taskService } from '../services/api';
import TaskItem from './TaskItem';

const TaskList: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            setLoading(true);
            const data = await taskService.getTasks();
            setTasks(data);
            setError(null);
        } catch (err) {
            setError('Failed to load tasks. Is the backend running?');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-gray-500">Loading tasks...</div>;
    }

    if (error) {
        return <div className="text-center py-8 text-red-500">{error}</div>;
    }

    if (tasks.length === 0) {
        return (
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                No tasks found. Add one to get started!
            </div>
        );
    }

    return (
        <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Tasks</h2>
            <div className="space-y-2">
                {tasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                ))}
            </div>
        </div>
    );
};

export default TaskList;
