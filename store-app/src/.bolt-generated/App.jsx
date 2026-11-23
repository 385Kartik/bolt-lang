import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext.jsx';
import { ToastProvider } from './components/ToastContext.jsx';
import { ModalProvider } from './components/ModalContext.jsx';
import { ThemeManager } from './store.js';
import AboutPage from './pages/AboutPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import ContactPage from './pages/ContactPage.jsx';
import HomePage from './pages/HomePage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ProductPage from './pages/ProductPage.jsx';
import ProductsPage from './pages/ProductsPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import Store_testPage from './pages/Store_testPage.jsx';
import TeamPage from './pages/TeamPage.jsx';
import TestauthPage from './pages/TestauthPage.jsx';

export default function App() {
  return (
    <ModalProvider>
      <ToastProvider>
        <AuthProvider>
          <ThemeManager />
          <BrowserRouter>
            <Routes>
        <Route path="/about" element={<AboutPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/store_test" element={<Store_testPage />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/testauth" element={<TestauthPage />} />
        <Route path="/product/:id" element={<ProductPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ToastProvider>
    </ModalProvider>
  );
}