// import swaggerJsdoc from 'swagger-jsdoc'
// import path from 'path'
// 
// console.log('Looking for routes in:', path.join(__dirname, 'routes/v1/*.ts'))
// 
// const options = {
//   definition: {
//     openapi: '3.0.0',
//     info: {
//       title: 'My API',
//       version: '1.0.0',
//     },
//     components: {
//       securitySchemes: {
//         bearerAuth: {
//           type: 'http',
//           scheme: 'bearer',
//           bearerFormat: 'JWT',
//         }
//       }
//     }
//   },
//   apis: ['./src/routes/v1/*.ts'],  // points to your route files
// }
// 
// export const swaggerSpec = swaggerJsdoc(options)
// console.log('Paths found:', Object.keys((swaggerSpec as any).paths || {}))


// docs.ts
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'E-Commerce API',
    version: '1.0.0',
    description: 'API documentation for the e-commerce platform',
  },
  servers: [
    {
      url: 'http://localhost:3000/api/v1',
      description: 'Development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['user', 'admin'] },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          name: { type: 'string' },
          description: { type: 'string' },
          price: { type: 'number' },
          stock: { type: 'integer' },
          image_url: { type: 'string' },
        },
      },
      CartItem: {
        type: 'object',
        properties: {
          product_id: { type: 'integer' },
          quantity: { type: 'integer' },
        },
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          total_amount: { type: 'number' },
          status: { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] },
          payment_status: { type: 'string', enum: ['pending', 'paid', 'failed'] },
          order_date: { type: 'string', format: 'date-time' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email', example: 'kshitij@gmail.com' },
                  password: { type: 'string', format: 'password', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User registered successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'User registered successfully' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          400: {
            description: 'Validation error or email already exists',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login user',
        tags: ['Authentication'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'kshitij@gmail.com' },
                  password: { type: 'string', example: '123456' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Login successful' },
                    token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIs...' },
                    user: { $ref: '#/components/schemas/User' },
                  },
                },
              },
            },
          },
          401: {
            description: 'Invalid credentials',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/products': {
      get: {
        summary: 'Get all products',
        tags: ['Products'],
        parameters: [
          { in: 'query', name: 'category', schema: { type: 'string' }, description: 'Filter by category' },
          { in: 'query', name: 'minPrice', schema: { type: 'number' }, description: 'Minimum price' },
          { in: 'query', name: 'maxPrice', schema: { type: 'number' }, description: 'Maximum price' },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 }, description: 'Page number' },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 }, description: 'Items per page' },
        ],
        responses: {
          200: {
            description: 'List of products',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    products: { type: 'array', items: { $ref: '#/components/schemas/Product' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                    totalPages: { type: 'integer' },
                  },
                },
              },
            },
          },
        },
      },
      post: {
        summary: 'Create a new product (Admin only)',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'price', 'stock'],
                properties: {
                  name: { type: 'string', example: 'Laptop' },
                  description: { type: 'string', example: 'Good laptop' },
                  price: { type: 'number', example: 50000 },
                  stock: { type: 'integer', example: 10 },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'Product created successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Product created successfully' },
                    product: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin only' },
        },
      },
    },
    '/products/{id}': {
      get: {
        summary: 'Get a single product by ID',
        tags: ['Products'],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Product ID' },
        ],
        responses: {
          200: {
            description: 'Product details',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Product' },
              },
            },
          },
          404: {
            description: 'Product not found',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update a product (Admin only)',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Product ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string', example: 'Laptop' },
                  description: { type: 'string', example: 'Updated' },
                  price: { type: 'number', example: 45000 },
                  stock: { type: 'integer', example: 8 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Product updated successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Product updated successfully' },
                    product: { $ref: '#/components/schemas/Product' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin only' },
          404: { description: 'Product not found' },
        },
      },
      delete: {
        summary: 'Delete a product (Admin only)',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Product ID' },
        ],
        responses: {
          200: {
            description: 'Product deleted successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Product deleted successfully' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin only' },
          404: { description: 'Product not found' },
        },
      },
    },
    '/products/{id}/image': {
      post: {
        summary: 'Upload product image (Admin only)',
        tags: ['Products'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Product ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  image: {
                    type: 'string',
                    format: 'binary',
                    description: 'Image file (jpg, png, webp)',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Image uploaded successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Image uploaded successfully' },
                    image_url: { type: 'string', example: '/uploads/products/1/image.jpg' },
                  },
                },
              },
            },
          },
          400: { description: 'No file uploaded or invalid file type' },
          401: { description: 'Unauthorized' },
          404: { description: 'Product not found' },
        },
      },
    },
    '/cart': {
      get: {
        summary: 'Get user cart',
        tags: ['Cart'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Cart details',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    cart: {
                      type: 'object',
                      properties: {
                        id: { type: 'integer' },
                        items: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              product_id: { type: 'integer' },
                              name: { type: 'string' },
                              quantity: { type: 'integer' },
                              price: { type: 'number' },
                              subtotal: { type: 'number' },
                            },
                          },
                        },
                        total: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Add item to cart',
        tags: ['Cart'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['product_id', 'quantity'],
                properties: {
                  product_id: { type: 'integer', example: 1 },
                  quantity: { type: 'integer', minimum: 1, example: 2 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Item added to cart',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Item added to cart' },
                    cart_item: {
                      type: 'object',
                      properties: {
                        product_id: { type: 'integer' },
                        quantity: { type: 'integer' },
                        subtotal: { type: 'number' },
                      },
                    },
                  },
                },
              },
            },
          },
          400: { description: 'Insufficient stock or validation error' },
          401: { description: 'Unauthorized' },
          404: { description: 'Product not found' },
        },
      },
    },
    '/cart/{item_id}': {
      delete: {
        summary: 'Remove item from cart',
        tags: ['Cart'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'item_id', required: true, schema: { type: 'integer' }, description: 'Cart item ID' },
        ],
        responses: {
          200: {
            description: 'Item removed from cart',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Item removed from cart' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          404: { description: 'Cart item not found' },
        },
      },
    },
    '/orders': {
      post: {
        summary: 'Place order from cart',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        responses: {
          201: {
            description: 'Order placed successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Order placed successfully' },
                    order: { $ref: '#/components/schemas/Order' },
                  },
                },
              },
            },
          },
          400: { description: 'Cart is empty or insufficient stock' },
          401: { description: 'Unauthorized' },
        },
      },
      get: {
        summary: 'Get all user orders',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'status', schema: { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] }, description: 'Filter by status' },
          { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
          { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          200: {
            description: 'List of orders',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    orders: { type: 'array', items: { $ref: '#/components/schemas/Order' } },
                    total: { type: 'integer' },
                    page: { type: 'integer' },
                  },
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/orders/{id}': {
      get: {
        summary: 'Get single order with items',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Order ID' },
        ],
        responses: {
          200: {
            description: 'Order details with items',
            content: {
              'application/json': {
                schema: {
                  allOf: [
                    { $ref: '#/components/schemas/Order' },
                    {
                      type: 'object',
                      properties: {
                        items: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              product_id: { type: 'integer' },
                              name: { type: 'string' },
                              quantity: { type: 'integer' },
                              price: { type: 'number' },
                              subtotal: { type: 'number' },
                            },
                          },
                        },
                      },
                    },
                  ],
                },
              },
            },
          },
          401: { description: 'Unauthorized' },
          404: { description: 'Order not found' },
        },
      },
    },
    '/orders/{id}/status': {
      put: {
        summary: 'Update order status (Admin only)',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Order ID' },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], example: 'confirmed' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Order status updated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Order status updated' },
                    order: { $ref: '#/components/schemas/Order' },
                  },
                },
              },
            },
          },
          400: { description: 'Invalid status' },
          401: { description: 'Unauthorized' },
          403: { description: 'Forbidden - Admin only' },
          404: { description: 'Order not found' },
        },
      },
    },
    '/orders/{id}/cancel': {
      put: {
        summary: 'Cancel order',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'id', required: true, schema: { type: 'integer' }, description: 'Order ID' },
        ],
        responses: {
          200: {
            description: 'Order cancelled successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Order cancelled successfully' },
                    order: { $ref: '#/components/schemas/Order' },
                  },
                },
              },
            },
          },
          400: { description: 'Order cannot be cancelled (already shipped/delivered)' },
          401: { description: 'Unauthorized' },
          404: { description: 'Order not found' },
        },
      },
    },
    '/payments/create/{order_id}': {
      post: {
        summary: 'Create Razorpay order',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'order_id', required: true, schema: { type: 'integer' }, description: 'Order ID to pay for' },
        ],
        responses: {
          200: {
            description: 'Razorpay order created',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    razorpay_order_id: { type: 'string', example: 'order_xxxx' },
                    amount: { type: 'number', example: 100000 },
                    currency: { type: 'string', example: 'INR' },
                    key: { type: 'string', example: 'rzp_test_xxxx' },
                  },
                },
              },
            },
          },
          400: { description: 'Order already paid or invalid' },
          401: { description: 'Unauthorized' },
          404: { description: 'Order not found' },
        },
      },
    },
    '/payments/verify': {
      post: {
        summary: 'Verify Razorpay payment',
        tags: ['Payments'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'order_id'],
                properties: {
                  razorpay_order_id: { type: 'string', example: 'order_xxxx' },
                  razorpay_payment_id: { type: 'string', example: 'pay_xxxx' },
                  razorpay_signature: { type: 'string', example: 'xxxx' },
                  order_id: { type: 'integer', example: 1 },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Payment verified successfully',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    message: { type: 'string', example: 'Payment verified successfully' },
                    order: { $ref: '#/components/schemas/Order' },
                  },
                },
              },
            },
          },
          400: { description: 'Payment verification failed' },
          401: { description: 'Unauthorized' },
          404: { description: 'Order not found' },
        },
      },
    },
  },
};
