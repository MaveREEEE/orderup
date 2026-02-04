import React, { useState, useEffect } from 'react'
import './Settings.css'
import axios from 'axios'
import { toast } from 'react-toastify'
import { applyTheme } from '../../utils/themeUtils'

const Settings = ({ url }) => {
  const recommenderUrl = import.meta.env.VITE_RECOMMENDER_URL || 'http://127.0.0.1:8000'
  const [settings, setSettings] = useState({
    siteName: '',
    siteDescription: '',
    aboutUs: '',
    logo: '',
    primaryColor: '#ff7043',
    secondaryColor: '#ff4500',
    accentColor: '#e85a4f',
    textColor: '#333333',
    backgroundColor: '#fcfcfc',
    currency: '₱',
    phone: '',
    email: '',
    address: '',
    privacyPolicy: '',
    termsAndConditions: '',
    enableReservations: true,
    enableDelivery: true,
    enablePickup: true,
    enableDineIn: true,
    heroBackground: '',
    heroTitle: '',
    heroSubtitle: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      x: ''
    }
  })
  
  const [logoFile, setLogoFile] = useState(null)
  const [faviconFile, setFaviconFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [faviconPreview, setFaviconPreview] = useState(null)
  const [heroBgFile, setHeroBgFile] = useState(null)
  const [heroBgPreview, setHeroBgPreview] = useState(null)
    const handleHeroBgChange = (e) => {
      const file = e.target.files[0]
      if (file) {
        setHeroBgFile(file)
        setHeroBgPreview(URL.createObjectURL(file))
      }
    }
  const [loading, setLoading] = useState(false)
  const [reloadingRecs, setReloadingRecs] = useState(false)

  const getBrandingUrl = (img) => {
    if (!img) return null
    return img.startsWith('http') ? img : null
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const token = sessionStorage.getItem("token")
      const response = await axios.get(url + "/api/settings/", {
        headers: { token }
      })
      if (response.data.success) {
        const data = response.data.data || {}
        // Create the new settings object, excluding socialMedia for now
        const { socialMedia, ...rest } = data
        
        setSettings(prev => ({
          ...prev,
          ...rest,
          heroBackground: data.heroBackground || '',
          heroTitle: data.heroTitle || '',
          heroSubtitle: data.heroSubtitle || '',
          socialMedia: {
            facebook: socialMedia?.facebook || '',
            instagram: socialMedia?.instagram || '',
            x: socialMedia?.x || ''
          }
        }))
        if (data.logo) {
          setPreview(getBrandingUrl(data.logo))
        }
        if (data.favicon) {
          setFaviconPreview(getBrandingUrl(data.favicon))
        }
      }
    } catch (error) {
      toast.error("Error fetching settings")
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith('socialMedia.')) {
      const key = name.split('.')[1]
      setSettings(prev => ({
        ...prev,
        socialMedia: {
          ...prev.socialMedia,
          [key]: value
        }
      }))
      return
    }
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setLogoFile(file)
      setPreview(URL.createObjectURL(file))
    }
  }

  const handleFaviconChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFaviconFile(file)
      setFaviconPreview(URL.createObjectURL(file))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = sessionStorage.getItem("token")

      // Branding/logo upload (only if new logo selected)
      if (logoFile) {
        const formData = new FormData()
        formData.append("logo", logoFile)
        formData.append("siteName", settings.siteName)
        formData.append("primaryColor", settings.primaryColor)
        formData.append("secondaryColor", settings.secondaryColor)
        formData.append("accentColor", settings.accentColor)
        formData.append("textColor", settings.textColor)
        formData.append("backgroundColor", settings.backgroundColor)

        const brandingRes = await axios.put(url + "/api/settings/branding", formData, {
          headers: { 
            token,
            'Content-Type': 'multipart/form-data'
          }
        })
        if (!brandingRes.data.success) {
          toast.error(brandingRes.data.message || "Branding update failed")
          setLoading(false)
          return
        }
      }

      // Hero background upload (only if new hero background selected)
      if (heroBgFile) {
        const heroBgFormData = new FormData()
        heroBgFormData.append("heroBackground", heroBgFile)
        // Also send heroTitle and heroSubtitle if present
        if (settings.heroTitle !== undefined) heroBgFormData.append("heroTitle", settings.heroTitle)
        if (settings.heroSubtitle !== undefined) heroBgFormData.append("heroSubtitle", settings.heroSubtitle)

        const heroBgRes = await axios.put(url + "/api/settings/hero-background", heroBgFormData, {
          headers: {
            token,
            'Content-Type': 'multipart/form-data'
          }
        })
        if (!heroBgRes.data.success) {
          toast.error(heroBgRes.data.message || "Hero background update failed")
          setLoading(false)
          return
        }
      }

      // Favicon upload (only if new favicon selected)
      if (faviconFile) {
        const faviconFormData = new FormData()
        faviconFormData.append("favicon", faviconFile)

        const faviconRes = await axios.put(url + "/api/settings/favicon", faviconFormData, {
          headers: { 
            token,
            'Content-Type': 'multipart/form-data'
          }
        })
        if (!faviconRes.data.success) {
          toast.error(faviconRes.data.message || "Favicon update failed")
          setLoading(false)
          return
        }
      }

      // Settings update (always send this) — EXCLUDE logo/favicon/heroBg so file endpoints own them
      // If heroBgFile was uploaded, do not send heroTitle/heroSubtitle again in this request
      const { logo, favicon, heroBackground, ...nonFileSettings } = settings
      if (!heroBgFile) {
        // Only send heroTitle/heroSubtitle if not already sent with heroBgFile
        const response = await axios.put(url + "/api/settings/update", nonFileSettings, {
          headers: { token }
        })

        if (response.data.success) {
          toast.success("Settings updated successfully!")
          setLogoFile(null)
          setFaviconFile(null)
          setHeroBgFile(null)
          fetchSettings()
          // Apply theme immediately after saving
          applyTheme(url)
        } else {
          toast.error(response.data.message || "Failed to update settings")
        }
      } else {
        // If heroBgFile was uploaded, still clear files and fetch settings
        setLogoFile(null)
        setFaviconFile(null)
        setHeroBgFile(null)
        fetchSettings()
        applyTheme(url)
      }
    } catch (error) {
      console.error("Settings error:", error)
      toast.error(error.response?.data?.message || "Error updating settings")
    } finally {
      setLoading(false)
    }
  }

  const handleReloadRecommendations = async () => {
    if (!recommenderUrl) {
      toast.error('Recommender URL not configured')
      return
    }

    setReloadingRecs(true)
    try {
      const res = await axios.post(`${recommenderUrl}/reload-data`)
      const message = res.data?.message || 'Recommender data reloaded'
      toast.success(message)
    } catch (error) {
      const detail = error.response?.data?.detail || 'Failed to reload recommender data'
      toast.error(detail)
    } finally {
      setReloadingRecs(false)
    }
  }

  const resetColors = () => {
    setSettings(prev => ({
      ...prev,
      primaryColor: '#ff7043',
      secondaryColor: '#ff4500',
      accentColor: '#e85a4f',
      textColor: '#333333',
      backgroundColor: '#fcfcfc'
    }))
  }

  return (
    <div className="settings-container">
      <h2 className="settings-title">Restaurant Settings</h2>
      
      <form onSubmit={handleSubmit} className="settings-form">

        {/* Branding Section */}
        <div className="settings-section">
          <h3>Branding</h3>
          <div className="form-group">
            <label>Restaurant Name</label>
            <input
              type="text"
              name="siteName"
              value={settings.siteName}
              onChange={handleChange}
              placeholder="Enter restaurant name"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              name="siteDescription"
              value={settings.siteDescription}
              onChange={handleChange}
              placeholder="Enter restaurant description"
              rows="3"
            />
          </div>
          <div className="form-group">
            <label>Hero Background Image</label>
            <div className="logo-upload">
              {heroBgPreview || settings.heroBackground ? (
                <div className="logo-preview">
                  <img src={heroBgPreview || settings.heroBackground} alt="Hero Background" style={{ maxWidth: '100%', maxHeight: 120 }} />
                </div>
              ) : null}
              <input
                type="file"
                accept="image/*"
                onChange={handleHeroBgChange}
              />
              <small className="hint">Upload a hero background image (recommended: 1200x400px or similar)</small>
            </div>
          </div>
          <div className="form-group">
            <label>Hero Title</label>
            <input
              type="text"
              name="heroTitle"
              value={settings.heroTitle}
              onChange={handleChange}
              placeholder="Enter hero title"
            />
          </div>
          <div className="form-group">
            <label>Hero Subtitle</label>
            <input
              type="text"
              name="heroSubtitle"
              value={settings.heroSubtitle}
              onChange={handleChange}
              placeholder="Enter hero subtitle"
            />
          </div>

          <div className="form-group">
            <label>Logo</label>
            <div className="logo-upload">
              {preview && (
                <div className="logo-preview">
                  <img src={preview} alt="Logo" />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Favicon</label>
            <div className="logo-upload">
              {faviconPreview && (
                <div className="logo-preview favicon-preview">
                  <img src={faviconPreview} alt="Favicon" />
                </div>
              )}
              <input
                type="file"
                accept="image/x-icon,image/png,image/svg+xml"
                onChange={handleFaviconChange}
              />
              <small className="hint">Upload .ico, .png, or .svg (recommended: 32x32px)</small>
            </div>
          </div>
        </div>

        {/* Color Scheme Section */}
        <div className="settings-section">
          <h3>Color Scheme</h3>
          
          <div className="colors-grid">
            <div className="form-group">
              <label>Primary Color</label>
              <div className="color-input">
                <input
                  type="color"
                  name="primaryColor"
                  value={settings.primaryColor}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  value={settings.primaryColor}
                  onChange={handleChange}
                  name="primaryColor"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Secondary Color</label>
              <div className="color-input">
                <input
                  type="color"
                  name="secondaryColor"
                  value={settings.secondaryColor}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  value={settings.secondaryColor}
                  onChange={handleChange}
                  name="secondaryColor"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Accent Color</label>
              <div className="color-input">
                <input
                  type="color"
                  name="accentColor"
                  value={settings.accentColor}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  value={settings.accentColor}
                  onChange={handleChange}
                  name="accentColor"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Text Color</label>
              <div className="color-input">
                <input
                  type="color"
                  name="textColor"
                  value={settings.textColor}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  value={settings.textColor}
                  onChange={handleChange}
                  name="textColor"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Background Color</label>
              <div className="color-input">
                <input
                  type="color"
                  name="backgroundColor"
                  value={settings.backgroundColor}
                  onChange={handleChange}
                />
                <input
                  type="text"
                  value={settings.backgroundColor}
                  onChange={handleChange}
                  name="backgroundColor"
                />
              </div>
            </div>
          </div>

          <button type="button" className="reset-btn" onClick={resetColors}>
            Reset to Default Colors
          </button>
        </div>

        {/* Company Section */}
        <div className="settings-section">
          <h3>Company</h3>

          <div className="form-group">
            <label>About Us</label>
            <textarea
              name="aboutUs"
              value={settings.aboutUs}
              onChange={handleChange}
              placeholder="Share your restaurant story, values, and what makes you unique"
              rows="4"
            />
          </div>

          <div className="form-group">
            <label>Facebook</label>
            <input
              type="url"
              name="socialMedia.facebook"
              value={settings.socialMedia?.facebook || ''}
              onChange={handleChange}
              placeholder="https://facebook.com/yourpage"
            />
          </div>

          <div className="form-group">
            <label>Instagram</label>
            <input
              type="url"
              name="socialMedia.instagram"
              value={settings.socialMedia?.instagram || ''}
              onChange={handleChange}
              placeholder="https://instagram.com/yourpage"
            />
          </div>

          <div className="form-group">
            <label>X</label>
            <input
              type="url"
              name="socialMedia.x"
              value={settings.socialMedia?.x || ''}
              onChange={handleChange}
              placeholder="https://x.com/yourhandle"
            />
          </div>
        </div>

        {/* Contact Info Section */}
        <div className="settings-section">
          <h3>Contact Information</h3>
          
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={settings.phone}
              onChange={handleChange}
              placeholder="Enter phone number"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={settings.email}
              onChange={handleChange}
              placeholder="Enter email"
            />
          </div>

          <div className="form-group">
            <label>Address</label>
            <textarea
              name="address"
              value={settings.address}
              onChange={handleChange}
              placeholder="Enter address"
              rows="3"
            />
          </div>
        </div>

        {/* Legal Section */}
        <div className="settings-section">
          <h3>Legal</h3>
          
          <div className="form-group">
            <label>Privacy Policy</label>
            <textarea
              name="privacyPolicy"
              value={settings.privacyPolicy}
              onChange={handleChange}
              placeholder="Enter privacy policy"
              rows="5"
            />
          </div>

          <div className="form-group">
            <label>Terms and Conditions</label>
            <textarea
              name="termsAndConditions"
              value={settings.termsAndConditions}
              onChange={handleChange}
              placeholder="Enter terms and conditions"
              rows="5"
            />
          </div>
        </div>

        {/* Features Section */}
        <div className="settings-section">
          <h3>Features</h3>
          
          <div className="features-grid">
            <div className="checkbox-group">
              <input
                type="checkbox"
                id="enableReservations"
                name="enableReservations"
                checked={settings.enableReservations}
                onChange={handleChange}
              />
              <label htmlFor="enableReservations">Enable Reservations</label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="enableDelivery"
                name="enableDelivery"
                checked={settings.enableDelivery}
                onChange={handleChange}
              />
              <label htmlFor="enableDelivery">Enable Delivery</label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="enablePickup"
                name="enablePickup"
                checked={settings.enablePickup}
                onChange={handleChange}
              />
              <label htmlFor="enablePickup">Enable Pickup</label>
            </div>

            <div className="checkbox-group">
              <input
                type="checkbox"
                id="enableDineIn"
                name="enableDineIn"
                checked={settings.enableDineIn}
                onChange={handleChange}
              />
              <label htmlFor="enableDineIn">Enable Dine In</label>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>Recommendations</h3>
          <p className="hint">Reload the recommender cache after you add menu items or new orders.</p>
          <div className="action-row">
            <button
              type="button"
              className="reload-btn"
              onClick={handleReloadRecommendations}
              disabled={reloadingRecs}
            >
              {reloadingRecs ? 'Reloading...' : 'Reload Recommender Data'}
            </button>
            <span className="hint">Endpoint: {recommenderUrl}/reload-data</span>
          </div>
        </div>

        <button type="submit" className="save-btn" disabled={loading}>
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </form>
    </div>
  )
}

export default Settings