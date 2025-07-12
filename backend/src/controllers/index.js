/**
 * Controller Index File
 * Exports all controllers for easy importing
 */

const authController = require("./auth.controller");
const playlistController = require("./playlist.controller");
const songController = require("./song.controller");

module.exports = {
  auth: authController,
  playlist: playlistController,
  song: songController,
};

// Alternative export style for destructuring
module.exports.authController = authController;
module.exports.playlistController = playlistController;
module.exports.songController = songController;
