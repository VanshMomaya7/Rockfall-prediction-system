// next.config.js
module.exports = {
  async redirects() {
    return [
      {
        source: "/:path*",
        destination: "https://rockfall-prediction-system.vercel.app/",
        permanent: true,
      },
    ];
  },
};
