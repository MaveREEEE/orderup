import React, { useContext, useState } from 'react'
import './LoginPopUp.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'
import axios from 'axios'
import { toast } from 'react-toastify'

const LoginPopUp = ({ setShowLogin }) => {
    const { url, setToken, setUserId } = useContext(StoreContext)
    const [currState, setCurrState] = useState("Login")
    const [data, setData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        address: ""
    })
    const [loading, setLoading] = useState(false)
    const [showTerms, setShowTerms] = useState(false)
    const [settings, setSettings] = useState({
        termsAndConditions: ''
    })

    React.useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await axios.get(`${url}/api/settings/`)
                if (response.data.success) {
                    setSettings(response.data.data)
                }
            } catch (error) {
                console.error("Error fetching settings:", error)
            }
        }
        fetchSettings()
    }, [url])

    const onChangeHandler = (event) => {
        const name = event.target.name
        const value = event.target.value
        setData(data => ({ ...data, [name]: value }))
    }

    const onLogin = async (event) => {
        event.preventDefault()
        setLoading(true)

        let newUrl = url
        let payload = {}

        if (currState === "Login") {
            newUrl += "/api/auth/login"
            payload = {
                email: data.email.trim(),
                password: data.password
            }
        } else {
            newUrl += "/api/auth/register"
            payload = {
                name: data.name.trim(),
                email: data.email.trim(),
                password: data.password,
                phone: data.phone.trim(),
                address: data.address.trim()
            }
        }

        try {
            const response = await axios.post(newUrl, payload)

            if (response.data.success) {
                if (currState === "Login") {
                    const { token, userType, role, name } = response.data

                    console.log("Login successful:", { userType, role, name })

                    // Decode token to get userId
                    const tokenPayload = JSON.parse(atob(token.split('.')[1]))
                    const userId = tokenPayload.id

                    // Update context and sessionStorage (clears on browser close)
                    setToken(token)
                    setUserId(userId)
                    sessionStorage.setItem("token", token)
                    sessionStorage.setItem("userId", userId)
                    sessionStorage.setItem("userName", name)
                    sessionStorage.setItem("userType", userType)

                    if (userType === 'admin') {
                        sessionStorage.setItem("userRole", role)

                        toast.success(`Welcome ${name}! Redirecting to Admin Panel...`)

                        // Redirect to admin panel
                        setTimeout(() => {
                            window.location.href = 'http://localhost:5174'
                        }, 1500)
                    } else {
                        toast.success(`Welcome ${name}!`)
                        setShowLogin(false)
                    }
                } else {
                    // Sign Up - don't auto-login
                    toast.success("Account created successfully! Please login to continue.")
                    setCurrState("Login")
                    setData({
                        name: "",
                        email: "",
                        password: "",
                        phone: "",
                        address: ""
                    })
                }
            } else {
                toast.error(response.data.message)
            }
        } catch (error) {
            console.error("Login error:", error)
            if (error.response) {
                toast.error(error.response.data.message || "Login failed")
            } else if (error.request) {
                toast.error("Cannot connect to server")
            } else {
                toast.error("An error occurred. Please try again.")
            }
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className='login-popup'>
            <form onSubmit={onLogin} className="login-popup-container">
                <div className="login-popup-title">
                    <h2>{currState}</h2>
                    <img onClick={() => setShowLogin(false)} src={assets.cross_icon} alt="" />
                </div>
                <div className="login-popup-inputs">
                    {currState === "Sign Up" && (
                        <>
                            <label htmlFor="name">Name</label>
                            <input
                                id='name'
                                name='name'
                                onChange={onChangeHandler}
                                value={data.name}
                                type="text"
                                placeholder='Enter your name'
                                required
                            />
                            <label htmlFor="phone">Phone</label>
                            <input
                                id='phone'
                                name='phone'
                                onChange={onChangeHandler}
                                value={data.phone}
                                type="tel"
                                placeholder='Enter your phone number'
                                required
                            />
                            <label htmlFor="address">Address</label>
                            <input
                                id='address'
                                name='address'
                                onChange={onChangeHandler}
                                value={data.address}
                                type="text"
                                placeholder='Enter your delivery address'
                                required
                            />
                        </>
                    )}
                    <label htmlFor="email">Email</label>
                    <input
                        id='email'
                        name='email'
                        onChange={onChangeHandler}
                        value={data.email}
                        type="email"
                        placeholder='Enter your email'
                        required
                    />
                    <label htmlFor="password">Password</label>
                    <input
                        id='password'
                        name='password'
                        onChange={onChangeHandler}
                        value={data.password}
                        type="password"
                        placeholder='Enter your password'
                        required
                        minLength="6"
                    />
                </div>
                <div className="login-popup-condition">
                    <input type="checkbox" required />
                    <p>By continuing, I agree to the <span onClick={() => setShowTerms(true)}>terms & conditions</span>.</p>
                </div>
                <button type='submit' disabled={loading}>
                    {loading ? "Please wait..." : (currState === "Sign Up" ? "Create account" : "Login")}
                </button>
                {currState === "Login" && (
                    <div className="forgot-password-link">
                        <a href="/forgot-password" onClick={(e) => {
                            e.preventDefault();
                            setShowLogin(false);
                            window.location.href = '/forgot-password';
                        }}>
                            Forgot password?
                        </a>
                    </div>
                )}
                {currState === "Login" ? (
                    <p>Create a new account? <span onClick={() => setCurrState("Sign Up")}>Click here</span></p>
                ) : (
                    <p>Already have an account? <span onClick={() => setCurrState("Login")}>Login here</span></p>
                )}
            </form>

            {showTerms && (
                <div className="terms-modal-overlay" onClick={() => setShowTerms(false)}>
                    <div className="terms-modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="terms-modal-header">
                            <h2>Terms & Conditions</h2>
                            <img onClick={() => setShowTerms(false)} src={assets.cross_icon} alt="Close" />
                        </div>
                        <div className="terms-modal-body">
                            {settings.termsAndConditions ? (
                                <div className="terms-content">
                                    <p style={{ whiteSpace: 'pre-wrap' }}>{settings.termsAndConditions}</p>
                                </div>
                            ) : (
                                <p>No terms and conditions have been set.</p>
                            )}
                        </div>
                        <div className="terms-modal-footer">
                            <button onClick={() => setShowTerms(false)}>Close</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default LoginPopUp
