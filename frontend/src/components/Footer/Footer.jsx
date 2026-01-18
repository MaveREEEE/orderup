import React, { useState, useEffect, useContext } from 'react'
import './Footer.css'
import { assets } from '../../assets/assets'
import { StoreContext } from '../../context/StoreContext'

const Footer = () => {
  const { url } = useContext(StoreContext)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [showAboutModal, setShowAboutModal] = useState(false)
  const [settings, setSettings] = useState({
    siteName: 'OrderUP',
    logo: '',
    phone: '(123) 456-7890',
    email: 'support@orderup.com',
    address: '',
    siteDescription: '',
    aboutUs: '',
    privacyPolicy: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      x: ''
    }
  })

  const getBrandingUrl = (img) => {
    if (!img) return ''
    return img.startsWith('http') ? img : ''
  }

  useEffect(() => {
    // Fetch settings from backend
    const fetchSettings = async () => {
      try {
        const res = await fetch(`${url}/api/settings/`)
        const data = await res.json()
        if (data.success && data.data) {
          setSettings(data.data)
        }
      } catch (e) {
        console.error("Error fetching settings:", e)
      }
    }
    fetchSettings()
  }, [url])

  return (
    <div className='footer' id='footer'>
      <div className="footer-content">
        <div className="footer-content-left">
          <img 
            style={{ width: '100px', height: 'auto' }} 
            src={settings.logo ? getBrandingUrl(settings.logo) : assets.logo} 
            alt={settings.siteName || "OrderUP"} 
          />
          <p>{settings.siteDescription}</p>
          
        </div>
        <div className="footer-content-center">
          <h2>COMPANY</h2>
          <ul>
            <li onClick={() => setShowAboutModal(true)} style={{ cursor: 'pointer' }}>About Us</li>
            <li onClick={() => setShowPrivacyModal(true)} style={{ cursor: 'pointer' }}>Privacy Policy</li>
            <div className="footer-social-icon">
              {settings.socialMedia?.facebook && (
                <a href={settings.socialMedia.facebook} target="_blank" rel="noopener noreferrer">
                  <img src={assets.facebook_icon} alt="Facebook" />
                </a>
              )}
              {settings.socialMedia?.instagram && (
                <a href={settings.socialMedia.instagram} target="_blank" rel="noopener noreferrer">
                  <img src={assets.instagram_icon} alt="Instagram" />
                </a>
              )}
              {settings.socialMedia?.x && (
                <a href={settings.socialMedia.x} target="_blank" rel="noopener noreferrer">
                  <img src={assets.x_icon} alt="X" />
                </a>
              )}
          </div>
          </ul>
        </div>
        <div className="footer-content-right">
          <h2>CONTACT US</h2>
          <ul>
            <li>Phone: {settings.phone || '(123) 456-7890'}</li>
            <li>Email: {settings.email || 'support@orderup.com'}</li>
            {settings.address && <li>Address: {settings.address}</li>}
            
          </ul>
        </div>
      </div>
      <hr />
      <p className="footer-copyright">
        Copyright {new Date().getFullYear()} @ {settings.siteName || 'OrderUP'}. All rights reserved.
      </p>

      {showAboutModal && (
        <div className="privacy-modal-overlay" onClick={() => setShowAboutModal(false)}>
          <div className="privacy-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="privacy-modal-header">
              <h2>About Us</h2>
              <button className="modal-close" onClick={() => setShowAboutModal(false)}>×</button>
            </div>
            <div className="privacy-modal-body">
              {settings.aboutUs ? (
                <div className="privacy-content">
                  <p style={{ whiteSpace: 'pre-wrap' }}>{settings.aboutUs}</p>
                </div>
              ) : (
                <p>No about us information has been set.</p>
              )}
            </div>
            <div className="privacy-modal-footer">
              <button onClick={() => setShowAboutModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showPrivacyModal && (
        <div className="privacy-modal-overlay" onClick={() => setShowPrivacyModal(false)}>
          <div className="privacy-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="privacy-modal-header">
              <h2>Privacy Policy</h2>
              <button className="modal-close" onClick={() => setShowPrivacyModal(false)}>×</button>
            </div>
            <div className="privacy-modal-body">
              {settings.privacyPolicy ? (
                <div className="privacy-content">
                  <p style={{ whiteSpace: 'pre-wrap' }}>{settings.privacyPolicy}</p>
                </div>
              ) : (
                <p>No privacy policy has been set.</p>
              )}
            </div>
            <div className="privacy-modal-footer">
              <button onClick={() => setShowPrivacyModal(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Footer