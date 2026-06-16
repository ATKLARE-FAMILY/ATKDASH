exports.handler = async function(event, context) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { code, grant_type, refresh_token } = JSON.parse(event.body);
    const clientId = process.env.DEXCOM_CLIENT_ID;
    const clientSecret = process.env.DEXCOM_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      return { statusCode: 500, headers, body: JSON.stringify({ error: 'Environment variables not configured' }) };
    }

    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: 'http://localhost:8080/callback',
      grant_type: grant_type || 'authorization_code'
    });

    if (grant_type === 'refresh_token') {
      params.set('refresh_token', refresh_token);
    } else {
      params.set('code', code);
    }

    const response = await fetch('https://api.dexcom.com/v2/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: response.status, headers, body: JSON.stringify({ error: data.error_description || data.error || 'Token exchange failed' }) };
    }

    return { statusCode: 200, headers, body: JSON.stringify({ access_token:
