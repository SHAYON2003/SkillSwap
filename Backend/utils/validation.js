const sanitizeInput = (input) => {
    if (typeof input !== 'string') return String(input).trim();
    return input.trim().replace(/[<>]/g, '');
  };
  
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) && email.length <= 254;
  };
  
  const validateUsername = (username) => {
    const errors = [];
    if (!username || username.length < 3) {
      errors.push('Username must be at least 3 characters long');
    }
    if (username.length > 30) {
      errors.push('Username must be less than 30 characters');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push('Username can only contain letters, numbers, hyphens, and underscores');
    }
    return errors;
  };
  
  const validatePassword = (password) => {
    const errors = [];
    if (!password || password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    return errors;
  };
  
  const validateRegistrationInput = (username, email, password) => {
    const errors = {};
    
    const usernameErrors = validateUsername(username);
    if (usernameErrors.length > 0) {
      errors.username = usernameErrors[0];
    }
    
    if (!email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      errors.password = passwordErrors[0];
    }
    
    return errors;
  };
  
  module.exports = {
    sanitizeInput,
    validateEmail,
    validateUsername,
    validatePassword,
    validateRegistrationInput
  };