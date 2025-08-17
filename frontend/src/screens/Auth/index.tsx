import React, { useState } from 'react'
import { Login } from './Login'
import { SignUp } from './SignUp'
import styled from 'styled-components'
import LovableIcon from '@/components/lovable-icon'

export const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [isDarkMode] = useState(true)

  return (
    <AuthContainer isDark={isDarkMode}>
      <AuthCard isDark={isDarkMode}>
        <Header>
          <Logo>
            <LogoIcon>
              <LovableIcon size={32} />
            </LogoIcon>
            <LogoText>AuraCode</LogoText>
          </Logo>
        </Header>

        <AuthContent>
          {isLogin ? (
            <Login onSwitchToSignUp={() => setIsLogin(false)} />
          ) : (
            <SignUp onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </AuthContent>
      </AuthCard>
    </AuthContainer>
  )
}

const AuthContainer = styled.div<{ isDark: boolean }>`
  min-height: 100vh;
  width: 100vw;
  background: ${props => props.isDark 
    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #7209b7 100%)'
    : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #ffecd2 100%)'
  };
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
    opacity: ${props => props.isDark ? '0.3' : '0.2'};
    pointer-events: none;
  }
`

const AuthCard = styled.div<{ isDark: boolean }>`
  background: ${({ isDark }) => 
    isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.2)'
  };
  backdrop-filter: blur(20px);
  border: 1px solid ${({ isDark }) => 
    isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.3)'
  };
  border-radius: 24px;
  padding: 48px;
  width: 100%;
  max-width: 400px;
  position: relative;
  z-index: 1;
`

const Header = styled.div`
  text-align: center;
  margin-bottom: 32px;
`

const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: white;
`

const LogoIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #7c3aed;
  border-radius: 12px;
  padding: 8px;
`

const LogoText = styled.h1`
  font-size: 24px;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  margin: 0;
  color: white;
`

const AuthContent = styled.div`
  width: 100%;
`