# Project Write-up

## 1. Circular Dependency Detection Algorithm

To detect circular dependencies (cycles), we implemented a **Depth-First Search (DFS)** algorithm.

### Algorithm Logic
The algorithm maintains two sets during traversal:
1.  **`visited`**: Tracks all nodes that have been completely processed.
2.  **`recursion_stack`**: Tracks the nodes in the *current* traversal path.

For each node:
1.  If the node is in `recursion_stack`, a cycle is detected. We backtrack to reconstruct the exact path (e.g., `A -> B -> C -> A`).
2.  If the node is in `visited`, we skip it (optimization).
3.  Otherwise, add to `recursion_stack` and recursively visit all neighbors (dependencies).
4.  After visiting all neighbors, remove from `recursion_stack` and add to `visited`.

### Time & Space Complexity
*   **Time Complexity**: **O(V + E)**, where `V` is the number of tasks (vertices) and `E` is the number of dependencies (edges). In the worst case, the algorithm visits every node and edge once.
*   **Space Complexity**: **O(V)**. This is required for the `visited` set, `recursion_stack`, and the maximum depth of the implicit recursion stack (which can be `V` in a linear graph).

---

## 2. Most Challenging Part & Solution

The most challenging aspect was **Implementing the Dependency Graph Visualization without external libraries**.

### The Problem
We needed to visualize the task dependencies as a Directed Graph. It required:
*   A clear "Hierarchical" layout where dependencies flow logically (e.g., top-to-bottom or left-to-right).
*   Interactive features like Zoom, Pan, and Node Highlighting.
*   **Constraint**: No heavy libraries like D3.js or React Flow were allowed to keep the frontend lightweight.

### The Solution
We built a custom **SVG-based Graph Component** (`GraphView.tsx`) from scratch:
1.  **Layout Algorithm**: We implemented a **"Longest Path" Layering Algorithm**.
    *   First, we calculated the "level" of each node based on the longest path from a root node (in-degree 0).
    *   `Level(U) = Max(Level(Dependencies)) + 1`
    *   This naturally arranged tasks into columns/ranks, ensuring dependencies always point in one direction.
2.  **Rendering**: We used React to render SVG `<g>`, `<rect>`, and `<line>` elements based on the calculated coordinates.
3.  **Interactions**: We implemented custom logic for:
    *   **Zoom/Pan**: Using SVG `matrix` transformations or simple `viewBox` manipulation.
    *   **Highlighting**: A custom recursive function to identify and highlight all upstream dependencies and downstream dependents when a node is clicked.

---

## 3. Future Improvements (Given more time)

If we had more time, we would implement:

1.  **Real-Time Collaboration (WebSockets)**:
    *   Currently, users must refresh to see status updates from others. Using **Django Channels** or **WebSockets**, we could push status changes instantly to all connected clients.

2.  **Drag-and-Drop Dependency Management**:
    *   Enhance the Graph View to allow users to draw lines between nodes to create dependencies interactively, rather than using a dropdown form.

3.  **Performance Optimization for Large Graphs**:
    *   For graphs with 1000+ nodes, the current SVG implementation might struggle. We would implement **Canvas-based rendering** or **Windowing/Virtualization** to only render nodes currently visible in the viewport.
