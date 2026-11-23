import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { boltFetch } from '../api.js';
import * as actions from '../actions.js';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';
export default function ContactPage() {
   const [name, setName] = useState("");
   const [email, setEmail] = useState("");
   const [message, setMessage] = useState("");

  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {(() => {
          try {
            return <><Navbar /></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 2; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-12">
          {(() => {
            try {
              return <><div className="bg-gradient-to-r from-blue-600 to-indigo-700 md:px-12 shadow-xl my-8 bg-gray-900 text-white p-12 rounded-3xl text-center mb-12">
            {(() => {
              try {
                return <><h1>Contact Us</h1></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 6; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><h2>We'd love to hear from you.</h2></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 7; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 5; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="flex flex-row flex-wrap gap-12">
            {(() => {
              try {
                return <><div className="flex flex-col w-full lg:w-1/2">
              {(() => {
                try {
                  return <><div className="bg-cardBg text-text border border-border rounded-xl shadow-sm p-6">
                {(() => {
                  try {
                    return <><h1 className="text-2xl font-bold mb-6">Send a Message</h1></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 12; }
                    throw e;
                  }
                })()}
                {(() => {
                  try {
                    return <>{(() => {
                  const validateForm = () => {
                    let isValid = true;
                    return isValid;
                  };
                  return <form className="flex flex-col gap-4" onSubmit={(e) => { e.preventDefault(); validateForm(); }}>
                  <div className="flex flex-col gap-1">
                    <input placeholder={"Your Name"} value={name} onChange={(e) => setName(e.target.value)} className="p-3 border rounded-lg w-full" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <input placeholder={"Email Address"} value={email} onChange={(e) => setEmail(e.target.value)} className="p-3 border rounded-lg w-full" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <input placeholder={"Your Message"} value={message} onChange={(e) => setMessage(e.target.value)} className="p-3 border rounded-lg w-full min-h-[120px]" />
                  </div>
                  <button className="bg-primary text-white rounded-xl px-4 w-full py-3 mt-4" onClick={async () => {
                    return boltFetch("https://jsonplaceholder.typicode.com/posts", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name, email: email, message: message }) });
                    setName("");
                    setEmail("");
                    setMessage("");
                  }}>Submit</button>
                  </form>;
                })()}</>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 13; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 11; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 10; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><div className="w-full lg:w-1/2 flex flex-col gap-6">
              {(() => {
                try {
                  return <><div className="bg-cardBg text-text border border-border rounded-xl shadow-sm p-6">
                {(() => {
                  try {
                    return <><h1 className="text-xl font-bold mb-4">Watch Our Story (Public Folder)</h1></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 25; }
                    throw e;
                  }
                })()}
                {(() => {
                  try {
                    return <><video src={"/demo.mp4"} controls playsInline className="w-full rounded-xl" /></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 26; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 24; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><div className="bg-cardBg text-text border border-border rounded-xl shadow-sm p-6">
                {(() => {
                  try {
                    return <><h1 className="text-xl font-bold mb-4">Our Headquarters (Public Folder)</h1></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 29; }
                    throw e;
                  }
                })()}
                {(() => {
                  try {
                    return <><img src={"/office.jpg"} alt="Image" className="w-full rounded-xl object-cover" /></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 30; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 28; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><div className="bg-cardBg text-text border border-border rounded-xl shadow-sm p-6">
                {(() => {
                  try {
                    return <><h1 className="text-xl font-bold mb-4">Product Demo (External URL)</h1></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 33; }
                    throw e;
                  }
                })()}
                {(() => {
                  try {
                    return <><video src={"https://www.w3schools.com/html/mov_bbb.mp4"} controls playsInline className="w-full rounded-xl" /></>;
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
              {(() => {
                try {
                  return <><div className="bg-cardBg text-text border border-border rounded-xl shadow-sm p-6">
                {(() => {
                  try {
                    return <><h1 className="text-xl font-bold mb-4">Remote Office (External URL)</h1></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 37; }
                    throw e;
                  }
                })()}
                {(() => {
                  try {
                    return <><img src={"https://picsum.photos/600/300"} alt="Image" className="w-full rounded-xl object-cover" /></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 38; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 36; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 23; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 9; }
              throw e;
            }
          })()}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 4; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <><Footer /></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 4; }
            throw e;
          }
        })()}

      </div>
    </main>
  );
}
window.__BOLT_MAPS = window.__BOLT_MAPS || {};
window.__BOLT_MAPS['ContactPage.jsx'] = {"7":14,"8":15,"9":16,"14":2,"22":4,"25":5,"28":6,"36":7,"51":9,"54":10,"57":11,"60":12,"68":13,"112":23,"115":24,"118":25,"126":26,"141":28,"144":29,"152":30,"167":32,"170":33,"178":34,"193":36,"196":37,"204":38,"240":4};
//# sourceMappingURL=ContactPage.jsx.map