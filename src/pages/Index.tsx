
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Store } from "lucide-react";
import BusinessAuth from "@/components/BusinessAuth";
import CustomerAuth from "@/components/CustomerAuth";
import BusinessDashboard from "@/components/BusinessDashboard";
import CustomerDashboard from "@/components/CustomerDashboard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const Index = () => {
  const [userType, setUserType] = useState<'business' | 'customer' | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      return data.session;
    },
  });

  // Auto-detect if user is already logged in
  if (session && !isAuthenticated) {
    setIsAuthenticated(true);
    setCurrentUser(session.user);
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setUserType(null);
  };

  if (isAuthenticated && userType === 'business') {
    return <BusinessDashboard user={currentUser} onSignOut={handleSignOut} />;
  }

  if (isAuthenticated && userType === 'customer') {
    return <CustomerDashboard user={currentUser} onSignOut={handleSignOut} />;
  }

  if (userType === 'business') {
    return <BusinessAuth onSuccess={() => setIsAuthenticated(true)} onBack={() => setUserType(null)} />;
  }

  if (userType === 'customer') {
    return <CustomerAuth onSuccess={() => setIsAuthenticated(true)} onBack={() => setUserType(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="mx-auto w-20 h-20 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-3xl">🎯</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Stamp It</h1>
            <p className="text-gray-600">Digital loyalty rewards made simple</p>
          </div>
        </div>

        {/* User Type Selection */}
        <div className="space-y-4">
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-orange-300"
            onClick={() => setUserType('business')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-3">
                <Store className="w-6 h-6 text-blue-600" />
              </div>
              <CardTitle className="text-xl">Business Owner</CardTitle>
              <CardDescription>
                Manage your loyalty program and view customer reviews
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Sign In as Business
              </Button>
            </CardContent>
          </Card>

          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:scale-105 border-2 hover:border-green-300"
            onClick={() => setUserType('customer')}
          >
            <CardHeader className="text-center pb-4">
              <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <CardTitle className="text-xl">Customer</CardTitle>
              <CardDescription>
                View and review your favorite local businesses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Continue as Customer
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Helping local businesses build lasting relationships</p>
        </div>
      </div>
    </div>
  );
};

export default Index;
