const jwt = require("jsonwebtoken")
const db = require("../models")
const logger = require("../logger")

exports.login = async (req, res) => {
  const { email } = req.body
  console.log(email)

  if (!email) {
    return res.status(400).json({ message: "Email is required" })
  }

  try {
    const user = await db.User.findOne({
      where: { email: email.toLowerCase().trim() },
      include: [
        {
          model: db.Role,
          attributes: ["role_name"],
        },
      ],
    })

    if (!user) {
      return res.status(401).json({ message: "Unauthorized access. Email not found." })
    }

    const token = jwt.sign(
      {
        id: user.id,
        role_id: user.role_id,
        role: user.Role.role_name,
        email: user.email,
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" },
    )

    res.json({
      token,
      role: user.Role.role_name,
      email: user.email,
      userName: user.name,
      userId: user.id,
      role_id: user.role_id,
    })

    console.log(token);
  } catch (err) {
    logger.error(`Login error: ${err.message}`)
    res.status(500).json({ message: "Internal server error" })
  }
}
