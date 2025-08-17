import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { ChevronDown, LogOut, User } from 'lucide-react'
import styled from 'styled-components'
import LovableIcon from './lovable-icon'

export const Header: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
    navigate('/')
  }

  const handleLogin = () => {
    navigate('/login')
  }

  const handleGetStarted = () => {
    navigate('/signup')
  }

  return (
    <HeaderContainer>
      <LogoSection onClick={() => navigate('/')}>
        <LogoIcon>
          <LovableIcon size={24} />
        </LogoIcon>
        <LogoText>AuraCode</LogoText>
      </LogoSection>

      <NavigationSection>
        {user ? (
          <UserSection>
            <UserMenuButton 
              onClick={() => setShowUserMenu(!showUserMenu)}
              active={showUserMenu}
            >
              <UserAvatar>
                <User size={16} />
              </UserAvatar>
              <UserText>MyAura</UserText>
              <ChevronDown size={16} />
            </UserMenuButton>
            
            {showUserMenu && (
              <UserDropdown>
                <UserEmail>{user.email}</UserEmail>
                <DropdownDivider />
                <DropdownItem onClick={handleSignOut}>
                  <LogOut size={16} />
                  Sign out
                </DropdownItem>
              </UserDropdown>
            )}
          </UserSection>
        ) : (
          <AuthButtons>
            <LoginButton onClick={handleLogin}>
              Login
            </LoginButton>
            <GetStartedButton onClick={handleGetStarted}>
              Get Started
            </GetStartedButton>
          </AuthButtons>
        )}
      </NavigationSection>
    </HeaderContainer>
  )
}

const HeaderContainer = styled.header`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 64px;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  z-index: 1000;
`

const LogoSection = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  transition: opacity 0.2s ease;
  
  &:hover {
    opacity: 0.8;
  }
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
  font-size: 20px;
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  color: white;
  margin: 0;
`

const NavigationSection = styled.div`
  display: flex;
  align-items: center;
  gap: 16px;
`

const AuthButtons = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
`

const LoginButton = styled.button`
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }
`

const GetStartedButton = styled.button`
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  border: none;
  color: white;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(124, 58, 237, 0.4);
  }
`

const UserSection = styled.div`
  position: relative;
`

const UserMenuButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'active',
})<{ active: boolean }>`
  background: ${({ active }) => active ? 'rgba(255, 255, 255, 0.1)' : 'transparent'};
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  padding: 8px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.3);
  }
`

const UserAvatar = styled.div`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
`

const UserText = styled.span`
  font-weight: 500;
  font-size: 14px;
`

const UserDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  padding: 12px;
  min-width: 200px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
`

const UserEmail = styled.div`
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  padding: 8px 12px;
  word-break: break-all;
`

const DropdownDivider = styled.div`
  height: 1px;
  background: rgba(255, 255, 255, 0.1);
  margin: 8px 0;
`

const DropdownItem = styled.button`
  width: 100%;
  background: transparent;
  border: none;
  color: white;
  padding: 8px 12px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: background 0.2s ease;
  font-size: 14px;
  
  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`