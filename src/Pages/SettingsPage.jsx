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
import Sidebar from '../components/components/Sidebar'
import ProfileButton from '../components/components/profile'
import { createOrUpdateUser, getUserData } from './lib/userService'
import DarkModeToggle from '../components/ui/DarkModeToggle'
import LanguageSwitcher from "../components/components/LanguageSwitcher";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useTranslation } from 'react-i18next'
import { useSidebar } from '../contexts/SidebarContext'

const SettingsPage = () => {
  const navigate = useNavigate()
  const { t } = useTranslation();
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const { isSidebarOpen, toggleSidebar, closeSidebar } = useSidebar()
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isEditingPhone, setIsEditingPhone] = useState(false)
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false)

  const fetchUserData = async (uid) => {
    try {
      const userData = await getUserData(uid)
      if (userData && userData.phoneNumber) {
        setPhoneNumber(userData.phoneNumber.replace('+91', ''))
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    }
  }

  useEffect(() => {
    const handleOffline = () => {

      toast.error(t('settings.offline'), {
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

  }, [t]);

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

  const handlePhoneChange = (e) => {
    const value = e.target.value
    if (/^\d{0,10}$/.test(value)) {
      setPhoneNumber(value)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600 dark:text-gray-400">{t('settings.loading')}</span>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="flex h-screen">
        {isSidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-20"
            onClick={closeSidebar}
            aria-label="Close sidebar"
          />
        )}

        <Sidebar
          isOpen={isSidebarOpen}
          onClose={closeSidebar}
          user={user}
        />

        <div className="flex-1 flex flex-col">
          <header className="bg-white dark:bg-gray-800 shadow-sm flex-shrink-0">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">

                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">{t('settings.title')}</h1>
                <ProfileButton
                  user={user}
                  onMenuToggle={toggleSidebar}
                  onLogout={() => auth.signOut()}
                />

              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-4 pb-20">
            <div className="max-w-2xl mx-auto space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.phoneNumber.title')}</CardTitle>
                  <CardDescription>{t('settings.phoneNumber.description')}</CardDescription>
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
                              placeholder={t('settings.phoneNumber.placeholder')}
                              className="rounded-l-none"
                            />
                          </div>
                          <Button
                            onClick={handlePhoneUpdate}
                            disabled={isUpdatingPhone || phoneNumber.length !== 10}
                          >
                            {isUpdatingPhone ? t('settings.phoneNumber.saving') : t('settings.phoneNumber.save')}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingPhone(false)}
                            disabled={isUpdatingPhone}
                          >
                            {t('settings.phoneNumber.cancel')}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-between">
                          <span>{phoneNumber ? `+91 ${phoneNumber}` : t('settings.phoneNumber.noPhoneSet')}</span>
                          <Button
                            variant="outline"
                            onClick={() => setIsEditingPhone(true)}
                          >
                            {t('settings.phoneNumber.edit')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.language.title')}</CardTitle>
                  <CardDescription>{t('settings.language.description')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <LanguageSwitcher />
                </CardContent>
              </Card>
              {/* Notifications */}

              <Card>
                <CardHeader>
                  <CardTitle>{t('settings.notifications.title')}</CardTitle>
                  <CardDescription>{t('settings.notifications.description')}</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    
                    <Bell className="w-4 h-4" />
                    <Label htmlFor="notifications">{t('settings.notifications.enableNotifications')}</Label>
                  </div>
                  <Switch
                    id="notifications"
                    checked={notificationsEnabled}
                    onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dark Mode</CardTitle>
                  <CardDescription>Toggle between light and dark themes</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Moon className="w-4 h-4" />
                    <Label htmlFor="darkmode">Enable Dark Mode</Label>
                  </div>
                  <DarkModeToggle />
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
