const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./config/db');
const emailRoutes = require('./routes/emailRoutes');
const http = require('http');
const socketIo = require('socket.io');

// Import routes
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const contactRoutes = require('./routes/contactRoutes');
const newsletterRoutes = require('./routes/newsletterRoutes');
const blogNewsletterRoutes = require('./routes/blogNewsletterRoutes');
const productRoutes = require('./routes/productRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const adminRoutes = require('./routes/adminRoutes');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Socket.IO connection handling
const activeViewers = new Map(); // Store active viewers for each product

io.on('connection', (socket) => {
  console.log('New client connected');

  // Handle viewer count
  socket.on('joinProduct', (productId) => {
    socket.join(`product_${productId}`);
    const currentCount = activeViewers.get(productId) || 0;
    activeViewers.set(productId, currentCount + 1);
    io.to(`product_${productId}`).emit('viewerCount', activeViewers.get(productId));
  });

  socket.on('leaveProduct', (productId) => {
    socket.leave(`product_${productId}`);
    const currentCount = activeViewers.get(productId) || 0;
    if (currentCount > 0) {
      activeViewers.set(productId, currentCount - 1);
      io.to(`product_${productId}`).emit('viewerCount', activeViewers.get(productId));
    }
  });

  // Handle purchase count
  socket.on('productPurchased', (productId) => {
    // Update purchase count in database
    db.query(
      'UPDATE products SET purchaseCount = purchaseCount + 1 WHERE id = ?',
      [productId],
      (err) => {
        if (err) {
          console.error('Error updating purchase count:', err);
          return;
        }
        // Get updated purchase count
        db.query(
          'SELECT purchaseCount FROM products WHERE id = ?',
          [productId],
          (err, results) => {
            if (err) {
              console.error('Error getting purchase count:', err);
              return;
            }
            io.to(`product_${productId}`).emit('purchaseCount', results[0].purchaseCount);
          }
        );
      }
    );
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Test database connection
db.query('SELECT 1', (err, results) => {
  if (err) {
    console.error('Error connecting to database:', err);
    return;
  }
  console.log('Connected to MySQL database');
});

// Routes
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/blog-newsletter', blogNewsletterRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/products', productRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/admin', adminRoutes);


// Basic route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Fika App Backend API' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    console.log(`API is available at http://localhost:${PORT}`);
}); 
