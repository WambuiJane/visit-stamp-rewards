
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LogOut, Star, Users, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BusinessDashboardProps {
  user: any;
  onSignOut: () => void;
}

const BusinessDashboard = ({ user, onSignOut }: BusinessDashboardProps) => {
  const { data: business } = useQuery({
    queryKey: ['business', user.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('businesses')
        .select('*')
        .eq('user_id', user.id)
        .single();
      return data;
    },
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews', business?.id],
    queryFn: async () => {
      if (!business?.id) return [];
      const { data } = await supabase
        .from('reviews')
        .select(`
          *,
          customers (
            name,
            phone
          )
        `)
        .eq('business_id', business.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!business?.id,
  });

  const { data: stats } = useQuery({
    queryKey: ['business-stats', business?.id],
    queryFn: async () => {
      if (!business?.id) return { totalVisits: 0, totalCustomers: 0, totalRewards: 0 };
      
      const [visitsData, customersData, rewardsData] = await Promise.all([
        supabase.from('visits').select('id').eq('business_id', business.id),
        supabase.from('visits').select('customer_id').eq('business_id', business.id),
        supabase.from('rewards').select('id').eq('business_id', business.id)
      ]);

      const uniqueCustomers = new Set(customersData.data?.map(v => v.customer_id) || []).size;

      return {
        totalVisits: visitsData.data?.length || 0,
        totalCustomers: uniqueCustomers,
        totalRewards: rewardsData.data?.length || 0,
      };
    },
    enabled: !!business?.id,
  });

  const averageRating = reviews?.length ? 
    (reviews.reduce((sum, review) => sum + (review.rating || 0), 0) / reviews.length).toFixed(1) : 
    '0.0';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {business?.business_name || 'Your Business'}
              </h1>
              <p className="text-gray-600">{business?.business_type}</p>
            </div>
            <Button variant="outline" onClick={onSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalVisits || 0}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalCustomers || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rewards Earned</CardTitle>
              <Badge className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRewards || 0}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{averageRating}⭐</div>
            </CardContent>
          </Card>
        </div>

        {/* Reviews Section */}
        <Card>
          <CardHeader>
            <CardTitle>Customer Reviews</CardTitle>
            <CardDescription>
              See what your customers are saying about your business
            </CardDescription>
          </CardHeader>
          <CardContent>
            {reviews?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Star className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg">No reviews yet</p>
                <p className="text-sm">Encourage your customers to leave reviews!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews?.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">
                          {review.customers?.name || 'Anonymous Customer'}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {review.customers?.phone}
                        </p>
                      </div>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < (review.rating || 0)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    {review.comment && (
                      <p className="text-gray-700 mb-2">{review.comment}</p>
                    )}
                    <p className="text-xs text-gray-500">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default BusinessDashboard;
