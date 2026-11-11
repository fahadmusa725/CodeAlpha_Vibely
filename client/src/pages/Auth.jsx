import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faCircleExclamation, faEnvelope, faEye, faEyeSlash, faLock, faUser, faWandMagicSparkles } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../context/AuthContext';
import { validateField } from '../utils/validators';
import './Auth.css';

const Auth = ({ mode = 'login' }) => {
  const isLogin = mode === 'login';
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    username: '',
    fullName: '',
    email: '',
    password: '',
    loginId: '',
  });

  const [fieldErrors, setFieldErrors] = useState({
    fullName: '',
    username: '',
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');

    if (!isLogin && fieldErrors[name]) {
      const err = validateField(name, value);
      if (!err) {
        setFieldErrors((prev) => ({ ...prev, [name]: '' }));
      }
    }
  };

  const handleBlur = (e) => {
    if (isLogin) return;
    const { name, value } = e.target;
    const err = validateField(name, value);
    setFieldErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isLogin) {
      setLoading(true);
      try {
        const res = await login(formData.loginId, formData.password);
        if (res.success) {
          navigate('/');
        } else {
          setError(res.message || 'Invalid credentials');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'An error occurred. Please try again.');
      } finally {
        setLoading(false);
      }
      return;
    }

    const nextErrors = {
      fullName: validateField('fullName', formData.fullName),
      username: validateField('username', formData.username),
      email: validateField('email', formData.email),
      password: validateField('password', formData.password),
    };

    setFieldErrors(nextErrors);

    if (Object.values(nextErrors).some(Boolean)) {
      return;
    }

    setLoading(true);

    try {
      const res = await register({
        username: formData.username,
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      });
      if (res.success) {
        navigate('/');
      } else {
        const msg = res.message || 'Registration failed';
        const lower = msg.toLowerCase();
        if (lower.includes('email')) {
          setFieldErrors((prev) => ({ ...prev, email: msg }));
        } else if (lower.includes('username')) {
          setFieldErrors((prev) => ({ ...prev, username: msg }));
        } else {
          setError(msg);
        }
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'An error occurred. Please try again.';
      const lower = msg.toLowerCase();
      if (lower.includes('email')) {
        setFieldErrors((prev) => ({ ...prev, email: msg }));
      } else if (lower.includes('username')) {
        setFieldErrors((prev) => ({ ...prev, username: msg }));
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card card">
        <div className="auth-brand-header">
          <div className="auth-logo-badge">
            <FontAwesomeIcon icon={faWandMagicSparkles} style={{ fontSize: 26 }} />
          </div>
          <h1>Vibely</h1>
          <p>
            {isLogin
              ? 'Sign in to your account.'
              : 'Create an account to get started.'}
          </p>
        </div>

        {error && (
          <div className="auth-error-banner">
            <FontAwesomeIcon icon={faCircleExclamation} style={{ fontSize: 18 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form" noValidate={!isLogin}>
          {isLogin ? (
            <>
              <div className="auth-input-group">
                <label htmlFor="loginId">Email or Username</label>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faUser} style={{ fontSize: 18 }} className="auth-input-icon" />
                  <input
                    id="loginId"
                    type="text"
                    name="loginId"
                    placeholder="e.g. sophia_arts or sophia@example.com"
                    value={formData.loginId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="auth-input-group">
                <div className="auth-label-row">
                  <label htmlFor="loginPassword">Password</label>
                  <Link to="/forgot-password" className="auth-forgot-link">
                    Forgot password?
                  </Link>
                </div>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faLock} style={{ fontSize: 18 }} className="auth-input-icon" />
                  <input
                    id="loginPassword"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FontAwesomeIcon icon={faEyeSlash} style={{ fontSize: 17 }} /> : <FontAwesomeIcon icon={faEye} style={{ fontSize: 17 }} />}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="auth-input-group">
                <label htmlFor="registerFullName">Full Name</label>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faUser} style={{ fontSize: 18 }} className="auth-input-icon" />
                  <input
                    id="registerFullName"
                    type="text"
                    name="fullName"
                    placeholder="e.g. Sophia Chen"
                    value={formData.fullName}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    aria-describedby={fieldErrors.fullName ? 'fullName-error' : undefined}
                    required
                  />
                </div>
                {fieldErrors.fullName && (
                  <span id="fullName-error" className="auth-field-error" role="alert">
                    {fieldErrors.fullName}
                  </span>
                )}
              </div>

              <div className="auth-input-group">
                <label htmlFor="registerUsername">Username</label>
                <div className="auth-input-wrapper">
                  <span className="auth-at-prefix">@</span>
                  <input
                    id="registerUsername"
                    type="text"
                    name="username"
                    placeholder="sophia_arts"
                    value={formData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldErrors.username)}
                    aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                    required
                  />
                </div>
                {fieldErrors.username && (
                  <span id="username-error" className="auth-field-error" role="alert">
                    {fieldErrors.username}
                  </span>
                )}
              </div>

              <div className="auth-input-group">
                <label htmlFor="registerEmail">Email</label>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faEnvelope} style={{ fontSize: 18 }} className="auth-input-icon" />
                  <input
                    id="registerEmail"
                    type="email"
                    name="email"
                    placeholder="sophia@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                    required
                  />
                </div>
                {fieldErrors.email && (
                  <span id="email-error" className="auth-field-error" role="alert">
                    {fieldErrors.email}
                  </span>
                )}
              </div>

              <div className="auth-input-group">
                <label htmlFor="registerPassword">Password</label>
                <div className="auth-input-wrapper">
                  <FontAwesomeIcon icon={faLock} style={{ fontSize: 18 }} className="auth-input-icon" />
                  <input
                    id="registerPassword"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="At least 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    minLength={6}
                    aria-invalid={Boolean(fieldErrors.password)}
                    aria-describedby={fieldErrors.password ? 'password-error' : undefined}
                    required
                  />
                  <button
                    type="button"
                    className="auth-eye-toggle"
                    onClick={() => setShowPassword((p) => !p)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <FontAwesomeIcon icon={faEyeSlash} style={{ fontSize: 17 }} /> : <FontAwesomeIcon icon={faEye} style={{ fontSize: 17 }} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <span id="password-error" className="auth-field-error" role="alert">
                    {fieldErrors.password}
                  </span>
                )}
              </div>
            </>
          )}

          <button
            type="submit"
            className="btn btn-primary auth-submit-btn"
            disabled={loading}
          >
            <span>{loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}</span>
            <FontAwesomeIcon icon={faArrowRight} style={{ fontSize: 18 }} />
          </button>
        </form>

        <div className="auth-footer-toggle">
          {isLogin ? (
            <p>
              Don't have an account yet?{' '}
              <Link to="/register" className="auth-link">
                Sign up
              </Link>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">
                Log in
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
