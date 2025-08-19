/**
 * NEW SCREEN - LANDING PAGE FOR AI-POWERED DEVELOPMENT
 * 
 * This is the main entry point for new users and project creation.
 * It provides an elegant interface for users to describe what they want to build,
 * then seamlessly transitions them to the active development environment.
 * 
 * USER JOURNEY:
 * 1. User lands on this page (unauthenticated or authenticated)
 * 2. User types their project idea in the chat-like input
 * 3. User presses Enter or clicks the arrow button
 * 4. Navigates to /create with the initial prompt
 * 5. AI agents begin processing the request and generating code
 * 
 * DESIGN PHILOSOPHY:
 * - Clean, minimal interface focusing on the input
 * - Chat-like interaction pattern familiar to users
 * - Beautiful gradient background with subtle texture
 * - Prominent branding with AuraCode identity
 * - Responsive design that works across all devices
 */
import React, { useState } from "react";

import { Textarea } from "@/components/ui/textarea";
import styled from "styled-components";
import { useNavigate } from "react-router-dom";
import LovableIcon from "@/components/lovable-icon";

const NewScreen: React.FC = () => {
  const [input, setInput] = useState(""); // User's project description
  const navigate = useNavigate();

  /**
   * Handle starting the AI development process
   * Navigates to the Create screen with the user's initial prompt
   */
  const handleStartBuilding = () => {
    if (input.trim()) {
      // Pass initial prompt and theme preferences to the development environment
      navigate("/create", { state: { initialPrompt: input, isDarkMode: true } });
    }
  };


  return (
    <Outer> 
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
          <InputWrapper>
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
            <ArrowButton onClick={handleStartBuilding}>
              <ArrowIcon>↑</ArrowIcon>
            </ArrowButton>
          </InputWrapper>
        </InputContainer>
      </MainContent>
    </Outer>
  );
};

export default NewScreen;

const Outer = styled.div`
  min-height: 100vh;
  width: 100vw;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #7209b7 100%);
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
    opacity: 0.3;
    pointer-events: none;
  }
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

const InputWrapper = styled.div`
  position: relative;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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


const ArrowButton = styled.button`
  position: absolute;
  right: 20px;
  bottom: 20px;
  background: rgba(255, 255, 255, 0.15);
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
    background: rgba(255, 255, 255, 0.25);
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
