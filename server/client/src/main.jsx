import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')).render(
      <BrowserRouter> 
        <App/>
      </BrowserRouter>
)
//BrowserRouter is used to wrap so that we can use REACT ROUTER COMPONENTS
//daisyUI is a website from where we can use inbuilt Tailwind CSS component

//if we wrap the <BrowserRouter>  <App/>  </BrowserRouter> in StrictMode then any useeefect in development will run twice
        
      
