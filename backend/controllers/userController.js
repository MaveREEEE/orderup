import userModel from "../models/userModel.js"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"
import validator from "validator"

// Create JWT token
const createToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET)
}

// login user
const loginUser = async (req,res) => {
    const {email,password} = req.body;
    try {
        const user = await userModel.findOne({email})

        if (!user) {
            return res.json({success:false,message:"User doesn't exist"})
        }

        const isMatch = await bcrypt.compare(password,user.password);

        if (!isMatch) {
            return res.json({success:false,message:"Wrong password"})
        }

        const token = createToken(user._id);
        
        res.json({
            success: true,
            token,
            role: user.role,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        })

    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error login"})
    }
}

// register user
const registerUser = async (req,res) => {
    const {name,password,email,role} = req.body
    try {
        // Check if user exist
        const exists = await userModel.findOne({email});
        if (exists){
            return res.json({success:false,message:"User already exist"})
        }

        // Validate email format
        if (!validator.isEmail(email)) {
            return res.json({success:false,message:"Please enter a valid email"})
        }

        // Validate password strength
        if (password.length<8) {
            return res.json({success:false,message:"Please enter a strong password"})
        }

        // Hash password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password,salt)

        const newUser = new userModel({
            name:name,
            email:email,
            password:hashedPassword,
            role: "customer"
        })

        const user = await newUser.save()
        const token = createToken(user._id)
        
        res.json({
            success: true,
            token,
            role: user.role,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        console.log(error);
        res.json({success:false,message:"Error register"})
    }
}

// Get user profile
const getUserProfile = async (req, res) => {
    try {
        const { token } = req.headers;
        
        if (!token) {
            return res.json({ success: false, message: "Not Authorized" });
        }
        
        const token_decode = jwt.verify(token, process.env.JWT_SECRET);
        const user = await userModel.findById(token_decode.id).select('-password');
        
        if (!user) {
            return res.json({ success: false, message: "User not found" });
        }
        
        res.json({ success: true, user });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error" });
    }
}
// List all users
const listUsers = async (req, res) => {
  try {
    const users = await userModel.find().select('-password')
    res.json({ success: true, data: users })
  } catch (error) {
    res.json({ success: false, message: "Error fetching users" })
  }
}

// Create user (admin panel)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    if (role && role !== "customer") {
      return res.json({ success: false, message: "Only customer role allowed here" })
    }
    const exists = await userModel.findOne({ email })
    if (exists) return res.json({ success: false, message: "User already exists" })
    const hash = await bcrypt.hash(password, 10)
    const user = new userModel({
      name,
      email,
      password: hash,
      role: "customer"
    })
    await user.save()
    res.json({ success: true })
  } catch (error) {
    res.json({ success: false, message: "Error creating user" })
  }
}

// Update user (admin panel)
const updateUser = async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, password, isActive } = req.body
    const user = await userModel.findById(id)
    if (!user) return res.json({ success: false, message: "User not found" })
    user.name = name || user.name
    user.email = email || user.email
    user.isActive = isActive !== undefined ? isActive : user.isActive
    if (password) {
      const hash = await bcrypt.hash(password, 10)
      user.password = hash
    }
    await user.save()
    res.json({ success: true })
  } catch (error) {
    res.json({ success: false, message: "Error updating user" })
  }
}

// Delete user (admin panel)
const deleteUser = async (req, res) => {
  const { id } = req.params
  try {
    await userModel.findByIdAndDelete(id)
    res.json({ success: true })
  } catch (error) {
    res.json({ success: false, message: "Error deleting user" })
  }
}

// Update own profile (customer)
const updateOwnProfile = async (req, res) => {
  try {
    const { id } = req.params
    const { name, email, phone, address } = req.body
    
    // Verify user is updating their own profile
    if (!req.user || req.user.id.toString() !== id.toString()) {
      return res.json({ success: false, message: "Unauthorized" })
    }
    
    const user = await userModel.findById(id)
    if (!user) {
      return res.json({ success: false, message: "User not found" })
    }
    
    // Update allowed fields
    if (name) user.name = name
    if (email) user.email = email
    if (phone !== undefined) user.phone = phone
    if (address !== undefined) user.address = address
    
    await user.save()
    res.json({ success: true, message: "Profile updated successfully" })
  } catch (error) {
    console.error("Error updating profile:", error)
    res.json({ success: false, message: "Error updating profile" })
  }
}

export {
  loginUser,
  registerUser,
  getUserProfile,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  updateOwnProfile
}