const express = require('express');
const { nanoid } = require('nanoid');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const PRODUCTS_FILE = path.join(DATA_DIR, 'products.json');

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
    const stock = Number.isFinite(Number(product.stock))
        ? Number(product.stock)
        : (product.inStock ? 1 : 0);

    return {
        id: String(product.id),
        name: String(product.name || '').trim(),
        price: Number(product.price),
        category: String(product.category || 'Разное'),
        description: String(product.description || ''),
        stock: Math.max(0, stock)
    };
}

function saveProducts(nextProducts) {
    fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(nextProducts, null, 2), 'utf-8');
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

// начальные данные (из файла, чтобы переживать перезапуск сервера)
let products = loadProducts();

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
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         id:
 *           type: string
 *           description: Уникальный ID товара
 *           example: abc123
 *         name:
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
 *         - name
 *         - category
 *         - description
 *         - price
 *         - stock
 *       properties:
 *         name:
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
 *               name: Шампунь Фаа
 *               category: Очищение
 *               description: Мягкий шампунь для ежедневного ухода.
 *               price: 999
 *               stock: 24
 */

// API ENDPOINTS

// 1. GET /api/products - получить все товары
/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Получить список всех товаров
 *     tags: [Products]
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
 *                 name: Шампунь Фаа
 *                 category: Очищение
 *                 description: Мягкий шампунь для ежедневного ухода.
 *                 price: 999
 *                 stock: 24
 *               - id: bcd234
 *                 name: Крем Day Soft
 *                 category: Увлажнение
 *                 description: Легкий дневной крем для нормальной кожи.
 *                 price: 1290
 *                 stock: 20
 */
app.get('/api/products', (req, res) => {
    res.json(products);
});

// 2. GET /api/products/:id - получить товар по ID
/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Получить товар по ID
 *     tags: [Products]
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
 *                 name: Шампунь Фаа
 *                 category: Очищение
 *                 description: Мягкий шампунь для ежедневного ухода.
 *                 price: 999
 *                 stock: 24
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
app.get('/api/products/:id', (req, res) => {
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
 *                 name: Новый товар
 *                 category: Разное
 *                 description: Описание нового товара
 *                 price: 1000
 *                 stock: 5
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 */
app.post('/api/products', (req, res) => {
    if (!req.body.name || !req.body.price) {
        return res.status(400).json({
            success: false,
            error: 'Укажите название и цену товара'
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
        name: String(req.body.name).trim(),
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
app.put('/api/products/:id', (req, res) => {
    const product = findProductOr404(req.params.id, res);
    if (!product) return;

    const index = products.findIndex(p => p.id === req.params.id);
    const nextStock = req.body.stock === undefined ? products[index].stock : Number(req.body.stock);
    if (!Number.isInteger(nextStock) || nextStock < 0) {
        return res.status(400).json({ success: false, error: 'Количество на складе должно быть целым числом >= 0' });
    }
    
    // обновляются только переданные поля
    products[index] = {
        ...products[index],
        ...req.body,
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
app.patch('/api/products/:id', (req, res) => {
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
 *                 name: Шампунь Фаа
 *                 category: Очищение
 *                 description: Мягкий шампунь для ежедневного ухода.
 *                 price: 999
 *                 stock: 24
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
app.delete('/api/products/:id', (req, res) => {
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