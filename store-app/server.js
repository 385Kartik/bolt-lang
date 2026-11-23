import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const users = [];
const products = [
  { 
    id: 1, 
    title: "Premium Wireless Headphones", 
    price: 299, 
    description: "High quality wireless headphones with noise cancellation.",
    category: "electronics",
    image: "https://fakestoreapi.com/img/81QpkIctqPL._AC_SX679_.jpg",
    rating: { rate: 4.8, count: 120 }
  },
  { 
    id: 2, 
    title: "Mechanical Keyboard", 
    price: 149, 
    description: "RGB mechanical keyboard with tactile switches.",
    category: "electronics",
    image: "https://fakestoreapi.com/img/81Zt42O02sL._AC_SX679_.jpg",
    rating: { rate: 4.9, count: 85 }
  },
  { 
    id: 3, 
    title: "Ergonomic Mouse", 
    price: 79, 
    description: "Wireless ergonomic mouse for comfortable daily use.",
    category: "electronics",
    image: "https://fakestoreapi.com/img/71pWzhdJNwL._AC_UL640_QL65_ML3_.jpg",
    rating: { rate: 4.5, count: 320 }
  },
  { 
    id: 4, 
    title: "4K Monitor", 
    price: 399, 
    description: "27-inch 4K UHD monitor with HDR support.",
    category: "electronics",
    image: "https://fakestoreapi.com/img/81QpkIctqPL._AC_SX679_.jpg",
    rating: { rate: 4.7, count: 215 }
  }
];

app.post('/api/signup', (req, res) => {
  const { email, password } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ error: "User already exists" });
  }
  const user = { email, password, token: "real_token_" + Date.now() };
  users.push(user);
  res.json({ token: user.token, user: { email } });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  res.json({ token: user.token, user: { email } });
});

app.get('/api/products', (req, res) => {
  res.json(products);
});

const server = app.listen(3001, () => {
  console.log('Real backend server running on http://localhost:3001');
});
server.on('error', (e) => {
  console.error("Server error:", e);
});
