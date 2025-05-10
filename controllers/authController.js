const { OAuth2Client } = require('google-auth-library');
const db = require('../config/db');
const client = new OAuth2Client('727732829380-un80uanpnh4rra3sfjr59a48et2rph38.apps.googleusercontent.com');

const googleAuth = async (req, res) => {
  console.log('GoogleAuth called', req.body);
  const { token } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: '727732829380-un80uanpnh4rra3sfjr59a48et2rph38.apps.googleusercontent.com',
    });
    console.log('Google token verified');
    const payload = ticket.getPayload();
    const email = payload.email;
    db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
      if (err) {
        console.error('DB error:', err);
        return res.status(500).json({ success: false, message: 'DB error' });
      }
      if (results.length > 0) {
        console.log('User found:', results[0]);
        return res.json({ success: true, user: results[0] });
      } else {
        db.query('INSERT INTO users (email, firstName, lastName, password) VALUES (?, ?, ?, ?)', [email, payload.given_name, payload.family_name || '', ''], (err, result) => {
          if (err) {
            console.error('DB error on insert:', err);
            return res.status(500).json({ success: false, message: 'DB error' });
          }
          console.log('User inserted:', { email, firstName: payload.given_name, lastName: payload.family_name || '', password: '' });
          return res.json({ success: true, user: { email, firstName: payload.given_name, lastName: payload.family_name || '', password: '' } });
        });
      }
    });
  } catch (err) {
    console.error('Google token error:', err);
    res.status(401).json({ success: false, message: 'Invalid Google token' });
  }
};

module.exports = { googleAuth }; 