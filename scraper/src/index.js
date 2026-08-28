const { discoverBookUrls } = require("./discover");

async function main() {
    try {
        const bookUrls = await discoverBookUrls();
        console.log(bookUrls.slice(0, 5));  // first 5 URLs
    } catch (error) {
        console.error(error.message);
        process.exitCode = 1;
    }
}

main();