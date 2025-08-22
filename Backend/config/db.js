const mongoose = require('mongoose')

const connectDB = async () =>{
     try{
         const conn = await mongoose.connect(process.env.DATABASE_URL)
         console.log(`🟢 MongoDB Connected: ${conn.connection.host}`); 
     }catch(err){
         console.error(`❌ MongoDB Error: ${err.message}`);
         process.exit(1)
     }
}

module.exports = connectDB