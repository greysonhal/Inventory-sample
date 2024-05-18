if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}


function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
      return next(); // User is authenticated, proceed to the next middleware
  }
  res.redirect('/'); // Redirect to the login page if the user is not authenticated
}
const path = require('path'); // Require the 'path' module
const mysql = require('mysql2');
const express = require('express');
const app = express();
const PORT = 3000;
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const initializePassport = require('./passport-config');
const passport = require('passport');
const flash = require('express-flash');
const session = require('express-session');
const ejs = require('ejs'); // Require the EJS module
const LocalStrategy = require('passport-local').Strategy;
// Parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('view engine', 'ejs'); // Set EJS as the template engine
app.set('views', path.join(__dirname, 'views')); // Specify the directory where your EJS templates are located

app.use(express.json());

// Create a database connection
const db = mysql.createConnection({
  host: 'localhost', // Replace with your database host
  user: 'root', // Replace with your database user
  password: 'root123', // Replace with your database password
  database: 'inventory_management_db', // Your database name
});

// Connect to the database
db.connect((err) => {
  if (err) {
      console.error('Database connection error:', err);
  } else {
      console.log('Connected to the database');

  // Start the server
app.listen(PORT, () => {
  console.log(`Client hit the server ${PORT}`);
});
  }
});

// Initialize Passport
initializePassport(
    passport,
    email => users.find(user => user.email === email),
    id => users.find(user => user.id === id)
);

// Configure session middleware
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));

// Set up flash messages
app.use(flash());

// Serve static files
app.use(express.static('./public'));
app.use(express.static('./public_admin'))



// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Define the users array
const users = [];

// Handle login form submission
app.post('/', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
      if (err) {
          return next(err);
      }
      if (!user) {
          req.flash('error', 'Invalid credentials'); // Set the flash message
          // Pass the messages object to the HTML template
          const messages = {
              error: req.flash('error')
          };
          res.json(messages);
          return; // Return here to prevent further execution
      }
      req.logIn(user, (loginErr) => {
          if (loginErr) {
              return next(loginErr);
          }
          return res.redirect('/dashboard');
      });
  })(req, res, next);
});

// Handle the registration form
app.post('/register', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        users.push({
            id: Date.now().toString(),
            email: req.body.email,
            password: hashedPassword,
        });
        console.log(users); // Display the registered users in the console
        res.redirect('/');
    } catch (e) {
        console.error(e);
        res.redirect('/register');
    }
});

// Serve the login page
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

// Serve the registration page
app.get('/register', (req, res) => {
    res.send('./public/register.html');
});

app.get('/dashboard', checkAuthenticated,async (req,res)=>{
  try {
   
    res.sendFile(__dirname + '/public_admin/index.html');
  } catch  {
    res.status(404).send(`<h1>404:Please Provide credentials</h1>`);
  }
  
})


app.get('/products', (req, res) => {
  // Fetch product names from the database
  const selectProductsQuery = 'SELECT product_name FROM products';
  db.query(selectProductsQuery, (err, products) => {
    if (err) {
      console.error('Error fetching products: ' + err);
      res.status(500).send('Error fetching products');
      return;
    }
    // Fetch category names from the database
    const selectCategoriesQuery = 'SELECT category_name FROM categories';
    db.query(selectCategoriesQuery, (err, categories) => {
      if (err) {
        console.error('Error fetching categories: ' + err);
        res.status(500).json({ error: 'Error fetching categories' });
        return;
      }
     
    // Render the 'Products.ejs' template and pass the product names
    res.render('Products', { products: products,categories: categories  });
  });
})});


  // Handle GET request to fetch categories
app.get('/categories', (req, res) => {
  // Replace 'categories' with your actual table name
  const selectQuery = 'SELECT * FROM categories';

  db.query(selectQuery, (err, results) => {
    if (err) {
      console.error('Error fetching categories: ' + err);
      res.status(500).json({ error: 'Error fetching categories' });
      return;
    }
    // Pass the categories data to the EJS template and render it
    res.render('Categories', { categories: results });
  });
});

// Function to fetch stock summary data
function renderStocksPage(res) {
  getStockSummary((err, stockSummary) => {
    if (err) {
      console.error('Error fetching stock summary:', err);
      res.status(500).send('Error fetching stock summary');
    } else {
      // Fetch the categories and products and pass them to the EJS template
      const selectCategoriesQuery = 'SELECT * FROM categories';
      db.query(selectCategoriesQuery, (err, categories) => {
        if (err) {
          console.error('Error fetching categories:', err);
          res.status(500).send('Error fetching categories');
        } else {
          // Fetch the products and pass them to the EJS template
          const selectProductsQuery = 'SELECT * FROM products';
          db.query(selectProductsQuery, (err, products) => {
            if (err) {
              console.error('Error fetching products:', err);
              res.status(500).send('Error fetching products');
            } else {
              // Render the Stocks page and pass the stockSummary, categories, and products data to it
              res.render('stocks', { stockSummary: stockSummary, categories: categories, products: products });
            }
          });
        }
      });
    }
  });
}

app.get('/stocks', checkAuthenticated, (req, res) => {
  getStockSummary((err, stockSummary) => {
    if (err) {
      console.error('Error fetching stock summary:', err);
      res.status(500).send('Error fetching stock summary');
    } else {
      // Fetch the categories and products and pass them to the EJS template
      const selectCategoriesQuery = 'SELECT * FROM categories';
      db.query(selectCategoriesQuery, (err, categories) => {
        if (err) {
          console.error('Error fetching categories:', err);
          res.status(500).send('Error fetching categories');
        } else {
          // Fetch the products and pass them to the EJS template
          const selectProductsQuery = 'SELECT * FROM products';
          db.query(selectProductsQuery, (err, products) => {
            if (err) {
              console.error('Error fetching products:', err);
              res.status(500).send('Error fetching products');
            } else {
              // Render the Stocks page and pass the stockSummary, categories, and products data to it
              res.render('stocks', { stockSummary: stockSummary, categories: categories, products: products });
            }
          });
        }
      });
    }
  });
});


  


  app.get('/orders', (req, res) => {
    // Handle the route logic for /products
    res.sendFile(__dirname + '/public_admin/Orders.html')
  });

  app.get('/Bills', (req, res) => {
    // Handle the route logic for /products
    res.sendFile(__dirname + '/public_admin/Bill.html')
  });
  // ...

// Handle the POST request to add a new product
app.post('/products', (req, res) => {
  const productName = req.body.productName;
  const category = req.body.category;

  // Insert the product name and category into the database
  const insertQuery = 'INSERT INTO products (product_name, category_name) VALUES (?, ?)';

  db.query(insertQuery, [productName, category], (err, results) => {
    if (err) {
      console.error('Error inserting into the database: ' + err);
      res.status(500).send('Error inserting into the database');
      return;
    }

    console.log('Inserted into the database: ' + productName);
    const insertedProductId = results.insertId;

    // Send the product details, including the product ID, as a response
    res.status(200).json({ product_name: productName, product_id: insertedProductId });
  });
});



// Handle the DELETE request to remove a product from the database
app.delete('/products/:productName', (req, res) => {
  const productName = req.params.productName;
  const deleteQuery = 'DELETE FROM products WHERE product_name = ?';

  db.query(deleteQuery, [productName], (err, results) => {
    if (err) {
      console.error('Error deleting from the database: ' + err);
      res.status(500).json({ error: 'Error deleting from the database' });
      return;
    }
    console.log('Deleted from the database: ' + productName);

    // Send a JSON response indicating success
    res.status(200).json({ message: 'Product deleted from the database', category_name: 'CategoryName' });
  });
});

// Handle POST request to add a category
app.post("/categories", (req, res) => {
  const categoryName = req.body.categoryName;

  // Insert the category name into the categories table in the database
  const insertQuery = 'INSERT INTO categories (category_name) VALUES (?)';
  db.query(insertQuery, [categoryName], (err, results) => {
    if (err) {
      console.error('Error inserting into the database: ' + err);
      res.status(500).json({ error: 'Error inserting into the database' });
      return;
    }
    console.log('Inserted into the database: ' + categoryName);
    res.status(200).json({ message: 'Category added to the database' });
  });
});

// Handle DELETE request to remove a category
app.delete("/categories/:categoryName", (req, res) => {
  const categoryName = req.params.categoryName;

  // Delete the category from the categories table in the database
  const deleteQuery = 'DELETE FROM categories WHERE category_name = ?';
  db.query(deleteQuery, [categoryName], (err, results) => {
    if (err) {
      console.error('Error deleting from the database: ' + err);
      res.status(500).json({ error: 'Error deleting from the database' });
      return;
    }
    console.log('Deleted from the database: ' + categoryName);
    res.status(200).json({ message: 'Category deleted from the database' });
  });
});

// Function to fetch stock summary data
function getStockSummary(callback) {
  const selectStockSummaryQuery = 'SELECT item_id, category_name, product_name, amount, date_entered, time_entered FROM stocks';
  db.query(selectStockSummaryQuery, (err, stockSummary) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, stockSummary);
    }
  });
}



// Handle POST request to save stock data
app.post('/stocks', (req, res) => {
  const { itemID, category, product, amount } = req.body;

  // Query the categories table to get the category name based on the category ID
  const getCategoryNameQuery = 'SELECT category_name FROM categories WHERE category_id = ?';
  db.query(getCategoryNameQuery, [category], (err, categoryResults) => {
    if (err) {
      console.error('Error fetching category name: ' + err);
      res.status(500).json({ error: 'Error fetching category name' });
      return;
    }

    // Query the products table to get the product name based on the product ID
    const getProductNameQuery = 'SELECT product_name FROM products WHERE product_id = ?';
    db.query(getProductNameQuery, [product], (err, productResults) => {
      if (err) {
        console.error('Error fetching product name: ' + err);
        res.status(500).json({ error: 'Error fetching product name' });
        return;
      }

      // Insert the stock data into the stocks table along with category and product names
      const insertQuery = 'INSERT INTO stocks (item_id, category_name, product_name, amount, date_entered, time_entered) VALUES (?, ?, ?, ?, CURDATE(), CURTIME())';
      db.query(insertQuery, [itemID, categoryResults[0].category_name, productResults[0].product_name, amount], (err, results) => {
        if (err) {
          console.error('Error inserting into the database: ' + err);
          res.status(500).json({ error: 'Error inserting into the database' });
          return;
        }
        console.log('Inserted into the database: itemID=' + itemID + ', category=' + categoryResults[0].category_name + ', product=' + productResults[0].product_name + ', amount=' + amount);
        res.status(200).json({ message: 'Stock data added to the database' });
      });
    });
  });
});

// Handle POST request to fetch product and category names based on IDs
app.post('/getNamesForStock', (req, res) => {
  const { categoryID, productID } = req.body;

  // Query the categories table to get the category name based on the category ID
  const getCategoryNameQuery = 'SELECT category_name FROM categories WHERE category_id = ?';
  db.query(getCategoryNameQuery, [categoryID], (err, categoryResults) => {
    if (err) {
      console.error('Error fetching category name: ' + err);
      res.status(500).json({ error: 'Error fetching category name' });
      return;
    }

    // Query the products table to get the product name based on the product ID
    const getProductNameQuery = 'SELECT product_name FROM products WHERE product_id = ?';
    db.query(getProductNameQuery, [productID], (err, productResults) => {
      if (err) {
        console.error('Error fetching product name: ' + err);
        res.status(500).json({ error: 'Error fetching product name' });
        return;
      }

      // Return the category and product names
      res.status(200).json({
        category_name: categoryResults[0].category_name,
        product_name: productResults[0].product_name,
      });
    });
  });
});


// Handle GET request to fetch categories
app.get('/categories', (req, res) => {
  // Replace 'categories' with your actual table name
  const selectQuery = 'SELECT * FROM categories';

  db.query(selectQuery, (err, results) => {
    if (err) {
      console.error('Error fetching categories: ' + err);
      res.status(500).json({ error: 'Error fetching categories' });
      return;
    }
    res.status(200).json(results);
  });
});

app.get('/products', (req, res) => {
  const selectProductsQuery = 'SELECT product_id, product_name FROM products';
  db.query(selectProductsQuery, (err, products) => {
    if (err) {
      console.error('Error fetching products: ' + err);
      res.status(500).send('Error fetching products');
      return;
    }

    const selectCategoriesQuery = 'SELECT category_name FROM categories';
    db.query(selectCategoriesQuery, (err, categories) => {
      if (err) {
        console.error('Error fetching categories: ' + err);
        res.status(500).json({ error: 'Error fetching categories' });
        return;
      }

      res.render('Products', { products: products, categories: categories });
    });
  });
});



app.get('/home',(req,res)=>{
  res.sendFile(__dirname + '/public/index.html');
})

// Handle PUT request to update product name
app.put('/products/:productId', (req, res) => {
  const productId = req.params.productId;
  const newProductName = req.body.newProductName;

  // Check if newProductName is undefined, null, or an empty string
  if (newProductName === undefined || newProductName === null || newProductName.trim() === '') {
    res.status(400).json({ error: 'New product name is missing or invalid' });
    return;
  }

  // Update the product name in the products table
  const updateQuery = 'UPDATE products SET product_name = ? WHERE product_id = ?';

  db.query(updateQuery, [newProductName, productId], (err, results) => {
    if (err) {
      console.error('Error updating product name: ' + err);
      res.status(500).json({ error: 'Error updating product name' });
      return;
    }

    console.log('Updated product name with ID ' + productId + ' to ' + newProductName);
    res.status(200).json({ message: 'Product name updated in the database', category_name: 'CategoryName' });
  });
});




