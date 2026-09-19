const mongoose = require("mongoose");


/* =========================================================
   BORROW SCHEMA
========================================================= */

const schema = new mongoose.Schema(
    {
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        book: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Book",
            required: true,
            index: true
        },

        issuedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        issueDate: {
            type: Date,
            required: true,
            default: Date.now
        },

        dueDate: {
            type: Date,
            required: true,
            index: true
        },

        returnDate: {
            type: Date
        },

        status: {
            type: String,
            enum: [
                "borrowed",
                "returned"
            ],
            default: "borrowed",
            index: true
        },

        fineAmount: {
            type: Number,
            min: 0,
            default: 0
        }
    },
    {
        timestamps: true
    }
);


/* =========================================================
   COMPOUND INDEX
========================================================= */

schema.index({
    student: 1,
    book: 1,
    status: 1
});


/* =========================================================
   BORROW MODEL
========================================================= */

module.exports = mongoose.model(
    "Borrow",
    schema
);