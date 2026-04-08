import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import adminModel from "../models/adminModel.js";
import userModel from "../models/userModel.js";

//Unified login
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        console.log("Login attempt for:", email);

        if (!email || !password) {
            console.log("❌ Missing email or password");
            return res.json({ 
                success: false, 
                message: "Email and password are required" 
            });
        }

        const admin = await adminModel.findOne({ email: email.toLowerCase().trim() });
        
        if (admin) {
            console.log("✅ Found admin:", admin.email);
            console.log("Role:", admin.role);
            console.log("Active:", admin.isActive);

            if (!admin.isActive) {
                console.log("❌ Admin account is inactive");
                return res.json({ 
                    success: false, 
                    message: "Account is inactive. Please contact administrator." 
                });
            }

            console.log("🔐 Verifying password...");
            const isMatch = await bcrypt.compare(password, admin.password);
            console.log("Password match:", isMatch);

            if (!isMatch) {
                console.log("❌ Invalid password");
                return res.json({ 
                    success: false, 
                    message: "Invalid email or password" 
                });
            }

            const token = jwt.sign(
                { 
                    id: admin._id, 
                    type: 'admin',
                    role: admin.role
                }, 
                process.env.JWT_SECRET,
                { expiresIn: '7d' }
            );
            
            console.log("✅ Admin login successful");
            console.log("Token includes role:", admin.role);
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            return res.json({ 
                success: true, 
                token,
                userType: 'admin',
                role: admin.role,
                name: admin.name,
                email: admin.email,
                permissions: admin.permissions,
                redirectTo: '/admin',
                message: "Admin login successful" 
            });
        }

        console.log("ℹ️  Not found in admin collection");

        const customer = await userModel.findOne({ email: email.toLowerCase().trim() });
        
        if (customer) {
            console.log("✅ Found customer:", customer.email);

            const isMatch = await bcrypt.compare(password, customer.password);

            if (!isMatch) {
                console.log("❌ Invalid password");
                return res.json({ 
                    success: false, 
                    message: "Invalid email or password" 
                });
            }

            const token = jwt.sign(
                { 
                    id: customer._id, 
                    type: 'customer',
                    role: 'customer'
                }, 
                process.env.JWT_SECRET,
                { expiresIn: '30d' }
            );
            
            console.log("✅ Customer login successful");
            console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

            return res.json({ 
                success: true, 
                token,
                userType: 'customer',
                name: customer.name,
                email: customer.email,
                redirectTo: '/',
                message: "Customer login successful" 
            });
        }

        console.log("❌ User not found in any collection");
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        
        return res.json({ 
            success: false, 
            message: "Invalid email or password" 
        });

    } catch (error) {
        console.log("❌ Unified login error:", error);
        console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
        res.json({ 
            success: false, 
            message: "Error logging in. Please try again." 
        });
    }
};

//Register customer
const register = async (req, res) => {
    try {
        const { name, email, password, phone, address, foodPreferences, allergens } = req.body;

        console.log("Registration attempt for:", email);

        if (!name || !email || !password) {
            return res.json({ 
                success: false, 
                message: "Name, email and password are required" 
            });
        }

        if (password.length < 6) {
            return res.json({ 
                success: false, 
                message: "Password must be at least 6 characters" 
            });
        }

        const adminExists = await adminModel.findOne({ email: email.toLowerCase().trim() });
        const customerExists = await userModel.findOne({ email: email.toLowerCase().trim() });

        if (adminExists || customerExists) {
            console.log("❌ User already exists");
            return res.json({ 
                success: false, 
                message: "Email already registered" 
            });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const newUser = new userModel({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: phone ? phone.trim() : "",
            address: address ? address.trim() : "",
            role: 'customer',
            cartData: {},
            foodPreferences: foodPreferences || "",
            allergens: allergens || []
        });

        await newUser.save();
        console.log("✅ Customer registered:", newUser.email);

        const token = jwt.sign(
            { 
                id: newUser._id, 
                type: 'customer',
                role: 'customer'
            }, 
            process.env.JWT_SECRET,
            { expiresIn: '30d' }
        );

        res.json({ 
            success: true, 
            token,
            userType: 'customer',
            name: newUser.name,
            email: newUser.email,
            redirectTo: '/',
            message: "Registration successful" 
        });

    } catch (error) {
        console.log("Registration error:", error);
        res.json({ 
            success: false, 
            message: "Error creating account. Please try again." 
        });
    }
};

export { login, register };
