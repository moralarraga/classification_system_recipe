import {useState} from 'react';
import {supabase} from '../lib/supabase.js';

// Magic-link sign-in so saved recipes follow you across devices. Hidden when Supabase isn't configured.
export default function Account({user, savedCount}) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  if (!supabase) return null;
  if (user) {
    return (
      <div className="account">
        <span className="muted">{user.email} · {savedCount} saved</span>
        <button type="button" className="ghost small" onClick={() => supabase.auth.signOut()}>Sign out</button>
      </div>
    );
  }
  const send = async (e) => {
    e.preventDefault();
    const {error} = await supabase.auth.signInWithOtp({email, options: {emailRedirectTo: location.origin}});
    setMsg(error ? error.message : 'Check your email for a sign-in link.');
  };
  return (
    <div className="account">
      {!open ? (
        <button type="button" className="ghost small" onClick={() => setOpen(true)}>Sign in to sync saved recipes</button>
      ) : (
        <form onSubmit={send} className="account-form">
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" aria-label="Email" />
          <button type="submit" className="ghost small">Send link</button>
          {msg && <p className="muted">{msg}</p>}
        </form>
      )}
    </div>
  );
}
