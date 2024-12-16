const express = require('express');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const SECRET_KEY = 'your-very-secret-key';  // Переконайтеся, що секретна фраза надійна!

app.use(bodyParser.json());

const usersFile = 'users.json';
const healthDataFile = 'health_data.json';

// Читання користувачів
const readUsers = () => {
  if (fs.existsSync(usersFile)) {
    return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
  }
  return [];
};

// Читання даних здоров'я
const readHealthData = () => {
  if (fs.existsSync(healthDataFile)) {
    return JSON.parse(fs.readFileSync(healthDataFile, 'utf8'));
  }
  return [];
};

// Маршрут авторизації
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const users = readUsers();
  
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const token = jwt.sign({ id: user.id }, SECRET_KEY, { expiresIn: '1h' }); // Додаємо термін дії токену
    return res.json({ token });
  } else {
    return res.status(401).send('Invalid credentials');
  }
});

// Мідлвар для перевірки токену
const authenticate = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Витягуємо токен без "Bearer"
  if (!token) {
    return res.status(403).send('Token is required');
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).send('Invalid token');
    }
    req.user = decoded;
    next();
  });
};

// Маршрут для додавання даних про здоров'я
app.post('/health-data', authenticate, (req, res) => {
  const { health_info } = req.body;
  const user_id = req.user.id;

  const healthData = readHealthData();
  healthData.push({ user_id, health_info });
  fs.writeFileSync(healthDataFile, JSON.stringify(healthData));

  res.status(200).send('Health data saved');
});

// Маршрут для отримання даних про здоров'я
app.get('/health-data', authenticate, (req, res) => {
  const user_id = req.user.id;
  const healthData = readHealthData();
  const userHealthData = healthData.filter(data => data.user_id === user_id);

  res.json(userHealthData);
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
