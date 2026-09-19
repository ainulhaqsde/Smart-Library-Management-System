const mongoose = require("mongoose");


/* =========================================================
   FINE SCHEMA
========================================================= */

const schema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        borrowing: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Borrow",
            required: true,
            unique: true
        },

        amount: {
            type: Number,
            min: 0,
            required: true
        },

        daysOverdue: {
            type: Number,
            min: 0,
            required: true
        },

        status: {
            type: String,
            enum: [
                "unpaid",
                "paid"
            ],
            default: "unpaid",
            index: true
        },

        paidAt: {
            type: Date
        },

        collectedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {
        timestamps: true
    }
);


/* =========================================================
   FINE MODEL
========================================================= */

module.exports = mongoose.model(
    "Fine",
    schema
);