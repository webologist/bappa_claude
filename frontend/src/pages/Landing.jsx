import { Link } from 'react-router-dom';

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-purple-50 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center flex flex-col gap-4">
        <h1 className="text-4xl font-bold text-orange-600">🙏 Ganesh Utsav</h1>
        <p className="text-gray-600">Multi-tenant celebration management platform</p>
        <div className="bg-white rounded-lg shadow-lg p-6 flex flex-col gap-3 text-left">
          <p className="text-sm text-gray-600">
            Each celebration gets its own portal at <code className="bg-gray-100 px-1 rounded">/portal/&lt;slug&gt;</code>.
          </p>
          <Link to="/super-admin" className="bg-orange-600 text-white rounded-lg py-2 text-center font-semibold">
            Super Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
