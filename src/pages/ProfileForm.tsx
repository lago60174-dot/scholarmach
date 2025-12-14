import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function ProfileForm() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    age: "",
    origin_country: "",
    target_country: "",
    field_of_study: "",
    education_level: "undergraduate" as "undergraduate" | "high_school" | "masters" | "phd" | "postdoc",
    gpa: "",
    scholarship_type: "merit" as "merit" | "full" | "partial" | "travel" | "research" | "need_based",
    finance_type: "",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        toast.error("Please sign in first");
        navigate("/auth");
        return;
      }
      setUserId(session.user.id);
      
      // Load existing profile
      supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setFormData({
              full_name: data.full_name || "",
              age: data.age?.toString() || "",
              origin_country: data.origin_country || "",
              target_country: data.target_country || "",
              field_of_study: data.field_of_study || "",
              education_level: (data.education_level || "undergraduate") as "undergraduate" | "high_school" | "masters" | "phd" | "postdoc",
              gpa: data.gpa?.toString() || "",
              scholarship_type: (data.scholarship_type || "merit") as "merit" | "full" | "partial" | "travel" | "research" | "need_based",
              finance_type: data.finance_type || "",
            });
          }
        });
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step !== 3) {
      // Prevent form submission if not on final step
      return;
    }
    if (!userId) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: formData.full_name,
          age: parseInt(formData.age),
          origin_country: formData.origin_country,
          target_country: formData.target_country,
          field_of_study: formData.field_of_study,
          education_level: formData.education_level,
          gpa: parseFloat(formData.gpa),
          scholarship_type: formData.scholarship_type,
          finance_type: formData.finance_type,
        })
        .eq("id", userId);

      if (error) throw error;

      toast.success("Profile saved! Generating AI recommendations...");
      navigate("/scholarships");
    } catch (error: any) {
      toast.error(error.message || "Error saving profile");
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Create Your Profile</h1>
            <p className="text-muted-foreground">
              Tell us about yourself to get personalized scholarship recommendations
            </p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between items-center">
              {[1, 2, 3].map((s) => (
                <div key={s} className="flex-1 flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                      step >= s
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s}
                  </div>
                  {s < 3 && (
                    <div
                      className={`flex-1 h-1 mx-2 ${
                        step > s ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>
                {step === 1 && "Personal Information"}
                {step === 2 && "Academic Background"}
                {step === 3 && "Scholarship Preferences"}
              </CardTitle>
              <CardDescription>
                Step {step} of 3
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
              //rajout de cle
              key={step}
              onSubmit={handleSubmit} className="space-y-4">
                {step === 1 && (
                  <>
                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => updateField("full_name", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="age">Age *</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => updateField("age", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="origin_country">Country of Origin *</Label>
                      <Input
                        id="origin_country"
                        value={formData.origin_country}
                        onChange={(e) => updateField("origin_country", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="target_country">Target Country *</Label>
                      <Input
                        id="target_country"
                        value={formData.target_country}
                        onChange={(e) => updateField("target_country", e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}

                {step === 2 && (
                  <>
                    <div>
                      <Label htmlFor="field_of_study">Field of Study *</Label>
                      <Input
                        id="field_of_study"
                        value={formData.field_of_study}
                        onChange={(e) => updateField("field_of_study", e.target.value)}
                        placeholder="e.g., Computer Science, Medicine"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="education_level">Education Level *</Label>
                      <Select
                        value={formData.education_level}
                        onValueChange={(v) => updateField("education_level", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="high_school">High School</SelectItem>
                          <SelectItem value="undergraduate">Undergraduate</SelectItem>
                          <SelectItem value="masters">Master's</SelectItem>
                          <SelectItem value="phd">PhD</SelectItem>
                          <SelectItem value="postdoc">Postdoc</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="gpa">GPA (0-4 scale) *</Label>
                      <Input
                        id="gpa"
                        type="number"
                        step="0.01"
                        min="0"
                        max="4"
                        value={formData.gpa}
                        onChange={(e) => updateField("gpa", e.target.value)}
                        required
                      />
                    </div>
                  </>
                )}

                {step === 3 && (
                  <>
                    <div>
                      <Label htmlFor="scholarship_type">Scholarship Type *</Label>
                      <Select
                        value={formData.scholarship_type}
                        onValueChange={(v) => updateField("scholarship_type", v)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="full">Full Scholarship</SelectItem>
                          <SelectItem value="partial">Partial Scholarship</SelectItem>
                          <SelectItem value="travel">Travel Grant</SelectItem>
                          <SelectItem value="research">Research Funding</SelectItem>
                          <SelectItem value="merit">Merit-Based</SelectItem>
                          <SelectItem value="need_based">Need-Based</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="finance_type">Financing Preference</Label>
                      <Input
                        id="finance_type"
                        value={formData.finance_type}
                        onChange={(e) => updateField("finance_type", e.target.value)}
                        placeholder="e.g., Full tuition, Living expenses"
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-4 pt-4">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                      // onClick={() => setStep((s) => s - 1)}

                      className="flex-1"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={(e) => {
                        //ou j'ai supprimer l'erreur
                        setStep(step + 1);
                      }}
                      className="flex-1"
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  ) : (
                    <Button type="submit" disabled={loading} className="flex-1">
                      {loading ? "Saving..." : "Complete Profile"}
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
