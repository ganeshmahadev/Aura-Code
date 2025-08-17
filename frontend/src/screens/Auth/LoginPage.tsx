import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useNavigate, Link } from 'react-router-dom'
import { Input } from '@/components/ui/input'
import styled from 'styled-components'
import LovableIcon from '@/components/lovable-icon'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
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

  return (
    <AuthPageContainer>
      <AuthFormContainer>
        <LogoSection>
          <LogoIcon>
            <LovableIcon size={36} />
          </LogoIcon>
        </LogoSection>

        <AuthForm onSubmit={handleSubmit}>
          <Title>Log in</Title>

          <SocialButtons>
            <SocialButton>
              <GoogleIcon>G</GoogleIcon>
              Continue with Google
              <LastUsedBadge>Last used</LastUsedBadge>
            </SocialButton>
            <SocialButton>
              <GithubIcon>⚡</GithubIcon>
              Continue with GitHub
            </SocialButton>
          </SocialButtons>

          <Divider>
            <span>OR</span>
          </Divider>

          <FormGroup>
            <Label>Email</Label>
            <StyledInput
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </FormGroup>

          <FormGroup>
            <PasswordHeader>
              <Label>Password</Label>
              <ForgotLink href="#">Forgot password?</ForgotLink>
            </PasswordHeader>
            <StyledInput
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
          </FormGroup>

          {error && <ErrorMessage>{error}</ErrorMessage>}

          <SubmitButton type="submit" disabled={loading}>
            {loading ? 'Logging in...' : 'Log in'}
          </SubmitButton>

          <FooterText>
            Don't have an account? <Link to="/signup">Create your account</Link>
          </FooterText>

          <SSOLink href="#">Continue with SSO</SSOLink>
        </AuthForm>
      </AuthFormContainer>

      <GradientBackground />
    </AuthPageContainer>
  )
}

const AuthPageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  background: #1a1a1a;
`

const AuthFormContainer = styled.div`
  width: 50%;
  min-width: 500px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 80px;
  background: #1a1a1a;
  position: relative;
  z-index: 2;
`

const GradientBackground = styled.div`
  flex: 1;
  background: linear-gradient(135deg, 
    #4F46E5 0%, 
    #7C3AED 25%, 
    #EC4899 50%, 
    #F59E0B 75%, 
    #10B981 100%
  );
  position: relative;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(45deg,
      rgba(255, 255, 255, 0.1) 0%,
      transparent 50%,
      rgba(0, 0, 0, 0.1) 100%
    );
  }
`

const LogoSection = styled.div`
  margin-bottom: 40px;
`

const LogoIcon = styled.div`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
`

const AuthForm = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 400px;
`

const Title = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin: 0;
  font-family: 'Montserrat', sans-serif;
`

const SocialButtons = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`

const SocialButton = styled.button`
  position: relative;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  color: white;
  padding: 16px 20px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;
  
  &:hover {
    background: #333;
    border-color: #4a4a4a;
  }
`

const GoogleIcon = styled.div`
  width: 20px;
  height: 20px;
  background: #4285f4;
  color: white;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 12px;
`

const GithubIcon = styled.div`
  width: 20px;
  height: 20px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
`

const LastUsedBadge = styled.span`
  position: absolute;
  right: 16px;
  background: #3b82f6;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
`

const Divider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  color: #666;
  margin: 8px 0;
  
  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: #333;
  }
  
  span {
    padding: 0 16px;
    font-size: 14px;
  }
`

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const PasswordHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`

const Label = styled.label`
  color: white;
  font-weight: 500;
  font-size: 14px;
`

const ForgotLink = styled.a`
  color: #888;
  font-size: 14px;
  text-decoration: underline;
  
  &:hover {
    color: #aaa;
  }
`

const StyledInput = styled(Input)`
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  color: white;
  padding: 16px;
  border-radius: 8px;
  font-size: 16px;
  
  &::placeholder {
    color: #666;
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

const ErrorMessage = styled.div`
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 8px;
  padding: 12px;
  font-size: 14px;
`

const SubmitButton = styled.button`
  background: white;
  color: black;
  border: none;
  padding: 16px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background: #f0f0f0;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`

const FooterText = styled.div`
  text-align: center;
  color: #888;
  font-size: 14px;
  
  a {
    color: white;
    text-decoration: underline;
    
    &:hover {
      color: #ccc;
    }
  }
`

const SSOLink = styled.a`
  text-align: center;
  color: white;
  text-decoration: underline;
  font-size: 14px;
  
  &:hover {
    color: #ccc;
  }
`