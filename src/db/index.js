import mongoose from "mongoose";
import { DB_NAME } from "../constants.js"

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
        console.log(`\n  MongoDb connected !! DB HOST: ${connectionInstance.connections[0].host}`)
        // console.log(`connection instance details:`, connectionInstance)
    } catch (error) {
        console.log("MONGODB connecion FAILD", error);
        process.exit(1);
    }
    
}
export default connectDB