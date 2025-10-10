# Observable Pattern - Architecture Diagrams

This directory contains Mermaid diagrams illustrating the Observable pattern implementation for SSE.

## Diagrams

### 1. Observable Architecture (`observable-architecture.mmd`)
**Main architecture diagram** showing the complete flow from SSE server through EventSource, Observable, Operators, to Observer.

- Shows the component structure
- Illustrates data flow
- Highlights operator pipeline
- Demonstrates subscription lifecycle

### 2. Observable Data Flow (`observable-dataflow.mmd`)
**Sequence diagram** showing the temporal flow of events from server to UI.

- SSE connection lifecycle (open, message, error)
- Data transformation through operators
- Observer callbacks
- Cleanup on unsubscribe

### 3. Pattern Comparison (`pattern-comparison.mmd`)
**Side-by-side comparison** of the old effect-based pattern vs. new Observable pattern.

- Highlights architectural differences
- Shows code organization improvements
- Visual contrast between approaches

### 4. Multiple Subscribers (`multiple-subscribers.mmd`)
**Fan-out pattern** demonstrating how one Observable can serve multiple subscribers.

- Shared data stream
- Independent consumers (UI, analytics, logging)
- Demonstrates composability

### 5. Observable Lifecycle (`observable-lifecycle.mmd`)
**State diagram** showing Observable lifecycle states and transitions.

- Creation → Subscription → Emission
- Error handling paths
- Completion and cleanup
- State annotations

### 6. Operator Chaining (`operator-chaining.mmd`)
**Data transformation pipeline** showing how operators transform values.

- Input stream example
- Filter and map operations
- Intermediate values
- Final output

## Viewing Diagrams

### In VS Code
Install the **Mermaid Preview** extension and open any `.mmd` file.

### Online
Copy the diagram code and paste into [Mermaid Live Editor](https://mermaid.live/)

### In Markdown
Reference diagrams in markdown files:

\`\`\`markdown
![Observable Architecture](./diagrams/observable-architecture.mmd)
\`\`\`

Or embed the code:

\`\`\`mermaid
graph TB
    A[Start] --> B[End]
\`\`\`

## Diagram Standards

All diagrams follow these conventions:

### Colors
- **Blue** (`#e1f5ff`): Source/Input (Server, EventSource, Input Stream)
- **Yellow** (`#fff4e1`): Processing/Operators (Observable, Filters, Maps)
- **Green** (`#e8f5e9`): Success/Output (Observers, Subscribers, Results)
- **Red** (`#ffebee`): Errors/Old Pattern
- **Purple** (`#f3e5f5`): Completion/Lifecycle
- **Gray** (`#f0f0f0`): Pipeline steps

### Style Guide
- Node labels use clear, concise text
- Arrows show direction of data flow
- Subgraphs group related components
- Notes provide additional context
- Consistent spacing and alignment

## Editing Diagrams

To modify a diagram:

1. Open the `.mmd` file
2. Edit the Mermaid syntax
3. Preview to validate
4. Save changes

**Note**: Each `.mmd` file should contain **only one diagram** without markdown code fences.

## Resources

- [Mermaid Documentation](https://mermaid.js.org/)
- [Mermaid Flowchart Syntax](https://mermaid.js.org/syntax/flowchart.html)
- [Mermaid Sequence Diagram](https://mermaid.js.org/syntax/sequenceDiagram.html)
- [Mermaid State Diagram](https://mermaid.js.org/syntax/stateDiagram.html)
