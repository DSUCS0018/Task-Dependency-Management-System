import React, { useState, useEffect } from 'react';
import type { Task } from '../types';
import { taskService } from '../services/api';

interface DependencySelectorProps {
    currentTaskId: number;
    onDependencyAdded: () => void;
}

const DependencySelector: React.FC<DependencySelectorProps> = ({ currentTaskId, onDependencyAdded }) => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedTaskId, setSelectedTaskId] = useState<number | ''>('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        loadTasks();
    }, [currentTaskId]);

    const loadTasks = async () => {
        try {
            const data = await taskService.getTasks();
            // Filter out current task
            setTasks(data.filter(t => t.id !== currentTaskId));
        } catch (err) {
            console.error('Failed to load tasks for dependency selection', err);
        }
    };

    const handleAdd = async () => {
        if (!selectedTaskId) return;

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await taskService.addDependency(currentTaskId, Number(selectedTaskId));
            setSuccess('Dependency added successfully!');
            setSelectedTaskId('');
            onDependencyAdded();
            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            // Handle circular dependency or other errors
            // Structure: { error: "...", path: [...] }
            if (err.error) {
                let msg = err.error;
                if (err.path && Array.isArray(err.path)) {
                    msg += ` Cycle: ${err.path.join(' → ')}`;
                }
                setError(msg);
            } else {
                setError('Failed to add dependency. Please try again.');
                console.error(err);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-2">Add Dependency (Blocking Task)</h4>

            {error && (
                <div className="mb-2 text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200 font-medium">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-2 text-xs text-green-600 bg-green-50 p-2 rounded border border-green-200 font-medium">
                    {success}
                </div>
            )}

            <div className="flex gap-2">
                <select
                    value={selectedTaskId}
                    onChange={(e) => setSelectedTaskId(Number(e.target.value))}
                    className="flex-1 text-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 py-1 px-2 disabled:bg-gray-100 disabled:text-gray-500"
                    disabled={loading}
                >
                    <option value="">Select a task...</option>
                    {tasks.map(task => (
                        <option key={task.id} value={task.id}>
                            {task.id}: {task.title}
                        </option>
                    ))}
                </select>
                <button
                    onClick={handleAdd}
                    disabled={!selectedTaskId || loading}
                    className={`px-3 py-1 rounded-md text-sm transition-colors text-white ${loading || !selectedTaskId ? 'bg-gray-400 cursor-not-allowed' : 'bg-gray-800 hover:bg-gray-700'
                        }`}
                >
                    {loading ? 'Adding...' : 'Add'}
                </button>
            </div>
        </div>
    );
};

export default DependencySelector;
