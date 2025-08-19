import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import styled from 'styled-components'

interface LoginProps {
  onSwitchToSignUp: () => void
}

export const Login: React.FC<LoginProps> = ({ onSwitchToSignUp }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Only validate for email/password login, not OAuth
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    const { error } = await signIn(email, password)
    
    if (error) {
      setError(error.message || 'An error occurred during login')
      setLoading(false)
    } else {
      navigate('/')
    }
  }

  const handleGoogleSignIn = async (e: React.MouseEvent) => {
    console.log('Google sign-in button clicked')
    e.preventDefault() // Prevent any form submission
    e.stopPropagation() // Prevent event bubbling
    
    // Clear any existing form validation errors
    setError('')
    setLoading(true)

    try {
      console.log('Calling signInWithGoogle...')
      const { error } = await signInWithGoogle()
      
      if (error) {
        console.error('OAuth error:', error)
        setError(error.message || 'An error occurred during Google sign-in')
        setLoading(false)
      } else {
        console.log('OAuth initiated successfully')
        // Don't set loading to false here - user will be redirected
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <LoginContainer>
      <Title>Welcome Back</Title>
      <Subtitle>Sign in to your AuraCode account</Subtitle>

      {/* Google Sign In Button - Outside Form */}
      <GoogleButton type="button" onClick={handleGoogleSignIn} disabled={loading}>
        <GoogleIcon>
          <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
            <path fill="#4285F4" d="M18 9.2c0-.7-.1-1.4-.2-2H9.2v3.8h4.9c-.2 1.1-.9 2-1.8 2.6v2.2h2.9C16.7 14.2 18 11.9 18 9.2z"/>
            <path fill="#34A853" d="M9.2 18c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.6-1.9.9-3.1.9-2.4 0-4.4-1.6-5.1-3.8H1.1v2.3C2.6 15.9 5.7 18 9.2 18z"/>
            <path fill="#FBBC04" d="M4.1 10.7c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8V4.8H1.1C.4 6.1 0 7.5 0 9.1s.4 3 1.1 4.3l3-2.3z"/>
            <path fill="#EA4335" d="M9.2 3.6c1.3 0 2.5.4 3.4 1.3l2.5-2.5C13.6 1 11.5.2 9.2.2 5.7.2 2.6 2.3 1.1 5.2l3 2.3c.7-2.2 2.7-3.9 5.1-3.9z"/>
          </svg>
        </GoogleIcon>
        Continue with Google
      </GoogleButton>

      <Divider>
        <DividerLine />
        <DividerText>or</DividerText>
        <DividerLine />
      </Divider>

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Email</Label>
          <StyledInput
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            disabled={loading}
          />
        </FormGroup>

        <FormGroup>
          <Label>Password</Label>
          <StyledInput
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            disabled={loading}
          />
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <StyledButton type="submit" disabled={loading}>
          {loading ? 'Signing In...' : 'Sign In'}
        </StyledButton>
      </Form>

      <Footer>
        Don't have an account?{' '}
        <LinkButton onClick={onSwitchToSignUp}>
          Sign up
        </LinkButton>
      </Footer>
    </LoginContainer>
  )
}

const LoginContainer = styled.div`
  width: 100%;
`

const Title = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: white;
  margin: 0 0 8px 0;
  text-align: center;
  font-family: 'Montserrat', sans-serif;
`

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 32px 0;
  text-align: center;
  font-size: 16px;
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const Label = styled.label`
  color: white;
  font-weight: 500;
  font-size: 14px;
`

const StyledInput = styled(Input)`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 16px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
  
  &:focus {
    outline: none;
    border-color: #7c3aed;
    box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.3);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const StyledButton = styled(Button)`
  background: #7c3aed;
  color: white;
  padding: 14px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-top: 12px;
  
  &:hover:not(:disabled) {
    background: #6d28d9;
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const ErrorMessage = styled.div`
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
  text-align: center;
`

const Footer = styled.div`
  text-align: center;
  margin-top: 24px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
`

const LinkButton = styled.button`
  background: none;
  border: none;
  color: #7c3aed;
  cursor: pointer;
  font-weight: 600;
  text-decoration: underline;
  font-size: 14px;
  
  &:hover {
    color: #6d28d9;
  }
`

const GoogleButton = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  background: white;
  color: #374151;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 24px;
  
  &:hover:not(:disabled) {
    background: #f9fafb;
    border-color: rgba(255, 255, 255, 0.3);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`

const GoogleIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
`

const Divider = styled.div`
  display: flex;
  align-items: center;
  margin: 24px 0;
`

const DividerLine = styled.div`
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.2);
`

const DividerText = styled.span`
  padding: 0 16px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 14px;
  font-weight: 500;
`