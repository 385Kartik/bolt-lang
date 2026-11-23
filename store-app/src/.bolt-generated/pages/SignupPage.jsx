import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { boltFetch } from '../api.js';
import { useToast } from '../components/ToastContext.jsx';
import * as actions from '../actions.js';
import Navbar from '../components/Navbar.jsx';
export default function SignupPage() {
  const navigate = useNavigate();
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const { addToast } = useToast();
   const [email, setEmail] = useState("");
   const [password, setPassword] = useState("");

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {(() => {
          try {
            return <><Navbar /></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 5; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <><div className="py-12 md:py-16 w-full max-w-md mx-auto mt-20 p-8 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100">
          {(() => {
            try {
              return <><h1 className="text-3xl font-black text-gray-900 mb-2 text-center">Create Account</h1></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 8; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><h2 className="text-gray-500 mb-8 text-center">Join the future of shopping today.</h2></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 9; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <>{(() => {
            const validateForm = () => {
              let isValid = true;
              let _emailErr = '';
              if (!email || email.trim() === '') _emailErr = _emailErr || 'Email is required';
              if (email && !/^\S+@\S+\.\S+$/.test(email)) _emailErr = _emailErr || 'Invalid email format';
              setEmailError(_emailErr);
              if (_emailErr) isValid = false;
              let _passwordErr = '';
              if (!password || password.trim() === '') _passwordErr = _passwordErr || 'Password is required';
              if (password && password.length < 8) _passwordErr = _passwordErr || 'Minimum length is ' + 8;
              setPasswordError(_passwordErr);
              if (_passwordErr) isValid = false;
              return isValid;
            };
            return <form onSubmit={async (e) => { e.preventDefault(); if (validateForm()) { return boltFetch("http://localhost:3001/api/signup", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email, password: password }) })
            .then(res => res.json()).then(async res => {
          if (res.error) {
            addToast(res.error, "danger");
          } else {
            await actions.loginUser(res);
            addToast("Signed up successfully!", "success");
            navigate('/products');
          }
            })
            .catch(async err => {
          addToast("Network error", "danger");
            }); } }}>
            <div className="flex flex-col gap-1">
              <input placeholder={"Email Address"} value={email} onChange={(e) => setEmail(e.target.value)} />
              {emailError && <span className="text-red-500 text-sm">{emailError}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <input placeholder={"Password"} value={password} onChange={(e) => setPassword(e.target.value)} />
              {passwordError && <span className="text-red-500 text-sm">{passwordError}</span>}
            </div>
            <button type="submit" className="primary styled as: w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold mt-4 shadow-lg shadow-blue-200 transition-all">Sign Up</button>
            </form>;
          })()}</>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 11; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="flex flex-row flex-wrap justify-center mt-6 gap-2 text-sm">
            {(() => {
              try {
                return <><p className="text-gray-500">Already have an account?</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 33; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">Log in</Link></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 34; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 32; }
              throw e;
            }
          })()}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 7; }
            throw e;
          }
        })()}

      </div>
    </main>
  );
}
window.__BOLT_MAPS = window.__BOLT_MAPS || {};
window.__BOLT_MAPS['SignupPage.jsx'] = {"11":2,"12":3,"17":5,"25":7,"28":8,"36":9,"44":11,"90":32,"93":33,"101":34};
//# sourceMappingURL=SignupPage.jsx.map