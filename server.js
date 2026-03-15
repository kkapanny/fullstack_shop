const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    if (req.method === 'POST' || req.method === 'PUT') {
        console.log('Body:', req.body);
    }
    next();
});

// начальные данные
let products = [
    { id: 1, name: 'Шампунь Фаа', price: 999, category: 'Разное', description: 'Шампунь', inStock: true },
];

// API ENDPOINTS

// 1. GET /api/products - получить все товары
app.get('/api/products', (req, res) => {
    res.json({
        success: true,
        count: products.length,
        data: products
    });
});

// 2. GET /api/products/:id - получить товар по ID
app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    
    if (!product) {
        return res.status(404).json({
            success: false,
            error: 'Товар не найден'
        });
    }
    
    res.json({
        success: true,
        data: product
    });
});

// 3. POST /api/products - создать новый товар
app.post('/api/products', (req, res) => {
    // Валидация
    if (!req.body.name || !req.body.price) {
        return res.status(400).json({
            success: false,
            error: 'Укажите название и цену товара'
        });
    }
    
    const newProduct = {
        id: products.length > 0 ? Math.max(...products.map(p => p.id)) + 1 : 1,
        name: req.body.name,
        price: parseFloat(req.body.price),
        category: req.body.category || 'Разное',
        description: req.body.description || '',
        inStock: req.body.inStock !== undefined ? req.body.inStock : true
    };
    
    products.push(newProduct);
    
    res.status(201).json({
        success: true,
        message: 'Товар успешно создан',
        data: newProduct
    });
});

// 4. PUT /api/products/:id - обновить товар
app.put('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: 'Товар не найден'
        });
    }
    
    // Обновляем только переданные поля
    products[index] = {
        ...products[index],
        ...req.body,
        id: id // ID не меняем
    };
    
    res.json({
        success: true,
        message: 'Товар обновлен',
        data: products[index]
    });
});

// 5. DELETE /api/products/:id - удалить товар
app.delete('/api/products/:id', (req, res) => {
    const id = parseInt(req.params.id);
    const index = products.findIndex(p => p.id === id);
    
    if (index === -1) {
        return res.status(404).json({
            success: false,
            error: 'Товар не найден'
        });
    }
    
    const deletedProduct = products.splice(index, 1)[0];
    
    res.json({
        success: true,
        message: 'Товар удален',
        data: deletedProduct
    });
});


app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log('Сервер запущен: http://localhost:' + PORT);
});