export const time = (req, res) => {
    res.set({
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });
    res.flushHeaders();

    const sendTime = () => {
        const utc = new Date().toISOString();
        res.write(`data: ${JSON.stringify({ utc })}\n\n`);
    };

    sendTime();
    const interval = setInterval(sendTime, 3000);

    req.on('close', () => clearInterval(interval));
};