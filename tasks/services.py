from .models import Task

def detect_cycle(source_task_id, target_task_id):
    """
    Detects if adding a dependency (source_task -> target_task) creates a cycle.
    Returns (bool, path).
    Path is a list of task IDs involved in the cycle, e.g., [1, 3, 5, 1].
    """
    if source_task_id == target_task_id:
        return True, [source_task_id, target_task_id]

    # We want to check if there is a path from target_task back to source_task.
    # If target_task -> ... -> source_task exists, then adding source_task -> target_task
    # closes the loop.
    
    # DFS Initialization
    visited = set()
    stack = [(target_task_id, [target_task_id])] # (current_id, path_so_far)

    while stack:
        current_id, path = stack.pop()
        
        if current_id == source_task_id:
            # Cycle found!
            # The path is target -> ... -> source.
            # The full cycle including the proposed edge is source -> target -> ... -> source
            full_path = [source_task_id] + path
            return True, full_path

        if current_id in visited:
            continue
        visited.add(current_id)

        try:
            current_task = Task.objects.get(id=current_id)
            # Find all tasks that 'current_task' depends on.
            # current_task.dependencies gives TaskDependency objects where task=current_task
            dependencies = current_task.dependencies.all()
            
            for dep in dependencies:
                next_id = dep.depends_on_id
                if next_id not in visited: # Optimization: don't revisit nodes in this search
                    # However, strictly for finding *any* path to source, strict 'visited' is fine.
                    # We are doing DFS, so stack structure is correct.
                    new_path = path + [next_id]
                    stack.append((next_id, new_path))
                    
        except Task.DoesNotExist:
            continue

    return False, []
