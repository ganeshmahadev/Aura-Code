import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import styled from 'styled-components'

interface SignUpProps {
  onSwitchToLogin: () => void
}

export const SignUp: React.FC<SignUpProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { signUp } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !fullName) {
      setError('Please fill in all fields')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    const { error } = await signUp(email, password, fullName)
    
    if (error) {
      setError(error.message || 'An error occurred during signup')
      setLoading(false)
    } else {
      setSuccess('Account created successfully! Please check your email to confirm your account.')
      setLoading(false)
      setTimeout(() => {
        onSwitchToLogin()
      }, 3000)
    }
  }

  return (
    <SignUpContainer>
      <Title>Create Account</Title>
      <Subtitle>Join AuraCode and start building</Subtitle>

      <Form onSubmit={handleSubmit}>
        <FormGroup>
          <Label>Full Name</Label>
          <StyledInput
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
            disabled={loading}
          />
        </FormGroup>

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
            placeholder="Choose a password (min 6 characters)"
            disabled={loading}
          />
        </FormGroup>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {success && <SuccessMessage>{success}</SuccessMessage>}

        <StyledButton type="submit" disabled={loading}>
          {loading ? 'Creating Account...' : 'Create Account'}
        </StyledButton>
      </Form>

      <Footer>
        Already have an account?{' '}
        <LinkButton onClick={onSwitchToLogin}>
          Sign in
        </LinkButton>
      </Footer>
    </SignUpContainer>
  )
}

const SignUpContainer = styled.div`
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

const SuccessMessage = styled.div`
  color: #10b981;
  background: rgba(16, 185, 129, 0.1);
  border: 1px solid rgba(16, 185, 129, 0.3);
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