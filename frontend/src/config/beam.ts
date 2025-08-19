export const BEAM_CONFIG = {
  WS_URL: import.meta.env.VITE_BEAM_WS_URL || 'wss://lovable-agent-32a2c27-v4.app.beam.cloud',
  TOKEN: import.meta.env.VITE_BEAM_TOKEN || 'RXIikfUgLJpEqLpA2t3CSOzoV058gII4jxJzbZqWxExLXb7PQsmqUnKWf6Vti4Qmha9LQF4yS-dGAfJQQbZY1Q==',
} as const;

// Debug environment variables
console.log('Environment variables:', {
  VITE_BEAM_WS_URL: import.meta.env.VITE_BEAM_WS_URL,
  VITE_BEAM_TOKEN: import.meta.env.VITE_BEAM_TOKEN ? 'Present' : 'Missing'
});