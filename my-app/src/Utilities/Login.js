import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import FacebookLogin from 'react-facebook-login';
import GoogleLogin from 'react-google-login';
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
      console.log('Login submitted:', { username, password });
      // Add your login logic here
    } else {
      console.log('Register submitted:', { username, email, password, confirmPassword });
      try {
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username, email, password }),
        });

        if (response.ok) {
          console.log('Registration successful');
          setUsername('');
          setPassword('');
          setEmail('');
          setConfirmPassword('');
          navigate('/login');
        } else {
          const errorData = await response.json();
          console.error('Registration failed:', errorData.message);
        }
      } catch (error) {
        console.error('Error during registration:', error);
      }
    }
  };

  const handleFacebookCallback = (response) => {
    if (response?.status === "unknown") {
      console.error('Sorry!', 'Something went wrong with Facebook Login.');
      return;
    }
    console.log('Facebook response:', response);
  };

  const handleGoogleSuccess = (response) => {
    console.log('Google login success:', response);
    // Handle the successful login here
  };

  const handleGoogleFailure = (error) => {
    console.error('Google Sign-In Error:', error);
    // Handle the login failure here
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