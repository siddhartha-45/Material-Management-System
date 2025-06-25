import React, { useState, useEffect } from 'react';
import { Factory, Activity, Clock, TrendingUp, BarChart3, PieChart, LineChart, Eye, Plus, Save } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart as RechartsLineChart, Line, PieChart as RechartsPieChart, Cell, Pie } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const Production = () => {
  const [showInsights, setShowInsights] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [productionData, setProductionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const [updateForm, setUpdateForm] = useState({
    date: new Date().toISOString().split('T')[0],
    shift: 'Day',
    steel_production: '',
    molten_iron: '',
    efficiency: '',
    quality_rate: '',
    uptime_hours: '',
    downtime_hours: '',
    downtime_reason: '',
    energy_consumption: '',
    notes: ''
  });

  const [monthlyData, setMonthlyData] = useState([
    { month: 'Jan', production: 2400, target: 2500 },
    { month: 'Feb', production: 2600, target: 2500 },
    { month: 'Mar', production: 2300, target: 2500 },
    { month: 'Apr', production: 2700, target: 2500 },
    { month: 'May', production: 2500, target: 2500 },
    { month: 'Jun', production: 2800, target: 2500 },
  ]);

  const [dailyTrend, setDailyTrend] = useState([
    { day: 'Mon', efficiency: 94 },
    { day: 'Tue', efficiency: 96 },
    { day: 'Wed', efficiency: 92 },
    { day: 'Thu', efficiency: 98 },
    { day: 'Fri', efficiency: 95 },
    { day: 'Sat', efficiency: 93 },
    { day: 'Sun', efficiency: 89 },
  ]);

  const productionBreakdown = [
    { name: 'Hot Rolled Coils', value: 35, color: '#0088FE' },
    { name: 'Cold Rolled Sheets', value: 25, color: '#00C49F' },
    { name: 'Wire Rods', value: 20, color: '#FFBB28' },
    { name: 'Structural Steel', value: 15, color: '#FF8042' },
    { name: 'Others', value: 5, color: '#8884D8' },
  ];

  const [insights, setInsights] = useState([
    "Production efficiency has improved by 3.2% compared to last month",
    "Hot Rolled Coils production is 12% above target for this quarter",
    "Weekend production efficiency drops by 6% on average - consider maintenance scheduling",
    "April showed the highest production output with 2,700 tons",
    "Wire Rods production line shows consistent performance with minimal variance"
  ]);

  useEffect(() => {
    fetchProductionData();
  }, []);

  const fetchProductionData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error: fetchError } = await supabase
        .from('production')
        .select('*')
        .order('date', { ascending: false })
        .limit(30);

      if (fetchError) {
        console.error('Error fetching production data:', fetchError);
        setError('Failed to load production data. Using default data.');
        // Don't return here, let it continue with default data
      } else {
        setProductionData(data || []);
        
        // Update charts with real data if available
        if (data && data.length > 0) {
          updateChartsWithNewData(data);
          generateInsights(data);
        }
      }
    } catch (error) {
      console.error('Error fetching production data:', error);
      setError('Failed to load production data. Using default data.');
    } finally {
      setLoading(false);
    }
  };

  const updateChartsWithNewData = (data: any[]) => {
    if (data.length > 0) {
      // Update monthly data based on recent production data
      const monthlyProduction = data.reduce((acc: any, item: any) => {
        const month = new Date(item.date).toLocaleDateString('en-US', { month: 'short' });
        if (!acc[month]) {
          acc[month] = { month, production: 0, target: 2500, count: 0 };
        }
        acc[month].production += parseFloat(item.steel_production);
        acc[month].count += 1;
        return acc;
      }, {});

      const updatedMonthlyData = Object.values(monthlyProduction).map((item: any) => ({
        month: item.month,
        production: Math.round(item.production / item.count),
        target: 2500
      }));
      setMonthlyData(updatedMonthlyData.slice(0, 6));

      // Update daily trend
      const recentWeekData = data.slice(0, 7).reverse();
      const updatedDailyTrend = recentWeekData.map((item: any) => ({
        day: new Date(item.date).toLocaleDateString('en-US', { weekday: 'short' }),
        efficiency: parseFloat(item.efficiency)
      }));
      setDailyTrend(updatedDailyTrend);
    }
  };

  const generateInsights = (data: any[]) => {
    if (data.length === 0) return;

    const newInsights = [];
    
    // Calculate average efficiency
    const avgEfficiency = data.reduce((sum, item) => sum + parseFloat(item.efficiency), 0) / data.length;
    newInsights.push(`Current average production efficiency is ${avgEfficiency.toFixed(1)}%`);

    // Find best performing day
    const bestDay = data.reduce((best, current) => 
      parseFloat(current.efficiency) > parseFloat(best.efficiency) ? current : best
    );
    newInsights.push(`Best efficiency recorded: ${parseFloat(bestDay.efficiency).toFixed(1)}% on ${new Date(bestDay.date).toLocaleDateString()}`);

    // Calculate total production
    const totalProduction = data.reduce((sum, item) => sum + parseFloat(item.steel_production), 0);
    newInsights.push(`Total steel production in last ${data.length} records: ${totalProduction.toFixed(0)} tons`);

    // Quality rate analysis
    const avgQuality = data.reduce((sum, item) => sum + parseFloat(item.quality_rate), 0) / data.length;
    newInsights.push(`Average quality rate maintained at ${avgQuality.toFixed(1)}%`);

    // Downtime analysis
    const totalDowntime = data.reduce((sum, item) => sum + (parseFloat(item.downtime_hours) || 0), 0);
    newInsights.push(`Total downtime in recent operations: ${totalDowntime.toFixed(1)} hours`);

    setInsights(newInsights);
  };

  const handleUpdateProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('You must be logged in to update production data.');
      return;
    }

    try {
      setError(null);
      
      const { error: insertError } = await supabase
        .from('production')
        .insert([
          {
            date: updateForm.date,
            shift: updateForm.shift,
            steel_production: parseFloat(updateForm.steel_production),
            molten_iron: parseFloat(updateForm.molten_iron),
            efficiency: parseFloat(updateForm.efficiency),
            quality_rate: parseFloat(updateForm.quality_rate),
            uptime_hours: parseFloat(updateForm.uptime_hours),
            downtime_hours: parseFloat(updateForm.downtime_hours || '0'),
            downtime_reason: updateForm.downtime_reason || null,
            energy_consumption: updateForm.energy_consumption ? parseFloat(updateForm.energy_consumption) : null,
            notes: updateForm.notes || null,
            operator_id: user.id
          }
        ]);

      if (insertError) {
        if (insertError.code === '23505') {
          setError('Production data for this date and shift already exists.');
        } else {
          console.error('Insert error:', insertError);
          setError('Failed to save production data. Please try again.');
        }
        return;
      }

      // Refresh data and close form
      await fetchProductionData();
      setShowUpdateForm(false);
      setUpdateForm({
        date: new Date().toISOString().split('T')[0],
        shift: 'Day',
        steel_production: '',
        molten_iron: '',
        efficiency: '',
        quality_rate: '',
        uptime_hours: '',
        downtime_hours: '',
        downtime_reason: '',
        energy_consumption: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error updating production:', error);
      setError('Failed to save production data. Please try again.');
    }
  };

  const getCurrentStats = () => {
    if (productionData.length === 0) {
      return {
        dailyOutput: 2500,
        efficiency: 94.2,
        uptime: 22.1,
        qualityRate: 98.7
      };
    }

    const latest = productionData[0];
    return {
      dailyOutput: parseFloat(latest.steel_production),
      efficiency: parseFloat(latest.efficiency),
      uptime: parseFloat(latest.uptime_hours),
      qualityRate: parseFloat(latest.quality_rate)
    };
  };

  const stats = getCurrentStats();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading production data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Production Management</h1>
            <p className="text-gray-600 mt-2">Monitor and optimize steel production operations</p>
          </div>
          {user && (
            <button
              onClick={() => setShowUpdateForm(true)}
              className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 transition-colors duration-200"
            >
              <Plus className="h-4 w-4" />
              <span>Add Daily Production</span>
            </button>
          )}
        </div>

        {error && (
          <div className="mb-6 bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Update Production Modal */}
        {showUpdateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add Daily Production Details</h3>
              <form onSubmit={handleUpdateProduction} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <input
                      type="date"
                      value={updateForm.date}
                      onChange={(e) => setUpdateForm({...updateForm, date: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Shift</label>
                    <select
                      value={updateForm.shift}
                      onChange={(e) => setUpdateForm({...updateForm, shift: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    >
                      <option value="Day">Day</option>
                      <option value="Evening">Evening</option>
                      <option value="Night">Night</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Steel Production (tons)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={updateForm.steel_production}
                      onChange={(e) => setUpdateForm({...updateForm, steel_production: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="e.g., 2500.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Molten Iron (tons)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={updateForm.molten_iron}
                      onChange={(e) => setUpdateForm({...updateForm, molten_iron: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="e.g., 1800.0"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Efficiency (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={updateForm.efficiency}
                      onChange={(e) => setUpdateForm({...updateForm, efficiency: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="e.g., 94.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quality Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={updateForm.quality_rate}
                      onChange={(e) => setUpdateForm({...updateForm, quality_rate: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="e.g., 98.7"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Uptime (hours)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="24"
                      value={updateForm.uptime_hours}
                      onChange={(e) => setUpdateForm({...updateForm, uptime_hours: e.target.value})}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="e.g., 22.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Downtime (hours)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="24"
                      value={updateForm.downtime_hours}
                      onChange={(e) => setUpdateForm({...updateForm, downtime_hours: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      placeholder="e.g., 1.5"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Downtime Reason</label>
                  <input
                    type="text"
                    value={updateForm.downtime_reason}
                    onChange={(e) => setUpdateForm({...updateForm, downtime_reason: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., Scheduled maintenance, Equipment failure"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Energy Consumption (kWh)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={updateForm.energy_consumption}
                    onChange={(e) => setUpdateForm({...updateForm, energy_consumption: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="e.g., 15000.5"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={updateForm.notes}
                    onChange={(e) => setUpdateForm({...updateForm, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    placeholder="Additional notes about this production shift..."
                  />
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    type="submit"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    Save Production Data
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowUpdateForm(false)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Factory className="h-8 w-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Daily Output</p>
                <p className="text-2xl font-bold text-gray-900">{stats.dailyOutput.toFixed(1)} tons</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Efficiency</p>
                <p className="text-2xl font-bold text-gray-900">{stats.efficiency.toFixed(1)}%</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Uptime</p>
                <p className="text-2xl font-bold text-gray-900">{stats.uptime.toFixed(1)} hrs</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Quality Rate</p>
                <p className="text-2xl font-bold text-gray-900">{stats.qualityRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Production Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Monthly Production vs Target
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="production" fill="#0d9488" name="Actual Production" />
                <Bar dataKey="target" fill="#e5e7eb" name="Target" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Daily Efficiency Trend */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <LineChart className="h-5 w-5 mr-2" />
                Daily Efficiency Trend
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis domain={[85, 100]} />
                <Tooltip />
                <Line type="monotone" dataKey="efficiency" stroke="#0d9488" strokeWidth={3} />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Production Breakdown and Insights */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Production Breakdown Pie Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <PieChart className="h-5 w-5 mr-2" />
                Production Breakdown by Product
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={productionBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {productionBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Insights Panel */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900 flex items-center">
                <Eye className="h-5 w-5 mr-2" />
                Production Insights
              </h3>
              <button
                onClick={() => setShowInsights(!showInsights)}
                className="bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-md text-sm transition-colors duration-200"
              >
                {showInsights ? 'Hide Insights' : 'Show Insights'}
              </button>
            </div>
            
            {showInsights ? (
              <div className="space-y-4">
                {insights.map((insight, index) => (
                  <div key={index} className="p-4 bg-teal-50 border-l-4 border-teal-400 rounded">
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Eye className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Click "Show Insights" to view production analytics and recommendations</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Production Data Table */}
        {productionData.length > 0 && (
          <div className="mt-8 bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Production Data</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Shift
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Steel Production
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efficiency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quality Rate
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Uptime
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Notes
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {productionData.slice(0, 10).map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.shift}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseFloat(record.steel_production).toFixed(1)} tons
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseFloat(record.efficiency).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseFloat(record.quality_rate).toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {parseFloat(record.uptime_hours).toFixed(1)} hrs
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {record.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Production;