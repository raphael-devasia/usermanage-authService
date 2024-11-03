const User = require("../models/userSchema")

const bcrypt = require("bcrypt")
const fs = require("fs")

var jwt = require("jsonwebtoken")
const { JWT_SECRET } = process.env

const maxAge = 3 * 24 * 60 * 60
const createToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: maxAge })
}

const createLogin = async (data, callback) => {
    const { email, password, role } = data

    try {
        let checkUser

        // Check if email exists in the database based on role
        if (role === "user") {
            checkUser = await User.findOne({ email })
        } else {
            // Add logic for other roles if necessary
            return callback(null, {
                success: false,
                message: "Role not recognized.",
            })
        }

        // User not found
        if (!checkUser) {
            console.log("no user")

            return callback(null, {
                success: false,
                message: "User is not registered",
            })
        } else if (!checkUser.isActive) {
            return callback(null, {
                success: false,
                message: "User blocked by admin",
            })
        } else {
            console.log("password checking")

            const auth = await bcrypt.compare(password, checkUser.password)

            if (auth) {
                const token = createToken(checkUser._id)

                return callback(null, {
                    success: true,
                    message: "Login successful.",
                    token,
                })
            } else {
                return callback(null, {
                    success: false,
                    message: "Incorrect password",
                })
            }
        }
    } catch (error) {
        console.error("Error while logging in user:", error)
        return callback(null, {
            success: false,
            message: "Internal Server Error. Please try again later.",
        })
    }
}

const registerUser = async (data, callback) => {
    try {
        const { firstName, lastName, email, password, role } = data

        // 1. Check if the email is already registered
        const existingUser = await User.findOne({ email })
        if (existingUser) {
            return callback(null, {
                success: false,
                message: "Email is already registered",
            })
        }

        let user = await User.create({ email, password, role })

        let userId = user._id.toString()
        user = { userId, ...data }
        console.log(user)

        return callback(null, {
            success: true,
            message: "User registered successfully",
            registerData: user,
        })
    } catch (error) {
        console.error("Error in registerUser:", error)
        return callback({
            success: false,
            message: "Registration failed. Please try again.",
        })
    }
}

// Function to get user details
const verifyUser = async (data, callback) => {
    const { token } = data

    const isVerified = jwt.verify(token, JWT_SECRET)
    const userId = isVerified.id

    if (!userId) {
        return callback(null, {
            success: false,
            message: "Invalid Token",
        })
    }

    return callback(null, {
        success: true,
        message: "User Verified",
        userId: userId,
    })
}

module.exports = {
    createLogin,
    registerUser,

    verifyUser,
}
