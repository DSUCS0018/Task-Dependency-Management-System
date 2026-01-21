import React from 'react';
import type { Task } from '../types';

interface TaskItemProps {
    task: Task;
}

const statusColors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-800 border-gray-200',
    in_progress: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    blocked: 'bg-red-100 text-red-800 border-red-200',
};

const TaskItem: React.FC<TaskItemProps> = ({ task }) => {
    return (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex justify-between items-center mb-3 hover:shadow-md transition-shadow">
            <div>
                <h3 className="font-semibold text-gray-900 text-lg">{task.title}</h3>
                {task.description && (
                    <p className="text-gray-600 text-sm mt-1">{task.description}</p>
                )}
            </div>
            <div className="flex items-center space-x-3">
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[task.status] || statusColors.pending}`}>
                    {task.status.replace('_', ' ').toUpperCase()}
                </span>
            </div>
        </div>
    );
};

export default TaskItem;
