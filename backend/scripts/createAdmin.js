require("dotenv").config();

const bcrypt = require("bcryptjs");

const connect = require("../config/db");
const User = require("../models/User");


/* =========================================================
   CREATE / UPDATE ADMIN
========================================================= */

(async () => {
    try {
        await connect();

        const email = String(
            process.env.ADMIN_EMAIL || ""
        )
            .toLowerCase()
            .trim();

        if (
            !email ||
            !process.env.ADMIN_PASSWORD
        ) {
            throw new Error(
                "ADMIN_EMAIL and ADMIN_PASSWORD are required"
            );
        }

        if (
            process.env.ADMIN_PASSWORD
                .length < 8
        ) {
            throw new Error(
                "ADMIN_PASSWORD must be at least 8 characters"
            );
        }

        const hash = await bcrypt.hash(
            process.env.ADMIN_PASSWORD,
            12
        );

        const user =
            await User.findOneAndUpdate(
                {
                    email
                },
                {
                    $set: {
                        name:
                            process.env
                                .ADMIN_NAME ||
                            "Library Admin",

                        password: hash,

                        role: "admin",

                        active: true
                    },

                    $unset: {
                        studentId: 1
                    }
                },
                {
                    upsert: true,
                    new: true,
                    setDefaultsOnInsert: true
                }
            );

        console.log(
            `Admin ready: ${user.email} | ID: ${user._id}`
        );

        process.exit(0);
    } catch (error) {
        console.error(error.message);

        process.exit(1);
    }
})();