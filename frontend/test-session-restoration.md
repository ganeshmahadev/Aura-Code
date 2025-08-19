# Session Restoration Test Guide

## Test Steps

### 1. Create a New Session
1. Open the app in your browser
2. Click "Create New Project" or navigate to `/create` without a sessionId
3. Send a message like "Create a simple todo app"
4. Wait for the AI to generate code and files
5. Verify that files appear in the code viewer
6. Note the session title and any generated files

### 2. Test Session Restoration
1. Navigate back to the workspace (your projects page)
2. Click on the session card you just created
3. Check the browser console for debug logs
4. Verify that:
   - Session is loaded from database
   - Sandbox_id is present
   - WebSocket connects with correct initData
   - INIT message is received
   - Code files are fetched and displayed

### 3. Expected Console Logs

#### Session Loading:
```
🔄 SESSION RESTORATION DEBUG START
Current user: [user-id]
Location state sessionId: [session-id]
🔄 Loading existing session with ID: [session-id]
📊 Session data from database: { id: ..., sandbox_id: ..., ... }
✅ Session has sandbox_id: [sandbox-id]
```

#### WebSocket Connection:
```
🔌 CONNECTION DEBUG START
🔌 Connecting with session data: { sessionId: ..., sandboxId: ..., initData: { sandbox_id: ..., sessionId: ... } }
✅ Will restore existing sandbox: [sandbox-id]
```

#### INIT Message:
```
🎯 INIT MESSAGE DEBUG START
🎯 Sandbox operation type: { isRestoringExistingSandbox: true, ... }
✅ Setting iframe URL for restored sandbox: [url]
🎯 Sandbox restored, fetching code files for: [sandbox-id]
```

#### Code Files:
```
📁 FETCH_CODE_FILES DEBUG START
📁 Sending GET_CODE_FOR_DISPLAY message with sandbox_id: [sandbox-id]
📁 CODE_DISPLAY_RESPONSE DEBUG START
📁 Received code files from server: [file-list]
```

## Common Issues to Check

### 1. Missing sandbox_id
- Check if sessions in database have `sandbox_id` field populated
- Look for: `❌ Session does not have sandbox_id - this is a problem!`

### 2. New Sandbox Creation Instead of Restoration
- Look for: `❌ No sandbox_id found - will create new sandbox`
- Check if `initData` is being sent correctly

### 3. Code Files Not Loading
- Check if `GET_CODE_FOR_DISPLAY` message is sent
- Look for `CODE_DISPLAY_RESPONSE` message
- Verify files are received and set in state

### 4. Duplicate Sandbox Creation
- Look for: `❌ Ignoring iframe URL - this appears to be a duplicate sandbox creation`
- Check if multiple INIT messages are being processed

## Database Verification

Check your Supabase database:

```sql
-- Check sessions with sandbox_id
SELECT id, title, sandbox_id, created_at, updated_at 
FROM sessions 
WHERE sandbox_id IS NOT NULL 
ORDER BY updated_at DESC;

-- Check chat messages for a session
SELECT * FROM chat_messages 
WHERE session_id = '[your-session-id]' 
ORDER BY timestamp;
```

## Expected Behavior

1. **First Visit**: Creates new session and sandbox
2. **Subsequent Visits**: Restores existing session and sandbox
3. **Files**: Should show all previously generated files
4. **Chat**: Should show all previous conversation history
5. **Preview**: Should show the working application
