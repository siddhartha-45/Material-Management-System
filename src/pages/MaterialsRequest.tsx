import React, { useState, useEffect } from 'react';
import { ClipboardList, Plus, Search, Eye, Package, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const MaterialsRequest = () => {
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const [newRequest, setNewRequest] = useState({
    material: '',
    quantity: '',
    unit: 'tons',
    priority: 'Medium',
    required_date: '',
    notes: ''
  });

  const [trackingId, setTrackingId] = useState('');
  const [trackingResult, setTrackingResult] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchRequests();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('material_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Error fetching requests:', fetchError);
        setError('Failed to load material requests. Please check your connection.');
        // Don't return here, let it continue with empty data
      } else {
        setRequests(data || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError('Failed to load material requests. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Approved': return 'text-green-600 bg-green-100';
      case 'Pending': return 'text-yellow-600 bg-yellow-100';
      case 'In Transit': return 'text-blue-600 bg-blue-100';
      case 'Delivered': return 'text-purple-600 bg-purple-100';
      case 'Rejected': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Approved': return <CheckCircle className="h-4 w-4" />;
      case 'Pending': return <Clock className="h-4 w-4" />;
      case 'In Transit': return <Package className="h-4 w-4" />;
      case 'Delivered': return <CheckCircle className="h-4 w-4" />;
      case 'Rejected': return <XCircle className="h-4 w-4" />;
      default: return <ClipboardList className="h-4 w-4" />;
    }
  };

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to submit a request.');
      return;
    }

    try {
      setError(null);
      const requestId = `REQ${Date.now().toString().slice(-6)}`;
      const estimatedDelivery = newRequest.required_date || 
        new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { error: insertError } = await supabase
        .from('material_requests')
        .insert([
          {
            request_id: requestId,
            material: newRequest.material,
            quantity: parseInt(newRequest.quantity),
            unit: newRequest.unit,
            priority: newRequest.priority,
            status: 'Pending',
            request_date: new Date().toISOString().split('T')[0],
            required_date: newRequest.required_date || null,
            estimated_delivery: estimatedDelivery,
            notes: newRequest.notes || null,
            user_id: user.id
          }
        ]);

      if (insertError) {
        console.error('Error submitting request:', insertError);
        setError('Failed to submit request. Please try again.');
        return;
      }

      await fetchRequests();
      setNewRequest({ 
        material: '', 
        quantity: '', 
        unit: 'tons', 
        priority: 'Medium', 
        required_date: '',
        notes: '' 
      });
      setShowNewRequest(false);
    } catch (error) {
      console.error('Error submitting request:', error);
      setError('Failed to submit request. Please try again.');
    }
  };

  const handleTrackRequest = () => {
    const request = requests.find(req => req.request_id === trackingId);
    if (request) {
      setTrackingResult(request);
    } else {
      setTrackingResult({ error: 'Request not found' });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access materials request management.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Materials Request</h1>
            <p className="text-gray-600 mt-2">Manage material procurement requests</p>
          </div>
          <button
            onClick={() => setShowNewRequest(true)}
            className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
          >
            <Plus className="h-4 w-4" />
            <span>New Request</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* New Request Modal */}
        {showNewRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Material Request</h3>
              <form onSubmit={handleSubmitRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Material</label>
                  <select
                    value={newRequest.material}
                    onChange={(e) => setNewRequest({...newRequest, material: e.target.value})}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="">Select Material</option>
                    <option value="Iron Ore">Iron Ore</option>
                    <option value="Coal">Coal</option>
                    <option value="Limestone">Limestone</option>
                    <option value="Dolomite">Dolomite</option>
                    <option value="Scrap Metal">Scrap Metal</option>
                    <option value="Alloy Elements">Alloy Elements</option>
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                    <input
                      type="number"
                      value={newRequest.quantity}
                      onChange={(e) => setNewRequest({...newRequest, quantity: e.target.value})}
                      required
                      min="1"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <select
                      value={newRequest.unit}
                      onChange={(e) => setNewRequest({...newRequest, unit: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="tons">Tons</option>
                      <option value="kg">Kilograms</option>
                      <option value="pieces">Pieces</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={newRequest.priority}
                    onChange={(e) => setNewRequest({...newRequest, priority: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Required Date</label>
                  <input
                    type="date"
                    value={newRequest.required_date}
                    onChange={(e) => setNewRequest({...newRequest, required_date: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={newRequest.notes}
                    onChange={(e) => setNewRequest({...newRequest, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Additional specifications or requirements..."
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowNewRequest(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tracking Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Track Request
          </h3>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Enter Request ID (e.g., REQ123456)"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
            />
            <button
              onClick={handleTrackRequest}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-2 rounded-md transition-colors duration-200"
            >
              Track
            </button>
          </div>
          
          {trackingResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              {trackingResult.error ? (
                <p className="text-red-600">{trackingResult.error}</p>
              ) : (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Request Details</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Material:</span> {trackingResult.material}
                    </div>
                    <div>
                      <span className="font-medium">Quantity:</span> {trackingResult.quantity} {trackingResult.unit}
                    </div>
                    <div>
                      <span className="font-medium">Status:</span>
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trackingResult.status)}`}>
                        {getStatusIcon(trackingResult.status)}
                        <span className="ml-1">{trackingResult.status}</span>
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Est. Delivery:</span> {trackingResult.estimated_delivery || 'TBD'}
                    </div>
                    <div>
                      <span className="font-medium">Priority:</span> 
                      <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                        trackingResult.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                        trackingResult.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        trackingResult.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {trackingResult.priority}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Request Date:</span> {new Date(trackingResult.request_date).toLocaleDateString()}
                    </div>
                  </div>
                  {trackingResult.notes && (
                    <div className="mt-3">
                      <span className="font-medium">Notes:</span>
                      <p className="text-gray-600 mt-1">{trackingResult.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <ClipboardList className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-gray-900">{requests.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(req => req.status === 'Pending').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(req => req.status === 'Approved').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Transit</p>
                <p className="text-2xl font-bold text-gray-900">
                  {requests.filter(req => req.status === 'In Transit').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Requests Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Material Requests</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Material
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Est. Delivery
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {request.request_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.material}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.quantity} {request.unit}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        request.priority === 'Critical' ? 'bg-red-100 text-red-800' :
                        request.priority === 'High' ? 'bg-orange-100 text-orange-800' :
                        request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                        {getStatusIcon(request.status)}
                        <span className="ml-1">{request.status}</span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.request_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.estimated_delivery ? new Date(request.estimated_delivery).toLocaleDateString() : 'TBD'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {requests.length === 0 && (
            <div className="text-center py-12">
              <ClipboardList className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No material requests found. Create your first request to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MaterialsRequest;