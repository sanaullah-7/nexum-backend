const mongoose = require("mongoose")

const URI ="mongodb://127.0.0.1:27017/mern_admin";

// mongoose.connect(URI)
const connectDb = async ()=>{
    try{
      await mongoose.connect(URI)
      console.log("connection sucessfully")
    }
    catch (error){
        console.log("connection failed with db");
        process.exit(0)
    }
};

module.exports = connectDb 