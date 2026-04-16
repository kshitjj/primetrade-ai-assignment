import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

interface Product {
  id: number
  name: string
  description: string
  price: number
  stock: number
}

export default function Dashboard() {
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'products' | 'cart'>('products')
  const [showForm, setShowForm] = useState(false)
  const [editProduct, setEditProduct] = useState<Product | null>(null)
  const [form, setForm] = useState({ name: '', description: '', price: '', stock: '' })
  const navigate = useNavigate()

  const token = localStorage.getItem('token')
  const role = token ? JSON.parse(atob(token.split('.')[1])).role : null

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const res = await api.get('/products')
      setProducts(res.data)
    } catch {
      setError('Failed to fetch products')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editProduct) {
        await api.put(`/products/${editProduct.id}`, {
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
        })
      } else {
        await api.post('/products', {
          ...form,
          price: Number(form.price),
          stock: Number(form.stock),
        })
      }
      setShowForm(false)
      setEditProduct(null)
      setForm({ name: '', description: '', price: '', stock: '' })
      fetchProducts()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong')
    }
  }

  const handleEdit = (product: Product) => {
    setEditProduct(product)
    setForm({
      name: product.name,
      description: product.description,
      price: String(product.price),
      stock: String(product.stock),
    })
    setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this product?')) return
    try {
      await api.delete(`/products/${id}`)
      fetchProducts()
    } catch {
      setError('Failed to delete product')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-white border-b px-6 py-4 flex justify-between items-center">
        <div className="flex gap-4">
          <button
            onClick={() => setTab('products')}
            className={`text-sm font-medium ${tab === 'products' ? 'text-black' : 'text-gray-400'}`}
          >
            Products
          </button>
          <button
            onClick={() => setTab('cart')}
            className={`text-sm font-medium ${tab === 'cart' ? 'text-black' : 'text-gray-400'}`}
          >
            Cart
          </button>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-gray-400 uppercase">{role}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-500 hover:text-red-700"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {tab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Products</h2>
              {role === 'admin' && (
                <button
                  onClick={() => { setShowForm(true); setEditProduct(null); setForm({ name: '', description: '', price: '', stock: '' }) }}
                  className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition"
                >
                  + Add Product
                </button>
              )}
            </div>

            {/* Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl shadow mb-6 flex flex-col gap-3">
                <h3 className="font-medium">{editProduct ? 'Edit Product' : 'New Product'}</h3>
                <input
                  placeholder="Name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
                />
                <input
                  placeholder="Description"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  className="border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
                />
                <div className="flex gap-3">
                  <input
                    placeholder="Price"
                    type="number"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black w-full"
                  />
                  <input
                    placeholder="Stock"
                    type="number"
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: e.target.value })}
                    className="border rounded-lg px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black w-full"
                  />
                </div>
                <div className="flex gap-3">
                  <button type="submit" className="bg-black text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-800 transition">
                    {editProduct ? 'Update' : 'Create'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="text-sm text-gray-500 hover:text-gray-700">
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Products table */}
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Description</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Price</th>
                    <th className="text-left px-4 py-3 text-gray-500 font-medium">Stock</th>
                    {role === 'admin' && <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {products.map(p => (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{p.name}</td>
                      <td className="px-4 py-3 text-gray-500">{p.description}</td>
                      <td className="px-4 py-3">₹{p.price}</td>
                      <td className="px-4 py-3">{p.stock}</td>
                      {role === 'admin' && (
                        <td className="px-4 py-3 flex gap-3">
                          <button onClick={() => handleEdit(p)} className="text-blue-500 hover:text-blue-700">Edit</button>
                          <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:text-red-700">Delete</button>
                        </td>
                      )}
                    </tr>
                  ))}
                  {products.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-6 text-center text-gray-400">No products yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'cart' && <Cart />}
      </div>
    </div>
  )
}

function Cart() {
  const [cart, setCart] = useState<any[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetchCart()
  }, [])

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart')
      setCart(res.data)
    } catch {
      setError('Failed to fetch cart')
    }
  }

  const handleRemove = async (productId: number) => {
    try {
      await api.delete(`/cart/${productId}`)
      fetchCart()
    } catch {
      setError('Failed to remove item')
    }
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">Your Cart</h2>
      {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Product</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Quantity</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {cart.map((item: any) => (
              <tr key={item.product_id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{item.name || item.product_id}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3">
                  <button onClick={() => handleRemove(item.product_id)} className="text-red-500 hover:text-red-700">Remove</button>
                </td>
              </tr>
            ))}
            {cart.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-gray-400">Cart is empty</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
