const mongoose = require("mongoose");


/* =========================================================
   USER SCHEMA
========================================================= */

const schema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },

        password: {
            type: String,
            required: true,
            select: false
        },

        role: {
            type: String,
            enum: [
                "admin",
                "student"
            ],
            default: "student"
        },

        studentId: {
            type: String,
            trim: true,
            unique: true,
            sparse: true
        },

        phone: {
            type: String,
            trim: true,
            default: ""
        },

        profileImage: {
            type: String,
            default: ""
        },

        active: {
            type: Boolean,
            default: true,
            index: true
        },

        resetPasswordToken: {
            type: String,
            select: false
        },

        resetPasswordExpires: {
            type: Date,
            select: false
        },

        lastLoginAt: {
            type: Date
        }
    },
    {
        timestamps: true
    }
);


/* =========================================================
   JSON TRANSFORM
========================================================= */

schema.set("toJSON", {
    transform: (_, ret) => {
        delete ret.password;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;

        return ret;
    }
});


/* =========================================================
   USER MODEL
========================================================= */

module.exports = mongoose.model(
    "User",
    schema
);