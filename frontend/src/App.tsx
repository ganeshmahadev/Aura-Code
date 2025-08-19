import "./App.css";

// React Router for navigation between different screens
import { Route, Routes } from "react-router-dom";
// Authentication context for managing user login state across the app
import { AuthProvider, useAuth } from "./contexts/AuthContext";
// Component to protect routes that require authentication
import { ProtectedRoute } from "./components/ProtectedRoute";
// Authentication screens for user login/signup
import { LoginPage } from "./screens/Auth/LoginPage";
import { SignupPage } from "./screens/Auth/SignupPage";
// Main development environment where users interact with AI to build apps
import CreateRoute from "./screens/Create";
// Landing page for non-authenticated users
import NewScreen from "./screens/New";
// Component to display user's project workspace with saved sessions
import { SessionsGrid } from "./components/SessionsGrid";
// Header component with logo, navigation, and user menu
import { Header } from "./components/header";
import styled from "styled-components";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Textarea } from "@/components/ui/textarea";

/**
 * HomePage Component - Main landing page that adapts based on authentication state
 * - For authenticated users: Shows workspace with chat interface and project grid
 * - For non-authenticated users: Shows the landing page
 */
const HomePage: React.FC = () => {
  const { user, loading } = useAuth(); // Get current user and loading state
  const [input, setInput] = useState(""); // State for the main chat input
  const navigate = useNavigate(); // Navigation hook for routing
  
  // Show loading state while authentication is being determined
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }

  const handleStartBuilding = () => {
    if (input.trim()) {
      navigate("/create", { state: { initialPrompt: input, isDarkMode: true } });
    }
  };
  
  if (user) {
    return (
      <HomePageContainer>
        <Header />
        <HomeContent>
          <TitleSection>
            <MainTitle>
              Build something
            </MainTitle>
            <Subtitle>
              Create apps and websites by chatting with AI
            </Subtitle>
          </TitleSection>
          
          <ChatInputSection>
            <ChatInputWrapper>
              <StyledTextarea
                placeholder="Ask AuraCode to create something amazing..."
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
              <ChatArrowButton onClick={handleStartBuilding}>
                <ArrowIcon>↑</ArrowIcon>
              </ChatArrowButton>
            </ChatInputWrapper>
          </ChatInputSection>
          
          <WorkspaceSection>
            <SessionsGrid isHomepage={true} />
          </WorkspaceSection>
        </HomeContent>
      </HomePageContainer>
    );
  }
  
  return (
    <div>
      <Header />
      <NewScreen />;
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Container className="dark bg-background">
        <ContentContainer>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/new" element={<ProtectedRoute><NewScreen /></ProtectedRoute>} />
            <Route path="/create" element={<ProtectedRoute><CreateRoute /></ProtectedRoute>} />
          </Routes>
        </ContentContainer>
      </Container>
    </AuthProvider>
  );
};

export default App;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #7209b7 100%);
  position: relative;
  
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

const ContentContainer = styled.div`
  width: 100%;
  flex-grow: 1;
  overflow: auto;
  position: relative;
  z-index: 1;
`;

const HomePageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 50%, #533483 75%, #7209b7 100%);
  position: relative;
  
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

const HomeContent = styled.div`
  padding-top: 80px;
  min-height: calc(100vh - 80px);
  position: relative;
  z-index: 1;
`;

const TitleSection = styled.div`
  text-align: center;
  padding: 40px 20px;
  max-width: 800px;
  margin: 0 auto;
`;

const MainTitle = styled.h1`
  font-size: 3.2rem;
  font-weight: 800;
  font-family: 'Montserrat', sans-serif;
  color: white;
  margin: 0 0 20px 0;
  line-height: 1.1;
  letter-spacing: -1px;
  
  @media (max-width: 768px) {
    font-size: 2rem;
    letter-spacing: -0.5px;
  }
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

const ChatInputSection = styled.div`
  display: flex;
  justify-content: center;
  padding: 0 20px 60px 20px;
`;

const ChatInputWrapper = styled.div`
  position: relative;
  width: 100%;
  max-width: 600px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 16px;
  padding: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  padding: 0 60px 0 20px;
  resize: none;
  min-height: 60px;
  max-height: 144px;
  overflow-y: auto;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.8);
    font-weight: 400;
  }
  
  &:focus {
    outline: none;
    box-shadow: none;
  }
  
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
`;

const ChatArrowButton = styled.button`
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
  
  &:hover {
    background: rgba(255, 255, 255, 0.25);
    transform: translateY(-2px);
  }
`;

const ArrowIcon = styled.span`
  color: white;
  font-size: 18px;
  font-weight: bold;
  font-family: 'Montserrat', sans-serif;
`;

const WorkspaceSection = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px 40px 20px;
`;
