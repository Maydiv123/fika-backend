// In-memory OTP store with expiration
const otpStorage = new Map();

// Generate a random OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP with expiration (10 minutes)
const storeOTP = (email, otp) => {
  // Remove any existing OTP for this email
  if (otpStorage.has(email)) {
    clearTimeout(otpStorage.get(email).timeoutId);
  }
  
  // Set expiration timer (10 minutes = 600000 ms)
  const timeoutId = setTimeout(() => {
    otpStorage.delete(email);
  }, 600000);
  
  // Store the OTP and its timeout ID
  otpStorage.set(email, {
    otp,
    timeoutId,
    createdAt: new Date()
  });
  
  return otp;
};

// Verify OTP
const verifyOTP = (email, userOTP) => {
  if (!otpStorage.has(email)) {
    return { valid: false, message: 'OTP expired or not found' };
  }
  
  const storedData = otpStorage.get(email);
  
  if (storedData.otp === userOTP) {
    // OTP is correct, delete it to prevent reuse
    clearTimeout(storedData.timeoutId);
    otpStorage.delete(email);
    return { valid: true, message: 'OTP verified successfully' };
  }
  
  return { valid: false, message: 'Invalid OTP' };
};

module.exports = {
  generateOTP,
  storeOTP,
  verifyOTP
}; 