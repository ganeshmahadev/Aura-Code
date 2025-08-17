import React, { useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import ThemeToggle from "@/components/theme-toggle";
import LovableIcon from "@/components/lovable-icon";

const NewScreen: React.FC = () => {
  const [input, setInput] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(true);
  const navigate = useNavigate();

  const handleStartBuilding = () => {
    if (input.trim()) {
      navigate("/create", { state: { initialPrompt: input, isDarkMode } });
    }
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <Outer isDark={isDarkMode}> 
      <MainContent>
        <TitleSection>
          <MainTitle>
            Build something <HeartIcon><LovableIcon size={48} /></HeartIcon>
          </MainTitle>
          <Subtitle>
            Create apps and websites by chatting with AI
          </Subtitle>
        </TitleSection>
        
        <InputContainer>
          <InputWrapper isDark={isDarkMode}>
            <StyledTextarea
              placeholder="Ask AuraCode to create an idea..."
              value={input}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setInput(e.target.value)
              }
              onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleStartBuilding();
                }
              }}
            />
            <ArrowButton onClick={handleStartBuilding} isDark={isDarkMode}>
              <ArrowIcon>↑</ArrowIcon>
            </ArrowButton>
          </InputWrapper>
        </InputContainer>
      </MainContent>
    </Outer>
  );
};

export default NewScreen;

const Outer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isDark',
})<{ isDark: boolean }>`
  min-height: 100vh;
  width: 100vw;
  background: ${props => props.isDark 
    ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #7209b7 100%)'
    : 'linear-gradient(135deg, #a8edea 0%, #fed6e3 50%, #ffecd2 100%)'
  };
  position: relative;
  overflow: hidden;
  transition: background 0.5s ease;
  
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
`;

const Header = styled.header`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 20px 40px;
  z-index: 10;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: white;
  font-weight: 600;
  font-size: 18px;
  font-family: 'Montserrat', sans-serif;
`;

const LogoIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const LogoText = styled.span`
  font-weight: 700;
  font-family: 'Montserrat', sans-serif;
  letter-spacing: -0.5px;
`;

const MainContent = styled.main`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 0 20px;
  position: relative;
  z-index: 1;
`;

const TitleSection = styled.div`
  text-align: center;
  margin-bottom: 60px;
  max-width: 800px;
`;

const MainTitle = styled.h1`
  font-size: 3.2rem;
  font-weight: 800;
  font-family: 'Montserrat', sans-serif;
  color: white;
  margin: 0 0 20px 0;
  line-height: 1.1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  letter-spacing: -1px;
  
  @media (max-width: 768px) {
    font-size: 2rem;
    flex-direction: column;
    gap: 8px;
    letter-spacing: -0.5px;
  }
`;

const HeartIcon = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin: 0 8px;
`;

const Subtitle = styled.p`
  font-size: 1.5rem;
  font-weight: 400;
  font-family: 'Montserrat', sans-serif;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  letter-spacing: -0.2px;
  
  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const InputContainer = styled.div`
  width: 100%;
  max-width: 600px;
`;

const InputWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isDark',
})<{ isDark: boolean }>`
  position: relative;
  background: ${props => props.isDark 
    ? 'rgba(0, 0, 0, 0.3)' 
    : 'rgba(255, 255, 255, 0.3)'
  };
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid ${props => props.isDark 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(255, 255, 255, 0.4)'
  };
  transition: all 0.3s ease;
  box-shadow: ${props => props.isDark 
    ? '0 8px 32px rgba(0, 0, 0, 0.3)' 
    : '0 8px 32px rgba(0, 0, 0, 0.1)'
  };
`;

const StyledTextarea = styled(Textarea)`
  background: transparent;
  border: none;
  color: white;
  font-size: 16px;
  font-family: 'Montserrat', sans-serif;
  font-weight: 400;
  line-height: 1.6;
  padding: 0 0 0 40px;
  resize: none;
  min-height: 60px;
  max-height: 144px; /* 6 lines * 24px line height */
  overflow-y: auto;
  letter-spacing: -0.1px;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 400;
  }
  
  &:focus {
    outline: none;
    box-shadow: none;
  }
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.4);
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.6);
  }
`;

const PaperclipIcon = styled.div`
  position: absolute;
  left: 20px;
  bottom: 20px;
  font-size: 20px;
  color: rgba(255, 255, 255, 0.7);
  z-index: 2;
`;

const ArrowButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'isDark',
})<{ isDark: boolean }>`
  position: absolute;
  right: 20px;
  bottom: 20px;
  background: ${props => props.isDark 
    ? 'rgba(255, 255, 255, 0.15)' 
    : 'rgba(255, 255, 255, 0.4)'
  };
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 2;
  
  &:hover {
    background: ${props => props.isDark 
      ? 'rgba(255, 255, 255, 0.25)' 
      : 'rgba(255, 255, 255, 0.5)'
    };
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const ArrowIcon = styled.span`
  color: white;
  font-size: 18px;
  font-weight: bold;
  font-family: 'Montserrat', sans-serif;
`;
