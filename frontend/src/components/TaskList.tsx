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
            <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                No tasks found. Add one to get started!
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
