import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as actions from '../actions.js';

export default function TeamCard({ member, children }) {
  return (
    <div>
      {(() => {
        try {
          return <><div className="text-text shadow-sm p-0 bg-background border border-border rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 group">
        {(() => {
          try {
            return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          {(() => {
            try {
              return <><p></p></>;
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
            return <><div className="flex flex-col p-6 gap-3">
          {(() => {
            try {
              return <><div className="flex flex-row flex-wrap gap-4 items-center">
            {(() => {
              try {
                return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
              {(() => {
                try {
                  return <><p>{member.name}</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 9; }
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
                  return <><p className="font-bold text-text text-lg">{member.name}</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 11; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="text-sm text-blue-500">{member.email}</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 12; }
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
              if (!e.__boltLine) { e.__boltLine = 7; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-px bg-gray-100 w-full my-1">
            {(() => {
              try {
                return <><p></p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 15; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 14; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="flex flex-row flex-wrap gap-2 items-center">
            {(() => {
              try {
                return <><p>🏢</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 18; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-sm font-semibold text-gray-700">{member.company.name}</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 19; }
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
              return <><p className="text-xs text-gray-400 italic pl-7">{member.company.catchPhrase}</p></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 21; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="flex flex-row flex-wrap gap-2 items-center">
            {(() => {
              try {
                return <><p>📍</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 24; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-sm text-gray-600">{member.address.city}</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 25; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-gray-300">·</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 26; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-sm text-gray-400">{member.address.street}</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 27; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 23; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="flex flex-row flex-wrap gap-2 items-center">
            {(() => {
              try {
                return <><p>🌐</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 30; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-sm text-blue-500 underline">{member.website}</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 31; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 29; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="flex flex-row flex-wrap gap-2 items-center">
            {(() => {
              try {
                return <><p>📞</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 34; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-sm text-gray-500">{member.phone}</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 35; }
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
              return <><div className="flex flex-row flex-wrap gap-4 mt-2">
            {(() => {
              try {
                return <><div className="max-w-7xl mx-auto sm:px-6 lg:px-8 w-full flex-1 bg-cardBg rounded-lg p-3 text-center">
              {(() => {
                try {
                  return <><p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">LAT</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 39; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="text-sm font-mono text-gray-700">{member.address.geo.lat}</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 40; }
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
                return <><div className="max-w-7xl mx-auto sm:px-6 lg:px-8 w-full flex-1 bg-cardBg rounded-lg p-3 text-center">
              {(() => {
                try {
                  return <><p className="text-[10px] text-gray-400 uppercase tracking-wider font-bold">LNG</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 42; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><p className="text-sm font-mono text-gray-700">{member.address.geo.lng}</p></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 43; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 41; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 37; }
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
window.__BOLT_MAPS['TeamCard.jsx'] = {"7":2,"10":3,"13":4,"28":6,"31":7,"34":8,"37":9,"52":10,"55":11,"63":12,"85":14,"88":15,"103":17,"106":18,"114":19,"129":21,"137":23,"140":24,"148":25,"156":26,"164":27,"179":29,"182":30,"190":31,"205":33,"208":34,"216":35,"231":37,"234":38,"237":39,"245":40,"260":41,"263":42,"271":43};
//# sourceMappingURL=TeamCard.jsx.map