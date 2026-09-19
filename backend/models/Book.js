const mongoose = require("mongoose");


/* =========================================================
   BOOK SCHEMA
========================================================= */

const schema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        author: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        category: {
            type: String,
            default: "General",
            trim: true,
            index: true
        },

        isbn: {
            type: String,
            trim: true,
            unique: true,
            sparse: true
        },

        description: {
            type: String,
            trim: true,
            maxlength: 3000,
            default: ""
        },

        coverImage: {
            type: String,
            trim: true,
            default: ""
        },

        publisher: {
            type: String,
            trim: true,
            default: ""
        },

        publicationYear: {
            type: Number,
            min: 1000,
            max: 2100
        },

        language: {
            type: String,
            trim: true,
            default: "English"
        },

        totalCopies: {
            type: Number,
            min: 1,
            default: 1
        },

        availableCopies: {
            type: Number,
            min: 0,
            default: 1
        },

        shelfLocation: {
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
            default: "active",
            index: true
        }
    },
    {
        timestamps: true
    }
);


/* =========================================================
   BOOK MODEL
========================================================= */

module.exports = mongoose.model(
    "Book",
    schema
);