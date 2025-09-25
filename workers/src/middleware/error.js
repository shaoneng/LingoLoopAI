export const errorHandler = async (c, next) => {
    try {
        await next();
    }
    catch (error) {
        console.error('Worker error:', error);
        const message = error instanceof Error ? error.message : 'Internal error';
        c.status(500);
        return c.json({ error: message });
    }
};
