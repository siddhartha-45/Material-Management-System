import React, { useState, useEffect } from 'react';
import { Package, TrendingUp, AlertTriangle, CheckCircle, Edit, Save, X, Plus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Inventory = () => {
  const [inventoryData, setInventoryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editForm, setEditForm] = useState({
    quantity: 0,
    status: ''
  });
  const [newItem, setNewItem] = useState({
    item_id: '',
    name: '',
    category: '',
    quantity: '',
    unit: 'tons',
    status: 'In Stock',
    min_threshold: '100',
    max_threshold: '10000',
    location: '',
    supplier: '',
    cost_per_unit: ''
  });
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Always fetch data, regardless of auth state
    fetchInventoryData();
  }, []);

  const fetchInventoryData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Inventory: Fetching inventory data...');
      
      const { data, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Inventory: Error fetching inventory data:', fetchError);
        setError(`Failed to load inventory data: ${fetchError.message}`);
        setInventoryData([]);
      } else {
        console.log('Inventory: Data fetched successfully:', data?.length, 'items');
        setInventoryData(data || []);
      }
    } catch (error) {
      console.error('Inventory: Error fetching inventory data:', error);
      setError('Failed to load inventory data. Please check your connection.');
      setInventoryData([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Stock': return 'text-green-600 bg-green-100';
      case 'Low Stock': return 'text-yellow-600 bg-yellow-100';
      case 'Critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'In Stock': return <CheckCircle className="h-4 w-4" />;
      case 'Low Stock': return <TrendingUp className="h-4 w-4" />;
      case 'Critical': return <AlertTriangle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const handleEdit = (item: any) => {
    setEditingId(item.id);
    setEditForm({
      quantity: item.quantity,
      status: item.status
    });
  };

  const handleSave = async (id: string) => {
    if (!user) {
      setError('You must be logged in to update inventory.');
      return;
    }

    try {
      setError(null);
      
      const { error: updateError } = await supabase
        .from('inventory')
        .update({
          quantity: editForm.quantity,
          status: editForm.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (updateError) {
        console.error('Inventory: Error updating inventory:', updateError);
        setError(`Failed to update inventory: ${updateError.message}`);
        return;
      }

      // Update local state
      setInventoryData(prev => 
        prev.map(item => 
          item.id === id 
            ? { ...item, quantity: editForm.quantity, status: editForm.status }
            : item
        )
      );
      
      setEditingId(null);
    } catch (error) {
      console.error('Inventory: Error updating inventory:', error);
      setError('Failed to update inventory. Please try again.');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditForm({ quantity: 0, status: '' });
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to add inventory items.');
      return;
    }

    try {
      setError(null);
      
      const { error: insertError } = await supabase
        .from('inventory')
        .insert([
          {
            item_id: newItem.item_id,
            name: newItem.name,
            category: newItem.category,
            quantity: parseInt(newItem.quantity),
            unit: newItem.unit,
            status: newItem.status,
            min_threshold: parseInt(newItem.min_threshold),
            max_threshold: parseInt(newItem.max_threshold),
            location: newItem.location || null,
            supplier: newItem.supplier || null,
            cost_per_unit: newItem.cost_per_unit ? parseFloat(newItem.cost_per_unit) : null
          }
        ]);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Item ID already exists. Please use a unique Item ID.');
        } else {
          setError(`Failed to add inventory item: ${insertError.message}`);
        }
        return;
      }

      // Refresh data and reset form
      await fetchInventoryData();
      setNewItem({
        item_id: '',
        name: '',
        category: '',
        quantity: '',
        unit: 'tons',
        status: 'In Stock',
        min_threshold: '100',
        max_threshold: '10000',
        location: '',
        supplier: '',
        cost_per_unit: ''
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Inventory: Error adding inventory item:', error);
      setError('Failed to add inventory item. Please try again.');
    }
  };

  // Show loading state while auth is loading or data is loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inventory data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-2">Track and manage steel materials and products</p>
          </div>
          {user && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Item</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Add Item Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Inventory Item</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Item ID</label>
                  <input
                    type="text"
                    value={newItem.item_id}
                    onChange={(e) => setNewItem({...newItem, item_id: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., STL001"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Select Category</option>
                    <option value="Raw Materials">Raw Materials</option>
                    <option value="Finished Products">Finished Products</option>
                    <option value="Tools & Equipment">Tools & Equipment</option>
                    <option value="Spare Parts">Spare Parts</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({...newItem, quantity: e.target.value})}
                      required
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={newItem.unit}
                      onChange={(e) => setNewItem({...newItem, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="tons">Tons</option>
                      <option value="kg">Kilograms</option>
                      <option value="pieces">Pieces</option>
                      <option value="meters">Meters</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={newItem.location}
                    onChange={(e) => setNewItem({...newItem, location: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., Warehouse A"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                  <input
                    type="text"
                    value={newItem.supplier}
                    onChange={(e) => setNewItem({...newItem, supplier: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost per Unit (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newItem.cost_per_unit}
                    onChange={(e) => setNewItem({...newItem, cost_per_unit: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    Add Item
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-2xl font-bold text-gray-900">{inventoryData.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inventoryData.filter(item => item.status === 'In Stock').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inventoryData.filter(item => item.status === 'Low Stock').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Critical</p>
                <p className="text-2xl font-bold text-gray-900">
                  {inventoryData.filter(item => item.status === 'Critical').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Inventory Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Current Inventory</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Item ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  {user && (
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryData.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {item.item_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {editingId === item.id ? (
                        <input
                          type="number"
                          value={editForm.quantity}
                          onChange={(e) => setEditForm({...editForm, quantity: parseInt(e.target.value)})}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        />
                      ) : (
                        `${item.quantity.toLocaleString()} ${item.unit}`
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingId === item.id ? (
                        <select
                          value={editForm.status}
                          onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                          className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        >
                          <option value="In Stock">In Stock</option>
                          <option value="Low Stock">Low Stock</option>
                          <option value="Critical">Critical</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                          {getStatusIcon(item.status)}
                          <span className="ml-1">{item.status}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.location || 'N/A'}
                    </td>
                    {user && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingId === item.id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSave(item.id)}
                              className="text-green-600 hover:text-green-900 flex items-center"
                            >
                              <Save className="h-4 w-4 mr-1" />
                              Save
                            </button>
                            <button
                              onClick={handleCancel}
                              className="text-red-600 hover:text-red-900 flex items-center"
                            >
                              <X className="h-4 w-4 mr-1" />
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEdit(item)}
                            className="text-teal-600 hover:text-teal-900 flex items-center"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </button>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {inventoryData.length === 0 && (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No inventory items found.</p>
              {user && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="mt-4 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
                >
                  Add First Item
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inventory;