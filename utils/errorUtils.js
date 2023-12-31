const handleError = (error, res) => {
    console.error(`Error occurred: ${error}`);
    if (res) {
        res.status(500).send({ error: error });
    }
};

module.exports = { handleError };
