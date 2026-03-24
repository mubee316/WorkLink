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
const chatHandler = require('./socket/chatHandler');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(helmet());
app.use(cors({ origin: clientUrl }));
app.use(express.json());

const io = new Server(server, {
  cors: { origin: clientUrl },
});
chatHandler(io);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/payments', paymentsRouter);
app.use('/workers', workersRouter);
app.use('/jobs', jobsRouter);
app.use('/messages', messagesRouter);
app.use('/reviews', reviewsRouter);
app.use('/conversations', conversationsRouter);
app.use('/transfers', transfersRouter);
app.use('/users', usersRouter);

server.listen(PORT, () => {
  console.log(`Worklink server running on port ${PORT}`);
});
