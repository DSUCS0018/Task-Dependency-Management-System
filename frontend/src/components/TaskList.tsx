import React from 'react';
import type { Task, TaskStatus } from '../types';
import { taskService } from '../services/api';
import TaskItem from './TaskItem';

interface TaskListProps {
    tasks: Task[];
    loading: boolean;
    onRefresh: () => void;
}

const TaskList: React.FC<TaskListProps> = ({ tasks, loading, onRefresh }) => {
    const handleStatusChange = async (taskId: number, newStatus: TaskStatus) => {
        await taskService.updateTaskStatus(taskId, newStatus);
        onRefresh();
    };

    const handleDelete = async (taskId: number) => {
        try {
            await taskService.deleteTask(taskId);
            onRefresh();
        } catch (err) {
            console.error(err);
            alert('Failed to delete task');
        }
    };

    if (loading && tasks.length === 0) {
        return <div className="text-center py-8 text-gray-500">Loading tasks...</div>;
    }

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <p>No tasks found. Start by adding one above!</p>
            </div>
        );
    }

    return (
        <div className="mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Tasks</h2>
            <div className="space-y-2">
                {tasks.map((task) => {
                    // Calculate which tasks depend on this one
                    const dependentTitles = tasks
                        .filter(t => t.dependencies && t.dependencies.includes(task.id))
                        .map(t => t.title);

                    return (
                        <TaskItem
                            key={task.id}
                            task={task}
                            dependentTitles={dependentTitles}
                            onStatusChange={handleStatusChange}
                            onRefresh={onRefresh}
                            onDelete={handleDelete}
                        />
                    );
                })}
            </div>
        </div>
    );
};

export default TaskList;
