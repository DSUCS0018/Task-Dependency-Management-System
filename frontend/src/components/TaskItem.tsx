import React, { useState } from 'react';
import type { Task, TaskStatus } from '../types';
import DependencySelector from './DependencySelector';

interface TaskItemProps {
    task: Task;
    dependentTitles: string[];
    onStatusChange: (taskId: number, newStatus: TaskStatus) => Promise<void>;
    onRefresh: () => void;
    onDelete?: (taskId: number) => Promise<void>;
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'completed':
            return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_10px_rgba(52,211,153,0.1)]';
        case 'in_progress':
            return 'bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-[0_0_10px_rgba(96,165,250,0.1)]';
        case 'blocked':
            return 'bg-red-500/10 text-red-400 border-red-500/20 shadow-[0_0_10px_rgba(248,113,113,0.1)]';
        default:
            return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
};

const TaskItem: React.FC<TaskItemProps> = ({ task, dependentTitles, onStatusChange, onRefresh, onDelete }) => {
    const [isUpdating, setIsUpdating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
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

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!onDelete) return;

        // Custom confirm dialogue logic could go here, for now using native
        let message = `Delete "${task.title}"?`;
        if (dependentTitles.length > 0) {
            message = `Warning: Tasks depend on this:\n${dependentTitles.map(t => `- ${t}`).join('\n')}\n\nDelete anyway?`;
        }

        if (window.confirm(message)) {
            try {
                setIsDeleting(true);
                await onDelete(task.id);
            } catch (error) {
                console.error("Failed to delete", error);
                setIsDeleting(false);
            }
        }
    };

    return (
        <div className={`
            glass-card rounded-xl p-5 relative overflow-hidden group
            ${isDeleting ? 'opacity-50 pointer-events-none' : ''}
            transition-all duration-300 hover:-translate-y-1
        `}>
            {/* Status Line/Glow */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getStatusColor(task.status).split(' ')[0].replace('/10', '')} opacity-50`} />

            <div className="flex justify-between items-start mb-3 pl-2">
                <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">ID: #{task.id}</span>
                    <h3 className="font-bold text-lg text-slate-100 leading-tight">{task.title}</h3>
                </div>

                {onDelete && (
                    <button
                        onClick={handleDelete}
                        className="text-slate-600 hover:text-red-400 transition-colors p-1 rounded-md hover:bg-red-500/10"
                        title="Delete Task"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>

            <p className="text-slate-400 text-sm mb-4 pl-2 min-h-[3rem]">
                {task.description || <span className="italic opacity-50">No description</span>}
            </p>

            <div className="flex items-center justify-between pl-2 pt-2 border-t border-white/5 mt-auto">
                <div className="relative">
                    {isUpdating && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 rounded z-10"><svg className="animate-spin h-3 w-3 text-white" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg></div>}
                    <select
                        value={task.status}
                        onChange={handleStatusChange}
                        className={`text-xs font-semibold px-2.5 py-1 rounded-md border appearance-none cursor-pointer focus:ring-1 focus:ring-primary/50 outline-none transition-all pr-6 ${getStatusColor(task.status)}`}
                        style={{ backgroundImage: 'none' }} // Hide default arrow if we want custom or none
                    >
                        <option value="pending">PENDING</option>
                        <option value="in_progress">IN PROGRESS</option>
                        <option value="completed">COMPLETED</option>
                        <option value="blocked">BLOCKED</option>
                    </select>
                </div>

                <button
                    onClick={() => setShowDependencies(!showDependencies)}
                    className={`text-xs flex items-center gap-1 transition-colors ${showDependencies ? 'text-primary' : 'text-slate-500 hover:text-slate-300'}`}
                >
                    <span className="text-lg">🔗</span>
                    {task.dependencies?.length || 0}
                </button>
            </div>

            {/* Dependency Panel */}
            <div className={`transition-all duration-300 overflow-hidden ${showDependencies ? 'max-h-60 opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                {task.dependencies && task.dependencies.length > 0 && (
                    <div className="mb-2">
                        <span className="text-[10px] uppercase text-slate-500 font-bold">Waits for:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {task.dependencies.map(id => (
                                <span key={id} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                    #{id}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                <DependencySelector
                    currentTaskId={task.id}
                    onDependencyAdded={() => onRefresh && onRefresh()}
                />
            </div>
        </div>
    );
};

export default TaskItem;
