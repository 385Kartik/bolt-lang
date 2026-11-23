import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { boltFetch } from '../api.js';
import { useStore, updateStore } from '../store.js';
import * as actions from '../actions.js';
import Footer from '../components/Footer.jsx';
import Modal from '../components/Modal.jsx';
import Navbar from '../components/Navbar.jsx';
import ProductCard from '../components/ProductCard.jsx';
export default function HomePage() {
   const [featured, setFeatured] = useState(null);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState(null);
  useEffect(() => {
    boltFetch("https://fakestoreapi.com/products?limit=4")
      .then(res => res.json())
      .then(data => { setFeatured(data); setFeaturedLoading(false); })
      .catch(err => { setFeaturedError(err.message); setFeaturedLoading(false); });
  }, []);
   const [showTestModal, setShowTestModal] = useState(false);

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
        {featuredLoading ? (<p className="text-gray-400 animate-pulse">Loading...</p>) : (featuredError ? (<p className="text-red-500">Something went wrong: {featuredError}</p>) : (<>        {(() => {
          try {
            return <><div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 px-6 md:px-12 text-center rounded-3xl shadow-xl my-8">
          {(() => {
            try {
              return <><div className="max-w-7xl mx-auto sm:px-6 lg:px-8 w-full inline-block px-4 py-1.5 rounded-full bg-blue-50 text-blue-600 text-sm font-semibold mb-6">
            {(() => {
              try {
                return <><p>🚀 Built with Bolt Language</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 8; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 7; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><h1 className="text-5xl md:text-7xl font-black tracking-tight text-gray-900 mb-6 leading-tight">The Future of Shopping</h1></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 10; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><h2 className="text-xl text-gray-500 max-w-2xl mb-10 leading-relaxed">Experience blazing fast performance with our new generated e-commerce platform. No more bloated JavaScript.</h2></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 12; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="flex flex-row flex-wrap gap-4">
            {(() => {
              try {
                return <><Link to="/products" className="px-8 py-4 bg-primary hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-200">Shop Collection</Link></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 15; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><Link to="/about" className="px-8 py-4 bg-white border-2 border-gray-200 hover:border-gray-300 text-gray-800 rounded-xl font-bold transition-all">Learn More</Link></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 16; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 14; }
              throw e;
            }
          })()}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 6; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <><div className="md:py-16 w-full max-w-7xl mx-auto px-8 py-20">
          {(() => {
            try {
              return <><h1 className="text-3xl font-black text-gray-900 mb-2">Theme Preferences</h1></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 19; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="flex flex-row flex-wrap gap-4 mb-10">
            {(() => {
              try {
                return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { updateStore(s => { s.theme = "light"; }); }}>Light Theme</button></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 21; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { updateStore(s => { s.theme = "dark"; }); }}>Dark Theme</button></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 23; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { updateStore(s => { s.theme = "system"; }); }}>System Theme</button></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 25; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 20; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><h1 className="text-3xl font-black text-gray-900 mb-2">Featured Products</h1></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 28; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><h2 className="text-gray-400 mb-10">Handpicked items fetched live from FakeStore API</h2></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 29; }
              throw e;
            }
          })()}
          {((featured === null)) && (
            <>
          {(() => {
            try {
              return <><p className="text-center text-gray-400 py-12 animate-pulse">Loading featured products...</p></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 32; }
              throw e;
            }
          })()}

            </>
          )}
          {(() => {
            try {
              return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { setShowTestModal(true); }}>Test Modal Component</button></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 35; }
              throw e;
            }
          })()}
          {(showTestModal) && (
            <>
          {(() => {
            try {
              return <><Modal title={"Warning"}>
            {(() => {
              try {
                return <><p className="text-gray-600 mb-6">Are you sure you want to delete this item? This action cannot be undone.</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 40; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><div className="flex flex-row flex-wrap gap-3 justify-end">
              {(() => {
                try {
                  return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { setShowTestModal(false); }}>Cancel</button></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 42; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { setShowTestModal(false); }}>Delete</button></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 44; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 41; }
                throw e;
              }
            })()}

          </Modal></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 39; }
              throw e;
            }
          })()}

            </>
          )}
          {((featured !== null)) && (
            <>
          {(() => {
            try {
              return <><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(() => {
              try {
                return <>{featured.map((product, i) => <ProductCard key={i} product={product} />)}</>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 48; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 47; }
              throw e;
            }
          })()}

            </>
          )}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 18; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <><div className="md:py-16 w-full max-w-7xl mx-auto px-8 py-20">
          {(() => {
            try {
              return <><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {(() => {
              try {
                return <><div className="bg-cardBg text-text border border-border rounded-xl shadow-sm p-6">
              {(() => {
                try {
                  return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-xl">
                {(() => {
                  try {
                    return <><p>⚡</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 55; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 54; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="font-bold text-xl mb-3">Lightning Fast</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 56; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="text-gray-500 leading-relaxed">Compiled directly to React for maximum performance.</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 57; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 53; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><div className="bg-cardBg text-text border border-border rounded-xl shadow-sm p-6">
              {(() => {
                try {
                  return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-xl">
                {(() => {
                  try {
                    return <><p>🎨</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 61; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 60; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="font-bold text-xl mb-3">Beautiful UI</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 62; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="text-gray-500 leading-relaxed">Styled with Tailwind CSS for perfect modern aesthetics.</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 63; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 59; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><div className="bg-cardBg text-text border border-border rounded-xl shadow-sm p-6">
              {(() => {
                try {
                  return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center mb-6 text-xl">
                {(() => {
                  try {
                    return <><p>📱</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 67; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 66; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="font-bold text-xl mb-3">Responsive</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 68; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="text-gray-500 leading-relaxed">Looks amazing on any device, anywhere.</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 69; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 65; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 51; }
              throw e;
            }
          })()}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 50; }
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
        })()}</>))}

      </div>
    </main>
  );
}
window.__BOLT_MAPS = window.__BOLT_MAPS || {};
window.__BOLT_MAPS['HomePage.jsx'] = {"10":2,"19":3,"24":2,"32":2,"35":7,"38":8,"53":10,"61":12,"69":14,"72":15,"80":16,"102":18,"105":19,"113":20,"116":21,"124":23,"132":25,"147":28,"155":29,"163":31,"165":32,"176":35,"184":38,"186":39,"189":40,"197":41,"200":42,"208":44,"233":46,"235":47,"238":48,"263":50,"266":51,"269":53,"272":54,"275":55,"290":56,"298":57,"313":59,"316":60,"319":61,"334":62,"342":63,"357":65,"360":66,"363":67,"378":68,"386":69,"415":4};
//# sourceMappingURL=HomePage.jsx.map