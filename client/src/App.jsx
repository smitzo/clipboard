import { useState } from 'react'
import TextEditor from './components/TextEditor'
import Navbar from './components/Navbar'
import Button from './components/Button'
import Sidebar from './components/Sidebar'

function App() {

  return (
  <>
    <Navbar/>
    <TextEditor/>
    <Button/>
    <Sidebar/>
  </>
  )
}

export default App
