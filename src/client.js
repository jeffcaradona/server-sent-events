/**
 * Initializes the EventSource connection.
 * @param {string} url - The SSE endpoint URL.
 * @returns {EventSource} - The initialized EventSource instance.
 */
function initEventSource(url) {
    // Validate the URL input for security
    if (typeof url !== 'string' || !/^https?:\/\//.test(url)) {
        throw new Error('Invalid URL for EventSource.');
    }
    return new EventSource(url);
}

function onReady() {
    // ...existing code...
    // Instead of directly creating evtSource, use the init function
    const evtSource = initEventSource('/events');
    // ...existing code...
}

// ...existing code...