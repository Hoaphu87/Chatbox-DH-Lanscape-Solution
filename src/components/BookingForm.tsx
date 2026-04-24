import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError } from '../lib/firebase';
import { Check } from 'lucide-react';

interface BookingFormProps {
  onSuccess: () => void;
}

export default function BookingForm({ onSuccess }: BookingFormProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    address: '',
    services: [] as string[]
  });
  const [loading, setLoading] = useState(false);

  const servicesList = [
    'Regular Maintenance',
    'Lawn Mowing',
    'Cleanup',
    'Tree/Shrub Care',
    'Soil & Installation',
    'Bark Mulch'
  ];

  const handleServiceChange = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.phone || !formData.address) return;

    setLoading(true);
    try {
      await addDoc(collection(db, 'leads'), {
        ...formData,
        createdAt: serverTimestamp()
      });
      onSuccess();
    } catch (error) {
      handleFirestoreError(error, 'create', 'leads');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded-xl border border-stone-200 mt-2 shadow-sm space-y-3">
      <div className="space-y-2">
        <input
          required
          type="text"
          placeholder="Full Name"
          value={formData.fullName}
          onChange={e => setFormData({ ...formData, fullName: e.target.value })}
          className="w-full p-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#2d5a27]"
        />
        <input
          required
          type="tel"
          placeholder="Phone Number"
          value={formData.phone}
          onChange={e => setFormData({ ...formData, phone: e.target.value })}
          className="w-full p-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#2d5a27]"
        />
        <input
          type="email"
          placeholder="Email Address"
          value={formData.email}
          onChange={e => setFormData({ ...formData, email: e.target.value })}
          className="w-full p-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#2d5a27]"
        />
        <input
          required
          type="text"
          placeholder="Service Address"
          value={formData.address}
          onChange={e => setFormData({ ...formData, address: e.target.value })}
          className="w-full p-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#2d5a27]"
        />
      </div>

      <div className="grid grid-cols-2 gap-2 mt-3">
        {servicesList.map(service => (
          <label key={service} className="flex items-center gap-2 text-[11px] text-stone-600 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.services.includes(service)}
              onChange={() => handleServiceChange(service)}
              className="w-3 h-3 accent-[#2d5a27]"
            />
            {service}
          </label>
        ))}
      </div>

      <button
        disabled={loading}
        type="submit"
        className="w-full mt-2 bg-[#2d5a27] text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-[#1e3d1a] transition-colors disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit Request'}
      </button>
    </form>
  );
}
