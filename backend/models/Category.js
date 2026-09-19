const mongoose = require("mongoose");


/* =========================================================
   CATEGORY SCHEMA
========================================================= */

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            unique: true
        },

        description: {
            type: String,
            trim: true,
            default: ""
        },

        status: {
            type: String,
            enum: [
                "active",
                "inactive"
            ],
            default: "active"
        }
    },
    {
        timestamps: true
    }
);


/* =========================================================
   CATEGORY MODEL
========================================================= */

module.exports = mongoose.model(
    "Category",
    schema
);