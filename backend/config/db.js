const mongoose = require("mongoose");


/* =========================================================
   MONGODB CONNECTION
========================================================= */

module.exports = async () => {
    if (!process.env.MONGO_URI) {
        throw new Error(
            "MONGO_URI is missing"
        );
    }

    mongoose.set(
        "strictQuery",
        true
    );

    await mongoose.connect(
        process.env.MONGO_URI,
        {
            serverSelectionTimeoutMS: 10000,
            maxPoolSize: 10
        }
    );

    console.log(
        "MongoDB Atlas connected"
    );
};