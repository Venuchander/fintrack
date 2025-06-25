import React from 'react'
import NavBar from '../components/components/NavBar'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import NetworkStatusToast from '../components/components/NetworkStatusToast'


const Layout = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-100">
      <NavBar />
      <div className="flex-1 overflow-auto">
        <NetworkStatusToast />
        <ToastContainer />
        {children}
      </div>
    </div>
  )
}

export default Layout
