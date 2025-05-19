const jwt = require("jsonwebtoken")
const db = require("../models")

exports.extractEmailFromToken = async (token) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    console.log(decoded)

    // If role is not in the token, fetch it from the database
    if (!decoded.role && decoded.role_id) {
      const role = await db.Role.findByPk(decoded.role_id)
      if (role) {
        decoded.role = role.role_name
      }
    }

    return { email: decoded.email, role: decoded.role, role_id: decoded.role_id }
  } catch (err) {
    throw new Error("Invalid token")
  }
}
