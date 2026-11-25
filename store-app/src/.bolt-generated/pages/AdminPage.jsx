import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { boltFetch } from '../api.js';
import { useAuth } from '../components/AuthContext.jsx';
import { useToast } from '../components/ToastContext.jsx';
import { useModal } from '../components/ModalContext.jsx';
import * as actions from '../actions.js';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';
export default function AdminPage() {
  const { user, isLoggedIn, loginUser, logoutUser } = useAuth();
  const { addToast } = useToast();
  const { showModal } = useModal();
   const [newName, setNewName] = useState(() => {
    try {
      const stored = localStorage.getItem('bolt_newName');
      return stored !== null ? JSON.parse(stored) : "";
    } catch { return ""; }
  });
  useEffect(() => {
    localStorage.setItem('bolt_newName', JSON.stringify(newName));
  }, [newName]);
   const [newPrice, setNewPrice] = useState(() => {
    try {
      const stored = localStorage.getItem('bolt_newPrice');
      return stored !== null ? JSON.parse(stored) : "0";
    } catch { return "0"; }
  });
  useEffect(() => {
    localStorage.setItem('bolt_newPrice', JSON.stringify(newPrice));
  }, [newPrice]);

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
            return <><div className="sm:px-6 lg:px-8 w-full max-w-4xl mx-auto px-8 py-16">
          {(!isLoggedIn) && (
            <>
          {(() => {
            try {
              return <><div className="text-text border border-border shadow-sm p-8 bg-cardBg rounded-2xl mb-8">
            {(() => {
              try {
                return <><h1 className="text-3xl font-black mb-4">Admin Login</h1></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 18; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-gray-600 mb-6">Please log in to access the dashboard.</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 19; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { await boltFetch("https://fakestoreapi.com/auth/login", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: "mor_2314", password: "83r5^_" }) })
              .then(res => res.json()).then(async data => {
                if (data.token || data.user) loginUser(data);
              })
              .catch(err => console.error(err)); }}>Mock Login</button></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 21; }
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
          {(isLoggedIn) && (
            <>
          {(() => {
            try {
              return <><h1 className="text-4xl font-black mb-2">Admin Dashboard</h1></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 26; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><p className="text-gray-500 mb-8">Welcome back!</p></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 28; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><button className="bg-primary text-white rounded-xl px-4 py-2 mb-8" onClick={async () => { logoutUser(); }}>Logout</button></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 30; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="text-text border border-border shadow-sm p-8 bg-cardBg rounded-2xl mb-8">
            {(() => {
              try {
                return <><p className="text-xl font-bold mb-4">Add New Product</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 34; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><div className="flex flex-row flex-wrap gap-4 mb-4">
              {(() => {
                try {
                  return <><div className="flex flex-col">
                {(() => {
                  try {
                    return <><p className="text-sm font-semibold text-gray-700 mb-1">Product Name</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 38; }
                    throw e;
                  }
                })()}
                {(() => {
                  try {
                    return <><div className="flex flex-col gap-1">
                  <input placeholder={"Enter name"} value={newName} onChange={(e) => setNewName(e.target.value)} className="border-gray-300 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-2 border rounded-lg w-full" />
                </div></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 39; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 37; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><div className="flex flex-col">
                {(() => {
                  try {
                    return <><p className="text-sm font-semibold text-gray-700 mb-1">Price</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 41; }
                    throw e;
                  }
                })()}
                {(() => {
                  try {
                    return <><div className="flex flex-col gap-1">
                  <input placeholder={"Enter price"} value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="border-gray-300 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 px-4 py-2 border rounded-lg w-full" />
                </div></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 42; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 40; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 36; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><button className="bg-primary text-white rounded-xl px-4 py-2 mt-4" onClick={async () => {
              let response = await actions.createProduct(newName, newPrice);
              addToast("Product Created Successfully!", "success");
              setNewName("");
              setNewPrice("0");
            }}>Submit Product</button></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 44; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 33; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="text-text border border-border shadow-sm p-8 bg-cardBg rounded-2xl mb-8">
            {(() => {
              try {
                return <><p className="text-xl font-bold mb-4">Update/Delete Actions</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 51; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-sm text-gray-500 mb-4">FakeStore API allows mocking these actions. Check network tab.</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 52; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><div className="flex flex-row flex-wrap gap-4">
              {(() => {
                try {
                  return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { await boltFetch("https://fakestoreapi.com/products/1", { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: "Updated Name", price: 99.99 }) })
                .then(res => res.text().then(t => (t ? JSON.parse(t) : null))).then(async res => {
              addToast("Updated successfully!", "success");
                })
                .catch(err => { console.error(err); }); }}>Update Product #1</button></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 55; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><button className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors" onClick={async () => {
                if (!(await showModal("Are you sure you want to delete this product?"))) return;
                await boltFetch("https://fakestoreapi.com/products/1", { method: 'DELETE' })
                  .then(res => res.text().then(t => (t ? JSON.parse(t) : null))).then(async res => {
                addToast("Deleted successfully!", "success");
                  })
                  .catch(err => { console.error(err); });
              }}>Delete Product #1</button></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 60; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 54; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 50; }
              throw e;
            }
          })()}

            </>
          )}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 14; }
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
window.__BOLT_MAPS['AdminPage.jsx'] = {"13":11,"22":12,"35":2,"43":14,"46":16,"48":17,"51":18,"59":19,"67":21,"89":25,"91":26,"99":28,"107":30,"115":33,"118":34,"126":36,"129":37,"132":38,"140":39,"157":40,"160":41,"168":42,"192":44,"212":50,"215":51,"223":52,"231":54,"234":55,"246":60,"285":4};
//# sourceMappingURL=AdminPage.jsx.map