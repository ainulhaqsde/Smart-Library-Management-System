const app = require("./backend/server");

const port =
    process.env.PORT || 5000;

app.listen(
    port,
    () => {
        console.log(
            `Smart Library running on port ${port}`
        );
    }
);