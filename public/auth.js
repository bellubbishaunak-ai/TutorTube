(function () {
  'use strict';

  const client = window.tutorSupabase;
  const form = document.querySelector('#emailAuthForm');
  const emailInput = document.querySelector('#email');
  const passwordInput = document.querySelector('#password');
  const nameInput = document.querySelector('#displayName');
  const submitButton = document.querySelector('#emailSubmit');
  const googleButton = document.querySelector('#googleSignIn');
  const modeButtons = document.querySelectorAll('[data-auth-mode]');
  const formTitle = document.querySelector('#formTitle');
  const formHint = document.querySelector('#formHint');
  const nameField = document.querySelector('#nameField');
  const forgotPassword = document.querySelector('#forgotPassword');
  const status = document.querySelector('#authStatus');
  const verification = document.querySelector('#verificationNotice');
  let mode = 'signin';

  if (!client) {
    setStatus('Supabase is not configured. Refresh the page and try again.', true);
    return;
  }

  client.auth.getSession().then(({ data }) => {
    if (data.session) window.location.replace('/');
  });

  function setStatus(message, isError) {
    status.textContent = message || '';
    status.className = `auth-status ${isError ? 'error' : 'success'}`;
  }

  function setMode(nextMode) {
    mode = nextMode;
    const isSignup = mode === 'signup';
    modeButtons.forEach(button => button.classList.toggle('active', button.dataset.authMode === mode));
    formTitle.textContent = isSignup ? 'Create your account' : 'Welcome back';
    formHint.textContent = isSignup ? 'Save your learning path across devices.' : 'Sign in to continue learning.';
    nameField.hidden = !isSignup;
    forgotPassword.hidden = isSignup;
    submitButton.textContent = isSignup ? 'Create account' : 'Sign in with email';
    verification.hidden = true;
    setStatus('', false);
  }

  modeButtons.forEach(button => button.addEventListener('click', () => setMode(button.dataset.authMode)));

  googleButton.addEventListener('click', async () => {
    googleButton.disabled = true;
    setStatus('Connecting to Google…', false);
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/` }
    });
    if (error) {
      googleButton.disabled = false;
      setStatus(error.message, true);
    }
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    submitButton.disabled = true;
    setStatus(mode === 'signup' ? 'Creating your account…' : 'Signing you in…', false);

    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let result;

    if (mode === 'signup') {
      result = await client.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: nameInput.value.trim() },
          emailRedirectTo: `${window.location.origin}/login.html`
        }
      });
    } else {
      result = await client.auth.signInWithPassword({ email, password });
    }

    submitButton.disabled = false;
    if (result.error) {
      setStatus(result.error.message, true);
      return;
    }

    if (mode === 'signup' && !result.data.session) {
      verification.hidden = false;
      setStatus('Account created. Check your inbox to verify your email.', false);
      form.reset();
      return;
    }

    window.location.replace('/');
  });

  forgotPassword.addEventListener('click', async event => {
    event.preventDefault();
    const email = emailInput.value.trim();
    if (!email) {
      setStatus('Enter your email first, then choose reset password.', true);
      emailInput.focus();
      return;
    }
    const { error } = await client.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/login.html`
    });
    setStatus(error ? error.message : 'Password reset email sent.', Boolean(error));
  });
})();
