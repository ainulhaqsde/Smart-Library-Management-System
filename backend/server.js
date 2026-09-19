require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

const connect = require("./config/db");

const {
    notFound,
    errorHandler
} = require("./middleware/error");


/* =========================================================
   ENVIRONMENT VALIDATION
========================================================= */

if (
    !process.env.JWT_SECRET ||
    process.env.JWT_SECRET.length < 32
) {
    console.error(
        "JWT_SECRET must be configured with at least 32 characters"
    );

    process.exit(1);
}


/* =========================================================
   EXPRESS APPLICATION
========================================================= */

const app = express();

app.disable("x-powered-by");


/* =========================================================
   SECURITY
========================================================= */

app.use(
    helmet({
        contentSecurityPolicy: false,

        crossOriginResourcePolicy: {
            policy: "cross-origin"
        }
    })
);


/* =========================================================
   CORS
========================================================= */

const origins = (
    process.env.CLIENT_URL ||
    process.env.APP_URL ||
    ""
)
    .split(",")
    .filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (
                !origin ||
                !origins.length ||
                origins.includes(origin)
            ) {
                return callback(null, true);
            }

            return callback(
                new Error("CORS blocked")
            );
        },

        credentials: false
    })
);


/* =========================================================
   BODY PARSERS
========================================================= */

app.use(
    express.json({
        limit: "1mb"
    })
);

app.use(
    express.urlencoded({
        extended: false,
        limit: "1mb"
    })
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
    "/api/health",
    (req, res) => {
        res.json({
            status: "ok",
            service: "smart-library",
            time: new Date().toISOString()
        });
    }
);


/* =========================================================
   API ROUTES
========================================================= */

app.use(
    "/api/auth",
    require("./routes/auth")
);

app.use(
    "/api/books",
    require("./routes/books")
);

app.use(
    "/api/borrowings",
    require("./routes/borrows")
);

app.use(
    "/api/users",
    require("./routes/users")
);

app.use(
    "/api/categories",
    require("./routes/categories")
);

app.use(
    "/api/fines",
    require("./routes/fines")
);

app.use(
    "/api/dashboard",
    require("./routes/dashboard")
);


/* =========================================================
   FRONTEND STATIC FILES
========================================================= */

const front = path.join(
    __dirname,
    "../frontend"
);

app.use(
    express.static(front, {
        maxAge:
            process.env.NODE_ENV ===
            "production"
                ? "1h"
                : 0
    })
);


/* =========================================================
   FRONTEND FALLBACK
========================================================= */

app.get(
    "/{*splat}",
    (req, res, next) => {
        if (
            req.path.startsWith(
                "/api/"
            )
        ) {
            return next();
        }

        return res.sendFile(
            path.join(
                front,
                "index.html"
            )
        );
    }
);


/* =========================================================
   ERROR HANDLING
========================================================= */

app.use(notFound);

app.use(errorHandler);


/* =========================================================
   SERVER STARTUP
========================================================= */

const port =
    process.env.PORT || 5000;

connect()
    .then(() => {
        app.listen(
            port,
            () => {
                console.log(
                    `Smart Library running on port ${port}`
                );
            }
        );
    })
    .catch((error) => {
        console.error(
            "Startup failed:",
            error.message
        );

        process.exit(1);
    });