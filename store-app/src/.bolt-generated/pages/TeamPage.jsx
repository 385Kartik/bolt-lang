import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { boltFetch } from '../api.js';
import * as actions from '../actions.js';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';
import TeamCard from '../components/TeamCard.jsx';
export default function TeamPage() {
   const [members, setMembers] = useState(null);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(null);
  useEffect(() => {
    boltFetch("https://jsonplaceholder.typicode.com/users")
      .then(res => res.json())
      .then(data => { setMembers(data); setMembersLoading(false); })
      .catch(err => { setMembersError(err.message); setMembersLoading(false); });
  }, []);

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {<>        /*__L:4*/{(() => {
          try {
            return <><Navbar /></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 4; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
          {(() => {
            try {
              return <><div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 px-6 md:px-12 text-center rounded-3xl shadow-xl my-8 bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white p-12 rounded-3xl text-center mb-12">
            {(() => {
              try {
                return <><h1 className="text-4xl md:text-5xl font-black mb-4">Our Team</h1></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 8; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><h2 className="text-purple-200 text-lg max-w-2xl mx-auto">Meet the people behind the brand — fetched live from JSONPlaceholder API</h2></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 9; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-purple-300/60 text-sm mt-4 font-mono">This page demonstrates deeply nested API data: member.company.name, member.address.geo.lat, and more!</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 10; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 7; }
              throw e;
            }
          })()}
          {((members === null)) && (
            <>
          {(() => {
            try {
              return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center py-20">
            {(() => {
              try {
                return <><p className="text-gray-400 text-lg animate-pulse">Loading team members...</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 14; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 13; }
              throw e;
            }
          })()}

            </>
          )}
          {((members !== null)) && (
            <>
          {(() => {
            try {
              return <><div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {(() => {
              try {
                return <>{members.map((member, i) => <TeamCard key={i} member={member} />)}</>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 18; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 17; }
              throw e;
            }
          })()}

            </>
          )}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 6; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <><Footer /></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 20; }
            throw e;
          }
        })()}</>}

      </div>
    </main>
  );
}
window.__BOLT_MAPS = window.__BOLT_MAPS || {};
window.__BOLT_MAPS['TeamPage.jsx'] = {"8":2,"21":2,"29":6,"32":7,"35":8,"43":9,"51":10,"66":12,"68":13,"71":14,"89":16,"91":17,"94":18,"119":20};
//# sourceMappingURL=TeamPage.jsx.map