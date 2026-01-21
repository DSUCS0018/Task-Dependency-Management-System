import React, { useState } from 'react';
import type { Task, TaskStatus } from '../types';
import DependencySelector from './DependencySelector';

interface TaskItemProps {
    task: Task;
    onStatusChange: (taskId: number, newStatus: TaskStatus) => Promise<void>;
    onRefresh?: () => void;
    onDelete?: (taskId: number) => Promise<void>;
}

const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    blocked: 'bg-red-100 text-red-800 border-red-200',
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onStatusChange, onRefresh, onDelete }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDependencies, setShowDependencies] = useState(false);

    const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newStatus = e.target.value as TaskStatus;
        if (newStatus === task.status) return;

        try {
            setIsUpdating(true);
            await onStatusChange(task.id, newStatus);
        } catch (err) {
            console.error("Failed to update status", err);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        if (!onDelete) return;
        if (window.confirm(`Are you sure you want to delete task "${task.title}"?`)) {
            await onDelete(task.id);
        }
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
                        <span className="text-xs text-gray-400">#{task.id}</span>
                        {onDelete && (
                            <button
                                onClick={handleDelete}
                                className="text-gray-400 hover:text-red-500 ml-2"
                                title="Delete Task"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                    </div>
                    {task.description && (
                        <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                    )}

                    <button
                        onClick={() => setShowDependencies(!showDependencies)}
                        className="text-xs text-blue-600 hover:text-blue-800 mt-2 underline"
                    >
                        {showDependencies ? 'Hide Dependencies' : 'Manage Dependencies'}
                    </button>
                </div>

                <div className="flex items-center space-x-3">
                    {isUpdating ? (
                        <span className="text-sm text-gray-500">Updating...</span>
                    ) : (
                        <select
                            value={task.status}
                            onChange={handleStatusChange}
                            className={`px-3 py-1 rounded-full text-xs font-medium border cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 ${statusColors[task.status] || statusColors.pending}`}
                        >
                            <option value="pending">PENDING</option>
                            <option value="in_progress">IN PROGRESS</option>
                            <option value="completed">COMPLETED</option>
                            <option value="blocked">BLOCKED</option>
                        </select>
                    )}
                </div>
            </div>

            {showDependencies && (
                <div className="mt-4 border-t border-gray-100 pt-3">
                    <DependencySelector
                        currentTaskId={task.id}
                        onDependencyAdded={() => onRefresh && onRefresh()}
                    />

                    {/* Future: List existing dependencies here if API return them nested, strictly speaking 
                we might need to fetch them or rely on task.dependencies if serializer provided it.
                For now we just allowed adding. */}
                </div>
            )}
        </div>
    );
};

export default TaskItem;
