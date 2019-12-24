const express = require('express'), connectDB = require('./config/db');

const app = express();

//connect database
connectDB();

//init middleware
app.use(express.json({ extended: false }));

//Define routes
app.use('/api/users', require('./routes/api/users'));
app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/posts', require('./routes/api/posts'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log('App listening on port: ', PORT));