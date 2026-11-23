import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as actions from '../actions.js';

export default function Footer({ children }) {
  return (
    <div>
      {(() => {
        try {
          return <><div className="max-w-7xl mx-auto sm:px-6 lg:px-8 w-full bg-gray-50 pt-16 pb-8 px-8 border-t border-gray-200 mt-20">
        {(() => {
          try {
            return <><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 max-w-7xl mx-auto gap-12">
          {(() => {
            try {
              return <><div className="flex flex-col">
            {(() => {
              try {
                return <><h1 className="text-xl font-bold text-gray-900 mb-4">BoltStore</h1></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 5; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-gray-500 text-sm leading-relaxed">The next generation of e-commerce built with the Bolt language.</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 6; }
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
              return <><div className="flex flex-col">
            {(() => {
              try {
                return <><h1 className="font-semibold text-gray-900 mb-4">Quick Links</h1></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 9; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><div className="flex flex-col gap-2 text-sm text-gray-500">
              {(() => {
                try {
                  return <><Link to="/">Home</Link></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 11; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><Link to="/products">Products</Link></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 12; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><Link to="/about">About</Link></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 13; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 10; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 8; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="flex flex-col">
            {(() => {
              try {
                return <><h1 className="font-semibold text-gray-900 mb-4">Subscribe</h1></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 16; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-sm text-gray-500 mb-4">Get the latest updates and offers.</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 17; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><div className="flex flex-row flex-wrap gap-2">
              {(() => {
                try {
                  return <><div className="max-w-7xl mx-auto sm:px-6 lg:px-8 w-full flex-1 bg-gray-100 rounded-lg px-4 py-2 text-sm text-gray-400">
                {(() => {
                  try {
                    return <><p>Email address...</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 20; }
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
                  return <><button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700" onClick={async () => {

              }}>Join</button></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 21; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 18; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 15; }
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
            return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full border-t border-gray-200 mt-12 pt-8 text-center text-sm text-gray-500">
          {(() => {
            try {
              return <><p>© 2026 BoltStore. All rights reserved.</p></>;
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
          if (!e.__boltLine) { e.__boltLine = 2; }
          throw e;
        }
      })()}

    </div>
  );
}
window.__BOLT_MAPS = window.__BOLT_MAPS || {};
window.__BOLT_MAPS['Footer.jsx'] = {"7":2,"10":3,"13":4,"16":5,"24":6,"39":8,"42":9,"50":10,"53":11,"61":12,"69":13,"91":15,"94":16,"102":17,"110":18,"113":19,"116":20,"131":21,"162":23,"165":24};
//# sourceMappingURL=Footer.jsx.map