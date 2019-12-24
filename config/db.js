const mongoose = require('mongoose');
const config = require('config');
const db = config.get('mongoURICloud');

const connectDB = async () => {
    try {
        await mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true, useCreateIndex: true, useFindAndModify: false });
        console.log('mongodb connected.');
    } catch (e) { console.log('mongodb error: ', e); }
}
module.exports = connectDB;