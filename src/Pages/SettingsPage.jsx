'use client'

import React, { useState, useEffect } from 'react'
import { Moon, Sun, Bell, Phone } from 'lucide-react'
import { useNavigate } from "react-router-dom"
import { auth } from "./lib/firebase"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '../components/ui/card'
import { Switch } from '../components/ui/switch'
import { Label } from '../components/ui/label'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import NavBar from '../components/components/NavBar'
import ProfileButton from '../components/components/profile'
import { createOrUpdateUser, getUserData } from './lib/userService'

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const SettingsPage = () => {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isNavBarOpen, setIsNavBarOpen] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false)

  // Handle dark mode toggle
  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode)
    document.documentElement.classList.toggle('dark')
  }

  // Fetch user data including phone number
  const fetchUserData = async (uid) => {
    try {
      const userData = await getUserData(uid)
      if (userData && userData.phoneNumber) {
        // Remove +91 prefix if it exists for display
        setPhoneNumber(userData.phoneNumber.replace('+91', ''))
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  useEffect(() => {
      const handleOffline = () => {
        toast.error("You're offline. Please check your Internet Connection.", {
          toastId: "offline-toast",
          autoClose: false,
          closeOnClick: false,
          draggable: false,
        });
      };
  
      const handleOnline = () => {
        toast.dismiss("offline-toast");
      };
  
      window.addEventListener("offline", handleOffline);
      window.addEventListener("online", handleOnline);
  
      return () => {
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("online", handleOnline);
      };
    }, []);

  // Check authentication state and load user data
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user)
        await fetchUserData(user.uid)
      } else {
        navigate("/login")
      }
      setIsLoading(false)
    })
    return () => unsubscribe()
  }, [navigate])

  // Handle phone number update
  const handlePhoneUpdate = async () => {
    if (!phoneNumber.trim()) return

    try {
      setIsUpdatingPhone(true)
      await createOrUpdateUser(user.uid, {
        phoneNumber: `+91${phoneNumber.trim()}`
      })
      setIsEditingPhone(false)
    } catch (error) {
      console.error('Error updating phone number:', error)
    } finally {
      setIsUpdatingPhone(false)
    }
  }

  // Handle phone number input change
  const handlePhoneChange = (e) => {
    const value = e.target.value
    // Only allow digits and limit to 10 characters
    if (/^\d{0,10}$/.test(value)) {
      setPhoneNumber(value)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className={`flex h-screen bg-gray-100 overflow-hidden ${isDarkMode ? 'dark' : ''}`}>
        {/* NavBar Overlay */}
        {isNavBarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={() => setIsNavBarOpen(false)}
            aria-label="Close NavBar"
          />
        )}

        {/* NavBar */}
        <NavBar
          isOpen={isNavBarOpen}
          onClose={() => setIsNavBarOpen(false)}
          user={user}
        />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <h1 className="text-2xl font-semibold text-gray-900">Settings</h1>
                <ProfileButton
                  user={user}
                  onMenuToggle={() => setIsNavBarOpen(!isNavBarOpen)}
                  onLogout={() => auth.signOut()}
                />
              </div>
            </div>
          </header>

          {/* Settings Section */}
          <main className="flex-1 overflow-y-auto p-4">
            <div className="max-w-2xl mx-auto space-y-8">
              {/* Phone Number Settings */}
              <Card>
                <CardHeader>
                  <CardTitle>Phone Number</CardTitle>
                  <CardDescription>Update your contact information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Phone className="w-4 h-4" />
                      {isEditingPhone ? (
                        <div className="flex-1 flex space-x-2">
                          <div className="flex-1 flex">
                            <div className="bg-gray-100 flex items-center px-3 rounded-l-md border border-r-0 border-gray-200 text-gray-500">
                              +91
                            </div>
                            <Input
                              type="tel"
                              value={phoneNumber}
                              onChange={handlePhoneChange}
                              placeholder="Enter 10-digit number"
                              className="rounded-l-none"
                            />
                          </div>
                          <Button 
                            onClick={handlePhoneUpdate}
                            disabled={isUpdatingPhone || phoneNumber.length !== 10}
                          >
                            {isUpdatingPhone ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingPhone(false)}
                            disabled={isUpdatingPhone}
                          >
                            Cancel
                          </Button>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-between">
                          <span>{phoneNumber ? `+91 ${phoneNumber}` : 'No phone number set'}</span>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingPhone(true)}
                          >
                            Edit
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card>
                <CardHeader>
                  <CardTitle>Notifications</CardTitle>
                  <CardDescription>Manage your notification preferences</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4" />
                    <Label htmlFor="notifications">Enable notifications</Label>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  />
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>

      <ToastContainer position="top-center" />
    </div>
  )
}

export default SettingsPage