require("dotenv").config()
const grpc = require("@grpc/grpc-js")
const protoLoader = require("@grpc/proto-loader")
const mongoose = require("mongoose")
const jwt = require("jsonwebtoken")
const path = require("path")

const PROTO_PATH = path.join(__dirname, "proto/auth.proto")
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {})
const authProto = grpc.loadPackageDefinition(packageDefinition).auth
const {
    createLogin,
    registerUser,
    verifyUser,
} = require("./controller/controller")
mongoose.connect(process.env.AUTH_MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

const User = require("./models/userSchema") // Define User model in auth-service/models/User.js

const server = new grpc.Server()

server.addService(authProto.AuthService.service, {
    Register: async (call, callback) => registerUser(call.request, callback),
    Login: (call, callback) => createLogin(call.request, callback),
    VerifyUser: (call,callback) => verifyUser(call.request, callback)
})

server.bindAsync(
    "0.0.0.0:50051",
    grpc.ServerCredentials.createInsecure(),
    () => {
        console.log("Auth gRPC server running on port 50051")
        server.start()
    }
)
