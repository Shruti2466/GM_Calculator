const db = require("../models");
const logger = require("../logger");

exports.getAllRoles = async (req, res) => {
  try {
    const roles = await db.Role.findAll({
      attributes: ["id", "role_name"], // Fetch only id and role_name
    });
    res.json(roles);
  } catch (err) {
    logger.error(`Error fetching roles: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};