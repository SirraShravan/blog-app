import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Alert, Button, Label, Spinner, TextInput } from 'flowbite-react';
import { useDispatch, useSelector } from 'react-redux';
import { signInStart, signInFailure, signInSuccess } from '../Redux/user/userSlice';
import OAuth from '../components/OAuth';

const SignIn = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const { loading, error } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Reset persistent errors when component mounts
  useEffect(() => {
    dispatch(signInFailure(null));
  }, [dispatch]);

  const handleChange = (e) => {
    if (error) {
      dispatch(signInFailure(null));
    }
    setFormData({ ...formData, [e.target.id]: e.target.value.trim() });
  };

  const handleFillCredentials = (email, password) => {
    dispatch(signInFailure(null));
    setFormData({ email, password });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return dispatch(signInFailure('Please enter both your email/username and password.'));
    }
    try {
      dispatch(signInStart());
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (!res.ok || data.success === false) {
        dispatch(signInFailure(data.message || 'Invalid email or password.'));
        return;
      }

      if (data.token) {
        localStorage.setItem('access_token', data.token);
      }
      dispatch(signInSuccess(data));
      navigate('/');
    } catch (err) {
      dispatch(signInFailure(err.message || 'Connection error. Please try again.'));
    }
  };

  return (
    <div className='min-h-screen mt-20'>
      <div className='p-3 max-w-3xl mx-auto flex flex-col md:flex-row md:items-center gap-5'>
        {/* left */}
        <div className='flex-1'>
          <Link to='/' className='font-bold dark:text-white text-4xl'>
            <span className='px-2 py-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-lg text-white'>
              Shravan's
            </span>
            Blog
          </Link>
          <p className='text-sm mt-5 text-gray-500 dark:text-gray-400'>
            Welcome back! Sign in to publish articles, leave comments, and manage your dashboard.
          </p>

          {/* Quick Demo Credentials for Convenience */}
          <div className='mt-6 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-300'>
            <p className='font-semibold text-gray-700 dark:text-gray-200 mb-2'>Quick Sign-In Demo Accounts:</p>
            <div className='flex flex-wrap gap-2'>
              <button
                type='button'
                onClick={() => handleFillCredentials('shravan@gmail.com', 'shravan123')}
                className='px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-purple-500 text-purple-600 dark:text-purple-400 font-medium transition'
              >
                👤 Shravan (Admin)
              </button>
              <button
                type='button'
                onClick={() => handleFillCredentials('admin@gmail.com', 'admin@blog')}
                className='px-3 py-1.5 rounded-lg bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:border-purple-500 text-purple-600 dark:text-purple-400 font-medium transition'
              >
                🔑 Admin
              </button>
            </div>
          </div>
        </div>

        {/* right */}
        <div className='flex-1'>
          <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
            <div>
              <Label value='Your email or username' />
              <TextInput
                type='text'
                placeholder='name@company.com or username'
                id='email'
                value={formData.email || ''}
                required
                onChange={handleChange}
              />
            </div>
            <div>
              <Label value='Your password' />
              <TextInput
                type='password'
                placeholder='*********'
                id='password'
                value={formData.password || ''}
                required
                onChange={handleChange}
              />
            </div>
            <Button gradientDuoTone='purpleToPink' type='submit' disabled={loading}>
              {loading ? (
                <>
                  <Spinner size='sm' />
                  <span className='pl-3'>Signing In...</span>
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            <OAuth />
          </form>

          <div className='flex gap-2 text-sm mt-5'>
            <span>Don't have an account?</span>
            <Link to='/sign-up' className='text-purple-500 hover:underline font-medium'>
              Sign Up
            </Link>
          </div>

          {error && (
            <Alert className='mt-5' color='failure'>
              {error}
            </Alert>
          )}
        </div>
      </div>
    </div>
  );
};

export default SignIn;