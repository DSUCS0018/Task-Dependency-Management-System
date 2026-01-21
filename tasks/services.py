from .models import Task

def detect_cycle(source_task_id, target_task_id):
    """
    Detects if adding a dependency (source_task -> target_task) creates a cycle using DFS.

    Args:
        source_task_id (int): The ID of the task that will depend on the target.
        target_task_id (int): The ID of the task being depended upon.

    Returns:
        tuple: (is_circular (bool), path (list[int]))
               - is_circular: True if a cycle is detected.
               - path: A list of task IDs representing the cycle (e.g., [1, 3, 5, 1]).
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

def update_task_status(task):
    """
    Evaluates and updates the task's status based on the status of its dependencies.

    Rules:
    - If ANY dependency is 'blocked' -> Task becomes 'blocked'.
    - If ALL dependencies are 'completed' -> Task becomes 'in_progress' (Ready).
    - If dependencies exist but not all are completed -> Task becomes 'pending'.
    
    Args:
        task (Task): The task instance to evaluate.
        
    Returns:
        bool: True if the status was changed, False otherwise.
    """
    dependencies = task.dependencies.all()
    
    if not dependencies.exists():
        # If no dependencies, we don't automatically change status based on them.
        # It's up to manual update or default state.
        return False
        
    blocked_exists = False
    all_completed = True
    
    for dep in dependencies:
        dep_status = dep.depends_on.status
        if dep_status == 'blocked':
            blocked_exists = True
        if dep_status != 'completed':
            all_completed = False
            
    new_status = task.status
    
    if blocked_exists:
        new_status = 'blocked'
    elif all_completed:
        # If previously pending or blocked, and now all dependencies are done, it becomes ready (in_progress)
        if task.status != 'completed':
            new_status = 'in_progress'
    else:
        # Dependencies exist but not all completed, and none blocked.
        # Should be pending.
        if task.status != 'completed':
            new_status = 'pending'
            
    if task.status != new_status:
        task.status = new_status
        task.save()
        return True
    
    return False

def trigger_dependent_updates(task):
    """
    Recursively triggers status updates for all tasks that depend on the given task.
    This ensures that status changes propagate through the dependency chain.
    
    Args:
        task (Task): The task that was just updated.
    """
    # Find all tasks that depend on this task
    # Reverse relation 'dependents' on TaskDependency model
    # TaskDependency.depends_on == task
    dependent_relations = task.dependents.all()
    
    for relation in dependent_relations:
        dependent_task = relation.task
        status_changed = update_task_status(dependent_task)
        
        if status_changed:
            trigger_dependent_updates(dependent_task)
