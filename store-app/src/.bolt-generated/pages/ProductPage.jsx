import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { boltFetch } from '../api.js';
import { useAuth } from '../components/AuthContext.jsx';
import { useToast } from '../components/ToastContext.jsx';
import { useStore, updateStore } from '../store.js';
import * as actions from '../actions.js';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';
export default function ProductPage() {
  const { id } = useParams();
  const { cart } = useStore(s => s);
  const navigate = useNavigate();
  const { user, isLoggedIn, loginUser, logoutUser } = useAuth();
  const { addToast } = useToast();
   const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(true);
  const [productError, setProductError] = useState(null);
  useEffect(() => {
    boltFetch(("https://fakestoreapi.com/products/" + id))
      .then(res => res.json())
      .then(data => { setProduct(data); setProductLoading(false); })
      .catch(err => { setProductError(err.message); setProductLoading(false); });
  }, [id]);

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
        {productLoading ? (<>        {(() => {
          try {
            return <><div className="md:py-16 w-full max-w-7xl mx-auto px-8 py-32 text-center">
          {(() => {
            try {
              return <><p className="text-xl text-gray-500 animate-pulse">Loading product details...</p></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 7; }
              throw e;
            }
          })()}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 6; }
            throw e;
          }
        })()}</>) : (productError ? ((() => { const err = productError; return <>        {(() => {
          try {
            return <><div className="md:py-16 w-full max-w-7xl mx-auto px-8 py-32 text-center">
          {(() => {
            try {
              return <><h1 className="text-red-500 font-bold mb-4">Error loading product!</h1></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 10; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><h2 className="text-gray-500">{err}</h2></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 11; }
              throw e;
            }
          })()}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 9; }
            throw e;
          }
        })()}</>; })()) : (<>        {(() => {
          try {
            return <><div className="md:py-16 w-full max-w-7xl mx-auto px-8 py-24">
          {(() => {
            try {
              return <><div className="flex flex-wrap items-start gap-12 flex-col md:flex-row">
            {(() => {
              try {
                return <><div className="max-w-7xl mx-auto sm:px-6 lg:px-8 w-full flex-1 bg-background p-12 rounded-3xl border border-border shadow-sm">
              {(() => {
                try {
                  return <><img src={product.image} alt="Image" className="w-full h-auto max-h-[500px] object-contain" /></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 17; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 16; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><div className="flex flex-col flex-1">
              {(() => {
                try {
                  return <><p className="text-sm font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-full inline-block w-max mb-6">{product.category}</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 21; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><h1 className="text-4xl md:text-5xl font-black text-text leading-tight mb-6">{product.title}</h1></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 23; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><div className="flex flex-row flex-wrap items-center gap-4 mb-8">
                {(() => {
                  try {
                    return <><p className="text-lg font-bold text-yellow-500">{("★ " + product.rating.rate)}</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 26; }
                    throw e;
                  }
                })()}
                {(() => {
                  try {
                    return <><p className="text-gray-500">{(("(" + product.rating.count) + " reviews)")}</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 27; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 25; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="text-5xl font-black text-text mb-8">{("$" + product.price)}</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 29; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><label className="text-lg font-bold text-text mb-3">Description</label></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 31; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="text-gray-500 leading-relaxed text-lg mb-10">{product.description}</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 32; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><div className="flex flex-row flex-wrap gap-4">
                {(() => {
                  try {
                    return <><button className="px-4 flex-1 py-4 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-lg transition-colors" onClick={async () => { if (isLoggedIn) {
                  updateStore(s => { s.cart.push(product); });
                  addToast("Added to cart!", "success");
                } else {
                  addToast("Please login first", "danger");
                  navigate('/login');
                }; }}>Add to Cart</button></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 35; }
                    throw e;
                  }
                })()}
                {(() => {
                  try {
                    return <><button className="py-4 px-8 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold transition-colors" onClick={async () => { navigate('/'); }}>Back to Home</button></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 43; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 34; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 20; }
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
            if (!e.__boltLine) { e.__boltLine = 13; }
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
window.__BOLT_MAPS['ProductPage.jsx'] = {"15":4,"28":2,"36":4,"39":7,"53":9,"56":10,"64":11,"78":13,"81":14,"84":16,"87":17,"102":20,"105":21,"113":23,"121":25,"124":26,"132":27,"147":29,"155":31,"163":32,"171":34,"174":35,"188":43,"224":4};
//# sourceMappingURL=ProductPage.jsx.map