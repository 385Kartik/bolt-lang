import { boltFetch } from './api.js';

export async function createProduct(name, price) {
return boltFetch("https://fakestoreapi.com/products", { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: name, price: price, description: "New item", image: "https://i.pravatar.cc", category: "electronic" }) })
  .then(res => res.json()).then(async result => {
return result;
  })
  .catch(async err => {
return err;
  });
}