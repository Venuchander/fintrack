// ProfileButton.jsx - Modified
import React from "react"
import { ChevronDown } from 'lucide-react'
import { Button } from "../ui/button"

const ProfileButton = ({ user, onMenuToggle, hideNameOnMobile = false }) => {
  return (
    <Button 
      variant="ghost" 
      className="inline-flex items-center"
      onClick={onMenuToggle}
    >
      {user?.providerData[0]?.providerId === "google.com" ? (
        <img
          className="h-8 w-8 rounded-full"
          src={user?.photoURL || "/placeholder.svg?height=32&width=32"}
          alt={user?.displayName || "User"}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
          <span className="text-white text-sm">
            {user?.email ? user.email.charAt(0).toUpperCase() : "U"}
          </span>
        </div>
      )}
      <span className={`ml-2 text-sm font-medium text-gray-700 dark:text-white ${hideNameOnMobile ? 'hidden sm:inline' : ''}`}>
        {user?.displayName ||
          (user?.email
            ? user.email
                .split("@")[0]
                .split(/[\d._-]+/)
                .filter(Boolean)
                .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
                .join(" ")
            : "User")}
      </span>
      <ChevronDown className="ml-2 h-4 w-4" aria-hidden="true" />
    </Button>
  )
}

export default ProfileButton
