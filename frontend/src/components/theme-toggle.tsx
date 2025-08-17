import React from 'react';
import styled from 'styled-components';

interface ThemeToggleProps {
  isDark: boolean;
  onToggle: () => void;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, onToggle }) => {
  return (
    <ToggleButton onClick={onToggle} isDark={isDark}>
      <IconWrapper isDark={isDark}>
        {isDark ? '🌙' : '☀️'}
      </IconWrapper>
    </ToggleButton>
  );
};

export default ThemeToggle;

const ToggleButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'isDark',
})<{ isDark: boolean }>`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.05);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const IconWrapper = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isDark',
})<{ isDark: boolean }>`
  font-size: 18px;
  transition: transform 0.3s ease;
  transform: rotate(${props => props.isDark ? '180deg' : '0deg'});
`;
