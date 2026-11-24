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
            return <><div className="md:py-16 w-full max-w-4xl mx-auto px-8 py-24">
          {(() => {
            try {
              return <><div className="flex flex-col text-center mb-16">
            {(() => {
              try {
                return <><h1 className="text-5xl font-black text-text tracking-tight mb-6">About BoltStore</h1></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 6; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><h2 className="text-xl text-gray-500">We're pushing the boundaries of what's possible with modern web technologies.</h2></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 7; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 5; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="flex flex-col prose prose-lg prose-blue mx-auto text-gray-600 leading-relaxed">
            {(() => {
              try {
                return <><p className="text-3xl font-bold text-text mb-6 mt-12">Our Mission</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 10; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="mb-6">This e-commerce store is entirely built using the new Bolt programming language. Bolt allows developers to write less code while generating highly optimized React applications.</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 12; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><p className="text-3xl font-bold text-text mb-6 mt-12">The Technology</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 14; }
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
                    return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  {(() => {
                    try {
                      return <><p>1</p></>;
                    } catch (e) {
                      if (!e.__boltLine) { e.__boltLine = 19; }
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
                    return <><p>Custom Lexer and Parser written from scratch.</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 20; }
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
                  return <><div className="flex flex-row flex-wrap gap-4 items-start">
                {(() => {
                  try {
                    return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  {(() => {
                    try {
                      return <><p>2</p></>;
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
                {(() => {
                  try {
                    return <><p>Generates standard AST nodes.</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 25; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 22; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><div className="flex flex-row flex-wrap gap-4 items-start">
                {(() => {
                  try {
                    return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  {(() => {
                    try {
                      return <><p>3</p></>;
                    } catch (e) {
                      if (!e.__boltLine) { e.__boltLine = 29; }
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
                    return <><p>Compiles directly to React and Tailwind CSS.</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 30; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 27; }
                  throw e;
                }
              })()}
              {(() => {
                try {
                  return <><div className="flex flex-row flex-wrap gap-4 items-start">
                {(() => {
                  try {
                    return <><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  {(() => {
                    try {
                      return <><p>4</p></>;
                    } catch (e) {
                      if (!e.__boltLine) { e.__boltLine = 34; }
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
                    return <><p>Supports multi-file architecture and automatic routing.</p></>;
                  } catch (e) {
                    if (!e.__boltLine) { e.__boltLine = 35; }
                    throw e;
                  }
                })()}

              </div></>;
                } catch (e) {
                  if (!e.__boltLine) { e.__boltLine = 32; }
                  throw e;
                }
              })()}

            </div></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 16; }
                throw e;
              }
            })()}

          </div></>;
            } catch (e) {
              if (!e.__boltLine) { e.__boltLine = 9; }
              throw e;
            }
          })()}
          {(() => {
            try {
              return <><div className="bg-gradient-to-r from-blue-600 to-indigo-700 md:px-12 shadow-xl my-8 mt-20 p-12 bg-gray-900 rounded-3xl text-center text-white">
            {(() => {
              try {
                return <><p className="text-3xl font-bold mb-6">Ready to explore?</p></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 38; }
                throw e;
              }
            })()}
            {(() => {
              try {
                return <><Link to="/products" className="inline-block px-8 py-4 bg-background text-gray-800 hover:bg-gray-100 rounded-xl font-bold transition-colors">Start Shopping</Link></>;
              } catch (e) {
                if (!e.__boltLine) { e.__boltLine = 39; }
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
            if (!e.__boltLine) { e.__boltLine = 3; }
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
        })()}

      </div>
    </main>
  );
}
window.__BOLT_MAPS = window.__BOLT_MAPS || {};
window.__BOLT_MAPS['AboutPage.jsx'] = {"9":2,"17":3,"20":5,"23":6,"31":7,"46":9,"49":10,"57":12,"65":14,"73":16,"76":17,"79":18,"82":19,"97":20,"112":22,"115":23,"118":24,"133":25,"148":27,"151":28,"154":29,"169":30,"184":32,"187":33,"190":34,"205":35,"234":37,"237":38,"245":39,"267":4};
//# sourceMappingURL=AboutPage.jsx.map