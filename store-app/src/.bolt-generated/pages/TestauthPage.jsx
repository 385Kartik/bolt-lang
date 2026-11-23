import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { boltFetch } from '../api.js';
import { useAuth } from '../components/AuthContext.jsx';
import * as actions from '../actions.js';
export default function TestauthPage() {
  const { user, isLoggedIn, loginUser, logoutUser } = useAuth();
  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {(!isLoggedIn) && (
          <>
        {(() => {
          try {
            return <><p>You are not logged in!</p></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 3; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { await boltFetch((import.meta.env.VITE_API_URL + "/login"), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: "test@example.com", password: "password" }) })
          .then(res => res.json()).then(data => {
            if (data.token || data.user) loginUser(data);
          })
          .catch(err => console.error(err)); }}>Login</button></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 4; }
            throw e;
          }
        })()}

          </>
        )}
        {(isLoggedIn) && (
          <>
        {(() => {
          try {
            return <><p>{(("Welcome, " + user.name) + "!")}</p></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 8; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { logoutUser(); }}>Logout</button></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 9; }
            throw e;
          }
        })()}

          </>
        )}

      </div>
    </main>
  );
}
window.__BOLT_MAPS = window.__BOLT_MAPS || {};
window.__BOLT_MAPS['TestauthPage.jsx'] = {"10":2,"12":3,"20":4,"35":7,"37":8,"45":9};
//# sourceMappingURL=TestauthPage.jsx.map