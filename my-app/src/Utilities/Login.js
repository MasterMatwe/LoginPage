import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FacebookLogin from 'react-facebook-login';
import GoogleLogin from 'react-google-login';
import axios from 'axios';
import './LoginForm.css';

const GoogleLoginButton = ({ onSuccess, onFailure }) => {
  return (
    <GoogleLogin
      clientId="905007189561-blmopq6tl84ej216tdot6a3efh6eqcl0.apps.googleusercontent.com"
      render={renderProps => (
        <button 
          onClick={renderProps.onClick} 
          disabled={renderProps.disabled}
          className="google-login-button"
        >
          <img 
            src="https://image.similarpng.com/very-thumbnail/2020/06/Logo-google-icon-PNG.png" 
            alt="Google" 
          />
          <span>Google</span>
        </button>
      )}
      onSuccess={onSuccess}
      onFailure={onFailure}
      cookiePolicy={'single_host_origin'}
    />
  );
};

const LoginForm = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [isFormValid, setIsFormValid] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [formHeight, setFormHeight] = useState(0);
  const navigate = useNavigate();
  const formRef = useRef(null);

  const handleUsernameChange = (e) => setUsername(e.target.value);
  const handlePasswordChange = (e) => setPassword(e.target.value);
  const handleEmailChange = (e) => setEmail(e.target.value);
  const handleConfirmPasswordChange = (e) => setConfirmPassword(e.target.value);

  useEffect(() => {
    if (isLogin) {
      setIsFormValid(username.trim() !== '' && password.trim() !== '');
    } else {
      setIsFormValid(
        username.trim() !== '' &&
        email.trim() !== '' &&
        password.trim() !== '' &&
        confirmPassword.trim() !== '' &&
        password === confirmPassword
      );
    }
  }, [username, email, password, confirmPassword, isLogin]);

  useEffect(() => {
    if (formRef.current) {
      setFormHeight(formRef.current.offsetHeight);
    }
  }, [isLogin]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      try {
        const response = await axios.post('http://localhost:3001/api/login', { username, password });
        console.log('Login successful:', response.data);
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('role', response.data.role);
        navigate(response.data.role === 1 ? '/employee-dashboard' : '/customer-dashboard');
      } catch (error) {
        console.error('Login failed:', error.response?.data?.message || 'An error occurred');
        alert('Login failed');
      }
    } else {
      try {
        const response = await axios.post('http://localhost:3001/api/register', { username, email, password, role: 'customer' });
        console.log('Registration successful:', response.data);
        setUsername('');
        setPassword('');
        setEmail('');
        setConfirmPassword('');
        navigate('/login');
      } catch (error) {
        console.error('Registration failed:', error.response?.data?.message || 'An error occurred');
        alert('Registration failed');
      }
    }
  };

  const handleFacebookCallback = async (response) => {
    if (response?.status === "unknown") {
      console.error('Sorry!', 'Something went wrong with Facebook Login.');
      return;
    }
    try {
      const result = await axios.post('http://localhost:3001/api/facebook-login', { accessToken: response.accessToken });
      console.log('Facebook login successful:', result.data);
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('role', result.data.role);
      navigate(result.data.role === 1 ? '/employee-dashboard' : '/customer-dashboard');
    } catch (error) {
      console.error('Facebook login failed:', error.response?.data?.message || 'An error occurred');
      alert('Facebook login failed');
    }
  };

  const handleGoogleSuccess = async (response) => {
    try {
      const result = await axios.post('http://localhost:3001/api/google-login', { token: response.tokenId });
      console.log('Google login successful:', result.data);
      localStorage.setItem('token', result.data.token);
      localStorage.setItem('role', result.data.role);
      navigate(result.data.role === 1 ? '/employee-dashboard' : '/customer-dashboard');
    } catch (error) {
      console.error('Google login failed:', error.response?.data?.message || 'An error occurred');
      alert('Google login failed');
    }
  };

  const handleGoogleFailure = (error) => {
    console.error('Google Sign-In Error:', error);
    alert('Google login failed');
  };

  const toggleMode = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setUsername('');
      setPassword('');
      setEmail('');
      setConfirmPassword('');
      setIsTransitioning(false);
    }, 300);
  };

  return (
    <div className="login-container" style={{ height: `${formHeight}px` }}>
      <h2 className="login-title">{isLogin ? 'Login' : 'Register'}</h2>
      <form 
        ref={formRef}
        className={`login-form ${isTransitioning ? 'fade-out' : 'fade-in'}`} 
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          className="login-input"
          placeholder="Username"
          value={username}
          onChange={handleUsernameChange}
        />
        {!isLogin && (
          <input
            type="email"
            className="login-input"
            placeholder="Email"
            value={email}
            onChange={handleEmailChange}
          />
        )}
        <input
          type="password"
          className="login-input"
          placeholder="Password"
          value={password}
          onChange={handlePasswordChange}
        />
        {!isLogin && (
          <input
            type="password"
            className="login-input"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
          />
        )}
        <button type="submit" className="login-button" disabled={!isFormValid}>
          {isLogin ? 'Login' : 'Register'}
        </button>
      </form>
      {isLogin && (
        <>
          <div className="login-divider">
            <span>or</span>
          </div>
          <div className="login-buttons">
            <FacebookLogin
              appId="590130893587827"
              autoLoad={false}
              fields="name,email,picture"
              callback={handleFacebookCallback}
              cssClass="facebook-login-button"
              icon="fa-facebook"
              textButton="Facebook"
            />
            <GoogleLoginButton
              onSuccess={handleGoogleSuccess}
              onFailure={handleGoogleFailure}
            />
          </div>
        </>
      )}
      <p className="toggle-mode" onClick={toggleMode}>
        {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
      </p>
    </div>
  );
};

export default LoginForm;