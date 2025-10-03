const clients = [];

export const time = (req, res) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.flushHeaders();

    clients.push(res);

    const sendTime = () => {
        const utc = new Date().toISOString();
        res.write(`data: ${JSON.stringify({ utc })}\n\n`);
    };

    sendTime();
    const interval = setInterval(sendTime, 3000);

    req.on('close', () => {
        clearInterval(interval);
        // Remove client from list on disconnect
        const idx = clients.indexOf(res);
        if (idx !== -1) clients.splice(idx, 1);
    });
};

// Export a function to broadcast shutdown
export const broadcastShutdown = () => {
    clients.forEach(res => {
        res.write(`data: ${JSON.stringify({ type: "shutdown" })}\n\n`);
        res.end();
    });
    clients.length = 0;
};