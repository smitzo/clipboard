import { useState } from 'react'
import Home from './components/Home'
import Navbar from './components/Navbar'
import Button from './components/Button'
import Sidebar from './components/Sidebar'

function App() {

  return (
  <>
    <Navbar/>
    <Home/>
    <Button/>
    <Sidebar/>
  </>
  )
}

export default App
