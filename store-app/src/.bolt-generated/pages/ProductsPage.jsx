import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { boltFetch } from '../api.js';
import * as actions from '../actions.js';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';
import ProductCard from '../components/ProductCard.jsx';
export default function ProductsPage() {
   const [products, setProducts] = useState(null);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  useEffect(() => {
    boltFetch("http://localhost:3001/api/products")
      .then(res => res.json())
      .then(data => { setProducts(data); setProductsLoading(false); })
      .catch(err => { setProductsError(err.message); setProductsLoading(false); });
  }, []);

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
            return <><div className="bg-gradient-to-r from-blue-600 to-indigo-700 md:px-12 rounded-3xl shadow-xl my-8 bg-gray-900 text-white py-20 px-8 text-center">
          {(() => {
            try {
              return <><h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">Our Collection</h1></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 4; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><h2 className="text-gray-400 text-lg max-w-2xl mx-auto">Live products from FakeStore API — powered by Bolt's fetch keyword!</h2></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 6; }
              throw e;
            }
          })()}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 3; }
            throw e;
          }
        })()}
        {productsLoading ? (<>        {(() => {
          try {
            return <><p className="text-xl font-bold text-gray-500 animate-pulse text-center py-20">Loading amazing products...</p></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 11; }
            throw e;
          }
        })()}</>) : (productsError ? ((() => { const err = productsError; return <>        {(() => {
          try {
            return <><p className="text-red-500 text-center py-20">{("Failed to load products: " + err)}</p></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 13; }
            throw e;
          }
        })()}</>; })()) : ((!products || (Array.isArray(products) && products.length === 0)) ? (<>        {(() => {
          try {
            return <><p className="text-gray-500 text-center py-20">No products found in this category.</p></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 15; }
            throw e;
          }
        })()}</>) : (<>        {(() => {
          try {
            return <><div className="md:py-16 w-full max-w-7xl mx-auto px-8 py-16">
          {(() => {
            try {
              return <><div className="flex flex-row flex-wrap gap-4 mb-12 border-b border-gray-100 pb-8">
            {(() => {
              try {
                return <><button className="px-6 py-2 bg-gray-900 text-white rounded-full text-sm font-medium" onClick={async () => {

            }}>All Items</button></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 19; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><button className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors" onClick={async () => {

            }}>Electronics</button></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 20; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><button className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors" onClick={async () => {

            }}>Jewelry</button></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 21; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><button className="px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-sm font-medium transition-colors" onClick={async () => {

            }}>Clothing</button></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 22; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 18; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(() => {
              try {
                return <>{products.map((product, i) => <ProductCard key={i} product={product} />)}</>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 26; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 25; }
              throw e;
            }
          })()}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 17; }
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
        })()}</>)))}

      </div>
    </main>
  );
}
window.__BOLT_MAPS = window.__BOLT_MAPS || {};
window.__BOLT_MAPS['ProductsPage.jsx'] = {"8":9,"21":2,"29":3,"32":4,"40":6,"55":9,"62":13,"69":15,"76":17,"79":18,"82":19,"92":20,"102":21,"112":22,"129":25,"132":26,"154":4};
//# sourceMappingURL=ProductsPage.jsx.map