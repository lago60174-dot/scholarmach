import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GraduationCap,
  Brain,
  Users,
  Globe,
  Award,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import heroBackground from "@/assets/hero-background.jpg";

export default function Index() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    scholarships: 0,
    users: 0,
    success: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [scholarshipsRes, profilesRes, testimonialsRes] = await Promise.all([
        supabase.from("bourse").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("temoignages").select("id", { count: "exact", head: true }),
      ]);

      setStats({
        scholarships: scholarshipsRes.count || 250,
        users: profilesRes.count || 1200,
        success: testimonialsRes.count || 340,
      });
    };

    fetchStats();
  }, []);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Matching",
      description: "Our intelligent system analyzes your profile to find the perfect scholarship opportunities.",
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Access scholarships from universities and organizations worldwide.",
    },
    {
      icon: Award,
      title: "Verified Opportunities",
      description: "All scholarships are verified and updated regularly by our team.",
    },
    {
      icon: TrendingUp,
      title: "Track Progress",
      description: "Monitor your applications and get deadline reminders.",
    },
  ];

  const steps = [
    {
      number: "01",
      title: "Create Your Profile",
      description: "Tell us about your academic background, interests, and goals.",
    },
    {
      number: "02",
      title: "Get AI Recommendations",
      description: "Our AI analyzes thousands of scholarships to find your perfect matches.",
    },
    {
      number: "03",
      title: "Apply & Succeed",
      description: "Access application links and track your progress all in one place.",
    },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url(${heroBackground})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/50 to-black/60" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/30 mb-6">
              <Sparkles className="h-4 w-4 text-white" />
              <span className="text-sm font-medium text-white">AI-Powered Scholarship Discovery</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              Find Your Perfect
              <span className="block bg-gradient-to-r from-yellow-300 via-orange-300 to-pink-300 bg-clip-text text-transparent">
                Scholarship Match
              </span>
            </h1>
            
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Let our AI analyze your profile and discover scholarship opportunities tailored specifically for you.
              Your education dreams are just a click away.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                size="lg"
                className="text-lg px-8 shadow-lg hover:shadow-xl transition-all"
                onClick={() => navigate("/profile-form")}
              >
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8"
                onClick={() => navigate("/scholarships")}
              >
                Explore Scholarships
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-3xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-yellow-300 mb-2">
                  {stats.scholarships}+
                </div>
                <div className="text-sm text-white/80">Scholarships</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-300 mb-2">
                  {stats.users}+
                </div>
                <div className="text-sm text-white/80">Students</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-orange-300 mb-2">
                  {stats.success}+
                </div>
                <div className="text-sm text-white/80">Success Stories</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Scholarmach?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              We combine cutting-edge AI technology with a comprehensive scholarship database
              to help you achieve your educational goals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card
                key={index}
                className="border-2 hover:border-primary/50 transition-all hover:shadow-lg animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="pt-6">
                  <div className="bg-gradient-to-br from-primary to-primary-glow p-3 rounded-lg w-fit mb-4">
                    <feature.icon className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Three simple steps to finding your perfect scholarship match
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <div
                key={index}
                className="relative animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold text-xl mb-6">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent -translate-x-1/2" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Button size="lg" onClick={() => navigate("/profile-form")}>
              Start Your Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Success Stories Preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Success Stories</h2>
            <p className="text-lg text-muted-foreground">Real students, real success with our AI-powered platform</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    S
                  </div>
                  <div>
                    <h3 className="font-semibold">Sarah M.</h3>
                    <p className="text-sm text-muted-foreground">USA → UK</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-3">
                  "Found my dream scholarship to Oxford in just 2 weeks! The AI matching was incredibly accurate."
                </p>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">$50,000</span>
                  <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary font-medium">Master's</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    J
                  </div>
                  <div>
                    <h3 className="font-semibold">James K.</h3>
                    <p className="text-sm text-muted-foreground">Kenya → Canada</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-3">
                  "The platform connected me with opportunities I never knew existed. Life-changing experience!"
                </p>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">Full Funding</span>
                  <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary font-medium">PhD</span>
                </div>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                    M
                  </div>
                  <div>
                    <h3 className="font-semibold">Maria L.</h3>
                    <p className="text-sm text-muted-foreground">Brazil → Germany</p>
                  </div>
                </div>
                <p className="text-muted-foreground mb-3">
                  "Got 3 scholarship offers in my first month! The AI recommendations were spot-on for my profile."
                </p>
                <div className="flex items-center gap-2 text-sm flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-medium">€30,000</span>
                  <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary font-medium">Bachelor's</span>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Button size="lg" variant="outline" onClick={() => navigate("/testimonials")}>
              Share Your Story
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-muted-foreground">Everything you need to know about finding scholarships</p>
          </div>
          <div className="space-y-6">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">How does the AI matching work?</h3>
                <p className="text-muted-foreground">
                  Our AI analyzes your profile including your academic background, country preferences, field of study, 
                  and financial needs. It then matches you with scholarships that best fit your unique profile using 
                  advanced machine learning algorithms.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Is the platform really free?</h3>
                <p className="text-muted-foreground">
                  Yes! Our platform is completely free for students. We believe financial barriers shouldn't prevent 
                  anyone from accessing scholarship opportunities. We may feature affiliate products to support our operations.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">How often are new scholarships added?</h3>
                <p className="text-muted-foreground">
                  We continuously update our database with new scholarship opportunities. Our system checks multiple sources 
                  daily to ensure you have access to the latest opportunities worldwide.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Can I apply directly through the platform?</h3>
                <p className="text-muted-foreground">
                  We provide direct links to official application portals. You'll find all the information you need 
                  including deadlines, requirements, and application links for each scholarship.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Our Mission</h2>
          </div>
          
          <Card className="border-2 border-primary/20">
            <CardContent className="p-8 md:p-12">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <p className="text-lg text-muted-foreground mb-6">
                    At Scholarmach, we believe that financial barriers should never stand in the way of education.
                    Our mission is to democratize access to scholarships by leveraging artificial intelligence
                    to connect students with opportunities that match their unique profiles.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                      <span>Personalized AI-driven recommendations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                      <span>Comprehensive global scholarship database</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-secondary shrink-0 mt-0.5" />
                      <span>Free and accessible to all students</span>
                    </li>
                  </ul>
                </div>
                <div className="relative">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 rounded-2xl flex items-center justify-center">
                    <GraduationCap className="h-32 w-32 text-primary/40" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary via-accent to-secondary">
        <div className="max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Find Your Scholarship?
          </h2>
          <p className="text-lg mb-8 opacity-90">
            Join thousands of students who have already found their perfect scholarship match.
          </p>
          <Button
            size="lg"
            variant="secondary"
            className="text-lg px-8"
            onClick={() => navigate("/profile-form")}
          >
            Create Your Profile Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}