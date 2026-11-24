import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as actions from '../actions.js';

export default function Modal({ title, children }) {
  return (
    <div>
      {(() => {
        try {
          return <><div className="flex flex-col bg-background rounded-lg shadow-xl p-6 border border-border">
        {(() => {
          try {
            return <><h1 className="text-xl font-bold text-text mb-4">{title}</h1></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 3; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <>{children}</>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 4; }
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
window.__BOLT_MAPS['Modal.jsx'] = {"7":2,"10":3,"18":4};
//# sourceMappingURL=Modal.jsx.map