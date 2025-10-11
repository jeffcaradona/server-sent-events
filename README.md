# Server-Sent Events (SSE) Demo Application

A modern implementation of Server-Sent Events featuring an **Observable pattern** for client-side event handling and a robust Express.js backend.

## ✨ Features

- 🔄 **Observable Pattern** - Functional reactive programming with vanilla JavaScript
- 🎯 **Composable Operators** - Chain `filter`, `map`, `tap` for data transformation
- 🧹 **Automatic Cleanup** - Memory-safe subscriptions and lifecycle management
- 📊 **Real-time Updates** - Server pushes time updates via SSE
- 🛡️ **Graceful Shutdown** - Proper connection cleanup on server shutdown
- 🧪 **Fully Tested** - Comprehensive test suite for Observable pattern
- 📦 **Zero Dependencies** - Pure vanilla JavaScript (client-side)
- 📚 **Extensive Documentation** - Guides, diagrams, and examples

## 🚀 Quick Start

### Installation

```bash
npm install
```

### Running the Application

```bash
npm start
```

Visit `http://localhost:3000/time` to see SSE in action.

### Running Tests

```bash
npm test
```

## 📖 Documentation

**[📚 Full Documentation Index](docs/README.md)**

### Quick Links

- **[Observable Pattern Guide](docs/OBSERVABLE_PATTERN.md)** - Complete Observable documentation
- **[Quick Reference](docs/QUICK_REFERENCE.md)** - Cheat sheet for common patterns
- **[Observable Diagrams](docs/OBSERVABLE_DIAGRAMS.md)** - Visual architecture guide
- **[Testing Guide](docs/TESTING.md)** - How to test the application
- **[Migration Guide](docs/OBSERVABLE_REFACTOR.md)** - Migrating to Observable pattern

## 🎯 Example Usage

### Client-Side (Observable Pattern)

```javascript
import { createSSEObservable, parseSSEData } from './sse-client.js';

// Create an Observable from SSE endpoint
const timeStream$ = createSSEObservable('/sse/time');

// Build a processing pipeline
const subscription = timeStream$
  .filter(({ type }) => type === 'message')
  .map(({ event }) => parseSSEData(event))
  .filter(({ status }) => status === 'ok')
  .map(({ payload }) => payload)
  .subscribe({
    next: (data) => console.log('Received:', data),
    error: (err) => console.error('Error:', err),
    complete: () => console.log('Stream closed')
  });

// Cleanup when done
subscription.unsubscribe();
```

### Server-Side

```javascript
// In your Express route
router.get('/sse/time', sseSendTimeController);

// Server pushes events to clients
sseHelper.broadcast({
  type: 'time',
  utc: new Date().toISOString()
});
```

## 🏗️ Architecture

### Client-Side (Observable Pattern)

```
EventSource → Observable → Operators → Observer
                              ↓
                    [filter → map → tap]
                              ↓
                    {next, error, complete}
```

**Key Components:**
- **Observable**: Wraps EventSource, provides operator chaining
- **Operators**: Transform data (`map`, `filter`, `tap`)
- **Observer**: Consumes processed data with callbacks
- **Subscription**: Manages connection and cleanup

See [Observable Architecture Diagrams](docs/OBSERVABLE_DIAGRAMS.md) for detailed visuals.

### Server-Side

```
Express Routes → SSE Controller → SSE Helper → Clients
                                      ↓
                              [Broadcast, Track, Cleanup]
```

**Key Components:**
- **SSE Helper**: Manages client connections and broadcasting
- **SSE Router**: Defines SSE endpoints
- **Controllers**: Handle SSE logic
- **Shutdown Hooks**: Graceful connection cleanup

## 📁 Project Structure

```
server-sent-events/
├── bin/
│   └── www                          # Server entry point
├── docs/                            # 📚 All documentation
│   ├── README.md                   # Documentation index
│   ├── OBSERVABLE_PATTERN.md       # Observable guide
│   ├── OBSERVABLE_README.md        # Getting started
│   ├── QUICK_REFERENCE.md          # Cheat sheet
│   ├── OBSERVABLE_REFACTOR.md      # Migration guide
│   ├── OBSERVABLE_DIAGRAMS.md      # Visual guide
│   ├── SERVER_SSE.md               # Server docs
│   ├── TESTING.md                  # Test guide
│   ├── REFACTOR_SUMMARY.md         # History
│   └── diagrams/                   # 📊 All Mermaid diagrams
│       ├── observable-*.mmd        # Client diagrams
│       ├── server-*.mmd            # Server diagrams
│       └── README.md               # Diagram index
├── public/
│   ├── javascripts/
│   │   ├── sse-client.js          # 🌟 Observable implementation
│   │   ├── time.js                 # Example client
│   │   └── sse-observable-examples.js  # More examples
│   └── stylesheets/
├── src/
│   ├── app.js                      # Express app
│   ├── controllers/                # Route controllers
│   ├── models/                     # Data models
│   ├── modules/
│   │   ├── sse/                    # SSE server implementation
│   │   └── hooks/                  # Server hooks
│   ├── routes/                     # Express routes
│   ├── utils/                      # Utilities
│   └── views/                      # EJS templates
├── test/
│   ├── observable.test.js          # Observable tests
│   └── sseHelper.test.js           # Server tests
├── package.json
└── README.md                       # This file
```

## 🔑 Key Concepts

### Observable Pattern

The Observable pattern provides a declarative way to handle asynchronous event streams:

**Benefits:**
- ✅ Composable - Chain operators for complex transformations
- ✅ Reusable - Create custom operators for common tasks
- ✅ Testable - Easy to unit test each operator
- ✅ Multiple Subscribers - Share streams across components
- ✅ Automatic Cleanup - Unsubscribe handles all cleanup
- ✅ Standard Interface - Consistent `next`, `error`, `complete` callbacks

### Operators

Transform data as it flows through the Observable:

- **`filter(predicate)`** - Only emit values that pass the test
- **`map(fn)`** - Transform each value
- **`tap(fn)`** - Perform side effects without modifying the stream

### Migration from Effect-Based Pattern

**Before:**
```javascript
const client = createSSEClient({
  url: "/sse/time",
  logger: console,
  eventHandler: getTimeEventEffects
});
```

**After (Observable):**
```javascript
const subscription = createSSEObservable("/sse/time")
  .filter(({ type }) => type === "message")
  .map(({ event }) => parseSSEData(event))
  .subscribe(handleData);
```

See [Migration Guide](docs/OBSERVABLE_REFACTOR.md) for details.

## 🧪 Testing

Run all tests:
```bash
npm test
```

Run specific test:
```bash
node test/observable.test.js
```

See [Testing Guide](docs/TESTING.md) for writing tests.

## 📊 Diagrams

All architecture diagrams are available in [`docs/diagrams/`](docs/diagrams/):

- Observable Architecture
- Observable Data Flow (Sequence Diagram)
- Pattern Comparison (Old vs New)
- Multiple Subscribers Pattern
- Observable Lifecycle (State Diagram)
- Operator Chaining Example
- Client Time Flow
- Server SSE Architecture
- Server SSE Lifecycle
- Server Shutdown Process
- Server Hooks System

View online or in VS Code with Mermaid Preview extension.

## 🛠️ Technologies

**Client-Side:**
- Vanilla JavaScript (ES6+)
- EventSource API
- Observable Pattern (custom implementation)
- Mermaid (for diagrams)

**Server-Side:**
- Node.js
- Express.js
- EJS (templating)
- Custom SSE Helper

**Testing:**
- Node.js built-in test runner
- Custom test utilities

## 📝 Examples

See [`public/javascripts/sse-observable-examples.js`](public/javascripts/sse-observable-examples.js) for 10+ comprehensive examples:

1. Basic Observable usage
2. Operator chaining
3. Multiple subscribers
4. Custom operators
5. Error recovery
6. Stream merging
7. Conditional subscriptions
8. Rate limiting
9. State management
10. Auto-reconnection

## 🤝 Contributing

When contributing:

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Create/update diagrams if architecture changes
5. Run tests before submitting

See [Documentation Standards](docs/README.md#-documentation-standards).

## 📄 License

See [LICENSE](LICENSE) file for details.

## 🔗 Resources

- [MDN: Server-Sent Events](https://developer.mozilla.org/en-US/docs/Web/API/Server-sent_events)
- [Observable Pattern](https://en.wikipedia.org/wiki/Observer_pattern)
- [ReactiveX](http://reactivex.io/)
- [Functional Reactive Programming](https://en.wikipedia.org/wiki/Functional_reactive_programming)

---

**Built with ❤️ using functional reactive programming principles**