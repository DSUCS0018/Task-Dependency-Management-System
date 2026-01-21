import React, { useState } from 'react';
import type { Task, TaskStatus } from '../types';
import DependencySelector from './DependencySelector';

interface TaskItemProps {
    task: Task;
    onStatusChange: (taskId: number, newStatus: TaskStatus) => Promise<void>;
    onRefresh?: () => void;
}

const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    blocked: 'bg-red-100 text-red-800 border-red-200',
};

const TaskItem: React.FC<TaskItemProps> = ({ task, onStatusChange, onRefresh }) => {
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

    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
                        <span className="text-xs text-gray-400">#{task.id}</span>
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
