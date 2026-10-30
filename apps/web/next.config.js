/** @type {import('next').NextConfig} */
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });

const nextConfig = {  transpilePackages: ["@xeno/shared"],
};

module.exports = nextConfig;
