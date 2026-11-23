import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore, updateStore } from '../store.js';
import * as actions from '../actions.js';

export default function Header({ children }) {
  const { cart } = useStore(s => s);
  return (
    <div>
      {(() => {
        try {
          return <><div className="flex flex-row flex-wrap">
        {(() => {
          try {
            return <><h1>My Store</h1></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 5; }
            throw e;
          }
        })()}
        {((cart.length > 0)) ? (
          <>
        {(() => {
          try {
            return <><p>Cart Items: </p></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 7; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <><p>{cart.length}</p></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 8; }
            throw e;
          }
        })()}

          </>
        ) : (
          <>
        {(() => {
          try {
            return <><p>Cart is empty!</p></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 10; }
            throw e;
          }
        })()}

          </>
        )}

      </div></>;
        } catch (e) {
          if (!e.__boltLine) { e.__boltLine = 4; }
          throw e;
        }
      })()}

    </div>
  );
}
window.__BOLT_MAPS = window.__BOLT_MAPS || {};
window.__BOLT_MAPS['Header.jsx'] = {"9":4,"12":5,"20":6,"22":7,"30":8,"42":10};
//# sourceMappingURL=Header.jsx.map