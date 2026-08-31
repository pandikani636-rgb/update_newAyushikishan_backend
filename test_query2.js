const mongoose = require('mongoose');
const Product = require('./models/productModel');

mongoose.connect('mongodb://localhost:27017/flipkart', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(async () => {
    console.log("Connected to MongoDB");
    
    const query = { price: { $gte: 0, $lte: 200000 } };
    
    const products = await Product.find(query);
    console.log("Products found without ratings filter:", products.length);
    
    process.exit(0);
}).catch(err => {
    console.error(err);
    process.exit(1);
});
