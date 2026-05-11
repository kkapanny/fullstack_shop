const express = require('express');
const { nanoid } = require('nanoid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const PORT = 3000;
const ACCESS_SECRET = 'access_secret';
const REFRESH_SECRET = 'refresh_secret';
const ACCESS_EXPIRES_IN = '15m';
const REFRESH_EXPIRES_IN = '7d';
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const refreshTokens = new Set();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.static('public'));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Body:', req.body);
    }
    next();
});

function findProductOr404(id, res) {
    const product = products.find(p => p.id == id);
    if (!product) {
        res.status(404).json({ error: "Product not found" });
        return null;
    }
    return product;
}

function findUserByEmail(email) {
    const normalizedEmail = String(email || '').toLowerCase().trim();
    return users.find((u) => u.email.toLowerCase() === normalizedEmail);
}

function sanitizeUser(user) {
    return {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_blocked: Boolean(user.is_blocked)
    };
}

function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const rawHeaderToken = req.headers['x-access-token'];
    const [scheme, bearerToken] = authHeader.split(' ');
    const token = (scheme === 'Bearer' && bearerToken) ? bearerToken : rawHeaderToken;
    if (!token) {
        return res.status(401).json({ error: 'Missing token. Use Authorization: Bearer <token> or x-access-token header' });
    }
    try {
        const payload = jwt.verify(token, ACCESS_SECRET);
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

function roleMiddleware(allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        next();
    };
}

function generateAccessToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role
        },
        ACCESS_SECRET,
        { expiresIn: ACCESS_EXPIRES_IN }
    );
}

function generateRefreshToken(user) {
    return jwt.sign(
        {
            sub: user.id,
            email: user.email,
            role: user.role
        },
        REFRESH_SECRET,
        { expiresIn: REFRESH_EXPIRES_IN }
    );
}

function getDefaultProducts() {
    return [
        {
            id: 'default01',
            name: 'Шампунь Фаа',
            price: 999,
            category: 'Разное',
            description: 'Шампунь',
            stock: 10
        }
    ];
}

function normalizeProduct(product) {
    const title = String(product.title || product.name || '').trim();
    const stock = Number.isFinite(Number(product.stock))
        ? Number(product.stock)
        : (product.inStock ? 1 : 0);

    return {
        id: String(product.id),
        title,
        // name оставляем для обратной совместимости со старым UI
        name: title,
        price: Number(product.price),
        category: String(product.category || 'Разное'),
        description: String(product.description || ''),
        stock: Math.max(0, stock)
    };
}

function normalizeUser(user) {
    const normalizedRole = user.role === 'user' ? 'buyer' : user.role;
    return {
        id: String(user.id),
        email: String(user.email || '').toLowerCase(),
        first_name: String(user.first_name || ''),
        last_name: String(user.last_name || ''),
        password: String(user.password || ''),
        role: ['buyer', 'seller', 'admin'].includes(normalizedRole) ? normalizedRole : 'buyer',
        is_blocked: Boolean(user.is_blocked)
    };
}

function saveProducts(nextProducts) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(nextProducts, null, 2), 'utf-8');
}

function saveUsers(nextUsers) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(nextUsers, null, 2), 'utf-8');
}

function loadProducts() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(PRODUCTS_FILE)) {
        const defaultProducts = getDefaultProducts();
        saveProducts(defaultProducts);
        return defaultProducts;
    }

    try {
        const raw = fs.readFileSync(PRODUCTS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return getDefaultProducts();
        return parsed.map(normalizeProduct);
    } catch (error) {
        console.error('Ошибка чтения products.json, используется дефолтный список:', error.message);
        const defaultProducts = getDefaultProducts();
        saveProducts(defaultProducts);
        return defaultProducts;
    }
}

function loadUsers() {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(USERS_FILE)) {
        saveUsers([]);
        return [];
    }

    try {
        const raw = fs.readFileSync(USERS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(normalizeUser);
    } catch (error) {
        console.error('Ошибка чтения users.json, используется пустой список:', error.message);
        saveUsers([]);
        return [];
    }
}

let products = loadProducts();
let users = loadUsers();

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Aevum Products API',
            version: '1.0.0',
            description: 'REST API интернет-магазина с CRUD-операциями для товаров'
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Локальный сервер'
            }
        ]
    },
    apis: ['./server.js']
};
const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.get('/api-docs.json', (req, res) => {
    res.json(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - email
 *         - first_name
 *         - last_name
 *       properties:
 *         id:
 *           type: string
 *           example: usr123
 *         email:
 *           type: string
 *           format: email
 *           example: user@example.com
 *         first_name:
 *           type: string
 *           example: Анна
 *         last_name:
 *           type: string
 *           example: Иванова
 *     RegisterInput:
 *       type: object
 *       required:
 *         - email
 *         - first_name
 *         - last_name
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         password:
 *           type: string
 *           format: password
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *         password:
 *           type: string
 *           format: password
 *     Product:
 *       type: object
 *       required:
 *         - id
 *         - title
 *         - category
 *         - description
 *         - price
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный ID товара
 *           example: abc123
 *         title:
 *           type: string
 *           description: Название товара
 *           example: Шампунь Фаа
 *         category:
 *           type: string
 *           description: Категория товара
 *           example: Очищение
 *         description:
 *           type: string
 *           description: Описание товара
 *           example: Мягкий шампунь для ежедневного ухода.
 *         price:
 *           type: number
 *           description: Цена товара в рублях
 *           example: 999
 *         stock:
 *           type: integer
 *           description: Количество товара на складе
 *           example: 24
 *     ProductInput:
 *       type: object
 *       required:
 *         - title
 *         - category
 *         - description
 *         - price
 *       properties:
 *         title:
 *           type: string
 *         category:
 *           type: string
 *         description:
 *           type: string
 *         price:
 *           type: number
 *         stock:
 *           type: integer
 *   responses:
 *     NotFound:
 *       description: Сущность не найдена
 *       content:
 *         application/json:
 *           example:
 *             error: Product not found
 *     ValidationError:
 *       description: Ошибка валидации
 *       content:
 *         application/json:
 *           example:
 *             success: false
 *             error: Количество на складе должно быть целым числом >= 0
 *     ProductResult:
 *       description: Успешный ответ с товаром
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               success:
 *                 type: boolean
 *               message:
 *                 type: string
 *               data:
 *                 $ref: '#/components/schemas/Product'
 *           example:
 *             success: true
 *             message: Товар обновлен
 *             data:
 *               id: abc123
 *               title: Шампунь Фаа
 *               category: Очищение
 *               description: Мягкий шампунь для ежедневного ухода.
 *               price: 999
 *               stock: 24
 */

// API ENDPOINTS

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Регистрация пользователя
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: Пользователь успешно создан
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       400:
 *         description: Некорректные данные
 *       409:
 *         description: Пользователь с таким email уже существует
 */
app.post('/api/auth/register', async (req, res) => {
    const { email, first_name, last_name, password, role } = req.body;
    if (!email || !first_name || !last_name || !password) {
        return res.status(400).json({ error: 'email, first_name, last_name и password обязательны' });
    }
    if (findUserByEmail(email)) {
        return res.status(409).json({ error: 'Пользователь с таким email уже существует' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 10);
    const newUser = {
        id: nanoid(6),
        email: String(email).toLowerCase().trim(),
        first_name: String(first_name).trim(),
        last_name: String(last_name).trim(),
        password: hashedPassword,
        role: ['buyer', 'seller', 'admin'].includes(role) ? role : 'buyer',
        is_blocked: false
    };
    users.push(newUser);
    saveUsers(users);

    return res.status(201).json({
        id: newUser.id,
        email: newUser.email,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        role: newUser.role
    });
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Вход в систему
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Успешный вход
 *         content:
 *           application/json:
 *             example:
 *               accessToken: jwt-token-value
 *               user:
 *                 id: usr123
 *                 email: user@example.com
 *                 first_name: Анна
 *                 last_name: Иванова
 *       400:
 *         description: Некорректные данные
 *       401:
 *         description: Неверный пароль
 *       404:
 *         description: Пользователь не найден
 */
app.post('/api/auth/login', async (req, res) => {
    const email = String(req.body?.email || '').toLowerCase().trim();
    const password = String(req.body?.password || '');
    if (!email || !password) {
        return res.status(400).json({ error: 'email и password обязательны' });
    }
    const user = findUserByEmail(email);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    if (user.is_blocked) {
        return res.status(403).json({ error: 'Пользователь заблокирован' });
    }
    const isAuthenticated = await bcrypt.compare(String(password), user.password);
    if (!isAuthenticated) {
        return res.status(401).json({ error: 'Неверный пароль' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    refreshTokens.add(refreshToken);

    return res.status(200).json({
        accessToken,
        refreshToken,
        user: sanitizeUser(user)
    });
});

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Обновить access и refresh токены
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: x-refresh-token
 *         required: true
 *         schema:
 *           type: string
 *         description: Refresh токен
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *           example:
 *             refreshToken: refresh-token-value
 *     responses:
 *       200:
 *         description: Новая пара токенов
 *         content:
 *           application/json:
 *             example:
 *               accessToken: new-access-token
 *               refreshToken: new-refresh-token
 *       400:
 *         description: Refresh токен не передан
 *       401:
 *         description: Невалидный или просроченный refresh токен
 */
app.post('/api/auth/refresh', (req, res) => {
    const headerToken = req.headers['x-refresh-token'];
    const bodyToken = req.body?.refreshToken;
    const refreshToken = headerToken || bodyToken;
    if (!refreshToken) {
        return res.status(400).json({ error: 'refreshToken is required in headers or body' });
    }
    if (!refreshTokens.has(refreshToken)) {
        return res.status(401).json({ error: 'Invalid refresh token' });
    }
    try {
        const payload = jwt.verify(String(refreshToken), REFRESH_SECRET);
        const user = users.find((u) => u.id === payload.sub);
        if (!user || user.is_blocked) {
            return res.status(401).json({ error: 'User not found or blocked' });
        }
        refreshTokens.delete(String(refreshToken));
        const newAccessToken = generateAccessToken(user);
        const newRefreshToken = generateRefreshToken(user);
        refreshTokens.add(newRefreshToken);
        return res.status(200).json({
            accessToken: newAccessToken,
            refreshToken: newRefreshToken
        });
    } catch (error) {
        return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Получить текущего пользователя по JWT
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Текущий пользователь
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Отсутствует или невалидный токен
 *       404:
 *         description: Пользователь не найден
 */
app.get('/api/auth/me', authMiddleware, (req, res) => {
    const userId = req.user.sub;
    const user = users.find((u) => u.id === userId);
    if (!user) {
        return res.status(404).json({ error: 'Пользователь не найден' });
    }
    return res.json(sanitizeUser(user));
});

app.get('/api/users', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    return res.json(users.map(sanitizeUser));
});

app.get('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const user = users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json(sanitizeUser(user));
});

app.put('/api/users/:id', authMiddleware, roleMiddleware(['admin']), async (req, res) => {
    const index = users.findIndex((u) => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });

    const candidateEmail = req.body.email ? String(req.body.email).toLowerCase().trim() : users[index].email;
    const emailTaken = users.some((u) => u.id !== req.params.id && u.email === candidateEmail);
    if (emailTaken) return res.status(409).json({ error: 'Email already exists' });

    const nextUser = {
        ...users[index],
        email: candidateEmail,
        first_name: req.body.first_name !== undefined ? String(req.body.first_name).trim() : users[index].first_name,
        last_name: req.body.last_name !== undefined ? String(req.body.last_name).trim() : users[index].last_name,
        role: req.body.role && ['buyer', 'seller', 'admin'].includes(req.body.role) ? req.body.role : users[index].role,
        is_blocked: req.body.is_blocked !== undefined ? Boolean(req.body.is_blocked) : users[index].is_blocked
    };

    if (req.body.password) {
        nextUser.password = await bcrypt.hash(String(req.body.password), 10);
    }
    users[index] = nextUser;
    saveUsers(users);
    return res.json(sanitizeUser(nextUser));
});

app.delete('/api/users/:id', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const index = users.findIndex((u) => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    users[index].is_blocked = true;
    saveUsers(users);
    return res.json({ success: true, message: 'User blocked', data: sanitizeUser(users[index]) });
});

app.delete('/api/users/:id/permanent', authMiddleware, roleMiddleware(['admin']), (req, res) => {
    const index = users.findIndex((u) => u.id === req.params.id);
    if (index === -1) return res.status(404).json({ error: 'User not found' });
    const removed = users.splice(index, 1)[0];
    saveUsers(users);
    return res.json({ success: true, message: 'User deleted', data: sanitizeUser(removed) });
});

// 1. GET /api/products - получить все товары
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Список товаров
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 *             example:
 *               - id: abc123
 *                 title: Шампунь Фаа
 *                 category: Очищение
 *                 description: Мягкий шампунь для ежедневного ухода.
 *                 price: 999
 *                 stock: 24
 *               - id: bcd234
 *                 title: Крем Day Soft
 *                 category: Увлажнение
 *                 description: Легкий дневной крем для нормальной кожи.
 *                 price: 1290
 *                 stock: 20
 */
app.get('/api/products', authMiddleware, roleMiddleware(['buyer', 'seller', 'admin']), (req, res) => {
    res.json(products);
});

// 2. GET /api/products/:id - получить товар по ID
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID товара
 *     responses:
 *       200:
 *         description: Товар найден
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Product'
 *             example:
 *               success: true
 *               data:
 *                 id: abc123
 *                 title: Шампунь Фаа
 *                 category: Очищение
 *                 description: Мягкий шампунь для ежедневного ухода.
 *                 price: 999
 *                 stock: 24
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
app.get('/api/products/:id', authMiddleware, roleMiddleware(['buyer', 'seller', 'admin']), (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;
    res.json({
        success: true,
        data: product
    });
});

// 3. POST /api/products - создать новый товар
/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Создать новый товар
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       201:
 *         description: Товар успешно создан
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Товар успешно создан
 *               data:
 *                 id: abc123
 *                 title: Новый товар
 *                 category: Разное
 *                 description: Описание нового товара
 *                 price: 1000
 *                 stock: 5
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
app.post('/api/products', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const title = String(req.body.title || req.body.name || '').trim();
    if (!title || !req.body.price || !req.body.category || !req.body.description) {
        return res.status(400).json({
            success: false,
            error: 'Укажите title, category, description и price товара'
        });
    }

    const parsedPrice = Number(req.body.price);
    const parsedStock = req.body.stock === undefined ? 0 : Number(req.body.stock);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
        return res.status(400).json({ success: false, error: 'Цена должна быть больше 0' });
    }
    if (!Number.isInteger(parsedStock) || parsedStock < 0) {
        return res.status(400).json({ success: false, error: 'Количество на складе должно быть целым числом >= 0' });
    }

    const newProduct = {
        id: nanoid(6),
        title,
        name: title,
        price: parsedPrice,
        category: req.body.category || 'Разное',
        description: req.body.description || '',
        stock: parsedStock
    };

    products.push(newProduct);
    saveProducts(products);

    res.status(201).json({
        success: true,
        message: 'Товар успешно создан',
        data: newProduct
    });
});

// 4. PUT /api/products/:id - обновить товар
/**
 * @swagger
 * /api/products/{id}:
 *   put:
 *     summary: Полностью обновить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ProductResult'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
app.put('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;

    const index = products.findIndex(p => p.id === req.params.id);
    const nextTitle = String(req.body.title || req.body.name || products[index].title || '').trim();
    if (!nextTitle || !req.body.category || !req.body.description || req.body.price === undefined) {
        return res.status(400).json({ success: false, error: 'Для PUT нужны title, category, description, price' });
    }
    const nextStock = req.body.stock === undefined ? products[index].stock : Number(req.body.stock);
    if (!Number.isInteger(nextStock) || nextStock < 0) {
        return res.status(400).json({ success: false, error: 'Количество на складе должно быть целым числом >= 0' });
    }
    
    // обновляются только переданные поля
    products[index] = {
        ...products[index],
        ...req.body,
        title: nextTitle,
        name: nextTitle,
        stock: nextStock,
        id: req.params.id // ID остается
    };
    saveProducts(products);

    res.json({
        success: true,
        message: 'Товар обновлен',
        data: products[index]
    });
});

/**
 * @swagger
 * /api/products/{id}:
 *   patch:
 *     summary: Частично обновить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               stock:
 *                 type: integer
 *     responses:
 *       200:
 *         $ref: '#/components/responses/ProductResult'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
app.patch('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;

    if (
        req.body?.name === undefined &&
        req.body?.price === undefined &&
        req.body?.category === undefined &&
        req.body?.description === undefined &&
        req.body?.stock === undefined
    ) {
        return res.status(400).json({ success: false, error: 'Nothing to update' });
    }

    const index = products.findIndex(p => p.id === req.params.id);
    const updated = { ...products[index], ...req.body, id: req.params.id };
    if (updated.price !== undefined && (!Number.isFinite(Number(updated.price)) || Number(updated.price) <= 0)) {
        return res.status(400).json({ success: false, error: 'Цена должна быть больше 0' });
    }
    if (updated.stock !== undefined && (!Number.isInteger(Number(updated.stock)) || Number(updated.stock) < 0)) {
        return res.status(400).json({ success: false, error: 'Количество на складе должно быть целым числом >= 0' });
    }

    products[index] = normalizeProduct(updated);
    saveProducts(products);
    res.json({
        success: true,
        message: 'Товар обновлен',
        data: products[index]
    });
});

// 5. DELETE /api/products/:id - удалить товар
/**
 * @swagger
 * /api/products/{id}:
 *   delete:
 *     summary: Удалить товар по ID
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Товар удален
 *         content:
 *           application/json:
 *             example:
 *               success: true
 *               message: Товар удален
 *               data:
 *                 id: abc123
 *                 title: Шампунь Фаа
 *                 category: Очищение
 *                 description: Мягкий шампунь для ежедневного ухода.
 *                 price: 999
 *                 stock: 24
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
app.delete('/api/products/:id', authMiddleware, roleMiddleware(['seller', 'admin']), (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;

    const index = products.findIndex(p => p.id === req.params.id);
    const deletedProduct = products.splice(index, 1)[0];
    saveProducts(products);

    res.json({
        success: true,
        message: 'Товар удален',
        data: deletedProduct
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 404
app.use((req, res) => {
    res.status(404).json({ error: "Not found" });
});

// global errors
app.use((err, req, res, next) => {
    console.error("Unhandled error:", err);
    res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
    console.log('Сервер запущен: http://localhost:' + PORT);
    console.log('Swagger UI: http://localhost:' + PORT + '/api-docs');
});