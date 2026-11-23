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
            if (!e.__boltLine) { e.__boltLine = 14; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full max-w-4xl mx-auto px-8 py-16">
          {(!isLoggedIn) && (
            <>
          {(() => {
            try {
              return <><div className="bg-cardBg text-text border border-border rounded-xl shadow-sm p-6 p-8 bg-gray-50 rounded-2xl mb-8">
            {(() => {
              try {
                return <><h1 className="text-3xl font-black mb-4">Admin Login</h1></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 20; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-gray-600 mb-6">Please log in to access the dashboard.</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 21; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { await boltFetch("https://fakestoreapi.com/auth/login", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: "mor_2314", password: "83r5^_" }) })
              .then(res => res.json()).then(data => {
                if (data.token || data.user) loginUser(data);
              })
              .catch(err => console.error(err)); }}>Mock Login</button></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 23; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 19; }
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
              if (!e.__boltLine) { e.__boltLine = 28; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><p className="text-gray-500 mb-8">Welcome back!</p></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 30; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><button className="bg-primary text-white rounded-xl px-4 py-2 mb-8" onClick={async () => { logoutUser(); }}>Logout</button></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 32; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="bg-cardBg text-text border border-border rounded-xl shadow-sm p-6 p-8 bg-gray-50 rounded-2xl mb-8">
            {(() => {
              try {
                return <><p className="text-xl font-bold mb-4">Add New Product</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 36; }
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
                    if (!e.__boltLine) { e.__boltLine = 40; }
                    throw e;
                  }
                })()}
                {(() => {
                  try {
                    return <><div className="flex flex-col gap-1">
                  <input placeholder={"Enter name"} value={newName} onChange={(e) => setNewName(e.target.value)} className="px-4 py-2 border rounded-lg w-full" />
                </div></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 41; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 39; }
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
                    if (!e.__boltLine) { e.__boltLine = 43; }
                    throw e;
                  }
                })()}
                {(() => {
                  try {
                    return <><div className="flex flex-col gap-1">
                  <input placeholder={"Enter price"} value={newPrice} onChange={(e) => setNewPrice(e.target.value)} className="px-4 py-2 border rounded-lg w-full" />
                </div></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 44; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 42; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 38; }
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
                if (!e.__boltLine) { e.__boltLine = 46; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 35; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="bg-cardBg text-text border border-border rounded-xl shadow-sm p-6 p-8 bg-gray-50 rounded-2xl mb-8">
            {(() => {
              try {
                return <><p className="text-xl font-bold mb-4">Update/Delete Actions</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 53; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-sm text-gray-500 mb-4">FakeStore API allows mocking these actions. Check network tab.</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 54; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><div className="flex flex-row flex-wrap gap-4">
              {(() => {
                try {
                  return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { return boltFetch("https://fakestoreapi.com/products/1", { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: "Updated Name", price: 99.99 }) })
                .then(res => res.json()).then(async res => {
              addToast("Updated successfully!", "success");
                }); }}>Update Product #1</button></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 57; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><button className="bg-primary text-white rounded-xl px-4 py-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium transition-colors" onClick={async () => {
                if (!(await showModal("Are you sure you want to delete this product?"))) return;
                return boltFetch("https://fakestoreapi.com/products/1", { method: 'DELETE' })
                  .then(res => res.json()).then(async res => {
                addToast("Deleted successfully!", "success");
                  });
              }}>Delete Product #1</button></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 62; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 56; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 52; }
              throw e;
            }
          })()}

            </>
          )}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 16; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <><Footer /></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 68; }
            throw e;
          }
        })()}

      </div>
    </main>
  );
}
window.__BOLT_MAPS = window.__BOLT_MAPS || {};
window.__BOLT_MAPS['AdminPage.jsx'] = {"13":11,"22":12,"35":14,"43":16,"46":18,"48":19,"51":20,"59":21,"67":23,"89":27,"91":28,"99":30,"107":32,"115":35,"118":36,"126":38,"129":39,"132":40,"140":41,"157":42,"160":43,"168":44,"192":46,"212":52,"215":53,"223":54,"231":56,"234":57,"245":62,"283":68};
//# sourceMappingURL=AdminPage.jsx.map