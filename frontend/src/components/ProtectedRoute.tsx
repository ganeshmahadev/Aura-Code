/**
 * PROTECTED ROUTE COMPONENT
 * 
 * This component acts as a security wrapper for routes that require authentication.
 * It integrates with our AuthContext to check if a user is logged in and provides
 * appropriate handling for different authentication states.
 * 
 */
import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import styled from 'styled-components'

interface ProtectedRouteProps {
  children: React.ReactNode // The component/page to protect
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth() // Get authentication state from context

  // Show loading spinner while authentication status is being determined
  // This prevents flickering between login and protected content
  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner />
        <LoadingText>Loading...</LoadingText>
      </LoadingContainer>
    )
  }

  // If no authenticated user, redirect to login page
  // The 'replace' prop prevents adding to browser history
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // User is authenticated, render the protected content
  return <>{children}</>
}

const LoadingContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #7209b7 100%);
  color: white;
  gap: 24px;
`

const LoadingSpinner = styled.div`
  width: 40px;
  height: 40px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-top: 3px solid #7c3aed;
  border-radius: 50%;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`

const LoadingText = styled.div`
  font-size: 18px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.8);
`