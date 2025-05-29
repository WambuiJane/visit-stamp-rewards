
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { LogOut, Star, MapPin, Search, Plus } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } = from "@/hooks/use-toast";

interface CustomerDashboardProps {
  user: any;
  onSignOut: () => void;
}

const CustomerDashboard = ({ user, onSignOut }: CustomerDashboardProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBusiness, setSelectedBusiness] = useState<any>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: businesses } = useQuery({
    queryKey: ['businesses', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('businesses')
        .select('*')
        .order('business_name');
      
      if (searchTerm) {
        query = query.ilike('business_name', `%${searchTerm}%`);
      }
      
      const { data } = await query;
      return data || [];
    },
  });

  const { data: myReviews } = useQuery({
    queryKey: ['my-reviews'],
    queryFn: async () => {
      // Get customer by phone (simplified for demo)
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', user?.phone || '')
        .single();
      
      if (!customer) return [];
      
      const { data } = await supabase
        .from('reviews')
        .select(`
          *,
          businesses (
            business_name,
            business_type
          )
        `)
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false });
      
      return data || [];
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (reviewData: { businessId: string; rating: number; comment: string }) => {
      // Get customer by phone (simplified for demo)
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', user?.phone || '')
        .single();
      
      if (!customer) throw new Error('Customer not found');
      
      const { error } = await supabase
        .from('reviews')
        .insert({
          business_id: reviewData.businessId,
          customer_id: customer.id,
          rating: reviewData.rating,
          comment: reviewData.comment,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });
      setIsReviewDialogOpen(false);
      setComment("");
      setRating(5);
      queryClient.invalidateQueries({ queryKey: ['my-reviews'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedBusiness) {
      submitReviewMutation.mutate({
        businessId: selectedBusiness.id,
        rating,
        comment,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Your Reviews</h1>
              <p className="text-gray-600">Discover and review local businesses</p>
            </div>
            <Button variant="outline" onClick={onSignOut}>
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Add Review */}
        <div className="mb-8">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Business List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {businesses?.map((business) => (
              <Card key={business.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{business.business_name}</CardTitle>
                      <CardDescription>{business.business_type}</CardDescription>
                    </div>
                  </div>
                  {business.address && (
                    <div className="flex items-center text-sm text-gray-600 mt-2">
                      <MapPin className="w-4 h-4 mr-1" />
                      {business.address}
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
                    <DialogTrigger asChild>
                      <Button 
                        className="w-full" 
                        onClick={() => setSelectedBusiness(business)}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Write Review
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Review {selectedBusiness?.business_name}</DialogTitle>
                        <DialogDescription>
                          Share your experience with other customers
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSubmitReview} className="space-y-4">
                        <div className="space-y-2">
                          <Label>Rating</Label>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((value) => (
                              <button
                                key={value}
                                type="button"
                                onClick={() => setRating(value)}
                                className="p-1"
                              >
                                <Star
                                  className={`w-6 h-6 ${
                                    value <= rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="comment">Comment (Optional)</Label>
                          <Textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Tell others about your experience..."
                            rows={3}
                          />
                        </div>
                        <Button 
                          type="submit" 
                          className="w-full"
                          disabled={submitReviewMutation.isPending}
                        >
                          {submitReviewMutation.isPending ? "Submitting..." : "Submit Review"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* My Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>My Reviews</CardTitle>
            <CardDescription>Your recent reviews and feedback</CardDescription>
          </CardHeader>
          <CardContent>
            {myReviews?.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Star className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg">No reviews yet</p>
                <p className="text-sm">Start reviewing your favorite local businesses!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myReviews?.map((review) => (
                  <div key={review.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{review.businesses?.business_name}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {review.businesses?.business_type}
                        </Badge>
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

export default CustomerDashboard;
