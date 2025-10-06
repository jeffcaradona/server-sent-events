# Server-Sent Events Demo

A production-ready demonstration of Server-Sent Events (SSE) implementation using Express.js, showcasing functional programming principles and pragmatic architectural decisions.

## Overview

This project demonstrates how to implement SSE with clean architecture, proper separation of concerns, and production-ready patterns. It serves as both a working demo and a guideline for implementing SSE in high-volume production environments.

## Architecture

### Core Principles

- **Functional Programming**: Pure functions, immutable data structures, and minimal side effects
- **Separation of Concerns**: Clear boundaries between transport, business logic, and presentation
- **Backward Compatibility**: Support for legacy message formats during transitions
- **Production Ready**: Proper error handling, logging, and resource management

### Project Structure

```
src/
├── controllers/           # HTTP request handlers
│   └── sseSendTimeController.js
├── models/               # Data structures and contracts
│   ├── index.js         # Centralized exports
│   ├── sseMessageFormats.js    # Message format definitions
│   ├── sseEventStructure.js    # SSE wire format specs
│   └── timeModels.js           # Time domain models
├── modules/sse/          # SSE functionality
│   └── sseHelper.js     # Pure functions and client management
├── routes/              # Express routing
├── utils/              # Utilities (logger, etc.)
└── views/              # EJS templates
```

## Key Components

### 1. Message Format Models (`src/models/`)

Defines clear contracts for message structures:

- **Legacy Formats**: Backward compatible with existing clients
- **Enhanced Formats**: Structured messages with type-based routing
- **Format Converters**: Pure functions for format transformation
- **Validators**: Type checking and format validation

### 2. SSE Helper (`src/modules/sse/sseHelper.js`)

Pure functional utilities for SSE operations:

```javascript
// Pure message creation functions
const timeMessage = createTimeMessage();
const shutdownMessage = createShutdownMessage('shutdown');

// Functional client management
const clientCount = ClientManager.addClient(res);
const results = ClientManager.broadcast(message, logger);
```

### 3. Controller Layer (`src/controllers/`)

Thin HTTP layer that orchestrates SSE functionality:

- Uses pure functions for message creation
- Delegates client management to functional services
- Maintains proper Express.js patterns
- Comprehensive logging and error handling

## SSE Implementation Features

### ✅ Current Features

- **Real-time Time Broadcasting**: UTC timestamps every 3 seconds
- **Client Connection Management**: Automatic cleanup on disconnect
- **Graceful Shutdown**: Proper client notification during server shutdown
- **Functional Architecture**: Pure functions and immutable data
- **Legacy Compatibility**: Maintains existing client contracts
- **Production Logging**: Comprehensive connection and error logging

### 🔄 Extensible Design

The architecture supports easy extension for:

- **Heartbeat Systems**: Built-in support for connection health checks
- **Multiple Data Types**: Time, notifications, user events, etc.
- **Enhanced Message Formats**: Type-based routing for different clients
- **Load Testing**: Scalable client management design

## Message Formats

### Legacy Format (Current)
```javascript
// Time messages
{ "utc": "2025-10-05T14:30:00.000Z" }

// Shutdown messages  
{ "type": "shutdown" }
```

### Enhanced Format (Future)
```javascript
// Time messages with metadata
{
  "type": "time-update",
  "utc": "2025-10-05T14:30:00.000Z", 
  "timestamp": 1728134200000,
  "timezone": "UTC"
}

// Rich shutdown messages
{
  "type": "shutdown",
  "reason": "Server maintenance", 
  "timestamp": "2025-10-05T14:30:00.000Z"
}
```

## Getting Started

### Prerequisites
- Node.js 22+
- Modern browser with EventSource support

### Installation
```bash
npm install
```

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run start:prod
```

## Usage

### Browser Client
Navigate to `/time` to see real-time UTC timestamps in your browser console.

### SSE Endpoint
Connect to `/sse/time` via EventSource:

```javascript
const eventSource = new EventSource('/sse/time');
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Server UTC:', data.utc);
};
```

## Development Patterns

### Functional Programming Examples

**Pure Message Creation:**
```javascript
// ✅ Pure function - predictable output, no side effects
export function createTimeMessage() {
  return {
    utc: new Date().toISOString()
  };
}
```

**Immutable Client Management:**
```javascript
// ✅ Functional interface with clear return values
const clientCount = ClientManager.addClient(res);
const results = ClientManager.broadcast(message, logger);
```

**Separation of Concerns:**
```javascript
// ✅ Controller focuses on HTTP concerns
export const time = (req, res) => {
  setupSSEHeaders(res);
  const clientCount = ClientManager.addClient(res);
  
  const sendTime = () => {
    const timeMessage = createTimeMessage(); // Pure function
    res.write(createSSEMessage(timeMessage)); // Pure function
  };
};
```

## Production Considerations

### Resource Management
- Automatic client cleanup on disconnect
- Proper interval clearing to prevent memory leaks
- Connection limit handling (extensible)

### Error Handling
- Graceful degradation for network errors
- Comprehensive logging for debugging
- Safe shutdown procedures

### Scalability
- Functional design enables easy testing
- Modular architecture supports feature extension
- Clean separation allows independent scaling

## Migration Strategy

The codebase demonstrates a 4-phase migration approach:

1. **Phase 1**: Backward compatible server (current)
2. **Phase 2**: Enhanced client with legacy fallback
3. **Phase 3**: Full enhanced mode with event types  
4. **Phase 4**: Legacy cleanup

This allows safe production migrations without breaking existing clients.

## Contributing

This project follows functional programming principles:

- Write pure functions where possible
- Maintain immutable data structures  
- Separate side effects from business logic
- Document message formats and contracts
- Test compatibility scenarios

## License

[Add your license here]

