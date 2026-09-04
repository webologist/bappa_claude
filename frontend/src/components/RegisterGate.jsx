import { useState } from 'react';
import { apiClient, errorMessage } from '../api/client';

const SEX_OPTIONS = [
  { value: '', label: 'Prefer not to say' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' }
];

function saveSession(tenantSlug, token, user) {
  try {
    localStorage.setItem(`endUser_${tenantSlug}`, JSON.stringify({ token, user }));
  } catch { /* ignore */ }
}

// Phone -> OTP -> (registration form, only for first-time numbers) -> session.
// Required once before donating or sharing a photo.
export default function RegisterGate({ tenantSlug, onSuccess }) {
  const [step, setStep] = useState('phone'); // phone | otp | register
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [sex, setSex] = useState('');
  const [age, setAge] = useState('');
  const [reference, setReference] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function requestOtp(e) {
    e?.preventDefault();
    if (!/^[0-9]{7,15}$/.test(phone)) return setError('Enter a valid phone number');
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.post(`/portal/${tenantSlug}/auth/otp/request`, { phone });
      setDevCode(data.devCode || '');
      setCode('');
      setStep('otp');
    } catch (err) {
      setError(errorMessage(err));
    }
    setLoading(false);
  }

  async function verifyOtp(e) {
    e.preventDefault();
    if (code.length !== 6) return setError('Enter the 6-digit code');
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.post(`/portal/${tenantSlug}/auth/otp/verify`, { phone, code });
      if (data.status === 'existing') {
        saveSession(tenantSlug, data.token, data.user);
        onSuccess({ token: data.token, user: data.user });
      } else {
        setStep('register');
      }
    } catch (err) {
      setError(errorMessage(err));
    }
    setLoading(false);
  }

  async function completeRegistration(e) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim()) return setError('First name and last name are required');
    setLoading(true);
    setError('');
    try {
      const { data } = await apiClient.post(`/portal/${tenantSlug}/auth/register`, {
        phone, firstName, lastName, address, sex, age: age ? Number(age) : undefined, reference
      });
      saveSession(tenantSlug, data.token, data.user);
      onSuccess({ token: data.token, user: data.user });
    } catch (err) {
      setError(errorMessage(err));
    }
    setLoading(false);
  }

  const inputClass = 'bg-spotify-dark3 text-spotify-text placeholder-spotify-gray rounded-xl px-3.5 py-2.5 text-sm outline-none w-full';

  return (
    <div className="bg-spotify-dark2 rounded-lg p-4 flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-bold text-spotify-text">Verify your mobile number</h2>
        <p className="text-xs text-spotify-gray mt-0.5">Required once, to donate or share photos.</p>
      </div>

      {step === 'phone' && (
        <form onSubmit={requestOtp} className="flex flex-col gap-2.5">
          <input
            className={inputClass}
            placeholder="Mobile number"
            inputMode="numeric"
            maxLength={15}
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={loading} className="bg-spotify-green text-black rounded-full py-3 font-bold disabled:opacity-50 active:scale-[0.99] transition">
            {loading ? 'Sending…' : 'Send OTP'}
          </button>
        </form>
      )}

      {step === 'otp' && (
        <form onSubmit={verifyOtp} className="flex flex-col gap-2.5">
          <p className="text-xs text-spotify-gray">
            Code sent to {phone}. <button type="button" onClick={() => setStep('phone')} className="underline">Change number</button>
          </p>
          {devCode && <p className="text-xs text-spotify-green">Dev mode (no SMS provider configured) — your code is {devCode}</p>}
          <input
            className={`${inputClass} tracking-[0.4em] text-center`}
            placeholder="000000"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ''))}
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={loading} className="bg-spotify-green text-black rounded-full py-3 font-bold disabled:opacity-50 active:scale-[0.99] transition">
            {loading ? 'Verifying…' : 'Verify'}
          </button>
          <button type="button" onClick={requestOtp} disabled={loading} className="text-xs text-spotify-gray underline self-center">
            Resend code
          </button>
        </form>
      )}

      {step === 'register' && (
        <form onSubmit={completeRegistration} className="flex flex-col gap-2.5">
          <div className="grid grid-cols-2 gap-2">
            <input className={inputClass} placeholder="First name*" maxLength={50} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <input className={inputClass} placeholder="Last name*" maxLength={50} value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>
          <input className={inputClass} placeholder="Address (optional)" maxLength={200} value={address} onChange={(e) => setAddress(e.target.value)} />
          <div className="grid grid-cols-2 gap-2">
            <select className={inputClass} value={sex} onChange={(e) => setSex(e.target.value)}>
              {SEX_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <input className={inputClass} placeholder="Age (optional)" type="number" min="1" max="120" value={age} onChange={(e) => setAge(e.target.value)} />
          </div>
          <input className={inputClass} placeholder="Reference (optional)" maxLength={100} value={reference} onChange={(e) => setReference(e.target.value)} />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button disabled={loading} className="bg-spotify-green text-black rounded-full py-3 font-bold disabled:opacity-50 active:scale-[0.99] transition">
            {loading ? 'Saving…' : 'Complete registration'}
          </button>
        </form>
      )}
    </div>
  );
}
