import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();
export const connectDB = async () => {

    try {
        await mongoose.connect(process.env.MONGO_URI, {
            // await mongoose.connect(process.env.DB_LOCAL, {
            // useNewUrlParser: true,
            // useCreateIndex: true,
            // useFindAndModify: false
        })
        console.log("DB connection Established to Mongodb Server");
    } catch (error) {
        console.log(`Error connecting to Mongodb ${error.message}`);
        process.exit(1);
    }
};
