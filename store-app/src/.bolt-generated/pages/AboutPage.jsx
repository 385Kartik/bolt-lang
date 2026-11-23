import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as actions from '../actions.js';
import Footer from '../components/Footer.jsx';
import Navbar from '../components/Navbar.jsx';
export default function AboutPage() {
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
            return <><div className="py-12 md:py-16 w-full max-w-4xl mx-auto px-8 py-24">
          {(() => {
            try {
              return <><div className="flex flex-col text-center mb-16">
            {(() => {
              try {
                return <><h1 className="text-5xl font-black text-gray-900 tracking-tight mb-6">About BoltStore</h1></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 7; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><h2 className="text-xl text-gray-500">We're pushing the boundaries of what's possible with modern web technologies.</h2></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 8; }
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
              return <><div className="flex flex-col prose prose-lg prose-blue mx-auto text-gray-600 leading-relaxed">
            {(() => {
              try {
                return <><p className="text-3xl font-bold text-gray-900 mb-6 mt-12">Our Mission</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 11; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="mb-6">This e-commerce store is entirely built using the new Bolt programming language. Bolt allows developers to write less code while generating highly optimized React applications.</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 13; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-3xl font-bold text-gray-900 mb-6 mt-12">The Technology</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 15; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><div className="flex flex-col gap-4 mb-12">
              {(() => {
                try {
                  return <><div className="flex flex-row flex-wrap gap-4 items-start">
                {(() => {
                  try {
                    return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  {(() => {
                    try {
                      return <><p>1</p></>;
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
                    return <><p>Custom Lexer and Parser written from scratch.</p></>;
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
              {(() => {
                try {
                  return <><div className="flex flex-row flex-wrap gap-4 items-start">
                {(() => {
                  try {
                    return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  {(() => {
                    try {
                      return <><p>2</p></>;
                    } catch (e) {
                      if (!e.__boltLine) { e.__boltLine = 25; }
                      throw e;
                    }
                  })()}

                </div></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 24; }
                    throw e;
                  }
                })()}
                {(() => {
                  try {
                    return <><p>Generates standard AST nodes.</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 26; }
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
                  return <><div className="flex flex-row flex-wrap gap-4 items-start">
                {(() => {
                  try {
                    return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  {(() => {
                    try {
                      return <><p>3</p></>;
                    } catch (e) {
                      if (!e.__boltLine) { e.__boltLine = 30; }
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
                    return <><p>Compiles directly to React and Tailwind CSS.</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 31; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 28; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><div className="flex flex-row flex-wrap gap-4 items-start">
                {(() => {
                  try {
                    return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  {(() => {
                    try {
                      return <><p>4</p></>;
                    } catch (e) {
                      if (!e.__boltLine) { e.__boltLine = 35; }
                      throw e;
                    }
                  })()}

                </div></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 34; }
                    throw e;
                  }
                })()}
                {(() => {
                  try {
                    return <><p>Supports multi-file architecture and automatic routing.</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 36; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 33; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 17; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 10; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-20 px-6 md:px-12 text-center rounded-3xl shadow-xl my-8 mt-20 p-12 bg-gray-900 rounded-3xl text-center text-white">
            {(() => {
              try {
                return <><p className="text-3xl font-bold mb-6">Ready to explore?</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 39; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><Link to="/products" className="inline-block px-8 py-4 bg-white text-gray-900 hover:bg-gray-100 rounded-xl font-bold transition-colors">Start Shopping</Link></>;
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

        </div></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 4; }
            throw e;
          }
        })()}
        {(() => {
          try {
            return <><Footer /></>;
          } catch (e) {
            if (!e.__boltLine) { e.__boltLine = 42; }
            throw e;
          }
        })()}

      </div>
    </main>
  );
}
window.__BOLT_MAPS = window.__BOLT_MAPS || {};
window.__BOLT_MAPS['AboutPage.jsx'] = {"9":2,"17":4,"20":6,"23":7,"31":8,"46":10,"49":11,"57":13,"65":15,"73":17,"76":18,"79":19,"82":20,"97":21,"112":23,"115":24,"118":25,"133":26,"148":28,"151":29,"154":30,"169":31,"184":33,"187":34,"190":35,"205":36,"234":38,"237":39,"245":40,"267":42};
//# sourceMappingURL=AboutPage.jsx.map