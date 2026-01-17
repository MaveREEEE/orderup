import React, { useState, useEffect } from 'react'
import './Users.css'
import axios from 'axios'
import { toast } from 'react-toastify'

const Users = ({ url }) => {
  const [users, setUsers] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [currentRole, setCurrentRole] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    permissions: {
      canManageUsers: false,
      canManageOrders: false,
      canManageInventory: false,
      canManageMenu: false,
      canViewReports: false,
      canManageSettings: false
    },
    isActive: true
  })

  useEffect(() => {
    const role = localStorage.getItem("userRole") || localStorage.getItem("role")
    if (role) setCurrentRole(role)
    fetchUsers()
    // eslint-disable-next-line
  }, [])

  const fetchUsers = async () => {
  try {
    const token = localStorage.getItem("token")
    const [adminsRes, usersRes] = await Promise.all([
      axios.get(url + "/api/admin/list", { headers: { token } }),
      axios.get(url + "/api/user/list", { headers: { token } })
    ])
    let combined = []
    if (adminsRes.data.success) combined = adminsRes.data.data
    if (usersRes.data.success) combined = combined.concat(usersRes.data.data)
    setUsers(combined)
  } catch (error) {
    toast.error("Error fetching users")
  }
}

  const handleSubmit = async (e) => {
  e.preventDefault()
  try {
    const token = localStorage.getItem("token")
    const isAdminRole = ["superadmin", "admin", "staff"].includes(formData.role)
    const endpoint = isAdminRole
      ? url + "/api/admin/create"
      : url + "/api/user/create"

    if (editUser) {
      const payload = { ...formData }
      if (!payload.password) {
        delete payload.password
      }
      const response = await axios.put(
        isAdminRole
          ? url + `/api/admin/update/${editUser._id}`
          : url + `/api/user/update/${editUser._id}`,
        payload,
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success("User updated successfully!")
        fetchUsers()
        closeModal()
      } else {
        toast.error(response.data.message)
      }
    } else {
      if (!formData.password) {
        toast.error("Password is required for new users")
        return
      }
      const response = await axios.post(
        endpoint,
        formData,
        { headers: { token } }
      )
      if (response.data.success) {
        toast.success("User created successfully!")
        fetchUsers()
        closeModal()
      } else {
        toast.error(response.data.message)
      }
    }
  } catch (error) {
    toast.error("Error saving user")
  }
}

  const handleDelete = async (user) => {
    if (!window.confirm("Are you sure you want to delete this user?")) {
      return
    }
    try {
      const token = localStorage.getItem("token")
      const isAdminRole = ["superadmin", "admin", "staff"].includes(user.role)
      const endpoint = isAdminRole
        ? url + `/api/admin/delete/${user._id}`
        : url + `/api/user/delete/${user._id}`
      const response = await axios.delete(endpoint, { headers: { token } })
      if (response.data.success) {
        toast.success("User deleted successfully!")
        fetchUsers()
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      toast.error("Error deleting user")
    }
  }

  const openModal = (user = null) => {
    if (user) {
      setEditUser(user)
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        permissions: user.permissions || {
          canManageUsers: false,
          canManageOrders: false,
          canManageInventory: false,
          canManageMenu: false,
          canViewReports: false,
          canManageSettings: false
        },
        isActive: user.isActive
      })
    } else {
      setEditUser(null)
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'staff',
        permissions: {
          canManageUsers: false,
          canManageOrders: false,
          canManageInventory: false,
          canManageMenu: false,
          canViewReports: false,
          canManageSettings: false
        },
        isActive: true
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditUser(null)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    if (name.startsWith('permissions.')) {
      const permissionName = name.split('.')[1]
      setFormData(prev => ({
        ...prev,
        permissions: {
          ...prev.permissions,
          [permissionName]: checked
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const getRoleBadgeClass = (role) => {
    switch(role) {
      case 'superadmin': return 'role-superadmin'
      case 'admin': return 'role-admin'
      case 'staff': return 'role-staff'
      default: return ''
    }
  }

  return (
    <div className="users-container">
      <div className="users-header">
        <h2>User Management</h2>
        <button className="add-user-btn" onClick={() => openModal()}>
          + Add User
        </button>
      </div>

      <div className="users-table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user._id}>
                <td className="user-name">{user.name}</td>
                <td className="user-email">{user.email}</td>
                <td>
                  <span className={`role-badge ${getRoleBadgeClass(user.role)}`}>
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="user-date">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="user-actions">
                  <button 
                    className="edit-btn"
                    onClick={() => openModal(user)}
                  >
                    Edit
                  </button>
                  {currentRole === 'superadmin' && user.role === 'customer' && (
                    <button 
                      className="delete-btn"
                      onClick={() => handleDelete(user)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editUser ? 'Edit User' : 'Add New User'}</h2>
              <button className="modal-close" onClick={closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter full name"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter email"
                />
              </div>

              {(!editUser || currentRole === 'superadmin') && (
                <div className="form-group">
                  <label>Password {editUser ? "(leave blank to keep current)" : "*"}</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={!editUser}
                    placeholder="Enter password"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Role *</label>
                <select
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  required
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">SuperAdmin</option>
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                  />
                  Active
                </label>
              </div>

              <div className="permissions-section">
                <h4>Permissions</h4>
                <div className="permissions-grid">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="permissions.canManageUsers"
                      checked={formData.permissions.canManageUsers}
                      onChange={handleChange}
                    />
                    Manage Users
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="permissions.canManageOrders"
                      checked={formData.permissions.canManageOrders}
                      onChange={handleChange}
                    />
                    Manage Orders
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="permissions.canManageInventory"
                      checked={formData.permissions.canManageInventory}
                      onChange={handleChange}
                    />
                    Manage Inventory
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="permissions.canManageMenu"
                      checked={formData.permissions.canManageMenu}
                      onChange={handleChange}
                    />
                    Manage Menu
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="permissions.canViewReports"
                      checked={formData.permissions.canViewReports}
                      onChange={handleChange}
                    />
                    View Reports
                  </label>

                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="permissions.canManageSettings"
                      checked={formData.permissions.canManageSettings}
                      onChange={handleChange}
                    />
                    Manage Settings
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="cancel-btn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Users