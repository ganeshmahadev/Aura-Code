import React, { useEffect, useState } from 'react'
import { Plus, Search, Filter, LogOut } from 'lucide-react'
import { SessionCard } from './SessionCard'
import { getUserSessions, deleteSession } from '../lib/sessions'
import type { Session } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import styled from 'styled-components'

interface SessionsGridProps {
  isHomepage?: boolean
}

export const SessionsGrid: React.FC<SessionsGridProps> = ({ isHomepage = false }) => {
  const [sessions, setSessions] = useState<Session[]>([])
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'updated' | 'created' | 'title'>('updated')
  const navigate = useNavigate()
  const { user, signOut } = useAuth()

  useEffect(() => {
    loadSessions()
  }, [])

  useEffect(() => {
    filterAndSortSessions()
  }, [sessions, searchTerm, sortBy])

  const loadSessions = async () => {
    try {
      const userSessions = await getUserSessions()
      setSessions(userSessions)
    } catch (error) {
      console.error('Error loading sessions:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortSessions = () => {
    let filtered = sessions.filter(session =>
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (session.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false)
    )

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

    setFilteredSessions(filtered)
  }

  const handleOpenSession = (session: Session) => {
    navigate('/create', { 
      state: { 
        sessionId: session.id,
        isDarkMode: true,
        initialPrompt: `Continue working on: ${session.title}`
      }
    })
  }

  const handleDeleteSession = async (sessionId: string) => {
    if (window.confirm('Are you sure you want to delete this session?')) {
      try {
        await deleteSession(sessionId)
        setSessions(sessions.filter(s => s.id !== sessionId))
      } catch (error) {
        console.error('Error deleting session:', error)
      }
    }
  }

  const handleCreateNew = () => {
    navigate('/new')
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (loading) {
    return <LoadingContainer>Loading your workspace...</LoadingContainer>
  }

  return (
    <WorkspaceContainer isHomepage={isHomepage}>
      <WorkspaceHeader>
        {!isHomepage && (
          <HeaderTop>
            <div>
              <WorkspaceTitle>My AuraCode Workspace</WorkspaceTitle>
              {user && (
                <UserInfo>
                  Welcome back, {user.user_metadata?.full_name || user.email}
                </UserInfo>
              )}
            </div>
            
            <HeaderActions>
              <CreateButton onClick={handleCreateNew}>
                <Plus size={16} />
                New Project
              </CreateButton>
              <LogoutButton onClick={handleSignOut}>
                <LogOut size={16} />
                Sign Out
              </LogoutButton>
            </HeaderActions>
          </HeaderTop>
        )}

        <HeaderControls isHomepage={isHomepage}>
          {isHomepage && (
            <WorkspaceTitle isHomepage={isHomepage}>
              Your Projects
            </WorkspaceTitle>
          )}
          
          <SearchContainer>
            <Search size={16} />
            <SearchInput
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </SearchContainer>

          <SortContainer>
            <Filter size={14} />
            <SortSelect
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="updated">Last Edited</option>
              <option value="created">Newest First</option>
              <option value="title">Name</option>
            </SortSelect>
          </SortContainer>

          <StatsContainer>
            {filteredSessions.length} project{filteredSessions.length !== 1 ? 's' : ''}
          </StatsContainer>
        </HeaderControls>
      </WorkspaceHeader>

      {filteredSessions.length === 0 ? (
        <EmptyState>
          {sessions.length === 0 ? (
            <>
              <EmptyIcon>🚀</EmptyIcon>
              <EmptyTitle>Welcome to AuraCode!</EmptyTitle>
              <EmptyText>
                Start building your first web application with AI assistance.
              </EmptyText>
              <CreateButton onClick={handleCreateNew}>
                <Plus size={16} />
                Create Your First Project
              </CreateButton>
            </>
          ) : (
            <>
              <EmptyIcon>🔍</EmptyIcon>
              <EmptyTitle>No projects found</EmptyTitle>
              <EmptyText>
                Try adjusting your search or create a new project.
              </EmptyText>
            </>
          )}
        </EmptyState>
      ) : (
        <SessionsGridContainer>
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onOpen={handleOpenSession}
              onDelete={handleDeleteSession}
            />
          ))}
        </SessionsGridContainer>
      )}
    </WorkspaceContainer>
  )
}

const WorkspaceContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isHomepage',
})<{ isHomepage?: boolean }>`
  padding: ${({ isHomepage }) => isHomepage ? '20px' : '40px'};
  min-height: ${({ isHomepage }) => isHomepage ? 'auto' : '100vh'};
  color: white;
  background: ${({ isHomepage }) => 
    isHomepage 
      ? 'rgba(0, 0, 0, 0.2)'
      : 'transparent'
  };
  border-radius: ${({ isHomepage }) => isHomepage ? '16px' : '0'};
  backdrop-filter: ${({ isHomepage }) => isHomepage ? 'blur(10px)' : 'none'};
  border: ${({ isHomepage }) => 
    isHomepage 
      ? '1px solid rgba(255, 255, 255, 0.1)' 
      : 'none'
  };
`

const WorkspaceHeader = styled.div`
  margin-bottom: 32px;
`

const HeaderTop = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
`

const UserInfo = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin-top: 4px;
`

const HeaderActions = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`

const LogoutButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 12px 20px;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.15);
    color: white;
  }
`

const WorkspaceTitle = styled.h1.withConfig({
  shouldForwardProp: (prop) => prop !== 'isHomepage',
})<{ isHomepage?: boolean }>`
  font-size: ${({ isHomepage }) => isHomepage ? '20px' : '28px'};
  font-weight: 700;
  color: white;
  margin: ${({ isHomepage }) => isHomepage ? '0 0 16px 0' : '0'};
  font-family: 'Montserrat', sans-serif;
`

const HeaderControls = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== 'isHomepage',
})<{ isHomepage?: boolean }>`
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
  margin-bottom: ${({ isHomepage }) => isHomepage ? '8px' : '0'};
`

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  padding: 8px 12px;
  color: rgba(255, 255, 255, 0.7);
  flex: 1;
  min-width: 250px;
`

const SearchInput = styled.input`
  background: none;
  border: none;
  outline: none;
  color: white;
  font-size: 14px;
  flex: 1;
  
  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`

const SortContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.7);
`

const SortSelect = styled.select`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  padding: 6px 8px;
  color: white;
  font-size: 12px;
  cursor: pointer;
  
  option {
    background: #1a1a1a;
    color: white;
  }
`

const StatsContainer = styled.div`
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  margin-left: auto;
`

const CreateButton = styled.button`
  background: #7c3aed;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: #6d28d9;
    transform: translateY(-1px);
  }
`

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
`

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
  color: rgba(255, 255, 255, 0.7);
`

const EmptyIcon = styled.div`
  font-size: 64px;
  margin-bottom: 24px;
`

const EmptyTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  color: white;
  margin: 0 0 12px 0;
`

const EmptyText = styled.p`
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  margin: 0 0 32px 0;
  max-width: 400px;
`

const SessionsGridContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 24px;
  margin-top: 24px;
`