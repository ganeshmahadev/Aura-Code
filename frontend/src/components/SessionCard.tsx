/**
 * SESSION CARD COMPONENT
 * 
 * This component displays individual AI development sessions in a card format.
 * Each session represents a unique AI-powered development project with its own
 * isolated sandbox environment, chat history, and generated code.
 * 
 * KEY FEATURES:
 * - Visual thumbnail preview of the generated application
 * - Session status indicators (active/inactive)
 * - Time-based formatting for last updated timestamps
 * - Quick actions: open in new tab, delete session
 * - Responsive card layout with hover effects
 * 
 * SESSION DATA FLOW:
 * 1. Session data comes from Supabase database
 * 2. Each session has associated chat messages and generated files
 * 3. Active sessions maintain WebSocket connections to AI agents
 * 4. Sessions can be resumed, allowing users to continue AI development
 */
import React from 'react'
import { Clock, ExternalLink, Trash2 } from 'lucide-react'
import styled from 'styled-components'
import type { Session } from '../lib/supabase'

interface SessionCardProps {
  session: Session          // Session data from database
  onOpen: (session: Session) => void    // Handler to resume/open session
  onDelete: (sessionId: string) => void // Handler to delete session
}

export const SessionCard: React.FC<SessionCardProps> = ({
  session,
  onOpen,
  onDelete
}) => {
  /**
   * Format timestamps to human-readable relative time
   * Shows "Just now", "2 hours ago", "3 days ago", or full date
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 24) {
      if (diffInHours === 0) return 'Just now'
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    } else {
      const diffInDays = Math.floor(diffInHours / 24)
      if (diffInDays < 30) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
      } else {
        return date.toLocaleDateString()
      }
    }
  }

  return (
    <CardContainer>
      <CardContent onClick={() => onOpen(session)}>
        <Thumbnail>
          {session.thumbnail ? (
            <ThumbnailImage src={session.thumbnail} alt={session.title} />
          ) : (
            <PlaceholderThumbnail>
              <span>{session.title.charAt(0).toUpperCase()}</span>
            </PlaceholderThumbnail>
          )}
          {session.is_active && <ActiveBadge>Active</ActiveBadge>}
        </Thumbnail>
        
        <CardBody>
          <CardTitle>{session.title}</CardTitle>
          {session.description && (
            <CardDescription>
              {session.description}
            </CardDescription>
          )}
          
          <CardFooter>
            <TimeStamp>
              <Clock size={12} />
              {formatDate(session.updated_at)}
            </TimeStamp>
            
            <CardActions onClick={(e) => e.stopPropagation()}>
              {session.iframe_url && (
                <ActionButton
                  onClick={() => window.open(session.iframe_url, '_blank')}
                  title="Open in new tab"
                >
                  <ExternalLink size={14} />
                </ActionButton>
              )}
              
              <ActionButton
                onClick={() => onDelete(session.id)}
                title="Delete session"
                isDelete
              >
                <Trash2 size={14} />
              </ActionButton>
            </CardActions>
          </CardFooter>
        </CardBody>
      </CardContent>
    </CardContainer>
  )
}

const CardContainer = styled.div`
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s ease;
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.08);
    border-color: rgba(255, 255, 255, 0.2);
  }
`

const CardContent = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
`

const Thumbnail = styled.div`
  position: relative;
  width: 100%;
  height: 120px;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
`

const ThumbnailImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`

const PlaceholderThumbnail = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: linear-gradient(135deg, #7c3aed, #3b82f6);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 18px;
`

const ActiveBadge = styled.div`
  position: absolute;
  top: 8px;
  right: 8px;
  background: #10b981;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
`

const CardBody = styled.div`
  padding: 16px;
  flex: 1;
  display: flex;
  flex-direction: column;
`

const CardTitle = styled.h3`
  color: white;
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 4px 0;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const CardDescription = styled.p`
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`

const CardFooter = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: auto;
`

const TimeStamp = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
`

const CardActions = styled.div`
  display: flex;
  gap: 4px;
`

const ActionButton = styled.button.withConfig({
  shouldForwardProp: (prop) => prop !== 'isDelete',
})<{ isDelete?: boolean }>`
  background: rgba(255, 255, 255, 0.1);
  border: none;
  border-radius: 4px;
  padding: 6px;
  cursor: pointer;
  color: ${({ isDelete }) => 
    isDelete 
      ? '#ef4444' 
      : 'rgba(255, 255, 255, 0.7)'
  };
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ isDelete }) => 
      isDelete 
        ? 'rgba(239, 68, 68, 0.2)'
        : 'rgba(255, 255, 255, 0.15)'
    };
    color: ${({ isDelete }) => 
      isDelete 
        ? '#ef4444' 
        : 'white'
    };
  }
`