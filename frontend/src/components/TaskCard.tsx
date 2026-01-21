import React from 'react';

interface Task {
    id: number;
    title: string;
    description: string;
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
    dependencies: number[];
}

interface TaskCardProps {
    task: Task;
    onClick?: () => void;
}

const getStatusColor = (status: Task['status']) => {
    switch (status) {
        case 'COMPLETED':
            return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
        case 'IN_PROGRESS':
            return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
        default:
            return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
    }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
    return (
        <div
            onClick={onClick}
            className="group glass-card rounded-xl p-5 cursor-pointer relative overflow-hidden"
        >
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-transparent via-primary/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            <div className="flex justify-between items-start mb-3">
                <div className={`px-2.5 py-1 rounded-full text-xs font-medium border ${getStatusColor(task.status)}`}>
                    {task.status.replace('_', ' ')}
                </div>
                <span className="text-slate-500 text-xs font-mono">#{task.id}</span>
            </div>

            <h3 className="text-lg font-semibold text-slate-100 mb-2 group-hover:text-primary transition-colors">
                {task.title}
            </h3>

            <p className="text-slate-400 text-sm line-clamp-2 mb-4">
                {task.description || "No description provided."}
            </p>

            {task.dependencies && task.dependencies.length > 0 && (
                <div className="flex items-center gap-2 mt-auto pt-3 border-t border-white/5">
                    <span className="text-xs text-slate-500">Depends on:</span>
                    <div className="flex flex-wrap gap-1">
                        {task.dependencies.map((depId) => (
                            <span key={depId} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 text-[10px] border border-slate-700">
                                #{depId}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default TaskCard;
