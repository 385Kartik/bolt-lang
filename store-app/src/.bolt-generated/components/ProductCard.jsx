import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext.jsx';
import { useToast } from './ToastContext.jsx';
import { useStore, updateStore } from '../store.js';
import * as actions from '../actions.js';

export default function ProductCard({ product, children }) {
  const { cart } = useStore(s => s);
  const navigate = useNavigate();
  const { user, isLoggedIn, loginUser, logoutUser } = useAuth();
  const { addToast } = useToast();
  return (
    <div>
      {(() => {
        try {
          return <><div className="bg-cardBg text-text border border-border rounded-xl shadow-sm p-6 flex flex-col p-0 bg-white border border-gray-100 rounded-2xl hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group cursor-pointer overflow-hidden">
        {(() => {
          try {
            return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full aspect-[4/3] bg-gray-50 overflow-hidden flex items-center justify-center p-6">
          {(() => {
            try {
              return <><img src={product.image} alt="Image" className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-500" /></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 4; }
              throw e;
            }
          })()}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 3; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <><div className="flex flex-col gap-2 p-5">
          {(() => {
            try {
              return <><div className="flex flex-row flex-wrap justify-between items-center">
            {(() => {
              try {
                return <><p className="text-[10px] text-blue-600 font-bold uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-full">{product.category}</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 8; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><div className="flex flex-row flex-wrap gap-1 items-center">
              {(() => {
                try {
                  return <><p className="text-yellow-500 text-sm">★</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 10; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="text-gray-700 text-xs font-semibold">{product.rating.rate}</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 11; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="text-gray-300 text-xs">·</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 12; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="text-gray-400 text-xs">{product.rating.count}</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 13; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><label className="text-gray-400 text-xs">reviews</label></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 14; }
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
              if (!e.__boltLine) { e.__boltLine = 7; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><p className="font-semibold text-gray-900 text-sm line-clamp-2 leading-snug mt-1">{product.title}</p></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 16; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{product.description}</p></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 17; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="flex flex-row flex-wrap justify-between items-center mt-3 pt-3 border-t border-gray-100">
            {(() => {
              try {
                return <><div className="flex flex-col">
              {(() => {
                try {
                  return <><label className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">Price</label></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 21; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="font-black text-gray-900 text-xl">{product.price}</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 22; }
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
                return <><div className="flex flex-col items-end">
              {(() => {
                try {
                  return <><p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider bg-emerald-50 px-2 py-0.5 rounded-full">In Stock</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 24; }
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
              if (!e.__boltLine) { e.__boltLine = 19; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="flex flex-row flex-wrap gap-2 mt-3">
            {(() => {
              try {
                return <><button className="bg-primary text-white rounded-xl px-4 py-2 flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium text-sm transition-colors" onClick={async () => { navigate(`/product/${product.id}`); }}>View Details</button></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 27; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><button className="bg-primary text-white rounded-xl px-4 py-2 flex-1 py-2.5 bg-gray-900 hover:bg-black text-white rounded-lg font-medium text-sm transition-colors" onClick={async () => { if (isLoggedIn) {
              updateStore(s => { s.cart.push(product); });
              addToast("Added to cart", "success");
            } else {
              addToast("Please login first", "danger");
              navigate('/login');
            }; }}>Add to Cart</button></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 29; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 26; }
              throw e;
            }
          })()}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 6; }
            throw e;
          }
        })()}

      </div></>;
        } catch (e) {
          if (!e.__boltLine) { e.__boltLine = 2; }
          throw e;
        }
      })()}

    </div>
  );
}
window.__BOLT_MAPS = window.__BOLT_MAPS || {};
window.__BOLT_MAPS['ProductCard.jsx'] = {"14":2,"17":3,"20":4,"35":6,"38":7,"41":8,"49":9,"52":10,"60":11,"68":12,"76":13,"84":14,"106":16,"114":17,"122":19,"125":20,"128":21,"136":22,"151":23,"154":24,"176":26,"179":27,"187":29};
//# sourceMappingURL=ProductCard.jsx.map