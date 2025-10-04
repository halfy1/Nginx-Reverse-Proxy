const express = require('express');
const app = express();
const port = 3000;

const instanceId = process.env.INSTANCE_ID || 1;

app.use(express.json());

app.use((req, res, next) => {
    console.log(`[App2-${instanceId}] ${req.method} ${req.path}`);
    next();
});

app.get('/', (req, res) => {
    res.json({
        message: `Hello from App2 Instance ${instanceId}!`,
        timestamp: Date.now(),
        instance: `app2-${instanceId}`
    });
});

app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy', 
        service: 'app2',
        instance: instanceId
    });
});

app.get('/api/users', (req, res) => {
    setTimeout(() => {
        res.json({
            users: [
                { id: 1, name: 'John Doe', instance: instanceId },
                { id: 2, name: 'Jane Smith', instance: instanceId },
                { id: 3, name: 'Bob Johnson', instance: instanceId }
            ],
            total: 3,
            instance: instanceId
        });
    }, 50);
});

app.get('/api/orders', (req, res) => {
    res.json({
        orders: [
            { id: 1, product: 'Laptop', status: 'shipped', instance: instanceId },
            { id: 2, product: 'Phone', status: 'processing', instance: instanceId }
        ],
        instance: instanceId
    });
});

app.get('/static/example.txt', (req, res) => {
    res.send(`Static file from App2 Instance ${instanceId}`);
});

app.listen(port, '0.0.0.0', () => {
    console.log(`App2 Instance ${instanceId} running on port ${port}`);
});