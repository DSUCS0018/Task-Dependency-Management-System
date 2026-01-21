# Design Decisions

## 1. Data Modeling: Directed Graph
Tasks and their dependencies are modeled as a Directed Graph where:
- **Nodes** represents Tasks.
- **Edges** represent Dependencies (A -> B means A depends on B).

This structure allows us to naturally map the problem to graph theory concepts like Cycle Detection (Circular Dependencies) and Topological Sort (Ordering/Status Propagation).

## 2. Circular Dependency Detection: Depth-First Search (DFS)
We chose **Depth-First Search (DFS)** to detect circular dependencies.

### Why DFS?
- **Cycle Path Retrieval**: A requirement was to return the *exact path* of the cycle (e.g., `A -> B -> C -> A`). DFS maintains a recursion stack (or path history) which makes it trivial to reconstruct the cycle path once a verified node is encountered again in the current recursion stack.
- **Efficiency**: DFS is efficient for this purpose. If we used an algorithm like Kahn's algorithm (Topological Sort), it detects *if* a cycle exists, but reconstructing the specific cycle path is less straightforward than with DFS.

### Time Complexity
- **Time**: **O(V + E)**, where V is the number of tasks and E is the number of dependencies. In the worst case, we traverse all directly accessible nodes.
- **Space**: **O(V)** for the recursion stack and visited set.

## 3. Defensive Design: Validation
Validation logic is implemented in two places:
1.  **Service Layer (`tasks/services.py`)**: The primary logic for detecting cycles and returning the specific path required by the API resides here. This keeps the views clean and logic reusable.
2.  **Model Layer (`tasks/models.py`)**: The `clean()` method checks for basic self-references and ensures data integrity at the database level, preventing bad data from entering even if created outside the API (e.g., via Admin).

## 4. Status Propagation
Status updates use a recursive approach:
- When a task changes, we identify "dependent" tasks (incoming edges).
- We re-evaluate their status based on simple rules (All completed -> Ready; Any blocked -> Blocked).
- If a dependent task's status changes, we recurse further.
- **Safety**: Since we guarantee no circular dependencies exist (via the detection logic), this recursion is guaranteed to terminate and form a Directed Acyclic Graph (DAG).

## 5. Additional Frontend Design Decisions

### SVG for Graph Visualization
We chose raw **SVG** over heavy charting libraries (like D3.js or Cytoscape) to keep the project lightweight and maintain full control over the rendering logic. SVG is performant for the target node count (20-30+) and allows for easy implementation of custom interactions like zoom, pan, and highlighting.

### Hierarchical Layout (Longest Path)
Instead of a complex force-directed layout, we implemented a deterministic **Hierarchical Layout** based on the Longest Path in the DAG (level assignment). This ensures that dependencies always flow clearly from left to right (or top to bottom), making the dependency chain immediately understandable to the user.

### Defensive UX & Validation
The frontend mirrors backend validation rules (e.g., preventing self-dependencies in the dropdown) to provide immediate feedback. However, it still gracefully handles backend errors (like cycle detection 400s) by displaying user-friendly messages with the specific cycle path, ensuring the user is never left guessing why an action failed.

### Impact Analysis on Delete
Deleting a task that others depend on is a destructive action that breaks the dependency chain. To prevent accidental data loss or invalid states, we implemented an **Impact Analysis Warning**. The system calculates dependent tasks on the fly and presents a confirmation dialog listing all tasks that will be affected, allowing the user to make an informed decision.
