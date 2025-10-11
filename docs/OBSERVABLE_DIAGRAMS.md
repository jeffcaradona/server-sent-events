# Observable Pattern Architecture - Visual Guide

This document provides visual representations of the Observable pattern implementation for Server-Sent Events (SSE).

## 1. Main Architecture

The core architecture shows how data flows from the SSE server through the Observable pattern to the Observer.

```mermaid
graph TB
    subgraph "SSE Server"
        Server[SSE Endpoint<br>/sse/time]
    end

    subgraph "Browser - Observable Pattern"
        ES[EventSource]
        Obs[Observable]
        
        subgraph "Operators Pipeline"
            Filter1[filter: type === 'message']
            Map1[map: extract event]
            Map2[map: parseSSEData]
            Filter2[filter: status === 'ok']
            Map3[map: extract payload]
        end
        
        subgraph "Observer"
            Next[next: process data]
            Error[error: handle errors]
            Complete[complete: cleanup]
        end
        
        Sub[Subscription]
    end

    Server -->|SSE Events| ES
    ES -->|wrap| Obs
    
    Obs --> Filter1
    Filter1 --> Map1
    Map1 --> Map2
    Map2 --> Filter2
    Filter2 --> Map3
    
    Map3 --> Next
    Obs -.error.-> Error
    Obs -.complete.-> Complete
    
    Next -.subscription.-> Sub
    Error -.subscription.-> Sub
    Complete -.subscription.-> Sub
    
    Sub -->|unsubscribe| ES

    style Server fill:#e1f5ff
    style Obs fill:#fff4e1
    style Filter1 fill:#f0f0f0
    style Map1 fill:#f0f0f0
    style Map2 fill:#f0f0f0
    style Filter2 fill:#f0f0f0
    style Map3 fill:#f0f0f0
    style Next fill:#e8f5e9
    style Error fill:#ffebee
    style Complete fill:#f3e5f5
```

**Key Components:**
- **SSE Server**: Sends events via Server-Sent Events
- **EventSource**: Browser API that receives SSE events
- **Observable**: Wraps EventSource and provides operator chaining
- **Operators Pipeline**: Transform and filter data (map, filter)
- **Observer**: Consumes the processed data with callbacks (next, error, complete)
- **Subscription**: Manages the connection and cleanup

---

## 2. Observable Data Flow (Sequence)

This sequence diagram shows the temporal flow of events from server connection to cleanup.

```mermaid
sequenceDiagram
    participant Server as SSE Server
    participant ES as EventSource
    participant Obs as Observable
    participant Ops as Operators
    participant Observer as Observer
    participant UI as UI/Console

    Server->>ES: SSE: onopen
    ES->>Obs: emit {type: 'open'}
    Obs->>Ops: filter out (not message)
    
    Server->>ES: SSE: onmessage
    ES->>Obs: emit {type: 'message', event}
    Obs->>Ops: filter → passes
    Ops->>Ops: map → extract event
    Ops->>Ops: map → parse JSON
    Ops->>Ops: filter → check valid
    Ops->>Ops: map → extract payload
    Ops->>Observer: next(payload)
    Observer->>UI: display data
    
    Server->>ES: SSE: onerror
    ES->>Obs: emit error
    Obs->>Observer: error(err)
    Observer->>UI: log error
    
    Note over UI: User closes page
    UI->>Observer: unsubscribe()
    Observer->>ES: close()
    ES->>Obs: complete()
    Obs->>Observer: complete()
```

**Event Flow:**
1. Connection opens (onopen)
2. Server sends messages (onmessage)
3. Data flows through operator pipeline
4. Observer callbacks process final data
5. Errors are handled gracefully (onerror)
6. Cleanup happens on unsubscribe

---

## 3. Pattern Comparison

Visual comparison between the old effect-based pattern and the new Observable pattern.

```mermaid
graph LR
    subgraph "Old Pattern: Effect-Based"
        A1[SSE Event] --> B1[eventHandler]
        B1 --> C1[Generate Effects Array]
        C1 --> D1[Execute Each Effect]
        D1 --> E1[Side Effects]
    end
    
    subgraph "New Pattern: Observable"
        A2[SSE Event] --> B2[Observable]
        B2 --> C2[Operators Pipeline]
        C2 --> D2[Subscribe]
        D2 --> E2[Observer Callbacks]
    end
    
    style A1 fill:#ffebee
    style B1 fill:#ffebee
    style C1 fill:#ffebee
    style D1 fill:#ffebee
    style E1 fill:#ffebee
    
    style A2 fill:#e8f5e9
    style B2 fill:#e8f5e9
    style C2 fill:#e8f5e9
    style D2 fill:#e8f5e9
    style E2 fill:#e8f5e9
```

**Advantages of Observable Pattern:**
- More declarative and composable
- Better error handling
- Easier to test
- Standard observer interface
- Operator chaining for transformations

---

## 4. Multiple Subscribers Pattern

Demonstrates how one Observable can serve multiple independent subscribers.

```mermaid
graph TB
    SSE[SSE Observable<br>/sse/time]
    
    Filter[filter: messages only]
    Parse[map: parse JSON]
    
    Sub1[Subscriber 1<br>Console Logger]
    Sub2[Subscriber 2<br>UI Updater]
    Sub3[Subscriber 3<br>Analytics]
    
    SSE --> Filter
    Filter --> Parse
    
    Parse --> Sub1
    Parse --> Sub2
    Parse --> Sub3
    
    Sub1 --> Console[console.log]
    Sub2 --> DOM[Update DOM]
    Sub3 --> Track[Track Event]
    
    style SSE fill:#e1f5ff
    style Filter fill:#fff4e1
    style Parse fill:#fff4e1
    style Sub1 fill:#e8f5e9
    style Sub2 fill:#e8f5e9
    style Sub3 fill:#e8f5e9
```

**Use Cases:**
- **UI Updates**: Display data on the page
- **Logging**: Console or remote logging
- **Analytics**: Track events and metrics
- **State Management**: Update application state

---

## 5. Observable Lifecycle

State diagram showing all possible states and transitions of an Observable.

```mermaid
stateDiagram-v2
    [*] --> Created: new Observable()
    Created --> Subscribed: subscribe(observer)
    
    Subscribed --> Emitting: observer.next()
    Emitting --> Emitting: more values
    
    Emitting --> Error: observer.error()
    Emitting --> Completed: observer.complete()
    Emitting --> Unsubscribed: unsubscribe()
    
    Error --> [*]
    Completed --> [*]
    Unsubscribed --> [*]
    
    note right of Subscribed
        EventSource connects
        Operators chain created
    end note
    
    note right of Emitting
        Values flow through
        operator pipeline
    end note
    
    note right of Unsubscribed
        EventSource closes
        Cleanup functions run
    end note
```

**States:**
- **Created**: Observable instantiated but not subscribed
- **Subscribed**: Observer connected, EventSource opened
- **Emitting**: Actively sending values through pipeline
- **Error**: Stream encountered an error and terminated
- **Completed**: Stream finished normally
- **Unsubscribed**: Manually disconnected and cleaned up

---

## 6. Operator Chaining Example

Concrete example showing how data transforms through chained operators.

```mermaid
graph LR
    Input[Input Stream<br>1,2,3,4,5] --> Filter[filter: x > 2]
    Filter --> |3,4,5| Map[map: x * 2]
    Map --> |6,8,10| Filter2[filter: x < 10]
    Filter2 --> |6,8| Output[Output<br>6,8]
    
    style Input fill:#e1f5ff
    style Filter fill:#fff4e1
    style Map fill:#fff4e1
    style Filter2 fill:#fff4e1
    style Output fill:#e8f5e9
```

**Pipeline Steps:**
1. **Input**: `[1, 2, 3, 4, 5]`
2. **Filter (x > 2)**: `[3, 4, 5]`
3. **Map (x * 2)**: `[6, 8, 10]`
4. **Filter (x < 10)**: `[6, 8]`
5. **Output**: `[6, 8]`

**Code Example:**
```javascript
const stream$ = createObservable([1, 2, 3, 4, 5])
  .filter(x => x > 2)
  .map(x => x * 2)
  .filter(x => x < 10)
  .subscribe(console.log); // Outputs: 6, 8
```

---

## Color Legend

All diagrams follow a consistent color scheme:

| Color | Hex Code | Usage |
|-------|----------|-------|
| 🔵 Blue | `#e1f5ff` | Source/Input (Server, EventSource, Input data) |
| 🟡 Yellow | `#fff4e1` | Processing/Operators (Observable, Filters, Maps) |
| 🟢 Green | `#e8f5e9` | Success/Output (Observers, Subscribers, Results) |
| 🔴 Red | `#ffebee` | Errors or deprecated patterns |
| 🟣 Purple | `#f3e5f5` | Completion/Lifecycle events |
| ⚪ Gray | `#f0f0f0` | Pipeline/Processing steps |

---

## Related Documentation

- **[Observable Pattern Guide](OBSERVABLE_PATTERN.md)** - Complete documentation
- **[Quick Reference](QUICK_REFERENCE.md)** - Cheat sheet for daily use
- **[Refactor Summary](OBSERVABLE_REFACTOR.md)** - Migration information
- **[Code Examples](../public/javascripts/sse-observable-examples.js)** - Working examples
- **[Tests](../test/observable.test.js)** - Test suite

---

## Viewing These Diagrams

### In VS Code

1. Install the **Mermaid Preview** extension
2. Open this file
3. Click the preview icon or use Command Palette: "Mermaid: Preview Diagram"

### Online

Copy any diagram code block and paste into [Mermaid Live Editor](https://mermaid.live/)

### In Documentation

These diagrams are embedded in markdown and will render automatically in:
- GitHub
- GitLab
- VS Code (with Mermaid extension)
- Most modern markdown viewers

---

## Individual Diagram Files

For easier editing and reuse, each diagram is also available as a standalone `.mmd` file:

- [`diagrams/observable-architecture.mmd`](diagrams/observable-architecture.mmd)
- [`diagrams/observable-dataflow.mmd`](diagrams/observable-dataflow.mmd)
- [`diagrams/pattern-comparison.mmd`](diagrams/pattern-comparison.mmd)
- [`diagrams/multiple-subscribers.mmd`](diagrams/multiple-subscribers.mmd)
- [`diagrams/observable-lifecycle.mmd`](diagrams/observable-lifecycle.mmd)
- [`diagrams/operator-chaining.mmd`](diagrams/operator-chaining.mmd)

See [`diagrams/README.md`](diagrams/README.md) for more information about editing and using these diagrams.
