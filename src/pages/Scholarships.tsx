import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, ExternalLink, Sparkles } from "lucide-react";

type Scholarship = {
  id: string;
  titre: string;
  description: string | null;
  pays: string | null;
  domaine_etude: string | null;
  niveau_etude: string | null;
  type_bourse: string | null;
  date_limite: string | null;
  montant: number | null;
  devise: string | null;
  lien_candidature: string | null;
};

type RecommendedScholarship = Scholarship & {
  score: number;
};

export default function Scholarships() {
  const navigate = useNavigate();
  const [recommendedScholarships, setRecommendedScholarships] = useState<RecommendedScholarship[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [profileCompleted, setProfileCompleted] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Please sign in to view scholarships");
        navigate("/auth");
        return;
      }
      fetchRecommendations();
    });
  }, [navigate]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data, error } = await supabase.functions.invoke('get-recommendations', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error('Error fetching recommendations:', error);
        if (error.message?.includes('Profile not found')) {
          toast.info("Complete your profile to get AI recommendations");
          setProfileCompleted(false);
        }
        setLoading(false);
        return;
      }

      if (data?.recommendations && data.recommendations.length > 0) {
        setRecommendedScholarships(data.recommendations);
        setProfileCompleted(true);
        toast.success(`${data.recommendations.length} scholarships match your profile!`);
      } else if (data?.message) {
        // Profile is complete but no matching scholarships
        setProfileCompleted(true);
        toast.info(data.message);
      } else {
        toast.info("Complete your profile to get AI recommendations");
        setProfileCompleted(false);
      }
    } catch (error: any) {
      console.error('Error:', error);
      setProfileCompleted(false);
    } finally {
      setLoading(false);
    }
  };

  const filteredScholarships = recommendedScholarships.filter(s => {
    const matchesSearch = s.titre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
    const matchesCountry = countryFilter === "all" || s.pays === countryFilter;
    const matchesLevel = levelFilter === "all" || s.niveau_etude === levelFilter;
    return matchesSearch && matchesCountry && matchesLevel;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">Loading scholarships...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <h1 className="text-3xl md:text-4xl font-bold">AI-Matched Scholarships</h1>
            </div>
            <p className="text-muted-foreground">
              Discover scholarship opportunities personalized for your profile
            </p>
          </div>

          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search scholarships..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Countries</SelectItem>
                    <SelectItem value="USA">USA</SelectItem>
                    <SelectItem value="UK">UK</SelectItem>
                    <SelectItem value="Canada">Canada</SelectItem>
                    <SelectItem value="Germany">Germany</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={levelFilter} onValueChange={setLevelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Levels" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="undergraduate">Undergraduate</SelectItem>
                    <SelectItem value="masters">Master's</SelectItem>
                    <SelectItem value="phd">PhD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {!profileCompleted ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground mb-2">
                  Complete your profile to get personalized scholarship recommendations powered by AI
                </p>
                <Button className="mt-4" onClick={() => navigate("/profile-form")}>
                  Complete Your Profile
                </Button>
              </CardContent>
            </Card>
          ) : filteredScholarships.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  No scholarships found matching your filters. Try adjusting your search criteria.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredScholarships.map((scholarship) => (
                <Card key={scholarship.id} className="hover:shadow-lg transition-shadow border-primary border-2">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <CardTitle className="text-lg">{scholarship.titre}</CardTitle>
                      <div className="flex gap-1 flex-wrap justify-end">
                        <Badge className="bg-gradient-to-r from-primary to-accent">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {(scholarship.score * 100).toFixed(0)}% Match
                        </Badge>
                        {scholarship.type_bourse && (
                          <Badge variant="secondary">{scholarship.type_bourse}</Badge>
                        )}
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">
                      {scholarship.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      {scholarship.pays && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Country:</span>
                          <span className="font-medium">{scholarship.pays}</span>
                        </div>
                      )}
                      {scholarship.niveau_etude && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Level:</span>
                          <span className="font-medium capitalize">{scholarship.niveau_etude}</span>
                        </div>
                      )}
                      {scholarship.domaine_etude && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Field:</span>
                          <span className="font-medium">{scholarship.domaine_etude}</span>
                        </div>
                      )}
                      {scholarship.montant && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Amount:</span>
                          <span className="font-medium">
                            {scholarship.devise} {scholarship.montant.toLocaleString()}
                          </span>
                        </div>
                      )}
                      {scholarship.date_limite && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Deadline:</span>
                          <span className="font-medium">
                            {new Date(scholarship.date_limite).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                    {scholarship.lien_candidature && (
                      <Button className="w-full mt-4" asChild>
                        <a href={scholarship.lien_candidature} target="_blank" rel="noopener noreferrer">
                          Apply Now
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}