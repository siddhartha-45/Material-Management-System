import React, { useState, useEffect } from 'react';
import { Users, Star, Phone, Mail, ShoppingCart, Package, CreditCard, Truck, Plus, Minus, Trash2, Eye, Calendar, FileText, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  specifications?: string;
  deliveryDate?: string;
}

interface ProductModalData {
  product: any;
  action: 'cart' | 'buy';
}

const VendorManagement = () => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [productModalData, setProductModalData] = useState<ProductModalData | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [showOtpVerification, setShowOtpVerification] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderTracking, setOrderTracking] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [otpProcessing, setOtpProcessing] = useState(false);
  const { user } = useAuth();

  const [productForm, setProductForm] = useState({
    quantity: 1,
    specifications: '',
    deliveryDate: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: ''
  });

  const [otpForm, setOtpForm] = useState({
    otp: '',
    generatedOtp: '',
    attempts: 0,
    maxAttempts: 3
  });

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vendor_orders')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const vendors = [
    {
      id: 1,
      name: 'Steel Supply Co.',
      category: 'Raw Materials',
      rating: 4.8,
      contact: '+91 (891) 123-4567',
      email: 'contact@steelsupply.com',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Industrial Equipment Ltd.',
      category: 'Machinery',
      rating: 4.6,
      contact: '+91 (891) 987-6543',
      email: 'sales@indequip.com',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Quality Tools Inc.',
      category: 'Tools & Equipment',
      rating: 4.9,
      contact: '+91 (891) 456-7890',
      email: 'info@qualitytools.com',
      status: 'Active'
    }
  ];

  const steelProducts = [
    { id: '1', name: 'Hot Rolled Coils', price: 45000, unit: 'per ton', description: 'High-quality hot rolled steel coils for construction' },
    { id: '2', name: 'Cold Rolled Sheets', price: 52000, unit: 'per ton', description: 'Precision cold rolled steel sheets for automotive' },
    { id: '3', name: 'Wire Rods', price: 48000, unit: 'per ton', description: 'Steel wire rods for manufacturing applications' },
    { id: '4', name: 'Structural Steel', price: 50000, unit: 'per ton', description: 'Beams, angles, and channels for construction' },
    { id: '5', name: 'Steel Plates', price: 47000, unit: 'per ton', description: 'Heavy steel plates for industrial use' },
    { id: '6', name: 'Steel Pipes', price: 55000, unit: 'per ton', description: 'Seamless and welded steel pipes' }
  ];

  const handleProductAction = (product: any, action: 'cart' | 'buy') => {
    setProductModalData({ product, action });
    setProductForm({
      quantity: 1,
      specifications: '',
      deliveryDate: ''
    });
    setShowProductModal(true);
    setError(null);
  };

  const handleProductSubmit = () => {
    if (!productModalData) return;
    
    const { product, action } = productModalData;
    
    if (productForm.quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    const cartItem: CartItem = {
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: productForm.quantity,
      unit: 'tons',
      specifications: productForm.specifications,
      deliveryDate: productForm.deliveryDate
    };

    if (action === 'cart') {
      addToCart(cartItem);
      setShowProductModal(false);
    } else {
      // Buy now - go directly to payment
      setCart([cartItem]);
      setShowProductModal(false);
      setShowPayment(true);
    }
  };

  const addToCart = (newItem: CartItem) => {
    const existingItem = cart.find(item => 
      item.id === newItem.id && 
      item.specifications === newItem.specifications &&
      item.deliveryDate === newItem.deliveryDate
    );
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === existingItem.id && 
        item.specifications === existingItem.specifications &&
        item.deliveryDate === existingItem.deliveryDate
          ? { ...item, quantity: item.quantity + newItem.quantity }
          : item
      ));
    } else {
      setCart([...cart, newItem]);
    }
  };

  const updateCartQuantity = (index: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(index);
      return;
    }
    setCart(cart.map((item, i) => 
      i === index ? { ...item, quantity } : item
    ));
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      setError('Your cart is empty');
      return;
    }
    setShowCart(false);
    setShowPayment(true);
  };

  const generateOtp = () => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
  };

  const validatePaymentForm = () => {
    if (!paymentForm.cardNumber || paymentForm.cardNumber.replace(/\s/g, '').length < 16) {
      setError('Please enter a valid 16-digit card number');
      return false;
    }
    if (!paymentForm.expiryDate || !/^\d{2}\/\d{2}$/.test(paymentForm.expiryDate)) {
      setError('Please enter expiry date in MM/YY format');
      return false;
    }
    if (!paymentForm.cvv || paymentForm.cvv.length < 3) {
      setError('Please enter a valid CVV (3-4 digits)');
      return false;
    }
    if (!paymentForm.cardholderName.trim()) {
      setError('Please enter cardholder name');
      return false;
    }
    return true;
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePaymentForm()) {
      return;
    }

    setPaymentProcessing(true);
    setError(null);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate OTP and proceed to verification
      const generatedOtp = generateOtp();
      setOtpForm({
        otp: '',
        generatedOtp,
        attempts: 0,
        maxAttempts: 3
      });
      
      setPaymentProcessing(false);
      setShowPayment(false);
      setShowOtpVerification(true);
      
      // In a real app, you would send this OTP via SMS/email
      console.log('Generated OTP for verification:', generatedOtp);
      
    } catch (error) {
      console.error('Error processing payment:', error);
      setError('Payment processing failed. Please try again.');
      setPaymentProcessing(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!otpForm.otp || otpForm.otp.length !== 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    setOtpProcessing(true);
    setError(null);

    try {
      // Simulate OTP verification delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (otpForm.otp === otpForm.generatedOtp) {
        // OTP verified successfully, create orders
        if (user) {
          for (const item of cart) {
            const orderId = `ORD${Date.now()}-${item.id}`;
            const { error } = await supabase
              .from('vendor_orders')
              .insert([
                {
                  order_id: orderId,
                  product: item.name,
                  quantity: item.quantity,
                  unit: item.unit,
                  unit_price: item.price,
                  total_amount: item.price * item.quantity,
                  specifications: item.specifications || null,
                  delivery_date: item.deliveryDate || null,
                  status: 'Processing',
                  payment_status: 'Paid',
                  user_id: user.id
                }
              ]);

            if (error) throw error;
          }

          setPaymentSuccess(true);
          const trackingInfo = {
            orderId: `ORD${Date.now()}`,
            items: cart.length,
            totalAmount: getCartTotal(),
            status: 'Processing',
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
          };
          setOrderTracking(trackingInfo);
          setCart([]); // Clear cart
          setShowOtpVerification(false);
          await fetchOrders();
        }
      } else {
        // OTP verification failed
        const newAttempts = otpForm.attempts + 1;
        if (newAttempts >= otpForm.maxAttempts) {
          setError('Maximum OTP attempts exceeded. Please restart the payment process.');
          setShowOtpVerification(false);
          setShowPayment(true);
          setOtpForm({
            otp: '',
            generatedOtp: '',
            attempts: 0,
            maxAttempts: 3
          });
        } else {
          setError(`Invalid OTP. ${otpForm.maxAttempts - newAttempts} attempts remaining.`);
          setOtpForm({
            ...otpForm,
            otp: '',
            attempts: newAttempts
          });
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('OTP verification failed. Please try again.');
    } finally {
      setOtpProcessing(false);
    }
  };

  const handleCancelPayment = () => {
    setShowPayment(false);
    setPaymentForm({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    });
    setError(null);
  };

  const handleCancelOtp = () => {
    setShowOtpVerification(false);
    setShowPayment(true);
    setOtpForm({
      otp: '',
      generatedOtp: '',
      attempts: 0,
      maxAttempts: 3
    });
    setError(null);
  };

  const resetOrder = () => {
    setShowProductModal(false);
    setShowPayment(false);
    setShowOtpVerification(false);
    setPaymentSuccess(false);
    setOrderTracking(null);
    setError(null);
    setProductModalData(null);
    setPaymentForm({
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: ''
    });
    setOtpForm({
      otp: '',
      generatedOtp: '',
      attempts: 0,
      maxAttempts: 3
    });
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access vendor management.</p>
        </div>
      </div>
    );
  }

  if (paymentSuccess && orderTracking) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
                <Truck className="h-8 w-8 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Order Confirmed!</h2>
            <p className="text-gray-600 mb-6">Your payment has been processed successfully and your order is confirmed.</p>
            
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Receipt</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Order ID:</span> {orderTracking.orderId}
                </div>
                <div>
                  <span className="font-medium">Items:</span> {orderTracking.items}
                </div>
                <div>
                  <span className="font-medium">Total Amount:</span> ₹{orderTracking.totalAmount.toLocaleString()}
                </div>
                <div>
                  <span className="font-medium">Payment Status:</span> 
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                    Paid
                  </span>
                </div>
                <div>
                  <span className="font-medium">Order Status:</span> 
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {orderTracking.status}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Estimated Delivery:</span> {orderTracking.estimatedDelivery}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="font-medium text-gray-900 mb-2">Order Items:</h4>
                <div className="space-y-2">
                  {cart.length > 0 ? cart.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>{item.name} ({item.quantity} tons)</span>
                      <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                    </div>
                  )) : (
                    <p className="text-sm text-gray-500">Order details processed</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-6">
              <p>A confirmation email has been sent to your registered email address.</p>
              <p>You can track your order status in the "Your Order History" section.</p>
            </div>
            
            <button
              onClick={resetOrder}
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-md transition-colors duration-200"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showOtpVerification) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <Shield className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">OTP Verification</h2>
              <p className="text-gray-600 mt-2">Enter the 6-digit OTP to complete your payment</p>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Sample OTP:</strong> {otpForm.generatedOtp}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  (In production, this would be sent to your mobile/email)
                </p>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter OTP
                </label>
                <input
                  type="text"
                  value={otpForm.otp}
                  onChange={(e) => setOtpForm({...otpForm, otp: e.target.value.replace(/\D/g, '')})}
                  placeholder="123456"
                  maxLength={6}
                  required
                  disabled={otpProcessing}
                  className="w-full px-3 py-3 text-center text-lg font-mono border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Attempts remaining: {otpForm.maxAttempts - otpForm.attempts}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Payment Summary</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Items:</span>
                    <span>{getCartItemCount()} items</span>
                  </div>
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount:</span>
                    <span>₹{getCartTotal().toLocaleString()}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={otpProcessing || otpForm.otp.length !== 6}
                  className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-3 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {otpProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Verifying...
                    </>
                  ) : (
                    'Verify & Place Order'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelOtp}
                  disabled={otpProcessing}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-3 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  Back to Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  if (showPayment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="text-center mb-6">
              <CreditCard className="h-12 w-12 text-teal-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Payment Gateway</h2>
              <p className="text-gray-600">Complete your order payment</p>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-2">Order Summary</h3>
              <div className="space-y-2">
                {cart.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>{item.name} ({item.quantity} tons)</span>
                    <span>₹{(item.price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>₹{getCartTotal().toLocaleString()}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            
            <form onSubmit={handlePaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={paymentForm.cardholderName}
                  onChange={(e) => setPaymentForm({...paymentForm, cardholderName: e.target.value})}
                  placeholder="John Doe"
                  required
                  disabled={paymentProcessing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Card Number</label>
                <input
                  type="text"
                  value={paymentForm.cardNumber}
                  onChange={(e) => setPaymentForm({...paymentForm, cardNumber: formatCardNumber(e.target.value)})}
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  required
                  disabled={paymentProcessing}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="text"
                    value={paymentForm.expiryDate}
                    onChange={(e) => setPaymentForm({...paymentForm, expiryDate: formatExpiryDate(e.target.value)})}
                    placeholder="MM/YY"
                    maxLength={5}
                    required
                    disabled={paymentProcessing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
                  <input
                    type="text"
                    value={paymentForm.cvv}
                    onChange={(e) => setPaymentForm({...paymentForm, cvv: e.target.value.replace(/\D/g, '')})}
                    placeholder="123"
                    maxLength={4}
                    required
                    disabled={paymentProcessing}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500 disabled:bg-gray-100"
                  />
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={paymentProcessing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-md transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {paymentProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </>
                  ) : (
                    'Pay Now'
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelPayment}
                  disabled={paymentProcessing}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
                >
                  Cancel Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
            <p className="text-gray-600 mt-2">Manage supplier relationships and order steel products</p>
          </div>
          
          {/* Cart Button */}
          <div className="flex space-x-4">
            <button
              onClick={() => setShowCart(true)}
              className="relative bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
            >
              <ShoppingCart className="h-4 w-4" />
              <span>Cart</span>
              {getCartItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {getCartItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Product Modal */}
        {showProductModal && productModalData && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {productModalData.action === 'cart' ? 'Add to Cart' : 'Buy Now'} - {productModalData.product.name}
                </h3>
                <button
                  onClick={() => setShowProductModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="font-semibold text-gray-900">{productModalData.product.name}</p>
                <p className="text-sm text-gray-600">{productModalData.product.description}</p>
                <p className="text-lg font-bold text-teal-600 mt-2">
                  ₹{productModalData.product.price.toLocaleString()} {productModalData.product.unit}
                </p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Package className="h-4 w-4 inline mr-1" />
                    Quantity (tons)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={productForm.quantity}
                    onChange={(e) => setProductForm({...productForm, quantity: parseInt(e.target.value) || 1})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <FileText className="h-4 w-4 inline mr-1" />
                    Specifications
                  </label>
                  <textarea
                    value={productForm.specifications}
                    onChange={(e) => setProductForm({...productForm, specifications: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Enter product specifications and requirements..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="h-4 w-4 inline mr-1" />
                    Preferred Delivery Date
                  </label>
                  <input
                    type="date"
                    value={productForm.deliveryDate}
                    onChange={(e) => setProductForm({...productForm, deliveryDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  />
                </div>
                
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Amount:</span>
                    <span className="font-bold text-lg text-teal-600">
                      ₹{(productModalData.product.price * productForm.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleProductSubmit}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    {productModalData.action === 'cart' ? 'Add to Cart' : 'Proceed to Payment'}
                  </button>
                  <button
                    onClick={() => setShowProductModal(false)}
                    className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 py-2 px-4 rounded-md transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Cart Modal */}
        {showCart && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Shopping Cart</h3>
                <button
                  onClick={() => setShowCart(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">Your cart is empty</p>
              ) : (
                <>
                  <div className="space-y-4 mb-6">
                    {cart.map((item, index) => (
                      <div key={index} className="border-b pb-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{item.name}</h4>
                          <button
                            onClick={() => removeFromCart(index)}
                            className="p-1 rounded-full bg-red-200 hover:bg-red-300 text-red-600"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm text-gray-600">₹{item.price.toLocaleString()} per ton</p>
                        {item.specifications && (
                          <p className="text-xs text-gray-500 mt-1">Specs: {item.specifications}</p>
                        )}
                        {item.deliveryDate && (
                          <p className="text-xs text-gray-500">Delivery: {new Date(item.deliveryDate).toLocaleDateString()}</p>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => updateCartQuantity(index, item.quantity - 1)}
                              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateCartQuantity(index, item.quantity + 1)}
                              className="p-1 rounded-full bg-gray-200 hover:bg-gray-300"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>
                          <span className="font-semibold">₹{(item.quantity * item.price).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-4">
                      <span className="font-semibold">Total:</span>
                      <span className="font-bold text-lg">₹{getCartTotal().toLocaleString()}</span>
                    </div>
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md transition-colors duration-200"
                    >
                      Checkout
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Vendors</p>
                <p className="text-2xl font-bold text-gray-900">24</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Star className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Rating</p>
                <p className="text-2xl font-bold text-gray-900">4.7</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Your Orders</p>
                <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Steel Products */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Available Steel Products</h3>
            <p className="text-sm text-gray-600">Choose products and specify your requirements</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {steelProducts.map((product) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center mb-4">
                  <Package className="h-6 w-6 text-teal-500 mr-3" />
                  <h4 className="text-lg font-semibold text-gray-900">{product.name}</h4>
                </div>
                
                <p className="text-sm text-gray-600 mb-4">{product.description}</p>
                
                <div className="mb-4">
                  <p className="text-2xl font-bold text-teal-600">₹{product.price.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">{product.unit}</p>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleProductAction(product, 'cart')}
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center text-sm"
                  >
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Add to Cart
                  </button>
                  <button
                    onClick={() => handleProductAction(product, 'buy')}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-md transition-colors duration-200 flex items-center justify-center text-sm"
                  >
                    <CreditCard className="h-4 w-4 mr-1" />
                    Buy Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order History */}
        {orders.length > 0 && (
          <div className="bg-white shadow rounded-lg mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Your Order History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Delivery Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.order_id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.product}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.quantity} tons
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{order.total_amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.delivery_date ? new Date(order.delivery_date).toLocaleDateString() : 'TBD'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vendor Directory */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Vendor Directory</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {vendors.map((vendor) => (
              <div key={vendor.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start mb-4">
                  <h4 className="text-lg font-semibold text-gray-900">{vendor.name}</h4>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {vendor.status}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3">{vendor.category}</p>
                
                <div className="flex items-center mb-3">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="ml-1 text-sm text-gray-600">{vendor.rating}/5.0</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center text-sm text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    {vendor.contact}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    {vendor.email}
                  </div>
                </div>
                
                <div className="mt-4 flex space-x-2">
                  <button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200">
                    Contact
                  </button>
                  <button className="flex-1 border border-gray-300 hover:border-gray-400 text-gray-700 text-sm py-2 px-3 rounded-md transition-colors duration-200">
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorManagement;