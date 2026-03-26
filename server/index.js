const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { Server } = require('socket.io');
require('dotenv').config();

const paymentsRouter = require('./routes/payments');
const workersRouter = require('./routes/workers');
const jobsRouter = require('./routes/jobs');
const messagesRouter = require('./routes/messages');
const reviewsRouter = require('./routes/reviews');
const conversationsRouter = require('./routes/conversations');
const transfersRouter = require('./routes/transfers');
const usersRouter = require('./routes/users');
const adminRouter = require('./routes/admin');
const chatHandler = require('./socket/chatHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

const io = new Server(server, {
  cors: corsOptions,
});
chatHandler(io);

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/debug-cors', (req, res) => res.json({ CLIENT_URL: process.env.CLIENT_URL || 'NOT SET' }));

app.use('/payments', paymentsRouter);
app.use('/workers', workersRouter);
app.use('/jobs', jobsRouter);
app.use('/messages', messagesRouter);
app.use('/reviews', reviewsRouter);
app.use('/conversations', conversationsRouter);
app.use('/transfers', transfersRouter);
app.use('/users', usersRouter);
app.use('/admin', adminRouter);

server.listen(PORT, () => {
  console.log(`Worklink server running on port ${PORT}`);
});
