const FOOD_IMAGE_OPTIONS = {
  folder: "GIOFCHAR_BACKEND_NODEJS_SQL",
  use_filename: true,
  unique_filename: false,
  overwrite: true,
  timeout: 60000,
  transformation: [
    {
      width: 1200,
      height: 1200,
      crop: "limit",
    },
    {
      quality: "auto",
      fetch_format: "auto",
    },
  ],
};

module.exports = {
  FOOD_IMAGE_OPTIONS,
};
