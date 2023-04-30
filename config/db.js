const mongoose = require('mongoose');
require('dotenv').config();
function connectDB() {
    // Database Connection
    mongoose.connect(process.env.MONGO_CONNECTION_URL, {
    });
    const connection = mongoose.connection;
    connection.once('open', () => {
        console.log('Connected to MongoDB successfully');
    });
    connection.on('error', (err) => {
        console.log('MongoDB connection error:', err);
    });
}
module.exports = connectDB;
