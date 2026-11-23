import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore, updateStore } from '../store.js';
import * as actions from '../actions.js';
import Header from '../components/Header.jsx';
export default function Store_testPage() {
  const { cart } = useStore(s => s);
  return (
    <main>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        {(() => {
          try {
            return <><div className="flex flex-col">
          {(() => {
            try {
              return <><Header /></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 15; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><h1>Products</h1></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 16; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { updateStore(s => { s.cart.push("Apple"); }); }}>Add Apple</button></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 18; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { updateStore(s => { s.cart.push("Banana"); }); }}>Add Banana</button></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 21; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><button className="bg-primary text-white rounded-xl px-4 py-2" onClick={async () => { updateStore(s => { s.cart = []; }); }}>Clear Cart</button></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 24; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><p>Current Cart:</p></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 27; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div>
            {cart.map((item, i) => <div key={i}>{JSON.stringify(item)}</div>)}
          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 28; }
              throw e;
            }
          })()}

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 14; }
            throw e;
          }
        })()}

      </div>
    </main>
  );
}
window.__BOLT_MAPS = window.__BOLT_MAPS || {};
window.__BOLT_MAPS['Store_testPage.jsx'] = {"10":14,"13":15,"21":16,"29":18,"37":21,"45":24,"53":27,"61":28};
//# sourceMappingURL=Store_testPage.jsx.map